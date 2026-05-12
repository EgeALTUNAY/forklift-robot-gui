from pydantic import BaseModel, Field


class ManualControlCommand(BaseModel):
    vx: float = Field(..., ge=-0.5, le=0.5)
    omega: float = Field(..., ge=-0.8, le=0.8)
    lift: float = Field(default=0.0, ge=-0.3, le=0.3)