import logging

from fastapi import Request, status

from app.core.errors import AppError
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)


def rate_limiter(key_prefix: str, limit: int, window_seconds: int):
    """Redis-backed fixed-window rate limit, keyed by client IP.

    Fails open (allows the request) if Redis is unreachable, so a cache
    outage never blocks core functionality — this is abuse protection, not
    a correctness guarantee.
    """

    async def _dependency(request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate:{key_prefix}:{client_ip}"
        try:
            redis = get_redis()
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, window_seconds)
            if count > limit:
                raise AppError(
                    "RATE_LIMITED", "Too many requests — please slow down.", status.HTTP_429_TOO_MANY_REQUESTS
                )
        except AppError:
            raise
        except Exception:
            logger.warning("Rate limiter backend unavailable, failing open for key=%s", key)

    return _dependency
