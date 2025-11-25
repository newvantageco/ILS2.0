# ILS 2.0 - Python RAG Service

Retrieval-Augmented Generation (RAG) microservice for the ILS 2.0 multi-tenant AI system.

## Features

- **Fast Embeddings**: Uses sentence-transformers for local embedding generation
- **Vector Search**: Integrates with pgvector for semantic similarity search
- **Multi-tenant**: Built-in tenant isolation for secure knowledge base access
- **RESTful API**: FastAPI-based REST endpoints for easy integration
- **High Performance**: Optimized for low-latency embedding and search operations

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **sentence-transformers**: State-of-the-art text embeddings
- **pgvector**: PostgreSQL extension for vector similarity search
- **psycopg2**: PostgreSQL database adapter

## Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

## Running the Service

### Development
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8001
```

### Production
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Docker
```bash
docker build -t ils-rag-service .
docker run -p 8001:8001 --env-file .env ils-rag-service
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Generate Embedding
```bash
POST /api/embeddings/generate
Content-Type: application/json

{
  "text": "What are progressive lenses?",
  "model": "all-MiniLM-L6-v2"
}
```

### Search Knowledge Base
```bash
POST /api/rag/search
Content-Type: application/json

{
  "query": "What are progressive lenses?",
  "company_id": "company-123",
  "limit": 5,
  "threshold": 0.7
}
```

### Index Document
```bash
POST /api/rag/index-document
Content-Type: application/json

{
  "company_id": "company-123",
  "user_id": "user-456",
  "filename": "lens-guide.pdf",
  "content": "Progressive lenses are...",
  "category": "products"
}
```

## Integration with Node.js Backend

The Python RAG service is designed to work alongside the Node.js backend:

1. Node.js backend receives user queries
2. Queries are forwarded to Python RAG service for embedding generation
3. Python service performs vector similarity search using pgvector
4. Results are returned to Node.js for response generation

See the Node.js integration guide in `/server/services/PythonRAGService.ts`.

## Testing

Run tests:
```bash
pytest tests/ -v
```

Run with coverage:
```bash
pytest tests/ --cov=. --cov-report=html
```

## Performance

- **Embedding generation**: ~10-50ms per text (CPU)
- **Vector search**: ~5-20ms for 10k+ documents
- **Throughput**: 100+ requests/second (single worker)

## Architecture

```
┌─────────────────────────────────────────┐
│         Node.js Backend                 │
│      (Express + TypeScript)             │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
               ▼
┌─────────────────────────────────────────┐
│      Python RAG Service (FastAPI)       │
├─────────────────────────────────────────┤
│  • Embedding Service                    │
│    - sentence-transformers              │
│    - Batch processing                   │
│                                         │
│  • RAG Search Service                   │
│    - pgvector queries                   │
│    - Tenant isolation                   │
│    - Similarity ranking                 │
└──────────────┬──────────────────────────┘
               │ psycopg2
               ▼
┌─────────────────────────────────────────┐
│     PostgreSQL + pgvector               │
│     (Vector Database)                   │
└─────────────────────────────────────────┘
```

## License

Proprietary - ILS 2.0 Platform
