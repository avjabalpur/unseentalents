import uuid

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.coupon import CouponCreate, CouponRead, CouponRedeemRequest, CouponUpdate
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
    limit: int | None = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await coupon_service.list_coupons(db, limit=limit, offset=offset)


@router.patch("/{coupon_id}", response_model=CouponRead)
async def update_coupon(
    coupon_id: uuid.UUID,
    payload: CouponUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    coupon = await coupon_service.get_coupon_or_404(db, coupon_id)
    return await coupon_service.update_coupon(db, coupon, payload, actor_id=admin.id)


@router.post("/redeem", response_model=CouponRead)
async def redeem_coupon(payload: CouponRedeemRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await coupon_service.redeem_coupon(db, payload.code, current_user)
