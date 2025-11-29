#!/bin/sh
# Force unbuffered output for real-time logging
exec 1>&1 2>&2

echo "=== Starting ILS 2.0 Application ==="
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-5000}"
echo "Host: ${HOST:-0.0.0.0}"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Node version: $(node --version)"

# Don't exit on errors for migration step
set +e

# Function to run migrations with timeout
run_migrations() {
  echo "[migrations] Checking database configuration..."

  # Check if DATABASE_URL is set
  if [ -z "$DATABASE_URL" ]; then
    echo "[migrations] WARNING: DATABASE_URL is not set. Skipping schema sync."
    return 1
  fi

  echo "[migrations] DATABASE_URL is configured"
  echo "[migrations] Running drizzle-kit push --force..."

  # Run with timeout to prevent hanging (60 second timeout)
  timeout 60 npx drizzle-kit push --force 2>&1
  EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ]; then
    echo "[migrations] ✓ Database schema sync completed successfully"
    return 0
  elif [ $EXIT_CODE -eq 124 ]; then
    echo "[migrations] WARNING: Schema sync timed out after 60s"
    echo "[migrations] Continuing anyway - schema may already exist"
    return 1
  else
    echo "[migrations] WARNING: Schema sync failed (exit code: $EXIT_CODE)"
    echo "[migrations] Continuing anyway - schema may already exist"
    return 1
  fi
}

# Attempt migrations but don't fail if they don't complete
echo "[startup] Running database migrations..."
run_migrations || echo "[startup] Migrations skipped or failed - continuing..."

# Re-enable error checking for application startup
set -e

echo "[startup] Starting Node.js application..."
echo "[startup] Command: node dist/index.js"
echo "[startup] Working directory: $(pwd)"
echo "[startup] Files in dist/: $(ls -la dist/ 2>/dev/null | head -5 || echo 'dist/ not found')"

# Use exec to replace shell with node process for proper signal handling
exec node dist/index.js
