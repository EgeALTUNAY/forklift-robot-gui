from datetime import datetime

from pydantic import BaseModel


class DefinedRoute(BaseModel):
    id: str
    name: str

    start_point_id: str
    pickup_point_id: str
    dropoff_point_id: str

    segment_ids: list[str]
    qr_sequence: list[str]

    gate_required: bool

    created_at: datetime
    updated_at: datetime | None = None

