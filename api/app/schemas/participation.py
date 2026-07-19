import uuid

from app.models.enums import ParticipationStatus
from app.schemas.base import CamelModel


class ParticipationRead(CamelModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    current_stage_id: uuid.UUID
    status: ParticipationStatus
