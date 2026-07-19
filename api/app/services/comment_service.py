import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.comment import Comment
from app.models.user import User


async def list_comments(db: AsyncSession, submission_id: uuid.UUID) -> list[Comment]:
    result = await db.exec(
        select(Comment).where(Comment.submission_id == submission_id).order_by(Comment.created_at)
    )
    return list(result.all())


async def create_comment(db: AsyncSession, submission_id: uuid.UUID, user: User, content: str) -> Comment:
    comment = Comment(submission_id=submission_id, user_id=user.id, content=content)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def get_comment_author(db: AsyncSession, comment: Comment) -> User | None:
    return await db.get(User, comment.user_id)
