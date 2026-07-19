import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel

from app.models.enums import CreditTransactionType


class CreditTransaction(SQLModel, table=True):
    __tablename__ = "credit_transactions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    amount: int
    balance_after: int
    type: CreditTransactionType
    reference_id: uuid.UUID | None = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True), index=True
    )
