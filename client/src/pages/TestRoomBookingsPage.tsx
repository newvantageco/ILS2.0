import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, TrendingUp, DollarSign, CalendarDays, Plus } from "lucide-react";
import { ModernCalendar, type CalendarEvent } from "@/components/ui/ModernCalendar";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { format, startOfWeek, endOfWeek, isToday, isTomorrow, startOfDay } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Booking {
  id: string;
  testRoomId: string;
  startTime: Date;
  endTime: Date;
  appointmentType: string | null;
  status: string;
  bookingDate: Date;
  patient?: {
    id: string;
    name: string;
  };
  user: {
    name: string;
  };
  room?: {
    roomName: string;
  };
}

interface Stats {
  todayBookings: number;
  weekBookings: number;
  availableRooms: number;
  upcomingToday: Booking[];
  upcomingTomorrow: Booking[];
}

export default function TestRoomBookingsPageModern() {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const { toast } = useToast();

  // Dialog states
  const [isNewBookingDialogOpen, setIsNewBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  // Form state
  const [newBooking, setNewBooking] = useState({
    testRoomId: "",
    patientId: "",
    appointmentType: "",
    duration: 30,
  });

  // Fetch all bookings
  const { data: allBookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/ecp/test-room-bookings"],
  });

  // Fetch test rooms
  const { data: testRooms } = useQuery<any[]>({
    queryKey: ["/api/ecp/test-rooms"],
  });

  // Fetch patients for booking form
  const { data: patients } = useQuery<any[]>({
    queryKey: ["/api/patients"],
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ecp/test-room-bookings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/test-room-bookings"] });
      toast({
        title: "Booking Created",
        description: "Test room booking has been created successfully.",
      });
      setIsNewBookingDialogOpen(false);
      resetNewBookingForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update booking mutation (for drag-drop rescheduling)
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/ecp/test-room-bookings/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/test-room-bookings"] });
      toast({
        title: "Booking Rescheduled",
        description: "Booking has been rescheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reschedule booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate statistics
  const stats: Stats = {
    todayBookings: allBookings?.filter(b =>
      isToday(new Date(b.bookingDate))
    ).length || 0,
    weekBookings: allBookings?.filter(b => {
      const date = new Date(b.bookingDate);
      return date >= weekStart && date <= weekEnd;
    }).length || 0,
    availableRooms: testRooms?.filter(r => r.currentStatus === 'available').length || 0,
    upcomingToday: allBookings?.filter(b =>
      isToday(new Date(b.bookingDate)) &&
      new Date(b.startTime) > new Date() &&
      b.status === 'scheduled'
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [],
    upcomingTomorrow: allBookings?.filter(b =>
      isTomorrow(new Date(b.bookingDate)) &&
      b.status === 'scheduled'
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [],
  };

  // Estimate revenue
  const avgBookingPriceGBP = 50;
  const weekRevenueGBP = stats.weekBookings * avgBookingPriceGBP;

  // Convert bookings to calendar events
  const calendarEvents: CalendarEvent[] = allBookings?.map(booking => ({
    id: booking.id,
    title: booking.patient?.name || 'Booking',
    start: new Date(booking.startTime),
    end: new Date(booking.endTime),
    type: booking.status === 'completed' ? 'blocked' : booking.status === 'scheduled' ? 'booking' : 'appointment',
    status: booking.status as any,
    description: booking.appointmentType || undefined,
    location: booking.room?.roomName,
    attendee: booking.patient?.name,
  })) || [];

  const resetNewBookingForm = () => {
    setNewBooking({
      testRoomId: "",
      patientId: "",
      appointmentType: "",
      duration: 30,
    });
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsNewBookingDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventDrop = (event: CalendarEvent, newStart: Date) => {
    const originalBooking = allBookings?.find(b => b.id === event.id);
    if (!originalBooking) return;

    const duration = new Date(originalBooking.endTime).getTime() - new Date(originalBooking.startTime).getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    updateBookingMutation.mutate({
      id: event.id,
      data: {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        bookingDate: newStart.toISOString(),
      },
    });
  };

  const handleCreateBooking = () => {
    if (!selectedDate || !newBooking.testRoomId || !newBooking.patientId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const endTime = new Date(selectedDate);
    endTime.setMinutes(endTime.getMinutes() + newBooking.duration);

    createBookingMutation.mutate({
      testRoomId: newBooking.testRoomId,
      patientId: newBooking.patientId,
      startTime: selectedDate.toISOString(),
      endTime: endTime.toISOString(),
      bookingDate: selectedDate.toISOString(),
      appointmentType: newBooking.appointmentType || null,
      status: "scheduled",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Test Room Diary & Scheduling
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage test room bookings with drag-and-drop scheduling
          </p>
        </div>
        <Button onClick={() => setIsNewBookingDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingToday.length} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekBookings}</div>
            <p className="text-xs text-muted-foreground">
              Total appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableRooms}</div>
            <p className="text-xs text-muted-foreground">
              of {testRooms?.length || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Week Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{weekRevenueGBP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Estimated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currency Display */}
      <CurrencyDisplay gbpAmount={weekRevenueGBP} />

      {/* Upcoming Appointments */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Upcoming */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today&apos;s Upcoming Appointments
            </CardTitle>
            <CardDescription>Next appointments for today</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments today</p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingToday.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-start justify-between border-l-2 border-primary pl-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(booking.startTime), 'HH:mm')}
                        </Badge>
                        <span className="font-medium text-sm">
                          {booking.patient?.name || 'No patient'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {booking.appointmentType || 'General appointment'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {booking.room?.roomName || 'Room'}
                    </Badge>
                  </div>
                ))}
                {stats.upcomingToday.length > 5 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    +{stats.upcomingToday.length - 5} more appointments
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tomorrow's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tomorrow&apos;s Appointments
            </CardTitle>
            <CardDescription>Scheduled for tomorrow</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingTomorrow.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments scheduled for tomorrow</p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingTomorrow.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-start justify-between border-l-2 border-blue-500 pl-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(booking.startTime), 'HH:mm')}
                        </Badge>
                        <span className="font-medium text-sm">
                          {booking.patient?.name || 'No patient'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {booking.appointmentType || 'General appointment'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {booking.room?.roomName || 'Room'}
                    </Badge>
                  </div>
                ))}
                {stats.upcomingTomorrow.length > 5 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    +{stats.upcomingTomorrow.length - 5} more appointments
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modern Calendar */}
      <ModernCalendar
        events={calendarEvents}
        view="week"
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onEventDrop={handleEventDrop}
        minTime={8}
        maxTime={20}
        slotDuration={30}
        highlightToday
        showWeekends={false}
      />

      {/* New Booking Dialog */}
      <Dialog open={isNewBookingDialogOpen} onOpenChange={setIsNewBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>
              Schedule a new test room appointment
              {selectedDate && ` for ${format(selectedDate, 'PPP p')}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testRoom">Test Room *</Label>
              <Select
                value={newBooking.testRoomId}
                onValueChange={(value) => setNewBooking({ ...newBooking, testRoomId: value })}
              >
                <SelectTrigger id="testRoom">
                  <SelectValue placeholder="Select a test room..." />
                </SelectTrigger>
                <SelectContent>
                  {testRooms?.filter(r => r.isActive && r.currentStatus === 'available').map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.roomName} {room.roomCode && `(${room.roomCode})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <Select
                value={newBooking.patientId}
                onValueChange={(value) => setNewBooking({ ...newBooking, patientId: value })}
              >
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select a patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentType">Appointment Type</Label>
              <Input
                id="appointmentType"
                value={newBooking.appointmentType}
                onChange={(e) => setNewBooking({ ...newBooking, appointmentType: e.target.value })}
                placeholder="e.g., Eye Examination, Contact Lens Fitting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={newBooking.duration.toString()}
                onValueChange={(value) => setNewBooking({ ...newBooking, duration: parseInt(value) })}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBooking} disabled={createBookingMutation.isPending}>
              {createBookingMutation.isPending ? 'Creating...' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View appointment information
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Patient</Label>
                <p className="font-medium">{selectedEvent.attendee || 'N/A'}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Time</Label>
                <p className="font-medium">
                  {format(selectedEvent.start, 'PPP p')} - {format(selectedEvent.end, 'p')}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Room</Label>
                <p className="font-medium">{selectedEvent.location || 'N/A'}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium">{selectedEvent.description || 'General Appointment'}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Status</Label>
                <Badge>{selectedEvent.status || 'scheduled'}</Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
