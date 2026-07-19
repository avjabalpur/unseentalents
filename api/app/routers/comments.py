import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser
from app.db import get_db
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentRead
from app.services import comment_service, submission_service

router = APIRouter(tags=["comments"])


async def _to_read(db: AsyncSession, comment: Comment) -> CommentRead:
    author = await comment_service.get_comment_author(db, comment)
    data = CommentRead.model_validate(comment)
    if author is not None:
        data.author_name = author.name
        data.author_username = author.username
    return data


@router.get("/submissions/{submission_id}/comments", response_model=list[CommentRead])
async def list_comments(submission_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    comments = await comment_service.list_comments(db, submission_id)
    return [await _to_read(db, c) for c in comments]


@router.post("/submissions/{submission_id}/comments", response_model=CommentRead)
async def create_comment(
    submission_id: uuid.UUID,
    payload: CommentCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await submission_service.get_submission_or_404(db, submission_id)
    comment = await comment_service.create_comment(db, submission_id, current_user, payload.content)
    return await _to_read(db, comment)
