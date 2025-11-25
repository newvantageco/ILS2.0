/**
 * Live Waiting Room Widget
 * 
 * Real-time display of patients currently checked in and waiting.
 * Shows wait time, patient info, and quick actions.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppointmentQueue, useStartExam, type IntegratedAppointment } from "@/hooks/useIntegratedAppointments";
import { useLocation } from "wouter";
import { Users, Clock, Stethoscope, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface LiveWaitingRoomProps {
  className?: string;
  maxItems?: number;
  compact?: boolean;
}

export function LiveWaitingRoom({ className, maxItems = 5, compact = false }: LiveWaitingRoomProps) {
  const { data: checkedInQueue = [], isLoading, refetch } = useAppointmentQueue('checked_in');
  const startExam = useStartExam();
  const [, setLocation] = useLocation();

  const displayedPatients = checkedInQueue.slice(0, maxItems);

  const handleStartExam = async (appointment: IntegratedAppointment) => {
    if (appointment.clinical?.examId) {
      setLocation(`/examinations/${appointment.clinical.examId}`);
      return;
    }
    
    const result = await startExam.mutateAsync(appointment.id);
    if (result.examId) {
      setLocation(`/examinations/${result.examId}`);
    }
  };

  const getWaitTime = (appointment: IntegratedAppointment): string => {
    const checkInTime = new Date(appointment.realtimeStatus.lastUpdate);
    return formatDistanceToNow(checkInTime, { addSuffix: false });
  };

  const getWaitTimeMinutes = (appointment: IntegratedAppointment): number => {
    const checkInTime = new Date(appointment.realtimeStatus.lastUpdate);
    return Math.floor((Date.now() - checkInTime.getTime()) / 60000);
  };

  const getWaitTimeColor = (minutes: number): string => {
    if (minutes < 10) return "text-green-600";
    if (minutes < 20) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <Card className={cn("col-span-1 md:col-span-2", className)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Live Waiting Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("col-span-1 md:col-span-2", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-primary" />
          Live Waiting Room
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Badge 
            variant="secondary" 
            className={cn(
              "font-semibold",
              checkedInQueue.length > 0 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                : "bg-gray-100 text-gray-600"
            )}
          >
            {checkedInQueue.length} Waiting
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {checkedInQueue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No patients waiting</p>
            <p className="text-sm">Patients will appear here after check-in</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedPatients.map((apt) => {
              const waitMinutes = getWaitTimeMinutes(apt);
              const waitTimeColor = getWaitTimeColor(waitMinutes);
              
              return (
                <div 
                  key={apt.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md",
                    apt.realtimeStatus.isRunningLate 
                      ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" 
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {apt.patient.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{apt.patient.name}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className={cn("w-3 h-3", waitTimeColor)} />
                        <span className={waitTimeColor}>
                          Waiting {getWaitTime(apt)}
                        </span>
                        {apt.realtimeStatus.isRunningLate && (
                          <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0 animate-pulse">
                            Late
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleStartExam(apt)}
                    disabled={startExam.isPending}
                    className="shrink-0"
                  >
                    {startExam.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Stethoscope className="w-4 h-4 mr-1" />
                    )}
                    Start Exam
                  </Button>
                </div>
              );
            })}
            
            {checkedInQueue.length > maxItems && (
              <Button 
                variant="ghost" 
                className="w-full text-sm text-muted-foreground"
                onClick={() => setLocation('/ecp/diary')}
              >
                View all {checkedInQueue.length} waiting patients →
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
