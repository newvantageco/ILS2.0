import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Calendar as CalendarIcon,
  Settings,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addMinutes, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: {
    id: string;
    patientName: string;
    type: string;
    status: string;
  };
}

interface CalendarDiaryProps {
  practitionerId?: string;
  compactMode?: boolean;
  showBookingButton?: boolean;
}

export default function CalendarDiary({
  practitionerId,
  compactMode = false,
  showBookingButton = true
}: CalendarDiaryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  // Fetch calendar settings
  const { data: settings } = useQuery({
    queryKey: ['/api/calendar-settings', practitionerId],
    initialData: {
      defaultSlotDuration: 25,
      workingHours: {
        monday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        tuesday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        wednesday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        thursday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        friday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        saturday: { start: '09:00', end: '13:00', breaks: [] },
        sunday: { start: null, end: null, breaks: [] },
      },
      colorScheme: {
        eye_examination: '#3b82f6',
        contact_lens_fitting: '#10b981',
        frame_selection: '#f59e0b',
        follow_up: '#8b5cf6',
        emergency: '#ef4444',
        consultation: '#06b6d4',
      },
    },
  });

  // Fetch appointments for selected date range
  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/appointments', selectedDate.toISOString(), practitionerId],
  });

  // Generate time slots for a given day
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const dayName = format(date, 'EEEE').toLowerCase();
    const daySettings = settings?.workingHours?.[dayName];

    if (!daySettings || !daySettings.start || !daySettings.end) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const [startHour, startMin] = daySettings.start.split(':').map(Number);
    const [endHour, endMin] = daySettings.end.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMin, 0, 0);

    const slotDuration = settings?.defaultSlotDuration || 25;

    while (currentTime < endTime) {
      const timeString = format(currentTime, 'HH:mm');

      // Check if time is within a break
      const isBreak = daySettings.breaks?.some(breakPeriod => {
        return timeString >= breakPeriod.start && timeString < breakPeriod.end;
      });

      if (!isBreak) {
        // Check if there's an appointment at this time
        const appointment = appointments.find((apt: any) => {
          const aptStart = parseISO(apt.startTime);
          return isSameDay(aptStart, date) && format(aptStart, 'HH:mm') === timeString;
        });

        slots.push({
          time: timeString,
          available: !appointment,
          appointment: appointment ? {
            id: appointment.id,
            patientName: appointment.patientName || 'Appointment',
            type: appointment.type,
            status: appointment.status,
          } : undefined,
        });
      }

      currentTime = addMinutes(currentTime, slotDuration);
    }

    return slots;
  };

  const getAppointmentColor = (type: string) => {
    return settings?.colorScheme?.[type] || '#6b7280';
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setSelectedDate(current => addDays(current, direction === 'next' ? 1 : -1));
    } else {
      setSelectedDate(current => addDays(current, direction === 'next' ? 7 : -7));
    }
  };

  const renderDayView = () => {
    const slots = generateTimeSlots(selectedDate);

    return (
      <ScrollArea className={cn("rounded-md border", compactMode ? "h-[400px]" : "h-[600px]")}>
        <div className="p-4 space-y-1">
          {slots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No working hours set for this day</p>
            </div>
          ) : (
            slots.map((slot, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  slot.available
                    ? "hover:bg-muted/50 cursor-pointer border-dashed"
                    : "bg-white border-solid"
                )}
                onClick={() => slot.available && showBookingButton && setShowBookingDialog(true)}
              >
                <div className="flex-shrink-0 w-16 text-sm font-medium text-muted-foreground">
                  {slot.time}
                </div>
                {slot.appointment ? (
                  <div
                    className="flex-1 px-3 py-2 rounded-md text-white text-sm font-medium"
                    style={{ backgroundColor: getAppointmentColor(slot.appointment.type) }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{slot.appointment.patientName}</span>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {slot.appointment.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-muted-foreground italic">
                    Available
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-2 p-4">
        {days.map((day, idx) => {
          const slots = generateTimeSlots(day);
          const bookedSlots = slots.filter(s => !s.available).length;

          return (
            <div
              key={idx}
              className={cn(
                "border rounded-lg p-3 cursor-pointer transition-colors",
                isSameDay(day, selectedDate) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
              onClick={() => {
                setSelectedDate(day);
                setViewMode('day');
              }}
            >
              <div className="text-center mb-2">
                <div className="text-xs font-medium text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div className="text-2xl font-bold">
                  {format(day, 'd')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-center text-muted-foreground">
                  {slots.length > 0 ? (
                    <>
                      <div>{bookedSlots} / {slots.length}</div>
                      <div className="text-[10px]">booked</div>
                    </>
                  ) : (
                    <div className="text-[10px]">Closed</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className={cn(compactMode && "shadow-none border-0")}>
      <CardHeader className={cn(compactMode && "pb-3")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Diary</CardTitle>
              <CardDescription>
                {viewMode === 'day'
                  ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                  : `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: 'day' | 'week') => setViewMode(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => handleDateChange('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleDateChange('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(compactMode && "pt-0")}>
        {viewMode === 'day' ? renderDayView() : renderWeekView()}

        {showBookingButton && (
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button onClick={() => setShowBookingDialog(true)} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>

      {/* Booking Dialog Placeholder */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Create a new appointment for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Appointment booking form will be integrated here.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancel
            </Button>
            <Button>
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
