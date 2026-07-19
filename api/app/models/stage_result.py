import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel, UniqueConstraint


class StageResult(SQLModel, table=True):
    __tablename__ = "stage_results"
    __table_args__ = (UniqueConstraint("stage_id", "participation_id", name="uq_stage_result_stage_participation"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    stage_id: uuid.UUID = Field(foreign_key="stages.id", index=True)
    participation_id: uuid.UUID = Field(foreign_key="participations.id", index=True)
    vote_count: int = Field(default=0)
    rank: int
    advanced: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
