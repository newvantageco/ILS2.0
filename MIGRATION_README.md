# Database Migration: Enhanced Test Rooms and Remote Access

## Quick Start

### Run the Migration

```bash
# Set your database connection string
export DATABASE_URL="postgres://username:password@hostname:port/database"

# Run the migration using npm script
npm run db:migrate

# Or run directly
./scripts/run-migration.sh
```

## What This Migration Does

This migration adds:
1. ✅ Enhanced test room management with scheduling
2. ✅ Equipment tracking and calibration management
3. ✅ Remote access capability for patient records
4. ✅ Automated triggers for status updates

## Files Changed

- ✅ `shared/schema.ts` - TypeScript schema updated
- ✅ `migrations/enhanced_test_rooms_and_remote_access.sql` - SQL migration file
- ✅ `scripts/run-migration.sh` - Migration runner script
- ✅ `package.json` - Added `db:migrate` script

## Schema Updates

### Tables Modified
- `test_rooms` - Added capacity, status, maintenance tracking
- `examinations` - Added `test_room_id` column
- `prescriptions` - Added approval workflow columns

### Tables Created
- `test_room_bookings` - Room scheduling
- `equipment` - Equipment tracking
- `calibration_records` - Calibration compliance
- `remote_sessions` - Secure remote access

## Full Documentation

See [MIGRATION_GUIDE_TEST_ROOMS.md](./docs/MIGRATION_GUIDE_TEST_ROOMS.md) for:
- Detailed feature descriptions
- Rollback procedures
- Testing guidelines
- Troubleshooting help

## Verification

After running the migration, verify with:

```bash
# Check TypeScript types
npm run check

# Push schema to Drizzle
npm run db:push

# Run tests
npm test
```

## Need Help?

- Review the [full migration guide](./docs/MIGRATION_GUIDE_TEST_ROOMS.md)
- Check the migration file: `migrations/enhanced_test_rooms_and_remote_access.sql`
- Contact the development team
