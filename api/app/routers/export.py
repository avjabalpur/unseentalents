import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.services import credit_service, submission_service, user_service

router = APIRouter(prefix="/admin/export", tags=["export"])


def _csv_response(filename: str, header: list[str], rows: list[list]) -> StreamingResponse:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    writer.writerows(rows)
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/users")
async def export_users(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    users = await user_service.list_users(db)
    rows = [
        [u.id, u.name, u.username, u.email, u.role.value, u.status.value, u.credit_balance, u.created_at]
        for u in users
    ]
    return _csv_response(
        "users.csv", ["id", "name", "username", "email", "role", "status", "credit_balance", "created_at"], rows
    )


@router.get("/submissions")
async def export_submissions(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    submissions = await submission_service.list_all_submissions(db)
    rows = []
    for s in submissions:
        vote_count = await submission_service.count_votes(db, s.id)
        owner = await submission_service.get_owner(db, s)
        rows.append(
            [
                s.id,
                s.title or "",
                s.status.value,
                s.media_type.value,
                vote_count,
                owner.username if owner else "",
                s.uploaded_at,
            ]
        )
    return _csv_response(
        "submissions.csv",
        ["id", "title", "status", "media_type", "vote_count", "owner_username", "uploaded_at"],
        rows,
    )


@router.get("/credits")
async def export_credit_transactions(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    transactions = await credit_service.list_all_transactions(db)
    rows = [
        [t.id, t.user_id, t.amount, t.balance_after, t.type.value, t.created_at] for t in transactions
    ]
    return _csv_response(
        "credit_transactions.csv", ["id", "user_id", "amount", "balance_after", "type", "created_at"], rows
    )
