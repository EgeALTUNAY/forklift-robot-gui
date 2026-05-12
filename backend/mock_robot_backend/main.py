import math
from datetime import datetime, timedelta
from fastapi import FastAPI, Body

app = FastAPI(title="Mock Robot Backend")

DEMO_ROUTE_NODES = ["START", "D1", "D2", "A2", "D2", "D3", "GATE", "D4", "D6", "B3"]
DEMO_ROUTE_SEGMENTS = [
    "START_D1",
    "D1_D2",
    "D2_A2",
    "D2_A2",
    "D2_D3",
    "D3_GATE",
    "GATE_D4",
    "D4_D6",
    "D6_B3",
]
DEMO_QR_SEQUENCE = ["q1", "q3", "q5", "q6", "q7"]
DEMO_STEP_SECONDS = 4
DEMO_TOTAL_STEPS = len(DEMO_ROUTE_SEGMENTS)
DEMO_TOTAL_SECONDS = DEMO_TOTAL_STEPS * DEMO_STEP_SECONDS
DEMO_TRAIL_MAX_POINTS = 80
DEMO_TRAIL_SAMPLE_SECONDS = 0.5
DEMO_TRAIL_MIN_DISTANCE = 0.25

DEMO_MAP_POINTS = {
    "START": {"x": 11.5, "y": 81.5},
    "A2": {"x": 21.4, "y": 12.85},
    "B3": {"x": 70.18, "y": 86},
    "D1": {"x": 11.5, "y": 57.5},
    "D2": {"x": 21.5, "y": 57.5},
    "D3": {"x": 31.09, "y": 57.5},
    "D4": {"x": 70.18, "y": 57.37},
    "D6": {"x": 70.18, "y": 63.27},
    "GATE": {"x": 46.8, "y": 57.5},
}

QR_EVENTS_BY_STEP = [
    (1, "q1", "START_D1"),
    (3, "q3", "A2"),
    (6, "q5", "D3_GATE"),
    (7, "q6", "GATE_D4"),
    (9, "q7", "B3"),
]

PLC_MESSAGES_BY_STEP = [
    (0, "DEMO-PLC-001", "PLC_TO_ROBOT", "TASK_ASSIGNMENT", "Görev Atama", '{"task_id": "DEMO-A2-B3", "pickup": "A2", "dropoff": "B3"}'),
    (6, "DEMO-PLC-002", "ROBOT_TO_PLC", "DOOR_PERMISSION_REQUEST", "Kapı İzin Talebi", '{"gate_id": "GATE", "robot_id": "DEMO-R1"}'),
    (7, "DEMO-PLC-003", "PLC_TO_ROBOT", "DOOR_PERMISSION_RESPONSE", "Kapı İzin Yanıtı", '{"gate_id": "GATE", "access": "granted"}'),
    (9, "DEMO-PLC-004", "ROBOT_TO_PLC", "STATUS_UPDATE", "Görev Tamamlandı", '{"task_id": "DEMO-A2-B3", "result": "completed"}'),
]


def _initial_demo_state():
    return {
        "demo_running": False,
        "demo_has_state": False,
        "demo_step_index": 0,
        "demo_route_nodes": DEMO_ROUTE_NODES.copy(),
        "demo_start_time": None,
        "demo_paused_at": None,
        "demo_paused_elapsed_seconds": 0.0,
    }


# In-memory state for dev/test
state = {
    "manual_enabled": False,
    "emergency_stop": False,
    "current_node_id": "D2",
    "gate_status": "IDLE",
    "battery": 88.5,
    "speed": 0.0,
    "last_manual_command": None,
    "active_route": None,
    "demo": _initial_demo_state(),
}


def _demo_elapsed_seconds() -> float:
    demo = state["demo"]

    if demo["demo_running"] and demo["demo_start_time"] is not None:
        elapsed = (datetime.utcnow() - demo["demo_start_time"]).total_seconds()
        if elapsed >= DEMO_TOTAL_SECONDS:
            demo["demo_running"] = False
            demo["demo_start_time"] = None
            demo["demo_paused_at"] = datetime.utcnow()
            demo["demo_paused_elapsed_seconds"] = float(DEMO_TOTAL_SECONDS)
        return min(elapsed, DEMO_TOTAL_SECONDS)

    return min(float(demo["demo_paused_elapsed_seconds"]), DEMO_TOTAL_SECONDS)


def _unique(items: list[str]) -> list[str]:
    seen = set()
    unique_items: list[str] = []

    for item in items:
        if item in seen:
            continue
        seen.add(item)
        unique_items.append(item)

    return unique_items


def _interpolate_demo_position(elapsed: float) -> dict:
    completed_steps = min(int(elapsed // DEMO_STEP_SECONDS), DEMO_TOTAL_STEPS)
    finished = completed_steps >= DEMO_TOTAL_STEPS
    active_step = min(completed_steps, DEMO_TOTAL_STEPS - 1)

    if finished:
        from_node_id = DEMO_ROUTE_NODES[-2]
        to_node_id = DEMO_ROUTE_NODES[-1]
        segment_progress = 1.0
        current_segment_id = None
    else:
        from_node_id = DEMO_ROUTE_NODES[active_step]
        to_node_id = DEMO_ROUTE_NODES[active_step + 1]
        segment_elapsed = elapsed - (active_step * DEMO_STEP_SECONDS)
        segment_progress = max(0.0, min(segment_elapsed / DEMO_STEP_SECONDS, 1.0))
        current_segment_id = DEMO_ROUTE_SEGMENTS[active_step]

    from_point = DEMO_MAP_POINTS[from_node_id]
    to_point = DEMO_MAP_POINTS[to_node_id]
    dx = to_point["x"] - from_point["x"]
    dy = to_point["y"] - from_point["y"]

    return {
        "current_segment_id": current_segment_id,
        "segment_progress": round(segment_progress, 3),
        "robot_position": {
            "x": round(from_point["x"] + (dx * segment_progress), 3),
            "y": round(from_point["y"] + (dy * segment_progress), 3),
            "heading_deg": round(math.degrees(math.atan2(dy, dx)), 1),
        },
    }


def _append_trail_point(trail: list[dict], point: dict):
    if trail:
        last_point = trail[-1]
        dx = point["x"] - last_point["x"]
        dy = point["y"] - last_point["y"]
        if (dx * dx) + (dy * dy) < DEMO_TRAIL_MIN_DISTANCE * DEMO_TRAIL_MIN_DISTANCE:
            return

    trail.append({"x": point["x"], "y": point["y"]})


def _demo_path_trail(elapsed: float) -> list[dict]:
    if elapsed <= 0:
        return []

    sample_count = int(elapsed / DEMO_TRAIL_SAMPLE_SECONDS)
    trail: list[dict] = []

    for index in range(sample_count + 1):
        sample_elapsed = min(index * DEMO_TRAIL_SAMPLE_SECONDS, elapsed)
        position = _interpolate_demo_position(sample_elapsed)["robot_position"]
        _append_trail_point(trail, position)

    current_position = _interpolate_demo_position(elapsed)["robot_position"]
    _append_trail_point(trail, current_position)

    return trail[-DEMO_TRAIL_MAX_POINTS:]


def _demo_snapshot() -> dict:
    demo = state["demo"]
    elapsed = _demo_elapsed_seconds()
    completed_steps = min(int(elapsed // DEMO_STEP_SECONDS), DEMO_TOTAL_STEPS)
    finished = completed_steps >= DEMO_TOTAL_STEPS
    active_step = min(completed_steps, DEMO_TOTAL_STEPS - 1)
    current_node_index = min(completed_steps, len(DEMO_ROUTE_NODES) - 1)

    completed_segment_ids = _unique(DEMO_ROUTE_SEGMENTS[:completed_steps])
    active_segment_ids = [] if finished else [DEMO_ROUTE_SEGMENTS[active_step]]

    read_qr_ids = [
        qr_id
        for step, qr_id, _station_id in QR_EVENTS_BY_STEP
        if completed_steps >= step
    ]
    expected_qr_id = next(
        (
            qr_id
            for step, qr_id, _station_id in QR_EVENTS_BY_STEP
            if completed_steps < step
        ),
        None,
    )
    last_read_qr_id = read_qr_ids[-1] if read_qr_ids else None

    phase, description = _demo_task_phase(completed_steps, finished)

    if completed_steps < 6:
        gate_status = "IDLE"
    elif completed_steps == 6:
        gate_status = "WAITING_PERMISSION"
    elif completed_steps == 7:
        gate_status = "PERMISSION_GRANTED"
    elif completed_steps == 8:
        gate_status = "PASSING"
    else:
        gate_status = "PASSED"

    progress_percent = round((completed_steps / DEMO_TOTAL_STEPS) * 100, 1)
    remaining_seconds = None if finished else max(0, int(DEMO_TOTAL_SECONDS - elapsed))

    qr_events = _demo_qr_events(completed_steps)
    plc_messages = _demo_plc_messages(completed_steps)
    movement = _interpolate_demo_position(elapsed)
    robot_path_trail = _demo_path_trail(elapsed)

    demo["demo_step_index"] = completed_steps

    return {
        "running": demo["demo_running"],
        "demo_running": demo["demo_running"],
        "demo_has_state": demo["demo_has_state"],
        "demo_step_index": completed_steps,
        "demo_route_nodes": DEMO_ROUTE_NODES.copy(),
        "current_node_id": DEMO_ROUTE_NODES[current_node_index],
        "current_segment_id": movement["current_segment_id"],
        "segment_progress": movement["segment_progress"],
        "robot_position": movement["robot_position"],
        "robot_path_trail": robot_path_trail,
        "completed_segment_ids": completed_segment_ids,
        "active_segment_ids": active_segment_ids,
        "read_qr_ids": read_qr_ids,
        "expected_qr_id": expected_qr_id,
        "last_read_qr_id": last_read_qr_id,
        "task_progress_percent": progress_percent,
        "task_phase": phase,
        "task_description": description,
        "elapsed_seconds": int(elapsed),
        "remaining_seconds": remaining_seconds,
        "gate_status": gate_status,
        "plc_messages": plc_messages,
        "qr_events": qr_events,
    }


def _demo_task_phase(completed_steps: int, finished: bool) -> tuple[str, str]:
    if finished:
        return "COMPLETED", "DEMO SİMÜLASYON MODU: Görev tamamlandı."

    if completed_steps <= 1:
        return "TASK_RECEIVED", "DEMO SİMÜLASYON MODU: Görev alındı."

    if completed_steps <= 3:
        return "GOING_TO_PICKUP", "DEMO SİMÜLASYON MODU: Robot yüksüz olarak A2 noktasına ilerliyor."

    if completed_steps == 4:
        return "LOAD_PICKED", "DEMO SİMÜLASYON MODU: Yük alındı, rota B3 noktasına döndü."

    if completed_steps <= 6:
        return "WAITING_FACTORY_COMMAND", "DEMO SİMÜLASYON MODU: Kapı geçiş izni bekleniyor."

    if completed_steps <= 8:
        return "PASSING_GATE", "DEMO SİMÜLASYON MODU: Kapı geçişi yapılıyor."

    return "GOING_TO_DROPOFF", "DEMO SİMÜLASYON MODU: Robot yüklü olarak B3 noktasına ilerliyor."


def _event_timestamp(base_time: datetime | None, step: int) -> str:
    if base_time is None:
        base_time = datetime.utcnow()

    return (base_time + timedelta(seconds=step * DEMO_STEP_SECONDS)).isoformat()


def _demo_qr_events(completed_steps: int) -> list[dict]:
    start_time = state["demo"]["demo_start_time"]

    return [
        {
            "qr_id": qr_id,
            "raw_data": f"DEMO_QR_{qr_id.upper()}",
            "station_id": station_id,
            "timestamp": _event_timestamp(start_time, step),
        }
        for step, qr_id, station_id in QR_EVENTS_BY_STEP
        if completed_steps >= step
    ]


def _demo_plc_messages(completed_steps: int) -> list[dict]:
    start_time = state["demo"]["demo_start_time"]

    return [
        {
            "id": msg_id,
            "direction": direction,
            "message_type": message_type,
            "title": f"DEMO SİMÜLASYON MODU - {title}",
            "timestamp": _event_timestamp(start_time, step),
            "success": True,
            "payload": payload,
        }
        for step, msg_id, direction, message_type, title, payload in PLC_MESSAGES_BY_STEP
        if completed_steps >= step
    ]


def _reset_demo_state(running: bool = False, visible: bool = False):
    state["demo"] = _initial_demo_state()
    state["demo"]["demo_running"] = running
    state["demo"]["demo_has_state"] = visible or running
    if running:
        state["demo"]["demo_start_time"] = datetime.utcnow()
        state["demo"]["demo_paused_at"] = None

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/state")
async def get_state():
    demo = _demo_snapshot()
    mode = "IDLE"
    if state["emergency_stop"]:
        mode = "EMERGENCY_STOP"
    elif state["manual_enabled"]:
        mode = "IDLE" # Following FakeRobotBackend behavior
    elif demo["running"]:
        if demo["task_phase"] == "TASK_RECEIVED":
            mode = "TASK_RECEIVED_PROCESSING"
        elif demo["task_phase"] in {"GOING_TO_PICKUP"}:
            mode = "MOVING_UNLOADED"
        elif demo["task_phase"] in {"WAITING_FACTORY_COMMAND", "PASSING_GATE"}:
            mode = "WAITING_FACTORY_COMMAND"
        elif demo["task_phase"] == "COMPLETED":
            mode = "TASK_COMPLETED_RETURNING"
        else:
            mode = "MOVING_LOADED"
    
    return {
        "mode": mode,
        "battery_percent": state["battery"],
        "speed_mps": 0.28 if demo["running"] and not state["emergency_stop"] else state["speed"],
        "load_detected": demo["demo_step_index"] >= 4 and demo["task_phase"] != "COMPLETED",
        "emergency_stop": state["emergency_stop"],
        "connection_ok": True,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/task/status")
async def get_task_status():
    demo = _demo_snapshot()
    if demo["running"] or state["demo"]["demo_has_state"]:
        return {
            "task_id": "DEMO-A2-B3",
            "phase": demo["task_phase"],
            "pickup_point_id": "A2",
            "dropoff_point_id": "B3",
            "active_route_id": "DEMO_ROUTE_A2_B3",
            "expected_qr_id": demo["expected_qr_id"],
            "last_read_qr_id": demo["last_read_qr_id"],
            "progress_percent": demo["task_progress_percent"],
            "elapsed_seconds": demo["elapsed_seconds"],
            "remaining_seconds": demo["remaining_seconds"],
            "description": demo["task_description"],
            "timestamp": datetime.utcnow().isoformat()
        }

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

@app.post("/routes/active")
async def set_active_route(route: dict = Body(...)):
    state["active_route"] = route
    return {"success": True, "message": "Active route stored in mock robot backend"}

@app.get("/map/runtime")
async def get_map_runtime():
    demo = _demo_snapshot()
    if demo["running"] or state["demo"]["demo_has_state"]:
        return {
            "active_segment_ids": demo["active_segment_ids"],
            "completed_segment_ids": demo["completed_segment_ids"],
            "pickup_point_id": "A2",
            "dropoff_point_id": "B3",
            "expected_qr_id": demo["expected_qr_id"],
            "last_read_qr_id": demo["last_read_qr_id"],
            "read_qr_ids": demo["read_qr_ids"],
            "current_node_id": demo["current_node_id"],
            "current_segment_id": demo["current_segment_id"],
            "segment_progress": demo["segment_progress"],
            "robot_position": demo["robot_position"],
            "robot_path_trail": demo["robot_path_trail"],
            "gate_status": demo["gate_status"]
        }

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
    demo = _demo_snapshot()
    if demo["running"] or state["demo"]["demo_has_state"]:
        return demo["qr_events"][-limit:]

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
    demo = _demo_snapshot()
    if demo["running"] or state["demo"]["demo_has_state"]:
        return demo["plc_messages"][-limit:]

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


@app.post("/demo/start")
async def demo_start():
    _reset_demo_state(running=True, visible=True)
    return {"success": True, "status": _demo_snapshot()}


@app.post("/demo/stop")
async def demo_stop():
    demo = state["demo"]
    demo["demo_paused_elapsed_seconds"] = _demo_elapsed_seconds()
    demo["demo_running"] = False
    demo["demo_start_time"] = None
    demo["demo_paused_at"] = datetime.utcnow()
    return {"success": True, "status": _demo_snapshot()}


@app.post("/demo/reset")
async def demo_reset():
    _reset_demo_state(running=False, visible=True)
    return {"success": True, "status": _demo_snapshot()}


@app.get("/demo/status")
async def demo_status():
    return _demo_snapshot()




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
