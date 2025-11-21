#!/bin/bash
# Fix common 'any' types in client-side code
# Focus on map callbacks and event handlers

set -e

echo "🔧 Fixing client-side type safety..."
echo ""

# Find all client TypeScript/TSX files
FILES=$(find client/src -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null)

TOTAL_BEFORE=0
TOTAL_AFTER=0

# Count initial 'any' types
for file in $FILES; do
  count=$(grep -c ": any" "$file" 2>/dev/null || echo 0)
  TOTAL_BEFORE=$((TOTAL_BEFORE + count))
done

echo "📊 Initial 'any' count: $TOTAL_BEFORE"
echo ""

# Backup
echo "💾 Creating backups..."
for file in $FILES; do
  if grep -q ": any" "$file" 2>/dev/null; then
    cp "$file" "${file}.backup"
  fi
done

echo "🔧 Applying fixes..."
echo ""

# Fix common map callback patterns
echo "  → Fixing map callbacks..."
find client/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/\.map((item: any)/\.map(item/g' \
  -e 's/\.map((user: any)/\.map(user/g' \
  -e 's/\.map((role: any)/\.map(role/g' \
  -e 's/\.map((perm: any)/\.map(perm/g' \
  -e 's/\.map((permission: any)/\.map(permission/g' \
  -e 's/\.map((category: any)/\.map(category/g' \
  -e 's/\.map((row: any)/\.map(row/g' \
  -e 's/\.map((data: any)/\.map(data/g' \
  -e 's/\.map((option: any)/\.map(option/g' \
  -e 's/\.map((result: any)/\.map(result/g' \
  -e 's/\.map((entry: any)/\.map(entry/g' \
  -e 's/\.map((value: any)/\.map(value/g' \
  {} \;

# Fix filter callbacks
echo "  → Fixing filter callbacks..."
find client/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/\.filter((item: any)/\.filter(item/g' \
  -e 's/\.filter((user: any)/\.filter(user/g' \
  -e 's/\.filter((role: any)/\.filter(role/g' \
  -e 's/\.filter((perm: any)/\.filter(perm/g' \
  {} \;

# Fix forEach callbacks
echo "  → Fixing forEach callbacks..."
find client/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/\.forEach((item: any)/\.forEach(item/g' \
  -e 's/\.forEach((row: any)/\.forEach(row/g' \
  {} \;

# Fix find callbacks
echo "  → Fixing find callbacks..."
find client/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/\.find((item: any)/\.find(item/g' \
  -e 's/\.find((user: any)/\.find(user/g' \
  -e 's/\.find((role: any)/\.find(role/g' \
  {} \;

# Fix every/some callbacks
echo "  → Fixing every/some callbacks..."
find client/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/\.every((item: any)/\.every(item/g' \
  -e 's/\.every((p: any)/\.every(p/g' \
  -e 's/\.some((item: any)/\.some(item/g' \
  {} \;

# Count final 'any' types
for file in $FILES; do
  count=$(grep -c ": any" "$file" 2>/dev/null || echo 0)
  TOTAL_AFTER=$((TOTAL_AFTER + count))
done

ELIMINATED=$((TOTAL_BEFORE - TOTAL_AFTER))

echo ""
echo "✅ Client-side fixes applied!"
echo "📊 Final 'any' count: $TOTAL_AFTER"
echo "🎉 Eliminated: $ELIMINATED 'any' types"
echo ""

if [ "$TOTAL_AFTER" -gt 0 ]; then
  echo "📋 Top files still needing fixes:"
  for file in $FILES; do
    count=$(grep -c ": any" "$file" 2>/dev/null || echo 0)
    if [ "$count" -gt 0 ]; then
      echo "  $count - $file"
    fi
  done | sort -rn | head -10
fi

echo ""
echo "🔍 Next: Run 'npm run check' to validate TypeScript compilation"
