from enum import Enum
from datetime import datetime
from pydantic import BaseModel


class LogLevel(str, Enum):
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"


class PlcDirection(str, Enum):
    ROBOT_TO_PLC = "ROBOT_TO_PLC"
    PLC_TO_ROBOT = "PLC_TO_ROBOT"


class PlcMessageType(str, Enum):
    HEARTBEAT = "HEARTBEAT"
    TASK_ASSIGNMENT = "TASK_ASSIGNMENT"
    DOOR_PERMISSION_REQUEST = "DOOR_PERMISSION_REQUEST"
    DOOR_PERMISSION_RESPONSE = "DOOR_PERMISSION_RESPONSE"
    STATUS_UPDATE = "STATUS_UPDATE"
    ERROR = "ERROR"


class PlcLog(BaseModel):
    level: LogLevel
    message: str
    source: str = "PLC"
    timestamp: datetime


class PlcStatus(BaseModel):
    connected: bool
    cpu_status: str
    last_heartbeat: datetime
    error_count: int


class PlcMessage(BaseModel):
    id: str
    direction: PlcDirection
    message_type: PlcMessageType
    title: str
    timestamp: datetime
    success: bool
    payload: str  # Short JSON preview