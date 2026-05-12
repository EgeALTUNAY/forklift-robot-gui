from datetime import datetime
from pydantic import BaseModel


class QrEvent(BaseModel):
    qr_id: str
    raw_data: str
    station_id: str | None = None
    timestamp: datetime