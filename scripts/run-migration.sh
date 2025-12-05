#!/usr/bin/env bash
set -e

echo "🔍 Getting DATABASE_URL from Railway..."

# Get DATABASE_URL from railway
DB_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4)

if [ -z "$DB_URL" ]; then
  echo "❌ Failed to get DATABASE_URL from Railway"
  exit 1
fi

echo "✅ Got DATABASE_URL"
echo "🚀 Running migration..."

# Export and run migration
export DATABASE_URL="$DB_URL"
npx tsx scripts/apply-index-migration.ts
