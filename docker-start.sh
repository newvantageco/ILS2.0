#!/bin/sh
# Don't exit on errors for migration step
set +e

echo "=== Starting ILS 2.0 Application ==="
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-5000}"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Function to run migrations with timeout
run_migrations() {
  echo "Running database schema sync..."

  # Check if DATABASE_URL is set
  if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL is not set. Skipping schema sync."
    return 1
  fi

  # Use db:push to sync TypeScript schema to database
  # This creates all tables defined in shared/schema.ts
  # --force flag prevents interactive prompts in non-TTY environment
  echo "Syncing schema with db:push --force..."
  if npx drizzle-kit push --force 2>&1; then
    echo "✓ Database schema sync completed successfully"
    return 0
  else
    EXIT_CODE=$?
    echo "WARNING: Schema sync failed (exit code: $EXIT_CODE)"
    echo "Attempting to start application anyway (schema may already exist)"
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
