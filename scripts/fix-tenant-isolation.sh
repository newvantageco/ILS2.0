#!/bin/bash

# Script to fix tenant isolation issues in routes
# This script updates routes to use secureRoute middleware instead of isAuthenticated

set -e

echo "🔧 Fixing Tenant Isolation Issues..."

# Backup the routes file
cp server/routes.ts server/routes.ts.backup
echo "✅ Backed up server/routes.ts"

# Add import for secureRoute at the top of the file
# Find the line with "import { authenticateHybrid }" and add after it
sed -i '/import { authenticateHybrid }/a import { secureRoute, secureAdminRoute, securePlatformAdminRoute } from "./middleware/secureRoute.js";' server/routes.ts

echo "✅ Added secureRoute import"

# Replace isAuthenticated with ...secureRoute() for all routes
# This preserves other middleware like requireMFA

# Simple replacements (just isAuthenticated, no other middleware)
sed -i 's/isAuthenticated,\([^,]*Routes\);/...secureRoute(), \1;/g' server/routes.ts

# Routes with requireMFA (platform-admin, system-admin, audit-logs)
sed -i 's/isAuthenticated, requireMFA,\([^,]*platformAdminRoutes\);/...securePlatformAdminRoute(), requireMFA, \1;/g' server/routes.ts
sed -i 's/isAuthenticated, requireMFA,\([^,]*systemAdminRoutes\);/...securePlatformAdminRoute(), requireMFA, \1;/g' server/routes.ts
sed -i 's/isAuthenticated, requireMFA,\([^,]*auditLogRoutes\);/...secureAdminRoute(), requireMFA, \1;/g' server/routes.ts

echo "✅ Updated route middleware"

# Show the changes
echo ""
echo "📝 Changes made:"
echo "--------------------------------"
diff -u server/routes.ts.backup server/routes.ts | grep "^[-+]" | grep -E "(isAuthenticated|secureRoute)" | head -20

echo ""
echo "✅ Fix script completed!"
echo ""
echo "To apply changes:"
echo "  1. Review the backup: server/routes.ts.backup"
echo "  2. Test the application"
echo "  3. If successful, remove backup: rm server/routes.ts.backup"
echo ""
echo "To rollback:"
echo "  mv server/routes.ts.backup server/routes.ts"
