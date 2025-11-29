/**
 * Week View Component
 *
 * Displays a full week calendar view with:
 * - 7-day horizontal layout
 * - Hourly time slots
 * - Appointment blocks positioned by time
 * - Current time indicator
 * - Click to create new appointments
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
  setHours,
  setMinutes,
} from "date-fns";

interface WeekEvent {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  type?: string;
  patient?: {
    name: string;
  };
  status?: string;
  isRunningLate?: boolean;
}

interface WeekViewProps {
  events: WeekEvent[];
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: WeekEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  startHour?: number;
  endHour?: number;
}

// Pixels per hour for layout calculations
const HOUR_HEIGHT = 60;

export function WeekView({
  events,
  currentDate = new Date(),
  onDateChange,
  onEventClick,
  onTimeSlotClick,
  startHour = 8,
  endHour = 18,
}: WeekViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate week boundaries
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Parse event times
  const parseEventTime = (time: Date | string): Date => {
    if (typeof time === "string") {
      return parseISO(time);
    }
    return time;
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = parseEventTime(event.startTime);
      return isSameDay(eventStart, date);
    });
  };

  // Calculate event position and height
  const getEventStyle = (event: WeekEvent) => {
    const start = parseEventTime(event.startTime);
    const end = parseEventTime(event.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes() - startHour * 60;
    const duration = differenceInMinutes(end, start);

    // Handle events outside working hours
    const adjustedStart = Math.max(0, startMinutes);
    const adjustedDuration = Math.min(
      duration,
      (endHour - startHour) * 60 - adjustedStart
    );

    return {
      top: `${(adjustedStart / 60) * HOUR_HEIGHT}px`,
      height: `${Math.max((adjustedDuration / 60) * HOUR_HEIGHT - 2, 20)}px`,
    };
  };

  // Get event color based on type
  const getEventColor = (type?: string, isRunningLate?: boolean) => {
    if (isRunningLate) {
      return "bg-red-100 border-red-300 text-red-800";
    }
    switch (type) {
      case "eye_examination":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "contact_lens_fitting":
        return "bg-purple-100 border-purple-300 text-purple-800";
      case "frame_selection":
        return "bg-pink-100 border-pink-300 text-pink-800";
      case "follow_up":
        return "bg-green-100 border-green-300 text-green-800";
      case "emergency":
        return "bg-red-100 border-red-300 text-red-800";
      case "consultation":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "dispensing":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "collection":
        return "bg-teal-100 border-teal-300 text-teal-800";
      default:
        return "bg-primary/10 border-primary/30 text-primary";
    }
  };

  // Navigation handlers
  const goToPreviousWeek = () => {
    onDateChange?.(subWeeks(currentDate, 1));
  };

  const goToNextWeek = () => {
    onDateChange?.(addWeeks(currentDate, 1));
  };

  const goToToday = () => {
    onDateChange?.(new Date());
  };

  // Current time line position
  const currentTimePosition = useMemo(() => {
    const now = currentTime;
    const nowMinutes = now.getHours() * 60 + now.getMinutes() - startHour * 60;
    if (nowMinutes < 0 || nowMinutes >= (endHour - startHour) * 60) {
      return null;
    }
    return (nowMinutes / 60) * HOUR_HEIGHT;
  }, [currentTime, startHour, endHour]);

  // Check if current time line should show on a specific day
  const shouldShowTimeLine = (day: Date) => {
    return isToday(day) && currentTimePosition !== null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Week View
          </CardTitle>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Week range display */}
        <div className="text-center text-sm text-muted-foreground mt-2">
          {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-auto">
          {/* Header - Day names */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="grid grid-cols-8">
              {/* Time column header */}
              <div className="w-20 min-w-[5rem] border-r p-2 text-xs font-medium text-muted-foreground">
                <Clock className="w-4 h-4 mx-auto" />
              </div>
              {/* Day headers */}
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 min-w-[120px] p-2 text-center border-r last:border-r-0",
                    isToday(day) && "bg-primary/5"
                  )}
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
            <div className="grid grid-cols-8">
              {/* Time labels column */}
              <div className="w-20 min-w-[5rem] border-r">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b last:border-b-0 text-xs text-muted-foreground pr-2 text-right"
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
                const dayEvents = getEventsForDay(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex-1 min-w-[120px] border-r last:border-r-0 relative",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {/* Hour slots */}
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        onClick={() => {
                          const time = `${hour.toString().padStart(2, "0")}:00`;
                          onTimeSlotClick?.(day, time);
                        }}
                      >
                        {/* Half-hour marker */}
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
                            <div className="opacity-75">
                              {format(parseEventTime(event.startTime), "h:mm a")}
                            </div>
                            {event.isRunningLate && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] px-1 py-0 absolute top-0.5 right-0.5"
                              >
                                Late
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Current time line */}
                    {shouldShowTimeLine(day) && currentTimePosition !== null && (
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
      </CardContent>
    </Card>
  );
}
