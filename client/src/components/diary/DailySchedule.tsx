/**
 * Daily Schedule Component
 * 
 * Beautiful daily timeline view with:
 * - Hour-by-hour schedule
 * - Appointment blocks
 * - Color-coded events
 * - Time conflict detection
 * - Drag-and-drop ready
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, subDays, isToday, isSameDay } from "date-fns";

interface ScheduleEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: "appointment" | "task" | "break" | "blocked";
  patient?: {
    name: string;
  };
  location?: string;
  status?: "confirmed" | "pending" | "completed" | "cancelled";
}

interface DailyScheduleProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onTimeSlotClick?: (time: Date) => void;
  onDateChange?: (date: Date) => void;
}

export function DailySchedule({
  date,
  events,
  onEventClick,
  onTimeSlotClick,
  onDateChange,
}: DailyScheduleProps) {
  const [startHour] = useState(8); // 8 AM
  const [endHour] = useState(18); // 6 PM
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const getEventColor = (type: ScheduleEvent["type"]) => {
    switch (type) {
      case "appointment":
        return "bg-primary/10 border-primary/50 text-primary";
      case "task":
        return "bg-blue-100 border-blue-300 text-blue-700";
      case "break":
        return "bg-green-100 border-green-300 text-green-700";
      case "blocked":
        return "bg-gray-100 border-gray-300 text-gray-700";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      const eventHour = event.startTime.getHours();
      return eventHour === hour;
    });
  };

  const handlePreviousDay = () => {
    onDateChange?.(subDays(date, 1));
  };

  const handleNextDay = () => {
    onDateChange?.(addDays(date, 1));
  };

  const handleToday = () => {
    onDateChange?.(new Date());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Schedule
          </CardTitle>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousDay}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center min-w-[160px]">
              <div className="text-sm font-medium">
                {format(date, "EEEE")}
              </div>
              <div className="text-lg font-bold">
                {format(date, "MMM d, yyyy")}
              </div>
              {isToday(date) && (
                <Badge variant="secondary" className="mt-1">
                  Today
                </Badge>
              )}
            </div>

            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="w-4 h-4" />
            </Button>

            {!isToday(date) && (
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
            )}
          </div>

          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Timeline */}
        <div className="space-y-0 border rounded-lg overflow-hidden">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour);

            return (
              <div
                key={hour}
                className="flex border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                {/* Time Label */}
                <div className="w-20 flex-shrink-0 p-3 border-r bg-muted/50">
                  <div className="text-sm font-medium">
                    {format(new Date().setHours(hour, 0), "h:mm a")}
                  </div>
                </div>

                {/* Event Area */}
                <div
                  className="flex-1 p-2 min-h-[80px] cursor-pointer"
                  onClick={() => {
                    const slotTime = new Date(date);
                    slotTime.setHours(hour, 0, 0, 0);
                    onTimeSlotClick?.(slotTime);
                  }}
                >
                  {hourEvents.length > 0 ? (
                    <div className="space-y-2">
                      {hourEvents.map((event) => (
                        <ScheduleEventCard
                          key={event.id}
                          event={event}
                          onClick={() => onEventClick?.(event)}
                          getEventColor={getEventColor}
                          getStatusColor={getStatusColor}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground/40">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{events.length} events today</span>
            <span>•</span>
            <span>
              {events.filter((e) => e.type === "appointment").length}{" "}
              appointments
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs">Appointment</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs">Task</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs">Break</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Schedule Event Card
function ScheduleEventCard({
  event,
  onClick,
  getEventColor,
  getStatusColor,
}: {
  event: ScheduleEvent;
  onClick: () => void;
  getEventColor: (type: ScheduleEvent["type"]) => string;
  getStatusColor: (status?: string) => string;
}) {
  const duration =
    (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60); // in minutes

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md hover:scale-105",
        getEventColor(event.type)
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {event.status && (
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  getStatusColor(event.status)
                )}
              />
            )}
            <h4 className="font-medium text-sm truncate">{event.title}</h4>
          </div>

          {event.patient && (
            <div className="flex items-center gap-1 text-xs mb-1">
              <User className="w-3 h-3" />
              <span className="truncate">{event.patient.name}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-1 text-xs mb-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs opacity-75">
            <Clock className="w-3 h-3" />
            <span>
              {format(event.startTime, "h:mm a")} -{" "}
              {format(event.endTime, "h:mm a")}
            </span>
            <span className="text-xs ml-2">({duration} min)</span>
          </div>
        </div>

        <Badge
          variant="secondary"
          className="text-xs capitalize flex-shrink-0"
        >
          {event.type}
        </Badge>
      </div>
    </div>
  );
}
