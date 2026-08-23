import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.errors import AppError, app_error_handler, validation_error_handler
from app.jobs.scheduler import start_scheduler, stop_scheduler
from app.routers import (
    activity,
    announcements,
    auth,
    comments,
    contact,
    coupons,
    credits,
    event_types,
    events,
    export,
    judge_scores,
    organizer_applications,
    organizers,
    prizes,
    reports,
    settings as settings_router,
    slides,
    stages,
    stats,
    submissions,
    topics,
    users,
    votes,
    winners,
)
from app.seed import run_migrations, seed_initial_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Running database migrations...")
    await asyncio.to_thread(run_migrations)
    logger.info("Seeding initial data...")
    await seed_initial_data()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)

settings.storage_root.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(settings.storage_root)), name="media")

# Deliberately not mounted as static — private_storage holds files (e.g. organizer
# identity documents) that must only ever be served through an authenticated route.
settings.private_storage_root.mkdir(parents=True, exist_ok=True)

for router in (
    announcements.router,
    auth.router,
    users.router,
    credits.router,
    coupons.router,
    event_types.router,
    events.router,
    stages.router,
    prizes.router,
    submissions.router,
    votes.router,
    topics.router,
    slides.router,
    contact.router,
    comments.router,
    stats.router,
    activity.router,
    reports.router,
    settings_router.router,
    export.router,
    organizer_applications.router,
    judge_scores.router,
    winners.router,
    organizers.router,
):
    app.include_router(router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    return {"status": "ok"}
