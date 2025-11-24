#!/bin/bash

# Console Log Cleanup Script
# Purpose: Replace console.* calls with proper logger in ILS 2.0
# Date: November 24, 2025
# Lead Architect: Systematic code quality improvement

set -e  # Exit on error

echo "🧹 ILS 2.0 Console Log Cleanup Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_FILES=0
MODIFIED_FILES=0
TOTAL_REPLACEMENTS=0

# Backup directory
BACKUP_DIR=".backup/console-cleanup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Step 1: Analyzing codebase...${NC}"
echo ""

# Count files with console statements
FILES_WITH_CONSOLE=$(find server/ -name "*.ts" -exec grep -l "console\." {} \; 2>/dev/null | wc -l | tr -d ' ')
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
find server/ -name "*.ts" -exec grep -l "console\." {} \; 2>/dev/null | while read file; do
    BACKUP_PATH="$BACKUP_DIR/$file"
    mkdir -p "$(dirname "$BACKUP_PATH")"
    cp "$file" "$BACKUP_PATH"
done

echo -e "${GREEN}✅ Backed up $FILES_WITH_CONSOLE files to $BACKUP_DIR${NC}"
echo ""

echo -e "${YELLOW}Step 3: Processing replacements...${NC}"
echo ""

# Function to check if file already has logger import
has_logger_import() {
    local file=$1
    grep -q "import.*logger.*from.*utils/logger" "$file" || \
    grep -q "import.*createLogger.*from.*utils/logger" "$file"
}

# Function to add logger import if missing
add_logger_import() {
    local file=$1
    
    if ! has_logger_import "$file"; then
        # Determine import style based on file location
        if [[ "$file" == *"/routes/"* ]]; then
            # Route files typically use createLogger with context
            sed -i '' "1i\\
import { createLogger } from '../utils/logger';\\
const logger = createLogger('$(basename "$file" .ts)');\\
" "$file"
        else
            # Other files use default logger
            sed -i '' "1i\\
import logger from '../utils/logger';\\
" "$file"
        fi
        return 0
    fi
    return 1
}

# Process each file with console statements
find server/ -name "*.ts" -exec grep -l "console\." {} \; 2>/dev/null | while read file; do
    echo "Processing: $file"
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    # Count console statements in this file
    FILE_CONSOLE_COUNT=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
    
    if [ "$FILE_CONSOLE_COUNT" -gt 0 ]; then
        # Add logger import if missing
        add_logger_import "$file"
        
        # Replace console.log with logger.info (default informational logging)
        sed -i '' 's/console\.log(/logger.info(/g' "$file"
        
        # Replace console.error with logger.error
        sed -i '' 's/console\.error(/logger.error(/g' "$file"
        
        # Replace console.warn with logger.warn
        sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
        
        # Replace console.info with logger.info
        sed -i '' 's/console\.info(/logger.info(/g' "$file"
        
        # Replace console.debug with logger.debug
        sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
        
        MODIFIED_FILES=$((MODIFIED_FILES + 1))
        TOTAL_REPLACEMENTS=$((TOTAL_REPLACEMENTS + FILE_CONSOLE_COUNT))
        
        echo "  ✓ Replaced $FILE_CONSOLE_COUNT statement(s)"
    fi
done

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "📊 Summary:"
echo "  - Files analyzed: $FILES_WITH_CONSOLE"
echo "  - Files modified: $MODIFIED_FILES"
echo "  - Total replacements: $TOTAL_STATEMENTS"
echo "  - Backup location: $BACKUP_DIR"
echo ""

echo -e "${YELLOW}Step 4: Verification...${NC}"
echo ""

# Verify remaining console statements
REMAINING_CONSOLE=$(grep -r "console\." server/ --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
echo "Remaining console statements: $REMAINING_CONSOLE"

if [ "$REMAINING_CONSOLE" -eq 0 ]; then
    echo -e "${GREEN}✅ All console statements successfully replaced!${NC}"
else
    echo -e "${YELLOW}⚠️  Some console statements remain (may be in comments or strings)${NC}"
    echo ""
    echo "Manual review needed for:"
    grep -r "console\." server/ --include="*.ts" -n 2>/dev/null | head -10
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run TypeScript check: npm run check"
echo "2. Run tests: npm test"
echo "3. Review git diff: git diff server/"
echo "4. If issues found, restore from: $BACKUP_DIR"
echo ""
echo "🎉 Console log cleanup complete!"
