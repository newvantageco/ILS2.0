# Database Migration Guide: Enhanced Test Rooms and Remote Access

## Overview

This migration adds enhanced test room management, equipment tracking, and remote access features to the ILS 2.0 system.

## What's Added

### 1. Enhanced Test Rooms Table
The `test_rooms` table is enhanced with the following columns:
- `capacity` - Number of practitioners who can use the room simultaneously
- `floor_level` - Physical location (e.g., "Ground Floor", "First Floor")
- `accessibility` - Wheelchair accessibility flag
- `current_status` - Room status (available, occupied, maintenance, offline)
- `last_maintenance_date` - Date of last maintenance
- `next_maintenance_date` - Date of next scheduled maintenance
- `equipment_details` - JSONB field for detailed equipment information
- `allow_remote_access` - Enable remote access to room data
- `location_id` - For multi-location practices

### 2. New Tables Created

#### test_room_bookings
Manages scheduling and booking of test rooms:
- Links to patients, users (practitioners), and test rooms
- Booking date and time slots
- Appointment type and status tracking
- Support for remote sessions

#### equipment
Tracks all equipment in test rooms:
- Equipment details (name, manufacturer, model, serial number)
- Purchase and calibration tracking
- Status monitoring (operational, maintenance, etc.)
- Company and test room associations

#### calibration_records
Maintains calibration compliance:
- Calibration dates and certificates
- Pass/fail status
- Next due dates
- Performed by tracking

#### remote_sessions
Enables secure remote access to patient data:
- Unique access tokens
- Expiration and status tracking
- Links to patients, examinations, and prescriptions
- Audit trail (who accessed, when)

### 3. Enhanced Existing Tables

#### examinations
- Added `test_room_id` - Link to the test room where examination was performed

#### prescriptions
- Added `requires_approval` - Flag for prescriptions requiring approval
- Added `approved_by` - User who approved the prescription
- Added `approved_at` - Timestamp of approval

## Installation Instructions

### Prerequisites
- PostgreSQL database (version 12 or higher recommended)
- `psql` command-line tool installed
- Database connection credentials

### Step 1: Set Database URL

```bash
export DATABASE_URL="postgres://username:password@hostname:port/database"
```

For example:
```bash
export DATABASE_URL="postgres://neon:npg@localhost:5432/ils_db"
```

### Step 2: Run the Migration Script

#### Option A: Using the provided script
```bash
./scripts/run-migration.sh
```

#### Option B: Direct psql execution
```bash
psql "$DATABASE_URL" -f migrations/enhanced_test_rooms_and_remote_access.sql
```

### Step 3: Verify Migration

Check that all tables were created successfully:

```sql
-- Check column count for each table
SELECT 
    'test_rooms' as table_name, 
    COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'test_rooms'
UNION ALL
SELECT 'test_room_bookings', COUNT(*) FROM information_schema.columns WHERE table_name = 'test_room_bookings'
UNION ALL
SELECT 'equipment', COUNT(*) FROM information_schema.columns WHERE table_name = 'equipment'
UNION ALL
SELECT 'calibration_records', COUNT(*) FROM information_schema.columns WHERE table_name = 'calibration_records'
UNION ALL
SELECT 'remote_sessions', COUNT(*) FROM information_schema.columns WHERE table_name = 'remote_sessions';
```

Expected results:
- test_rooms: Should have additional columns (capacity, floor_level, etc.)
- test_room_bookings: Should exist with ~14 columns
- equipment: Should exist with ~18 columns
- calibration_records: Should exist with ~8 columns
- remote_sessions: Should exist with ~11 columns

### Step 4: Sync Drizzle Schema

After running the SQL migration, sync your TypeScript schema:

```bash
npm run db:push
```

This ensures Drizzle ORM is aware of all schema changes.

## Schema Changes Made

The TypeScript schema file (`shared/schema.ts`) has been updated to match the migration:

1. **eyeExaminations table**: Added `testRoomId` field
2. **prescriptions table**: Added approval workflow fields:
   - `requiresApproval`
   - `approvedBy`
   - `approvedAt`

## Features Enabled

### Room Management
- Track room availability and status in real-time
- Schedule and manage appointments
- Prevent booking conflicts
- Track maintenance schedules

### Equipment Tracking
- Monitor all equipment and their status
- Track calibration due dates
- Maintain calibration history
- Alert on overdue calibrations

### Remote Access
- Generate secure access tokens for remote patient data viewing
- Time-limited access with automatic expiration
- Audit trail of who accessed what and when
- Revocable access tokens

### Automated Triggers
- **Test room status updates**: Automatically mark rooms as occupied/available based on bookings
- **Equipment calibration tracking**: Auto-update equipment status when calibration records are added
- **Remote session expiration**: Function to expire old sessions

## Views Created

### v_room_utilization
Provides room usage analytics:
- Bookings in last 30 days
- Bookings today
- Current status

### v_equipment_calibration_due
Shows equipment needing calibration:
- Overdue equipment
- Equipment due soon (within 7 days)
- Upcoming calibrations (within 30 days)

## Rollback

If you need to rollback this migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS remote_sessions CASCADE;
DROP TABLE IF EXISTS calibration_records CASCADE;
DROP TABLE IF EXISTS test_room_bookings CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;

-- Remove added columns
ALTER TABLE test_rooms 
  DROP COLUMN IF EXISTS capacity,
  DROP COLUMN IF EXISTS floor_level,
  DROP COLUMN IF EXISTS accessibility,
  DROP COLUMN IF EXISTS current_status,
  DROP COLUMN IF EXISTS last_maintenance_date,
  DROP COLUMN IF EXISTS next_maintenance_date,
  DROP COLUMN IF EXISTS equipment_details,
  DROP COLUMN IF EXISTS allow_remote_access,
  DROP COLUMN IF EXISTS location_id;

ALTER TABLE examinations DROP COLUMN IF EXISTS test_room_id;

ALTER TABLE prescriptions 
  DROP COLUMN IF EXISTS requires_approval,
  DROP COLUMN IF EXISTS approved_by,
  DROP COLUMN IF EXISTS approved_at;

-- Drop views
DROP VIEW IF EXISTS v_room_utilization;
DROP VIEW IF EXISTS v_equipment_calibration_due;

-- Drop functions
DROP FUNCTION IF EXISTS update_test_room_status();
DROP FUNCTION IF EXISTS update_equipment_calibration_status();
DROP FUNCTION IF EXISTS expire_remote_sessions();
```

## Troubleshooting

### Issue: "relation already exists"
**Solution**: Tables may have been partially created. Run the migration again - it uses `IF NOT EXISTS` clauses so it's safe to re-run.

### Issue: "constraint already exists"  
**Solution**: Check constraints may exist from a previous run. The migration drops existing constraints before creating new ones.

### Issue: "column already exists"
**Solution**: Some columns may have been added previously. The migration uses `ADD COLUMN IF NOT EXISTS` so it's safe to re-run.

### Issue: "permission denied"
**Solution**: Ensure your database user has CREATE, ALTER, and DROP permissions on the database.

## Testing

After migration, test the following:

1. **Create a test room booking**:
```typescript
const booking = await db.insert(testRoomBookings).values({
  testRoomId: 'room-id',
  userId: 'user-id',
  bookingDate: new Date(),
  startTime: new Date(),
  endTime: new Date(Date.now() + 3600000), // 1 hour later
  status: 'scheduled'
});
```

2. **Add equipment**:
```typescript
const equipment = await db.insert(equipment).values({
  companyId: 'company-id',
  testRoomId: 'room-id',
  name: 'Autorefractor',
  serialNumber: 'AR-12345',
  nextCalibrationDate: new Date(Date.now() + 365 * 24 * 3600000) // 1 year
});
```

3. **Create a remote session**:
```typescript
const session = await db.insert(remoteSessions).values({
  companyId: 'company-id',
  patientId: 'patient-id',
  accessToken: crypto.randomUUID(),
  createdBy: 'user-id',
  expiresAt: new Date(Date.now() + 24 * 3600000) // 24 hours
});
```

## Support

For issues or questions about this migration, please contact the development team or create an issue in the repository.

## Migration History

- **Date**: 2025-10-29
- **Version**: 1.0
- **Author**: ILS 2.0 Development Team
- **Related Files**:
  - `migrations/enhanced_test_rooms_and_remote_access.sql`
  - `shared/schema.ts`
  - `scripts/run-migration.sh`
