# Timestamp & User Tracking Implementation Guide

## Overview
Comprehensive timestamp and user tracking has been implemented across the ILS system. Every data change now records:
- **Who** made the change (user ID, name, email)
- **When** it happened (ISO timestamp)
- **What** changed (before/after field diffs)
- **Where** it came from (IP address)

## Database Schema Updates

All key tables now include:
```sql
-- Timestamp tracking columns
created_by VARCHAR(255)      -- User who created the record
updated_by VARCHAR(255)      -- User who last updated the record
change_history JSONB          -- Full audit trail with diffs
```

Tables updated:
- ✅ orders
- ✅ prescriptions
- ✅ patients
- ✅ companies
- ✅ returns
- ✅ non_adapts
- ✅ clinical_protocols
- ✅ prescription_templates
- ✅ role_permissions
- ✅ user_custom_permissions
- ✅ goc_compliance_checks
- ✅ users

## Backend Implementation

### 1. Utility Functions (`server/utils/timestamps.ts`)

**Available Functions:**

```typescript
// Extract user info from authenticated request
getUserInfo(req: Request) → { userId, userName, userEmail, ipAddress }

// Add creation timestamps and user info
addCreationTimestamp(data: any, req: Request) → data with timestamps

// Add update timestamps with field-level change diff
addUpdateTimestamp(data: any, req: Request, oldData?: any) → data with change history

// Track status changes specifically
addStatusChange(data: any, req: Request, oldStatus: any, newStatus: any) → data with status history

// Display formatting for frontend
formatTimestampWithUser(timestamp, userName?, userEmail?) → "2 Nov 2025, 11:30 PM by John Doe"
getRelativeTimeWithUser(timestamp, userName?) → "2 hours ago by John Doe"

// Express middleware for automatic injection
timestampMiddleware(action: 'create' | 'update') → middleware function
```

### 2. Example Implementation in API Routes

#### Example 1: Create Operation
```typescript
import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { addCreationTimestamp } from '../utils/timestamps';
import { db } from '../db';
import * as schema from '@shared/schema';

const router = Router();

router.post('/api/patients', authenticateUser, async (req, res) => {
  try {
    // Inject creation timestamps and user info
    const patientData = addCreationTimestamp(req.body, req);
    
    // Insert into database
    const [patient] = await db.insert(schema.patients)
      .values(patientData)
      .returning();
    
    res.json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

export default router;
```

#### Example 2: Update Operation with Change Tracking
```typescript
router.patch('/api/patients/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get existing record
    const [existingPatient] = await db.select()
      .from(schema.patients)
      .where(eq(schema.patients.id, id));
    
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Inject update timestamps with change diff
    const patientData = addUpdateTimestamp(req.body, req, existingPatient);
    
    // Update database
    const [updatedPatient] = await db.update(schema.patients)
      .set(patientData)
      .where(eq(schema.patients.id, id))
      .returning();
    
    res.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});
```

#### Example 3: Status Change Tracking
```typescript
router.patch('/api/orders/:id/status', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Get existing order
    const [existingOrder] = await db.select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id));
    
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Track status change with full context
    const orderData = addStatusChange(
      { status },
      req,
      existingOrder.status,
      status
    );
    
    // Update database
    const [updatedOrder] = await db.update(schema.orders)
      .set(orderData)
      .where(eq(schema.orders.id, id))
      .returning();
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});
```

#### Example 4: Using Middleware (Automatic Injection)
```typescript
import { timestampMiddleware } from '../utils/timestamps';

// For create operations
router.post('/api/prescriptions',
  authenticateUser,
  timestampMiddleware('create'),  // Automatically adds creation timestamps
  async (req, res) => {
    // req.body already has createdAt, createdBy, updatedAt, updatedBy, changeHistory
    const [prescription] = await db.insert(schema.prescriptions)
      .values(req.body)
      .returning();
    
    res.json(prescription);
  }
);

// For update operations
router.patch('/api/prescriptions/:id',
  authenticateUser,
  timestampMiddleware('update'),  // Automatically adds update timestamps
  async (req, res) => {
    const { id } = req.params;
    
    // Get existing record for change diff
    const [existing] = await db.select()
      .from(schema.prescriptions)
      .where(eq(schema.prescriptions.id, id));
    
    // req.body already has updatedAt, updatedBy, and change history
    const [prescription] = await db.update(schema.prescriptions)
      .set(req.body)
      .where(eq(schema.prescriptions.id, id))
      .returning();
    
    res.json(prescription);
  }
);
```

## Frontend Implementation

### 1. Components (`client/src/components/ui/TimestampDisplay.tsx`)

**Available Components:**

#### TimestampDisplay
Shows a single timestamp with user info and tooltip:
```tsx
import { TimestampDisplay } from '@/components/ui/TimestampDisplay';

<TimestampDisplay
  timestamp={order.updatedAt}
  userName={order.updatedBy}
  userEmail="john@example.com"
  action="updated"
  showIcon={true}
  showRelative={true}
/>
```
**Output:** "2 hours ago by John Doe" (with tooltip showing full date)

#### ChangeHistoryTimeline
Shows complete change history with before/after diffs:
```tsx
import { ChangeHistoryTimeline } from '@/components/ui/TimestampDisplay';

<ChangeHistoryTimeline history={order.changeHistory} />
```
**Output:** Visual timeline with each change, user, timestamp, and field diffs

#### AuditTimestamps
Compact display of created and updated timestamps:
```tsx
import { AuditTimestamps } from '@/components/ui/TimestampDisplay';

<AuditTimestamps
  createdAt={order.createdAt}
  createdBy={order.createdBy}
  updatedAt={order.updatedAt}
  updatedBy={order.updatedBy}
/>
```

### 2. Example Usage in Pages

#### Example 1: Order Detail Page
```tsx
import { TimestampDisplay, ChangeHistoryTimeline } from '@/components/ui/TimestampDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function OrderDetailPage({ order }) {
  const [showHistory, setShowHistory] = useState(false);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order #{order.orderNumber}</CardTitle>
            <TimestampDisplay
              timestamp={order.updatedAt}
              userName={order.updatedBy}
              action="updated"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Order details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm">{order.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Patient</label>
                <p className="text-sm">{order.patientName}</p>
              </div>
            </div>
            
            {/* Change history toggle */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide' : 'View'} Change History
              </Button>
              
              {showHistory && order.changeHistory && (
                <div className="mt-4">
                  <ChangeHistoryTimeline history={order.changeHistory} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Example 2: Data Table with Timestamps
```tsx
import { ColumnDef } from '@tanstack/react-table';
import { TimestampDisplay } from '@/components/ui/TimestampDisplay';

export const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Order #',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Updated',
    cell: ({ row }) => (
      <TimestampDisplay
        timestamp={row.original.updatedAt}
        userName={row.original.updatedBy}
        action="updated"
        showIcon={false}
      />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <TimestampDisplay
        timestamp={row.original.createdAt}
        userName={row.original.createdBy}
        action="created"
        showIcon={false}
        showRelative={false}
      />
    ),
  },
];
```

## Change History Data Structure

The `changeHistory` JSONB column stores an array of change entries:

```typescript
interface ChangeHistoryEntry {
  timestamp: string;        // ISO 8601 timestamp
  userId: string;           // User ID who made change
  userName: string;         // Full name of user
  userEmail: string;        // Email of user
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  changes?: {
    [fieldName: string]: {
      old: any;             // Previous value
      new: any;             // New value
    }
  };
  ipAddress?: string;       // IP address of request
}
```

**Example:**
```json
[
  {
    "timestamp": "2025-11-02T23:30:15.123Z",
    "userId": "user-123",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "action": "created",
    "ipAddress": "192.168.1.100"
  },
  {
    "timestamp": "2025-11-03T10:15:30.456Z",
    "userId": "user-456",
    "userName": "Jane Smith",
    "userEmail": "jane@example.com",
    "action": "status_changed",
    "changes": {
      "status": {
        "old": "pending",
        "new": "in_production"
      }
    },
    "ipAddress": "192.168.1.101"
  }
]
```

## Testing the Implementation

### Backend Test
```typescript
// Test creating a record with timestamps
const response = await fetch('/api/patients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Test Patient',
    email: 'test@example.com'
  })
});

const patient = await response.json();
console.log(patient.createdBy);      // Should show user name
console.log(patient.changeHistory);  // Should have initial entry
```

### Frontend Test
```tsx
// Test displaying timestamps
import { TimestampDisplay } from '@/components/ui/TimestampDisplay';

function TestPage() {
  const testData = {
    updatedAt: new Date().toISOString(),
    updatedBy: 'John Doe'
  };
  
  return (
    <TimestampDisplay
      timestamp={testData.updatedAt}
      userName={testData.updatedBy}
      action="updated"
    />
  );
}
```

## Compliance & Audit Benefits

This implementation provides:

1. **HIPAA Compliance**: Full audit trail of who accessed/modified PHI
2. **GOC Requirements**: Complete record of prescription changes
3. **User Accountability**: Every action traceable to specific user
4. **Forensic Analysis**: Reconstruct complete history of any record
5. **Dispute Resolution**: Evidence of what changed, when, and by whom
6. **Performance Reviews**: Track user activity and productivity
7. **Data Integrity**: Detect unauthorized or suspicious changes

## Implementation Checklist

### Backend (Completed ✅)
- [x] Create timestamp utility module
- [x] Add changeHistory JSONB columns to tables
- [x] Update Drizzle schema with new fields
- [x] Implement OrderTrackingService with timestamps
- [x] Update API routes to pass request context

### Backend (In Progress ⚠️)
- [ ] Update all POST routes to use `addCreationTimestamp()`
- [ ] Update all PATCH/PUT routes to use `addUpdateTimestamp()`
- [ ] Update all status change endpoints to use `addStatusChange()`
- [ ] Add timestamp middleware to remaining routes

### Frontend (Completed ✅)
- [x] Create TimestampDisplay component
- [x] Create ChangeHistoryTimeline component
- [x] Create AuditTimestamps component

### Frontend (In Progress ⚠️)
- [ ] Add timestamp display to order pages
- [ ] Add timestamp display to patient pages
- [ ] Add timestamp display to prescription pages
- [ ] Add change history viewers to detail pages
- [ ] Update data tables to show timestamps

## Next Steps

1. **Complete Backend Integration** (Priority 1)
   - Update all CRUD routes in: patients, prescriptions, returns, non-adapts
   - Test each route to ensure timestamps persist correctly

2. **Complete Frontend Integration** (Priority 2)
   - Add TimestampDisplay to all detail pages
   - Add ChangeHistoryTimeline to modal dialogs
   - Update table columns to show last updated info

3. **Testing & Validation** (Priority 3)
   - Create end-to-end tests for timestamp tracking
   - Verify change history calculations are accurate
   - Test with multiple users making concurrent changes

4. **Documentation** (Priority 4)
   - Update API documentation with timestamp fields
   - Create video tutorial for developers
   - Add examples to developer quick start guide
