/**
 * Modern Test Room Bookings Page
 * 
 * Complete redesign with:
 * - Modern calendar with drag-and-drop
 * - Color-coded bookings
 * - Quick filters
 * - Real-time updates
 * - Mobile-optimized
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModernCalendar, CalendarQuickFilters, type CalendarEvent } from "@/components/ui/modern-calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Plus,
  Filter,
  Download,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { format, startOfDay, isToday, isTomorrow, startOfWeek, endOfWeek } from "date-fns";

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
  utilizationRate: number;
}

export default function ModernBookingsPage() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch bookings
  const { data: allBookings, isLoading, refetch } = useQuery<Booking[]>({
    queryKey: ["/api/ecp/test-room-bookings"],
  });

  // Fetch test rooms
  const { data: testRooms } = useQuery<any[]>({
    queryKey: ["/api/ecp/test-rooms"],
  });

  // Transform bookings to calendar events
  const calendarEvents: CalendarEvent[] = (allBookings || []).map((booking) => ({
    id: booking.id,
    title: booking.room?.roomName || "Booking",
    start: new Date(booking.startTime),
    end: new Date(booking.endTime),
    type: "booking" as const,
    patient: booking.patient,
    room: booking.room,
  }));

  // Calculate statistics
  const stats: Stats = {
    todayBookings:
      allBookings?.filter((b) => isToday(new Date(b.bookingDate))).length || 0,
    weekBookings:
      allBookings?.filter((b) => {
        const date = new Date(b.bookingDate);
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        return date >= weekStart && date <= weekEnd;
      }).length || 0,
    availableRooms:
      testRooms?.filter((r) => r.currentStatus === "available").length || 0,
    utilizationRate: testRooms && testRooms.length > 0
      ? Math.round((stats.todayBookings / (testRooms.length * 8)) * 100)
      : 0,
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Handle event click - open modal/details
    console.log("Event clicked:", event);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Could open "create booking" modal here
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Bookings data has been updated.",
    });
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            Test Room Bookings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your test room schedule and appointments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active appointments today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total bookings this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableRooms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for appointments
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Room usage efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters */}
      <Card>
        <CardContent className="pt-6">
          <CalendarQuickFilters
            onFilterChange={setActiveFilter}
            activeFilter={activeFilter}
          />
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ModernCalendar
            events={calendarEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allBookings
              ?.filter((b) => new Date(b.startTime) > new Date())
              .slice(0, 5)
              .map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                      <span className="text-xs font-medium">
                        {format(new Date(booking.startTime), "MMM")}
                      </span>
                      <span className="text-lg font-bold">
                        {format(new Date(booking.startTime), "d")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{booking.room?.roomName}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.patient?.name || "No patient assigned"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {format(new Date(booking.startTime), "HH:mm")} -{" "}
                      {format(new Date(booking.endTime), "HH:mm")}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            {(!allBookings || allBookings.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming bookings</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
