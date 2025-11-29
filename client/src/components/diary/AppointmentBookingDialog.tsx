/**
 * Appointment Booking Dialog
 *
 * A comprehensive dialog for creating new appointments with:
 * - Patient search and selection
 * - Date and time picker
 * - Appointment type selection
 * - Duration configuration
 * - Notes and additional options
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Video,
  Bell,
  Search,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMinutes, setHours, setMinutes, parseISO } from "date-fns";
import { useCreateAppointment, CreateAppointmentInput } from "@/hooks/useIntegratedAppointments";
import { useToast } from "@/hooks/use-toast";

// Appointment types with labels and colors
const APPOINTMENT_TYPES = [
  { value: "eye_examination", label: "Eye Examination", color: "bg-blue-100 text-blue-700", duration: 30 },
  { value: "contact_lens_fitting", label: "Contact Lens Fitting", color: "bg-purple-100 text-purple-700", duration: 45 },
  { value: "frame_selection", label: "Frame Selection", color: "bg-pink-100 text-pink-700", duration: 30 },
  { value: "follow_up", label: "Follow Up", color: "bg-green-100 text-green-700", duration: 15 },
  { value: "emergency", label: "Emergency", color: "bg-red-100 text-red-700", duration: 30 },
  { value: "consultation", label: "Consultation", color: "bg-yellow-100 text-yellow-700", duration: 20 },
  { value: "dispensing", label: "Dispensing", color: "bg-orange-100 text-orange-700", duration: 20 },
  { value: "collection", label: "Collection", color: "bg-teal-100 text-teal-700", duration: 15 },
] as const;

// Time slots for appointment scheduling
const generateTimeSlots = (startHour: number = 8, endHour: number = 18, intervalMinutes: number = 15) => {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Duration options in minutes
const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 20, label: "20 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

interface Patient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
}

interface AppointmentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  initialTime?: string;
  onSuccess?: () => void;
}

export function AppointmentBookingDialog({
  open,
  onOpenChange,
  initialDate,
  initialTime,
  onSuccess,
}: AppointmentBookingDialogProps) {
  const { toast } = useToast();
  const createAppointment = useCreateAppointment();

  // Form state
  const [step, setStep] = useState<"patient" | "details" | "confirm">("patient");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Appointment details
  const [appointmentType, setAppointmentType] = useState<string>("eye_examination");
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || "09:00");
  const [duration, setDuration] = useState<number>(30);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualMeetingLink, setVirtualMeetingLink] = useState("");
  const [reminderType, setReminderType] = useState<string>("email");

  // Fetch patients on mount
  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open]);

  // Update duration when appointment type changes
  useEffect(() => {
    const typeConfig = APPOINTMENT_TYPES.find((t) => t.value === appointmentType);
    if (typeConfig) {
      setDuration(typeConfig.duration);
      if (!title) {
        setTitle(typeConfig.label);
      }
    }
  }, [appointmentType]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("patient");
      setSelectedPatient(null);
      setPatientSearch("");
      setAppointmentType("eye_examination");
      setSelectedDate(format(new Date(), "yyyy-MM-dd"));
      setSelectedTime("09:00");
      setDuration(30);
      setTitle("");
      setNotes("");
      setLocation("");
      setIsVirtual(false);
      setVirtualMeetingLink("");
      setReminderType("email");
    }
  }, [open]);

  // Update initial values when provided
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(format(initialDate, "yyyy-MM-dd"));
    }
    if (initialTime) {
      setSelectedTime(initialTime);
    }
  }, [initialDate, initialTime]);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await fetch("/api/patients", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch patients");
      const data = await response.json();
      setPatients(
        data.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          dateOfBirth: p.dateOfBirth,
        }))
      );
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoadingPatients(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q)
    );
  });

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }

    // Parse date and time
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = addMinutes(startTime, duration);

    const appointmentData: CreateAppointmentInput = {
      patientId: selectedPatient.id,
      title: title || APPOINTMENT_TYPES.find((t) => t.value === appointmentType)?.label || "Appointment",
      type: appointmentType as CreateAppointmentInput["type"],
      startTime,
      endTime,
      duration,
      notes: notes || undefined,
      location: location || undefined,
      isVirtual,
      virtualMeetingLink: isVirtual ? virtualMeetingLink : undefined,
      reminderType: reminderType as CreateAppointmentInput["reminderType"],
    };

    try {
      await createAppointment.mutateAsync(appointmentData);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getAppointmentTypeConfig = (type: string) => {
    return APPOINTMENT_TYPES.find((t) => t.value === type);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Book Appointment
          </DialogTitle>
          <DialogDescription>
            {step === "patient" && "Select a patient for this appointment"}
            {step === "details" && "Configure appointment details"}
            {step === "confirm" && "Review and confirm the appointment"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-2">
          {["patient", "details", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["patient", "details", "confirm"].indexOf(step) > i
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {["patient", "details", "confirm"].indexOf(step) > i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1",
                    ["patient", "details", "confirm"].indexOf(step) > i
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Patient Selection */}
          {step === "patient" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patients by name, email, or phone..."
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                {loadingPatients ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{patientSearch ? "No patients found" : "No patients available"}</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          selectedPatient?.id === patient.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              selectedPatient?.id === patient.id
                                ? "bg-primary-foreground/20"
                                : "bg-primary/10"
                            )}
                          >
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{patient.name}</div>
                            <div className="text-sm opacity-75 truncate">
                              {patient.email || patient.phone || "No contact info"}
                            </div>
                          </div>
                          {selectedPatient?.id === patient.id && (
                            <Check className="w-5 h-5 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Step 2: Appointment Details */}
          {step === "details" && (
            <div className="space-y-6">
              {/* Selected Patient Summary */}
              {selectedPatient && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedPatient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPatient.email || selectedPatient.phone}
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Type */}
              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {APPOINTMENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAppointmentType(type.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        appointmentType === type.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <Badge className={cn("mb-1", type.color)}>{type.label}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Default: {type.duration} min
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {format(setMinutes(setHours(new Date(), parseInt(time.split(":")[0])), parseInt(time.split(":")[1])), "h:mm a")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={getAppointmentTypeConfig(appointmentType)?.label || "Appointment"}
                />
              </div>

              {/* Location / Virtual */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Location</Label>
                  <Button
                    variant={isVirtual ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsVirtual(!isVirtual)}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Virtual
                  </Button>
                </div>
                {isVirtual ? (
                  <Input
                    value={virtualMeetingLink}
                    onChange={(e) => setVirtualMeetingLink(e.target.value)}
                    placeholder="Enter meeting link (Zoom, Teams, etc.)"
                  />
                ) : (
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Room 1, Exam Room A"
                  />
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>

              {/* Reminder */}
              <div className="space-y-2">
                <Label>Send Reminder</Label>
                <Select value={reminderType} onValueChange={setReminderType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="push_notification">Push Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirm" && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                {/* Patient */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Patient</div>
                    <div className="font-medium">{selectedPatient?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPatient?.email || selectedPatient?.phone}
                    </div>
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <Badge className={getAppointmentTypeConfig(appointmentType)?.color}>
                      {getAppointmentTypeConfig(appointmentType)?.label}
                    </Badge>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Date & Time</div>
                    <div className="font-medium">
                      {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
                    </div>
                    <div className="text-sm">
                      {format(
                        setMinutes(
                          setHours(new Date(), parseInt(selectedTime.split(":")[0])),
                          parseInt(selectedTime.split(":")[1])
                        ),
                        "h:mm a"
                      )}{" "}
                      - {duration} minutes
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  {isVirtual ? (
                    <Video className="w-5 h-5 text-muted-foreground mt-0.5" />
                  ) : (
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {isVirtual ? "Virtual Meeting" : "Location"}
                    </div>
                    <div className="font-medium">
                      {isVirtual
                        ? virtualMeetingLink || "Link to be provided"
                        : location || "To be assigned"}
                    </div>
                  </div>
                </div>

                {/* Reminder */}
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Reminder</div>
                    <div className="font-medium capitalize">{reminderType.replace("_", " ")}</div>
                  </div>
                </div>

                {/* Notes */}
                {notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Notes</div>
                      <div className="text-sm">{notes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between border-t pt-4">
          <div>
            {step !== "patient" && (
              <Button
                variant="outline"
                onClick={() =>
                  setStep(step === "confirm" ? "details" : "patient")
                }
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === "patient" && (
              <Button onClick={() => setStep("details")} disabled={!selectedPatient}>
                Next
              </Button>
            )}
            {step === "details" && (
              <Button onClick={() => setStep("confirm")}>Review</Button>
            )}
            {step === "confirm" && (
              <Button onClick={handleSubmit} disabled={createAppointment.isPending}>
                {createAppointment.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
