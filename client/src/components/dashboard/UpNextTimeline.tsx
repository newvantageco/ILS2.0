/**
 * Up Next Timeline Component
 * 
 * Horizontal timeline showing upcoming appointments for the next 3 hours.
 * Provides quick overview of immediate schedule without switching to full diary.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useTodayAppointments, type IntegratedAppointment } from "@/hooks/useIntegratedAppointments";
import { useLocation } from "wouter";
import { Calendar, Clock, ArrowRight, User, Phone, Mail, Loader2 } from "lucide-react";
import { format, addHours, isAfter, isBefore, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentStatusBadge } from "@/components/diary/AppointmentStatusBadge";

interface UpNextTimelineProps {
  className?: string;
  practitionerId?: string;
  hoursAhead?: number;
}

export function UpNextTimeline({ className, practitionerId, hoursAhead = 3 }: UpNextTimelineProps) {
  const { data: appointments = [], isLoading } = useTodayAppointments(practitionerId);
  const [, setLocation] = useLocation();

  const now = new Date();
  const cutoffTime = addHours(now, hoursAhead);

  // Filter appointments that are upcoming within the next X hours
  const upcomingAppointments = appointments
    .filter((apt) => {
      const startTime = new Date(apt.startTime);
      return isAfter(startTime, now) && isBefore(startTime, cutoffTime);
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

  // Current appointment (if any)
  const currentAppointment = appointments.find((apt) => {
    const startTime = new Date(apt.startTime);
    const endTime = new Date(apt.endTime);
    return isBefore(startTime, now) && isAfter(endTime, now);
  });

  const getTimeUntil = (apt: IntegratedAppointment): string => {
    const startTime = new Date(apt.startTime);
    const minutes = differenceInMinutes(startTime, now);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getTimelinePosition = (apt: IntegratedAppointment): number => {
    const startTime = new Date(apt.startTime);
    const minutes = differenceInMinutes(startTime, now);
    const totalMinutes = hoursAhead * 60;
    return Math.min(100, (minutes / totalMinutes) * 100);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            Up Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            Up Next
            <Badge variant="outline" className="ml-2 font-normal">
              Next {hoursAhead} hours
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/ecp/diary')}
            className="text-xs"
          >
            Full Schedule
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current appointment indicator */}
        {currentAppointment && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-medium text-primary">NOW</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentAppointment.patient.name}</p>
                <p className="text-xs text-muted-foreground">{currentAppointment.title}</p>
              </div>
              <AppointmentStatusBadge 
                stage={currentAppointment.realtimeStatus.currentStage}
                isRunningLate={currentAppointment.realtimeStatus.isRunningLate}
              />
            </div>
          </div>
        )}

        {/* Timeline */}
        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No upcoming appointments</p>
            <p className="text-xs">in the next {hoursAhead} hours</p>
          </div>
        ) : (
          <>
            {/* Visual Timeline Bar */}
            <div className="relative mb-6">
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary/50 to-primary/20 rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Time markers */}
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>Now</span>
                <span>+1h</span>
                <span>+2h</span>
                <span>+{hoursAhead}h</span>
              </div>

              {/* Appointment markers on timeline */}
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="absolute -top-1 transform -translate-x-1/2"
                  style={{ left: `${getTimelinePosition(apt)}%` }}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 border-white shadow-sm cursor-pointer transition-transform hover:scale-125",
                    apt.realtimeStatus.isRunningLate ? "bg-red-500" : "bg-primary"
                  )} />
                </div>
              ))}
            </div>

            {/* Appointment List */}
            <div className="space-y-2">
              {upcomingAppointments.map((apt) => (
                <HoverCard key={apt.id}>
                  <HoverCardTrigger asChild>
                    <div 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900",
                        apt.realtimeStatus.isRunningLate && "border-l-2 border-l-red-500 pl-3"
                      )}
                      onClick={() => setLocation(`/ecp/diary?appointment=${apt.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {apt.patient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{apt.patient.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.startTime), 'h:mm a')} · {apt.title}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        in {getTimeUntil(apt)}
                      </Badge>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" side="left">
                    <PatientHoverSummary appointment={apt} />
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Patient summary shown in hover card
 */
function PatientHoverSummary({ appointment }: { appointment: IntegratedAppointment }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {appointment.patient.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold">{appointment.patient.name}</h4>
          <p className="text-xs text-muted-foreground">{appointment.title}</p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>
            {format(new Date(appointment.startTime), 'h:mm a')} - {format(new Date(appointment.endTime), 'h:mm a')}
          </span>
        </div>
        
        {appointment.patient.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="truncate">{appointment.patient.email}</span>
          </div>
        )}
        
        {appointment.patient.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{appointment.patient.phone}</span>
          </div>
        )}
        
        {appointment.patient.lastVisit && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Last visit: {format(new Date(appointment.patient.lastVisit), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      {/* Clinical status */}
      {appointment.clinical && (
        <div className="pt-2 border-t">
          <p className="text-xs font-medium mb-1">Clinical Status</p>
          <div className="flex flex-wrap gap-1">
            {appointment.clinical.hasActiveExam && (
              <Badge variant="secondary" className="text-xs">Active Exam</Badge>
            )}
            {appointment.clinical.hasPrescription && (
              <Badge variant="secondary" className="text-xs">Has Rx</Badge>
            )}
            {appointment.clinical.prescriptionSigned && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-600">Rx Signed</Badge>
            )}
          </div>
        </div>
      )}

      <AppointmentStatusBadge 
        stage={appointment.realtimeStatus.currentStage}
        isRunningLate={appointment.realtimeStatus.isRunningLate}
        className="w-full justify-center"
      />
    </div>
  );
}
