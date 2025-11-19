# 🗓️ Integrated Diary/Appointment System - Implementation Plan

## Executive Summary

Transform the current standalone diary into a **Real-Time Integrated Appointment Dashboard** connecting all ILS 2.0 services with role-based workflows, digital handoffs, and analytics.

---

## 1. Current State vs Target State

### Current State ✅
- Appointments schema (appointments, resources, availability tables)
- AppointmentService with CRUD operations  
- WebSocket service infrastructure
- Basic appointment routes

### Gaps ⚠️
- DiaryPage uses mock data (not integrated)
- No real-time updates
- No role-based workflows
- No digital handoffs between staff

### Target State 🎯
- **Real-Time Dashboard**: Live updates via WebSocket
- **Unified Data**: Integrates appointments + patients + exams + prescriptions + orders
- **Role-Based Views**: Different interfaces per role
- **Digital Handoffs**: Seamless patient flow automation
- **Analytics**: Utilization, no-shows, conversion tracking

---

## 2. Unified Data Architecture

### Integrated Appointment Model

```typescript
interface IntegratedAppointment {
  // Core appointment data
  id: string;
  patientId: string;
  practitionerId: string;
  startTime: Date;
  endTime: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  
  // Enriched patient context
  patient: {
    name: string;
    email: string;
    phone: string;
    lastVisit?: Date;
  };
  
  // Clinical status
  clinical?: {
    hasActiveExam: boolean;
    examId?: string;
    hasPrescription: boolean;
    prescriptionSigned: boolean;
  };
  
  // Dispensing status
  dispensing?: {
    hasOrder: boolean;
    orderId?: string;
    orderStatus?: string;
  };
  
  // Real-time flow
  realtimeStatus: {
    currentStage: 'scheduled' | 'checked_in' | 'in_exam' | 'ready_for_dispense' | 'completed';
    lastUpdate: Date;
    nextAction?: string;
  };
}
```

### Service Integration Map

| Service | Purpose | Data Provided |
|---------|---------|---------------|
| AppointmentService | Scheduling | Appointments, slots |
| EHRService | Clinical | Patient history, exam status |
| ExaminationFormService | Exams | Active exams, progress |
| PrescriptionService | Rx | Signed prescriptions |
| OrderService | Dispensing | Orders, collection |
| WebSocketService | Real-time | Live updates |
| BiAnalyticsService | Metrics | KPIs, trends |

---

## 3. Role-Based Workflows

### 3.1 Optometrist (ECP) View

**Key Features**:
- Today's schedule with patient context
- 🔴 Live status: Checked-in patients highlighted
- **One-Click Exam Launch**: Opens ExaminationForm
- Patient 360 preview
- Running late indicator with auto-notifications

**Critical Actions**:
```typescript
// Start exam - launches form & updates status
startExam(appointmentId: string): void;

// View history before appointment
viewPatientHistory(patientId: string): void;

// Quick reschedule if delayed
rescheduleAppointment(appointmentId: string, newTime: Date): void;
```

**WebSocket Events**:
- `appointment:patient_checked_in` → Visual alert
- `appointment:patient_waiting` → Timer starts

---

### 3.2 Dispenser/Sales View

**Key Features**:
- **Ready for Dispense Queue**: Patients with signed Rx
- **Quick POS**: Launch invoice for patient
- **Auto-Load Prescription**: Display final signed Rx
- 🔔 Real-time notifications when exam completes
- Sales targets & conversion tracking

**Critical Actions**:
```typescript
// View signed Rx
viewPrescription(appointmentId: string): Promise<Prescription>;

// Create order from appointment
createOrder(appointmentId: string): Promise<Order>;

// Frame fitting workflow
startFrameFitting(appointmentId: string): void;
```

**WebSocket Events**:
- `exam:completed` → Add to dispense queue
- `prescription:signed` → Ready for order

---

### 3.3 Reception/Admin View

**Key Features**:
- Multi-practitioner calendar view
- 🎯 Drag-and-drop booking
- Quick check-in button
- Automated reminder status
- No-show tracking & follow-up
- Waitlist management

**Critical Actions**:
```typescript
// Quick check-in
checkInPatient(appointmentId: string): Promise<void>;

// Drag reschedule
dragReschedule(appointmentId: string, newSlot: TimeSlot): Promise<void>;

// Fill from waitlist
fillFromWaitlist(slotTime: Date): Promise<Appointment[]>;

// Mark no-show + create follow-up
markNoShow(appointmentId: string, createFollowUp: boolean): Promise<void>;
```

---

### 3.4 Company Admin View

**Key Metrics**:
```typescript
interface AdminMetrics {
  // Utilization
  practitionerUtilization: {
    practitionerId: string;
    bookedHours: number;
    availableHours: number;
    utilizationRate: number;
  }[];
  
  // No-Shows
  noShowMetrics: {
    daily: number;
    weekly: number;
    trendComparison: number;
  };
  
  // Conversion (Exam → Order)
  conversionRate: number;
  lostOpportunities: number;
  
  // Wait Times
  averageWaitTime: number;
  patientsWaiting: number;
}
```

---

## 4. Digital Handoff System

### Patient Journey Flow

```
Scheduled → Checked In → In Pre-Test → In Exam → Ready for Dispense → Order Placed → Completed
```

### Handoff Trigger Example

```typescript
async function handleExamCompletion(examId: string, appointmentId: string) {
  // 1. Update appointment status
  await appointmentService.updateAppointment(appointmentId, {
    realtimeStatus: {
      currentStage: 'ready_for_dispense',
      nextAction: 'Create Order'
    }
  });
  
  // 2. Broadcast WebSocket
  webSocketService.broadcast({
    event: 'appointment:ready_for_dispense',
    appointmentId,
    patientName,
    prescriptionId
  });
  
  // 3. Notify dispenser
  notificationService.notify({
    userId: dispenserId,
    type: 'appointment_ready',
    message: `${patientName}'s exam complete`,
    actionUrl: `/diary?appointment=${appointmentId}`
  });
  
  // 4. Track analytics
  biAnalyticsService.trackEvent({
    event: 'exam_completed',
    appointmentId
  });
}
```

---

## 5. Real-Time Features

### Status Color Indicators

- 🟢 **Green**: Scheduled, On Time
- 🟡 **Yellow**: Checked In, Waiting  
- 🔵 **Blue**: In Exam
- 🟣 **Purple**: Ready for Dispense
- 🟠 **Orange**: Running Late
- 🔴 **Red**: No Show / Cancelled

### WebSocket Event Schema

```typescript
// Client subscribes
socket.emit('join_company', { companyId });

// Server broadcasts
interface AppointmentEvent {
  event: 'appointment:status_changed';
  appointmentId: string;
  timestamp: Date;
  data: Partial<IntegratedAppointment>;
}

// Client handles
socket.on('appointment:status_changed', (event) => {
  queryClient.invalidateQueries(['appointments']);
  toast.info(`${event.data.patient.name} is now ${event.data.status}`);
});
```

---

## 6. Advanced Booking Features

### 6.1 Online Self-Booking Portal

- Real-time availability calendar
- Configurable slot lengths per appointment type
- Patient selects preferred practitioner
- Instant confirmation with calendar invite

```typescript
POST /api/public/appointments/book (no auth required)
```

### 6.2 Multi-Resource Scheduling

**Resources**: Practitioners + Test Rooms + Equipment

```typescript
async function checkMultiResourceAvailability(
  resources: ResourceRequest[]
): Promise<ConflictReport> {
  // Check each resource for conflicts
  // Return alternative slots if conflicts exist
}
```

### 6.3 Automated Reminders (BullMQ)

**Schedule**:
- 7 days: Email confirmation
- 48 hours: Email reminder
- 24 hours: SMS reminder  
- 2 hours: SMS final reminder

```typescript
// BullMQ worker
reminderWorker.process(async (job) => {
  const { appointmentId, reminderType } = job.data;
  
  if (reminderType === 'email') {
    await emailService.sendReminder(appointmentId);
  } else if (reminderType === 'sms') {
    await smsService.sendReminder(appointmentId);
  }
});
```

### 6.4 Intelligent Waitlist

```typescript
async function findWaitlistMatches(cancelledSlot: TimeSlot) {
  // Get waitlist entries
  // Score based on preferences
  // Notify top 3 matches
  // 30-min response window
}
```

---

## 7. Admin Analytics

### Utilization Report

```sql
-- Practitioner utilization query
SELECT 
  u.id,
  u.first_name || ' ' || u.last_name as name,
  SUM(booked_hours) as total_booked,
  SUM(available_hours) as total_available,
  (SUM(booked_hours) / SUM(available_hours)) * 100 as utilization_rate
FROM users u
JOIN practitioner_hours ph ON u.id = ph.practitioner_id
GROUP BY u.id;
```

### No-Show Prediction

```typescript
interface NoShowFeatures {
  previousNoShows: number;
  noShowRate: number;
  bookingLeadTime: number; // days
  remindersSent: number;
  confirmationReceived: boolean;
  isFirstAppointment: boolean;
}

// Risk score 0-100
function predictNoShowRisk(features: NoShowFeatures): number {
  let risk = 0;
  if (features.noShowRate > 0.2) risk += 30;
  if (features.bookingLeadTime > 30) risk += 20;
  if (!features.confirmationReceived) risk += 25;
  return risk;
}
```

### Conversion Funnel

```typescript
// Exam → Order conversion
{
  stage: 'Scheduled', count: 100, percentage: 100,
  stage: 'Completed Exams', count: 92, percentage: 92,
  stage: 'Prescriptions', count: 88, percentage: 88,
  stage: 'Orders', count: 76, percentage: 76
}
// Conversion rate: 76%
```

---

## 8. Implementation Phases

### Phase 1: Backend Integration (Week 1-2)
- [ ] Enhance AppointmentService with integrated data
- [ ] Create `/api/appointments/integrated` endpoint
- [ ] Add WebSocket event handlers
- [ ] Implement handoff triggers

### Phase 2: Frontend Real-Time Dashboard (Week 2-3)
- [ ] Refactor DiaryPage with real data
- [ ] WebSocket connection & handling
- [ ] Role-based views
- [ ] Live status indicators

### Phase 3: Digital Handoffs (Week 3-4)
- [ ] One-click exam launch
- [ ] Ready for Dispense queue
- [ ] Auto-load prescription
- [ ] Check-in button

### Phase 4: Advanced Booking (Week 4-5)
- [ ] Public booking portal
- [ ] Multi-resource scheduling
- [ ] Automated reminders (BullMQ)
- [ ] Waitlist matching

### Phase 5: Analytics (Week 5-6)
- [ ] Utilization dashboard
- [ ] No-show prediction
- [ ] Conversion funnel
- [ ] Wait time monitoring

---

## 9. Key API Endpoints

```typescript
// Integrated appointments
GET /api/appointments/integrated

// Update status (triggers WebSocket)
PATCH /api/appointments/:id/status

// Quick check-in
POST /api/appointments/:id/check-in

// Launch exam
POST /api/appointments/:id/start-exam

// Available slots
GET /api/appointments/available-slots

// Public booking (no auth)
POST /api/public/appointments/book

// Admin metrics
GET /api/admin/metrics/utilization
GET /api/admin/metrics/no-shows
GET /api/admin/metrics/conversion
```

---

## 10. Success Metrics

### Operational Efficiency
- ⏱️ **Wait Time**: Reduce by 30%
- 📊 **Utilization**: Increase to 85%+
- ❌ **No-Shows**: Reduce by 40%

### Revenue Impact
- 💰 **Conversion**: Increase exam → order by 15%
- 📈 **Revenue**: +20% from better utilization
- 🎯 **Recall**: 60% booking rate from recalls

### User Experience
- ⚡ **Check-in**: < 2 minutes
- 📱 **Self-Booking**: 70% adoption
- ⭐ **Satisfaction**: 4.5+ rating

---

## Next Steps

1. **Review & Approve**: Architecture and phases
2. **Resource Planning**: Assign development team
3. **Start Phase 1**: Backend integration (2 weeks)
4. **Parallel Design**: UI/UX mockups for role views
5. **Testing Plan**: Integration, load, and E2E tests

**Estimated Timeline**: 6 weeks to full deployment
**Team Required**: 2 backend + 2 frontend + 1 QA
