"""
ILS 2.0 - AI Service Main Application
Production-ready FastAPI application with OpenAI/Anthropic integration and RAG
"""

from fastapi import FastAPI, Depends, HTTPException, status, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import jwt
import uuid

from config import settings
from services.database import init_db, check_db_health
from services.llm_service import llm_service
from services.rag_service import rag_service
from services.ophthalmic_ai_service import ophthalmic_ai_service
from utils.logger import logger

# Security
security = HTTPBearer()


# ================================
# Lifespan Context
# ================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager with graceful startup."""
    import asyncio

    # Startup
    logger.info("Starting ILS 2.0 AI Service...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Primary LLM Provider: {settings.primary_llm_provider}")
    logger.info(f"Database configured: {bool(settings.database_url)}")
    logger.info(f"OpenAI configured: {bool(settings.openai_api_key)}")

    # Initialize database with timeout - don't block startup
    try:
        await asyncio.wait_for(init_db(), timeout=30.0)
        logger.info("Database initialized")
    except asyncio.TimeoutError:
        logger.warning("Database initialization timed out - service will start in degraded mode")
    except Exception as e:
        logger.warning(f"Database initialization failed - service will start in degraded mode: {e}")

    logger.info("AI Service started successfully (may be in degraded mode)")

    yield

    # Shutdown
    logger.info("Shutting down ILS 2.0 AI Service...")


# ================================
# FastAPI App
# ================================

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production AI service for ophthalmic and dispensing domain with RAG",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if not settings.debug else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================
# Request/Response Models
# ================================

class TokenPayload(BaseModel):
    """JWT token payload."""
    tenant_id: str
    user_id: str
    company_id: str
    exp: datetime


class ChatRequest(BaseModel):
    """Chat request."""
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None
    category: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response."""
    answer: str
    conversation_id: Optional[str] = None
    used_external_ai: bool
    confidence: int
    context_used: bool
    sources: List[Dict[str, Any]] = []
    provider: Optional[str] = None
    model: Optional[str] = None
    processing_time_ms: int


class AddKnowledgeRequest(BaseModel):
    """Add knowledge request."""
    content: str = Field(..., min_length=10)
    category: str = Field(..., min_length=1)
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    filename: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        allowed = ["ophthalmic", "dispensing", "business", "general"]
        if v not in allowed:
            raise ValueError(f"category must be one of: {allowed}")
        return v


class ProductRecommendationRequest(BaseModel):
    """Product recommendation request."""
    prescription: Dict[str, Any]
    patient_needs: Optional[str] = None


class BusinessQueryRequest(BaseModel):
    """Business query request."""
    query: str = Field(..., min_length=5)
    query_type: str = Field(..., min_length=1)

    @field_validator("query_type")
    @classmethod
    def validate_query_type(cls, v):
        allowed = ["sales", "inventory", "patient_analytics", "general"]
        if v not in allowed:
            raise ValueError(f"query_type must be one of: {allowed}")
        return v


class FeedbackRequest(BaseModel):
    """Feedback request."""
    message_id: Optional[str] = None
    learning_id: Optional[str] = None
    helpful: bool
    rating: Optional[int] = Field(None, ge=1, le=5)
    comments: Optional[str] = None


# ================================
# Authentication
# ================================

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> TokenPayload:
    """Verify JWT token and extract payload."""
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )

        tenant_id = payload.get("tenant_id") or payload.get("companyId")
        user_id = payload.get("user_id") or payload.get("userId")
        company_id = payload.get("company_id") or payload.get("companyId") or tenant_id

        if not tenant_id or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
            )

        return TokenPayload(
            tenant_id=tenant_id,
            user_id=user_id,
            company_id=company_id,
            exp=datetime.fromtimestamp(exp) if exp else datetime.utcnow() + timedelta(hours=1)
        )

    except jwt.PyJWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


# ================================
# API Endpoints
# ================================

@app.get("/")
@app.get("/health")
async def health_check():
    """
    Health check endpoint. Returns 200 even in degraded mode for Railway.
    This endpoint must ALWAYS return 200 to prevent Railway from killing the service.
    """
    try:
        # Check database with timeout (default 5s)
        db_healthy = await check_db_health(timeout=3.0)
    except Exception as e:
        logger.warning(f"Database health check exception: {e}")
        db_healthy = False

    try:
        llm_available = llm_service.is_available()
    except Exception as e:
        logger.warning(f"LLM availability check exception: {e}")
        llm_available = False

    # Service status - degraded is still operational
    is_healthy = db_healthy and llm_available

    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "healthy" if is_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "llm": "available" if llm_available else "unavailable",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    token: TokenPayload = Depends(verify_jwt_token),
):
    """
    Chat with ophthalmic AI assistant.

    Supports:
    - Ophthalmic knowledge queries
    - Dispensing advice
    - Business insights
    - Product recommendations
    """
    try:
        logger.info(f"Chat request from company {token.company_id}: {request.message[:100]}")

        response = await ophthalmic_ai_service.chat(
            message=request.message,
            company_id=token.company_id,
            conversation_history=request.conversation_history,
            category=request.category,
        )

        # If learning is enabled, save this interaction for future training
        if settings.enable_learning and response.get("confidence", 0) >= 80:
            try:
                await rag_service.add_learned_data(
                    company_id=token.company_id,
                    question=request.message,
                    answer=response["answer"],
                    category=request.category or "general",
                    source_type="conversation",
                    source_id=request.conversation_id,
                    confidence=response["confidence"],
                )
            except Exception as e:
                logger.error(f"Failed to save learned data: {e}")

        return ChatResponse(
            conversation_id=request.conversation_id,
            **response
        )

    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat processing failed",
        )


@app.post("/api/v1/knowledge/add")
async def add_knowledge(
    request: AddKnowledgeRequest,
    token: TokenPayload = Depends(verify_jwt_token),
):
    """Add knowledge to the knowledge base."""
    try:
        result = await rag_service.add_knowledge(
            company_id=token.company_id,
            content=request.content,
            category=request.category,
            summary=request.summary,
            tags=request.tags,
            uploaded_by=token.user_id,
            filename=request.filename,
        )

        return {
            "success": True,
            "message": "Knowledge added successfully",
            "data": result,
        }

    except Exception as e:
        logger.error(f"Add knowledge failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add knowledge",
        )


@app.post("/api/v1/recommendations/product")
async def get_product_recommendation(
    request: ProductRecommendationRequest,
    token: TokenPayload = Depends(verify_jwt_token),
):
    """Get product recommendations based on prescription."""
    try:
        result = await ophthalmic_ai_service.get_product_recommendation(
            company_id=token.company_id,
            prescription=request.prescription,
            patient_needs=request.patient_needs,
        )

        return {
            "success": True,
            "data": result,
        }

    except Exception as e:
        logger.error(f"Product recommendation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendation",
        )


@app.post("/api/v1/business/query")
async def business_query(
    request: BusinessQueryRequest,
    token: TokenPayload = Depends(verify_jwt_token),
):
    """Query business analytics."""
    try:
        result = await ophthalmic_ai_service.analyze_business_query(
            company_id=token.company_id,
            query=request.query,
            query_type=request.query_type,
        )

        return {
            "success": True,
            "data": result,
        }

    except Exception as e:
        logger.error(f"Business query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process business query",
        )


@app.post("/api/v1/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    token: TokenPayload = Depends(verify_jwt_token),
):
    """Submit feedback on AI responses."""
    try:
        # Update learning metrics if learning_id provided
        if request.learning_id and settings.enable_feedback:
            await rag_service.update_learning_metrics(
                learning_id=request.learning_id,
                was_helpful=request.helpful,
            )

        return {
            "success": True,
            "message": "Feedback recorded",
        }

    except Exception as e:
        logger.error(f"Feedback submission failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record feedback",
        )


@app.get("/api/v1/learning/progress")
async def get_learning_progress(token: TokenPayload = Depends(verify_jwt_token)):
    """Get learning progress for the company."""
    try:
        progress = await rag_service.get_company_learning_progress(token.company_id)

        return {
            "success": True,
            "data": progress,
        }

    except Exception as e:
        logger.error(f"Get learning progress failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get learning progress",
        )


@app.get("/api/v1/system/health")
async def system_health(token: TokenPayload = Depends(verify_jwt_token)):
    """Get system health status."""
    try:
        db_health = await check_db_health()
        llm_health = await llm_service.check_health()

        return {
            "success": True,
            "data": {
                "database": db_health,
                "llm_services": llm_health,
                "timestamp": datetime.utcnow().isoformat(),
            },
        }

    except Exception as e:
        logger.error(f"System health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check system health",
        )


# ================================
# Admin Endpoints (for testing)
# ================================

@app.post("/api/v1/admin/generate-token")
async def generate_test_token(company_id: str, user_id: str):
    """Generate JWT token for testing (disable in production)."""
    if settings.environment == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin endpoints disabled in production",
        )

    payload = {
        "company_id": company_id,
        "tenant_id": company_id,
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=1),
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 3600,
    }


# ================================
# Error Handlers
# ================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "message": str(exc) if settings.debug else "An error occurred",
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
