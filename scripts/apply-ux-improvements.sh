#!/bin/bash

# Apply UX Improvements Throughout Platform
# Systematically adds EmptyState, ErrorState, and LoadingSkeleton to all pages

set -e

echo "🎨 Applying UX Improvements Throughout ILS 2.0 Platform"
echo "========================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CLIENT_DIR="client/src/pages"
TOTAL_FILES=0
UPDATED_FILES=0

# Find all .tsx files that might need UX improvements
echo "📊 Scanning for pages..."
FILES=$(find "$CLIENT_DIR" -name "*.tsx" -type f)

for file in $FILES; do
  TOTAL_FILES=$((TOTAL_FILES + 1))
  
  # Check if file already has UX components
  if grep -q "EmptyState\|ErrorState\|LoadingSkeleton" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Already has UX components: $file"
    continue
  fi
  
  # Check if file has data fetching (useQuery)
  if grep -q "useQuery" "$file" 2>/dev/null; then
    echo -e "${BLUE}→${NC} Needs UX components: $file"
    # Add to list for manual review
    echo "$file" >> ux-improvements-needed.txt
  fi
done

echo ""
echo "📋 Summary:"
echo "  Total pages scanned: $TOTAL_FILES"
echo "  Pages needing UX: $(wc -l < ux-improvements-needed.txt 2>/dev/null || echo 0)"
echo ""
echo "✅ Analysis complete. Review ux-improvements-needed.txt for pages to update."
echo ""
echo "Next steps:"
echo "1. Review the list of pages"
echo "2. Add import statements:"
echo "   import { EmptyState } from '@/components/EmptyState';"
echo "   import { ErrorState } from '@/components/ErrorState';"
echo "   import { LoadingSkeleton } from '@/components/LoadingSkeleton';"
echo "3. Apply the pattern:"
echo "   {isLoading && <LoadingSkeleton ... />}"
echo "   {error && <ErrorState onRetry={refetch} ... />}"
echo "   {empty && <EmptyState action={{...}} />}"
