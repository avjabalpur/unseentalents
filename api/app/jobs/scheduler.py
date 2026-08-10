import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.jobs.coupon_expiry_job import expire_due_coupons
from app.jobs.stage_close_job import close_due_stages
from app.jobs.thumbnail_sweep_job import sweep_pending_thumbnails

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def start_scheduler() -> None:
    scheduler.add_job(close_due_stages, "interval", seconds=60, id="close_due_stages", replace_existing=True)
    scheduler.add_job(
        sweep_pending_thumbnails, "interval", seconds=120, id="sweep_pending_thumbnails", replace_existing=True
    )
    scheduler.add_job(
        expire_due_coupons, "interval", seconds=300, id="expire_due_coupons", replace_existing=True
    )
    scheduler.start()
    logger.info("APScheduler started: stage-close (60s) + thumbnail-sweep (120s) + coupon-expiry (300s)")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
