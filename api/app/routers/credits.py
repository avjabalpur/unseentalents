from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser
from app.db import get_db
from app.schemas.credit import CreditBalanceRead, CreditTransactionRead
from app.services import credit_service

router = APIRouter(prefix="/users/me/credits", tags=["credits"])


@router.get("", response_model=CreditBalanceRead)
async def get_balance(current_user: CurrentUser):
    return CreditBalanceRead(credit_balance=current_user.credit_balance)


@router.get("/transactions", response_model=list[CreditTransactionRead])
async def list_transactions(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await credit_service.list_transactions_for_user(db, current_user.id)
