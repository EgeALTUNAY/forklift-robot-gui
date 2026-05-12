import asyncio
import time
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from app.core.container import robot_client
from app.schemas.manual_command import ManualCommandFrame, ManualCommandAck
from app.schemas.control import ManualControlCommand

manual_ws_router = APIRouter()

# Safe limits for clamping
MAX_VX = 0.5
MAX_OMEGA = 0.8
MAX_LIFT = 0.3

# Watchdog timeout (ms)
WATCHDOG_TIMEOUT_MS = 500

# Global state to track the active manual control session
active_session_id: Optional[str] = None

async def send_safety_stop():
    """Helper to send zero velocity command to the robot regardless of state."""
    try:
        await robot_client.send_manual_command(
            ManualControlCommand(vx=0, omega=0, lift=0)
        )
    except Exception as e:
        print(f"Safety stop failed: {e}")

class ManualControlSession:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.last_command_time = time.time()
        self.is_active = True

    async def watchdog_task(self):
        """Monitor command frequency and send zero command on timeout."""
        try:
            while self.is_active:
                elapsed_ms = (time.time() - self.last_command_time) * 1000
                if elapsed_ms > WATCHDOG_TIMEOUT_MS:
                    await send_safety_stop()
                
                await asyncio.sleep(0.1) # Check every 100ms
        except asyncio.CancelledError:
            pass


@manual_ws_router.websocket("/ws/manual-control")
async def manual_control_websocket(websocket: WebSocket):
    global active_session_id
    
    await websocket.accept()
    session_id = str(id(websocket))
    
    if active_session_id is not None:
        print(f"Rejecting manual control session {session_id}. Session {active_session_id} is already active.")
        await websocket.send_json({
            "accepted": False,
            "reason": "Başka bir manuel kontrol oturumu zaten aktif.",
            "seq": 0,
            "timestamp": datetime.utcnow().isoformat()
        })
        await websocket.close()
        return

    active_session_id = session_id
    print(f"Manual control session {session_id} started.")
    
    session = ManualControlSession(websocket)
    watchdog = asyncio.create_task(session.watchdog_task())

    try:
        while True:
            try:
                # Receive data from frontend
                data = await websocket.receive_json()
                frame = ManualCommandFrame(**data)
                
                # Update watchdog
                session.last_command_time = time.time()

                # 1. Fetch current status for validation
                status = await robot_client.get_manual_control_status()
                state = await robot_client.get_robot_state()

                # 2. Safety Checks
                reason = None
                accepted = True

                if state.emergency_stop:
                    accepted = False
                    reason = "Acil stop aktif. Manuel kontrol yapılamaz."
                elif status.physical_switch_position != "MANUAL":
                    accepted = False
                    reason = "Fiziksel anahtar MANUEL konumda değil."
                elif not status.remote_control_enabled:
                    accepted = False
                    reason = "Uzaktan kontrol yetkisi yok (remote_control_enabled=false)."
                elif status.remote_control_state != "ACTIVE":
                    accepted = False
                    reason = f"Uzaktan kontrol aktif değil (state={status.remote_control_state})."
                elif not frame.deadman_pressed:
                    accepted = False
                    reason = "Deadman butonu basılı değil."
                
                # 3. Process Command
                if accepted:
                    # Values are already from frame, but we clamp them here for absolute safety
                    vx = max(-MAX_VX, min(MAX_VX, frame.vx))
                    omega = max(-MAX_OMEGA, min(MAX_OMEGA, frame.omega))
                    lift = max(-MAX_LIFT, min(MAX_LIFT, frame.lift))

                    # Send to robot backend
                    cmd = ManualControlCommand(vx=vx, omega=omega, lift=lift)
                    success = await robot_client.send_manual_command(cmd)
                    
                    if not success:
                        accepted = False
                        reason = "Robot backend komutu reddetti."
                else:
                    # Even if rejected, we send a zero command to be safe if deadman was released
                    if reason == "Deadman butonu basılı değil":
                        await send_safety_stop()

                # 4. Send Ack
                ack = ManualCommandAck(
                    accepted=accepted,
                    reason=reason,
                    seq=frame.seq,
                    timestamp=datetime.utcnow()
                )
                await websocket.send_json(ack.model_dump(mode="json"))

            except ValidationError as e:
                await websocket.send_json({
                    "accepted": False,
                    "reason": "Geçersiz veri formatı.",
                    "seq": 0,
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                print(f"Error in manual WS loop: {e}")
                break

    except WebSocketDisconnect:
        print(f"Manual control session {session_id} disconnected.")
    finally:
        session.is_active = False
        watchdog.cancel()
        active_session_id = None
        
        # Safety: Send zero command on disconnect
        print("Sending safety zero command on disconnect...")
        await send_safety_stop()

