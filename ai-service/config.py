"""
ILS 2.0 - AI Service Configuration
Centralized configuration management with environment variables
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # ================================
    # Application
    # ================================
    app_name: str = "ILS 2.0 AI Service"
    app_version: str = "2.0.0"
    environment: str = Field(default="production", env="NODE_ENV")
    debug: bool = Field(default=False, env="DEBUG")

    # ================================
    # Server
    # ================================
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8080, env="PORT")
    workers: int = Field(default=2, env="WORKERS")

    # ================================
    # Security
    # ================================
    # JWT_SECRET is required for auth but service can start without it (health checks)
    jwt_secret: str = Field(default="", env="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    cors_origins: list[str] = Field(
        default=["http://localhost:5000", "http://localhost:3000"],
        env="CORS_ORIGINS"
    )

    # ================================
    # Database
    # ================================
    # DATABASE_URL is required for full functionality but service can start without it
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    db_pool_size: int = Field(default=20, env="DB_POOL_MAX")
    db_pool_min: int = Field(default=5, env="DB_POOL_MIN")

    # ================================
    # AI Services - External APIs
    # ================================
    # OPENAI_API_KEY is required for AI features but service can start without it
    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")

    # Default models
    openai_model: str = Field(default="gpt-4-turbo-preview", env="OPENAI_MODEL")
    openai_embedding_model: str = Field(default="text-embedding-3-small", env="OPENAI_EMBEDDING_MODEL")
    anthropic_model: str = Field(default="claude-3-5-sonnet-20241022", env="ANTHROPIC_MODEL")

    # Model preferences
    primary_llm_provider: str = Field(default="openai", env="PRIMARY_LLM_PROVIDER")  # "openai" or "anthropic"
    fallback_llm_provider: str = Field(default="anthropic", env="FALLBACK_LLM_PROVIDER")

    # ================================
    # RAG Configuration
    # ================================
    embedding_dimension: int = 1536  # OpenAI text-embedding-3-small
    rag_top_k: int = Field(default=5, env="RAG_TOP_K")  # Number of relevant documents to retrieve
    rag_similarity_threshold: float = Field(default=0.7, env="RAG_SIMILARITY_THRESHOLD")

    # ================================
    # AI Behavior
    # ================================
    max_context_length: int = Field(default=8000, env="MAX_CONTEXT_LENGTH")
    temperature: float = Field(default=0.7, env="AI_TEMPERATURE")
    max_tokens: int = Field(default=2000, env="MAX_TOKENS")

    # ================================
    # Rate Limiting
    # ================================
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds

    # ================================
    # Logging
    # ================================
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_json: bool = Field(default=True, env="LOG_JSON")

    # ================================
    # Features
    # ================================
    enable_learning: bool = Field(default=True, env="ENABLE_LEARNING")
    enable_feedback: bool = Field(default=True, env="ENABLE_FEEDBACK")
    enable_analytics: bool = Field(default=True, env="ENABLE_ANALYTICS")

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
