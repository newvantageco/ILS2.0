#!/bin/bash

# BI Platform Verification Script
# Run this to verify all BI platform files are correctly created

echo "🔍 Verifying BI Platform Installation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
PASSED=0
FAILED=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1 - MISSING"
        ((FAILED++))
    fi
}

# Function to check string in file
check_in_file() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $3 - NOT FOUND"
        ((FAILED++))
    fi
}

echo "📁 Checking Backend Files..."
check_file "shared/bi-schema.ts"
check_file "server/services/BiAnalyticsService.ts"
check_file "server/routes/bi.ts"

echo ""
echo "🎨 Checking Frontend Files..."
check_file "client/src/components/bi/PracticePulseDashboard.tsx"
check_file "client/src/components/ui/date-range-picker.tsx"

echo ""
echo "📚 Checking Documentation..."
check_file "BI_PLATFORM_IMPLEMENTATION_GUIDE.md"
check_file "BI_PLATFORM_QUICK_START.md"
check_file "BI_PLATFORM_COMPLETE_SUMMARY.md"

echo ""
echo "🔗 Checking Routes Registration..."
check_in_file "server/routes.ts" "registerBiRoutes" "BI routes imported"
check_in_file "server/routes.ts" "registerBiRoutes(app)" "BI routes registered"

echo ""
echo "📊 Checking Database Schema..."
check_in_file "shared/bi-schema.ts" "dailyPracticeMetrics" "Daily metrics table"
check_in_file "shared/bi-schema.ts" "patientLifetimeValue" "Patient LTV table"
check_in_file "shared/bi-schema.ts" "revenueBreakdown" "Revenue breakdown table"
check_in_file "shared/bi-schema.ts" "kpiAlerts" "KPI alerts table"

echo ""
echo "🔌 Checking API Endpoints..."
check_in_file "server/routes/bi.ts" "/api/bi/practice-pulse" "Practice Pulse endpoint"
check_in_file "server/routes/bi.ts" "/api/bi/financial" "Financial endpoint"
check_in_file "server/routes/bi.ts" "/api/bi/operational" "Operational endpoint"
check_in_file "server/routes/bi.ts" "/api/bi/patient" "Patient endpoint"
check_in_file "server/routes/bi.ts" "/api/bi/platform-comparison" "Platform comparison endpoint"

echo ""
echo "⚙️  Checking Service Methods..."
check_in_file "server/services/BiAnalyticsService.ts" "getPracticePulseDashboard" "Practice Pulse method"
check_in_file "server/services/BiAnalyticsService.ts" "getFinancialDashboard" "Financial method"
check_in_file "server/services/BiAnalyticsService.ts" "getOperationalDashboard" "Operational method"
check_in_file "server/services/BiAnalyticsService.ts" "getPatientDashboard" "Patient method"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC} ($PASSED/$((PASSED + FAILED)))"
    echo ""
    echo "🎉 Your BI Platform is ready to use!"
    echo ""
    echo "Next steps:"
    echo "1. Run database migrations: npx drizzle-kit generate:pg && npx drizzle-kit push:pg"
    echo "2. Start your server: npm run dev"
    echo "3. Test API: curl http://localhost:3000/api/bi/health"
    echo "4. Add dashboard to navigation"
    echo ""
    echo "📖 Read BI_PLATFORM_QUICK_START.md for detailed instructions"
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC} (Passed: $PASSED, Failed: $FAILED)"
    echo ""
    echo "Please check the failed items above and ensure all files are created correctly."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
