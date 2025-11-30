"""
FastAPI application for ILS 2.0 RAG Service
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

from models.schemas import (
    EmbeddingRequest,
    EmbeddingResponse,
    BatchEmbeddingRequest,
    BatchEmbeddingResponse,
    RAGSearchRequest,
    RAGSearchResponse,
    RAGSearchResult,
    IndexDocumentRequest,
    IndexDocumentResponse,
    HealthCheckResponse,
    ErrorResponse
)
from utils.logger import logger
from services.embedding_service import embedding_service
from services.rag_service import rag_service

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="ILS RAG Service",
    description="Retrieval-Augmented Generation microservice for multi-tenant AI",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration - include Railway healthcheck hostname
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
cors_origins = [
    BACKEND_URL,
    "http://localhost:3000",
    "https://healthcheck.railway.app",  # Railway health checks
]
# In Railway environment, allow all origins for internal communication
if os.getenv("RAILWAY_ENVIRONMENT"):
    cors_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error", "detail": str(exc)}
    )


# Service status tracking for health checks
_service_status = {
    "embedding_model_loaded": False,
    "database_connected": False,
    "startup_error": None
}


# Health check endpoint
@app.get("/health", response_model=HealthCheckResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify service is running.
    Returns 200 even in degraded mode to allow Railway to see the service is running.
    """
    # Determine status based on service initialization
    if _service_status["embedding_model_loaded"] and _service_status["database_connected"]:
        status = "healthy"
    elif _service_status["startup_error"]:
        status = "degraded"
    else:
        status = "starting"

    return HealthCheckResponse(
        status=status,
        service="rag-service",
        version="2.0.0"
    )


# Root endpoint
@app.get("/", tags=["Info"])
async def root():
    """
    Root endpoint with service information
    """
    return {
        "message": "ILS RAG Service",
        "version": "2.0.0",
        "endpoints": [
            "/health",
            "/docs",
            "/api/embeddings/generate",
            "/api/embeddings/generate-batch",
            "/api/rag/search",
            "/api/rag/index-document"
        ]
    }


# Embedding endpoints (will be implemented with service layer)
@app.post(
    "/api/embeddings/generate",
    response_model=EmbeddingResponse,
    tags=["Embeddings"],
    summary="Generate embedding for text"
)
async def generate_embedding(request: EmbeddingRequest):
    """
    Generate embedding vector for a single text input

    - **text**: Input text to generate embedding for
    - **model**: Embedding model to use (default: all-MiniLM-L6-v2)
    """
    try:
        logger.info(f"Generating embedding for text (length: {len(request.text)})")

        # Generate embedding
        embedding = embedding_service.generate_embedding(request.text)

        return EmbeddingResponse(
            embedding=embedding,
            model=request.model,
            dimensions=len(embedding)
        )

    except Exception as e:
        logger.error(f"Failed to generate embedding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post(
    "/api/embeddings/generate-batch",
    response_model=BatchEmbeddingResponse,
    tags=["Embeddings"],
    summary="Generate embeddings for multiple texts"
)
async def generate_batch_embeddings(request: BatchEmbeddingRequest):
    """
    Generate embedding vectors for multiple text inputs (batch processing)

    - **texts**: List of input texts
    - **model**: Embedding model to use (default: all-MiniLM-L6-v2)
    """
    try:
        logger.info(f"Generating batch embeddings for {len(request.texts)} texts")

        # Generate embeddings in batch
        embeddings = embedding_service.generate_embeddings(request.texts)

        return BatchEmbeddingResponse(
            embeddings=embeddings,
            model=request.model,
            dimensions=len(embeddings[0]) if embeddings else 0,
            count=len(embeddings)
        )

    except Exception as e:
        logger.error(f"Failed to generate batch embeddings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# RAG endpoints (will be implemented with service layer)
@app.post(
    "/api/rag/search",
    response_model=RAGSearchResponse,
    tags=["RAG"],
    summary="Search knowledge base using RAG"
)
async def search_rag(request: RAGSearchRequest):
    """
    Search knowledge base using semantic similarity (RAG)

    - **query**: Search query text
    - **company_id**: Company ID for tenant isolation
    - **limit**: Maximum number of results (1-50)
    - **threshold**: Minimum similarity threshold (0.0-1.0)
    """
    try:
        logger.info(f"RAG search: company={request.company_id}, query={request.query[:50]}...")

        # Generate query embedding
        query_embedding = embedding_service.generate_embedding(request.query)

        # Search knowledge base
        results = rag_service.search_knowledge_base(
            company_id=request.company_id,
            query_embedding=query_embedding,
            limit=request.limit,
            threshold=request.threshold
        )

        # Convert results to response format
        search_results = [
            RAGSearchResult(
                id=r['id'],
                content=r['content'],
                filename=r['filename'],
                category=r.get('category'),
                similarity=float(r['similarity'])
            ) for r in results
        ]

        return RAGSearchResponse(
            query=request.query,
            results=search_results,
            total_found=len(search_results)
        )

    except Exception as e:
        logger.error(f"RAG search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post(
    "/api/rag/index-document",
    response_model=IndexDocumentResponse,
    tags=["RAG"],
    summary="Index a new document"
)
async def index_document(request: IndexDocumentRequest):
    """
    Index a new document in the knowledge base

    - **company_id**: Company ID
    - **user_id**: User ID who uploaded the document
    - **filename**: Document filename
    - **content**: Document content
    - **category**: Optional document category
    """
    try:
        logger.info(f"Indexing document: {request.filename} for company {request.company_id}")

        # Generate embedding for document content
        embedding = embedding_service.generate_embedding(request.content)

        # Index document in knowledge base
        doc_id = rag_service.index_document(
            company_id=request.company_id,
            user_id=request.user_id,
            filename=request.filename,
            content=request.content,
            embedding=embedding,
            category=request.category
        )

        return IndexDocumentResponse(
            document_id=doc_id,
            status="indexed"
        )

    except Exception as e:
        logger.error(f"Document indexing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Initialize services on startup.
    Failures are logged but don't prevent the service from starting
    (allows health checks to work even in degraded mode).
    """
    global _service_status

    logger.info("Starting ILS RAG Service...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Database URL configured: {bool(os.getenv('DATABASE_URL'))}")
    logger.info(f"Backend URL: {BACKEND_URL}")

    errors = []

    # Initialize embedding service
    try:
        logger.info("Loading embedding model...")
        embedding_service.load_model()
        _service_status["embedding_model_loaded"] = True
        logger.info("✅ Embedding model loaded")
    except Exception as e:
        error_msg = f"Failed to load embedding model: {str(e)}"
        logger.error(f"❌ {error_msg}")
        errors.append(error_msg)

    # Initialize RAG service (database connection)
    if os.getenv('DATABASE_URL'):
        try:
            logger.info("Connecting to database...")
            rag_service.connect()
            _service_status["database_connected"] = True
            logger.info("✅ Database connected")
        except Exception as e:
            error_msg = f"Failed to connect to database: {str(e)}"
            logger.error(f"❌ {error_msg}")
            errors.append(error_msg)
    else:
        logger.warning("⚠️  DATABASE_URL not configured - database features disabled")

    if errors:
        _service_status["startup_error"] = "; ".join(errors)
        logger.warning(f"⚠️  RAG Service started in DEGRADED mode: {_service_status['startup_error']}")
    else:
        logger.info("✅ RAG Service started successfully")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup on shutdown
    """
    logger.info("Shutting down ILS RAG Service...")

    try:
        # Disconnect database
        rag_service.disconnect()
        logger.info("✅ RAG Service shut down successfully")

    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("SERVICE_PORT", 8001))

    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
