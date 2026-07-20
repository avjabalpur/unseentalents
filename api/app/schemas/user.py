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


class UserUpdate(CamelModel):
    name: str | None = None
