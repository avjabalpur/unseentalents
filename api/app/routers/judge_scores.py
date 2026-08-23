import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser
from app.db import get_db
from app.schemas.judge_score import JudgeScoreRead, JudgeScoreSubmit
from app.services import judge_score_service, submission_service

router = APIRouter(tags=["judge-scores"])


@router.post("/submissions/{submission_id}/judge-score", response_model=JudgeScoreRead)
async def submit_judge_score(
    submission_id: uuid.UUID,
    payload: JudgeScoreSubmit,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    submission = await submission_service.get_submission_or_404(db, submission_id)
    judge_score = await judge_score_service.submit_score(
        db, submission, current_user, payload.score, payload.comment
    )
    return await judge_score_service.to_read(db, judge_score)


@router.get("/submissions/{submission_id}/judge-scores", response_model=list[JudgeScoreRead])
async def list_judge_scores(submission_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    scores = await judge_score_service.list_scores_for_submission(db, submission_id)
    return [await judge_score_service.to_read(db, s) for s in scores]
