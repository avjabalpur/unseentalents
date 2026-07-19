import uuid

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
