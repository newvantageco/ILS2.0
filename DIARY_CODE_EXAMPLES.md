# 💻 Diary System Integration - Code Examples

## 1. Backend: IntegratedAppointmentService

```typescript
// server/services/IntegratedAppointmentService.ts
import { db } from '../db';
import { eq, and, gte, lte } from 'drizzle-orm';
import * as schema from '@shared/schema';

interface IntegratedAppointment {
  // Core appointment
  id: string;
  patientId: string;
  practitionerId: string;
  startTime: Date;
  endTime: Date;
  type: string;
  status: string;
  
  // Enriched data
  patient: {
    name: string;
    email: string;
    phone: string;
  };
  practitioner: {
    name: string;
    role: string;
  };
  clinical?: {
    hasActiveExam: boolean;
    examId?: string;
    hasPrescription: boolean;
    prescriptionSigned: boolean;
  };
  dispensing?: {
    hasOrder: boolean;
    orderId?: string;
    orderStatus?: string;
  };
  realtimeStatus: {
    currentStage: string;
    lastUpdate: Date;
    nextAction?: string;
  };
}

class IntegratedAppointmentService {
  /**
   * Get appointment with all enriched data
   */
  async getIntegratedAppointment(id: string): Promise<IntegratedAppointment | null> {
    // Fetch appointment with patient and practitioner
    const appointment = await db
      .select({
        // Appointment fields
        id: schema.appointments.id,
        patientId: schema.appointments.patientId,
        practitionerId: schema.appointments.practitionerId,
        startTime: schema.appointments.startTime,
        endTime: schema.appointments.endTime,
        type: schema.appointments.type,
        status: schema.appointments.status,
        
        // Patient fields
        patientName: sql<string>`${schema.users.firstName} || ' ' || ${schema.users.lastName}`,
        patientEmail: schema.users.email,
        patientPhone: schema.users.contactPhone,
        
        // Practitioner fields  
        practitionerName: sql<string>`${schema.practitioner.firstName} || ' ' || ${schema.practitioner.lastName}`,
        practitionerRole: schema.practitioner.role,
      })
      .from(schema.appointments)
      .leftJoin(schema.users, eq(schema.appointments.patientId, schema.users.id))
      .leftJoin(
        schema.users.as('practitioner'),
        eq(schema.appointments.practitionerId, schema.users.id)
      )
      .where(eq(schema.appointments.id, id))
      .limit(1);
    
    if (!appointment[0]) return null;
    
    const apt = appointment[0];
    
    // Check clinical status
    const [exam] = await db
      .select()
      .from(schema.examinations)
      .where(eq(schema.examinations.appointmentId, id))
      .limit(1);
    
    const [prescription] = await db
      .select()
      .from(schema.prescriptions)
      .where(eq(schema.prescriptions.appointmentId, id))
      .limit(1);
    
    // Check dispensing status
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.appointmentId, id))
      .limit(1);
    
    // Calculate real-time status
    const realtimeStatus = this.calculateRealtimeStatus(apt, exam, prescription, order);
    
    return {
      id: apt.id,
      patientId: apt.patientId!,
      practitionerId: apt.practitionerId!,
      startTime: apt.startTime,
      endTime: apt.endTime,
      type: apt.type,
      status: apt.status,
      
      patient: {
        name: apt.patientName,
        email: apt.patientEmail!,
        phone: apt.patientPhone || ''
      },
      
      practitioner: {
        name: apt.practitionerName,
        role: apt.practitionerRole
      },
      
      clinical: exam ? {
        hasActiveExam: true,
        examId: exam.id,
        hasPrescription: !!prescription,
        prescriptionSigned: prescription?.verificationStatus === 'verified'
      } : undefined,
      
      dispensing: order ? {
        hasOrder: true,
        orderId: order.id,
        orderStatus: order.status
      } : undefined,
      
      realtimeStatus
    };
  }
  
  /**
   * Calculate current stage based on data
   */
  private calculateRealtimeStatus(apt, exam, prescription, order) {
    // Logic to determine current stage
    if (order) {
      return {
        currentStage: 'completed',
        lastUpdate: order.updatedAt,
        nextAction: null
      };
    }
    
    if (prescription && prescription.verificationStatus === 'verified') {
      return {
        currentStage: 'ready_for_dispense',
        lastUpdate: prescription.updatedAt,
        nextAction: 'Create Order'
      };
    }
    
    if (exam && exam.status === 'in_progress') {
      return {
        currentStage: 'in_exam',
        lastUpdate: exam.updatedAt,
        nextAction: 'Complete Exam'
      };
    }
    
    if (apt.status === 'confirmed' && new Date() >= apt.startTime) {
      return {
        currentStage: 'checked_in',
        lastUpdate: new Date(),
        nextAction: 'Start Exam'
      };
    }
    
    return {
      currentStage: 'scheduled',
      lastUpdate: apt.updatedAt,
      nextAction: 'Check In'
    };
  }
  
  /**
   * Get all appointments with integrated data
   */
  async getIntegratedAppointments(params: {
    companyId: string;
    startDate?: Date;
    endDate?: Date;
    practitionerId?: string;
  }): Promise<IntegratedAppointment[]> {
    // Similar to above but for multiple appointments
    // Use Promise.all() to fetch clinical/dispensing data in parallel
    const appointments = await this.fetchAppointments(params);
    
    const integrated = await Promise.all(
      appointments.map(apt => this.getIntegratedAppointment(apt.id))
    );
    
    return integrated.filter(a => a !== null) as IntegratedAppointment[];
  }
}

export const integratedAppointmentService = new IntegratedAppointmentService();
```

---

## 2. Backend: Digital Handoff Service

```typescript
// server/services/AppointmentHandoffService.ts
import { getWebSocketService } from './WebSocketService';
import { notificationService } from './NotificationService';
import { appointmentService } from './AppointmentService';
import { logger } from '../utils/logger';

class AppointmentHandoffService {
  private webSocketService = getWebSocketService();
  
  /**
   * Handle patient check-in
   */
  async handleCheckIn(appointmentId: string, checkedInBy: string) {
    // Update appointment status
    const appointment = await appointmentService.updateAppointment(appointmentId, {
      status: 'confirmed',
      notes: `Checked in by ${checkedInBy} at ${new Date().toISOString()}`
    });
    
    // Broadcast WebSocket event
    this.webSocketService.broadcastToCompany(appointment.companyId!, {
      event: 'appointment:checked_in',
      appointmentId,
      patientName: appointment.patientId,
      timestamp: new Date()
    });
    
    // Notify practitioner
    if (appointment.practitionerId) {
      await notificationService.notify({
        userId: appointment.practitionerId,
        type: 'patient_checked_in',
        title: 'Patient Checked In',
        message: `Patient ready for appointment`,
        actionUrl: `/diary?appointment=${appointmentId}`
      });
    }
    
    logger.info({ appointmentId }, 'Patient checked in');
  }
  
  /**
   * Handle exam start
   */
  async handleExamStart(appointmentId: string, examId: string) {
    // Update appointment
    await appointmentService.updateAppointment(appointmentId, {
      status: 'in_progress',
      notes: `Exam started: ${examId}`
    });
    
    // Broadcast status change
    this.webSocketService.broadcastToCompany(companyId, {
      event: 'appointment:exam_started',
      appointmentId,
      examId,
      timestamp: new Date()
    });
    
    logger.info({ appointmentId, examId }, 'Exam started');
  }
  
  /**
   * Handle exam completion → handoff to dispenser
   */
  async handleExamComplete(
    appointmentId: string,
    examId: string,
    prescriptionId: string,
    practitionerId: string,
    companyId: string
  ) {
    // Update appointment status
    await appointmentService.updateAppointment(appointmentId, {
      status: 'completed',
      notes: `Exam completed, ready for dispensing`
    });
    
    // Broadcast ready for dispense
    this.webSocketService.broadcastToCompany(companyId, {
      event: 'appointment:ready_for_dispense',
      appointmentId,
      examId,
      prescriptionId,
      timestamp: new Date()
    });
    
    // Find dispenser on duty
    const dispenser = await this.findAvailableDispenser(companyId);
    
    if (dispenser) {
      // Notify dispenser
      await notificationService.notify({
        userId: dispenser.id,
        type: 'appointment_ready',
        title: 'Patient Ready for Dispensing',
        message: `Exam completed, prescription signed`,
        actionUrl: `/diary?appointment=${appointmentId}`,
        priority: 'high'
      });
    }
    
    // Send notification to patient (optional)
    await notificationService.notifyPatient(appointment.patientId, {
      type: 'exam_complete',
      message: 'Your eye exam is complete. Please visit the dispensing area.'
    });
    
    logger.info({
      appointmentId,
      examId,
      prescriptionId
    }, 'Exam completed, ready for dispense');
  }
  
  /**
   * Handle order creation
   */
  async handleOrderCreated(appointmentId: string, orderId: string) {
    // Update appointment
    await appointmentService.updateAppointment(appointmentId, {
      status: 'completed',
      notes: `Order created: ${orderId}`
    });
    
    // Broadcast completion
    this.webSocketService.broadcastToCompany(companyId, {
      event: 'appointment:order_created',
      appointmentId,
      orderId,
      timestamp: new Date()
    });
    
    logger.info({ appointmentId, orderId }, 'Order created');
  }
  
  /**
   * Find available dispenser
   */
  private async findAvailableDispenser(companyId: string) {
    // Find users with dispenser role who are currently on duty
    const dispensers = await db
      .select()
      .from(schema.users)
      .where(and(
        eq(schema.users.companyId, companyId),
        eq(schema.users.role, 'dispenser'),
        eq(schema.users.isActive, true)
      ));
    
    // Return first available (could be improved with shift logic)
    return dispensers[0] || null;
  }
}

export const appointmentHandoffService = new AppointmentHandoffService();
```

---

## 3. Backend: Appointment Routes with Handoffs

```typescript
// server/routes/appointments.ts (additions)

/**
 * GET /api/appointments/integrated
 * Get appointments with enriched data
 */
router.get('/integrated', requireAuth, requireCompanyAccess, async (req, res) => {
  try {
    const { startDate, endDate, practitionerId } = req.query;
    const companyId = req.user!.companyId!;
    
    const appointments = await integratedAppointmentService.getIntegratedAppointments({
      companyId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      practitionerId: practitionerId as string | undefined
    });
    
    res.json(appointments);
  } catch (error) {
    logger.error({ error }, 'Failed to get integrated appointments');
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * POST /api/appointments/:id/check-in
 * Check in a patient
 */
router.post('/:id/check-in', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const checkedInBy = req.user!.id;
    
    await appointmentHandoffService.handleCheckIn(id, checkedInBy);
    
    // Get updated appointment
    const appointment = await integratedAppointmentService.getIntegratedAppointment(id);
    
    res.json({ success: true, appointment });
  } catch (error) {
    logger.error({ error, appointmentId: req.params.id }, 'Failed to check in');
    res.status(500).json({ error: 'Failed to check in patient' });
  }
});

/**
 * POST /api/appointments/:id/start-exam
 * Start exam for appointment
 */
router.post('/:id/start-exam', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const practitionerId = req.user!.id;
    
    // Get appointment
    const appointment = await appointmentService.getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Create examination record
    const examination = await examinationService.createExamination({
      appointmentId: id,
      patientId: appointment.patientId!,
      practitionerId,
      companyId: appointment.companyId!,
      status: 'in_progress'
    });
    
    // Handle handoff
    await appointmentHandoffService.handleExamStart(id, examination.id);
    
    res.json({
      examId: examination.id,
      examUrl: `/examinations/${examination.id}`
    });
  } catch (error) {
    logger.error({ error, appointmentId: req.params.id }, 'Failed to start exam');
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

/**
 * PATCH /api/appointments/:id/status
 * Update appointment status (triggers WebSocket)
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, stage, notes } = req.body;
    
    const appointment = await appointmentService.updateAppointment(id, {
      status,
      notes
    });
    
    // Broadcast status change
    webSocketService.broadcastToCompany(appointment.companyId!, {
      event: 'appointment:status_changed',
      appointmentId: id,
      status,
      stage,
      timestamp: new Date()
    });
    
    // Get integrated data
    const integrated = await integratedAppointmentService.getIntegratedAppointment(id);
    
    res.json(integrated);
  } catch (error) {
    logger.error({ error, appointmentId: req.params.id }, 'Failed to update status');
    res.status(500).json({ error: 'Failed to update status' });
  }
});
```

---

## 4. Frontend: React Query Hooks

```typescript
// client/src/hooks/useIntegratedAppointments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function useIntegratedAppointments(params?: {
  startDate?: Date;
  endDate?: Date;
  practitionerId?: string;
}) {
  return useQuery({
    queryKey: ['appointments', 'integrated', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/appointments/integrated', {
        params
      });
      return response.data;
    }
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiClient.post(`/api/appointments/${appointmentId}/check-in`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate appointments to refetch
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
}

export function useStartExam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiClient.post(`/api/appointments/${appointmentId}/start-exam`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ appointmentId, status, stage, notes }: {
      appointmentId: string;
      status: string;
      stage?: string;
      notes?: string;
    }) => {
      const response = await apiClient.patch(
        `/api/appointments/${appointmentId}/status`,
        { status, stage, notes }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
}
```

---

## 5. Frontend: WebSocket Hook

```typescript
// client/src/hooks/useAppointmentWebSocket.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tantml:parameter>
<parameter name="CodeContent"># 💻 Diary System Integration - Code Examples

## 1. Backend: IntegratedAppointmentService

```typescript
// server/services/IntegratedAppointmentService.ts
import { db } from '../db';
import { eq, and, gte, lte } from 'drizzle-orm';
import * as schema from '@shared/schema';

interface IntegratedAppointment {
  // Core appointment
  id: string;
  patientId: string;
  practitionerId: string;
  startTime: Date;
  endTime: Date;
  type: string;
  status: string;
  
  // Enriched data
  patient: {
    name: string;
    email: string;
    phone: string;
  };
  practitioner: {
    name: string;
    role: string;
  };
  clinical?: {
    hasActiveExam: boolean;
    examId?: string;
    hasPrescription: boolean;
    prescriptionSigned: boolean;
  };
  dispensing?: {
    hasOrder: boolean;
    orderId?: string;
    orderStatus?: string;
  };
  realtimeStatus: {
    currentStage: string;
    lastUpdate: Date;
    nextAction?: string;
  };
}

class IntegratedAppointmentService {
  /**
   * Get appointment with all enriched data
   */
  async getIntegratedAppointment(id: string): Promise<IntegratedAppointment | null> {
    // Fetch appointment with patient and practitioner
    const appointment = await db
      .select({
        // Appointment fields
        id: schema.appointments.id,
        patientId: schema.appointments.patientId,
        practitionerId: schema.appointments.practitionerId,
        startTime: schema.appointments.startTime,
        endTime: schema.appointments.endTime,
        type: schema.appointments.type,
        status: schema.appointments.status,
        
        // Patient fields
        patientName: sql<string>`${schema.users.firstName} || ' ' || ${schema.users.lastName}`,
        patientEmail: schema.users.email,
        patientPhone: schema.users.contactPhone,
        
        // Practitioner fields  
        practitionerName: sql<string>`${schema.practitioner.firstName} || ' ' || ${schema.practitioner.lastName}`,
        practitionerRole: schema.practitioner.role,
      })
      .from(schema.appointments)
      .leftJoin(schema.users, eq(schema.appointments.patientId, schema.users.id))
      .leftJoin(
        schema.users.as('practitioner'),
        eq(schema.appointments.practitionerId, schema.users.id)
      )
      .where(eq(schema.appointments.id, id))
      .limit(1);
    
    if (!appointment[0]) return null;
    
    const apt = appointment[0];
    
    // Check clinical status
    const [exam] = await db
      .select()
      .from(schema.examinations)
      .where(eq(schema.examinations.appointmentId, id))
      .limit(1);
    
    const [prescription] = await db
      .select()
      .from(schema.prescriptions)
      .where(eq(schema.prescriptions.appointmentId, id))
      .limit(1);
    
    // Check dispensing status
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.appointmentId, id))
      .limit(1);
    
    // Calculate real-time status
    const realtimeStatus = this.calculateRealtimeStatus(apt, exam, prescription, order);
    
    return {
      id: apt.id,
      patientId: apt.patientId!,
      practitionerId: apt.practitionerId!,
      startTime: apt.startTime,
      endTime: apt.endTime,
      type: apt.type,
      status: apt.status,
      
      patient: {
        name: apt.patientName,
        email: apt.patientEmail!,
        phone: apt.patientPhone || ''
      },
      
      practitioner: {
        name: apt.practitionerName,
        role: apt.practitionerRole
      },
      
      clinical: exam ? {
        hasActiveExam: true,
        examId: exam.id,
        hasPrescription: !!prescription,
        prescriptionSigned: prescription?.verificationStatus === 'verified'
      } : undefined,
      
      dispensing: order ? {
        hasOrder: true,
        orderId: order.id,
        orderStatus: order.status
      } : undefined,
      
      realtimeStatus
    };
  }
  
  /**
   * Calculate current stage based on data
   */
  private calculateRealtimeStatus(apt, exam, prescription, order) {
    // Logic to determine current stage
    if (order) {
      return {
        currentStage: 'completed',
        lastUpdate: order.updatedAt,
        nextAction: null
      };
    }
    
    if (prescription && prescription.verificationStatus === 'verified') {
      return {
        currentStage: 'ready_for_dispense',
        lastUpdate: prescription.updatedAt,
        nextAction: 'Create Order'
      };
    }
    
    if (exam && exam.status === 'in_progress') {
      return {
        currentStage: 'in_exam',
        lastUpdate: exam.updatedAt,
        nextAction: 'Complete Exam'
      };
    }
    
    if (apt.status === 'confirmed' && new Date() >= apt.startTime) {
      return {
        currentStage: 'checked_in',
        lastUpdate: new Date(),
        nextAction: 'Start Exam'
      };
    }
    
    return {
      currentStage: 'scheduled',
      lastUpdate: apt.updatedAt,
      nextAction: 'Check In'
    };
  }
}

export const integratedAppointmentService = new IntegratedAppointmentService();
```

See full implementation plan in `DIARY_SYSTEM_INTEGRATION_PLAN.md` and task breakdown in `DIARY_IMPLEMENTATION_TASKS.md`.
