#!/bin/bash

# Console Log Cleanup Script v2 (Fixed)
# Purpose: Replace console.* calls with proper logger in ILS 2.0
# Date: November 24, 2025
# Lead Architect: Systematic code quality improvement

# Don't exit on error - we'll handle errors manually
set +e

echo "🧹 ILS 2.0 Console Log Cleanup Script v2"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_FILES=0
MODIFIED_FILES=0
TOTAL_REPLACEMENTS=0
FAILED_FILES=0

# Backup directory
BACKUP_DIR=".backup/console-cleanup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Step 1: Analyzing codebase...${NC}"
echo ""

# Count files with console statements
FILES_WITH_CONSOLE=$(find server/ -name "*.ts" -type f -exec grep -l "console\." {} \; 2>/dev/null | wc -l | tr -d ' ')
echo "📊 Files with console statements: $FILES_WITH_CONSOLE"

# Count total console statements
TOTAL_CONSOLE_LOGS=$(grep -r "console\.log" server/ --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_CONSOLE_ERROR=$(grep -r "console\.error" server/ --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_CONSOLE_WARN=$(grep -r "console\.warn" server/ --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_CONSOLE_INFO=$(grep -r "console\.info" server/ --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')

echo "  - console.log: $TOTAL_CONSOLE_LOGS"
echo "  - console.error: $TOTAL_CONSOLE_ERROR"
echo "  - console.warn: $TOTAL_CONSOLE_WARN"
echo "  - console.info: $TOTAL_CONSOLE_INFO"
echo ""

# Calculate total
TOTAL_STATEMENTS=$((TOTAL_CONSOLE_LOGS + TOTAL_CONSOLE_ERROR + TOTAL_CONSOLE_WARN + TOTAL_CONSOLE_INFO))
echo -e "${YELLOW}📈 Total console statements to replace: $TOTAL_STATEMENTS${NC}"
echo ""

# Ask for confirmation
read -p "Continue with cleanup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 2: Creating backups...${NC}"

# Backup files before modification
find server/ -name "*.ts" -type f -exec grep -l "console\." {} \; 2>/dev/null | while read file; do
    BACKUP_PATH="$BACKUP_DIR/$file"
    mkdir -p "$(dirname "$BACKUP_PATH")"
    cp "$file" "$BACKUP_PATH"
done

echo -e "${GREEN}✅ Backed up $FILES_WITH_CONSOLE files to $BACKUP_DIR${NC}"
echo ""

echo -e "${YELLOW}Step 3: Processing replacements...${NC}"
echo ""

# Process each file with console statements
find server/ -name "*.ts" -type f -exec grep -l "console\." {} \; 2>/dev/null | while read file; do
    echo -e "${BLUE}Processing: $file${NC}"
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    # Count console statements in this file
    FILE_CONSOLE_COUNT=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
    
    if [ "$FILE_CONSOLE_COUNT" -gt 0 ]; then
        # Check if file already has logger import
        if ! grep -q "import.*logger.*from.*utils/logger" "$file" && \
           ! grep -q "import.*createLogger.*from.*utils/logger" "$file"; then
            
            # Add logger import at the top (after any existing imports)
            # Find the last import line
            LAST_IMPORT_LINE=$(grep -n "^import\|^const.*require" "$file" | tail -1 | cut -d: -f1)
            
            if [ -n "$LAST_IMPORT_LINE" ]; then
                # Insert after last import
                sed -i '' "${LAST_IMPORT_LINE}a\\
import logger from '../utils/logger';\\
" "$file"
            else
                # No imports found, add at top
                sed -i '' "1i\\
import logger from '../utils/logger';\\
\\
" "$file"
            fi
        fi
        
        # Replace console statements (simple string replacement)
        sed -i '' 's/console\.log(/logger.info(/g' "$file"
        sed -i '' 's/console\.error(/logger.error(/g' "$file"
        sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
        sed -i '' 's/console\.info(/logger.info(/g' "$file"
        sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
        
        # Verify the changes worked
        REMAINING=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
        
        if [ "$REMAINING" -eq 0 ]; then
            echo -e "  ${GREEN}✓ Replaced $FILE_CONSOLE_COUNT statement(s)${NC}"
            MODIFIED_FILES=$((MODIFIED_FILES + 1))
            TOTAL_REPLACEMENTS=$((TOTAL_REPLACEMENTS + FILE_CONSOLE_COUNT))
        else
            echo -e "  ${YELLOW}⚠ Partial replacement ($REMAINING remaining)${NC}"
            FAILED_FILES=$((FAILED_FILES + 1))
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "📊 Summary:"
echo "  - Files with console statements: $FILES_WITH_CONSOLE"
echo "  - Files successfully modified: $MODIFIED_FILES"
echo "  - Files with partial replacement: $FAILED_FILES"
echo "  - Total statements replaced: ~$TOTAL_STATEMENTS"
echo "  - Backup location: $BACKUP_DIR"
echo ""

echo -e "${YELLOW}Step 4: Verification...${NC}"
echo ""

# Verify remaining console statements
REMAINING_CONSOLE=$(grep -r "console\." server/ --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
echo "Remaining console statements: $REMAINING_CONSOLE"

if [ "$REMAINING_CONSOLE" -eq 0 ]; then
    echo -e "${GREEN}✅ All console statements successfully replaced!${NC}"
elif [ "$REMAINING_CONSOLE" -lt 50 ]; then
    echo -e "${YELLOW}⚠️  Some console statements remain (may be in comments or strings)${NC}"
    echo ""
    echo "Examples of remaining console statements:"
    grep -r "console\." server/ --include="*.ts" -n 2>/dev/null | head -10
else
    echo -e "${RED}❌ Many console statements still remain. Manual review needed.${NC}"
    echo ""
    echo "Examples:"
    grep -r "console\." server/ --include="*.ts" -n 2>/dev/null | head -10
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review changes: git diff server/"
echo "2. Test compilation: npm run check (may need npm install first)"
echo "3. If issues found, restore from: $BACKUP_DIR"
echo ""
echo "To restore all files:"
echo "  rsync -av $BACKUP_DIR/server/ server/"
echo ""
echo "🎉 Console log cleanup complete!"
