from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, SecretStr
from sqlalchemy.orm import Session as DBSession
from cryptography.fernet import Fernet, InvalidToken

from .auth import get_current_user
from .config import settings
from .database import get_db
from .models import User, ApiKey


router = APIRouter(prefix="/settings", tags=["Settings"])


ACTIVE_PROVIDER = "gemini"


# ---------------------------------------------------------
# Encryption
# ---------------------------------------------------------

def get_fernet() -> Fernet:
    """
    Create the Fernet encryption service using the server-side
    encryption key. This key must never change once real API keys
    have been encrypted with it — rotating it makes every stored
    key permanently undecryptable.
    """
    return Fernet(settings.api_key_encryption_key.encode("utf-8"))


def encrypt_api_key(api_key: str) -> str:
    return get_fernet().encrypt(api_key.encode("utf-8")).decode("utf-8")


def decrypt_api_key(encrypted_api_key: str) -> str:
    try:
        return get_fernet().decrypt(encrypted_api_key.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored API key could not be decrypted",
        )


# ---------------------------------------------------------
# Schemas
# ---------------------------------------------------------

class SettingsResponse(BaseModel):
    provider: str
    configured: bool


class ApiKeyRequest(BaseModel):
    api_key: SecretStr


class ApiKeyResponse(BaseModel):
    provider: str
    configured: bool


class ApiKeyTestResponse(BaseModel):
    provider: str
    valid: bool


# ---------------------------------------------------------
# GET /settings — status for the active provider
# ---------------------------------------------------------

@router.get("", response_model=SettingsResponse)
def get_settings(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    api_key = (
        db.query(ApiKey)
        .filter(
            ApiKey.user_id == current_user.id,
            ApiKey.provider == ACTIVE_PROVIDER,
        )
        .first()
    )

    return SettingsResponse(
        provider=ACTIVE_PROVIDER,
        configured=api_key is not None,
    )


# ---------------------------------------------------------
# PUT /settings/api-key — create or replace the Gemini key
# ---------------------------------------------------------

@router.put("/api-key", response_model=ApiKeyResponse)
def save_api_key(
    data: ApiKeyRequest,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raw_api_key = data.api_key.get_secret_value().strip()

    if not raw_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key cannot be empty",
        )

    encrypted_api_key = encrypt_api_key(raw_api_key)

    existing_api_key = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == current_user.id)
        .first()
    )

    if existing_api_key:
        # API key exists → UPDATE
        existing_api_key.encrypted_key = encrypted_api_key
        existing_api_key.provider = ACTIVE_PROVIDER

    else:
        # API key does not exist → INSERT
        new_api_key = ApiKey(
            user_id=current_user.id,
            provider=ACTIVE_PROVIDER,
            encrypted_key=encrypted_api_key,
        )

        db.add(new_api_key)

    db.commit()

    return ApiKeyResponse(
        provider=ACTIVE_PROVIDER,
        configured=True,
    )


# ---------------------------------------------------------
# DELETE /settings/api-key
# ---------------------------------------------------------

@router.delete("/api-key", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_api_key = (
        db.query(ApiKey)
        .filter(
            ApiKey.user_id == current_user.id,
            ApiKey.provider == ACTIVE_PROVIDER,
        )
        .first()
    )

    if existing_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No API key configured",
        )

    db.delete(existing_api_key)
    db.commit()


# ---------------------------------------------------------
# POST /settings/api-key/test
# ---------------------------------------------------------

@router.post("/api-key/test", response_model=ApiKeyTestResponse)
def test_api_key(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    api_key = (
        db.query(ApiKey)
        .filter(
            ApiKey.user_id == current_user.id,
            ApiKey.provider == ACTIVE_PROVIDER,
        )
        .first()
    )

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No API key configured",
        )

    decrypt_api_key(api_key.encrypted_key)

    return ApiKeyTestResponse(provider=ACTIVE_PROVIDER, valid=True)