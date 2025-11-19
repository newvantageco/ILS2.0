/**
 * React Query Hooks for Integrated Appointments
 * 
 * Provides hooks for fetching enriched appointment data with:
 * - Patient details
 * - Practitioner information
 * - Clinical status (exam, prescription)
 * - Dispensing status (orders)
 * - Real-time workflow stage
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Types
export interface IntegratedAppointment {
  id: string;
  companyId: string;
  patientId: string;
  practitionerId: string | null;
  title: string;
  description: string | null;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string | null;
  notes: string | null;
  
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
    lastVisit?: string;
  };
  
  practitioner: {
    id: string;
    name: string;
    role: string;
    gocNumber?: string;
  } | null;
  
  clinical?: {
    hasActiveExam: boolean;
    examId?: string;
    examStatus?: string;
    hasPrescription: boolean;
    prescriptionId?: string;
    prescriptionSigned: boolean;
    signedAt?: string;
  };
  
  dispensing?: {
    hasOrder: boolean;
    orderId?: string;
    orderStatus?: string;
    orderTotal?: number;
    readyForCollection: boolean;
  };
  
  realtimeStatus: {
    currentStage: 'scheduled' | 'checked_in' | 'in_pretest' | 'in_exam' | 'ready_for_dispense' | 'dispensing' | 'completed';
    lastUpdate: string;
    nextAction?: string;
    isRunningLate: boolean;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface IntegratedAppointmentsFilters {
  startDate?: Date;
  endDate?: Date;
  practitionerId?: string;
  patientId?: string;
  status?: string;
  stage?: string;
}

/**
 * Fetch integrated appointments with enriched data
 */
export function useIntegratedAppointments(filters?: IntegratedAppointmentsFilters) {
  return useQuery<IntegratedAppointment[]>({
    queryKey: ['/api/appointments/integrated', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate.toISOString());
      }
      if (filters?.practitionerId) {
        params.append('practitionerId', filters.practitionerId);
      }
      if (filters?.patientId) {
        params.append('patientId', filters.patientId);
      }
      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.stage) {
        params.append('stage', filters.stage);
      }
      
      const response = await fetch(`/api/appointments/integrated?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch integrated appointments');
      }
      
      const data = await response.json();
      return data.appointments || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for near real-time
  });
}

/**
 * Fetch single integrated appointment
 */
export function useIntegratedAppointment(id: string | undefined) {
  return useQuery<IntegratedAppointment>({
    queryKey: ['/api/appointments/integrated', id],
    queryFn: async () => {
      if (!id) throw new Error('Appointment ID is required');
      
      const response = await fetch(`/api/appointments/integrated/${id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointment');
      }
      
      const data = await response.json();
      return data.appointment;
    },
    enabled: !!id,
  });
}

/**
 * Fetch appointments by workflow stage (for queue views)
 */
export function useAppointmentQueue(stage: 'checked_in' | 'in_exam' | 'ready_for_dispense') {
  return useQuery<IntegratedAppointment[]>({
    queryKey: ['/api/appointments/queue', stage],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/queue/${stage}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${stage} queue`);
      }
      
      const data = await response.json();
      return data.appointments || [];
    },
    refetchInterval: 10000, // Refetch every 10 seconds for queue
  });
}

/**
 * Check in a patient
 */
export function useCheckIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(`/api/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check in patient');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all appointment queries
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: 'Patient Checked In',
        description: `${data.appointment?.patient?.name} has been checked in successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Check-in Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Start an examination
 */
export function useStartExam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(`/api/appointments/${appointmentId}/start-exam`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start exam');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: 'Exam Started',
        description: 'Opening examination form...',
      });
      
      // Navigate to exam (will be handled by component)
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Start Exam',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Complete an examination
 */
export function useCompleteExam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({
      appointmentId,
      examId,
      prescriptionId,
    }: {
      appointmentId: string;
      examId: string;
      prescriptionId?: string;
    }) => {
      const response = await fetch(`/api/appointments/${appointmentId}/complete-exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ examId, prescriptionId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete exam');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: 'Exam Completed',
        description: 'Patient is ready for dispensing',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Complete Exam',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update appointment status
 */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({
      appointmentId,
      status,
      notes,
    }: {
      appointmentId: string;
      status: string;
      notes?: string;
    }) => {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: 'Status Updated',
        description: 'Appointment status has been updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for today's appointments
 */
export function useTodayAppointments(practitionerId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return useIntegratedAppointments({
    startDate: today,
    endDate: tomorrow,
    practitionerId,
  });
}

/**
 * Hook for appointments this week
 */
export function useWeekAppointments(practitionerId?: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  
  return useIntegratedAppointments({
    startDate: startOfWeek,
    endDate: endOfWeek,
    practitionerId,
  });
}
