import logging

from app.db import async_session_factory
from app.services import coupon_service

logger = logging.getLogger(__name__)


async def expire_due_coupons() -> None:
    async with async_session_factory() as db:
        due_coupons = await coupon_service.get_due_expired_coupons(db)
        for coupon in due_coupons:
            try:
                await coupon_service.expire_coupon(db, coupon)
                logger.info("Expired coupon %s", coupon.id)
            except Exception:
                logger.exception("Failed to expire coupon %s", coupon.id)
