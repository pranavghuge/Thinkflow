from datetime import datetime,timedelta,timezone


import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from .config import settings

password_hasher = PasswordHasher()
JWT_ALGORITHM="HS256"

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
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=JWT_ALGORITHM,
    )    

def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise ValueError("Token subject missing")

        return int(user_id)

    except (jwt.InvalidTokenError, ValueError):
        raise ValueError("Invalid or expired token")