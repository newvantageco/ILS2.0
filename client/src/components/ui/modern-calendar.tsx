/**
 * Modern Calendar Component
 *
 * Beautiful calendar with day, week, and month views
 * Features:
 * - Month view with event dots and summaries
 * - Week view with hourly time slots
 * - Day view with detailed schedule
 * - Quick filters
 * - Navigation controls
 * - Color-coded events
 */

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Filter,
  User,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
  setHours,
  setMinutes,
} from "date-fns";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  type?: "appointment" | "booking" | "blocked" | string;
  color?: string;
  patient?: {
    name: string;
  };
  room?: {
    name: string;
  };
  status?: string;
  isRunningLate?: boolean;
}

export type CalendarViewMode = "month" | "week" | "day";

interface ModernCalendarProps {
  events: CalendarEvent[];
  view?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  startHour?: number;
  endHour?: number;
}

// Pixels per hour for time-based views
const HOUR_HEIGHT = 60;

export function ModernCalendar({
  events,
  view: controlledView,
  onViewChange,
  selectedDate: controlledSelectedDate,
  onDateSelect,
  onEventClick,
  onDateClick,
  onTimeSlotClick,
  onEventDrop,
  startHour = 8,
  endHour = 18,
}: ModernCalendarProps) {
  const [internalView, setInternalView] = useState<CalendarViewMode>("month");
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Use controlled or internal state
  const view = controlledView ?? internalView;
  const selectedDate = controlledSelectedDate ?? internalSelectedDate;

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Parse event time helper
  const parseEventTime = (time: Date | string): Date => {
    if (typeof time === "string") {
      return parseISO(time);
    }
    return time;
  };

  // Event color helper
  const getEventColor = (type?: string, isRunningLate?: boolean) => {
    if (isRunningLate) {
      return "bg-red-100 border-red-300 text-red-700";
    }
    switch (type) {
      case "appointment":
      case "eye_examination":
        return "bg-blue-100 border-blue-300 text-blue-700";
      case "booking":
      case "contact_lens_fitting":
        return "bg-green-100 border-green-300 text-green-700";
      case "blocked":
        return "bg-red-100 border-red-300 text-red-700";
      case "frame_selection":
        return "bg-pink-100 border-pink-300 text-pink-700";
      case "follow_up":
        return "bg-green-100 border-green-300 text-green-700";
      case "emergency":
        return "bg-red-100 border-red-300 text-red-700";
      case "consultation":
        return "bg-yellow-100 border-yellow-300 text-yellow-700";
      case "dispensing":
        return "bg-orange-100 border-orange-300 text-orange-700";
      case "collection":
        return "bg-teal-100 border-teal-300 text-teal-700";
      default:
        return "bg-purple-100 border-purple-300 text-purple-700";
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = parseEventTime(event.start);
      return isSameDay(eventDate, date);
    });
  };

  // Handle view change
  const handleViewChange = (newView: CalendarViewMode) => {
    if (onViewChange) {
      onViewChange(newView);
    } else {
      setInternalView(newView);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    } else {
      setInternalSelectedDate(date);
    }
    setCurrentMonth(date);
    onDateClick?.(date);
  };

  // Navigation handlers
  const navigatePrevious = () => {
    if (view === "month") {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else if (view === "week") {
      const newDate = subWeeks(selectedDate, 1);
      handleDateSelect(newDate);
    } else {
      const newDate = addDays(selectedDate, -1);
      handleDateSelect(newDate);
    }
  };

  const navigateNext = () => {
    if (view === "month") {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else if (view === "week") {
      const newDate = addWeeks(selectedDate, 1);
      handleDateSelect(newDate);
    } else {
      const newDate = addDays(selectedDate, 1);
      handleDateSelect(newDate);
    }
  };

  const navigateToday = () => {
    const today = new Date();
    handleDateSelect(today);
    setCurrentMonth(today);
  };

  // Generate hours array
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Get week days for week view
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Month view calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const monthViewStart = startOfWeek(monthStart);
  const monthViewEnd = endOfWeek(monthEnd);

  // Calculate event position for time-based views
  const getEventStyle = (event: CalendarEvent) => {
    const start = parseEventTime(event.start);
    const end = parseEventTime(event.end);
    const startMinutes = start.getHours() * 60 + start.getMinutes() - startHour * 60;
    const duration = differenceInMinutes(end, start);
    const adjustedStart = Math.max(0, startMinutes);
    const adjustedDuration = Math.min(
      duration,
      (endHour - startHour) * 60 - adjustedStart
    );

    return {
      top: `${(adjustedStart / 60) * HOUR_HEIGHT}px`,
      height: `${Math.max((adjustedDuration / 60) * HOUR_HEIGHT - 2, 24)}px`,
    };
  };

  // Current time line position
  const currentTimePosition = useMemo(() => {
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() - startHour * 60;
    if (nowMinutes < 0 || nowMinutes >= (endHour - startHour) * 60) {
      return null;
    }
    return (nowMinutes / 60) * HOUR_HEIGHT;
  }, [currentTime, startHour, endHour]);

  // Render header with navigation and view switcher
  const renderHeader = () => {
    let title = "";
    if (view === "month") {
      title = format(currentMonth, "MMMM yyyy");
    } else if (view === "week") {
      const weekEnd = addDays(weekStart, 6);
      title = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    } else {
      title = format(selectedDate, "EEEE, MMMM d, yyyy");
    }

    return (
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("day")}
            >
              Day
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("week")}
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("month")}
            >
              Month
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const rows = [];
    let days = [];
    let day = monthViewStart;

    // Day headers
    const dayHeaders = (
      <div className="grid grid-cols-7 border-b border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center py-3 text-sm font-semibold text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
    );

    while (day <= monthViewEnd) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayEvents = getEventsForDate(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelectedDay = isSameDay(day, selectedDate);
        const isTodayDay = isToday(day);

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[100px] border-r border-b border-border p-2 transition-colors cursor-pointer",
              !isCurrentMonth && "bg-muted/30",
              isSelectedDay && "bg-primary/5 ring-2 ring-primary ring-inset",
              isCurrentMonth && "hover:bg-muted/50"
            )}
            onClick={() => handleDateSelect(cloneDay)}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={cn(
                  "text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full",
                  !isCurrentMonth && "text-muted-foreground",
                  isTodayDay && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              {dayEvents.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {dayEvents.length}
                </Badge>
              )}
            </div>

            {/* Events */}
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                  className={cn(
                    "text-xs p-1.5 rounded border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
                    getEventColor(event.type, event.isRunningLate)
                  )}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  {event.patient && (
                    <div className="text-xs opacity-75 truncate">
                      {event.patient.name}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs opacity-75 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {format(parseEventTime(event.start), "HH:mm")}
                  </div>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div>
        {dayHeaders}
        {rows}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    return (
      <div className="overflow-auto">
        {/* Header - Day names */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="grid" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
            <div className="border-r p-2 text-xs font-medium text-muted-foreground flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-2 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/50",
                  isToday(day) && "bg-primary/5"
                )}
                onClick={() => {
                  handleDateSelect(day);
                  handleViewChange("day");
                }}
              >
                <div
                  className={cn(
                    "text-xs font-medium uppercase",
                    isToday(day) ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-lg font-bold mt-1",
                    isToday(day)
                      ? "w-8 h-8 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      : ""
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time grid */}
        <div className="relative">
          <div className="grid" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
            {/* Time labels */}
            <div className="border-r">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b text-xs text-muted-foreground pr-2 text-right"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="relative -top-2">
                    {format(setHours(new Date(), hour), "h a")}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dayEvents = getEventsForDate(day);
              const showTimeLine = isToday(day) && currentTimePosition !== null;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-r last:border-r-0 relative",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  {/* Hour slots */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      onClick={() => {
                        const time = `${hour.toString().padStart(2, "0")}:00`;
                        onTimeSlotClick?.(day, time);
                      }}
                    >
                      <div className="border-b border-dashed border-border/50 h-1/2" />
                    </div>
                  ))}

                  {/* Events */}
                  <div className="absolute inset-0 pointer-events-none">
                    {dayEvents.map((event) => {
                      const style = getEventStyle(event);
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "absolute left-1 right-1 rounded-md border px-1.5 py-0.5 text-xs cursor-pointer pointer-events-auto transition-all hover:shadow-md hover:z-20",
                            getEventColor(event.type, event.isRunningLate)
                          )}
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {event.patient && (
                            <div className="flex items-center gap-1 truncate opacity-75">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{event.patient.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Current time line */}
                  {showTimeLine && (
                    <div
                      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                      style={{ top: `${currentTimePosition}px` }}
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
                      <div className="flex-1 border-t-2 border-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate);
    const showTimeLine = isToday(selectedDate) && currentTimePosition !== null;

    return (
      <div className="overflow-auto">
        {/* Day header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="text-center">
            <div
              className={cn(
                "text-sm font-medium uppercase",
                isToday(selectedDate) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {format(selectedDate, "EEEE")}
            </div>
            <div
              className={cn(
                "text-3xl font-bold mt-1",
                isToday(selectedDate)
                  ? "w-12 h-12 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  : ""
              )}
            >
              {format(selectedDate, "d")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {format(selectedDate, "MMMM yyyy")}
            </div>
          </div>
        </div>

        {/* Time grid */}
        <div className="relative">
          <div className="grid" style={{ gridTemplateColumns: "80px 1fr" }}>
            {/* Time labels */}
            <div className="border-r">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b text-xs text-muted-foreground pr-2 text-right"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="relative -top-2">
                    {format(setHours(new Date(), hour), "h a")}
                  </span>
                </div>
              ))}
            </div>

            {/* Day column */}
            <div className="relative">
              {/* Hour slots */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  onClick={() => {
                    const time = `${hour.toString().padStart(2, "0")}:00`;
                    onTimeSlotClick?.(selectedDate, time);
                  }}
                >
                  <div className="border-b border-dashed border-border/50 h-1/2" />
                </div>
              ))}

              {/* Events */}
              <div className="absolute inset-0 pointer-events-none px-2">
                {dayEvents.map((event) => {
                  const style = getEventStyle(event);
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-2 right-2 rounded-lg border-2 p-2 cursor-pointer pointer-events-auto transition-all hover:shadow-lg hover:z-20",
                        getEventColor(event.type, event.isRunningLate)
                      )}
                      style={style}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <div className="font-semibold truncate">{event.title}</div>
                      {event.patient && (
                        <div className="flex items-center gap-1 text-sm mt-1">
                          <User className="w-4 h-4" />
                          <span>{event.patient.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm mt-1 opacity-75">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(parseEventTime(event.start), "h:mm a")} -{" "}
                          {format(parseEventTime(event.end), "h:mm a")}
                        </span>
                      </div>
                      {event.isRunningLate && (
                        <Badge variant="destructive" className="mt-2">
                          Running Late
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Current time line */}
              {showTimeLine && (
                <div
                  className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                  style={{ top: `${currentTimePosition}px` }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-md" />
                  <div className="flex-1 border-t-2 border-red-500" />
                  <div className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-l shadow-md">
                    {format(currentTime, "h:mm a")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {renderHeader()}
      <div className="border-t">
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </div>
    </div>
  );
}

// Quick Filter Component
export function CalendarQuickFilters({
  onFilterChange,
  activeFilter,
}: {
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}) {
  const filters = [
    { id: "all", label: "All" },
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "week", label: "This Week" },
  ];

  return (
    <div className="flex items-center gap-2 mb-4">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <div className="flex gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
