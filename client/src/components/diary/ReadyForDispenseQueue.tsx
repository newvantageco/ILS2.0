/**
 * Ready for Dispense Queue Component
 * 
 * Shows patients who have completed their exam with signed prescriptions
 * and are ready for dispensing/ordering.
 * 
 * Features:
 * - Real-time updates via WebSocket
 * - Quick access to prescription
 * - One-click order creation
 * - Patient wait time tracking
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppointmentQueue } from '@/hooks/useIntegratedAppointments';
import { useDispenserNotifications } from '@/hooks/useAppointmentWebSocket';
import { useUser } from '@/hooks/use-user';
import { useNavigate } from 'wouter';
import { 
  Package, 
  FileText, 
  ShoppingCart, 
  Clock,
  User,
  Calendar,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';

export function ReadyForDispenseQueue() {
  const { user } = useUser();
  const { data: queue = [], isLoading } = useAppointmentQueue('ready_for_dispense');
  const [, navigate] = useNavigate();
  
  // Enable real-time notifications
  useDispenserNotifications(user?.companyId);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-4 text-muted-foreground">Loading queue...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (queue.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />
            Ready for Dispense Queue
          </CardTitle>
          <CardDescription>
            Patients with completed exams ready for dispensing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No patients in queue</p>
            <p className="text-sm text-muted-foreground mt-2">
              Patients will appear here when exams are completed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              Ready for Dispense Queue
              <Badge variant="secondary" className="ml-2">
                {queue.length} waiting
              </Badge>
            </CardTitle>
            <CardDescription>
              Patients with completed exams ready for dispensing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {queue.map((appointment, index) => {
            const waitTime = appointment.clinical?.signedAt 
              ? formatDistanceToNow(new Date(appointment.clinical.signedAt), { addSuffix: true })
              : 'Just now';
            
            const isWaitingLong = appointment.clinical?.signedAt 
              ? new Date().getTime() - new Date(appointment.clinical.signedAt).getTime() > 15 * 60 * 1000
              : false;
            
            return (
              <Card 
                key={appointment.id} 
                className={`transition-all hover:shadow-md ${isWaitingLong ? 'border-orange-500 border-2' : ''}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Patient Info */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-semibold">{appointment.patient.name}</span>
                            {index === 0 && (
                              <Badge className="bg-purple-500">Next</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {appointment.practitioner?.name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(appointment.startTime), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                        <AppointmentStatusBadge 
                          stage={appointment.realtimeStatus.currentStage}
                          status={appointment.status}
                        />
                      </div>
                      
                      {/* Wait Time Warning */}
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${isWaitingLong ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        <span className={`text-sm ${isWaitingLong ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                          Waiting {waitTime}
                        </span>
                        {isWaitingLong && (
                          <Badge variant="outline" className="text-orange-500 border-orange-500">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Priority
                          </Badge>
                        )}
                      </div>
                      
                      {/* Clinical Info */}
                      {appointment.clinical?.prescriptionId && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-green-500" />
                          <span className="text-muted-foreground">
                            Prescription signed by {appointment.practitioner?.name}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2">
                      {appointment.clinical?.prescriptionId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/prescriptions/${appointment.clinical!.prescriptionId}`)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Rx
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          const params = new URLSearchParams({
                            patientId: appointment.patientId,
                            appointmentId: appointment.id,
                          });
                          
                          if (appointment.clinical?.prescriptionId) {
                            params.append('prescriptionId', appointment.clinical.prescriptionId);
                          }
                          
                          navigate(`/pos?${params.toString()}`);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Create Order
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact queue count badge (for dashboard headers)
 */
export function ReadyForDispenseCount() {
  const { data: queue = [] } = useAppointmentQueue('ready_for_dispense');
  
  if (queue.length === 0) return null;
  
  return (
    <Badge className="bg-purple-500 hover:bg-purple-600">
      {queue.length} Ready
    </Badge>
  );
}
