# 🚀 PMS Enhancements - Quick Start Guide

## Overview
This guide will help you integrate the new web-based PMS features into your Integrated Lens System.

---

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Existing ILS installation

---

## 🔧 Installation Steps

### Step 1: Database Migration

Run the database migration to add new tables and columns:

```bash
psql postgres://your-connection-string -f migrations/enhanced_test_rooms_and_remote_access.sql
```

Or using the existing migration system:

```bash
npm run db:migrate
```

**What this creates:**
- Enhanced `test_rooms` table (9 new columns)
- New `test_room_bookings` table
- New `equipment` table
- New `calibration_records` table
- New `remote_sessions` table
- Indexes for performance
- Triggers for automation
- Views for analytics

---

### Step 2: Install Dependencies

All required dependencies are already installed:
- `@tanstack/react-query` ✅
- `date-fns` ✅
- `lucide-react` ✅
- `framer-motion` ✅

---

### Step 3: Register Service Worker

Add to your main entry point (`client/src/main.tsx` or `client/src/App.tsx`):

```typescript
import { registerServiceWorker } from "@/lib/pwa";

// Register service worker for offline support
registerServiceWorker({
  onUpdate: (registration) => {
    console.log('New version available!');
    // Optionally show toast notification
  },
  onOffline: () => {
    console.log('App is offline');
  },
  onOnline: () => {
    console.log('App is back online');
  },
});
```

---

### Step 4: Add Routes

Update your routing configuration (typically in `App.tsx`):

```typescript
import TestRoomsPage from "@/pages/TestRoomsPage";
import TestRoomBookingsPage from "@/pages/TestRoomBookingsPage";
import { EquipmentCalibrationTracker } from "@/components/equipment/EquipmentCalibrationTracker";
import { MultiLocationDashboard } from "@/components/dashboard/MultiLocationDashboard";
import { RemoteAccessManager } from "@/components/remote/RemoteAccessManager";

// Add these routes:
<Route path="/ecp/test-rooms" component={TestRoomsPage} />
<Route path="/ecp/test-rooms/bookings" component={TestRoomBookingsPage} />
<Route path="/ecp/equipment" component={EquipmentCalibrationTracker} />
<Route path="/ecp/multi-location" component={MultiLocationDashboard} />
<Route path="/ecp/remote-access" component={RemoteAccessManager} />
```

---

### Step 5: Update Navigation

Add new menu items to your ECP navigation:

```typescript
import { 
  DoorOpen, 
  Calendar, 
  Wrench, 
  Building2, 
  Wifi 
} from "lucide-react";

const ecpNavigation = [
  // ... existing items
  {
    label: "Test Rooms",
    href: "/ecp/test-rooms",
    icon: DoorOpen,
  },
  {
    label: "Scheduling",
    href: "/ecp/test-rooms/bookings",
    icon: Calendar,
  },
  {
    label: "Equipment",
    href: "/ecp/equipment",
    icon: Wrench,
  },
  {
    label: "Multi-Location",
    href: "/ecp/multi-location",
    icon: Building2,
  },
  {
    label: "Remote Access",
    href: "/ecp/remote-access",
    icon: Wifi,
  },
];
```

---

### Step 6: Add Manifest Link

Update `client/index.html` to include PWA manifest:

```html
<head>
  <!-- ... existing tags ... -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#0ea5e9">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
</head>
```

---

## 🎯 Backend API Endpoints

You'll need to implement these API endpoints in your Express server:

### Test Rooms
```typescript
// server/routes/ecp.ts

// Get all test rooms
router.get('/api/ecp/test-rooms', async (req, res) => {
  const rooms = await db.query.testRooms.findMany({
    where: eq(testRooms.companyId, req.user.companyId),
    where: eq(testRooms.isActive, true),
  });
  res.json(rooms);
});

// Create test room
router.post('/api/ecp/test-rooms', async (req, res) => {
  const room = await db.insert(testRooms).values({
    ...req.body,
    companyId: req.user.companyId,
  }).returning();
  res.json(room[0]);
});

// Update test room
router.put('/api/ecp/test-rooms/:id', async (req, res) => {
  const room = await db.update(testRooms)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(testRooms.id, req.params.id))
    .returning();
  res.json(room[0]);
});

// Delete test room
router.delete('/api/ecp/test-rooms/:id', async (req, res) => {
  await db.update(testRooms)
    .set({ isActive: false })
    .where(eq(testRooms.id, req.params.id));
  res.json({ success: true });
});
```

### Bookings
```typescript
// Get bookings
router.get('/api/ecp/test-room-bookings', async (req, res) => {
  const { date, testRoomId } = req.query;
  
  const bookings = await db.query.testRoomBookings.findMany({
    where: and(
      eq(testRoomBookings.testRoomId, testRoomId),
      // Add date filtering
    ),
    with: {
      patient: true,
      user: true,
    },
  });
  res.json(bookings);
});

// Create booking
router.post('/api/ecp/test-room-bookings', async (req, res) => {
  // Check for conflicts
  const conflicts = await db.query.testRoomBookings.findFirst({
    where: and(
      eq(testRoomBookings.testRoomId, req.body.testRoomId),
      // Check time overlap
    ),
  });
  
  if (conflicts) {
    return res.status(409).json({ error: 'Time slot unavailable' });
  }
  
  const booking = await db.insert(testRoomBookings)
    .values({
      ...req.body,
      userId: req.user.id,
    })
    .returning();
  res.json(booking[0]);
});

// Cancel booking
router.delete('/api/ecp/test-room-bookings/:id', async (req, res) => {
  await db.update(testRoomBookings)
    .set({ status: 'cancelled' })
    .where(eq(testRoomBookings.id, req.params.id));
  res.json({ success: true });
});
```

### Equipment
```typescript
// Get equipment
router.get('/api/ecp/equipment', async (req, res) => {
  const equipment = await db.query.equipment.findMany({
    where: eq(equipment.companyId, req.user.companyId),
    with: {
      testRoom: true,
    },
  });
  res.json(equipment);
});

// Record calibration
router.post('/api/ecp/equipment/calibration', async (req, res) => {
  const record = await db.insert(calibrationRecords)
    .values(req.body)
    .returning();
  res.json(record[0]);
});
```

### Multi-Location Stats
```typescript
// Get location statistics
router.get('/api/ecp/locations/stats', async (req, res) => {
  // Implement your location statistics logic
  const stats = []; // Calculate stats per location
  res.json(stats);
});

// Get all rooms across locations
router.get('/api/ecp/test-rooms/all-locations', async (req, res) => {
  const rooms = await db.query.testRooms.findMany({
    where: eq(testRooms.companyId, req.user.companyId),
  });
  res.json(rooms);
});
```

---

## 🧪 Testing

### Test Offline Mode
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload the page
4. Verify offline page appears
5. Check cached data is accessible

### Test PWA Installation
1. Open in Chrome/Edge
2. Look for install icon in address bar
3. Click to install
4. Verify app opens in standalone window

### Test Room Booking
1. Navigate to `/ecp/test-rooms/bookings`
2. Select a test room
3. Click a time slot
4. Fill in appointment details
5. Verify booking appears
6. Try booking same slot (should show conflict)

---

## 📊 Sample Data

To populate test rooms for testing:

```sql
-- Insert sample test rooms
INSERT INTO test_rooms (company_id, room_name, room_code, capacity, floor_level, accessibility, current_status, location_id)
VALUES 
    ('your-company-id', 'Test Room 1', 'TR1', 1, 'Ground Floor', true, 'available', 'main'),
    ('your-company-id', 'Test Room 2', 'TR2', 1, 'Ground Floor', true, 'available', 'main'),
    ('your-company-id', 'Test Room 3', 'TR3', 1, 'First Floor', true, 'available', 'main');

-- Insert sample equipment
INSERT INTO equipment (company_id, test_room_id, name, manufacturer, model, serial_number, status)
VALUES 
    ('your-company-id', 'tr1-id', 'Phoropter', 'Topcon', 'VT-10', 'SN001', 'operational'),
    ('your-company-id', 'tr1-id', 'Autorefractor', 'Nidek', 'AR-1', 'SN002', 'operational');
```

---

## 🎨 Customization

### Modify Booking Hours
Edit `TestRoomScheduler.tsx`:

```typescript
// Change working hours (default 9 AM - 8 PM)
const workingHours = Array.from({ length: 12 }, (_, i) => i + 9);

// To 8 AM - 6 PM:
const workingHours = Array.from({ length: 10 }, (_, i) => i + 8);
```

### Customize Room Status Colors
Edit `TestRoomsPage.tsx`:

```typescript
const STATUS_COLORS = {
  available: "bg-green-500",  // Change colors
  occupied: "bg-yellow-500",
  maintenance: "bg-orange-500",
  offline: "bg-red-500",
};
```

### Adjust Calibration Alerts
Edit `EquipmentCalibrationTracker.tsx`:

```typescript
// Current: 7 days and 30 days warnings
// Modify thresholds:
if (daysUntil <= 14) {  // Warning at 14 days
  return { label: `Due in ${daysUntil}d`, color: "default" };
}
```

---

## 🔒 Security Considerations

### Remote Access Security
1. **Token Expiration**: Sessions expire after 24 hours
2. **Access Logging**: All access attempts are logged
3. **Instant Revocation**: Sessions can be revoked immediately
4. **Encryption**: All data transmitted over HTTPS/TLS

### Offline Security
1. **Local Storage**: Sensitive data encrypted
2. **Cache Management**: Auto-cleanup of old data
3. **Session Timeout**: Offline sessions expire
4. **Sync Verification**: Changes verified on reconnection

---

## 📱 PWA Features

### What Works Offline:
- ✅ View cached test rooms
- ✅ View cached patient records
- ✅ View cached prescriptions
- ✅ View cached bookings
- ✅ Navigate between pages
- ✅ Queue changes for sync

### What Requires Online:
- ❌ Create new records
- ❌ Update real-time status
- ❌ Remote access sessions
- ❌ Multi-location sync

---

## 🐛 Troubleshooting

### Service Worker Not Registering
```bash
# Check service worker file exists
ls client/public/service-worker.js

# Verify manifest
ls client/public/manifest.json

# Check console for errors
# DevTools → Console
```

### Offline Mode Not Working
```javascript
// Check service worker status
navigator.serviceWorker.getRegistrations().then(console.log);

// Force update
navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' });
```

### Booking Conflicts Not Detected
```typescript
// Verify time comparison logic in booking creation
// Check database indexes:
SELECT * FROM pg_indexes WHERE tablename = 'test_room_bookings';
```

---

## 📚 Additional Resources

- **Full Documentation**: `PMS_ENHANCEMENTS_SUMMARY.md`
- **Database Schema**: `shared/schema.ts`
- **Migration File**: `migrations/enhanced_test_rooms_and_remote_access.sql`
- **Component Examples**: See `client/src/components/` and `client/src/pages/`

---

## ✅ Verification Checklist

- [ ] Database migration completed
- [ ] Service worker registered
- [ ] Routes added to app
- [ ] Navigation menu updated
- [ ] Manifest linked in HTML
- [ ] API endpoints implemented
- [ ] Test rooms created
- [ ] Offline mode tested
- [ ] PWA installable
- [ ] All features accessible

---

## 🎉 You're Ready!

Once you've completed these steps, you'll have:
- ✅ Full test room management
- ✅ Appointment scheduling
- ✅ Equipment tracking
- ✅ Offline PWA capabilities
- ✅ Multi-location support
- ✅ Remote access features

**Need Help?** Check the comprehensive documentation in `PMS_ENHANCEMENTS_SUMMARY.md`
