/**
 * Modern Calendar Component
 * 
 * Beautiful calendar with drag-and-drop, color coding, and quick filters
 * Used for test room bookings and appointments
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Filter } from "lucide-react";
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
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type?: "appointment" | "booking" | "blocked";
  color?: string;
  patient?: {
    name: string;
  };
  room?: {
    name: string;
  };
}

interface ModernCalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
}

export function ModernCalendar({
  events,
  onEventClick,
  onDateClick,
  onEventDrop,
}: ModernCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [filter, setFilter] = useState<string>("all");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const dateFormatDay = "d";

  const onDateClickHandler = (day: Date) => {
    setSelectedDate(day);
    onDateClick?.(day);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = typeof event.start === 'string' ? parseISO(event.start) : event.start;
      return isSameDay(eventDate, date);
    });
  };

  const getEventColor = (type?: string) => {
    switch (type) {
      case "appointment":
        return "bg-blue-100 border-blue-300 text-blue-700";
      case "booking":
        return "bg-green-100 border-green-300 text-green-700";
      case "blocked":
        return "bg-red-100 border-red-300 text-red-700";
      default:
        return "bg-purple-100 border-purple-300 text-purple-700";
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">{format(currentMonth, dateFormat)}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
            >
              Day
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
            >
              Month
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "EEEE";
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          className="text-center py-3 text-sm font-semibold text-muted-foreground"
          key={i}
        >
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 border-b border-border">{days}</div>
    );
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, dateFormatDay);
        const cloneDay = day;
        const dayEvents = getEventsForDate(day);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isCurrentDay = isToday(day);

        days.push(
          <div
            className={cn(
              "min-h-[120px] border-r border-b border-border p-2 transition-colors cursor-pointer",
              !isCurrentMonth && "bg-muted/30",
              isSelected && "bg-primary/5 ring-2 ring-primary ring-inset",
              isCurrentMonth && "hover:bg-muted/50"
            )}
            key={day.toString()}
            onClick={() => onDateClickHandler(cloneDay)}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={cn(
                  "text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full",
                  !isCurrentMonth && "text-muted-foreground",
                  isCurrentDay && "bg-primary text-primary-foreground"
                )}
              >
                {formattedDate}
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
                    "text-xs p-1.5 rounded border cursor-pointer transition-all hover:shadow-md hover:scale-105",
                    getEventColor(event.type)
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
                    {format(typeof event.start === 'string' ? parseISO(event.start) : event.start, 'HH:mm')}
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
    return <div>{rows}</div>;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
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
    { id: "all", label: "All", count: 0 },
    { id: "today", label: "Today", count: 0 },
    { id: "tomorrow", label: "Tomorrow", count: 0 },
    { id: "week", label: "This Week", count: 0 },
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
            {filter.count > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filter.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
