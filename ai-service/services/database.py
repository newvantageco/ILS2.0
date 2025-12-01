"""
Database connection and management
Handles PostgreSQL with pgvector extension

NOTE: This module uses lazy initialization to allow the service to start
even if DATABASE_URL is not configured. Health checks will return False
and database operations will fail gracefully.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text, Column, Integer, String, Text, Boolean, TIMESTAMP, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
import uuid
from datetime import datetime

from config import settings
from utils.logger import logger

# Lazy initialization - engine and session factory created only when needed
_engine = None
_async_session_local = None
_db_available = False

def _get_engine():
    """Get or create the async engine (lazy initialization)."""
    global _engine, _db_available
    if _engine is None:
        if not settings.database_url:
            logger.warning("DATABASE_URL not configured. Database operations unavailable.")
            _db_available = False
            return None
        try:
            _engine = create_async_engine(
                settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
                pool_size=settings.db_pool_size,
                max_overflow=10,
                pool_pre_ping=True,
                echo=settings.debug,
            )
            _db_available = True
        except Exception as e:
            logger.error(f"Failed to create database engine: {e}")
            _db_available = False
            return None
    return _engine

def _get_session_factory():
    """Get or create the async session factory (lazy initialization)."""
    global _async_session_local
    if _async_session_local is None:
        engine = _get_engine()
        if engine is None:
            return None
        _async_session_local = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _async_session_local

def is_db_configured() -> bool:
    """Check if database is configured."""
    return bool(settings.database_url)

Base = declarative_base()


# ================================
# Database Models
# ================================

class AIKnowledgeBase(Base):
    """AI Knowledge Base entries with vector embeddings."""
    __tablename__ = "aiKnowledgeBase"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    companyId = Column(UUID(as_uuid=True), nullable=False, index=True)
    uploadedBy = Column(UUID(as_uuid=True), nullable=True)

    # Content
    filename = Column(String(500), nullable=True)
    fileType = Column(String(100), nullable=True)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)

    # Categorization
    category = Column(String(100), nullable=True, index=True)
    tags = Column(JSON, nullable=True)

    # Vector embedding
    embedding = Column(Vector(1536), nullable=True)

    # Metadata
    isActive = Column(Boolean, default=True)
    processingStatus = Column(String(50), default="completed")

    # Timestamps
    createdAt = Column(TIMESTAMP, default=datetime.utcnow)
    updatedAt = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class AILearningData(Base):
    """Learning data from conversations and feedback."""
    __tablename__ = "aiLearningData"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    companyId = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Source
    sourceType = Column(String(50), nullable=False)  # conversation, document, feedback, manual
    sourceId = Column(UUID(as_uuid=True), nullable=True)

    # Content
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)

    # Vector embedding for question
    embedding = Column(Vector(1536), nullable=True)

    # Metrics
    useCount = Column(Integer, default=0)
    successRate = Column(Integer, default=100)
    lastUsed = Column(TIMESTAMP, nullable=True)

    # Validation
    confidence = Column(Integer, default=100)
    isValidated = Column(Boolean, default=False)
    validatedBy = Column(UUID(as_uuid=True), nullable=True)
    validatedAt = Column(TIMESTAMP, nullable=True)

    # Timestamps
    createdAt = Column(TIMESTAMP, default=datetime.utcnow)
    updatedAt = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class AIConversation(Base):
    """AI conversations."""
    __tablename__ = "aiConversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    companyId = Column(UUID(as_uuid=True), nullable=False, index=True)
    userId = Column(UUID(as_uuid=True), nullable=False)

    title = Column(String(500), nullable=True)
    status = Column(String(50), default="active")
    context = Column(JSON, nullable=True)

    createdAt = Column(TIMESTAMP, default=datetime.utcnow)
    updatedAt = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class AIMessage(Base):
    """Individual messages in conversations."""
    __tablename__ = "aiMessages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversationId = Column(UUID(as_uuid=True), nullable=False, index=True)

    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)

    usedExternalAi = Column(Boolean, default=True)
    confidence = Column(Integer, nullable=True)
    # Use 'message_metadata' in Python, but 'metadata' in database (SQLAlchemy reserves 'metadata')
    message_metadata = Column('metadata', JSON, nullable=True)

    createdAt = Column(TIMESTAMP, default=datetime.utcnow)


# ================================
# Database Functions
# ================================

async def init_db():
    """Initialize database and ensure pgvector extension is enabled."""
    if not is_db_configured():
        logger.warning("Skipping database initialization - DATABASE_URL not configured")
        return

    engine = _get_engine()
    if engine is None:
        logger.warning("Skipping database initialization - engine not available")
        return

    try:
        async with engine.begin() as conn:
            # Enable pgvector extension
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

            # Create tables if they don't exist (in production, use migrations)
            # await conn.run_sync(Base.metadata.create_all)

        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        # Don't raise - allow service to start in degraded mode


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session context manager."""
    session_factory = _get_session_factory()
    if session_factory is None:
        raise RuntimeError("Database not configured. Set DATABASE_URL environment variable.")

    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_health(timeout: float = 5.0) -> bool:
    """
    Check database health with timeout.

    Args:
        timeout: Maximum seconds to wait for health check (default 5s)

    Returns:
        True if database is healthy, False otherwise
    """
    import asyncio

    if not is_db_configured():
        return False

    engine = _get_engine()
    if engine is None:
        return False

    try:
        # Use asyncio.wait_for to prevent hanging on slow database connections
        async def _check():
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return True

        return await asyncio.wait_for(_check(), timeout=timeout)
    except asyncio.TimeoutError:
        logger.warning(f"Database health check timed out after {timeout}s")
        return False
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
