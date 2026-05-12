from enum import Enum
from datetime import datetime
from pydantic import BaseModel


class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class AlertSource(str, Enum):
    SYSTEM = "SYSTEM"
    ROBOT = "ROBOT"
    PLC = "PLC"
    QR = "QR"
    MAP = "MAP"
    SAFETY = "SAFETY"
    LINE_FOLLOW = "LINE_FOLLOW"


class AlertItem(BaseModel):
    id: str
    severity: AlertSeverity
    source: AlertSource
    title: str
    message: str
    timestamp: datetime
    acknowledged: bool = False