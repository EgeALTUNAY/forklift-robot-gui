from enum import Enum
from datetime import datetime
from pydantic import BaseModel


class TaskPhase(str, Enum):
    NO_TASK = "NO_TASK"
    TASK_RECEIVED = "TASK_RECEIVED"
    PROCESSING = "PROCESSING"
    GOING_TO_PICKUP = "GOING_TO_PICKUP"
    PICKUP_ALIGNMENT = "PICKUP_ALIGNMENT"
    LOAD_PICKED = "LOAD_PICKED"
    GOING_TO_GATE = "GOING_TO_GATE"
    WAITING_FACTORY_COMMAND = "WAITING_FACTORY_COMMAND"
    PASSING_GATE = "PASSING_GATE"
    GOING_TO_DROPOFF = "GOING_TO_DROPOFF"
    DROPOFF_ALIGNMENT = "DROPOFF_ALIGNMENT"
    LOAD_DROPPED = "LOAD_DROPPED"
    RETURNING_TO_START = "RETURNING_TO_START"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"


class TaskStatus(BaseModel):
    task_id: str | None = None
    phase: TaskPhase
    pickup_point_id: str | None = None
    dropoff_point_id: str | None = None
    active_route_id: str | None = None

    expected_qr_id: str | None = None
    last_read_qr_id: str | None = None

    progress_percent: float = 0
    elapsed_seconds: int = 0
    remaining_seconds: int | None = None

    description: str | None = None
    timestamp: datetime