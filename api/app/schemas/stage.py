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


class StageStats(CamelModel):
    stage_id: uuid.UUID
    name: StageName
    order_index: int
    start_at: datetime
    end_at: datetime
    closed_at: datetime | None
    is_current: bool
    submission_count: int
    pending_count: int
    approved_count: int
    rejected_count: int
    advanced_count: int
    participants_at_stage: int
