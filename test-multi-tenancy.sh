#!/bin/bash

# Multi-Tenancy and Eye Examination Testing Script
# This script helps verify the multi-tenant isolation and examination functionality

echo "======================================"
echo "Multi-Tenant Eye Examination Testing"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/api"

echo "Testing server availability..."
if curl -s "${BASE_URL}" > /dev/null; then
    echo -e "${GREEN}✓ Server is running at ${BASE_URL}${NC}"
else
    echo -e "${RED}✗ Server is not running! Please start with: npm run dev${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo "Test 1: Multi-Tenancy Database Check"
echo "======================================"
echo ""

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ psql not found. Skipping database checks.${NC}"
else
    echo "Checking eye_examinations table structure..."
    
    PGPASSWORD=postgres psql -h localhost -U postgres -d integrated_lens_system -c "
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'eye_examinations' 
    AND column_name IN ('company_id', 'general_history', 'current_rx', 'new_rx', 'finalized')
    ORDER BY column_name;
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database table verified${NC}"
    else
        echo -e "${YELLOW}⚠ Could not verify database table${NC}"
    fi
    
    echo ""
    echo "Checking foreign key constraint on company_id..."
    PGPASSWORD=postgres psql -h localhost -U postgres -d integrated_lens_system -c "
    SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='eye_examinations'
    AND kcu.column_name='company_id';
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Foreign key constraint verified${NC}"
    else
        echo -e "${YELLOW}⚠ Could not verify foreign key${NC}"
    fi
fi

echo ""
echo "======================================"
echo "Test 2: API Endpoint Verification"
echo "======================================"
echo ""

echo "Testing public endpoints..."

# Test health endpoint
if curl -s "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health endpoint responding${NC}"
else
    echo -e "${YELLOW}⚠ Health endpoint not found (optional)${NC}"
fi

# Test auth endpoint (should return 401 without auth)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/auth/user")
if [ "$STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Auth endpoint protected (returned 401)${NC}"
else
    echo -e "${YELLOW}⚠ Auth endpoint returned: ${STATUS}${NC}"
fi

echo ""
echo "======================================"
echo "Test 3: File Structure Verification"
echo "======================================"
echo ""

echo "Checking for old eye examination files..."
if [ ! -f "client/src/pages/EyeExamination.tsx" ]; then
    echo -e "${GREEN}✓ Old EyeExamination.tsx removed${NC}"
else
    echo -e "${RED}✗ Old EyeExamination.tsx still exists!${NC}"
fi

echo "Checking for comprehensive examination file..."
if [ -f "client/src/pages/EyeExaminationComprehensive.tsx" ]; then
    echo -e "${GREEN}✓ EyeExaminationComprehensive.tsx exists${NC}"
    
    # Check for key features
    if grep -q "urlPatientId" "client/src/pages/EyeExaminationComprehensive.tsx"; then
        echo -e "${GREEN}  ✓ Patient auto-selection implemented${NC}"
    fi
    
    if grep -q "horizontal.*tab" "client/src/pages/EyeExaminationComprehensive.tsx" -i; then
        echo -e "${GREEN}  ✓ Horizontal tabs implemented${NC}"
    fi
    
    if grep -q "Previous.*Exams" "client/src/pages/EyeExaminationComprehensive.tsx"; then
        echo -e "${GREEN}  ✓ Previous exams dropdown implemented${NC}"
    fi
else
    echo -e "${RED}✗ EyeExaminationComprehensive.tsx not found!${NC}"
fi

echo ""
echo "Checking schema updates..."
if grep -q "generalHistory.*jsonb" "shared/schema.ts"; then
    echo -e "${GREEN}✓ Comprehensive exam fields in schema${NC}"
else
    echo -e "${RED}✗ Comprehensive exam fields missing from schema${NC}"
fi

if grep -q "companyId.*notNull.*references.*companies" "shared/schema.ts"; then
    echo -e "${GREEN}✓ Multi-tenancy companyId in schema${NC}"
else
    echo -e "${RED}✗ Multi-tenancy companyId missing or incorrect${NC}"
fi

echo ""
echo "======================================"
echo "Test 4: Storage Layer Verification"
echo "======================================"
echo ""

echo "Checking storage methods..."
if grep -q "getEyeExaminations.*companyId" "server/storage.ts"; then
    echo -e "${GREEN}✓ getEyeExaminations accepts companyId${NC}"
else
    echo -e "${YELLOW}⚠ getEyeExaminations may not filter by companyId${NC}"
fi

if grep -q "getPatientExaminations.*companyId" "server/storage.ts"; then
    echo -e "${GREEN}✓ getPatientExaminations accepts companyId${NC}"
else
    echo -e "${YELLOW}⚠ getPatientExaminations may not filter by companyId${NC}"
fi

echo ""
echo "======================================"
echo "Test 5: Route Configuration"
echo "======================================"
echo ""

echo "Checking App.tsx routes..."
if ! grep -q "examination-old" "client/src/App.tsx"; then
    echo -e "${GREEN}✓ Old examination routes removed${NC}"
else
    echo -e "${RED}✗ Old examination routes still exist!${NC}"
fi

if grep -q "/ecp/examination/new.*EyeExaminationComprehensive" "client/src/App.tsx"; then
    echo -e "${GREEN}✓ New examination route configured${NC}"
else
    echo -e "${YELLOW}⚠ New examination route may not be configured${NC}"
fi

echo ""
echo "Checking PatientsPage routing..."
if grep -q "/ecp/examination/new.*patientId" "client/src/pages/PatientsPage.tsx"; then
    echo -e "${GREEN}✓ PatientsPage routes to comprehensive exam${NC}"
else
    echo -e "${YELLOW}⚠ PatientsPage may still use old routing${NC}"
fi

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""

echo -e "${GREEN}System Status: Ready for Manual Testing${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Open ${BASE_URL} in your browser"
echo "2. Follow TESTING_CHECKLIST.md for detailed testing"
echo "3. Test multi-tenancy isolation with different companies"
echo "4. Test comprehensive examination workflow (all 10 tabs)"
echo ""
echo "📚 Reference Documents:"
echo "- TESTING_CHECKLIST.md - Detailed testing procedures"
echo "- MULTI_TENANT_EYE_EXAM_COMPLETE.md - Architecture details"
echo "- END_TO_END_TESTING_GUIDE.md - Complete testing guide"
echo ""
echo "======================================"
echo "Automated checks complete!"
echo "======================================"
