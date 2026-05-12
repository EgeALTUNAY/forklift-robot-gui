from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ManualCommandFrame(BaseModel):
    source: Literal["GUI_TEST", "GAMEPAD", "PHYSICAL_REMOTE"]
    seq: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    deadman_pressed: bool
    vx: float = 0.0  # Linear velocity (m/s)
    omega: float = 0.0  # Angular velocity (rad/s)
    lift: float = 0.0  # Lift position or velocity (m or m/s depending on system)


class ManualCommandAck(BaseModel):
    accepted: bool
    reason: Optional[str] = None
    seq: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
