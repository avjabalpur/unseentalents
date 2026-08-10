import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class SiteSettings(SQLModel, table=True):
    __tablename__ = "site_settings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    welcome_credit_amount: int = Field(default=2)
    max_upload_size_mb: int = Field(default=100)
    maintenance_mode: bool = Field(default=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
