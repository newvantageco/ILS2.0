# 🚀 Patient-Centric Ecosystem Implementation Guide

## Overview

This document provides the complete architecture plan to transform your ILS platform from a collection of modules into a **unified, event-driven, Patient-Centric Ecosystem**.

---

## ✅ Phase 1: Dynamic RBAC Foundation (COMPLETED)

### What We Built:

1. **Database Schema** (`migrations/001_dynamic_rbac_schema.sql`):
   - `dynamic_roles` table - Company-specific roles
   - `dynamic_role_permissions` table - Granular permission assignments
   - `user_dynamic_roles` table - User role assignments
   - `role_change_audit` table - Compliance tracking

2. **TypeScript Schema** (`shared/schema.ts`):
   - Added all dynamic RBAC table definitions using Drizzle ORM
   - Created type-safe insert/update schemas with Zod validation
   - Added TypeScript types for all RBAC entities

3. **Existing Services** (Already in place):
   - `DefaultRolesService.ts` - Creates default roles for new companies
   - `DynamicPermissionService.ts` - Permission checking middleware
   - `/api/roles/*` endpoints - Full CRUD API for role management

### Next Steps for RBAC:

**To Deploy:**
```bash
# 1. Run the migration
psql -d your_database_name -f migrations/001_dynamic_rbac_schema.sql

# 2. Seed default roles for existing companies
# (Add this script to your seed files)
import { createDefaultRoles } from './server/services/DefaultRolesService';

// For each existing company
const companies = await db.select().from(companies);
for (const company of companies) {
  await createDefaultRoles(company.id);
}
```

**To Build Admin UI** (See Phase 5 below)

---

## 🔄 Phase 2: Event-Driven Architecture

### Current State:

✅ **EventBus already exists** (`server/events/EventBus.ts`)
- In-memory pub/sub with database persistence
- Audit trail for all events
- Supports async handlers

### Enhancement Required:

Add **Patient Journey Events** to the existing EventBus:

**File**: `server/events/PatientJourneyEvents.ts` (NEW)

```typescript
import { EventBus } from './EventBus';

// =====================================================
// PATIENT JOURNEY EVENT TYPES
// =====================================================

export enum PatientJourneyEvent {
  // Examination Flow
  EXAM_STARTED = 'exam.started',
  EXAM_FINALIZED = 'exam.finalized',  // ⭐ CRITICAL - Triggers POS handoff
  
  // POS & Invoicing Flow  
  INVOICE_PAID = 'invoice.paid',      // ⭐ CRITICAL - Triggers order creation
  
  // Order Lifecycle (Lab Dashboard)
  ORDER_CREATED = 'order.created',    // ⭐ CRITICAL - Creates lab card
  ORDER_STATUS_CHANGED = 'order.status_changed', // ⭐ CRITICAL - Updates lab card
  ORDER_SHIPPED = 'order.shipped',    // ⭐ CRITICAL - Notifies patient
}

// =====================================================
// EVENT PAYLOADS
// =====================================================

export interface ExamFinalizedPayload {
  examId: string;
  patientId: string;
  ecpId: string;
  diagnosis?: string;
  recommendation?: string; // "Progressive", "Single Vision", etc.
}

export interface InvoicePaidPayload {
  invoiceId: string;
  patientId: string;
  dispenserId: string;
  totalAmount: number;
  lineItems: Array<{
    productId?: string;
    prescriptionId?: string;
    quantity: number;
  }>;
}

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  patientId: string;
  ecpId: string;
  lensType: string;
  frameType?: string;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  oldStatus: string;
  newStatus: string; // 'pending', 'in_production', 'quality_check', 'shipped'
  changedBy: string;
}

// =====================================================
// EVENT PUBLISHERS (Convenience Functions)
// =====================================================

export async function publishExamFinalized(data: ExamFinalizedPayload) {
  await EventBus.publish('exam.finalized', data, {
    source: 'clinical',
    companyId: data.ecpId, // Assuming ECP belongs to company
  });
}

export async function publishInvoicePaid(data: InvoicePaidPayload) {
  await EventBus.publish('invoice.paid', data, {
    source: 'pos',
    userId: data.dispenserId,
  });
}

export async function publishOrderCreated(data: OrderCreatedPayload) {
  await EventBus.publish('order.created', data, {
    source: 'system',
    userId: data.ecpId,
  });
}

export async function publishOrderStatusChanged(data: OrderStatusChangedPayload) {
  await EventBus.publish('order.status_changed', data, {
    source: 'lab',
    userId: data.changedBy,
  });
}
```

### Event Handlers:

**File**: `server/events/handlers/OrderHandlers.ts` (NEW)

```typescript
import { EventBus } from '../EventBus';
import { InvoicePaidPayload, OrderStatusChangedPayload } from '../PatientJourneyEvents';
import { db } from '../../db';
import { orders } from '../../../shared/schema';
import { sendEmail } from '../../services/EmailService';

// =====================================================
// HANDLER: Create Order When Invoice is Paid
// =====================================================

EventBus.subscribe('invoice.paid', async (event) => {
  const payload = event.data as InvoicePaidPayload;
  
  console.log(`📦 Creating order for invoice ${payload.invoiceId}...`);
  
  try {
    // Get prescription from invoice line items
    const prescriptionItem = payload.lineItems.find(item => item.prescriptionId);
    
    if (!prescriptionItem) {
      console.warn('No prescription in invoice. Skipping order creation.');
      return;
    }
    
    // Create order in database
    const [order] = await db.insert(orders).values({
      orderNumber: `ORD-${Date.now()}`,
      patientId: payload.patientId,
      ecpId: payload.dispenserId, // Or get from invoice
      status: 'pending',
      // ... other order fields
    }).returning();
    
    console.log(`✅ Order created: ${order.orderNumber}`);
    
    // Publish order.created event (triggers lab dashboard update)
    await EventBus.publish('order.created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      patientId: payload.patientId,
      ecpId: payload.dispenserId,
      lensType: 'progressive', // Get from prescription
    });
    
  } catch (error) {
    console.error('Failed to create order:', error);
    // TODO: Add to retry queue
  }
});

// =====================================================
// HANDLER: Send Email When Order Ships
// =====================================================

EventBus.subscribe('order.shipped', async (event) => {
  const payload = event.data as any;
  
  console.log(`📧 Sending shipment notification for order ${payload.orderNumber}...`);
  
  try {
    // Get patient email
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, payload.patientId),
    });
    
    if (!patient?.email) {
      console.warn('Patient has no email. Skipping notification.');
      return;
    }
    
    // Send email
    await sendEmail({
      to: patient.email,
      subject: `Your order ${payload.orderNumber} has shipped!`,
      template: 'order-shipped',
      data: {
        orderNumber: payload.orderNumber,
        trackingNumber: payload.trackingNumber,
      },
    });
    
    console.log(`✅ Shipment email sent to ${patient.email}`);
    
  } catch (error) {
    console.error('Failed to send shipment email:', error);
  }
});
```

**Initialize Handlers** in `server/index.ts`:

```typescript
import './events/handlers/OrderHandlers'; // Auto-registers all handlers
```

---

## 📊 Phase 3: Patient 360 View

### Goal:
Create a **single API endpoint** that returns ALL patient data in one call.

**File**: `server/routes/patients.ts` (ENHANCE EXISTING)

Add new endpoint:

```typescript
/**
 * GET /api/patients/:id/summary
 * 
 * The "Patient 360" - Everything about a patient in one API call.
 * This powers the new patient profile page.
 */
router.get('/:id/summary', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    
    // Verify patient belongs to this company
    const patient = await db.query.patients.findFirst({
      where: and(
        eq(patients.id, id),
        eq(patients.companyId, companyId)
      ),
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get all related data in parallel (FAST!)
    const [
      appointments,
      examinations,
      prescriptions,
      orders,
      invoices,
    ] = await Promise.all([
      // Appointments
      db.query.testRoomBookings.findMany({
        where: eq(testRoomBookings.patientId, id),
        orderBy: desc(testRoomBookings.bookingDate),
        limit: 10,
      }),
      
      // Clinical history
      db.query.eyeExaminations.findMany({
        where: eq(eyeExaminations.patientId, id),
        orderBy: desc(eyeExaminations.createdAt),
        limit: 5,
      }),
      
      // Prescriptions
      db.query.prescriptions.findMany({
        where: eq(prescriptions.patientId, id),
        orderBy: desc(prescriptions.createdAt),
      }),
      
      // Orders
      db.query.orders.findMany({
        where: eq(orders.patientId, id),
        orderBy: desc(orders.createdAt),
        with: {
          ecp: true, // Include ECP name
        },
      }),
      
      // Financial history
      db.query.invoices.findMany({
        where: eq(invoices.patientId, id),
        orderBy: desc(invoices.createdAt),
        limit: 20,
      }),
    ]);
    
    // Calculate summary stats
    const totalSpent = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    
    const activeOrders = orders.filter(o => 
      ['pending', 'in_production', 'quality_check'].includes(o.status)
    );
    
    res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        phone: patient.phone,
        address: patient.fullAddress,
      },
      summary: {
        totalSpent,
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        lastVisit: examinations[0]?.createdAt || null,
        nextAppointment: appointments.find(a => new Date(a.bookingDate) > new Date())?.bookingDate || null,
      },
      appointments,
      examinations,
      prescriptions,
      orders,
      invoices,
    });
    
  } catch (error) {
    console.error('Error fetching patient summary:', error);
    res.status(500).json({ error: 'Failed to fetch patient summary' });
  }
});
```

### UI Component:

**File**: `client/src/pages/PatientProfile.tsx` (NEW)

```tsx
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PatientProfile({ patientId }: { patientId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['patient-summary', patientId],
    queryFn: () => fetch(`/api/patients/${patientId}/summary`).then(r => r.json()),
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="container mx-auto p-6">
      {/* Header with patient info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold">{data.patient.name}</h1>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <StatCard label="Total Spent" value={`£${data.summary.totalSpent.toFixed(2)}`} />
          <StatCard label="Total Orders" value={data.summary.totalOrders} />
          <StatCard label="Active Orders" value={data.summary.activeOrders} />
          <StatCard label="Last Visit" value={formatDate(data.summary.lastVisit)} />
        </div>
      </div>
      
      {/* Tabbed content */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="examinations">Clinical History</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileTab data={data.patient} />
        </TabsContent>
        
        <TabsContent value="orders">
          <OrdersTab orders={data.orders} />
        </TabsContent>
        
        {/* ... other tabs */}
      </Tabs>
    </div>
  );
}
```

---

## 🛒 Phase 4: Guided POS Wizard

### Goal:
Transform POS from a single-page form into a **multi-step wizard** that guides the dispenser through the exact process in your UI mockups.

**File**: `client/src/pages/pos/POSWizard.tsx` (NEW)

```tsx
import { useState } from 'react';
import { Step1_PatientSelect } from './steps/PatientSelect';
import { Step2_LensSelection } from './steps/LensSelection';
import { Step3_CoatingsAddons } from './steps/CoatingsAddons';
import { Step4_Measurements } from './steps/Measurements';
import { Step5_Checkout } from './steps/Checkout';

export function POSWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    patient: null,
    prescription: null,
    lenses: null,
    coatings: [],
    measurements: null,
  });
  
  const steps = [
    { number: 1, name: 'Patient & Rx', component: Step1_PatientSelect },
    { number: 2, name: 'Lens Selection', component: Step2_LensSelection },
    { number: 3, name: 'Coatings & Add-ons', component: Step3_CoatingsAddons },
    { number: 4, name: 'Measurements', component: Step4_Measurements },
    { number: 5, name: 'Checkout', component: Step5_Checkout },
  ];
  
  const CurrentStepComponent = steps[currentStep - 1].component;
  
  const handleNext = (stepData: any) => {
    setWizardData({ ...wizardData, ...stepData });
    setCurrentStep(currentStep + 1);
  };
  
  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex-1 text-center ${
                step.number === currentStep ? 'text-blue-600 font-bold' : 'text-gray-400'
              }`}
            >
              <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                step.number === currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {step.number}
              </div>
              <div className="mt-2">{step.name}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Current step content */}
      <CurrentStepComponent
        data={wizardData}
        onNext={handleNext}
        onBack={handleBack}
      />
    </div>
  );
}
```

**Step 1**: `client/src/pages/pos/steps/PatientSelect.tsx`

```tsx
export function Step1_PatientSelect({ data, onNext }: StepProps) {
  const [selectedPatient, setSelectedPatient] = useState(data.patient);
  const [latestExam, setLatestExam] = useState(null);
  
  // When patient is selected, fetch their latest exam
  useEffect(() => {
    if (selectedPatient) {
      fetch(`/api/patients/${selectedPatient.id}/summary`)
        .then(r => r.json())
        .then(summary => {
          const exam = summary.examinations[0]; // Most recent
          setLatestExam(exam);
        });
    }
  }, [selectedPatient]);
  
  return (
    <div>
      <h2>Select Patient</h2>
      
      <PatientSearch onSelect={setSelectedPatient} />
      
      {latestExam && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h3>Latest Examination</h3>
          <p>Diagnosis: {latestExam.diagnosis}</p>
          <p>Recommendation: {latestExam.recommendation}</p>
          <p className="text-sm text-gray-600">
            Performed by {latestExam.ecpName} on {formatDate(latestExam.createdAt)}
          </p>
        </div>
      )}
      
      <button
        onClick={() => onNext({ patient: selectedPatient, prescription: latestExam })}
        disabled={!selectedPatient}
        className="mt-4 btn-primary"
      >
        Next: Select Lenses
      </button>
    </div>
  );
}
```

**Step 2**: `client/src/pages/pos/steps/LensSelection.tsx`

```tsx
export function Step2_LensSelection({ data, onNext, onBack }: StepProps) {
  const [lensType, setLensType] = useState(null);
  
  // Filter lens options based on prescription recommendation
  const recommendation = data.prescription?.recommendation; // "Progressive", "Single Vision"
  
  const lensOptions = useMemo(() => {
    if (recommendation === 'Progressive') {
      return lenses.filter(l => l.type === 'progressive');
    } else if (recommendation === 'Single Vision') {
      return lenses.filter(l => l.type === 'single_vision');
    }
    return lenses;
  }, [recommendation]);
  
  return (
    <div>
      <h2>Select Lenses</h2>
      
      {recommendation && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          ✓ Recommended: {recommendation}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {lensOptions.map(lens => (
          <LensCard
            key={lens.id}
            lens={lens}
            selected={lensType?.id === lens.id}
            onClick={() => setLensType(lens)}
          />
        ))}
      </div>
      
      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button
          onClick={() => onNext({ lenses: lensType })}
          disabled={!lensType}
          className="btn-primary"
        >
          Next: Add Coatings
        </button>
      </div>
    </div>
  );
}
```

---

## 🏭 Phase 5: Real-Time Lab Dashboard

### Goal:
Build a **Kanban board** that updates in real-time when orders are created or their status changes.

**Backend**: Add WebSocket support

**File**: `server/index.ts` (ENHANCE)

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { EventBus } from './events/EventBus';

// After creating Express app
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5000',
    credentials: true,
  },
});

// Authentication middleware for WebSocket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT token
  // ...
  next();
});

// Subscribe to order events and broadcast to lab users
EventBus.subscribe('order.created', async (event) => {
  const payload = event.data;
  
  // Broadcast to all lab users of this company
  io.to(`lab:${payload.companyId}`).emit('order:created', {
    orderId: payload.orderId,
    orderNumber: payload.orderNumber,
    patientName: payload.patientName,
    lensType: payload.lensType,
    status: 'pending',
  });
});

EventBus.subscribe('order.status_changed', async (event) => {
  const payload = event.data;
  
  io.to(`lab:${payload.companyId}`).emit('order:status_changed', {
    orderId: payload.orderId,
    oldStatus: payload.oldStatus,
    newStatus: payload.newStatus,
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join company-specific room
  const { companyId, role } = socket.handshake.auth;
  
  if (role === 'lab_tech' || role === 'admin') {
    socket.join(`lab:${companyId}`);
    console.log(`User joined lab room: lab:${companyId}`);
  }
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
```

**Frontend**: Real-time Kanban board

**File**: `client/src/pages/lab/LabDashboard.tsx` (ENHANCE)

```tsx
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export function LabDashboard() {
  const socket = useSocket();
  const [orders, setOrders] = useState({
    pending: [],
    in_production: [],
    quality_check: [],
    shipped: [],
  });
  
  // Load initial orders
  useEffect(() => {
    fetch('/api/orders?labView=true')
      .then(r => r.json())
      .then(data => {
        const grouped = groupByStatus(data.orders);
        setOrders(grouped);
      });
  }, []);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!socket) return;
    
    // New order appears in "Pending" column
    socket.on('order:created', (newOrder) => {
      setOrders(prev => ({
        ...prev,
        pending: [newOrder, ...prev.pending],
      }));
      
      // Show notification
      toast.success(`New order: ${newOrder.orderNumber}`);
    });
    
    // Order moves between columns
    socket.on('order:status_changed', ({ orderId, oldStatus, newStatus }) => {
      setOrders(prev => {
        const order = findOrder(prev, orderId);
        if (!order) return prev;
        
        return {
          ...prev,
          [oldStatus]: prev[oldStatus].filter(o => o.id !== orderId),
          [newStatus]: [...prev[newStatus], { ...order, status: newStatus }],
        };
      });
    });
    
    return () => {
      socket.off('order:created');
      socket.off('order:status_changed');
    };
  }, [socket]);
  
  // Handle drag & drop
  const handleDragEnd = async (result) => {
    const { draggableId, source, destination } = result;
    
    if (!destination || source.droppableId === destination.droppableId) {
      return;
    }
    
    const orderId = draggableId;
    const newStatus = destination.droppableId;
    
    // Optimistic update
    setOrders(prev => {
      const order = findOrder(prev, orderId);
      return {
        ...prev,
        [source.droppableId]: prev[source.droppableId].filter(o => o.id !== orderId),
        [newStatus]: [...prev[newStatus], { ...order, status: newStatus }],
      };
    });
    
    // Update backend
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Lab Production Queue</h1>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(orders).map(([status, orderList]) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-gray-100 rounded-lg p-4"
                >
                  <h2 className="font-bold mb-4">
                    {status.replace('_', ' ').toUpperCase()}
                    <span className="ml-2 text-gray-600">({orderList.length})</span>
                  </h2>
                  
                  {orderList.map((order, index) => (
                    <Draggable key={order.id} draggableId={order.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white rounded-lg shadow p-4 mb-3"
                        >
                          <div className="font-bold">{order.orderNumber}</div>
                          <div className="text-sm text-gray-600">{order.patientName}</div>
                          <div className="text-xs text-gray-500 mt-2">{order.lensType}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
```

---

## 🎛️ Phase 6: Admin RBAC Management UI

**File**: `client/src/pages/admin/RoleManagement.tsx` (NEW)

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export function RoleManagement() {
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => fetch('/api/roles').then(r => r.json()),
  });
  
  const { data: allPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => fetch('/api/roles/permissions/all').then(r => r.json()),
  });
  
  const [editingRole, setEditingRole] = useState(null);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <button onClick={() => setEditingRole({ isNew: true })}>
          + Create Custom Role
        </button>
      </div>
      
      <table className="w-full">
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Permissions</th>
            <th>Users</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles?.map(role => (
            <tr key={role.id}>
              <td>{role.name}</td>
              <td>{role.permissionCount} permissions</td>
              <td>{role.userCount} users</td>
              <td>
                <button onClick={() => setEditingRole(role)}>Edit</button>
                {role.isDeletable && (
                  <button onClick={() => handleDelete(role.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {editingRole && (
        <RoleEditorDialog
          role={editingRole}
          allPermissions={allPermissions}
          onClose={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}

function RoleEditorDialog({ role, allPermissions, onClose }) {
  const [selectedPermissions, setSelectedPermissions] = useState(
    role.permissions?.map(p => p.id) || []
  );
  
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (role.isNew) {
        return fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        return fetch(`/api/roles/${role.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      onClose();
    },
  });
  
  const handleSave = () => {
    saveMutation.mutate({
      name: role.name,
      description: role.description,
      permissionIds: selectedPermissions,
    });
  };
  
  // Group permissions by category
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {role.isNew ? 'Create Custom Role' : `Edit Role: ${role.name}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <input
            placeholder="Role Name"
            value={role.name}
            onChange={(e) => setRole({ ...role, name: e.target.value })}
          />
          
          <textarea
            placeholder="Description"
            value={role.description}
            onChange={(e) => setRole({ ...role, description: e.target.value })}
          />
          
          <div>
            <h3 className="font-bold mb-2">Permissions</h3>
            
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  {category}
                </h4>
                
                <div className="grid grid-cols-2 gap-2">
                  {perms.map(perm => (
                    <label key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPermissions.includes(perm.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissions([...selectedPermissions, perm.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== perm.id));
                          }
                        }}
                      />
                      <span className="text-sm">{perm.permissionName}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={saveMutation.isLoading}>
            {saveMutation.isLoading ? 'Saving...' : 'Save Role'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📋 Implementation Checklist

### Week 1: Event System Enhancement
- [ ] Create `PatientJourneyEvents.ts` with event types
- [ ] Create `OrderHandlers.ts` for invoice→order automation
- [ ] Wire up handlers in `server/index.ts`
- [ ] Test event flow: POS payment → Order creation

### Week 2: Patient 360 View
- [ ] Add `/api/patients/:id/summary` endpoint
- [ ] Create `PatientProfile.tsx` page with tabs
- [ ] Build sub-components for each tab
- [ ] Add route in React Router

### Week 3: POS Wizard
- [ ] Create `POSWizard.tsx` container
- [ ] Build Step 1: PatientSelect with exam data
- [ ] Build Step 2: LensSelection with filtering
- [ ] Build Step 3: Coatings with AI upsell
- [ ] Build Step 4: Measurements capture
- [ ] Build Step 5: Checkout with event firing

### Week 4: Lab Dashboard
- [ ] Install Socket.io dependencies
- [ ] Add WebSocket server to `server/index.ts`
- [ ] Create `useSocket` hook on frontend
- [ ] Build Kanban board with drag & drop
- [ ] Wire up real-time event listeners
- [ ] Test: Create order → Card appears instantly

### Week 5: Admin RBAC UI
- [ ] Create `RoleManagement.tsx` page
- [ ] Build role table with CRUD buttons
- [ ] Create `RoleEditorDialog` component
- [ ] Add permission checkboxes grouped by category
- [ ] Test: Create "Trainee Dispenser" role
- [ ] Verify: New role appears in user assignment dropdown

---

## 🎯 Success Metrics

When complete, you will have:

1. ✅ **Zero-Click Order Creation** - Dispenser pays invoice → Order auto-created
2. ✅ **Real-Time Lab Updates** - New orders appear on lab dashboard instantly
3. ✅ **360° Patient View** - All patient data in one screen, no hunting
4. ✅ **Guided POS Flow** - Error-proof dispensing with smart recommendations
5. ✅ **Custom Roles** - Tenants can create "Trainee Dispenser" or any role they need

This transforms ILS from a PMS into a **Patient-Centric Operating System**.
