#!/bin/bash
# ============================================================================
# Type Safety Fix Script - routes.ts
# ============================================================================
# Systematically replaces 'any' types with proper TypeScript types
#
# Usage:
#   chmod +x scripts/fix-type-safety.sh
#   ./scripts/fix-type-safety.sh
# ============================================================================

set -e

echo "🔧 Fixing type safety in server/routes.ts..."
echo ""

# Backup the original file
cp server/routes.ts server/routes.ts.backup
echo "✅ Created backup: server/routes.ts.backup"

# Count original 'any' types
BEFORE_COUNT=$(grep -o ": any" server/routes.ts | wc -l | tr -d ' ')
echo "📊 Found $BEFORE_COUNT instances of ': any'"
echo ""

# ============================================================================
# Fix 1: Response types (res: any → res: Response)
# ============================================================================
echo "🔧 Fix 1: Replacing 'res: any' with 'res: Response'..."

# Pattern: async (req: AuthenticatedRequest, res: any)
sed -i '' 's/async (req: AuthenticatedRequest, res: any)/async (req: AuthenticatedRequest, res: Response)/g' server/routes.ts

# Pattern: (req, res: any, next)
sed -i '' 's/(req, res: any, next)/(req, res: Response, next)/g' server/routes.ts

# Pattern: (req: Request, res: any)
sed -i '' 's/(req: Request, res: any)/(req: Request, res: Response)/g' server/routes.ts

# Pattern: (req: any, res: any)
sed -i '' 's/(req: any, res: any)/(req: express.Request, res: Response)/g' server/routes.ts

AFTER_FIX1=$(grep -o ": any" server/routes.ts | wc -l | tr -d ' ')
FIX1_COUNT=$((BEFORE_COUNT - AFTER_FIX1))
echo "✅ Fixed $FIX1_COUNT Response types"
echo ""

# ============================================================================
# Fix 2: Error catch blocks (catch (error: any) → catch (error: unknown))
# ============================================================================
echo "🔧 Fix 2: Replacing 'catch (error: any)' with 'catch (error: unknown)'..."

# Pattern: } catch (error: any) {
sed -i '' 's/} catch (error: any) {/} catch (error: unknown) {/g' server/routes.ts

# Pattern: catch (err: any) {
sed -i '' 's/catch (err: any) {/catch (err: unknown) {/g' server/routes.ts

# Pattern: catch (e: any) {
sed -i '' 's/catch (e: any) {/catch (e: unknown) {/g' server/routes.ts

AFTER_FIX2=$(grep -o ": any" server/routes.ts | wc -l | tr -d ' ')
FIX2_COUNT=$((AFTER_FIX1 - AFTER_FIX2))
echo "✅ Fixed $FIX2_COUNT error catch blocks"
echo ""

# ============================================================================
# Summary
# ============================================================================
TOTAL_FIXED=$((BEFORE_COUNT - AFTER_FIX2))
REMAINING=$AFTER_FIX2

echo "════════════════════════════════════════"
echo "📊 Type Safety Improvement Summary"
echo "════════════════════════════════════════"
echo "Before:        $BEFORE_COUNT instances of ': any'"
echo "Fixed:         $TOTAL_FIXED instances"
echo "Remaining:     $REMAINING instances"
echo "Improvement:   $(echo "scale=1; $TOTAL_FIXED * 100 / $BEFORE_COUNT" | bc)%"
echo "════════════════════════════════════════"
echo ""

# ============================================================================
# Validation
# ============================================================================
echo "🔍 Running TypeScript compilation check..."
npm run check 2>&1 | grep -E "(error TS|Found [0-9]+ error)" | head -20 || echo "✅ No critical TypeScript errors"

echo ""
echo "✅ Type safety fixes applied!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff server/routes.ts"
echo "  2. Run tests: npm run test"
echo "  3. If satisfied: rm server/routes.ts.backup"
echo "  4. If issues: mv server/routes.ts.backup server/routes.ts"
echo ""
