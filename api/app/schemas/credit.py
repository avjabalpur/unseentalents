import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import CreditTransactionType
from app.schemas.base import CamelModel


class CreditBalanceRead(CamelModel):
    credit_balance: int


class CreditTransactionRead(CamelModel):
    id: uuid.UUID
    amount: int
    balance_after: int
    type: CreditTransactionType
    created_at: datetime


class AdminGrantCreditRequest(CamelModel):
    amount: int = Field(gt=0)
