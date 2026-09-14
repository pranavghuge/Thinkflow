import uuid
from datetime import datetime, timedelta, timezone

import jwt
import redis
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from .config import settings


password_hasher = PasswordHasher()
JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        password_hasher.verify(hashed_password, password)
        return True
    except VerifyMismatchError:
        return False


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=JWT_ALGORITHM,
    )


def create_refresh_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=JWT_ALGORITHM,
    )


def decode_token(
    token: str,
    expected_type: str,
    redis_client: redis.Redis | None = None,
) -> int:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = payload.get("sub")
        token_type = payload.get("type")
        jti = payload.get("jti")

        if user_id is None:
            raise ValueError("Token subject missing")

        if token_type != expected_type:
            raise ValueError("Wrong token type")

        # Revocation is only checked for refresh tokens. Access tokens
        # are short-lived and not individually revocable — a
        # compromised access token remains valid until its natural
        # expiry even after logout, a standard tradeoff of short-lived
        # JWTs.
        #
        # jti may be None for refresh tokens issued before this change
        # was deployed — those tokens simply cannot be revoked and
        # remain valid until natural expiry. This is an accepted,
        # time-bounded transition gap, not an ongoing gap.
        if expected_type == "refresh" and redis_client is not None and jti is not None:
            try:
                if redis_client.exists(f"revoked_refresh:{jti}"):
                    raise ValueError("Token has been revoked")
            except redis.exceptions.RedisError:
                # Fail closed: if revocation status cannot be verified,
                # the refresh token is treated as invalid rather than
                # silently trusted. A Redis outage blocks refreshes
                # rather than silently disabling revocation security.
                raise ValueError("Unable to verify token status")

        return int(user_id)

    except (jwt.InvalidTokenError, ValueError):
        raise ValueError("Invalid or expired token")


def decode_access_token(token: str) -> int:
    return decode_token(token, expected_type="access")


def decode_refresh_token(token: str, redis_client: redis.Redis) -> int:
    return decode_token(token, expected_type="refresh", redis_client=redis_client)


def revoke_refresh_token(token: str, redis_client: redis.Redis) -> None:
    """
    Blacklists a refresh token's jti until its natural expiry, then
    lets Redis's TTL clean it up automatically. Silently does nothing
    if the token is already invalid, expired, or predates jti support
    — an already-unusable or unidentifiable token needs no explicit
    revocation.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.InvalidTokenError:
        return

    jti = payload.get("jti")
    exp = payload.get("exp")

    if jti is None or exp is None:
        return

    now = datetime.now(timezone.utc).timestamp()
    ttl_seconds = int(exp - now)

    if ttl_seconds > 0:
        try:
            redis_client.setex(f"revoked_refresh:{jti}", ttl_seconds, "1")
        except redis.exceptions.RedisError:
            # If Redis is unreachable during logout, the token cannot
            # be blacklisted. It remains valid until natural expiry —
            # the same exposure window as before this feature existed.
            # Logout still proceeds locally regardless (see auth.py).
            pass