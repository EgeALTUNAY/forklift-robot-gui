from datetime import datetime
from fastapi import FastAPI, Body

app = FastAPI(title="Mock Robot Backend")

# In-memory state for dev/test
state = {
    "manual_enabled": False,
    "emergency_stop": False,
    "current_node_id": "D2",
    "gate_status": "IDLE",
    "battery": 88.5,
    "speed": 0.0,
    "last_manual_command": None,
}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/state")
async def get_state():
    mode = "IDLE"
    if state["emergency_stop"]:
        mode = "EMERGENCY_STOP"
    elif state["manual_enabled"]:
        mode = "IDLE" # Following FakeRobotBackend behavior
    
    return {
        "mode": mode,
        "battery_percent": state["battery"],
        "speed_mps": state["speed"],
        "load_detected": False,
        "emergency_stop": state["emergency_stop"],
        "connection_ok": True,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/task/status")
async def get_task_status():
    if state["emergency_stop"]:
        return {
            "task_id": "TASK-101",
            "phase": "ERROR",
            "pickup_point_id": "A2",
            "dropoff_point_id": "B3",
            "active_route_id": "R_A2_B3",
            "progress_percent": 32,
            "elapsed_seconds": 145,
            "remaining_seconds": None,
            "description": "Acil stop nedeniyle görev durduruldu.",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    if state["manual_enabled"]:
        return {
            "task_id": None,
            "phase": "NO_TASK",
            "pickup_point_id": None,
            "dropoff_point_id": None,
            "active_route_id": None,
            "progress_percent": 0,
            "elapsed_seconds": 0,
            "remaining_seconds": None,
            "description": "Robot manuel test modunda. Aktif otonom görev yok.",
            "timestamp": datetime.utcnow().isoformat()
        }

    return {
        "task_id": "TASK-101",
        "phase": "WAITING_FACTORY_COMMAND",
        "pickup_point_id": "A2",
        "dropoff_point_id": "B3",
        "active_route_id": "R_A2_B3",
        "progress_percent": 46,
        "elapsed_seconds": 180,
        "remaining_seconds": 210,
        "description": "Robot kontrollü kapı bölgesine yaklaşıyor.",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/map/runtime")
async def get_map_runtime():
    return {
        "active_segment_ids": ["START_D1", "D1_D2", "D2_D3"],
        "completed_segment_ids": ["START_D1", "D1_D2"],
        "pickup_point_id": "A2",
        "dropoff_point_id": "B3",
        "expected_qr_id": "q4",
        "last_read_qr_id": "q3",
        "read_qr_ids": ["q1", "q2", "q3"],
        "current_node_id": state["current_node_id"],
        "gate_status": state["gate_status"]
    }

@app.get("/qr/events")
async def get_qr_events(limit: int = 10):
    return [
        {"qr_id": f"q{i}", "raw_data": f"MOCK_QR_{i}", "station_id": "A2", "timestamp": datetime.utcnow().isoformat()}
        for i in range(min(limit, 3))
    ]

@app.get("/plc/logs")
async def get_plc_logs(limit: int = 10):
    return [
        {"level": "INFO", "message": f"PLC Log {i}: Heartbeat OK", "source": "PLC", "timestamp": datetime.utcnow().isoformat()}
        for i in range(min(limit, 5))
    ]

@app.get("/plc/status")
async def get_plc_status():
    return {
        "connected": True,
        "cpu_status": "RUN",
        "last_heartbeat": datetime.utcnow().isoformat(),
        "error_count": 0
    }

@app.get("/plc/messages")
async def get_plc_messages(limit: int = 20):
    if state["emergency_stop"]:
        return [
            {
                "id": "MSG-ESTOP",
                "direction": "PLC_TO_ROBOT",
                "message_type": "ERROR",
                "title": "ACİL STOP AKTİF - GÜVENLİK KESİNTİSİ",
                "timestamp": datetime.utcnow().isoformat(),
                "success": False,
                "payload": '{"error": "ESTOP_TRIGGERED"}'
            }
        ]
    return [
        {
            "id": "MSG-001",
            "direction": "ROBOT_TO_PLC",
            "message_type": "DOOR_PERMISSION_REQUEST",
            "title": "Kapı İzni İstendi (GATE_1)",
            "timestamp": datetime.utcnow().isoformat(),
            "success": True,
            "payload": '{"gate_id": "GATE_1", "robot_id": "R1"}'
        },
        {
            "id": "MSG-002",
            "direction": "PLC_TO_ROBOT",
            "message_type": "DOOR_PERMISSION_RESPONSE",
            "title": "Kapı İzni Verildi",
            "timestamp": datetime.utcnow().isoformat(),
            "success": True,
            "payload": '{"access": "granted", "timer": 30}'
        },
        {
            "id": "MSG-003",
            "direction": "PLC_TO_ROBOT",
            "message_type": "ERROR",
            "title": "Haberleşme Kesildi",
            "timestamp": datetime.utcnow().isoformat(),
            "success": False,
            "payload": '{"error_code": "COMM_TIMEOUT"}'
        }
    ][:limit]




@app.get("/alerts")
async def get_alerts(limit: int = 20):
    alerts = []
    if state["emergency_stop"]:
        alerts.append({
            "id": "ALERT-ESTOP",
            "severity": "CRITICAL",
            "source": "SAFETY",
            "title": "Acil Stop Aktif",
            "message": "Robot acil stop durumunda.",
            "timestamp": datetime.utcnow().isoformat(),
            "acknowledged": False
        })
    if state["manual_enabled"]:
        alerts.append({
            "id": "ALERT-MANUAL",
            "severity": "WARNING",
            "source": "CONTROL",
            "title": "Manuel Kontrol Aktif",
            "message": "Robot şu an GUI üzerinden kontrol ediliyor.",
            "timestamp": datetime.utcnow().isoformat(),
            "acknowledged": False
        })
    return alerts[:limit]

@app.get("/manual/status")
async def get_manual_status():
    return {
        "physical_switch_position": "MANUAL" if state["manual_enabled"] else "AUTO",
        "remote_control_state": "ACTIVE" if state["manual_enabled"] else "LOCKED",
        "remote_control_enabled": state["manual_enabled"],
        "input_source": "GUI_TEST" if state["manual_enabled"] else "NONE",
        "last_command": state["last_manual_command"],
        "message": "Mock Robot Backend manuel durum bilgisi.",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/manual/enable")
async def enable_manual():
    if state["emergency_stop"]:
        return {"success": False}
    state["manual_enabled"] = True
    return {"success": True}

@app.post("/manual/disable")
async def disable_manual():
    state["manual_enabled"] = False
    return {"success": True}

@app.post("/manual/command")
async def manual_command(command: dict = Body(...)):
    is_zero = command.get("vx") == 0 and command.get("omega") == 0 and command.get("lift") == 0
    if not is_zero and (not state["manual_enabled"] or state["emergency_stop"]):
        return {"success": False}

    print(f"Mock Backend: Command received: {command}")
    state["last_manual_command"] = f"vx:{command.get('vx', 0):.2f}, w:{command.get('omega', 0):.2f}, lift:{command.get('lift', 0):.2f}"
    return {"success": True}

@app.post("/emergency-stop")
async def emergency_stop():
    state["emergency_stop"] = True
    state["manual_enabled"] = False
    return {"success": True}

@app.post("/release-emergency-stop")
async def release_emergency_stop():
    state["emergency_stop"] = False
    return {"success": True}

@app.get("/camera/status")
async def get_camera_status():
    return {
        "enabled": True,
        "stream_url": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1200",
        "stream_type": "MJPEG",
        "connected": True,
        "latency_ms": 32,
        "message": "Mock Camera Stream Active"
    }

