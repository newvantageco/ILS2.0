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

  # Step 1: Run SQL migrations (custom migrations for Stripe, Google Auth, etc.)
  echo "Step 1: Running SQL migrations..."
  if timeout 60 npm run db:migrate 2>&1; then
    echo "✓ SQL migrations completed successfully"
  else
    EXIT_CODE=$?
    echo "WARNING: SQL migrations failed or timed out (exit code: $EXIT_CODE)"
    echo "Continuing with schema sync..."
  fi

  # Step 2: Run drizzle-kit push to sync TypeScript schema
  echo "Step 2: Syncing TypeScript schema with database..."
  if timeout 60 npm run db:push 2>&1; then
    echo "✓ Schema sync completed successfully"
    return 0
  else
    EXIT_CODE=$?
    echo "WARNING: Schema sync failed or timed out (exit code: $EXIT_CODE)"
    echo "Attempting to start application anyway (schema may already be synced)"
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
