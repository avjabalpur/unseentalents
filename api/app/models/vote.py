import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel, UniqueConstraint


class Vote(SQLModel, table=True):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("submission_id", "voter_user_id", "stage_id", name="uq_vote_submission_voter_stage"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    submission_id: uuid.UUID = Field(foreign_key="submissions.id", index=True)
    voter_user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    stage_id: uuid.UUID = Field(foreign_key="stages.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
