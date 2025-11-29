/**
 * Diary Calendar Page
 *
 * Comprehensive appointment management with:
 * - Day, Week, and Month calendar views
 * - Appointment booking dialog
 * - Real-time appointment data
 * - Quick actions and filters
 * - Queue management sidebar
 */

import { useState, useMemo, useCallback } from "react";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ModernCalendar,
  CalendarEvent,
  CalendarViewMode,
  CalendarQuickFilters,
} from "@/components/ui/modern-calendar";
import { AppointmentBookingDialog } from "@/components/diary/AppointmentBookingDialog";
import { SmartAppointmentCard } from "@/components/diary/SmartAppointmentCard";
import {
  Calendar,
  Plus,
  Users,
  Package,
  Clock,
  TrendingUp,
  Filter,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  RefreshCw,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, isToday, isTomorrow, startOfDay, endOfDay } from "date-fns";
import {
  useIntegratedAppointments,
  useDateRangeAppointments,
  useAppointmentQueue,
  IntegratedAppointment,
} from "@/hooks/useIntegratedAppointments";
import { useAppointmentWebSocket } from "@/hooks/useAppointmentWebSocket";
import { cn } from "@/lib/utils";

export default function DiaryCalendarPage() {
  const { user } = useUser();

  // Calendar state
  const [view, setView] = useState<CalendarViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<string>("all");

  // Booking dialog state
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [bookingTime, setBookingTime] = useState<string | undefined>();

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === "day") {
      return {
        startDate: startOfDay(selectedDate),
        endDate: endOfDay(selectedDate),
      };
    } else if (view === "week") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
      return {
        startDate: weekStart,
        endDate: weekEnd,
      };
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      // Include days from previous/next month that appear in the calendar view
      const viewStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const viewEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return {
        startDate: viewStart,
        endDate: viewEnd,
      };
    }
  }, [view, selectedDate]);

  // Fetch appointments for the current view
  const { data: appointments = [], isLoading, refetch } = useIntegratedAppointments({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    practitionerId: user?.role === "ecp" ? user.id : undefined,
  });

  // Fetch queues
  const { data: checkedInQueue = [] } = useAppointmentQueue("checked_in");
  const { data: readyForDispenseQueue = [] } = useAppointmentQueue("ready_for_dispense");

  // WebSocket for real-time updates
  useAppointmentWebSocket({
    companyId: user?.companyId ?? undefined,
    enableToasts: true,
  });

  // Transform appointments to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    let filteredAppointments = appointments;

    // Apply quick filter
    if (filter === "today") {
      filteredAppointments = appointments.filter((apt) =>
        isToday(new Date(apt.startTime))
      );
    } else if (filter === "tomorrow") {
      filteredAppointments = appointments.filter((apt) =>
        isTomorrow(new Date(apt.startTime))
      );
    }

    return filteredAppointments.map((apt) => ({
      id: apt.id,
      title: apt.title,
      start: apt.startTime,
      end: apt.endTime,
      type: apt.type,
      patient: apt.patient,
      status: apt.status,
      isRunningLate: apt.realtimeStatus.isRunningLate,
    }));
  }, [appointments, filter]);

  // Statistics
  const stats = useMemo(() => {
    const today = new Date();
    const todayAppointments = appointments.filter((apt) =>
      isToday(new Date(apt.startTime))
    );

    return {
      totalInView: appointments.length,
      todayCount: todayAppointments.length,
      checkedInCount: checkedInQueue.length,
      readyForDispenseCount: readyForDispenseQueue.length,
      upcomingCount: appointments.filter(
        (apt) => new Date(apt.startTime) > today && apt.status !== "cancelled"
      ).length,
    };
  }, [appointments, checkedInQueue, readyForDispenseQueue]);

  // Handle time slot click to open booking dialog
  const handleTimeSlotClick = useCallback((date: Date, time: string) => {
    setBookingDate(date);
    setBookingTime(time);
    setBookingDialogOpen(true);
  }, []);

  // Handle event click
  const handleEventClick = useCallback((event: CalendarEvent) => {
    console.log("Event clicked:", event);
    // TODO: Open appointment details dialog
  }, []);

  // Handle booking success
  const handleBookingSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Sort checked-in queue by wait time
  const sortedCheckedInQueue = useMemo(() => {
    return [...checkedInQueue].sort((a, b) => {
      const aTime = new Date(a.realtimeStatus.lastUpdate).getTime();
      const bTime = new Date(b.realtimeStatus.lastUpdate).getTime();
      return aTime - bTime;
    });
  }, [checkedInQueue]);

  return (
    <div className="container max-w-[1600px] mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            Diary & Appointments
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your schedule with day, week, and month views
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setBookingDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In View</CardTitle>
            <CalendarRange className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInView}</div>
            <p className="text-xs text-muted-foreground">
              {view === "day" && format(selectedDate, "MMM d")}
              {view === "week" && "This week"}
              {view === "month" && format(selectedDate, "MMMM")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCount}</div>
            <p className="text-xs text-muted-foreground">Appointments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.checkedInCount}</div>
            <p className="text-xs text-muted-foreground">Waiting</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readyForDispenseCount}</div>
            <p className="text-xs text-muted-foreground">For Dispense</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingCount}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section (75%) */}
        <div className="lg:w-[75%] space-y-4">
          {/* Quick Filters */}
          <div className="flex items-center justify-between">
            <CalendarQuickFilters
              activeFilter={filter}
              onFilterChange={setFilter}
            />

            {/* View selector (mobile alternative) */}
            <div className="flex items-center gap-1 lg:hidden">
              <Button
                variant={view === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("day")}
              >
                <CalendarDays className="w-4 h-4" />
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
              >
                <CalendarRange className="w-4 h-4" />
              </Button>
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar */}
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="mt-4 text-muted-foreground">Loading appointments...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-[700px] overflow-hidden">
              <ModernCalendar
                events={calendarEvents}
                view={view}
                onViewChange={setView}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeSlotClick}
                startHour={8}
                endHour={19}
              />
            </div>
          )}
        </div>

        {/* Sidebar (25%) */}
        <div className="lg:w-[25%] space-y-4">
          {/* Waiting Room Queue */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-yellow-500" />
                  Waiting Room
                </CardTitle>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {checkedInQueue.length} waiting
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {sortedCheckedInQueue.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No patients waiting</p>
                </div>
              ) : (
                sortedCheckedInQueue.map((apt) => (
                  <SmartAppointmentCard
                    key={apt.id}
                    appointment={apt}
                    userRole={user?.role || "ecp"}
                    compact
                    showHoverDetails
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Ready for Dispense Queue */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-500" />
                  Ready for Dispense
                </CardTitle>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {readyForDispenseQueue.length} ready
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {readyForDispenseQueue.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No patients ready</p>
                </div>
              ) : (
                readyForDispenseQueue.map((apt) => (
                  <SmartAppointmentCard
                    key={apt.id}
                    appointment={apt}
                    userRole={user?.role || "ecp"}
                    compact
                    showHoverDetails
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-b from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setBookingDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedDate(new Date());
                  setView("day");
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Today
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setView("week")}
              >
                <CalendarRange className="w-4 h-4 mr-2" />
                Week Overview
              </Button>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                  <span>Eye Exam</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
                  <span>Follow Up</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
                  <span>Contact Lens</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-pink-100 border border-pink-300" />
                  <span>Frame Select</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
                  <span>Consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />
                  <span>Dispensing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                  <span>Emergency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-teal-100 border border-teal-300" />
                  <span>Collection</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Dialog */}
      <AppointmentBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        initialDate={bookingDate}
        initialTime={bookingTime}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}
