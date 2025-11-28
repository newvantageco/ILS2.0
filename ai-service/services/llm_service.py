"""
LLM Service - OpenAI and Anthropic Integration
Handles all external AI API calls with fallback support
"""

from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import httpx
from datetime import datetime

from config import settings
from utils.logger import logger


class LLMService:
    """Unified LLM service with OpenAI and Anthropic support."""

    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.anthropic_client = None
        if settings.anthropic_api_key:
            self.anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

        self.primary_provider = settings.primary_llm_provider
        self.fallback_provider = settings.fallback_llm_provider

    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate completion from LLM with fallback support.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (default from settings)
            max_tokens: Max tokens to generate (default from settings)
            system_prompt: Optional system prompt

        Returns:
            Dict with 'content', 'provider', 'model', 'tokens', 'finish_reason'
        """
        temperature = temperature or settings.temperature
        max_tokens = max_tokens or settings.max_tokens

        # Try primary provider
        try:
            if self.primary_provider == "openai":
                return await self._generate_openai(messages, temperature, max_tokens, system_prompt)
            elif self.primary_provider == "anthropic":
                return await self._generate_anthropic(messages, temperature, max_tokens, system_prompt)
        except Exception as e:
            logger.warning(f"Primary LLM provider ({self.primary_provider}) failed: {e}")

            # Try fallback provider
            try:
                if self.fallback_provider == "openai" and self.primary_provider != "openai":
                    return await self._generate_openai(messages, temperature, max_tokens, system_prompt)
                elif self.fallback_provider == "anthropic" and self.primary_provider != "anthropic":
                    if self.anthropic_client:
                        return await self._generate_anthropic(messages, temperature, max_tokens, system_prompt)
            except Exception as fallback_error:
                logger.error(f"Fallback LLM provider ({self.fallback_provider}) also failed: {fallback_error}")

        raise Exception("All LLM providers failed")

    async def _generate_openai(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate completion using OpenAI."""
        # Prepare messages
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        response = await self.openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return {
            "content": response.choices[0].message.content,
            "provider": "openai",
            "model": settings.openai_model,
            "tokens": {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            },
            "finish_reason": response.choices[0].finish_reason,
        }

    async def _generate_anthropic(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate completion using Anthropic Claude."""
        if not self.anthropic_client:
            raise Exception("Anthropic client not configured")

        # Anthropic requires system prompt separate from messages
        response = await self.anthropic_client.messages.create(
            model=settings.anthropic_model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt or "",
            messages=messages,
        )

        return {
            "content": response.content[0].text,
            "provider": "anthropic",
            "model": settings.anthropic_model,
            "tokens": {
                "prompt": response.usage.input_tokens,
                "completion": response.usage.output_tokens,
                "total": response.usage.input_tokens + response.usage.output_tokens,
            },
            "finish_reason": response.stop_reason,
        }

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for texts using OpenAI.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors
        """
        try:
            response = await self.openai_client.embeddings.create(
                model=settings.openai_embedding_model,
                input=texts,
            )

            return [item.embedding for item in response.data]

        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise

    async def check_health(self) -> Dict[str, Any]:
        """Check health of LLM services."""
        health = {
            "openai": False,
            "anthropic": False,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Check OpenAI
        try:
            await self.openai_client.models.list()
            health["openai"] = True
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")

        # Check Anthropic
        if self.anthropic_client:
            try:
                # Simple test message
                await self.anthropic_client.messages.create(
                    model=settings.anthropic_model,
                    max_tokens=10,
                    messages=[{"role": "user", "content": "Hi"}],
                )
                health["anthropic"] = True
            except Exception as e:
                logger.error(f"Anthropic health check failed: {e}")

        return health


# Global LLM service instance
llm_service = LLMService()
