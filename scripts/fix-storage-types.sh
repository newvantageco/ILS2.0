#!/bin/bash
# Fix type safety in server/storage.ts
# Eliminates 'any' types with proper TypeScript types

set -e

FILE="server/storage.ts"
echo "🔧 Fixing type safety in $FILE..."
echo ""

# Backup
cp "$FILE" "${FILE}.backup"
echo "✅ Created backup: ${FILE}.backup"

# Count initial 'any' types
INITIAL_COUNT=$(grep -c ": any" "$FILE" || true)
echo "📊 Initial 'any' count: $INITIAL_COUNT"
echo ""

# 1. Fix supplier parameter types - use InsertSupplier/UpdateSupplier
echo "🔧 Fixing supplier parameter types..."
sed -i '' 's/createSupplier(supplier: any)/createSupplier(supplier: InsertSupplier)/g' "$FILE"
sed -i '' 's/updateSupplier(id: string, updates: any)/updateSupplier(id: string, updates: UpdateSupplier)/g' "$FILE"

# 2. Fix filter parameter types - use Record<string, unknown>
echo "🔧 Fixing filter parameter types..."
sed -i '' 's/filters?: any)/filters?: Record<string, unknown>)/g' "$FILE"

# 3. Fix activity/record creation methods
echo "🔧 Fixing creation method parameter types..."
sed -i '' 's/createPatientActivity(activity: any)/createPatientActivity(activity: InsertPatientActivity)/g' "$FILE"
sed -i '' 's/createSubscriptionHistory(history: any)/createSubscriptionHistory(history: InsertSubscriptionHistory)/g' "$FILE"
sed -i '' 's/createPaymentIntent(payment: any)/createPaymentIntent(payment: InsertPaymentIntent)/g' "$FILE"
sed -i '' 's/createDispenseRecord(record: any)/createDispenseRecord(record: InsertDispenseRecord)/g' "$FILE"
sed -i '' 's/createAiModelVersion(version: any)/createAiModelVersion(version: InsertAIModelVersion)/g' "$FILE"
sed -i '' 's/updateAiModelVersion(id: string, updates: any)/updateAiModelVersion(id: string, updates: Partial<AIModelVersion>)/g' "$FILE"
sed -i '' 's/createModelDeployment(deployment: any)/createModelDeployment(deployment: InsertAIModelDeployment)/g' "$FILE"
sed -i '' 's/createAiTrainingJob(job: any)/createAiTrainingJob(job: InsertAITrainingJob)/g' "$FILE"
sed -i '' 's/createDeploymentQueue(deployment: any)/createDeploymentQueue(deployment: InsertDeploymentQueue)/g' "$FILE"

# 4. Fix return type for createPatientActivity
sed -i '' 's/createPatientActivity(activity: InsertPatientActivity): Promise<any>/createPatientActivity(activity: InsertPatientActivity): Promise<PatientActivity>/g' "$FILE"

# 5. Fix updateData: any to Record<string, unknown>
sed -i '' 's/const updateData: any = {/const updateData: Record<string, unknown> = {/g' "$FILE"

# Count final 'any' types
FINAL_COUNT=$(grep -c ": any" "$FILE" || true)
ELIMINATED=$((INITIAL_COUNT - FINAL_COUNT))

echo ""
echo "✅ Type safety fixes applied!"
echo "📊 Final 'any' count: $FINAL_COUNT"
echo "🎉 Eliminated: $ELIMINATED 'any' types"
echo ""

# Show remaining issues (if any)
if [ "$FINAL_COUNT" -gt 0 ]; then
  echo "⚠️  Remaining 'any' types (manual review needed):"
  grep -n ": any" "$FILE" | head -10
fi

echo ""
echo "🔍 Next: Run 'npm run check' to validate TypeScript compilation"
