from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_db
from app.schemas.winner import WinnerRead
from app.services import winner_service

router = APIRouter(tags=["winners"])


@router.get("/winners", response_model=list[WinnerRead])
async def list_winners(
    limit: int | None = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await winner_service.list_winners(db, limit=limit, offset=offset)
