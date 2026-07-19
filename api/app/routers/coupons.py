from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.coupon import CouponCreate, CouponRead, CouponRedeemRequest
from app.services import coupon_service

router = APIRouter(prefix="/coupons", tags=["coupons"])


@router.post("", response_model=CouponRead)
async def create_coupon(
    payload: CouponCreate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await coupon_service.create_coupon(db, payload, admin)


@router.get("", response_model=list[CouponRead])
async def list_coupons(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await coupon_service.list_coupons(db)


@router.post("/redeem", response_model=CouponRead)
async def redeem_coupon(payload: CouponRedeemRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await coupon_service.redeem_coupon(db, payload.code, current_user)
