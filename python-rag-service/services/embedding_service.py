"""
Embedding service using sentence-transformers

Provides fast, local embedding generation for semantic search and RAG.
Uses the all-MiniLM-L6-v2 model by default (384 dimensions, fast, good quality).
"""
from sentence_transformers import SentenceTransformer
from typing import List, Union, Optional
import numpy as np
import os
from utils.logger import logger


class EmbeddingService:
    """
    Service for generating text embeddings using sentence-transformers
    """

    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize the embedding service

        Args:
            model_name: Name of the sentence-transformer model to use
                       Default: all-MiniLM-L6-v2 (384 dims, fast, good quality)
                       Alternative: all-mpnet-base-v2 (768 dims, slower, better)
        """
        self.model_name = model_name or os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        self.model: Optional[SentenceTransformer] = None
        self.dimensions: Optional[int] = None

    def load_model(self):
        """
        Load the embedding model (called on startup)
        """
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)

            # Get model dimensions
            test_embedding = self.model.encode("test", convert_to_numpy=True)
            self.dimensions = len(test_embedding)

            logger.info(f"✅ Embedding model loaded: {self.model_name} ({self.dimensions} dimensions)")

        except Exception as e:
            logger.error(f"❌ Failed to load embedding model: {str(e)}")
            raise

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text

        Args:
            text: Input text to generate embedding for

        Returns:
            List of floats representing the embedding vector

        Raises:
            RuntimeError: If model is not loaded
            ValueError: If text is empty
        """
        if self.model is None:
            raise RuntimeError("Embedding model not loaded. Call load_model() first.")

        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        try:
            # Generate embedding
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                show_progress_bar=False
            )

            # Convert numpy array to list
            return embedding.tolist()

        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            raise

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (batch processing)

        Batch processing is more efficient than processing texts individually.

        Args:
            texts: List of input texts to generate embeddings for

        Returns:
            List of embedding vectors

        Raises:
            RuntimeError: If model is not loaded
            ValueError: If texts list is empty
        """
        if self.model is None:
            raise RuntimeError("Embedding model not loaded. Call load_model() first.")

        if not texts or len(texts) == 0:
            raise ValueError("Texts list cannot be empty")

        try:
            logger.info(f"Generating batch embeddings for {len(texts)} texts")

            # Generate embeddings in batch
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                show_progress_bar=len(texts) > 10,  # Show progress for large batches
                batch_size=32  # Process 32 texts at a time
            )

            # Convert numpy array to list of lists
            return embeddings.tolist()

        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {str(e)}")
            raise

    def calculate_similarity(
        self,
        embedding1: Union[List[float], np.ndarray],
        embedding2: Union[List[float], np.ndarray]
    ) -> float:
        """
        Calculate cosine similarity between two embeddings

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Cosine similarity score (0.0 to 1.0)

        Raises:
            ValueError: If embeddings have different dimensions
        """
        # Convert to numpy arrays if needed
        vec1 = np.array(embedding1) if isinstance(embedding1, list) else embedding1
        vec2 = np.array(embedding2) if isinstance(embedding2, list) else embedding2

        # Check dimensions match
        if vec1.shape != vec2.shape:
            raise ValueError(
                f"Embedding dimensions don't match: {vec1.shape} vs {vec2.shape}"
            )

        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = dot_product / (norm1 * norm2)

        # Ensure result is in [0, 1] range (handle floating point errors)
        return float(max(0.0, min(1.0, similarity)))

    def get_model_info(self) -> dict:
        """
        Get information about the loaded model

        Returns:
            Dictionary with model information
        """
        return {
            "model_name": self.model_name,
            "dimensions": self.dimensions,
            "is_loaded": self.model is not None
        }


# Singleton instance
# This will be initialized once and reused across requests
embedding_service = EmbeddingService()
