# 📋 Diary System Integration - Implementation Tasks

## Phase 1: Backend Integration (Week 1-2)

### Task 1.1: Create IntegratedAppointmentService
**File**: `server/services/IntegratedAppointmentService.ts`
**Priority**: HIGH

```typescript
// Create new service that enriches appointment data
class IntegratedAppointmentService {
  async getIntegratedAppointment(id: string): Promise<IntegratedAppointment>
  async getIntegratedAppointments(params): Promise<IntegratedAppointment[]>
  async updateAppointmentWithHandoff(id, status): Promise<void>
}
```

- [ ] Create `IntegratedAppointmentService.ts`
- [ ] Implement `getIntegratedAppointment()` with JOINs for patient, practitioner
- [ ] Add clinical status check (exam exists, prescription signed)
- [ ] Add dispensing status check (order exists, status)
- [ ] Calculate `realtimeStatus.currentStage` based on data
- [ ] Write unit tests

---

### Task 1.2: Add WebSocket Event Handlers
**File**: `server/services/WebSocketService.ts`
**Priority**: HIGH

```typescript
// Add appointment-specific broadcasts
webSocketService.broadcastAppointmentStatusChange(companyId, event);
webSocketService.broadcastAppointmentCheckIn(companyId, appointmentId);
webSocketService.broadcastReadyForDispense(companyId, appointmentId);
```

- [ ] Add `broadcastAppointmentStatusChange()` method
- [ ] Add `broadcastAppointmentCheckIn()` method
- [ ] Add `broadcastReadyForDispense()` method
- [ ] Test WebSocket room subscriptions

---

### Task 1.3: Create Integrated Appointments API
**File**: `server/routes/appointments.ts`  
**Priority**: HIGH

```typescript
// New endpoints
GET /api/appointments/integrated
PATCH /api/appointments/:id/status  
POST /api/appointments/:id/check-in
POST /api/appointments/:id/start-exam
```

- [ ] Add `GET /integrated` endpoint
- [ ] Add `PATCH /:id/status` with WebSocket trigger
- [ ] Add `POST /:id/check-in` endpoint
- [ ] Add `POST /:id/start-exam` endpoint (creates exam + updates status)
- [ ] Add role-based authorization checks

---

### Task 1.4: Implement Digital Handoff Triggers
**File**: `server/services/AppointmentHandoffService.ts`
**Priority**: MEDIUM

```typescript
class AppointmentHandoffService {
  async handleCheckIn(appointmentId)
  async handleExamStart(appointmentId)
  async handleExamComplete(appointmentId)
  async handleDispensingStart(appointmentId)
}
```

- [ ] Create `AppointmentHandoffService.ts`
- [ ] Implement check-in handoff
- [ ] Implement exam start handoff
- [ ] Implement exam complete → dispense handoff
- [ ] Implement order creation handoff
- [ ] Add notifications for each handoff

---

### Task 1.5: Admin Analytics Queries
**File**: `server/services/AppointmentAnalyticsService.ts`
**Priority**: MEDIUM

```typescript
class AppointmentAnalyticsService {
  async getPractitionerUtilization(startDate, endDate)
  async getNoShowMetrics(startDate, endDate)
  async getConversionFunnel(startDate, endDate)
  async getWaitTimeMetrics(date)
}
```

- [ ] Create `AppointmentAnalyticsService.ts`
- [ ] Implement utilization query
- [ ] Implement no-show query
- [ ] Implement conversion funnel query
- [ ] Implement wait time calculations
- [ ] Add API routes for metrics

---

## Phase 2: Frontend Real-Time Dashboard (Week 2-3)

### Task 2.1: Refactor DiaryPage with Real Data
**File**: `client/src/pages/DiaryPage.tsx`
**Priority**: HIGH

- [ ] Replace mock data with React Query hooks
- [ ] Add `useIntegratedAppointments()` hook
- [ ] Remove hardcoded tasks (replace with API data)
- [ ] Add loading states
- [ ] Add error handling

---

### Task 2.2: Add WebSocket Connection
**File**: `client/src/hooks/useAppointmentWebSocket.ts`
**Priority**: HIGH

```typescript
function useAppointmentWebSocket(companyId: string) {
  // Connect to WebSocket
  // Subscribe to company channel
  // Handle appointment events
  // Invalidate React Query cache on updates
}
```

- [ ] Create `useAppointmentWebSocket.ts` hook
- [ ] Connect to Socket.IO server
- [ ] Subscribe to company-specific channel
- [ ] Handle `appointment:status_changed` events
- [ ] Handle `appointment:checked_in` events
- [ ] Invalidate React Query cache on events
- [ ] Show toast notifications

---

### Task 2.3: Create Role-Based Views
**Files**: Multiple

**ECP View** (`client/src/components/diary/ECPDiaryView.tsx`):
- [ ] Create component with ECP-specific layout
- [ ] Show today's schedule
- [ ] Highlight checked-in patients
- [ ] Add "Start Exam" button
- [ ] Add patient history preview

**Dispenser View** (`client/src/components/diary/DispenserDiaryView.tsx`):
- [ ] Create "Ready for Dispense" queue component
- [ ] Add "View Prescription" button
- [ ] Add "Create Order" button
- [ ] Show conversion metrics

**Reception View** (`client/src/components/diary/ReceptionDiaryView.tsx`):
- [ ] Create multi-practitioner calendar
- [ ] Add check-in button
- [ ] Add drag-and-drop (react-dnd)
- [ ] Show no-show tracking

**Admin View** (`client/src/components/diary/AdminDiaryView.tsx`):
- [ ] Create KPI dashboard
- [ ] Add utilization charts (recharts)
- [ ] Add no-show trends
- [ ] Add conversion funnel

---

### Task 2.4: Live Status Indicators
**File**: `client/src/components/diary/AppointmentStatusBadge.tsx`
**Priority**: MEDIUM

```typescript
function AppointmentStatusBadge({ appointment }) {
  const color = getStatusColor(appointment);
  return <Badge className={color}>{appointment.stage}</Badge>
}
```

- [ ] Create `AppointmentStatusBadge.tsx`
- [ ] Implement color logic (green/yellow/blue/purple/orange/red)
- [ ] Add pulsing animation for active status
- [ ] Add tooltips with status details

---

### Task 2.5: Implement Drag-and-Drop Rescheduling
**File**: `client/src/components/diary/DragDropSchedule.tsx`
**Priority**: LOW

- [ ] Install `react-dnd` and `react-dnd-html5-backend`
- [ ] Create draggable appointment card
- [ ] Create droppable time slots
- [ ] Handle drop with API call to reschedule
- [ ] Show confirmation modal before rescheduling

---

## Phase 3: Digital Handoffs (Week 3-4)

### Task 3.1: One-Click Exam Launch
**File**: `client/src/components/diary/StartExamButton.tsx`
**Priority**: HIGH

```typescript
async function handleStartExam() {
  // POST /api/appointments/:id/start-exam
  // Get examId and examUrl
  // Navigate to ExaminationForm
}
```

- [ ] Create `StartExamButton.tsx` component
- [ ] Call `/api/appointments/:id/start-exam` on click
- [ ] Navigate to `/examinations/:examId`
- [ ] Show loading state
- [ ] Handle errors

---

### Task 3.2: Ready for Dispense Queue
**File**: `client/src/components/diary/DispenseQueue.tsx`
**Priority**: HIGH

- [ ] Create queue component
- [ ] Filter appointments with `stage === 'ready_for_dispense'`
- [ ] Show patient name, exam time, practitioner
- [ ] Add "View Prescription" button
- [ ] Add "Create Order" button
- [ ] Show real-time updates via WebSocket

---

### Task 3.3: Auto-Load Prescription
**File**: `client/src/components/diary/PrescriptionViewer.tsx`
**Priority**: MEDIUM

```typescript
function PrescriptionViewer({ appointmentId }) {
  const { data: prescription } = useQuery(
    ['prescriptions', appointmentId],
    () => fetchPrescriptionByAppointment(appointmentId)
  );
  // Display prescription details
}
```

- [ ] Create `PrescriptionViewer.tsx`
- [ ] Fetch prescription by appointment ID
- [ ] Display Rx details (sphere, cylinder, axis, etc.)
- [ ] Show signature and verification status
- [ ] Add "Create Order" button

---

### Task 3.4: Check-In Button for Reception
**File**: `client/src/components/diary/CheckInButton.tsx`
**Priority**: MEDIUM

```typescript
async function handleCheckIn(appointmentId) {
  await apiClient.post(`/api/appointments/${appointmentId}/check-in`);
  toast.success('Patient checked in');
  // WebSocket will update UI automatically
}
```

- [ ] Create `CheckInButton.tsx`
- [ ] Call check-in API on click
- [ ] Show success toast
- [ ] Disable after check-in
- [ ] Show timestamp of check-in

---

### Task 3.5: Running Late Notifications
**File**: `server/jobs/runningLateChecker.ts`
**Priority**: LOW

```typescript
// BullMQ cron job every 5 minutes
async function checkRunningLate() {
  const appointments = await getAppointmentsRunningLate();
  for (const apt of appointments) {
    await notificationService.notifyRunningLate(apt);
  }
}
```

- [ ] Create `runningLateChecker.ts` cron job
- [ ] Find appointments > 15 min past start time
- [ ] Notify practitioner
- [ ] Notify reception
- [ ] Offer auto-notification to patient

---

## Phase 4: Advanced Booking (Week 4-5)

### Task 4.1: Public Booking Portal
**Files**: `client/src/pages/PublicBookingPage.tsx`, `server/routes/publicAppointments.ts`
**Priority**: MEDIUM

Frontend:
- [ ] Create public-facing booking page (no auth)
- [ ] Show available practitioners
- [ ] Show available time slots
- [ ] Collect patient info (name, email, phone)
- [ ] Show confirmation screen

Backend:
- [ ] Create `POST /api/public/appointments/book` (no auth)
- [ ] Validate slot availability
- [ ] Rate limiting (prevent spam)
- [ ] Create appointment with `pending_confirmation` status
- [ ] Send confirmation email with verification link

---

### Task 4.2: Multi-Resource Scheduling
**File**: `server/services/ResourceSchedulingService.ts`
**Priority**: MEDIUM

```typescript
class ResourceSchedulingService {
  async checkMultiResourceAvailability(resources: ResourceRequest[])
  async bookMultipleResources(appointmentId, resources)
  async findAlternativeSlots(resources)
}
```

- [ ] Create `ResourceSchedulingService.ts`
- [ ] Check practitioner + test room + equipment availability
- [ ] Find conflicts
- [ ] Suggest alternative slots if conflicts exist
- [ ] Book all resources atomically

---

### Task 4.3: Automated Reminders (BullMQ)
**File**: `server/workers/appointmentReminderWorker.ts`
**Priority**: HIGH

```typescript
reminderWorker.process(async (job) => {
  const { appointmentId, reminderType } = job.data;
  
  if (reminderType === 'email') {
    await emailService.sendReminder(appointmentId);
  } else if (reminderType === 'sms') {
    await smsService.sendReminder(appointmentId);
  }
  
  await markReminderSent(appointmentId);
});
```

- [ ] Create `appointmentReminderWorker.ts`
- [ ] Schedule reminders on appointment creation
- [ ] 7 days: Email confirmation
- [ ] 48 hours: Email reminder
- [ ] 24 hours: SMS reminder
- [ ] 2 hours: SMS final reminder
- [ ] Track reminder delivery status

---

### Task 4.4: Intelligent Waitlist
**File**: `server/services/WaitlistService.ts`
**Priority**: LOW

```typescript
class WaitlistService {
  async addToWaitlist(patientId, preferences)
  async findMatches(cancelledSlot)
  async notifyMatches(matches)
  async fulfillWaitlist(waitlistId, appointmentId)
}
```

- [ ] Create `WaitlistService.ts`
- [ ] Score waitlist entries on slot cancellation
- [ ] Notify top 3 matches
- [ ] 30-minute response window
- [ ] Auto-expire notifications
- [ ] Track fulfillment rate

---

## Phase 5: Analytics (Week 5-6)

### Task 5.1: Utilization Dashboard
**File**: `client/src/pages/UtilizationDashboard.tsx`
**Priority**: MEDIUM

- [ ] Create dashboard page
- [ ] Fetch utilization data from API
- [ ] Bar chart by practitioner (recharts)
- [ ] Heatmap by day of week
- [ ] Trend comparison (week-over-week)
- [ ] Export to CSV

---

### Task 5.2: No-Show Tracking
**File**: `client/src/pages/NoShowDashboard.tsx`
**Priority**: MEDIUM

- [ ] Create dashboard page
- [ ] Show no-show count (daily/weekly/monthly)
- [ ] Trend chart
- [ ] Top reasons for no-shows
- [ ] Patient no-show history
- [ ] No-show prediction score

---

### Task 5.3: Conversion Funnel Visualization
**File**: `client/src/components/analytics/ConversionFunnel.tsx`
**Priority**: MEDIUM

- [ ] Create funnel chart component (recharts)
- [ ] Show stages: Scheduled → Completed → Prescription → Order
- [ ] Calculate drop-off percentages
- [ ] Show lost revenue estimation
- [ ] Filter by date range

---

### Task 5.4: Wait Time Monitoring
**File**: `client/src/pages/WaitTimeDashboard.tsx`
**Priority**: LOW

- [ ] Create dashboard page
- [ ] Show average wait time (real-time)
- [ ] Show longest wait today
- [ ] Show patients currently waiting
- [ ] Alert when wait exceeds threshold
- [ ] Track by appointment type

---

### Task 5.5: Recall Campaign Effectiveness
**File**: `server/services/RecallAnalyticsService.ts`
**Priority**: LOW

- [ ] Track recall campaigns sent
- [ ] Track booking rate from recalls
- [ ] Calculate revenue generated
- [ ] Compare effectiveness by campaign type
- [ ] Show ROI per campaign

---

## Testing Tasks

### Unit Tests
- [ ] AppointmentService tests
- [ ] IntegratedAppointmentService tests
- [ ] AppointmentHandoffService tests
- [ ] AppointmentAnalyticsService tests
- [ ] WebSocket event handler tests

### Integration Tests
- [ ] Appointment creation → WebSocket broadcast
- [ ] Check-in → Status update → Notification
- [ ] Exam completion → Dispense queue → Order creation
- [ ] Reminder scheduling → Email/SMS delivery

### E2E Tests (Playwright)
- [ ] ECP: View schedule → Start exam
- [ ] Dispenser: View queue → Create order
- [ ] Reception: Check-in patient
- [ ] Admin: View utilization dashboard
- [ ] Public booking flow

---

## Documentation Tasks

- [ ] API documentation (Swagger/OpenAPI)
- [ ] WebSocket events documentation
- [ ] Role-based permissions guide
- [ ] User guide for each role
- [ ] Admin analytics guide
- [ ] Deployment guide

---

## Estimated Hours by Phase

| Phase | Backend | Frontend | Testing | Total |
|-------|---------|----------|---------|-------|
| Phase 1: Backend | 60h | 0h | 12h | 72h |
| Phase 2: Frontend | 8h | 60h | 12h | 80h |
| Phase 3: Handoffs | 20h | 30h | 10h | 60h |
| Phase 4: Booking | 40h | 30h | 10h | 80h |
| Phase 5: Analytics | 30h | 40h | 10h | 80h |
| **Total** | **158h** | **160h** | **54h** | **372h** |

**Team Required**: 2 backend + 2 frontend + 1 QA
**Timeline**: 6-7 weeks (assuming 40h/week per developer)
