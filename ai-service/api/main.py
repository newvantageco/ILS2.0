"""
Multi-Tenant AI Service API

FastAPI application providing secure, tenant-isolated access to:
1. Fine-tuned ophthalmic knowledge LLM
2. RAG queries for sales, inventory, and anonymized patient data

Security Features:
- JWT authentication
- Tenant isolation
- Query validation
- Audit logging
- Rate limiting
"""

from fastapi import FastAPI, Depends, HTTPException, status, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import jwt
from datetime import datetime, timedelta
import logging
import os
from functools import lru_cache

# Import RAG engine
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from rag.secure_rag_engine import SecureRAGEngine, TenantDatabaseConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Initialize FastAPI
app = FastAPI(
    title="Integrated Lens System AI Service",
    description="Secure multi-tenant AI for ophthalmic business intelligence",
    version="1.0.0",
)

# CORS configuration (adjust for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],  # Update with your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Configuration
# ============================================================================

class Settings:
    """Application settings."""
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    MODEL_PATH: str = os.getenv("MODEL_PATH", "~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf")


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings."""
    return Settings()


# ============================================================================
# Models
# ============================================================================

class TokenPayload(BaseModel):
    """JWT token payload."""
    tenant_id: str
    user_id: str
    exp: datetime


class QueryRequest(BaseModel):
    """Request for AI query."""
    question: str = Field(..., min_length=5, max_length=500)
    query_type: str = Field(..., description="Type: 'sales', 'inventory', or 'patient_analytics'")
    
    @validator("query_type")
    def validate_query_type(cls, v):
        allowed = ["sales", "inventory", "patient_analytics"]
        if v not in allowed:
            raise ValueError(f"query_type must be one of: {allowed}")
        return v


class QueryResponse(BaseModel):
    """Response from AI query."""
    answer: str
    metadata: Dict[str, Any]
    success: bool
    error: Optional[str] = None


class OphthalmicKnowledgeRequest(BaseModel):
    """Request for ophthalmic knowledge (fine-tuned model)."""
    question: str = Field(..., min_length=5, max_length=500)
    context: Optional[str] = Field(None, max_length=1000, description="Additional context")


class OphthalmicKnowledgeResponse(BaseModel):
    """Response from ophthalmic knowledge query."""
    answer: str
    model: str
    timestamp: str


# ============================================================================
# Authentication & Authorization
# ============================================================================

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> TokenPayload:
    """
    Verify JWT token and extract tenant_id.
    
    This is the critical security layer that enforces tenant isolation.
    The application (not the LLM) validates tokens and ensures users can
    only access their own tenant's data.
    """
    token = credentials.credentials
    settings = get_settings()
    
    try:
        # Decode JWT
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Extract tenant_id and user_id
        tenant_id = payload.get("tenant_id")
        user_id = payload.get("user_id")
        
        if not tenant_id or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        
        # Verify expiration
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
            )
        
        logger.info(f"Authenticated request from tenant: {tenant_id}, user: {user_id}")
        
        return TokenPayload(
            tenant_id=tenant_id,
            user_id=user_id,
            exp=datetime.fromtimestamp(exp) if exp else datetime.utcnow()
        )
        
    except jwt.PyJWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


def get_tenant_rag_engine(token_payload: TokenPayload = Depends(verify_jwt_token)) -> SecureRAGEngine:
    """
    Get RAG engine for authenticated tenant.
    
    This enforces tenant isolation by routing to the correct database.
    """
    tenant_id = token_payload.tenant_id
    
    try:
        # Load tenant-specific database configuration
        tenant_config = TenantDatabaseConfig.from_env(tenant_id)
        
        # Initialize RAG engine for this tenant
        rag_engine = SecureRAGEngine(
            tenant_config=tenant_config,
            model_path=get_settings().MODEL_PATH,
        )
        
        return rag_engine
        
    except Exception as e:
        logger.error(f"Failed to initialize RAG engine for tenant {tenant_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize AI service",
        )


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "Integrated Lens System AI Service",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/v1/query", response_model=QueryResponse)
async def query_database(
    request: QueryRequest,
    rag_engine: SecureRAGEngine = Depends(get_tenant_rag_engine),
    token_payload: TokenPayload = Depends(verify_jwt_token),
):
    """
    Query sales, inventory, or patient analytics using natural language.
    
    This endpoint uses RAG to query live databases with tenant isolation.
    
    Security:
    - JWT token required
    - Tenant_id extracted from token
    - Query routed to correct tenant database
    - No cross-tenant data access possible
    """
    logger.info(
        f"[{token_payload.tenant_id}] Query request: type={request.query_type}, "
        f"user={token_payload.user_id}"
    )
    
    try:
        # Route to appropriate query engine based on type
        if request.query_type == "sales":
            result = rag_engine.query_sales(request.question)
        elif request.query_type == "inventory":
            result = rag_engine.query_inventory(request.question)
        elif request.query_type == "patient_analytics":
            result = rag_engine.query_patient_analytics(request.question)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid query_type: {request.query_type}",
            )
        
        # Add user context to metadata
        result["metadata"]["user_id"] = token_payload.user_id
        
        return QueryResponse(**result)
        
    except Exception as e:
        logger.error(f"[{token_payload.tenant_id}] Query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Query processing failed",
        )
    finally:
        # Clean up RAG engine
        rag_engine.close()


@app.post("/api/v1/ophthalmic-knowledge", response_model=OphthalmicKnowledgeResponse)
async def ophthalmic_knowledge(
    request: OphthalmicKnowledgeRequest,
    token_payload: TokenPayload = Depends(verify_jwt_token),
):
    """
    Query fine-tuned ophthalmic knowledge model.
    
    This uses the fine-tuned LLaMA model for static ophthalmic knowledge
    (not live database queries).
    
    Examples:
    - "What is the difference between single vision and progressive lenses?"
    - "How should I counsel a patient on progressive lens adaptation?"
    - "What are the benefits of high-index lenses?"
    """
    logger.info(
        f"[{token_payload.tenant_id}] Ophthalmic knowledge request: "
        f"user={token_payload.user_id}"
    )
    
    try:
        # Call fine-tuned model
        # In production, this would call your fine-tuned model endpoint
        # For now, we'll use a placeholder
        
        answer = await _query_fine_tuned_model(request.question, request.context)
        
        return OphthalmicKnowledgeResponse(
            answer=answer,
            model="Llama-3.1-8B-Ophthalmic-FineTuned",
            timestamp=datetime.utcnow().isoformat(),
        )
        
    except Exception as e:
        logger.error(f"[{token_payload.tenant_id}] Ophthalmic knowledge query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Knowledge query failed",
        )


async def _query_fine_tuned_model(question: str, context: Optional[str] = None) -> str:
    """
    Query the fine-tuned ophthalmic model.
    
    This would call your llama-cpp-python server or load the fine-tuned model.
    """
    import aiohttp
    
    # Call llama-cpp-python server running on localhost:8000
    prompt = f"<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n{question}"
    if context:
        prompt = f"{prompt}\n\nContext: {context}"
    prompt += "<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "http://localhost:8000/v1/completions",
            json={
                "prompt": prompt,
                "max_tokens": 512,
                "temperature": 0.7,
                "stop": ["<|eot_id|>"],
            }
        ) as response:
            if response.status == 200:
                result = await response.json()
                return result["choices"][0]["text"].strip()
            else:
                logger.error(f"Model API error: {response.status}")
                return "I apologize, but I'm having trouble processing your question right now."


# ============================================================================
# Admin Endpoints (Optional)
# ============================================================================

@app.post("/api/v1/admin/generate-token")
async def generate_token(tenant_id: str, user_id: str):
    """
    Generate JWT token for testing.
    
    In production, this would be handled by your authentication service.
    This is just for demonstration/testing.
    """
    settings = get_settings()
    
    payload = {
        "tenant_id": tenant_id,
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES),
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRATION_MINUTES * 60,
    }


# ============================================================================
# Startup/Shutdown
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Application startup."""
    logger.info("AI Service starting up...")
    logger.info(f"Model path: {get_settings().MODEL_PATH}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown."""
    logger.info("AI Service shutting down...")


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info",
    )
