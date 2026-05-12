from datetime import datetime

from app.clients.interface import RobotBackendClientInterface


class DashboardService:
    def __init__(self, robot_client: RobotBackendClientInterface):
        self.robot_client = robot_client

    async def get_dashboard_snapshot(self) -> dict:
        try:
            robot_state = await self.robot_client.get_robot_state()
            plc_logs = await self.robot_client.get_plc_logs(limit=10)
            qr_events = await self.robot_client.get_qr_events(limit=10)
            map_runtime_status = await self.robot_client.get_map_runtime_status()
            alerts = await self.robot_client.get_alerts(limit=20)
            task_status = await self.robot_client.get_task_status()
            manual_control_status = await self.robot_client.get_manual_control_status()
            plc_messages = await self.robot_client.get_plc_messages(limit=20)
            camera_status = await self.robot_client.get_camera_status()
            
            # Overwrite the stream_url with the GUI backend proxy URL
            # The frontend should only ever talk to the GUI backend (8000)
            camera_status.stream_url = "/api/camera/stream"

            return {
                "ok": True,
                "robot_state": robot_state.model_dump(mode="json"),
                "plc_logs": [log.model_dump(mode="json") for log in plc_logs],
                "plc_messages": [msg.model_dump(mode="json") for msg in plc_messages],
                "qr_events": [qr.model_dump(mode="json") for qr in qr_events],
                "map_runtime_status": map_runtime_status.model_dump(mode="json"),
                "alerts": [alert.model_dump(mode="json") for alert in alerts],
                "task_status": task_status.model_dump(mode="json"),
                "manual_control_status": manual_control_status.model_dump(mode="json"),
                "camera_status": camera_status.model_dump(mode="json"),
                "error": None,
            }



        except Exception as exc:
            return {
                "ok": False,
                "robot_state": {
                    "mode": "ERROR",
                    "battery_percent": 0,
                    "speed_mps": 0,
                    "load_detected": False,
                    "emergency_stop": False,
                    "connection_ok": False,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                "plc_logs": [],
                "plc_messages": [],
                "qr_events": [],
                "map_runtime_status": {
                    "active_segment_ids": [],
                    "completed_segment_ids": [],
                    "pickup_point_id": None,
                    "dropoff_point_id": None,
                    "expected_qr_id": None,
                    "last_read_qr_id": None,
                    "read_qr_ids": [],
                    "current_node_id": None,
                    "gate_status": "ERROR",
                },
                "manual_control_status": {
                    "physical_switch_position": "AUTO",
                    "remote_control_state": "DISABLED",
                    "remote_control_enabled": False,
                    "input_source": "NONE",
                    "last_command": None,
                    "message": "Robot backend bağlantı hatası nedeniyle manuel kontrol durumu alınamadı.",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                "task_status": {
                    "task_id": None,
                    "phase": "ERROR",
                    "pickup_point_id": None,
                    "dropoff_point_id": None,
                    "active_route_id": None,
                    "expected_qr_id": None,
                    "last_read_qr_id": None,
                    "progress_percent": 0,
                    "elapsed_seconds": 0,
                    "remaining_seconds": None,
                    "description": "Robot backend bağlantı hatası nedeniyle görev durumu alınamadı.",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                "camera_status": {
                    "enabled": False,
                    "stream_url": None,
                    "stream_type": "NONE",
                    "connected": False,
                    "latency_ms": None,
                    "message": "Bağlantı hatası.",
                },
                "alerts": [

                    {
                        "id": "ALERT-ROBOT-BACKEND-DISCONNECTED",
                        "severity": "CRITICAL",
                        "source": "SYSTEM",
                        "title": "Robot Backend Bağlantı Hatası",
                        "message": str(exc),
                        "timestamp": datetime.utcnow().isoformat(),
                        "acknowledged": False,
                    }
                
                ],
                "error": str(exc),
}           