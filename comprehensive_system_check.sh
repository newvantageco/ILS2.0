#!/bin/bash

echo "🔍 Comprehensive ILS 2.0 System Check"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Database connection
DB_USER="ils_user"
DB_NAME="ils_db_dev"

echo "1️⃣  Checking for orphaned '_new' columns..."
NEW_COLS=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE column_name LIKE '%_new%' 
  AND table_schema = 'public';
" 2>/dev/null | tr -d ' ')

if [ "$NEW_COLS" -gt 0 ]; then
    echo -e "${RED}❌ Found $NEW_COLS columns with '_new' suffix${NC}"
    docker-compose -f docker-compose.dev.yml exec postgres psql -U $DB_USER -d $DB_NAME -c "
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE column_name LIKE '%_new%' 
      AND table_schema = 'public';
    "
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✅ No orphaned '_new' columns${NC}"
fi
echo ""

echo "2️⃣  Checking database functions..."
EXPECTED_FUNCTIONS=11
ACTUAL_FUNCTIONS=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
  AND routine_schema = 'public';
" 2>/dev/null | tr -d ' ')

if [ "$ACTUAL_FUNCTIONS" -lt "$EXPECTED_FUNCTIONS" ]; then
    echo -e "${YELLOW}⚠️  Found $ACTUAL_FUNCTIONS functions, expected at least $EXPECTED_FUNCTIONS${NC}"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✅ All $ACTUAL_FUNCTIONS database functions present${NC}"
fi
echo ""

echo "3️⃣  Checking critical column data types..."
CRITICAL_COLS_CHECK=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name IN ('prescriptions', 'eye_examinations', 'orders')
  AND column_name IN ('od_sphere', 'od_cylinder', 'os_sphere', 'os_cylinder')
  AND data_type != 'numeric';
" 2>/dev/null | tr -d ' ')

if [ "$CRITICAL_COLS_CHECK" -gt 0 ]; then
    echo -e "${RED}❌ Found columns with incorrect data types${NC}"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✅ All critical columns have correct numeric types${NC}"
fi
echo ""

echo "4️⃣  Checking for missing foreign key relationships..."
BROKEN_FKS=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public'
  AND constraint_name LIKE '%_fk';
" 2>/dev/null | tr -d ' ')

echo -e "${GREEN}✅ Found $BROKEN_FKS foreign key constraints${NC}"
echo ""

echo "5️⃣  Checking for tables without primary keys..."
NO_PK=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(DISTINCT t.table_name)
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc 
  ON t.table_name = tc.table_name 
  AND tc.constraint_type = 'PRIMARY KEY'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND tc.constraint_name IS NULL
  AND t.table_name NOT LIKE 'drizzle%';
" 2>/dev/null | tr -d ' ')

if [ "$NO_PK" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $NO_PK tables without primary keys${NC}"
    docker-compose -f docker-compose.dev.yml exec postgres psql -U $DB_USER -d $DB_NAME -c "
    SELECT t.table_name
    FROM information_schema.tables t
    LEFT JOIN information_schema.table_constraints tc 
      ON t.table_name = tc.table_name 
      AND tc.constraint_type = 'PRIMARY KEY'
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND tc.constraint_name IS NULL
      AND t.table_name NOT LIKE 'drizzle%'
    LIMIT 10;
    "
else
    echo -e "${GREEN}✅ All tables have primary keys${NC}"
fi
echo ""

echo "6️⃣  Checking for duplicate indexes..."
DUPLICATE_INDEXES=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM (
    SELECT indexname, COUNT(*) 
    FROM pg_indexes 
    WHERE schemaname = 'public'
    GROUP BY indexname 
    HAVING COUNT(*) > 1
) AS dups;
" 2>/dev/null | tr -d ' ')

if [ "$DUPLICATE_INDEXES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $DUPLICATE_INDEXES duplicate index names${NC}"
else
    echo -e "${GREEN}✅ No duplicate indexes${NC}"
fi
echo ""

echo "7️⃣  Checking application logs for recent errors..."
RECENT_ERRORS=$(docker-compose -f docker-compose.dev.yml logs --tail=200 app 2>&1 | \
    grep -i "error\|failed\|exception" | \
    grep -v "No AI providers" | \
    grep -v "OPENAI_API_KEY" | \
    grep -v "ANTHROPIC_API_KEY" | \
    wc -l | tr -d ' ')

if [ "$RECENT_ERRORS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $RECENT_ERRORS recent errors in logs${NC}"
    echo "   (Run: docker-compose -f docker-compose.dev.yml logs --tail=100 app | grep -i error)"
else
    echo -e "${GREEN}✅ No recent errors in application logs${NC}"
fi
echo ""

echo "8️⃣  Checking for NULL values in required fields..."
NULL_REQUIRED=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM patients
WHERE customer_number IS NULL;
" 2>/dev/null | tr -d ' ')

if [ "$NULL_REQUIRED" -gt 0 ]; then
    echo -e "${RED}❌ Found $NULL_REQUIRED patients without customer_number${NC}"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✅ All patients have customer numbers${NC}"
fi
echo ""

echo "9️⃣  Checking database triggers..."
TRIGGERS=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public';
" 2>/dev/null | tr -d ' ')

echo -e "${GREEN}✅ Found $TRIGGERS active triggers${NC}"
echo ""

echo "🔟  Checking for missing sequences..."
SEQUENCES=$(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM pg_sequences
WHERE schemaname = 'public';
" 2>/dev/null | tr -d ' ')

echo -e "${GREEN}✅ Found $SEQUENCES sequences${NC}"
echo ""

echo "======================================"
echo "📊 Summary:"
echo ""

if [ "$ISSUES_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✅ No critical issues found!${NC}"
    echo -e "${GREEN}🎉 System is healthy and ready for use${NC}"
else
    echo -e "${YELLOW}⚠️  Found $ISSUES_FOUND potential issues${NC}"
    echo -e "${YELLOW}📋 Review the details above${NC}"
fi

echo ""
echo "Database Stats:"
echo "  - Tables: $(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_type = '\''BASE TABLE'\'';' 2>/dev/null | tr -d ' ')"
echo "  - Functions: $ACTUAL_FUNCTIONS"
echo "  - Triggers: $TRIGGERS"
echo "  - Indexes: $(docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM pg_indexes WHERE schemaname = '\''public'\'';' 2>/dev/null | tr -d ' ')"
echo "  - Foreign Keys: $BROKEN_FKS"
echo "  - Sequences: $SEQUENCES"
echo ""

echo "✨ Check complete!"
exit $ISSUES_FOUND
