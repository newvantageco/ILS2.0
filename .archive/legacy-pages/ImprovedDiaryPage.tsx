import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, TrendingUp, DollarSign, CalendarDays } from "lucide-react";
import { TestRoomScheduler } from "@/components/test-room/TestRoomScheduler";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { format, startOfWeek, endOfWeek, isToday, isTomorrow, startOfDay, endOfDay } from "date-fns";

interface Booking {
  id: string;
  testRoomId: string;
  startTime: Date;
  endTime: Date;
  appointmentType: string | null;
  status: string;
  bookingDate: Date;
  patient?: {
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

export default function TestRoomBookingsPage() {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  // Fetch all bookings for statistics
  const { data: allBookings } = useQuery<Booking[]>({
    queryKey: ["/api/ecp/test-room-bookings"],
  });

  // Fetch test rooms
  const { data: testRooms } = useQuery<any[]>({
    queryKey: ["/api/ecp/test-rooms"],
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

  // Estimate revenue (example pricing: £50 per booking)
  const avgBookingPriceGBP = 50;
  const weekRevenueGBP = stats.weekBookings * avgBookingPriceGBP;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calendar className="h-8 w-8" />
          Test Room Diary & Scheduling
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage test room bookings and appointments
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
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
              Today's Upcoming Appointments
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
              Tomorrow's Appointments
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

      {/* Main Scheduler */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Calendar</CardTitle>
          <CardDescription>Select a date and time to book a test room</CardDescription>
        </CardHeader>
        <CardContent>
          <TestRoomScheduler />
        </CardContent>
      </Card>
    </div>
  );
}
