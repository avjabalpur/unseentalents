import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel

from app.models.enums import UserRole, UserStatus


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    phone: str | None = None
    password_hash: str
    role: UserRole = Field(default=UserRole.USER)
    status: UserStatus = Field(default=UserStatus.ACTIVE)
    credit_balance: int = Field(default=0)
    avatar_key: str | None = None
    facebook_url: str | None = None
    instagram_url: str | None = None
    twitter_url: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
