/**
 * Public Online Booking Portal
 *
 * Beautiful, user-friendly booking interface for patients to:
 * - View available appointments
 * - Book appointments online
 * - Receive instant confirmation
 * - Manage their bookings
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Glasses,
  Contact,
} from "lucide-react";
import { format, addDays } from "date-fns";

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  providerId: string;
  providerName: string;
}

interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  description: string;
  icon: any;
  price?: string;
}

const appointmentTypes: AppointmentType[] = [
  {
    id: "eye_exam",
    name: "Eye Examination",
    duration: 30,
    description: "Comprehensive eye health check and prescription update",
    icon: Eye,
    price: "£25",
  },
  {
    id: "contact_lens",
    name: "Contact Lens Fitting",
    duration: 45,
    description: "Contact lens trial, fitting, and aftercare guidance",
    icon: Contact,
    price: "£35",
  },
  {
    id: "frame_selection",
    name: "Frame Selection & Dispensing",
    duration: 20,
    description: "Expert help choosing the perfect frames for you",
    icon: Glasses,
  },
  {
    id: "follow_up",
    name: "Follow-up Appointment",
    duration: 15,
    description: "Review of previous examination or prescription",
    icon: CheckCircle2,
  },
];

export default function OnlineBookingPortal() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const { toast } = useToast();

  // Patient details
  const [patientDetails, setPatientDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    notes: "",
  });

  useEffect(() => {
    if (selectedDate && selectedType) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedType]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedType) return;

    setLoading(true);
    try {
      // This would call your API
      // Fetch available time slots from API
      const response = await fetch(`/api/public/booking/slots?date=${selectedDate}&type=${selectedType.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available time slots');
      }
      
      const data = await response.json();
      const availableSlots: TimeSlot[] = data.slots || [];

      setAvailableSlots(availableSlots);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !selectedType) return;

    setLoading(true);
    try {
      // This would call your API
      // const response = await fetch('/api/public/booking/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...patientDetails,
      //     appointmentType: selectedType.id,
      //     scheduledAt: selectedSlot.start,
      //     duration: selectedType.duration,
      //     providerId: selectedSlot.providerId,
      //   }),
      // });

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1500));

      setBookingComplete(true);
      toast({
        title: "Booking Confirmed!",
        description: "You'll receive a confirmation email shortly.",
      });
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Appointment Confirmed!</h1>
            <div className="space-y-3 text-left max-w-md mx-auto mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {selectedSlot && format(selectedSlot.start, "EEEE, MMMM do 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Appointment Type</p>
                  <p className="font-medium">{selectedType?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium">{selectedSlot?.providerName}</p>
                </div>
              </div>
            </div>
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Please arrive 10 minutes before your appointment. A confirmation email
                has been sent to {patientDetails.email}.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.print()}>Print Confirmation</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Book Another Appointment
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Book Your Appointment</h1>
          <p className="text-muted-foreground text-lg">
            Simple, fast, and convenient online booking
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      step > num ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="p-8">
          {/* Step 1: Select Appointment Type */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                What type of appointment do you need?
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {appointmentTypes.map((type) => (
                  <Card
                    key={type.id}
                    className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                      selectedType?.id === type.id
                        ? "border-2 border-primary bg-primary/5"
                        : "border"
                    }`}
                    onClick={() => setSelectedType(type)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <type.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{type.name}</h3>
                          {type.price && (
                            <Badge variant="secondary">{type.price}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {type.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{type.duration} minutes</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  size="lg"
                  onClick={() => setStep(2)}
                  disabled={!selectedType}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Choose your preferred date and time
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <Label className="mb-3 block">Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < new Date() || date > addDays(new Date(), 60)
                    }
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <Label className="mb-3 block">Available Time Slots</Label>
                  {!selectedDate ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Please select a date first</p>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Loading available slots...
                      </p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No slots available</AlertTitle>
                      <AlertDescription>
                        Please try a different date
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={
                            selectedSlot?.start === slot.start
                              ? "default"
                              : "outline"
                          }
                          className="w-full justify-between"
                          onClick={() => setSelectedSlot(slot)}
                          disabled={!slot.available}
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {format(slot.start, "h:mm a")} -{" "}
                            {format(slot.end, "h:mm a")}
                          </span>
                          {slot.available ? (
                            <Badge variant="secondary">Available</Badge>
                          ) : (
                            <Badge variant="destructive">Booked</Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={() => setStep(3)}
                  disabled={!selectedSlot}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Patient Details */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Your contact information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={patientDetails.firstName}
                    onChange={(e) =>
                      setPatientDetails({ ...patientDetails, firstName: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={patientDetails.lastName}
                    onChange={(e) =>
                      setPatientDetails({ ...patientDetails, lastName: e.target.value })
                    }
                    placeholder="Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={patientDetails.email}
                    onChange={(e) =>
                      setPatientDetails({ ...patientDetails, email: e.target.value })
                    }
                    placeholder="john.smith@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={patientDetails.phone}
                    onChange={(e) =>
                      setPatientDetails({ ...patientDetails, phone: e.target.value })
                    }
                    placeholder="07123 456789"
                  />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={patientDetails.dateOfBirth}
                    onChange={(e) =>
                      setPatientDetails({ ...patientDetails, dateOfBirth: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={patientDetails.notes}
                    onChange={(e) =>
                      setPatientDetails({ ...patientDetails, notes: e.target.value })
                    }
                    placeholder="Any specific concerns or requirements?"
                  />
                </div>
              </div>

              {/* Booking Summary */}
              <Card className="mt-6 p-6 bg-muted">
                <h3 className="font-semibold mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Appointment Type:</span>
                    <span className="font-medium">{selectedType?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span className="font-medium">
                      {selectedSlot && format(selectedSlot.start, "MMM do, h:mm a")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{selectedType?.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-medium">{selectedSlot?.providerName}</span>
                  </div>
                  {selectedType?.price && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">{selectedType.price}</span>
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleBooking}
                  disabled={
                    loading ||
                    !patientDetails.firstName ||
                    !patientDetails.lastName ||
                    !patientDetails.email ||
                    !patientDetails.phone ||
                    !patientDetails.dateOfBirth
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Contact Information */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Need help? Call us at{" "}
            <a href="tel:01234567890" className="text-primary font-medium">
              01234 567 890
            </a>{" "}
            or email{" "}
            <a href="mailto:info@practice.com" className="text-primary font-medium">
              info@practice.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
