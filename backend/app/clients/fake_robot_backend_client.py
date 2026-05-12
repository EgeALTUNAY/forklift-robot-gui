import random
from datetime import datetime

from app.clients.interface import RobotBackendClientInterface
from app.schemas.robot import RobotState, RobotMode
from app.schemas.plc import PlcLog, LogLevel, PlcStatus, PlcMessage, PlcDirection, PlcMessageType
from app.schemas.qr import QrEvent
from app.schemas.control import ManualControlCommand
from app.schemas.map_status import MapRuntimeStatus, GateStatus
from app.schemas.alert import AlertItem, AlertSeverity, AlertSource
from app.schemas.task import TaskStatus, TaskPhase
from app.schemas.manual_status import (
    ManualControlStatus,
    PhysicalSwitchPosition,
    RemoteControlState,
    ManualInputSource,
)
from app.schemas.camera import CameraStatus

class FakeRobotBackendClient(RobotBackendClientInterface):
    def __init__(self):
        self.manual_mode = False
        self.emergency = False
        self.last_command = None


    async def get_manual_control_status(self) -> ManualControlStatus:
        if self.emergency:
            return ManualControlStatus(
                physical_switch_position=PhysicalSwitchPosition.AUTO,
                remote_control_state=RemoteControlState.DISABLED,
                remote_control_enabled=False,
                input_source=ManualInputSource.NONE,
                last_command="EMERGENCY_STOP",
                message="Acil stop aktif olduğu için uzaktan kontrol devre dışı.",
                timestamp=datetime.utcnow(),
        )   

        if self.manual_mode:
            return ManualControlStatus(
                physical_switch_position=PhysicalSwitchPosition.MANUAL,
                remote_control_state=RemoteControlState.ACTIVE,
                remote_control_enabled=True,
                input_source=ManualInputSource.GUI_TEST,
                last_command=self.last_command,
                message="Manuel kontrol test modunda aktif. Gerçek sistemde bu durum fiziksel anahtar ile sağlanacaktır.",
                timestamp=datetime.utcnow(),
        )

        return ManualControlStatus(
            physical_switch_position=PhysicalSwitchPosition.AUTO,
            remote_control_state=RemoteControlState.LOCKED,
            remote_control_enabled=False,
            input_source=ManualInputSource.NONE,
            last_command=None,
            message="Robot otomatik modda. Fiziksel anahtar MANUEL konuma alınmadan uzaktan kontrol yapılamaz.",
            timestamp=datetime.utcnow(),
    )
    async def get_robot_state(self) -> RobotState:
        if self.emergency:
            mode = RobotMode.EMERGENCY_STOP
        elif self.manual_mode:
            # Manuel test durumu robot mode olarak değil, alert/manual panel olarak gösterilecek.
            mode = RobotMode.IDLE
        else:
            mode = random.choice([
                RobotMode.IDLE,
                RobotMode.TASK_RECEIVED_PROCESSING,
                RobotMode.MOVING_UNLOADED,
                RobotMode.MOVING_LOADED,
                RobotMode.WAITING_FACTORY_COMMAND,
                RobotMode.TASK_COMPLETED_RETURNING,
            ])

        return RobotState(
            mode=mode,
            battery_percent=round(random.uniform(60, 95), 1),
            speed_mps=round(random.uniform(0, 0.5), 2),
            load_detected=random.choice([True, False]),
            emergency_stop=self.emergency,
            connection_ok=True,
            timestamp=datetime.utcnow(),
        )

    async def get_plc_logs(self, limit: int = 50) -> list[PlcLog]:
        return [
            PlcLog(
                level=random.choice([LogLevel.INFO, LogLevel.WARN]),
                message=random.choice([
                    "PLC connection healthy",
                    "Motor driver status OK",
                    "Load sensor value updated",
                    "QR scanner heartbeat received",
                ]),
                timestamp=datetime.utcnow(),
            )
            for _ in range(min(limit, 5))
        ]

    async def get_plc_status(self) -> PlcStatus:
        return PlcStatus(
            connected=True,
            cpu_status="RUN",
            last_heartbeat=datetime.utcnow(),
            error_count=0
        )

    async def get_plc_messages(self, limit: int = 20) -> list[PlcMessage]:
        if self.emergency:
            return [
                PlcMessage(
                    id="PLC-MSG-ESTOP",
                    message_type=PlcMessageType.ERROR,
                    direction=PlcDirection.PLC_TO_ROBOT,
                    title="ACİL STOP AKTİF - PLC GÜVENLİK KESİNTİSİ",
                    success=False,
                    timestamp=datetime.utcnow(),
                    payload='{"error": "EMERGENCY_STOP_ACTIVE", "source": "SAFETY_RELAY"}'
                )
            ]

        types = [
            (PlcMessageType.TASK_ASSIGNMENT, PlcDirection.PLC_TO_ROBOT, "Görev Atama Başarılı", True),
            (PlcMessageType.DOOR_PERMISSION_REQUEST, PlcDirection.ROBOT_TO_PLC, "Kapı İzin Talebi Gönderildi", True),
            (PlcMessageType.DOOR_PERMISSION_RESPONSE, PlcDirection.PLC_TO_ROBOT, "Kapı İzni Verildi", True),
            (PlcMessageType.STATUS_UPDATE, PlcDirection.ROBOT_TO_PLC, "Konum Bildirimi", True),
            (PlcMessageType.HEARTBEAT, PlcDirection.PLC_TO_ROBOT, "Sistem Sağlıklı", True),
            (PlcMessageType.ERROR, PlcDirection.PLC_TO_ROBOT, "Haberleşme Hatası", False),
        ]
        
        return [
            PlcMessage(
                id=f"PLC-MSG-{random.randint(1000, 9999)}",
                message_type=t[0],
                direction=t[1],
                title=t[2],
                success=t[3],
                timestamp=datetime.utcnow(),
                payload='{"status": "ok", "code": 200}'
            )
            for t in random.sample(types, min(limit, 4))
        ]



    async def get_qr_events(self, limit: int = 50) -> list[QrEvent]:
        return [
            QrEvent(
                qr_id=f"QR-{random.randint(1000, 9999)}",
                raw_data=random.choice([
                    "STATION_A",
                    "STATION_B",
                    "LOAD_ZONE",
                    "DROP_ZONE",
                ]),
                station_id=random.choice(["A", "B", "C"]),
                timestamp=datetime.utcnow(),
            )
            for _ in range(min(limit, 5))
        ]

    async def enable_manual_mode(self) -> bool:
        if self.emergency:
            return False

        self.manual_mode = True
        return True

    async def disable_manual_mode(self) -> bool:
        self.manual_mode = False
        return True

    async def send_manual_command(self, command: ManualControlCommand) -> bool:
        if not self.manual_mode:
            return False

        if self.emergency:
            return False

        self.last_command = f"vx:{command.vx:.2f}, w:{command.omega:.2f}, lift:{command.lift:.2f}"
        return True


    async def get_camera_status(self) -> CameraStatus:
        return CameraStatus(
            enabled=True,
            stream_url="https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&q=80&w=800", # Mock image
            stream_type="MJPEG",
            connected=True,
            latency_ms=45,
            message="Kamera sistemi aktif ve çalışıyor."
        )


    async def emergency_stop(self) -> bool:

        self.emergency = True
        self.manual_mode = False
        return True
    async def release_emergency_stop(self) -> bool:
        self.emergency = False
        self.manual_mode = False
        return True
    
    async def get_map_runtime_status(self) -> MapRuntimeStatus:
     if self.emergency:
        return MapRuntimeStatus(
            active_segment_ids=[],
            completed_segment_ids=["START_D1", "D1_D2"],
            pickup_point_id="A2",
            dropoff_point_id="B3",
            expected_qr_id=None,
            last_read_qr_id="q3",
            read_qr_ids=["q1", "q2", "q3"],
            current_node_id="D2",
            gate_status=GateStatus.ERROR,
        )

     if self.manual_mode:
        return MapRuntimeStatus(
            active_segment_ids=["D2_D3"],
            completed_segment_ids=["START_D1", "D1_D2"],
            pickup_point_id="A2",
            dropoff_point_id="B3",
            expected_qr_id="q4",
            last_read_qr_id="q3",
            read_qr_ids=["q1", "q2", "q3"],
            current_node_id="D2",
            gate_status=GateStatus.IDLE,
        )

     return MapRuntimeStatus(
          active_segment_ids=[
            "START_D1",
            "D1_D2",
            "D2_D3",
            "D3_GATE",
            "GATE_D4",
            "D4_D6",
            "D6_B3",
        ],
         completed_segment_ids=["START_D1", "D1_D2"],
         pickup_point_id="A2",
         dropoff_point_id="B3",
         expected_qr_id="q8",
         last_read_qr_id="q3",
         read_qr_ids=["q1", "q2", "q3"],
         current_node_id="D2",
         gate_status=GateStatus.WAITING_PERMISSION,
    )

    async def get_alerts(self, limit: int = 20) -> list[AlertItem]:
        alerts: list[AlertItem] = []

        if self.emergency:
            alerts.append(
                AlertItem(
                    id="ALERT-ESTOP",
                    severity=AlertSeverity.CRITICAL,
                    source=AlertSource.SAFETY,
                    title="Acil Stop Aktif",
                    message="Robot acil stop durumunda. Hareket komutları engellenmiştir.",
                    timestamp=datetime.utcnow(),
                    acknowledged=False,
                )
            )

        if self.manual_mode:
            alerts.append(
                AlertItem(
                    id="ALERT-MANUAL-TEST",
                    severity=AlertSeverity.WARNING,
                    source=AlertSource.ROBOT,
                    title="Manuel Test Modu",
                    message="Robot manuel test modundadır. Gerçek saha kullanımında manuel kontrol fiziksel kumanda ile yapılacaktır.",
                    timestamp=datetime.utcnow(),
                    acknowledged=False,
                )
            )

        if not self.emergency and not self.manual_mode:
            alerts.append(
                AlertItem(
                    id="ALERT-GATE-WAIT",
                    severity=AlertSeverity.INFO,
                    source=AlertSource.PLC,
                    title="Kapı İzni Bekleniyor",
                    message="Robot kontrollü kapı bölgesine yaklaşmaktadır. Fabrika otomasyon sisteminden geçiş izni bekleniyor.",
                    timestamp=datetime.utcnow(),
                    acknowledged=False,
                )
            )

            alerts.append(
                AlertItem(
                    id="ALERT-QR-EXPECTED",
                    severity=AlertSeverity.INFO,
                    source=AlertSource.QR,
                    title="Beklenen QR",
                    message="Sıradaki doğrulama noktası q5 olarak beklenmektedir.",
                    timestamp=datetime.utcnow(),
                    acknowledged=False,
                )
            )

        return alerts[:limit]
    async def get_task_status(self) -> TaskStatus:
        if self.emergency:
          return TaskStatus(
            task_id="TASK-A2-B3",
            phase=TaskPhase.ERROR,
            pickup_point_id="A2",
            dropoff_point_id="B3",
            active_route_id="R_A2_B3",
            expected_qr_id=None,
            last_read_qr_id="q3",
            progress_percent=32,
            elapsed_seconds=145,
            remaining_seconds=None,
            description="Acil stop nedeniyle görev durduruldu.",
            timestamp=datetime.utcnow(),
        )

        if self.manual_mode:
         return TaskStatus(
            task_id=None,
            phase=TaskPhase.NO_TASK,
            pickup_point_id=None,
            dropoff_point_id=None,
            active_route_id=None,
            expected_qr_id=None,
            last_read_qr_id=None,
            progress_percent=0,
            elapsed_seconds=0,
            remaining_seconds=None,
            description="Robot manuel test modunda. Aktif otonom görev yok.",
            timestamp=datetime.utcnow(),
        )

        return TaskStatus(
            task_id="TASK-A2-B3",
            phase=TaskPhase.WAITING_FACTORY_COMMAND,
            pickup_point_id="A2",
            dropoff_point_id="B3",
            active_route_id="R_A2_B3",
            expected_qr_id="q5",
            last_read_qr_id="q3",
            progress_percent=46,
            elapsed_seconds=180,
            remaining_seconds=210,
            description="Robot kontrollü kapı bölgesine yaklaşıyor ve fabrika otomasyon sisteminden izin bekliyor.",
            timestamp=datetime.utcnow(),
        )

    async def ping(self) -> bool:
        return True

    async def close(self) -> None:
        pass