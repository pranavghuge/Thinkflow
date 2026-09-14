import redis
from fastapi import HTTPException, status

from .config import settings


def enforce_gemini_rate_limit(user_id: int, redis_client: redis.Redis) -> None:
    """
    Shared rate limit across every Gemini-calling action for a user:
    custom problem generation, approach evaluation, and lazy hint
    generation. Fixed-window counter in Redis.

    Fails OPEN on Redis errors — unlike token revocation, this is an
    abuse-prevention control, not a security boundary. If Redis is
    unreachable, requests proceed unlimited rather than blocking all
    AI features, matching pre-Redis behavior.
    """
    key = f"gemini_rate:{user_id}"

    try:
        current_count = redis_client.incr(key)

        if current_count == 1:
            redis_client.expire(key, settings.gemini_rate_limit_window_seconds)

        if current_count > settings.gemini_rate_limit_max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Rate limit exceeded: max "
                    f"{settings.gemini_rate_limit_max_requests} AI requests "
                    f"per {settings.gemini_rate_limit_window_seconds // 60} "
                    f"minutes. Please wait and try again."
                ),
            )

    except redis.exceptions.RedisError:
        # Fail open: proceed without rate limiting if Redis is down.
        pass