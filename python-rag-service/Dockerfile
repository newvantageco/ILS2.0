# Multi-stage build for Python RAG Service
# Railway-optimized with dynamic PORT support
FROM python:3.11-slim as base

# Set working directory
WORKDIR /app

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for model cache
RUN mkdir -p /app/.cache

# Set environment variables
# Railway will override PORT automatically
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/app/.cache
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache
ENV PORT=8001

# Expose default port (Railway overrides with $PORT)
EXPOSE 8001

# Health check using PORT environment variable
# Longer start-period (3min) to allow model download on first deployment
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Run the application - Railway will set PORT automatically
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
