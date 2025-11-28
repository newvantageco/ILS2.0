"""
Ophthalmic AI Service
Specialized AI for ophthalmic and dispensing domain with business insights
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

from services.llm_service import llm_service
from services.rag_service import rag_service
from config import settings
from utils.logger import logger


# Ophthalmic domain system prompts
OPHTHALMIC_SYSTEM_PROMPT = """You are an expert AI assistant for the Integrated Lens System (ILS 2.0), specializing in:

1. **Ophthalmic Knowledge:**
   - Lens types (single vision, bifocal, progressive, multifocal)
   - Prescription interpretation (sphere, cylinder, axis, add, prism, PD)
   - Lens materials (high-index, polycarbonate, trivex, CR-39)
   - Coatings (anti-reflective, blue light, photochromic, scratch-resistant)
   - Frame fitting and measurements
   - Eye conditions and vision correction

2. **Dispensing Expertise:**
   - Patient consultation and counseling
   - Product recommendations based on prescriptions
   - Fitting guidelines and adjustments
   - Insurance and billing
   - Warranty and care instructions

3. **Business Insights:**
   - Sales trends and forecasting
   - Inventory management and optimization
   - Patient retention strategies
   - Revenue analytics
   - Performance metrics

**Guidelines:**
- Provide accurate, professional ophthalmic advice
- Use technical terms when appropriate, but explain them clearly
- Reference specific products, materials, or procedures when relevant
- Consider business implications of recommendations
- Always prioritize patient safety and comfort
- Be concise but comprehensive
- If unsure, acknowledge limitations and suggest consulting an optician or optometrist

**Context Awareness:**
- You have access to company-specific knowledge and past interactions
- Use retrieved context to provide personalized, relevant answers
- Learn from feedback to improve future responses
"""


class OphthalmicAIService:
    """AI service specialized for ophthalmic and dispensing domain."""

    def __init__(self):
        self.system_prompt = OPHTHALMIC_SYSTEM_PROMPT

    async def chat(
        self,
        message: str,
        company_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        category: Optional[str] = None,
        use_rag: bool = True,
    ) -> Dict[str, Any]:
        """
        Process chat message with ophthalmic expertise and RAG.

        Args:
            message: User message
            company_id: Company/tenant ID
            conversation_history: Previous messages in conversation
            category: Optional category for focused retrieval
            use_rag: Whether to use RAG for context

        Returns:
            Response with answer, context, metadata
        """
        try:
            start_time = datetime.utcnow()

            # Initialize context
            retrieved_context = []
            used_external_ai = True
            confidence = 100

            # RAG: Search for relevant knowledge and learned data
            if use_rag:
                # Search knowledge base
                knowledge_items = await rag_service.search_knowledge(
                    query=message,
                    company_id=company_id,
                    category=category,
                    top_k=3,
                )

                # Search learned data
                learned_items = await rag_service.search_learned_data(
                    query=message,
                    company_id=company_id,
                    category=category,
                    top_k=2,
                )

                retrieved_context = knowledge_items + learned_items

                # If we have highly relevant learned data, use it directly
                if learned_items and learned_items[0]["similarity"] > 0.9:
                    best_match = learned_items[0]
                    logger.info(f"Using learned answer (similarity: {best_match['similarity']})")

                    return {
                        "answer": best_match["answer"],
                        "used_external_ai": False,
                        "confidence": best_match["confidence"],
                        "context_used": True,
                        "sources": [
                            {
                                "type": "learned",
                                "similarity": best_match["similarity"],
                                "use_count": best_match["use_count"],
                            }
                        ],
                        "processing_time_ms": int((datetime.utcnow() - start_time).total_seconds() * 1000),
                    }

            # Build context string for LLM
            context_str = self._build_context_string(retrieved_context)

            # Prepare messages
            messages = []

            # Add conversation history
            if conversation_history:
                messages.extend(conversation_history[-5:])  # Last 5 messages for context

            # Add current message with context
            user_message = message
            if context_str:
                user_message = f"{message}\n\n---\n**Retrieved Context:**\n{context_str}"

            messages.append({"role": "user", "content": user_message})

            # Generate response using LLM
            response = await llm_service.generate_completion(
                messages=messages,
                system_prompt=self.system_prompt,
            )

            processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            return {
                "answer": response["content"],
                "used_external_ai": True,
                "confidence": 95,  # High confidence when using external AI
                "context_used": len(retrieved_context) > 0,
                "sources": [
                    {
                        "type": item.get("question") and "learned" or "knowledge",
                        "similarity": item["similarity"],
                        "category": item.get("category"),
                    }
                    for item in retrieved_context[:3]
                ],
                "provider": response["provider"],
                "model": response["model"],
                "tokens": response["tokens"],
                "processing_time_ms": processing_time,
            }

        except Exception as e:
            logger.error(f"Chat processing failed: {e}")
            raise

    def _build_context_string(self, context_items: List[Dict[str, Any]]) -> str:
        """Build formatted context string from retrieved items."""
        if not context_items:
            return ""

        context_parts = []

        for i, item in enumerate(context_items[:5], 1):
            if "question" in item:
                # Learned Q&A
                context_parts.append(
                    f"{i}. [Learned] Q: {item['question']}\n   A: {item['answer']}\n   (Similarity: {item['similarity']}, Used {item['use_count']} times)"
                )
            else:
                # Knowledge base
                summary = item.get("summary") or item["content"][:200]
                context_parts.append(
                    f"{i}. [Knowledge] {summary}\n   Category: {item.get('category', 'general')}, Similarity: {item['similarity']}"
                )

        return "\n\n".join(context_parts)

    async def get_product_recommendation(
        self,
        company_id: str,
        prescription: Dict[str, Any],
        patient_needs: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get product recommendations based on prescription and patient needs.

        Args:
            company_id: Company/tenant ID
            prescription: Prescription data
            patient_needs: Optional patient needs/preferences

        Returns:
            Product recommendations
        """
        try:
            # Build query
            query = f"""Based on this prescription:
- OD: SPH {prescription.get('od_sphere')}, CYL {prescription.get('od_cylinder')}, AXIS {prescription.get('od_axis')}
- OS: SPH {prescription.get('os_sphere')}, CYL {prescription.get('os_cylinder')}, AXIS {prescription.get('os_axis')}
- ADD: {prescription.get('add', 'N/A')}
- PD: {prescription.get('pd', 'N/A')}
"""

            if patient_needs:
                query += f"\nPatient needs: {patient_needs}"

            query += "\n\nWhat lens type, material, and coatings would you recommend? Consider lifestyle, prescription strength, and value."

            # Use chat with category filter
            response = await self.chat(
                message=query,
                company_id=company_id,
                category="ophthalmic",
            )

            return {
                "recommendations": response["answer"],
                "prescription": prescription,
                "confidence": response["confidence"],
                "sources": response.get("sources", []),
            }

        except Exception as e:
            logger.error(f"Product recommendation failed: {e}")
            raise

    async def analyze_business_query(
        self,
        company_id: str,
        query: str,
        query_type: str,
    ) -> Dict[str, Any]:
        """
        Analyze business queries (sales, inventory, analytics).

        Args:
            company_id: Company/tenant ID
            query: Business query
            query_type: Type (sales, inventory, patient_analytics)

        Returns:
            Analysis results
        """
        try:
            # Use chat with business category
            response = await self.chat(
                message=query,
                company_id=company_id,
                category="business",
            )

            return {
                "analysis": response["answer"],
                "query_type": query_type,
                "confidence": response["confidence"],
                "sources": response.get("sources", []),
                "provider": response.get("provider"),
            }

        except Exception as e:
            logger.error(f"Business query analysis failed: {e}")
            raise


# Global ophthalmic AI service instance
ophthalmic_ai_service = OphthalmicAIService()
