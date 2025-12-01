#!/bin/bash
#
# Replace remaining _Internal calls across all files
# P0-2 Security Fix - Final cleanup
#

echo "🔒 P0-2 Final Cleanup: Replacing remaining _Internal calls"
echo "==========================================================="
echo ""

# Files to process
ROUTE_FILES=(
  "server/routes/admin.ts"
  "server/routes/feature-flags.ts"
  "server/routes/ml-models.ts"
  "server/routes/oma-validation.ts"
  "server/routes/onboarding.ts"
  "server/routes/permissions.ts"
  "server/routes/python-ml.ts"
  "server/routes/shopify.ts"
)

SERVICE_FILES=(
  "server/services/AnomalyDetectionService.ts"
  "server/services/OMAValidationService.ts"
  "server/services/OrderService.ts"
  "server/services/OrderTrackingService.ts"
  "server/services/WebhookService.ts"
)

WORKER_FILES=(
  "server/workers/OrderCreatedLimsWorker.ts"
)

total_before=0
total_after=0

# Function to add imports and helper to route files
add_route_helpers() {
  file="$1"

  # Check if authRepository import exists
  if ! grep -q "import.*authRepository" "$file"; then
    # Add import after storage import
    perl -i -pe 's/(import.*storage.*from.*storage.*;)/\1\nimport { authRepository } from "..\/repositories\/AuthRepository";/' "$file"
  fi

  # Add helper function (check if it doesn't exist)
  if ! grep -q "getRequestingUser" "$file"; then
    # Find registerRoutes or router definition and add helper after it
    if grep -q "export.*function.*Routes" "$file"; then
      perl -i -pe 'if (/export.*function.*Routes/) { $_ .= "  const getRequestingUser = (req: any) => ({ id: req.user?.id || req.user?.claims?.sub, companyId: req.user?.companyId || null, role: req.user?.role || \"ecp\" });\n\n"; }' "$file"
    elif grep -q "const.*=.*Router\(\)" "$file"; then
      perl -i -pe 'if (/const.*=.*Router\(\)/) { $_ .= "const getRequestingUser = (req: any) => ({ id: req.user?.id || req.user?.claims?.sub, companyId: req.user?.companyId || null, role: req.user?.role || \"ecp\" });\n" }' "$file"
    fi
  fi
}

# Function to replace calls
replace_calls() {
  file="$1"
  before=$(grep -c "getUserById_Internal\|getUserWithRoles_Internal\|getOrderById_Internal" "$file" 2>/dev/null || echo 0)

  # Pattern 1: const user = await storage.getUserById_Internal(userId);
  perl -i -pe 's/const (\w+) = await storage\.getUserById_Internal\((\w+)\);/const $1 = await authRepository.getUserByIdWithTenantCheck($2, getRequestingUser(req), { reason: "User operation", ip: req.ip });/g' "$file"

  # Pattern 2: getUserWithRoles_Internal
  perl -i -pe 's/const (\w+) = await storage\.getUserWithRoles_Internal\((\w+)\);/const $1 = await authRepository.getUserWithRolesWithTenantCheck($2, getRequestingUser(req), { reason: "User with roles operation", ip: req.ip });/g' "$file"

  after=$(grep -c "getUserById_Internal\|getUserWithRoles_Internal\|getOrderById_Internal" "$file" 2>/dev/null || echo 0)
  replaced=$((before - after))

  if [ $replaced -gt 0 ]; then
    echo "  ✅ $file: Replaced $replaced calls ($after remaining)"
  fi

  total_before=$((total_before + before))
  total_after=$((total_after + after))
}

# Process route files
echo "Step 1: Processing route files..."
for file in "${ROUTE_FILES[@]}"; do
  if [ -f "$file" ]; then
    add_route_helpers "$file"
    replace_calls "$file"
  fi
done

# Process service files
echo ""
echo "Step 2: Processing service files..."
for file in "${SERVICE_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Services might not have req parameter, so these need manual review
    before=$(grep -c "getUserById_Internal\|getUserWithRoles_Internal" "$file" 2>/dev/null || echo 0)
    if [ $before -gt 0 ]; then
      echo "  ⚠️  $file: $before calls need MANUAL review (services may not have req context)"
      total_before=$((total_before + before))
      total_after=$((total_after + before))
    fi
  fi
done

# Process worker files
echo ""
echo "Step 3: Processing worker files..."
for file in "${WORKER_FILES[@]}"; do
  if [ -f "$file" ]; then
    before=$(grep -c "getUserById_Internal\|getOrderById_Internal" "$file" 2>/dev/null || echo 0)
    if [ $before -gt 0 ]; then
      echo "  ⚠️  $file: $before calls need MANUAL review (workers may not have req context)"
      total_before=$((total_before + before))
      total_after=$((total_after + before))
    fi
  fi
done

echo ""
echo "==========================================================="
echo "✅ Automated replacement complete!"
echo "   Total found: $total_before calls"
echo "   Automated: $((total_before - total_after)) calls"
echo "   Manual review needed: $total_after calls"
echo ""

if [ $total_after -gt 0 ]; then
  echo "⚠️  Files needing manual review:"
  find server/services server/workers -name "*.ts" -exec grep -l "getUserById_Internal\|getUserWithRoles_Internal\|getOrderById_Internal" {} \; 2>/dev/null
  echo ""
fi

echo "Next: Verify TypeScript compilation"
echo "  NODE_OPTIONS=\"--max-old-space-size=4096\" npx tsc --noEmit"
