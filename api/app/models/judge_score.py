import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel, UniqueConstraint


class JudgeScore(SQLModel, table=True):
    __tablename__ = "judge_scores"
    __table_args__ = (UniqueConstraint("submission_id", "judge_id", name="uq_judge_score_submission_judge"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    submission_id: uuid.UUID = Field(foreign_key="submissions.id", index=True)
    judge_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    score: int
    comment: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
