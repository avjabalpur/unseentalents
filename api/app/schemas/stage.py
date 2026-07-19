import uuid
from datetime import datetime

from app.models.enums import AdvanceMode, StageName
from app.schemas.base import CamelModel


class StageCreate(CamelModel):
    name: StageName
    order_index: int
    start_at: datetime
    end_at: datetime
    advance_mode: AdvanceMode = AdvanceMode.ADMIN_CURATED
    advance_count: int | None = None


class StageRead(CamelModel):
    id: uuid.UUID
    event_id: uuid.UUID
    name: StageName
    order_index: int
    start_at: datetime
    end_at: datetime
    advance_mode: AdvanceMode
    advance_count: int | None


class AdvanceRequest(CamelModel):
    participation_ids: list[uuid.UUID]
