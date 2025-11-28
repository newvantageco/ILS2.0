"""
RAG Service - Retrieval Augmented Generation
Handles knowledge retrieval, learning, and context building
"""

from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import uuid

from services.database import AIKnowledgeBase, AILearningData, get_db
from services.llm_service import llm_service
from config import settings
from utils.logger import logger


class RAGService:
    """RAG service for knowledge retrieval and augmentation."""

    def __init__(self):
        self.top_k = settings.rag_top_k
        self.similarity_threshold = settings.rag_similarity_threshold

    async def search_knowledge(
        self,
        query: str,
        company_id: str,
        category: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search knowledge base using vector similarity.

        Args:
            query: Search query
            company_id: Company/tenant ID
            category: Optional category filter
            top_k: Number of results to return

        Returns:
            List of relevant knowledge entries with similarity scores
        """
        top_k = top_k or self.top_k

        try:
            # Generate query embedding
            query_embedding = await llm_service.generate_embeddings([query])
            query_vector = query_embedding[0]

            async with get_db() as session:
                # Build query
                stmt = select(
                    AIKnowledgeBase,
                    AIKnowledgeBase.embedding.cosine_distance(query_vector).label("distance")
                ).where(
                    and_(
                        AIKnowledgeBase.companyId == uuid.UUID(company_id),
                        AIKnowledgeBase.isActive == True,
                        AIKnowledgeBase.embedding.isnot(None),
                    )
                )

                # Add category filter if specified
                if category:
                    stmt = stmt.where(AIKnowledgeBase.category == category)

                # Order by similarity and limit
                stmt = stmt.order_by("distance").limit(top_k)

                result = await session.execute(stmt)
                rows = result.all()

                # Format results
                knowledge_items = []
                for row in rows:
                    kb_entry, distance = row
                    similarity = 1 - distance  # Convert distance to similarity

                    if similarity >= self.similarity_threshold:
                        knowledge_items.append({
                            "id": str(kb_entry.id),
                            "content": kb_entry.content,
                            "summary": kb_entry.summary,
                            "category": kb_entry.category,
                            "tags": kb_entry.tags,
                            "similarity": round(similarity, 4),
                            "source": kb_entry.filename or "manual",
                        })

                logger.info(f"Found {len(knowledge_items)} relevant knowledge items for query")
                return knowledge_items

        except Exception as e:
            logger.error(f"Knowledge search failed: {e}")
            return []

    async def search_learned_data(
        self,
        query: str,
        company_id: str,
        category: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search learned Q&A data using vector similarity.

        Args:
            query: Search query
            company_id: Company/tenant ID
            category: Optional category filter
            top_k: Number of results to return

        Returns:
            List of relevant learned Q&A pairs with similarity scores
        """
        top_k = top_k or self.top_k

        try:
            # Generate query embedding
            query_embedding = await llm_service.generate_embeddings([query])
            query_vector = query_embedding[0]

            async with get_db() as session:
                # Build query
                stmt = select(
                    AILearningData,
                    AILearningData.embedding.cosine_distance(query_vector).label("distance")
                ).where(
                    and_(
                        AILearningData.companyId == uuid.UUID(company_id),
                        AILearningData.embedding.isnot(None),
                        AILearningData.isValidated == True,  # Only use validated data
                    )
                )

                # Add category filter if specified
                if category:
                    stmt = stmt.where(AILearningData.category == category)

                # Order by similarity and limit
                stmt = stmt.order_by("distance").limit(top_k)

                result = await session.execute(stmt)
                rows = result.all()

                # Format results
                learned_items = []
                for row in rows:
                    learning_entry, distance = row
                    similarity = 1 - distance

                    if similarity >= self.similarity_threshold:
                        learned_items.append({
                            "id": str(learning_entry.id),
                            "question": learning_entry.question,
                            "answer": learning_entry.answer,
                            "context": learning_entry.context,
                            "category": learning_entry.category,
                            "similarity": round(similarity, 4),
                            "confidence": learning_entry.confidence,
                            "success_rate": learning_entry.successRate,
                            "use_count": learning_entry.useCount,
                        })

                logger.info(f"Found {len(learned_items)} relevant learned items for query")
                return learned_items

        except Exception as e:
            logger.error(f"Learned data search failed: {e}")
            return []

    async def add_knowledge(
        self,
        company_id: str,
        content: str,
        category: str,
        summary: Optional[str] = None,
        tags: Optional[List[str]] = None,
        uploaded_by: Optional[str] = None,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Add new knowledge to the knowledge base.

        Args:
            company_id: Company/tenant ID
            content: Knowledge content
            category: Category (ophthalmic, dispensing, business, etc.)
            summary: Optional summary
            tags: Optional tags
            uploaded_by: User ID who uploaded
            filename: Optional filename

        Returns:
            Created knowledge entry
        """
        try:
            # Generate embedding
            embeddings = await llm_service.generate_embeddings([content])
            embedding = embeddings[0]

            async with get_db() as session:
                # Create knowledge entry
                kb_entry = AIKnowledgeBase(
                    companyId=uuid.UUID(company_id),
                    content=content,
                    summary=summary,
                    category=category,
                    tags=tags,
                    embedding=embedding,
                    uploadedBy=uuid.UUID(uploaded_by) if uploaded_by else None,
                    filename=filename,
                    isActive=True,
                    processingStatus="completed",
                )

                session.add(kb_entry)
                await session.commit()
                await session.refresh(kb_entry)

                logger.info(f"Added knowledge entry {kb_entry.id} for company {company_id}")

                return {
                    "id": str(kb_entry.id),
                    "company_id": company_id,
                    "category": category,
                    "created_at": kb_entry.createdAt.isoformat(),
                }

        except Exception as e:
            logger.error(f"Failed to add knowledge: {e}")
            raise

    async def add_learned_data(
        self,
        company_id: str,
        question: str,
        answer: str,
        category: str,
        source_type: str = "conversation",
        source_id: Optional[str] = None,
        context: Optional[str] = None,
        confidence: int = 80,
    ) -> Dict[str, Any]:
        """
        Add learned Q&A data from conversations.

        Args:
            company_id: Company/tenant ID
            question: Question text
            answer: Answer text
            category: Category
            source_type: Source type (conversation, document, feedback, manual)
            source_id: Source ID (conversation ID, etc.)
            context: Optional context
            confidence: Confidence score (0-100)

        Returns:
            Created learning entry
        """
        try:
            # Generate embedding for question
            embeddings = await llm_service.generate_embeddings([question])
            embedding = embeddings[0]

            async with get_db() as session:
                # Create learning entry
                learning_entry = AILearningData(
                    companyId=uuid.UUID(company_id),
                    question=question,
                    answer=answer,
                    context=context,
                    category=category,
                    embedding=embedding,
                    sourceType=source_type,
                    sourceId=uuid.UUID(source_id) if source_id else None,
                    confidence=confidence,
                    isValidated=False,  # Requires validation
                    useCount=0,
                    successRate=100,
                )

                session.add(learning_entry)
                await session.commit()
                await session.refresh(learning_entry)

                logger.info(f"Added learning data {learning_entry.id} for company {company_id}")

                return {
                    "id": str(learning_entry.id),
                    "company_id": company_id,
                    "category": category,
                    "created_at": learning_entry.createdAt.isoformat(),
                }

        except Exception as e:
            logger.error(f"Failed to add learned data: {e}")
            raise

    async def update_learning_metrics(
        self,
        learning_id: str,
        was_helpful: bool,
    ):
        """
        Update metrics for learned data based on usage feedback.

        Args:
            learning_id: Learning entry ID
            was_helpful: Whether the answer was helpful
        """
        try:
            async with get_db() as session:
                stmt = select(AILearningData).where(
                    AILearningData.id == uuid.UUID(learning_id)
                )
                result = await session.execute(stmt)
                learning_entry = result.scalar_one_or_none()

                if learning_entry:
                    # Update metrics
                    learning_entry.useCount += 1
                    learning_entry.lastUsed = datetime.utcnow()

                    if was_helpful:
                        # Increase success rate
                        total_uses = learning_entry.useCount
                        current_successes = (learning_entry.successRate / 100) * (total_uses - 1)
                        new_success_rate = ((current_successes + 1) / total_uses) * 100
                        learning_entry.successRate = int(new_success_rate)
                    else:
                        # Decrease success rate
                        total_uses = learning_entry.useCount
                        current_successes = (learning_entry.successRate / 100) * (total_uses - 1)
                        new_success_rate = (current_successes / total_uses) * 100
                        learning_entry.successRate = int(new_success_rate)

                    await session.commit()
                    logger.info(f"Updated learning metrics for {learning_id}")

        except Exception as e:
            logger.error(f"Failed to update learning metrics: {e}")

    async def get_company_learning_progress(self, company_id: str) -> Dict[str, Any]:
        """
        Get learning progress for a company.

        Args:
            company_id: Company/tenant ID

        Returns:
            Learning progress statistics
        """
        try:
            async with get_db() as session:
                # Count knowledge base entries
                kb_stmt = select(func.count()).select_from(AIKnowledgeBase).where(
                    and_(
                        AIKnowledgeBase.companyId == uuid.UUID(company_id),
                        AIKnowledgeBase.isActive == True,
                    )
                )
                kb_result = await session.execute(kb_stmt)
                kb_count = kb_result.scalar()

                # Count learned data entries
                learning_stmt = select(func.count()).select_from(AILearningData).where(
                    AILearningData.companyId == uuid.UUID(company_id)
                )
                learning_result = await session.execute(learning_stmt)
                learning_count = learning_result.scalar()

                # Count validated entries
                validated_stmt = select(func.count()).select_from(AILearningData).where(
                    and_(
                        AILearningData.companyId == uuid.UUID(company_id),
                        AILearningData.isValidated == True,
                    )
                )
                validated_result = await session.execute(validated_stmt)
                validated_count = validated_result.scalar()

                # Calculate learning progress (0-100)
                # Based on: 50% knowledge base, 50% learned conversations
                kb_progress = min((kb_count / 100) * 50, 50)  # Max 50 points
                learning_progress = min((validated_count / 50) * 50, 50)  # Max 50 points
                total_progress = int(kb_progress + learning_progress)

                return {
                    "total_progress": total_progress,
                    "knowledge_base_entries": kb_count,
                    "learned_entries": learning_count,
                    "validated_entries": validated_count,
                    "learning_rate": round((validated_count / max(learning_count, 1)) * 100, 2),
                }

        except Exception as e:
            logger.error(f"Failed to get learning progress: {e}")
            return {
                "total_progress": 0,
                "knowledge_base_entries": 0,
                "learned_entries": 0,
                "validated_entries": 0,
                "learning_rate": 0,
            }


# Global RAG service instance
rag_service = RAGService()
