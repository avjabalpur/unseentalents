import uuid

from fastapi import status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.credit_transaction import CreditTransaction
from app.models.enums import CreditTransactionType
from app.models.user import User
from app.services import activity_log_service


async def grant_credit(
    db: AsyncSession,
    user: User,
    amount: int,
    transaction_type: CreditTransactionType,
    reference_id: uuid.UUID | None = None,
    actor_id: uuid.UUID | None = None,
) -> CreditTransaction:
    user.credit_balance += amount
    db.add(user)
    transaction = CreditTransaction(
        user_id=user.id,
        amount=amount,
        balance_after=user.credit_balance,
        type=transaction_type,
        reference_id=reference_id,
    )
    db.add(transaction)
    await db.flush()
    if transaction_type == CreditTransactionType.ADMIN_GRANT:
        activity_log_service.record(
            db, "USER", user.id, "CREDIT_GRANTED", actor_id=actor_id, metadata={"amount": amount}
        )
    return transaction


async def spend_upload_credit(db: AsyncSession, user: User, reference_id: uuid.UUID) -> CreditTransaction:
    if user.credit_balance < 1:
        raise AppError(
            "INSUFFICIENT_CREDITS",
            "You don't have enough credits to upload a submission. Redeem a coupon or purchase more credits.",
            status.HTTP_402_PAYMENT_REQUIRED,
        )
    return await grant_credit(db, user, -1, CreditTransactionType.UPLOAD_SPEND, reference_id)
