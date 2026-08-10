from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    # Database (SQLAlchemy-style URL, e.g. postgresql://user:pass@host/db?sslmode=require)
    database_url: str = ""

    # Auth
    jwt_secret: str = "change-me-please-use-a-long-random-string-in-production"
    jwt_expiration_minutes: int = 1440
    jwt_issuer: str = "knowledgepulse-ai"

    # Gemini
    gemini_api_key: str = ""
    gemini_chat_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    embedding_dimensions: int = 768

    # Cloudinary
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    cloudinary_folder: str = "knowledgepulse"

    # CORS + admin seed
    cors_allowed_origins: str = "*"
    admin_email: str = ""
    admin_password: str = ""

    # RAG
    chunk_size: int = 900
    chunk_overlap: int = 150
    top_k: int = 5
    similarity_threshold: float = 0.20

    @property
    def sqlalchemy_url(self) -> str:
        u = (self.database_url or "").strip()
        if u.startswith("jdbc:"):
            u = u[len("jdbc:"):]
        if u.startswith("postgres://"):
            u = "postgresql://" + u[len("postgres://"):]
        return u

    @property
    def cors_origins(self) -> list[str]:
        raw = (self.cors_allowed_origins or "").strip()
        if not raw or raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]


@lru_cache
def get_settings() -> "Settings":
    return Settings()
