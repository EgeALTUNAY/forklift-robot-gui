from enum import Enum
from pydantic import BaseModel


class GateStatus(str, Enum):
    IDLE = "IDLE"
    WAITING_PERMISSION = "WAITING_PERMISSION"
    PERMISSION_GRANTED = "PERMISSION_GRANTED"
    PASSING = "PASSING"
    PASSED = "PASSED"
    ERROR = "ERROR"


class MapRuntimeStatus(BaseModel):
    active_segment_ids: list[str]
    completed_segment_ids: list[str]

    pickup_point_id: str | None = None
    dropoff_point_id: str | None = None

    expected_qr_id: str | None = None
    last_read_qr_id: str | None = None
    read_qr_ids: list[str]

    current_node_id: str | None = None
    gate_status: GateStatus