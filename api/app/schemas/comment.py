import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.base import CamelModel


class CommentCreate(CamelModel):
    content: str = Field(min_length=1, max_length=2000)


class CommentRead(CamelModel):
    id: uuid.UUID
    submission_id: uuid.UUID
    content: str
    created_at: datetime
    author_name: str | None = None
    author_username: str | None = None
