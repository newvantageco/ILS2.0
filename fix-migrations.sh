#!/bin/bash
# Fix Database Migration Issues
# This script drops conflicting database types and reruns migrations

echo "🔧 Fixing ILS 2.0 Database Migrations..."
echo ""

# Connect to database and drop conflicting types
docker exec -i ils-postgres psql -U ils_user -d ils_db <<EOF
-- Drop conflicting enum types if they exist
DROP TYPE IF EXISTS account_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- Show confirmation
SELECT 'Database types cleaned successfully' as status;
EOF

echo ""
echo "✅ Database types cleaned"
echo ""
echo "🔄 Pushing schema changes..."
echo ""

# Run schema push from the app container
docker exec -i ils-app npm run db:push

echo ""
echo "✅ Migration fix complete!"
echo ""
echo "Next steps:"
echo "  1. Restart containers: docker-compose restart"
echo "  2. Check logs: docker logs ils-app --tail 50"
