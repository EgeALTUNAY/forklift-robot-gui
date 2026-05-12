from typing import Optional, Literal
from pydantic import BaseModel


class CameraStatus(BaseModel):
    enabled: bool
    stream_url: Optional[str] = None
    stream_type: Literal["MJPEG", "WEBRTC", "NONE"] = "NONE"
    connected: bool
    latency_ms: Optional[int] = None
    message: Optional[str] = None
