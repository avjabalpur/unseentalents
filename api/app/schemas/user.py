import uuid
from datetime import datetime

from app.models.enums import UserRole, UserStatus
from app.schemas.base import CamelModel


class UserRead(CamelModel):
    id: uuid.UUID
    name: str
    username: str
    email: str
    role: UserRole
    status: UserStatus
    credit_balance: int
    created_at: datetime
    avatar_key: str | None = None
    facebook_url: str | None = None
    instagram_url: str | None = None
    twitter_url: str | None = None


class UserUpdate(CamelModel):
    name: str | None = None
    facebook_url: str | None = None
    instagram_url: str | None = None
    twitter_url: str | None = None
