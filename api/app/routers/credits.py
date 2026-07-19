from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser
from app.db import get_db
from app.models.credit_transaction import CreditTransaction
from app.schemas.credit import CreditBalanceRead, CreditTransactionRead

router = APIRouter(prefix="/users/me/credits", tags=["credits"])


@router.get("", response_model=CreditBalanceRead)
async def get_balance(current_user: CurrentUser):
    return CreditBalanceRead(credit_balance=current_user.credit_balance)


@router.get("/transactions", response_model=list[CreditTransactionRead])
async def list_transactions(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.exec(
        select(CreditTransaction)
        .where(CreditTransaction.user_id == current_user.id)
        .order_by(CreditTransaction.created_at.desc())
    )
    return list(result.all())
