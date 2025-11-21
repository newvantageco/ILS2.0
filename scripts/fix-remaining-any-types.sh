#!/bin/bash
# ============================================================================
# Fix Remaining 'any' Types - Advanced Patterns
# ============================================================================
# Fixes the remaining 23 'any' types with proper TypeScript types
# ============================================================================

set -e

echo "🔧 Fixing remaining 'any' types in server/routes.ts..."
echo ""

# Backup
cp server/routes.ts server/routes.ts.backup2

# Count before
BEFORE=$(grep -o ": any" server/routes.ts | wc -l | tr -d ' ')
echo "📊 Starting with $BEFORE instances"
echo ""

# ============================================================================
# Fix: Remaining catch blocks
# ============================================================================
echo "🔧 Fixing remaining catch blocks..."
sed -i '' 's/} catch (limsError: any) {/} catch (limsError: unknown) {/g' server/routes.ts

# ============================================================================
# Fix: Dynamic object types
# ============================================================================
echo "🔧 Fixing dynamic object types..."

# updateData, filters, updates, options → Record<string, unknown>
sed -i '' 's/const updateData: any =/const updateData: Record<string, unknown> =/g' server/routes.ts
sed -i '' 's/const filters: any =/const filters: Record<string, unknown> =/g' server/routes.ts
sed -i '' 's/const updates: any =/const updates: Record<string, unknown> =/g' server/routes.ts
sed -i '' 's/const options: any =/const options: Record<string, unknown> =/g' server/routes.ts
sed -i '' 's/const invoicePayload: any =/const invoicePayload: Record<string, unknown> =/g' server/routes.ts

# ============================================================================
# Fix: Array callback types (let TypeScript infer)
# ============================================================================
echo "🔧 Fixing array callback types..."

# .then((r: any) => r[0]) → .then(r => r[0])
sed -i '' 's/\.then((r: any) => r\[0\])/\.then(r => r[0])/g' server/routes.ts

# .filter((inv: any) => → .filter(inv =>
sed -i '' 's/\.filter((inv: any) =>/\.filter(inv =>/g' server/routes.ts

# .reduce((sum: number, inv: any) => → .reduce((sum, inv) =>
sed -i '' 's/\.reduce((sum: number, inv: any) =>/\.reduce((sum, inv) =>/g' server/routes.ts

# .reduce((sum: number, item: any) => → .reduce((sum, item) =>
sed -i '' 's/\.reduce((sum: number, item: any) =>/\.reduce((sum, item) =>/g' server/routes.ts

# .map((item: any) => → .map(item =>
sed -i '' 's/\.map((item: any) =>/\.map(item =>/g' server/routes.ts

# .find((apt: any) => → .find(apt =>
sed -i '' 's/\.find((apt: any) =>/\.find(apt =>/g' server/routes.ts

# ============================================================================
# Summary
# ============================================================================
AFTER=$(grep -o ": any" server/routes.ts | wc -l | tr -d ' ')
FIXED=$((BEFORE - AFTER))

echo ""
echo "════════════════════════════════════════"
echo "📊 Advanced Type Safety Fixes"
echo "════════════════════════════════════════"
echo "Before:        $BEFORE instances"
echo "After:         $AFTER instances"
echo "Fixed:         $FIXED instances"
echo "════════════════════════════════════════"
echo ""

if [ "$AFTER" -eq 1 ]; then
  echo "⚠️  Only 1 'any' remaining - Passport callback (requires manual fix)"
  echo ""
  echo "Remaining issue at line ~940:"
  echo "  passport.authenticate('local', (err: any, user: any, info: any) => {"
  echo ""
  echo "This requires adding Passport type definitions."
fi

echo "✅ Advanced type safety fixes applied!"
echo ""
