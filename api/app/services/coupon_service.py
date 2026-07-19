from datetime import datetime, timezone

from fastapi import status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.coupon import Coupon, CouponRedemption
from app.models.enums import CouponStatus, CreditTransactionType
from app.models.user import User
from app.schemas.coupon import CouponCreate
from app.services.credit_service import grant_credit


async def create_coupon(db: AsyncSession, data: CouponCreate, admin: User) -> Coupon:
    existing = await db.exec(select(Coupon).where(Coupon.code == data.code))
    if existing.first() is not None:
        raise AppError("COUPON_CODE_TAKEN", "A coupon with this code already exists.", status.HTTP_409_CONFLICT)

    coupon = Coupon(**data.model_dump(), created_by=admin.id)
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon


async def list_coupons(db: AsyncSession) -> list[Coupon]:
    result = await db.exec(select(Coupon).order_by(Coupon.created_at.desc()))
    return list(result.all())


async def redeem_coupon(db: AsyncSession, code: str, user: User) -> Coupon:
    result = await db.exec(select(Coupon).where(Coupon.code == code))
    coupon = result.first()
    if coupon is None:
        raise AppError("COUPON_NOT_FOUND", "Invalid coupon code.", status.HTTP_404_NOT_FOUND)
    if coupon.status != CouponStatus.ACTIVE:
        raise AppError("COUPON_INACTIVE", "This coupon is no longer active.", status.HTTP_400_BAD_REQUEST)
    if coupon.expires_at and coupon.expires_at < datetime.now(timezone.utc):
        raise AppError("COUPON_EXPIRED", "This coupon has expired.", status.HTTP_400_BAD_REQUEST)
    if coupon.redemptions_count >= coupon.max_redemptions:
        raise AppError("COUPON_EXHAUSTED", "This coupon has reached its redemption limit.", status.HTTP_400_BAD_REQUEST)

    redemption = CouponRedemption(coupon_id=coupon.id, user_id=user.id)
    db.add(redemption)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise AppError(
            "COUPON_ALREADY_REDEEMED", "You've already redeemed this coupon.", status.HTTP_409_CONFLICT
        ) from exc

    coupon.redemptions_count += 1
    db.add(coupon)
    await grant_credit(db, user, coupon.credit_value, CreditTransactionType.COUPON_REDEEM, reference_id=coupon.id)
    await db.commit()
    await db.refresh(coupon)
    return coupon
