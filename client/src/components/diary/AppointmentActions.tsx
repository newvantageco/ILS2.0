/**
 * Appointment Action Buttons
 * 
 * Role-specific action buttons for appointments:
 * - Check In (Reception)
 * - Start Exam (ECP)
 * - View Prescription (Dispenser)
 * - Create Order (Dispenser)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'wouter';
import {
  UserCheck,
  Stethoscope,
  FileText,
  ShoppingCart,
  Loader2,
} from 'lucide-react';
import {
  useCheckIn,
  useStartExam,
  type IntegratedAppointment,
} from '@/hooks/useIntegratedAppointments';

interface CheckInButtonProps {
  appointment: IntegratedAppointment;
}

export function CheckInButton({ appointment }: CheckInButtonProps) {
  const checkIn = useCheckIn();
  
  // Don't show if already checked in or past
  if (appointment.realtimeStatus.currentStage !== 'scheduled') {
    return null;
  }
  
  return (
    <Button
      size="sm"
      onClick={() => checkIn.mutate(appointment.id)}
      disabled={checkIn.isPending}
    >
      {checkIn.isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <UserCheck className="w-4 h-4 mr-2" />
      )}
      Check In
    </Button>
  );
}

interface StartExamButtonProps {
  appointment: IntegratedAppointment;
}

export function StartExamButton({ appointment }: StartExamButtonProps) {
  const startExam = useStartExam();
  const [, navigate] = useNavigate();
  
  // Only show if checked in or if exam already exists
  const canStart = 
    appointment.realtimeStatus.currentStage === 'checked_in' ||
    (appointment.clinical?.hasActiveExam && appointment.clinical.examStatus === 'in_progress');
  
  if (!canStart) {
    return null;
  }
  
  const handleStartExam = async () => {
    // If exam already exists, navigate directly
    if (appointment.clinical?.examId) {
      navigate(`/examinations/${appointment.clinical.examId}`);
      return;
    }
    
    // Otherwise, create new exam
    const result = await startExam.mutateAsync(appointment.id);
    if (result.examId) {
      navigate(`/examinations/${result.examId}`);
    }
  };
  
  return (
    <Button
      onClick={handleStartExam}
      disabled={startExam.isPending}
    >
      {startExam.isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Stethoscope className="w-4 h-4 mr-2" />
      )}
      {appointment.clinical?.hasActiveExam ? 'Continue Exam' : 'Start Exam'}
    </Button>
  );
}

interface ViewPrescriptionButtonProps {
  appointment: IntegratedAppointment;
}

export function ViewPrescriptionButton({ appointment }: ViewPrescriptionButtonProps) {
  const [, navigate] = useNavigate();
  
  // Only show if prescription exists
  if (!appointment.clinical?.prescriptionId) {
    return null;
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(`/prescriptions/${appointment.clinical!.prescriptionId}`)}
    >
      <FileText className="w-4 h-4 mr-2" />
      View Prescription
    </Button>
  );
}

interface CreateOrderButtonProps {
  appointment: IntegratedAppointment;
}

export function CreateOrderButton({ appointment }: CreateOrderButtonProps) {
  const [, navigate] = useNavigate();
  
  // Only show if prescription is signed but no order exists
  const canCreateOrder = 
    appointment.clinical?.prescriptionSigned &&
    !appointment.dispensing?.hasOrder;
  
  if (!canCreateOrder) {
    return null;
  }
  
  // If order exists, show view button
  if (appointment.dispensing?.orderId) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/orders/${appointment.dispensing!.orderId}`)}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        View Order
      </Button>
    );
  }
  
  return (
    <Button
      onClick={() => {
        // Navigate to POS with pre-filled patient and prescription
        navigate(`/pos?patientId=${appointment.patientId}&prescriptionId=${appointment.clinical!.prescriptionId}&appointmentId=${appointment.id}`);
      }}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      Create Order
    </Button>
  );
}

/**
 * Combined action buttons based on appointment stage
 */
interface AppointmentActionsProps {
  appointment: IntegratedAppointment;
  userRole: string;
}

export function AppointmentActions({ appointment, userRole }: AppointmentActionsProps) {
  const stage = appointment.realtimeStatus.currentStage;
  
  return (
    <div className="flex items-center gap-2">
      {/* Reception: Check-in button */}
      {(userRole === 'admin' || userRole === 'company_admin') && (
        <CheckInButton appointment={appointment} />
      )}
      
      {/* ECP: Start exam button */}
      {(userRole === 'ecp' || userRole === 'company_admin') && stage === 'checked_in' && (
        <StartExamButton appointment={appointment} />
      )}
      
      {/* Dispenser: View prescription and create order */}
      {(userRole === 'dispenser' || userRole === 'company_admin') && stage === 'ready_for_dispense' && (
        <>
          <ViewPrescriptionButton appointment={appointment} />
          <CreateOrderButton appointment={appointment} />
        </>
      )}
      
      {/* Show continue exam if exam is in progress */}
      {(userRole === 'ecp' || userRole === 'company_admin') && stage === 'in_exam' && (
        <StartExamButton appointment={appointment} />
      )}
    </div>
  );
}
