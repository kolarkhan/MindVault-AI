"""
Centralized application configuration.

All settings are read from environment variables (via a `.env` file in development).
Nothing sensitive is ever hardcoded here — see `.env.example` for the full list of
variables this app understands.
"""
from functools import lru_cache
from typing import List, Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---
    app_name: str = "MindVault AI"
    environment: Literal["development", "production", "test"] = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    # --- Auth ---
    jwt_secret_key: str = "change-me-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    # --- Database ---
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "mindvault_ai"
    vector_index_name: str = "memory_vector_index"

    # --- AI provider ---
    ai_provider: Literal["openai", "mock"] = "openai"
    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_vision_model: str = "gpt-4o-mini"

    # --- Storage ---
    storage_backend: Literal["local", "s3"] = "local"
    local_storage_dir: str = "storage/uploads"
    max_upload_size_mb: int = 20

    s3_endpoint_url: str = ""
    s3_bucket_name: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_region: str = "us-east-1"

    # --- CORS ---
    cors_origins: str = "*"

    @property
    def cors_origin_list(self) -> List[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def ai_effective_provider(self) -> str:
        """Fall back to mock mode automatically when no API key is configured.

        This is a deliberate safety choice from the product spec: the app must never
        silently fabricate data, but it also must never be blocked from running just
        because a key hasn't been added yet. Mock mode is clearly labeled wherever its
        output surfaces.
        """
        if self.ai_provider == "openai" and not self.openai_api_key:
            return "mock"
        return self.ai_provider


@lru_cache
def get_settings() -> Settings:
    return Settings()
