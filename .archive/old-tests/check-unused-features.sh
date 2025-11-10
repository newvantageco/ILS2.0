#!/bin/bash

echo "=== Checking for Backend Features Not Shown in Frontend ==="
echo ""

echo "1. Backend API Routes..."
echo "Extracting all API endpoints..."
grep -rh "app\.\(get\|post\|put\|delete\|patch\)" server/routes.ts 2>/dev/null | \
  grep -o "'/api/[^']*'" | \
  sort -u > /tmp/backend_routes.txt

grep -rh "router\.\(get\|post\|put\|delete\|patch\)" server/routes/*.ts 2>/dev/null | \
  grep -o "'[^']*'" | \
  sort -u >> /tmp/backend_routes.txt

echo "Found $(cat /tmp/backend_routes.txt | wc -l) unique backend routes"
echo ""

echo "2. Frontend Route References..."
echo "Checking client/src for API calls..."
grep -rh "fetch\|axios\|api/" client/src/ 2>/dev/null | \
  grep -o "/api/[a-zA-Z0-9/_-]*" | \
  sort -u > /tmp/frontend_api_calls.txt

echo "Found $(cat /tmp/frontend_api_calls.txt | wc -l) unique frontend API calls"
echo ""

echo "3. Backend Routes NOT used in Frontend:"
echo "-------------------------------------------"
cat /tmp/backend_routes.txt | while read route; do
  route_clean=$(echo "$route" | tr -d "'")
  if ! grep -q "$route_clean" /tmp/frontend_api_calls.txt 2>/dev/null; then
    echo "  $route_clean"
  fi
done | head -50
echo ""

echo "4. Database Tables..."
echo "Checking which tables might not have frontend UI..."
psql "postgres://neon:npg@localhost:5432/ils_db" -t -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
" | grep -v "^$" | tr -d ' ' > /tmp/db_tables.txt

echo "Found $(cat /tmp/db_tables.txt | wc -l) database tables"
echo ""

echo "5. Tables with potential missing UI:"
echo "-------------------------------------------"
cat /tmp/db_tables.txt | while read table; do
  # Check if table name appears in any React component or page
  if ! grep -rq "$table" client/src/ 2>/dev/null; then
    echo "  $table - No frontend references found"
  fi
done | head -30
echo ""

echo "6. Advanced Features from Schema..."
echo "-------------------------------------------"
echo "AI/ML Features:"
grep -E "ai_|ml_|training" /tmp/db_tables.txt

echo ""
echo "Analytics Features:"
grep -E "analytics|bi_|metrics" /tmp/db_tables.txt

echo ""
echo "Compliance Features:"
grep -E "compliance|audit|goc|hipaa" /tmp/db_tables.txt

echo ""
echo "Clinical Features:"
grep -E "clinical|prescription|patient|examination" /tmp/db_tables.txt
