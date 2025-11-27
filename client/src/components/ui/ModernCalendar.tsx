import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type?: 'appointment' | 'booking' | 'blocked' | 'available';
  status?: 'confirmed' | 'pending' | 'cancelled';
  description?: string;
  location?: string;
  attendee?: string;
  color?: string;
}

interface ModernCalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date) => void;
  view?: 'month' | 'week' | 'day';
  minTime?: number; // Hour (0-23)
  maxTime?: number; // Hour (0-23)
  slotDuration?: number; // Minutes
  className?: string;
  showWeekends?: boolean;
  highlightToday?: boolean;
}

export function ModernCalendar({
  events = [],
  onEventClick,
  onDateClick,
  onEventDrop,
  view = 'week',
  minTime = 8,
  maxTime = 20,
  slotDuration = 30,
  className,
  showWeekends = true,
  highlightToday = true,
}: ModernCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const date = new Date(currentDate);
    date.setHours(minTime, 0, 0, 0);

    while (date.getHours() < maxTime) {
      slots.push(new Date(date));
      date.setMinutes(date.getMinutes() + slotDuration);
    }

    return slots;
  }, [currentDate, minTime, maxTime, slotDuration]);

  // Get days for current view
  const days = useMemo(() => {
    const result: Date[] = [];

    if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      for (let i = 0; i < 7; i++) {
        if (!showWeekends && (i === 0 || i === 6)) continue;
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        result.push(day);
      }
    } else if (view === 'day') {
      result.push(new Date(currentDate));
    } else {
      // Month view - simplified for now
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        result.push(new Date(d));
      }
    }

    return result;
  }, [currentDate, view, showWeekends]);

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format header based on view
  const formatHeader = () => {
    if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get events for a specific time slot and day
  const getEventsForSlot = (day: Date, timeSlot: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      const slotDate = new Date(day);
      slotDate.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);

      const slotEnd = new Date(slotDate);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      return (
        eventStart.toDateString() === day.toDateString() &&
        ((eventStart >= slotDate && eventStart < slotEnd) || (eventStart <= slotDate && eventEnd > slotDate))
      );
    });
  };

  // Get event color based on type/status
  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color;

    if (event.status === 'cancelled') return 'bg-gray-200 text-gray-600 border-gray-300';
    if (event.status === 'pending') return 'bg-yellow-100 text-yellow-800 border-yellow-300';

    switch (event.type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'booking':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (day: Date, timeSlot: Date) => {
    if (draggedEvent && onEventDrop) {
      const newStart = new Date(day);
      newStart.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);
      onEventDrop(draggedEvent, newStart);
    }
    setDraggedEvent(null);
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">{formatHeader()}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="hidden sm:inline-flex"
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Days Header */}
            <div className="grid gap-px bg-muted" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
              <div className="bg-background p-2"></div>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'bg-background p-2 text-center border-b',
                    highlightToday && isToday(day) && 'bg-primary/10'
                  )}
                >
                  <div className="text-sm font-medium">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div
                    className={cn(
                      'text-2xl font-bold mt-1',
                      highlightToday && isToday(day) && 'text-primary'
                    )}
                  >
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="grid gap-px bg-muted" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
              {timeSlots.map((timeSlot) => (
                <React.Fragment key={timeSlot.toISOString()}>
                  {/* Time Label */}
                  <div className="bg-background p-2 text-right text-sm text-muted-foreground border-r">
                    {timeSlot.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </div>

                  {/* Day Slots */}
                  {days.map((day) => {
                    const slotEvents = getEventsForSlot(day, timeSlot);

                    return (
                      <div
                        key={`${day.toISOString()}-${timeSlot.toISOString()}`}
                        className={cn(
                          'bg-background p-1 min-h-[60px] border-r border-b relative',
                          'hover:bg-muted/50 transition-colors cursor-pointer'
                        )}
                        onClick={() => {
                          if (onDateClick) {
                            const clickedDate = new Date(day);
                            clickedDate.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);
                            onDateClick(clickedDate);
                          }
                        }}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(day, timeSlot)}
                      >
                        <AnimatePresence>
                          {slotEvents.map((event) => {
                            const eventStart = new Date(event.start);
                            const eventEnd = new Date(event.end);
                            const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
                            const slots = Math.ceil(durationMinutes / slotDuration);

                            // Only render on the first slot of the event
                            if (eventStart.getHours() !== timeSlot.getHours() || eventStart.getMinutes() !== timeSlot.getMinutes()) {
                              return null;
                            }

                            return (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                draggable
                                onDragStart={() => handleDragStart(event)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onEventClick) onEventClick(event);
                                }}
                                className={cn(
                                  'p-2 rounded border-l-4 cursor-move shadow-sm',
                                  'hover:shadow-md transition-shadow',
                                  getEventColor(event)
                                )}
                                style={{
                                  height: `${slots * 60 - 4}px`,
                                }}
                              >
                                <div className="text-xs font-semibold truncate">{event.title}</div>
                                {event.attendee && (
                                  <div className="flex items-center gap-1 mt-1 text-[10px]">
                                    <User className="w-3 h-3" />
                                    <span className="truncate">{event.attendee}</span>
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-1 mt-0.5 text-[10px]">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 mt-1 text-[10px]">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {eventStart.toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true,
                                    })}
                                    {' - '}
                                    {eventEnd.toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true,
                                    })}
                                  </span>
                                </div>
                                {event.status && (
                                  <Badge variant="outline" className="mt-1 text-[10px] h-4">
                                    {event.status}
                                  </Badge>
                                )}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Export types
export type { ModernCalendarProps };
