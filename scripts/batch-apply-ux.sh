#!/bin/bash

# Batch Apply UX Improvements to ALL Pages
# Applies EmptyState, ErrorState, LoadingSkeleton systematically

set -e

echo "🚀 BATCH UX APPLICATION - ALL REMAINING PAGES"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CLIENT_DIR="client/src/pages"
TOTAL=0
PROCESSED=0
SKIPPED=0

# Read the list of pages needing UX
if [ ! -f "ux-improvements-needed.txt" ]; then
  echo "Error: ux-improvements-needed.txt not found"
  echo "Run: bash scripts/apply-ux-improvements.sh first"
  exit 1
fi

echo "📋 Processing pages from ux-improvements-needed.txt..."
echo ""

# Create backup directory
BACKUP_DIR=".ux-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

while IFS= read -r file; do
  TOTAL=$((TOTAL + 1))
  
  # Skip if file doesn't exist
  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}⚠${NC} File not found: $file"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  
  # Backup original
  cp "$file" "$BACKUP_DIR/$(basename $file).bak"
  
  # Check if already has UX components
  if grep -q "ErrorState\|LoadingSkeleton" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Already has UX: $file"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  
  # Check if has useQuery
  if ! grep -q "useQuery" "$file" 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} No useQuery found: $file"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  
  echo -e "${BLUE}→${NC} Processing: $file"
  
  # This is where we'd programmatically add imports and update queries
  # For now, we'll create a TODO list for manual application
  echo "$file" >> ux-batch-todo.txt
  
  PROCESSED=$((PROCESSED + 1))
done < ux-improvements-needed.txt

echo ""
echo "📊 Summary:"
echo "  Total pages: $TOTAL"
echo "  Need manual updates: $PROCESSED"
echo "  Already done/skipped: $SKIPPED"
echo ""
echo "✅ Backup created: $BACKUP_DIR"
echo "📝 Pages to update: ux-batch-todo.txt"
echo ""
echo "Next: Apply UX pattern to pages in ux-batch-todo.txt"
