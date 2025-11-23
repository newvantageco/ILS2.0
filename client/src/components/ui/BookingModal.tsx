/**
 * Enhanced Booking Modal Component
 *
 * Beautiful animated modal for creating and editing appointments/bookings
 * Features: slide-up animation, form validation, date/time picker, patient search
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search,
  Stethoscope,
  Phone,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { format } from "date-fns";

export interface BookingData {
  id?: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: "eye-exam" | "follow-up" | "contact-lens" | "consultation" | "other";
  room?: string;
  notes?: string;
  status?: "confirmed" | "pending" | "cancelled";
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: BookingData) => Promise<void>;
  initialData?: Partial<BookingData>;
  selectedDate?: Date;
  patients?: Array<{ id: string; name: string; phone?: string; email?: string }>;
  rooms?: Array<{ id: string; name: string; available: boolean }>;
  mode?: "create" | "edit";
}

const appointmentTypes = [
  { value: "eye-exam", label: "Eye Examination", duration: 30, color: "bg-blue-500" },
  { value: "follow-up", label: "Follow-up Visit", duration: 15, color: "bg-green-500" },
  { value: "contact-lens", label: "Contact Lens Fitting", duration: 45, color: "bg-purple-500" },
  { value: "consultation", label: "Consultation", duration: 20, color: "bg-orange-500" },
  { value: "other", label: "Other", duration: 30, color: "bg-gray-500" },
];

const timeSlots = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    y: 100,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    }
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    transition: { duration: 0.2 }
  },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
};

export function BookingModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  selectedDate,
  patients = [],
  rooms = [],
  mode = "create",
}: BookingModalProps) {
  const [formData, setFormData] = useState<BookingData>({
    date: selectedDate || new Date(),
    startTime: "09:00",
    endTime: "09:30",
    type: "eye-exam",
    status: "pending",
    ...initialData,
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Update form when initialData or selectedDate changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: selectedDate || initialData?.date || new Date(),
        startTime: initialData?.startTime || "09:00",
        endTime: initialData?.endTime || "09:30",
        type: initialData?.type || "eye-exam",
        status: initialData?.status || "pending",
        ...initialData,
      });
      setErrors({});
      setSuccessMessage("");
    }
  }, [isOpen, initialData, selectedDate]);

  // Auto-calculate end time based on appointment type
  const handleTypeChange = (type: BookingData["type"]) => {
    const typeConfig = appointmentTypes.find(t => t.value === type);
    if (typeConfig) {
      const [hours, minutes] = formData.startTime.split(":").map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + typeConfig.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      setFormData(prev => ({
        ...prev,
        type,
        endTime: `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`,
      }));
    }
  };

  const handleStartTimeChange = (time: string) => {
    const typeConfig = appointmentTypes.find(t => t.value === formData.type);
    const duration = typeConfig?.duration || 30;
    const [hours, minutes] = time.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    setFormData(prev => ({
      ...prev,
      startTime: time,
      endTime: `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`,
    }));
  };

  const selectPatient = (patient: { id: string; name: string; phone?: string; email?: string }) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      patientEmail: patient.email,
    }));
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientName && !formData.patientId) {
      newErrors.patient = "Please select or enter a patient name";
    }
    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }
    if (!formData.room && rooms.length > 0) {
      newErrors.room = "Please select a room";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      setSuccessMessage(mode === "create" ? "Appointment booked successfully!" : "Appointment updated!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setErrors({ submit: "Failed to save appointment. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = appointmentTypes.find(t => t.value === formData.type);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl bg-card rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary to-primary/80 px-6 py-5 text-primary-foreground">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold">
                  {mode === "create" ? "New Appointment" : "Edit Appointment"}
                </h2>
                <p className="text-primary-foreground/80 mt-1">
                  {format(formData.date, "EEEE, MMMM do, yyyy")}
                </p>
              </motion.div>

              {/* Appointment Type Indicator */}
              {selectedType && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="absolute right-16 bottom-4"
                >
                  <Badge className={cn("text-white", selectedType.color)}>
                    <Stethoscope className="w-3 h-3 mr-1" />
                    {selectedType.duration} min
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-50 border-b border-green-200 px-6 py-4 flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Content */}
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="p-6 max-h-[60vh] overflow-y-auto"
            >
              <div className="space-y-5">
                {/* Patient Search */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Patient
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patient by name..."
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setShowPatientDropdown(true);
                        if (!formData.patientId) {
                          setFormData(prev => ({ ...prev, patientName: e.target.value }));
                        }
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className={cn("pl-10", errors.patient && "border-red-500")}
                    />
                    {/* Patient Dropdown */}
                    <AnimatePresence>
                      {showPatientDropdown && filteredPatients.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {filteredPatients.map((patient) => (
                            <motion.div
                              key={patient.id}
                              whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                              onClick={() => selectPatient(patient)}
                              className="px-4 py-3 cursor-pointer border-b border-border last:border-0"
                            >
                              <div className="font-medium">{patient.name}</div>
                              {patient.phone && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {patient.phone}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {errors.patient && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.patient}
                    </p>
                  )}
                </motion.div>

                {/* Appointment Type */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-muted-foreground" />
                    Appointment Type
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {appointmentTypes.map((type) => (
                      <motion.button
                        key={type.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTypeChange(type.value as BookingData["type"])}
                        className={cn(
                          "p-3 rounded-lg border-2 text-left transition-all",
                          formData.type === type.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", type.color)} />
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {type.duration} minutes
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Time Selection */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Start Time
                    </Label>
                    <Select
                      value={formData.startTime}
                      onValueChange={handleStartTimeChange}
                    >
                      <SelectTrigger className={cn(errors.startTime && "border-red-500")}>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      End Time
                    </Label>
                    <Select
                      value={formData.endTime}
                      onValueChange={(time) => setFormData(prev => ({ ...prev, endTime: time }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                {/* Room Selection */}
                {rooms.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Room
                    </Label>
                    <Select
                      value={formData.room}
                      onValueChange={(room) => setFormData(prev => ({ ...prev, room }))}
                    >
                      <SelectTrigger className={cn(errors.room && "border-red-500")}>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem
                            key={room.id}
                            value={room.id}
                            disabled={!room.available}
                          >
                            <div className="flex items-center gap-2">
                              <span>{room.name}</span>
                              {!room.available && (
                                <Badge variant="secondary" className="text-xs">Occupied</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.room && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.room}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Notes */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Notes (optional)
                  </Label>
                  <Textarea
                    placeholder="Add any notes or special requirements..."
                    value={formData.notes || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </motion.div>

                {/* Error Message */}
                {errors.submit && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-red-700"
                  >
                    <AlertCircle className="w-5 h-5" />
                    {errors.submit}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Footer */}
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      {mode === "create" ? "Book Appointment" : "Save Changes"}
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BookingModal;
