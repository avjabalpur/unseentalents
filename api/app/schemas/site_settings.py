import uuid
from datetime import datetime

from app.schemas.base import CamelModel


class SiteSettingsRead(CamelModel):
    id: uuid.UUID
    welcome_credit_amount: int
    max_upload_size_mb: int
    maintenance_mode: bool
    updated_at: datetime


class SiteSettingsUpdate(CamelModel):
    welcome_credit_amount: int | None = None
    max_upload_size_mb: int | None = None
    maintenance_mode: bool | None = None
