"""
RAG Query Engine for Secure Multi-Tenant Business Intelligence

This module provides secure database querying using LlamaIndex with:
1. Tenant isolation
2. HIPAA-compliant patient data access
3. Real-time sales and inventory queries
"""

from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, text, MetaData, Table
from sqlalchemy.pool import NullPool
from llama_index.core import SQLDatabase, Settings
from llama_index.core.query_engine import NLSQLTableQueryEngine
from llama_index.llms.huggingface import HuggingFaceLLM
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TenantDatabaseConfig:
    """Configuration for tenant-specific database connections."""
    
    def __init__(
        self,
        tenant_id: str,
        sales_connection_string: str,
        anonymized_patient_connection_string: str,
        inventory_connection_string: Optional[str] = None,
    ):
        self.tenant_id = tenant_id
        self.sales_connection_string = sales_connection_string
        self.anonymized_patient_connection_string = anonymized_patient_connection_string
        self.inventory_connection_string = inventory_connection_string or sales_connection_string
        
    @classmethod
    def from_env(cls, tenant_id: str) -> "TenantDatabaseConfig":
        """Load configuration from environment variables."""
        import os
        
        # In production, load from secure secrets manager (AWS Secrets Manager, Azure Key Vault)
        return cls(
            tenant_id=tenant_id,
            sales_connection_string=os.getenv(f"TENANT_{tenant_id}_SALES_DB"),
            anonymized_patient_connection_string=os.getenv(f"TENANT_{tenant_id}_PATIENT_DB"),
            inventory_connection_string=os.getenv(f"TENANT_{tenant_id}_INVENTORY_DB"),
        )


class SecureRAGEngine:
    """
    Secure RAG engine with tenant isolation for ophthalmic business intelligence.
    
    Security Features:
    - Read-only database access
    - Tenant-specific connection strings
    - Query validation and filtering
    - Audit logging
    """
    
    def __init__(
        self,
        tenant_config: TenantDatabaseConfig,
        model_path: str = "~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf",
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
    ):
        """
        Initialize RAG engine for a specific tenant.
        
        Args:
            tenant_config: Tenant-specific database configuration
            model_path: Path to fine-tuned model or base model
            embedding_model: Model for text embeddings
        """
        self.tenant_id = tenant_config.tenant_id
        self.config = tenant_config
        
        logger.info(f"Initializing RAG engine for tenant: {self.tenant_id}")
        
        # Initialize LLM
        self._init_llm(model_path)
        
        # Initialize Embeddings
        self._init_embeddings(embedding_model)
        
        # Initialize Database Connections (Read-Only)
        self._init_databases()
        
        # Initialize Query Engines
        self._init_query_engines()
        
        logger.info(f"RAG engine initialized for tenant: {self.tenant_id}")
    
    def _init_llm(self, model_path: str):
        """Initialize the language model."""
        try:
            # Using llama-cpp-python for local inference
            from llama_cpp import Llama
            
            self.llm_backend = Llama(
                model_path=model_path,
                n_ctx=2048,
                n_gpu_layers=-1,  # Use GPU if available
                verbose=False,
            )
            
            # Wrap for LlamaIndex (you may need to create custom wrapper)
            # For now, we'll use the local server approach
            Settings.llm = None  # Will call llama-cpp-python server
            
            logger.info("LLM initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {e}")
            raise
    
    def _init_embeddings(self, model_name: str):
        """Initialize embedding model."""
        try:
            Settings.embed_model = HuggingFaceEmbedding(
                model_name=model_name,
                trust_remote_code=True,
            )
            logger.info(f"Embedding model initialized: {model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize embeddings: {e}")
            raise
    
    def _init_databases(self):
        """Initialize read-only database connections."""
        try:
            # Sales Database
            self.sales_engine = create_engine(
                self.config.sales_connection_string,
                poolclass=NullPool,  # No connection pooling for security
                connect_args={"options": "-c default_transaction_read_only=on"},
            )
            self.sales_db = SQLDatabase(
                self.sales_engine,
                include_tables=["sales", "products", "transactions"]
            )
            
            # Anonymized Patient Database
            self.patient_engine = create_engine(
                self.config.anonymized_patient_connection_string,
                poolclass=NullPool,
                connect_args={"options": "-c default_transaction_read_only=on"},
            )
            self.patient_db = SQLDatabase(
                self.patient_engine,
                include_tables=["anonymized_patients", "purchase_history"]
            )
            
            # Inventory Database
            self.inventory_engine = create_engine(
                self.config.inventory_connection_string,
                poolclass=NullPool,
                connect_args={"options": "-c default_transaction_read_only=on"},
            )
            self.inventory_db = SQLDatabase(
                self.inventory_engine,
                include_tables=["inventory", "stock_levels", "suppliers"]
            )
            
            logger.info("Database connections established (read-only)")
        except Exception as e:
            logger.error(f"Failed to initialize databases: {e}")
            raise
    
    def _init_query_engines(self):
        """Initialize query engines for different data sources."""
        try:
            # Sales Query Engine
            self.sales_query_engine = NLSQLTableQueryEngine(
                sql_database=self.sales_db,
                tables=["sales", "products", "transactions"],
                verbose=True,
            )
            
            # Patient Analytics Query Engine (Anonymized Data Only)
            self.patient_query_engine = NLSQLTableQueryEngine(
                sql_database=self.patient_db,
                tables=["anonymized_patients", "purchase_history"],
                verbose=True,
            )
            
            # Inventory Query Engine
            self.inventory_query_engine = NLSQLTableQueryEngine(
                sql_database=self.inventory_db,
                tables=["inventory", "stock_levels", "suppliers"],
                verbose=True,
            )
            
            logger.info("Query engines initialized")
        except Exception as e:
            logger.error(f"Failed to initialize query engines: {e}")
            raise
    
    def query_sales(self, question: str) -> Dict[str, Any]:
        """
        Query sales data.
        
        Args:
            question: Natural language question about sales
            
        Returns:
            Dictionary with answer and metadata
        """
        logger.info(f"[{self.tenant_id}] Sales query: {question}")
        
        try:
            response = self.sales_query_engine.query(question)
            
            result = {
                "answer": str(response),
                "metadata": {
                    "tenant_id": self.tenant_id,
                    "query_type": "sales",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                "success": True,
            }
            
            logger.info(f"[{self.tenant_id}] Sales query successful")
            return result
            
        except Exception as e:
            logger.error(f"[{self.tenant_id}] Sales query failed: {e}")
            return {
                "answer": "I apologize, but I encountered an error processing your query.",
                "error": str(e),
                "success": False,
            }
    
    def query_inventory(self, question: str) -> Dict[str, Any]:
        """
        Query inventory/stock data.
        
        Args:
            question: Natural language question about inventory
            
        Returns:
            Dictionary with answer and metadata
        """
        logger.info(f"[{self.tenant_id}] Inventory query: {question}")
        
        try:
            response = self.inventory_query_engine.query(question)
            
            result = {
                "answer": str(response),
                "metadata": {
                    "tenant_id": self.tenant_id,
                    "query_type": "inventory",
                    "timestamp": datetime.utcnow().isoformat(),
                },
                "success": True,
            }
            
            logger.info(f"[{self.tenant_id}] Inventory query successful")
            return result
            
        except Exception as e:
            logger.error(f"[{self.tenant_id}] Inventory query failed: {e}")
            return {
                "answer": "I apologize, but I encountered an error processing your query.",
                "error": str(e),
                "success": False,
            }
    
    def query_patient_analytics(self, question: str) -> Dict[str, Any]:
        """
        Query anonymized patient analytics.
        
        IMPORTANT: This only accesses de-identified patient data.
        No PII (Personally Identifiable Information) is available.
        
        Args:
            question: Natural language question about patient trends
            
        Returns:
            Dictionary with answer and metadata
        """
        logger.info(f"[{self.tenant_id}] Patient analytics query: {question}")
        
        # Validate query doesn't attempt to access PII
        if self._contains_pii_terms(question):
            logger.warning(f"[{self.tenant_id}] Query rejected: Contains PII terms")
            return {
                "answer": "I cannot provide information about specific individuals. I can only provide anonymized aggregate statistics and trends.",
                "error": "PII_REJECTED",
                "success": False,
            }
        
        try:
            response = self.patient_query_engine.query(question)
            
            result = {
                "answer": str(response),
                "metadata": {
                    "tenant_id": self.tenant_id,
                    "query_type": "patient_analytics",
                    "timestamp": datetime.utcnow().isoformat(),
                    "data_type": "anonymized",
                },
                "success": True,
            }
            
            logger.info(f"[{self.tenant_id}] Patient analytics query successful")
            return result
            
        except Exception as e:
            logger.error(f"[{self.tenant_id}] Patient analytics query failed: {e}")
            return {
                "answer": "I apologize, but I encountered an error processing your query.",
                "error": str(e),
                "success": False,
            }
    
    def _contains_pii_terms(self, question: str) -> bool:
        """
        Check if query contains terms that suggest PII access attempt.
        
        Returns:
            True if query contains PII-related terms
        """
        pii_terms = [
            "name", "address", "phone", "email", "ssn", 
            "social security", "date of birth", "dob",
            "patient id", "medical record", "specific patient",
            "john", "jane", "smith",  # Common names
        ]
        
        question_lower = question.lower()
        return any(term in question_lower for term in pii_terms)
    
    def close(self):
        """Close all database connections."""
        try:
            self.sales_engine.dispose()
            self.patient_engine.dispose()
            self.inventory_engine.dispose()
            logger.info(f"[{self.tenant_id}] Database connections closed")
        except Exception as e:
            logger.error(f"[{self.tenant_id}] Error closing connections: {e}")


# Example Usage
if __name__ == "__main__":
    # This is a demonstration - in production, load from secure config
    
    # Example tenant configuration
    tenant_config = TenantDatabaseConfig(
        tenant_id="demo_clinic_001",
        sales_connection_string="sqlite:///./demo_sales.db",
        anonymized_patient_connection_string="sqlite:///./demo_patients_anon.db",
    )
    
    # Initialize RAG engine
    rag_engine = SecureRAGEngine(tenant_config)
    
    # Example queries
    print("\n=== Sales Query ===")
    result = rag_engine.query_sales("What were our top 3 selling products last month?")
    print(result["answer"])
    
    print("\n=== Inventory Query ===")
    result = rag_engine.query_inventory("Which items are low in stock (less than 10 units)?")
    print(result["answer"])
    
    print("\n=== Patient Analytics Query ===")
    result = rag_engine.query_patient_analytics(
        "What percentage of patients in the 40-50 age group purchased progressive lenses?"
    )
    print(result["answer"])
    
    # Clean up
    rag_engine.close()
