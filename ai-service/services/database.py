"""
Database connection and management
Handles PostgreSQL with pgvector extension
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text, Column, Integer, String, Text, Boolean, TIMESTAMP, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import uuid
from datetime import datetime

from config import settings
from utils.logger import logger

# Create async engine
engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    pool_size=settings.db_pool_size,
    max_overflow=10,
    pool_pre_ping=True,
    echo=settings.debug,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

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
    metadata = Column(JSON, nullable=True)

    createdAt = Column(TIMESTAMP, default=datetime.utcnow)


# ================================
# Database Functions
# ================================

async def init_db():
    """Initialize database and ensure pgvector extension is enabled."""
    try:
        async with engine.begin() as conn:
            # Enable pgvector extension
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

            # Create tables if they don't exist (in production, use migrations)
            # await conn.run_sync(Base.metadata.create_all)

        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session context manager."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_health() -> bool:
    """Check database health."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
