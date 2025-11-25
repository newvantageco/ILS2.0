"""
RAG (Retrieval-Augmented Generation) Service

Provides semantic search capabilities using pgvector for vector similarity search.
Handles document indexing and retrieval with full tenant isolation.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from pgvector.psycopg2 import register_vector
from typing import List, Dict, Any, Optional
import os
from utils.logger import logger


class RAGService:
    """
    Service for RAG operations using PostgreSQL + pgvector
    """

    def __init__(self):
        """
        Initialize the RAG service
        """
        self.conn: Optional[psycopg2.extensions.connection] = None
        self.database_url = os.getenv("DATABASE_URL")

        if not self.database_url:
            logger.warning("DATABASE_URL not configured")

    def connect(self):
        """
        Connect to PostgreSQL database with pgvector support

        Raises:
            RuntimeError: If connection fails
        """
        if not self.database_url:
            raise RuntimeError("DATABASE_URL environment variable not set")

        try:
            logger.info("Connecting to PostgreSQL database...")

            # Connect to database
            self.conn = psycopg2.connect(
                self.database_url,
                cursor_factory=RealDictCursor
            )

            # Register pgvector extension
            register_vector(self.conn)

            # Test connection
            cursor = self.conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            cursor.close()

            logger.info(f"✅ Connected to PostgreSQL: {version['version'][:50]}...")

            # Verify pgvector extension
            cursor = self.conn.cursor()
            cursor.execute("SELECT * FROM pg_extension WHERE extname = 'vector';")
            result = cursor.fetchone()
            cursor.close()

            if result:
                logger.info("✅ pgvector extension detected")
            else:
                logger.warning("⚠️  pgvector extension not found - vector operations may fail")

        except Exception as e:
            logger.error(f"❌ Database connection failed: {str(e)}")
            raise RuntimeError(f"Failed to connect to database: {str(e)}")

    def disconnect(self):
        """
        Close database connection
        """
        if self.conn:
            try:
                self.conn.close()
                logger.info("Database connection closed")
            except Exception as e:
                logger.error(f"Error closing database connection: {str(e)}")

    def search_knowledge_base(
        self,
        company_id: str,
        query_embedding: List[float],
        limit: int = 5,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search knowledge base using vector similarity

        Uses cosine distance operator (<=>)  for similarity search with pgvector.
        Enforces tenant isolation by filtering on company_id.

        Args:
            company_id: Company ID for tenant isolation
            query_embedding: Query embedding vector
            limit: Maximum number of results to return
            threshold: Minimum similarity threshold (0.0-1.0)

        Returns:
            List of matching documents with similarity scores

        Raises:
            RuntimeError: If database connection is not established
            ValueError: If parameters are invalid
        """
        if not self.conn:
            raise RuntimeError("Database not connected. Call connect() first.")

        if not company_id:
            raise ValueError("company_id is required")

        if not query_embedding:
            raise ValueError("query_embedding is required")

        if limit < 1 or limit > 100:
            raise ValueError("limit must be between 1 and 100")

        if threshold < 0.0 or threshold > 1.0:
            raise ValueError("threshold must be between 0.0 and 1.0")

        try:
            cursor = self.conn.cursor()

            # Vector similarity search with tenant isolation
            # Cosine distance: 0 = identical, 2 = opposite
            # Similarity: 1 - (distance / 2) gives a 0-1 similarity score
            query = """
                SELECT
                    id,
                    filename,
                    content,
                    category,
                    created_at,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM ai_knowledge_base
                WHERE
                    company_id = %s
                    AND is_active = true
                    AND embedding IS NOT NULL
                    AND (1 - (embedding <=> %s::vector)) >= %s
                ORDER BY embedding <=> %s::vector ASC
                LIMIT %s
            """

            # Execute query
            cursor.execute(query, (
                query_embedding,  # For first similarity calculation
                company_id,       # Tenant isolation
                query_embedding,  # For WHERE clause similarity check
                threshold,        # Similarity threshold
                query_embedding,  # For ORDER BY
                limit            # Result limit
            ))

            results = cursor.fetchall()
            cursor.close()

            logger.info(f"Found {len(results)} results for company {company_id}")

            # Convert RealDictRow to regular dict
            return [dict(row) for row in results]

        except Exception as e:
            logger.error(f"RAG search failed: {str(e)}")
            raise RuntimeError(f"Search failed: {str(e)}")

    def index_document(
        self,
        company_id: str,
        user_id: str,
        filename: str,
        content: str,
        embedding: List[float],
        category: Optional[str] = None
    ) -> str:
        """
        Index a new document in the knowledge base

        Args:
            company_id: Company ID
            user_id: User ID who uploaded the document
            filename: Document filename
            content: Document content
            embedding: Pre-generated embedding vector
            category: Optional document category

        Returns:
            ID of the indexed document

        Raises:
            RuntimeError: If database connection is not established
            ValueError: If required parameters are missing
        """
        if not self.conn:
            raise RuntimeError("Database not connected. Call connect() first.")

        if not company_id or not user_id or not filename or not content:
            raise ValueError("company_id, user_id, filename, and content are required")

        if not embedding:
            raise ValueError("embedding is required")

        try:
            cursor = self.conn.cursor()

            query = """
                INSERT INTO ai_knowledge_base (
                    id,
                    company_id,
                    uploaded_by,
                    filename,
                    content,
                    embedding,
                    category,
                    is_active,
                    processing_status,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    %s, %s, %s, %s, %s, %s,
                    true,
                    'completed',
                    NOW(),
                    NOW()
                )
                RETURNING id
            """

            cursor.execute(query, (
                company_id,
                user_id,
                filename,
                content,
                embedding,
                category
            ))

            result = cursor.fetchone()
            doc_id = result['id']

            # Commit transaction
            self.conn.commit()
            cursor.close()

            logger.info(f"✅ Indexed document {doc_id} for company {company_id}")
            return doc_id

        except Exception as e:
            # Rollback on error
            if self.conn:
                self.conn.rollback()

            logger.error(f"Document indexing failed: {str(e)}")
            raise RuntimeError(f"Indexing failed: {str(e)}")

    def update_document_embedding(
        self,
        document_id: str,
        embedding: List[float]
    ) -> bool:
        """
        Update the embedding for an existing document

        Args:
            document_id: Document ID
            embedding: New embedding vector

        Returns:
            True if successful

        Raises:
            RuntimeError: If database connection is not established
            ValueError: If parameters are invalid
        """
        if not self.conn:
            raise RuntimeError("Database not connected. Call connect() first.")

        if not document_id or not embedding:
            raise ValueError("document_id and embedding are required")

        try:
            cursor = self.conn.cursor()

            query = """
                UPDATE ai_knowledge_base
                SET
                    embedding = %s,
                    updated_at = NOW()
                WHERE id = %s
            """

            cursor.execute(query, (embedding, document_id))

            rows_affected = cursor.rowcount
            self.conn.commit()
            cursor.close()

            if rows_affected > 0:
                logger.info(f"✅ Updated embedding for document {document_id}")
                return True
            else:
                logger.warning(f"⚠️  No document found with id {document_id}")
                return False

        except Exception as e:
            if self.conn:
                self.conn.rollback()

            logger.error(f"Failed to update document embedding: {str(e)}")
            raise RuntimeError(f"Update failed: {str(e)}")

    def get_document_count(self, company_id: str) -> int:
        """
        Get the total number of documents for a company

        Args:
            company_id: Company ID

        Returns:
            Total document count

        Raises:
            RuntimeError: If database connection is not established
        """
        if not self.conn:
            raise RuntimeError("Database not connected. Call connect() first.")

        try:
            cursor = self.conn.cursor()

            query = """
                SELECT COUNT(*) as count
                FROM ai_knowledge_base
                WHERE company_id = %s AND is_active = true
            """

            cursor.execute(query, (company_id,))
            result = cursor.fetchone()
            cursor.close()

            return result['count']

        except Exception as e:
            logger.error(f"Failed to get document count: {str(e)}")
            raise RuntimeError(f"Count query failed: {str(e)}")

    def health_check(self) -> bool:
        """
        Check if database connection is healthy

        Returns:
            True if connection is healthy, False otherwise
        """
        if not self.conn:
            return False

        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False


# Singleton instance
rag_service = RAGService()
