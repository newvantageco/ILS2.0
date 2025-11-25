/**
 * Smart Appointment Card
 * 
 * Action-oriented appointment card that exposes the most common next step
 * directly on the card based on realtimeStatus.
 * 
 * Features:
 * - One-click actions based on current stage
 * - Hover summaries with patient details
 * - Visual running late indicators
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { 
  useCheckIn, 
  useStartExam, 
  type IntegratedAppointment 
} from "@/hooks/useIntegratedAppointments";
import { useLocation } from "wouter";
import { 
  UserCheck, 
  Stethoscope, 
  FileText, 
  ShoppingCart, 
  Clock, 
  Phone, 
  Mail, 
  User,
  Loader2,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentStatusBadge, StatusDot } from "./AppointmentStatusBadge";

interface SmartAppointmentCardProps {
  appointment: IntegratedAppointment;
  userRole: string;
  compact?: boolean;
  showHoverDetails?: boolean;
  className?: string;
}

export function SmartAppointmentCard({ 
  appointment, 
  userRole, 
  compact = false,
  showHoverDetails = true,
  className 
}: SmartAppointmentCardProps) {
  const checkIn = useCheckIn();
  const startExam = useStartExam();
  const [, setLocation] = useLocation();

  const stage = appointment.realtimeStatus.currentStage;
  const isRunningLate = appointment.realtimeStatus.isRunningLate;

  // Determine the primary action based on stage
  const getPrimaryAction = () => {
    switch (stage) {
      case 'scheduled':
        return {
          label: 'Check In',
          icon: UserCheck,
          action: () => checkIn.mutate(appointment.id),
          isPending: checkIn.isPending,
          variant: 'default' as const,
        };
      case 'checked_in':
        return {
          label: 'Start Exam',
          icon: Stethoscope,
          action: async () => {
            if (appointment.clinical?.examId) {
              setLocation(`/examinations/${appointment.clinical.examId}`);
            } else {
              const result = await startExam.mutateAsync(appointment.id);
              if (result.examId) {
                setLocation(`/examinations/${result.examId}`);
              }
            }
          },
          isPending: startExam.isPending,
          variant: 'default' as const,
        };
      case 'in_exam':
        return {
          label: 'Continue Exam',
          icon: Stethoscope,
          action: () => setLocation(`/examinations/${appointment.clinical?.examId}`),
          isPending: false,
          variant: 'secondary' as const,
        };
      case 'ready_for_dispense':
        return {
          label: appointment.dispensing?.hasOrder ? 'View Order' : 'Create Order',
          icon: ShoppingCart,
          action: () => {
            if (appointment.dispensing?.orderId) {
              setLocation(`/orders/${appointment.dispensing.orderId}`);
            } else {
              setLocation(`/pos?patientId=${appointment.patientId}&prescriptionId=${appointment.clinical?.prescriptionId}&appointmentId=${appointment.id}`);
            }
          },
          isPending: false,
          variant: 'default' as const,
        };
      case 'dispensing':
        return {
          label: 'View Order',
          icon: ShoppingCart,
          action: () => setLocation(`/orders/${appointment.dispensing?.orderId}`),
          isPending: false,
          variant: 'secondary' as const,
        };
      case 'completed':
        return {
          label: 'View Details',
          icon: FileText,
          action: () => setLocation(`/ecp/patients/${appointment.patientId}`),
          isPending: false,
          variant: 'outline' as const,
        };
      default:
        return null;
    }
  };

  const primaryAction = getPrimaryAction();

  // Check if user can perform the action based on role
  const canPerformAction = () => {
    if (userRole === 'company_admin' || userRole === 'admin') return true;
    if (stage === 'scheduled' && userRole !== 'ecp') return true; // Reception check-in
    if (['checked_in', 'in_exam'].includes(stage) && userRole === 'ecp') return true;
    if (['ready_for_dispense', 'dispensing'].includes(stage) && ['dispenser', 'ecp'].includes(userRole)) return true;
    return true; // Default allow view actions
  };

  const cardContent = (
    <Card 
      className={cn(
        "transition-all hover:shadow-md cursor-pointer group",
        isRunningLate && "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
        stage === 'checked_in' && !isRunningLate && "border-l-4 border-l-yellow-500",
        stage === 'in_exam' && "border-l-4 border-l-blue-500",
        stage === 'ready_for_dispense' && "border-l-4 border-l-purple-500",
        className
      )}
    >
      <CardHeader className={cn("pb-2", compact && "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className={cn("border-2 border-white shadow-sm", compact ? "h-8 w-8" : "h-10 w-10")}>
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {appointment.patient.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h4 className={cn("font-semibold truncate", compact ? "text-sm" : "text-base")}>
                {appointment.patient.name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {format(new Date(appointment.startTime), 'h:mm a')} · {appointment.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isRunningLate && (
              <Badge 
                variant="destructive" 
                className="text-[10px] px-1.5 py-0 animate-pulse flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                Late
              </Badge>
            )}
            <StatusDot stage={stage} isRunningLate={isRunningLate} className="w-2.5 h-2.5" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={cn("pt-0", compact && "p-3 pt-0")}>
        <div className="flex items-center justify-between gap-2">
          {/* Status info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {stage === 'checked_in' && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Waiting {formatDistanceToNow(new Date(appointment.realtimeStatus.lastUpdate))}
              </span>
            )}
            {stage === 'in_exam' && appointment.practitioner && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                With {appointment.practitioner.name}
              </span>
            )}
            {appointment.realtimeStatus.nextAction && !compact && (
              <Badge variant="outline" className="text-[10px]">
                Next: {appointment.realtimeStatus.nextAction}
              </Badge>
            )}
          </div>

          {/* Primary Action Button */}
          {primaryAction && canPerformAction() && (
            <Button
              size="sm"
              variant={primaryAction.variant}
              onClick={(e) => {
                e.stopPropagation();
                primaryAction.action();
              }}
              disabled={primaryAction.isPending}
              className={cn("shrink-0 transition-all", compact && "h-7 text-xs px-2")}
            >
              {primaryAction.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <primaryAction.icon className="w-3 h-3 mr-1" />
              )}
              {primaryAction.label}
              <ChevronRight className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Button>
          )}
        </div>

        {/* Quick prescription/order indicators */}
        {!compact && (
          <div className="flex items-center gap-2 mt-2">
            {appointment.clinical?.hasPrescription && (
              <Badge 
                variant="outline" 
                className="text-[10px] cursor-pointer hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  if (appointment.clinical?.prescriptionId) {
                    setLocation(`/prescriptions/${appointment.clinical.prescriptionId}`);
                  }
                }}
              >
                <FileText className="w-3 h-3 mr-1" />
                Rx {appointment.clinical.prescriptionSigned ? '✓' : ''}
              </Badge>
            )}
            {appointment.dispensing?.hasOrder && (
              <Badge 
                variant="outline" 
                className="text-[10px] cursor-pointer hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  if (appointment.dispensing?.orderId) {
                    setLocation(`/orders/${appointment.dispensing.orderId}`);
                  }
                }}
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                Order
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!showHoverDetails) {
    return cardContent;
  }

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>
        {cardContent}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="right" align="start">
        <PatientDetailsSummary appointment={appointment} />
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * Patient details shown in hover card
 */
function PatientDetailsSummary({ appointment }: { appointment: IntegratedAppointment }) {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-4">
      {/* Patient Header */}
      <div className="flex items-center gap-3">
        <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
            {appointment.patient.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-bold text-lg">{appointment.patient.name}</h4>
          <p className="text-sm text-muted-foreground">{appointment.title}</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>
            {format(new Date(appointment.startTime), 'h:mm a')} - {format(new Date(appointment.endTime), 'h:mm a')}
          </span>
        </div>
        
        {appointment.patient.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <a 
              href={`tel:${appointment.patient.phone}`} 
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {appointment.patient.phone}
            </a>
          </div>
        )}
        
        {appointment.patient.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="truncate text-xs">{appointment.patient.email}</span>
          </div>
        )}

        {appointment.patient.lastVisit && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>Last visit: {format(new Date(appointment.patient.lastVisit), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      {/* Clinical & Dispensing Status */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Clinical</p>
          <div className="space-y-1">
            {appointment.clinical?.hasActiveExam && (
              <Badge variant="secondary" className="text-xs w-full justify-center">
                Active Exam
              </Badge>
            )}
            {appointment.clinical?.hasPrescription && (
              <Badge 
                variant={appointment.clinical.prescriptionSigned ? "default" : "outline"} 
                className="text-xs w-full justify-center"
              >
                {appointment.clinical.prescriptionSigned ? 'Rx Signed ✓' : 'Rx Pending'}
              </Badge>
            )}
            {!appointment.clinical?.hasActiveExam && !appointment.clinical?.hasPrescription && (
              <span className="text-xs text-muted-foreground">No exam yet</span>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Dispensing</p>
          <div className="space-y-1">
            {appointment.dispensing?.hasOrder ? (
              <Badge 
                variant={appointment.dispensing.readyForCollection ? "default" : "secondary"} 
                className="text-xs w-full justify-center"
              >
                {appointment.dispensing.readyForCollection ? 'Ready ✓' : appointment.dispensing.orderStatus}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">No order</span>
            )}
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="pt-2 border-t">
        <AppointmentStatusBadge 
          stage={appointment.realtimeStatus.currentStage}
          isRunningLate={appointment.realtimeStatus.isRunningLate}
          className="w-full justify-center"
        />
      </div>

      {/* Quick Actions */}
      <div className="pt-2 border-t flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={() => setLocation(`/ecp/patients/${appointment.patientId}`)}
        >
          <User className="w-3 h-3 mr-1" />
          Patient Record
        </Button>
        {appointment.clinical?.prescriptionId && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={() => setLocation(`/prescriptions/${appointment.clinical!.prescriptionId}`)}
          >
            <FileText className="w-3 h-3 mr-1" />
            View Rx
          </Button>
        )}
      </div>
    </div>
  );
}
