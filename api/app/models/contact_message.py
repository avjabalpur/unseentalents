import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class ContactMessage(SQLModel, table=True):
    """A message submitted via the public Contact Us form. No email dispatch yet —
    admins review these here; wiring up outbound email is future work."""

    __tablename__ = "contact_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    email: str
    subject: str
    message: str
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
