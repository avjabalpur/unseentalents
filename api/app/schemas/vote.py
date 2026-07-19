import uuid

from app.schemas.base import CamelModel


class VoteRead(CamelModel):
    id: uuid.UUID
    submission_id: uuid.UUID
    stage_id: uuid.UUID
