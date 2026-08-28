from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, SecretStr
from sqlalchemy.orm import Session as DBSession
from cryptography.fernet import Fernet, InvalidToken

from .auth import get_current_user
from .config import settings
from .database import get_db
from .models import User, ApiKey


router = APIRouter(prefix="/settings", tags=["Settings"])

SUPPORTED_PROVIDERS = ("openai", "anthropic", "gemini", "openrouter")
ProviderName = Literal["openai", "anthropic", "gemini", "openrouter"]


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

class ProviderStatus(BaseModel):
    provider: str
    configured: bool


class SettingsResponse(BaseModel):
    providers: list[ProviderStatus]


class ApiKeyRequest(BaseModel):
    provider: ProviderName
    api_key: SecretStr


class ApiKeyResponse(BaseModel):
    provider: str
    configured: bool


class ApiKeyTestResponse(BaseModel):
    provider: str
    valid: bool


# ---------------------------------------------------------
# GET /settings — status for every supported provider
# ---------------------------------------------------------

@router.get("", response_model=SettingsResponse)
def get_settings(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return which providers the current user has configured a key for.
    Never returns the actual key, encrypted or otherwise.
    """
    configured_providers = {
        row.provider
        for row in db.query(ApiKey.provider)
        .filter(ApiKey.user_id == current_user.id)
        .all()
    }

    return SettingsResponse(
        providers=[
            ProviderStatus(provider=p, configured=p in configured_providers)
            for p in SUPPORTED_PROVIDERS
        ]
    )


# ---------------------------------------------------------
# PUT /settings/api-key — create or replace a key for one provider
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
        existing_api_key.provider = data.provider
        existing_api_key.encrypted_key = encrypted_api_key
    else:
        db.add(
            ApiKey(
                user_id=current_user.id,
                provider=data.provider,
                encrypted_key=encrypted_api_key,
            )
        )

    db.commit()

    return ApiKeyResponse(
        provider=data.provider,
        configured=True,
    )
# ---------------------------------------------------------
# DELETE /settings/api-key/{provider}
# ---------------------------------------------------------

@router.delete("/api-key/{provider}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(
    provider: ProviderName,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_api_key = (
        db.query(ApiKey)
        .filter(
            ApiKey.user_id == current_user.id,
            ApiKey.provider == provider,
        )
        .first()
    )

    if existing_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No API key configured for this provider",
        )

    db.delete(existing_api_key)
    db.commit()


# ---------------------------------------------------------
# POST /settings/api-key/test
# ---------------------------------------------------------

@router.post("/api-key/{provider}/test", response_model=ApiKeyTestResponse)
def test_api_key(
    provider: ProviderName,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify that the user's key for this provider exists and can be
    decrypted. Provider-specific live validation (an actual test call
    to OpenAI/Anthropic/etc.) is added once AI provider integration
    is implemented — see mvp-scope.md, Deliberate Cuts.
    """
    api_key = (
        db.query(ApiKey)
        .filter(
            ApiKey.user_id == current_user.id,
            ApiKey.provider == provider,
        )
        .first()
    )

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No API key configured for this provider",
        )

    decrypt_api_key(api_key.encrypted_key)

    return ApiKeyTestResponse(provider=provider, valid=True)