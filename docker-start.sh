#!/bin/sh
# Don't exit on errors for migration step
set +e

echo "=== Starting ILS 2.0 Application ==="
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-5000}"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Function to run migrations with timeout
run_migrations() {
  echo "Running database migrations..."

  # Check if DATABASE_URL is set
  if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL is not set. Skipping migrations."
    return 1
  fi

  # Run migrations with timeout (60 seconds)
  # Using timeout command with fallback to continue if it fails
  if timeout 60 npm run db:push 2>&1; then
    echo "✓ Database migrations completed successfully"
    return 0
  else
    EXIT_CODE=$?
    echo "WARNING: Database migrations failed or timed out (exit code: $EXIT_CODE)"
    echo "Attempting to start application anyway (migrations may be idempotent or already applied)"
    return 1
  fi
}

# Attempt migrations but don't fail if they don't complete
run_migrations || echo "Continuing with application startup..."

# Re-enable error checking for application startup
set -e

echo "Starting application..."
echo "Command: node dist/index.js"
exec node dist/index.js
