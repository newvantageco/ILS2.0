#!/usr/bin/env bash
set -euo pipefail

# Helper to apply a single SQL migration using DATABASE_URL
# Usage: DATABASE_URL=postgres://... ./scripts/apply-migration.sh [migrations/2025-11-07-0001_add_order_analytics_error_column.sql]

MIGRATION_FILE=${1:-migrations/2025-11-07-0001_add_order_analytics_error_column.sql}

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Set it to your Postgres connection string and re-run."
  echo "Example: DATABASE_URL=postgres://user:pass@localhost:5432/dbname $0"
  exit 2
fi

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "ERROR: Migration file not found: $MIGRATION_FILE"
  exit 3
fi

echo "Applying migration $MIGRATION_FILE to $DATABASE_URL"

if command -v psql >/dev/null 2>&1; then
  echo "Using psql to apply migration..."
  psql "$DATABASE_URL" -f "$MIGRATION_FILE"
  echo "Migration applied with psql."
  exit 0
fi

echo "psql not found. Falling back to 'npm run db:push' which will apply migrations via drizzle-kit."
echo "This may apply more than the single migration specified."

if command -v npm >/dev/null 2>&1; then
  npm run db:push
  echo "Ran npm run db:push. Verify your DB state."
  exit 0
fi

echo "No supported migration runner found (psql or npm). Install psql or run your DB migration tool manually."
exit 4
