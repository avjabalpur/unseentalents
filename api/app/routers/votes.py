import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser
from app.core.rate_limit import rate_limiter
from app.db import get_db
from app.schemas.vote import VoteRead
from app.services import submission_service, vote_service

router = APIRouter(tags=["votes"])

_vote_rate_limit = rate_limiter("vote", limit=30, window_seconds=60)


@router.post("/submissions/{submission_id}/votes", response_model=VoteRead)
async def cast_vote(
    submission_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(_vote_rate_limit),
):
    submission = await submission_service.get_submission_or_404(db, submission_id)
    return await vote_service.cast_vote(db, submission, current_user)
