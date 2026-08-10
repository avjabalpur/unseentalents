import uuid
from datetime import datetime

from app.schemas.base import CamelModel


class ActivityLogRead(CamelModel):
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    actor_id: uuid.UUID | None
    actor_name: str | None = None
    actor_username: str | None = None
    action: str
    log_metadata: dict | None = None
    created_at: datetime
