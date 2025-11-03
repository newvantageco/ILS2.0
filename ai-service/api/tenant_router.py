"""
Multi-Tenant AI Service Router

Handles routing AI requests from multiple subscriber companies to their
isolated model instances and databases.

Key Features:
- Tenant isolation
- Request deduplication
- Rate limiting per subscriber
- Usage tracking and billing
- Load balancing
"""

import asyncio
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from collections import defaultdict
import hashlib
import json
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class TenantRouter:
    """
    Routes AI requests to tenant-specific resources with deduplication
    and rate limiting.
    """
    
    def __init__(self):
        # Cache for recent requests (deduplication)
        self.request_cache: Dict[str, Dict] = {}
        self.cache_ttl = 300  # 5 minutes
        
        # Rate limiting
        self.rate_limits: Dict[str, List[datetime]] = defaultdict(list)
        
        # Usage tracking
        self.usage_stats: Dict[str, Dict] = defaultdict(lambda: {
            "requests_count": 0,
            "tokens_used": 0,
            "cache_hits": 0,
            "errors": 0
        })
        
        # Active tenant sessions
        self.active_tenants: Dict[str, Dict] = {}
    
    def _generate_cache_key(self, tenant_id: str, query: str, query_type: str) -> str:
        """
        Generate unique cache key for request deduplication.
        
        Args:
            tenant_id: Tenant identifier
            query: User query
            query_type: Type of query (sales, inventory, etc.)
            
        Returns:
            SHA-256 hash of request parameters
        """
        cache_data = f"{tenant_id}:{query_type}:{query.lower().strip()}"
        return hashlib.sha256(cache_data.encode()).hexdigest()
    
    def check_duplicate_request(
        self,
        tenant_id: str,
        query: str,
        query_type: str
    ) -> Optional[Dict]:
        """
        Check if this request was recently processed (deduplication).
        
        Args:
            tenant_id: Tenant identifier
            query: User query
            query_type: Type of query
            
        Returns:
            Cached response if found, None otherwise
        """
        cache_key = self._generate_cache_key(tenant_id, query, query_type)
        
        if cache_key in self.request_cache:
            cached = self.request_cache[cache_key]
            
            # Check if cache is still valid
            cache_age = (datetime.utcnow() - cached["timestamp"]).seconds
            if cache_age < self.cache_ttl:
                logger.info(f"[{tenant_id}] Cache hit for query (age: {cache_age}s)")
                
                # Update usage stats
                self.usage_stats[tenant_id]["cache_hits"] += 1
                
                return cached["response"]
            else:
                # Remove expired cache entry
                del self.request_cache[cache_key]
        
        return None
    
    def cache_response(
        self,
        tenant_id: str,
        query: str,
        query_type: str,
        response: Dict
    ):
        """
        Cache response for deduplication.
        
        Args:
            tenant_id: Tenant identifier
            query: User query
            query_type: Type of query
            response: Response to cache
        """
        cache_key = self._generate_cache_key(tenant_id, query, query_type)
        
        self.request_cache[cache_key] = {
            "timestamp": datetime.utcnow(),
            "response": response,
            "tenant_id": tenant_id
        }
        
        # Cleanup old cache entries (keep only last 1000)
        if len(self.request_cache) > 1000:
            # Remove oldest entries
            sorted_keys = sorted(
                self.request_cache.keys(),
                key=lambda k: self.request_cache[k]["timestamp"]
            )
            for key in sorted_keys[:100]:
                del self.request_cache[key]
    
    def check_rate_limit(
        self,
        tenant_id: str,
        max_requests_per_minute: int = 60
    ) -> bool:
        """
        Check if tenant has exceeded rate limit.
        
        Args:
            tenant_id: Tenant identifier
            max_requests_per_minute: Maximum requests allowed per minute
            
        Returns:
            True if within limit, False if exceeded
        """
        now = datetime.utcnow()
        one_minute_ago = now - timedelta(minutes=1)
        
        # Get recent requests for this tenant
        recent_requests = self.rate_limits[tenant_id]
        
        # Remove requests older than 1 minute
        recent_requests = [
            req_time for req_time in recent_requests
            if req_time > one_minute_ago
        ]
        self.rate_limits[tenant_id] = recent_requests
        
        # Check if limit exceeded
        if len(recent_requests) >= max_requests_per_minute:
            logger.warning(
                f"[{tenant_id}] Rate limit exceeded: "
                f"{len(recent_requests)}/{max_requests_per_minute} requests/min"
            )
            return False
        
        # Add current request
        self.rate_limits[tenant_id].append(now)
        return True
    
    def get_tenant_config(self, tenant_id: str) -> Dict:
        """
        Get configuration for specific tenant.
        
        In production, this would load from database.
        
        Args:
            tenant_id: Tenant identifier
            
        Returns:
            Tenant configuration
        """
        # In production, load from database
        # For now, return default config
        return {
            "tenant_id": tenant_id,
            "rate_limit": 60,  # requests per minute
            "max_tokens_per_request": 500,
            "cache_enabled": True,
            "features": {
                "sales_queries": True,
                "inventory_queries": True,
                "patient_analytics": True,
                "ophthalmic_knowledge": True
            },
            "subscription_tier": "professional",  # basic, professional, enterprise
            "database_connections": {
                "sales_db": f"postgresql://user:pass@db.example.com/{tenant_id}_sales",
                "inventory_db": f"postgresql://user:pass@db.example.com/{tenant_id}_inventory",
                "patient_db": f"postgresql://user:pass@db.example.com/{tenant_id}_patients_anon"
            }
        }
    
    def track_usage(
        self,
        tenant_id: str,
        tokens_used: int,
        query_type: str,
        success: bool
    ):
        """
        Track usage for billing and monitoring.
        
        Args:
            tenant_id: Tenant identifier
            tokens_used: Number of tokens consumed
            query_type: Type of query
            success: Whether query succeeded
        """
        stats = self.usage_stats[tenant_id]
        stats["requests_count"] += 1
        stats["tokens_used"] += tokens_used
        
        if not success:
            stats["errors"] += 1
        
        # In production, write to database for billing
        logger.info(
            f"[{tenant_id}] Usage: {stats['requests_count']} requests, "
            f"{stats['tokens_used']} tokens, {stats['cache_hits']} cache hits"
        )
    
    def get_usage_stats(self, tenant_id: str) -> Dict:
        """
        Get usage statistics for tenant.
        
        Args:
            tenant_id: Tenant identifier
            
        Returns:
            Usage statistics
        """
        return self.usage_stats[tenant_id]
    
    async def route_query(
        self,
        tenant_id: str,
        query: str,
        query_type: str,
        user_id: str
    ) -> Dict:
        """
        Route query to appropriate handler with deduplication and rate limiting.
        
        Args:
            tenant_id: Tenant identifier
            query: User query
            query_type: Type of query
            user_id: User identifier
            
        Returns:
            Query response
        """
        # 1. Get tenant configuration
        config = self.get_tenant_config(tenant_id)
        
        # 2. Check if feature is enabled for tenant
        feature_map = {
            "sales": "sales_queries",
            "inventory": "inventory_queries",
            "patient_analytics": "patient_analytics",
            "ophthalmic_knowledge": "ophthalmic_knowledge"
        }
        
        feature_key = feature_map.get(query_type)
        if not config["features"].get(feature_key, False):
            raise HTTPException(
                status_code=403,
                detail=f"Feature '{query_type}' not enabled for your subscription"
            )
        
        # 3. Check rate limit
        if not self.check_rate_limit(tenant_id, config["rate_limit"]):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # 4. Check for duplicate request (cache)
        if config["cache_enabled"]:
            cached_response = self.check_duplicate_request(
                tenant_id, query, query_type
            )
            if cached_response:
                return {
                    **cached_response,
                    "from_cache": True,
                    "cached_at": datetime.utcnow().isoformat()
                }
        
        # 5. Process new request
        try:
            # This would call the actual RAG engine or model
            response = await self._process_query(
                tenant_id, query, query_type, config
            )
            
            # Track usage
            self.track_usage(
                tenant_id,
                tokens_used=response.get("tokens_used", 0),
                query_type=query_type,
                success=True
            )
            
            # Cache response
            if config["cache_enabled"]:
                self.cache_response(tenant_id, query, query_type, response)
            
            return {
                **response,
                "from_cache": False
            }
            
        except Exception as e:
            # Track error
            self.track_usage(tenant_id, 0, query_type, False)
            logger.error(f"[{tenant_id}] Query failed: {e}")
            raise
    
    async def _process_query(
        self,
        tenant_id: str,
        query: str,
        query_type: str,
        config: Dict
    ) -> Dict:
        """
        Process the actual query (placeholder for RAG engine integration).
        
        Args:
            tenant_id: Tenant identifier
            query: User query
            query_type: Type of query
            config: Tenant configuration
            
        Returns:
            Query response
        """
        # This would integrate with your RAG engine
        # For now, return mock response
        
        return {
            "answer": f"Mock answer for: {query}",
            "tokens_used": 150,
            "query_type": query_type,
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow().isoformat()
        }


# Global router instance
tenant_router = TenantRouter()


def get_tenant_router() -> TenantRouter:
    """Get the global tenant router instance."""
    return tenant_router
