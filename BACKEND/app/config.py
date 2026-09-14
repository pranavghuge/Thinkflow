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
    refresh_token_expire_days: int = 30
    api_key_encryption_key: str
    redis_host: str = "localhost"
    redis_port: int = 6379
    gemini_rate_limit_max_requests: int = 20
    gemini_rate_limit_window_seconds: int = 600
    environment: str = "development"
    cors_origins: str = "http://localhost:3000"


settings = Settings()