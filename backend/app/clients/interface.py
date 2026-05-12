from typing import Protocol

from app.schemas.robot import RobotState
from app.schemas.plc import PlcLog, PlcStatus, PlcMessage
from app.schemas.qr import QrEvent
from app.schemas.control import ManualControlCommand
from app.schemas.map_status import MapRuntimeStatus
from app.schemas.alert import AlertItem
from app.schemas.task import TaskStatus
from app.schemas.manual_status import ManualControlStatus
from app.schemas.camera import CameraStatus
from app.schemas.route import DefinedRoute
from app.schemas.demo import DemoCommandResponse, DemoStatus

class RobotBackendClientInterface(Protocol):
    async def get_robot_state(self) -> RobotState:
        ...
    async def get_camera_status(self) -> CameraStatus:
        ...

    async def release_emergency_stop(self) -> bool:
        ...
    async def get_plc_logs(self, limit: int = 50) -> list[PlcLog]:
        ...

    async def get_plc_status(self) -> PlcStatus:
        ...

    async def get_plc_messages(self, limit: int = 20) -> list[PlcMessage]:
        ...

    async def get_qr_events(self, limit: int = 50) -> list[QrEvent]:
        ...

    async def enable_manual_mode(self) -> bool:
        ...

    async def disable_manual_mode(self) -> bool:
        ...

    async def send_manual_command(self, command: ManualControlCommand) -> bool:
        ...

    async def emergency_stop(self) -> bool:
        ...

    async def get_map_runtime_status(self) -> MapRuntimeStatus:
        ... 

    async def get_alerts(self, limit: int = 20) -> list[AlertItem]:
        ...

    async def get_task_status(self) -> TaskStatus:
        ...

    async def set_active_route(self, route: DefinedRoute) -> bool:
        ...

    async def start_demo(self) -> DemoCommandResponse:
        ...

    async def stop_demo(self) -> DemoCommandResponse:
        ...

    async def reset_demo(self) -> DemoCommandResponse:
        ...

    async def get_demo_status(self) -> DemoStatus:
        ...

    async def get_manual_control_status(self) -> ManualControlStatus:
        ...
    async def ping(self) -> bool:
        ...

    async def close(self) -> None:
        ...
