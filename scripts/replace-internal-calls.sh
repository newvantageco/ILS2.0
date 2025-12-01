#!/bin/bash
#
# Script to replace _Internal method calls with tenant-aware methods
# P0-2 Security Fix - Tenant Isolation
#

FILE="server/routes.ts"
BACKUP="server/routes.ts.backup-$(date +%Y%m%d-%H%M%S)"

echo "📋 P0-2 Security Fix: Replacing _Internal calls"
echo "================================================"
echo ""

# Create backup
echo "Creating backup: $BACKUP"
cp "$FILE" "$BACKUP"

# Count current calls
BEFORE=$(grep -c "getUserById_Internal\|getUserWithRoles_Internal" "$FILE")
echo "Found $BEFORE _Internal calls to replace"
echo ""

# Pattern 1: Replace getUserById_Internal
# From: const user = await storage.getUserById_Internal(userId);
# To:   const user = await authRepository.getUserByIdWithTenantCheck(userId, getRequestingUser(req), { reason: 'User lookup', ip: req.ip });

echo "Step 1: Replacing getUserById_Internal calls..."
perl -i -pe 's/const (\w+) = await storage\.getUserById_Internal\((\w+)\);/const $1 = await authRepository.getUserByIdWithTenantCheck($2, getRequestingUser(req), { reason: "User lookup", ip: req.ip });/g' "$FILE"

# Pattern 2: Replace getUserWithRoles_Internal
# From: const user = await storage.getUserWithRoles_Internal(userId);
# To:   const user = await authRepository.getUserWithRolesWithTenantCheck(userId, getRequestingUser(req), { reason: 'User with roles lookup', ip: req.ip });

echo "Step 2: Replacing getUserWithRoles_Internal calls..."
perl -i -pe 's/const (\w+) = await storage\.getUserWithRoles_Internal\((\w+)\);/const $1 = await authRepository.getUserWithRolesWithTenantCheck($2, getRequestingUser(req), { reason: "User with roles lookup", ip: req.ip });/g' "$FILE"

# Pattern 3: Handle .then() pattern (promises)
# From: storage.getUserById_Internal(user.claims.sub).then((dbUser) => {
# To:   authRepository.getUserByIdWithTenantCheck(user.claims.sub, getRequestingUser(req), { reason: 'Session validation' }).then((dbUser) => {

echo "Step 3: Replacing promise-based calls..."
perl -i -pe 's/storage\.getUserById_Internal\(([^)]+)\)\.then\(/authRepository.getUserByIdWithTenantCheck($1, getRequestingUser(req), { reason: "Session validation", ip: req.ip }).then(/g' "$FILE"

# Count after
AFTER=$(grep -c "getUserById_Internal\|getUserWithRoles_Internal" "$FILE")
REPLACED=$((BEFORE - AFTER))

echo ""
echo "✅ Replacement complete!"
echo "   Replaced: $REPLACED calls"
echo "   Remaining: $AFTER calls"
echo ""

if [ $AFTER -gt 0 ]; then
  echo "⚠️  Some calls remain - manual review needed:"
  grep -n "getUserById_Internal\|getUserWithRoles_Internal" "$FILE" | head -10
  echo ""
fi

echo "Backup saved to: $BACKUP"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff $FILE"
echo "2. Test TypeScript compilation: npm run build"
echo "3. Manually fix any remaining calls"
echo "4. Run tests"
