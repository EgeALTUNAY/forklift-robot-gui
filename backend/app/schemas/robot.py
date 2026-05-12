from enum import Enum
from datetime import datetime
from pydantic import BaseModel


class RobotMode(str, Enum):
    IDLE = "IDLE"
    TASK_RECEIVED_PROCESSING = "TASK_RECEIVED_PROCESSING"
    MOVING_UNLOADED = "MOVING_UNLOADED"
    MOVING_LOADED = "MOVING_LOADED"
    WAITING_FACTORY_COMMAND = "WAITING_FACTORY_COMMAND"
    TASK_COMPLETED_RETURNING = "TASK_COMPLETED_RETURNING"
    ERROR = "ERROR"
    EMERGENCY_STOP = "EMERGENCY_STOP"


class RobotState(BaseModel):
    mode: RobotMode
    battery_percent: float
    speed_mps: float
    load_detected: bool
    emergency_stop: bool
    connection_ok: bool
    timestamp: datetime