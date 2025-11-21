import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, Plus, User, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addDays, startOfWeek, addHours, isSameDay } from "date-fns";

interface TestRoom {
  id: string;
  roomName: string;
  roomCode: string | null;
  currentStatus: string;
}

interface Booking {
  id: string;
  testRoomId: string;
  startTime: Date;
  endTime: Date;
  appointmentType: string | null;
  status: string;
  patient?: {
    name: string;
  };
  user: {
    name: string;
  };
}

interface TestRoomSchedulerProps {
  testRoomId?: string;
  onBookingCreated?: (booking: Booking) => void;
}

export function TestRoomScheduler({ testRoomId, onBookingCreated }: TestRoomSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState(testRoomId || "");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const { toast } = useToast();

  const { data: testRooms } = useQuery<TestRoom[]>({
    queryKey: ["/api/ecp/test-rooms"],
  });

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/ecp/test-room-bookings", selectedDate, selectedRoom],
    enabled: !!selectedRoom,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ecp/test-room-bookings", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/test-room-bookings"] });
      toast({
        title: "Booking Created",
        description: "Test room has been booked successfully.",
      });
      setIsCreateDialogOpen(false);
      setSelectedSlot(null);
      onBookingCreated?.(data);
    },
    onError: (error: Error) => {
      console.error("Booking creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/ecp/test-room-bookings/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/test-room-bookings"] });
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot || !selectedRoom) return;

    const formData = new FormData(e.currentTarget);
    
    const data = {
      testRoomId: selectedRoom,
      bookingDate: selectedDate.toISOString(),
      startTime: selectedSlot.start.toISOString(),
      endTime: selectedSlot.end.toISOString(),
      appointmentType: formData.get("appointmentType") as string || null,
    };

    createBookingMutation.mutate(data);
  };

  const handleSlotClick = (hour: number) => {
    const start = new Date(selectedDate);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 1);
    
    // Check for conflicts
    const hasConflict = bookings?.some(booking => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return (
        (start >= bookingStart && start < bookingEnd) ||
        (end > bookingStart && end <= bookingEnd) ||
        (start <= bookingStart && end >= bookingEnd)
      );
    });

    if (hasConflict) {
      toast({
        title: "Time Slot Unavailable",
        description: "This time slot is already booked.",
        variant: "destructive",
      });
      return;
    }

    setSelectedSlot({ start, end });
    setIsCreateDialogOpen(true);
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getBookingsForSlot = (hour: number) => {
    return bookings?.filter(booking => {
      const bookingStart = new Date(booking.startTime);
      return (
        isSameDay(bookingStart, selectedDate) &&
        bookingStart.getHours() === hour
      );
    }) || [];
  };

  const workingHours = Array.from({ length: 12 }, (_, i) => i + 9); // 9 AM to 8 PM

  return (
    <div className="space-y-6">
      {/* Room & Date Selection */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="room-select">Test Room</Label>
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger id="room-select">
              <SelectValue placeholder="Select test room..." />
            </SelectTrigger>
            <SelectContent>
              {testRooms?.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.roomName} {room.roomCode && `(${room.roomCode})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="date-select">Date</Label>
          <Input
            id="date-select"
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
        </div>

        <div className="flex gap-2 pt-6">
          <Button
            variant="outline"
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {!selectedRoom ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Test Room</h3>
            <p className="text-muted-foreground">
              Choose a test room to view and manage bookings
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="h-96 bg-muted animate-pulse rounded" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardTitle>
            <CardDescription>
              Click on a time slot to create a booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workingHours.map((hour) => {
                const slotBookings = getBookingsForSlot(hour);
                const hasBooking = slotBookings.length > 0;

                return (
                  <div
                    key={hour}
                    className={`p-4 border rounded-lg transition-colors ${
                      hasBooking
                        ? "bg-primary/10 border-primary cursor-not-allowed"
                        : "hover:bg-accent cursor-pointer"
                    }`}
                    onClick={() => !hasBooking && handleSlotClick(hour)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(addHours(new Date().setHours(hour, 0, 0, 0), 0), "h:mm a")} -{" "}
                          {format(addHours(new Date().setHours(hour, 0, 0, 0), 1), "h:mm a")}
                        </span>
                      </div>
                      {hasBooking ? (
                        <div className="flex items-center gap-2">
                          {slotBookings.map((booking) => (
                            <div key={booking.id} className="flex items-center gap-2">
                              <Badge variant="default">
                                {booking.patient?.name || "No patient"}
                              </Badge>
                              <Badge variant="outline">
                                <User className="h-3 w-3 mr-1" />
                                {booking.user.name}
                              </Badge>
                              {booking.appointmentType && (
                                <Badge variant="secondary">
                                  {booking.appointmentType}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelBookingMutation.mutate(booking.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Booking Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
              <DialogDescription>
                {selectedSlot && (
                  <>
                    Book test room for{" "}
                    {format(selectedSlot.start, "h:mm a")} -{" "}
                    {format(selectedSlot.end, "h:mm a")}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentType">Appointment Type</Label>
                <Select name="appointmentType">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine Eye Test">Routine Eye Test</SelectItem>
                    <SelectItem value="Contact Lens Fitting">Contact Lens Fitting</SelectItem>
                    <SelectItem value="Follow-up Examination">Follow-up Examination</SelectItem>
                    <SelectItem value="Emergency Appointment">Emergency Appointment</SelectItem>
                    <SelectItem value="Pediatric Examination">Pediatric Examination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedSlot(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBookingMutation.isPending}>
                {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
