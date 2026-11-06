from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    POSTGRES_URL: str = "postgresql+psycopg://user:password@localhost:5432/suntech_db"

    # FastAPI
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"

    # CORS (frontend origins allowed to call this API)
    BACKEND_CORS_ORIGINS: list[str] = Field(default_factory=list)

    # Auth — single-operator (admin) account for the MVP back office.
    # When shared customer/staff accounts arrive, move to a users table
    # with hashed passwords; until then compare_digest against env values.
    SECRET_KEY: str = ""  # empty => ephemeral key (tokens die on restart)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = ""  # empty => nobody can log in (locked by default)

    # Rate limiting (public lead submission)
    RATE_LIMIT_LEAD_CREATE_PER_MINUTE: int = 10

    # Media (admin-uploaded testimonial photos)
    MEDIA_DIR: str = "media"
    MAX_UPLOAD_MB: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
