"""
Pydantic models for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class EmbeddingRequest(BaseModel):
    """Request model for embedding generation"""
    text: str = Field(..., description="Text to generate embedding for")
    model: str = Field(default="all-MiniLM-L6-v2", description="Embedding model to use")


class EmbeddingResponse(BaseModel):
    """Response model for embedding generation"""
    embedding: List[float] = Field(..., description="Generated embedding vector")
    model: str = Field(..., description="Model used for embedding")
    dimensions: int = Field(..., description="Dimensionality of embedding")


class BatchEmbeddingRequest(BaseModel):
    """Request model for batch embedding generation"""
    texts: List[str] = Field(..., description="List of texts to generate embeddings for")
    model: str = Field(default="all-MiniLM-L6-v2", description="Embedding model to use")


class BatchEmbeddingResponse(BaseModel):
    """Response model for batch embedding generation"""
    embeddings: List[List[float]] = Field(..., description="Generated embedding vectors")
    model: str = Field(..., description="Model used for embeddings")
    dimensions: int = Field(..., description="Dimensionality of embeddings")
    count: int = Field(..., description="Number of embeddings generated")


class RAGSearchRequest(BaseModel):
    """Request model for RAG search"""
    query: str = Field(..., description="Search query text")
    company_id: str = Field(..., description="Company ID for tenant isolation")
    limit: int = Field(default=5, ge=1, le=50, description="Maximum number of results")
    threshold: float = Field(default=0.7, ge=0.0, le=1.0, description="Minimum similarity threshold")


class RAGSearchResult(BaseModel):
    """Individual search result"""
    id: str = Field(..., description="Document ID")
    content: str = Field(..., description="Document content")
    filename: str = Field(..., description="Source filename")
    category: Optional[str] = Field(None, description="Document category")
    similarity: float = Field(..., description="Cosine similarity score")


class RAGSearchResponse(BaseModel):
    """Response model for RAG search"""
    query: str = Field(..., description="Original query")
    results: List[RAGSearchResult] = Field(..., description="Search results")
    total_found: int = Field(..., description="Total number of results found")


class IndexDocumentRequest(BaseModel):
    """Request model for document indexing"""
    company_id: str = Field(..., description="Company ID")
    user_id: str = Field(..., description="User ID who uploaded the document")
    filename: str = Field(..., description="Document filename")
    content: str = Field(..., description="Document content")
    category: Optional[str] = Field(None, description="Document category")


class IndexDocumentResponse(BaseModel):
    """Response model for document indexing"""
    document_id: str = Field(..., description="Indexed document ID")
    status: str = Field(..., description="Indexing status")


class HealthCheckResponse(BaseModel):
    """Response model for health check"""
    status: str = Field(..., description="Service health status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
