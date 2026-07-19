import uuid
from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.base import CamelModel


class ContactMessageCreate(CamelModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class ContactMessageRead(CamelModel):
    id: uuid.UUID
    name: str
    email: str
    subject: str
    message: str
    is_read: bool
    created_at: datetime
