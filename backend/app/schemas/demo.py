from pydantic import BaseModel, Field

from app.schemas.plc import PlcMessage
from app.schemas.qr import QrEvent
from app.schemas.map_status import RobotMapPosition, RobotPathTrailPoint


class DemoStatus(BaseModel):
    running: bool = Field(default=False)
    demo_running: bool = Field(default=False)
    demo_step_index: int = 0
    demo_route_nodes: list[str] = Field(default_factory=list)
    current_node_id: str | None = None
    current_segment_id: str | None = None
    segment_progress: float | None = None
    robot_position: RobotMapPosition | None = None
    robot_path_trail: list[RobotPathTrailPoint] | None = None
    completed_segment_ids: list[str] = Field(default_factory=list)
    active_segment_ids: list[str] = Field(default_factory=list)
    read_qr_ids: list[str] = Field(default_factory=list)
    expected_qr_id: str | None = None
    last_read_qr_id: str | None = None
    task_progress_percent: float = 0
    task_phase: str | None = None
    task_description: str | None = None
    elapsed_seconds: int = 0
    remaining_seconds: int | None = None
    gate_status: str | None = None
    plc_messages: list[PlcMessage] = Field(default_factory=list)
    qr_events: list[QrEvent] = Field(default_factory=list)


class DemoCommandResponse(BaseModel):
    success: bool
    status: DemoStatus | None = None
    message: str | None = None
