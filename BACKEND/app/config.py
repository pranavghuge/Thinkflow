from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str
    jwt_secret_key: str
    access_token_expire_minutes: int = 30
    environment: str = "development"
    cors_origins: str = "http://localhost:3000"


settings = Settings()