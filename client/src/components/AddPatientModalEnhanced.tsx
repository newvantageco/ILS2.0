import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, User, Activity, Heart, Phone, Settings } from "lucide-react";

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PatientFormData {
  // Basic Information
  name: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  mobilePhone: string;
  nhsNumber: string;
  
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
  postcode: string;
  
  // Reference
  customerReferenceLabel: string;
  customerReferenceNumber: string;
  
  // Clinical Information
  previousOptician: string;
  gpName: string;
  gpPractice: string;
  gpPhone: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  emergencyContactEmail: string;
  
  // Medical History
  currentMedications: string;
  allergies: string;
  familyOcularHistory: string;
  
  // Lifestyle & Requirements
  occupation: string;
  vduUser: boolean;
  vduHoursPerDay: string;
  drivingRequirement: boolean;
  contactLensWearer: boolean;
  contactLensType: string;
  
  // Communication Preferences
  preferredContactMethod: string;
  preferredAppointmentTime: string;
  
  // Consent
  marketingConsent: boolean;
  dataSharingConsent: boolean;
  
  // Notes
  patientNotes: string;
}

export default function AddPatientModalEnhanced({ open, onOpenChange }: AddPatientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    mobilePhone: "",
    nhsNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
    postcode: "",
    customerReferenceLabel: "",
    customerReferenceNumber: "",
    previousOptician: "",
    gpName: "",
    gpPractice: "",
    gpPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    emergencyContactEmail: "",
    currentMedications: "",
    allergies: "",
    familyOcularHistory: "",
    occupation: "",
    vduUser: false,
    vduHoursPerDay: "",
    drivingRequirement: false,
    contactLensWearer: false,
    contactLensType: "",
    preferredContactMethod: "email",
    preferredAppointmentTime: "morning",
    marketingConsent: false,
    dataSharingConsent: true,
    patientNotes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PatientFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Patient name is required";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (formData.nhsNumber && !/^\d{10}$/.test(formData.nhsNumber.replace(/\s/g, ""))) {
      newErrors.nhsNumber = "NHS number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name.trim(),
          dateOfBirth: data.dateOfBirth,
          email: data.email.trim() || null,
          phone: data.phone.trim() || null,
          mobilePhone: data.mobilePhone.trim() || null,
          nhsNumber: data.nhsNumber.replace(/\s/g, "") || null,
          addressLine1: data.addressLine1.trim() || null,
          addressLine2: data.addressLine2.trim() || null,
          city: data.city.trim() || null,
          county: data.county.trim() || null,
          postcode: data.postcode.trim() || null,
          fullAddress: {
            address: data.addressLine1.trim() || null,
            city: data.city.trim() || null,
            postcode: data.postcode.trim() || null,
          },
          customerReferenceLabel: data.customerReferenceLabel.trim() || null,
          customerReferenceNumber: data.customerReferenceNumber.trim() || null,
          previousOptician: data.previousOptician.trim() || null,
          gpName: data.gpName.trim() || null,
          gpPractice: data.gpPractice.trim() || null,
          gpPhone: data.gpPhone.trim() || null,
          emergencyContactName: data.emergencyContactName.trim() || null,
          emergencyContactPhone: data.emergencyContactPhone.trim() || null,
          emergencyContactRelationship: data.emergencyContactRelationship.trim() || null,
          emergencyContactEmail: data.emergencyContactEmail.trim() || null,
          currentMedications: data.currentMedications.trim() || null,
          allergies: data.allergies.trim() || null,
          familyOcularHistory: data.familyOcularHistory.trim() || null,
          occupation: data.occupation.trim() || null,
          vduUser: data.vduUser,
          vduHoursPerDay: data.vduHoursPerDay ? parseFloat(data.vduHoursPerDay) : null,
          drivingRequirement: data.drivingRequirement,
          contactLensWearer: data.contactLensWearer,
          contactLensType: data.contactLensType.trim() || null,
          preferredContactMethod: data.preferredContactMethod || "email",
          preferredAppointmentTime: data.preferredAppointmentTime || null,
          marketingConsent: data.marketingConsent,
          dataSharingConsent: data.dataSharingConsent,
          patientNotes: data.patientNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add patient");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient Added Successfully",
        description: "Comprehensive patient record created with all details.",
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      mobilePhone: "",
      nhsNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      county: "",
      postcode: "",
      customerReferenceLabel: "",
      customerReferenceNumber: "",
      previousOptician: "",
      gpName: "",
      gpPractice: "",
      gpPhone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      emergencyContactEmail: "",
      currentMedications: "",
      allergies: "",
      familyOcularHistory: "",
      occupation: "",
      vduUser: false,
      vduHoursPerDay: "",
      drivingRequirement: false,
      contactLensWearer: false,
      contactLensType: "",
      preferredContactMethod: "email",
      preferredAppointmentTime: "morning",
      marketingConsent: false,
      dataSharingConsent: true,
      patientNotes: "",
    });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      addPatientMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Patient - Comprehensive Record
          </DialogTitle>
          <DialogDescription>
            Complete patient information form. Fields marked with * are required. Timezone will be auto-detected from postcode.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="clinical" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Clinical</span>
              </TabsTrigger>
              <TabsTrigger value="lifestyle" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Lifestyle</span>
              </TabsTrigger>
              <TabsTrigger value="emergency" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Emergency</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BASIC INFORMATION */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Personal Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="John Smith"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className={errors.dateOfBirth ? "border-destructive" : ""}
                    />
                    {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nhsNumber">NHS Number</Label>
                    <Input
                      id="nhsNumber"
                      value={formData.nhsNumber}
                      onChange={(e) => handleChange("nhsNumber", e.target.value)}
                      placeholder="123 456 7890"
                      maxLength={12}
                      className={errors.nhsNumber ? "border-destructive" : ""}
                    />
                    {errors.nhsNumber && <p className="text-xs text-destructive">{errors.nhsNumber}</p>}
                    <p className="text-xs text-muted-foreground">10-digit NHS number</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="john.smith@example.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Home Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+44 20 1234 5678"
                      className={errors.phone ? "border-destructive" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobilePhone">Mobile Phone</Label>
                    <Input
                      id="mobilePhone"
                      type="tel"
                      value={formData.mobilePhone}
                      onChange={(e) => handleChange("mobilePhone", e.target.value)}
                      placeholder="+44 7700 900000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Address (Timezone auto-detected)</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input
                      id="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => handleChange("addressLine1", e.target.value)}
                      placeholder="123 High Street"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={formData.addressLine2}
                      onChange={(e) => handleChange("addressLine2", e.target.value)}
                      placeholder="Apartment, suite, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City/Town</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="London"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="county">County</Label>
                      <Input
                        id="county"
                        value={formData.county}
                        onChange={(e) => handleChange("county", e.target.value)}
                        placeholder="Greater London"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => handleChange("postcode", e.target.value.toUpperCase())}
                        placeholder="SW1A 1AA"
                      />
                      <p className="text-xs text-muted-foreground">Used for timezone detection</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Custom Reference (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerReferenceLabel">Reference Label</Label>
                    <Input
                      id="customerReferenceLabel"
                      value={formData.customerReferenceLabel}
                      onChange={(e) => handleChange("customerReferenceLabel", e.target.value)}
                      placeholder="e.g., Shopify ID, Insurance #"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerReferenceNumber">Reference Number</Label>
                    <Input
                      id="customerReferenceNumber"
                      value={formData.customerReferenceNumber}
                      onChange={(e) => handleChange("customerReferenceNumber", e.target.value)}
                      placeholder="Enter reference number"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: CLINICAL INFORMATION */}
            <TabsContent value="clinical" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Previous Eye Care</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="previousOptician">Previous Optician/Practice</Label>
                  <Input
                    id="previousOptician"
                    value={formData.previousOptician}
                    onChange={(e) => handleChange("previousOptician", e.target.value)}
                    placeholder="Name of previous optician or practice"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">GP Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gpName">GP Name</Label>
                    <Input
                      id="gpName"
                      value={formData.gpName}
                      onChange={(e) => handleChange("gpName", e.target.value)}
                      placeholder="Dr. John Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gpPhone">GP Phone</Label>
                    <Input
                      id="gpPhone"
                      type="tel"
                      value={formData.gpPhone}
                      onChange={(e) => handleChange("gpPhone", e.target.value)}
                      placeholder="+44 20 1234 5678"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="gpPractice">GP Practice</Label>
                    <Input
                      id="gpPractice"
                      value={formData.gpPractice}
                      onChange={(e) => handleChange("gpPractice", e.target.value)}
                      placeholder="Practice name and address"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Medical History</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentMedications">Current Medications</Label>
                    <Textarea
                      id="currentMedications"
                      value={formData.currentMedications}
                      onChange={(e) => handleChange("currentMedications", e.target.value)}
                      placeholder="List any current medications..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => handleChange("allergies", e.target.value)}
                      placeholder="List any known allergies (medications, substances, etc.)..."
                      rows={2}
                    />
                    <p className="text-xs text-amber-600">⚠️ Important for prescribing and contact lens fitting</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="familyOcularHistory">Family Ocular History</Label>
                    <Textarea
                      id="familyOcularHistory"
                      value={formData.familyOcularHistory}
                      onChange={(e) => handleChange("familyOcularHistory", e.target.value)}
                      placeholder="Family history of eye conditions (glaucoma, macular degeneration, etc.)..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: LIFESTYLE */}
            <TabsContent value="lifestyle" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Occupation & Activities</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleChange("occupation", e.target.value)}
                    placeholder="Software Engineer, Teacher, etc."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vduUser"
                      checked={formData.vduUser}
                      onCheckedChange={(checked) => handleChange("vduUser", checked as boolean)}
                    />
                    <Label htmlFor="vduUser" className="cursor-pointer">
                      VDU/Computer User (Screen Work)
                    </Label>
                  </div>

                  {formData.vduUser && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="vduHoursPerDay">Hours per Day</Label>
                      <Input
                        id="vduHoursPerDay"
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={formData.vduHoursPerDay}
                        onChange={(e) => handleChange("vduHoursPerDay", e.target.value)}
                        placeholder="e.g., 8"
                        className="w-32"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="drivingRequirement"
                    checked={formData.drivingRequirement}
                    onCheckedChange={(checked) => handleChange("drivingRequirement", checked as boolean)}
                  />
                  <Label htmlFor="drivingRequirement" className="cursor-pointer">
                    Requires Spectacles for Driving
                  </Label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Contact Lenses</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="contactLensWearer"
                    checked={formData.contactLensWearer}
                    onCheckedChange={(checked) => handleChange("contactLensWearer", checked as boolean)}
                  />
                  <Label htmlFor="contactLensWearer" className="cursor-pointer">
                    Contact Lens Wearer
                  </Label>
                </div>

                {formData.contactLensWearer && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="contactLensType">Contact Lens Type</Label>
                    <Select
                      value={formData.contactLensType}
                      onValueChange={(value) => handleChange("contactLensType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily_disposable">Daily Disposable</SelectItem>
                        <SelectItem value="monthly">Monthly Disposable</SelectItem>
                        <SelectItem value="toric">Toric (Astigmatism)</SelectItem>
                        <SelectItem value="multifocal">Multifocal</SelectItem>
                        <SelectItem value="rgp">Rigid Gas Permeable (RGP)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Additional Notes</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="patientNotes">General Patient Notes</Label>
                  <Textarea
                    id="patientNotes"
                    value={formData.patientNotes}
                    onChange={(e) => handleChange("patientNotes", e.target.value)}
                    placeholder="Any additional notes about the patient (hobbies, special requirements, preferences, etc.)..."
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: EMERGENCY CONTACT */}
            <TabsContent value="emergency" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Emergency Contact Information</h3>
                <p className="text-sm text-muted-foreground">
                  Contact person in case of emergency during examination or treatment
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                      placeholder="Jane Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                      placeholder="+44 7700 900000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Select
                      value={formData.emergencyContactRelationship}
                      onValueChange={(value) => handleChange("emergencyContactRelationship", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse/Partner</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emergencyContactEmail">Contact Email (Optional)</Label>
                    <Input
                      id="emergencyContactEmail"
                      type="email"
                      value={formData.emergencyContactEmail}
                      onChange={(e) => handleChange("emergencyContactEmail", e.target.value)}
                      placeholder="emergency@example.com"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: PREFERENCES & CONSENT */}
            <TabsContent value="preferences" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Communication Preferences</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                    <Select
                      value={formData.preferredContactMethod}
                      onValueChange={(value) => handleChange("preferredContactMethod", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="sms">SMS/Text</SelectItem>
                        <SelectItem value="post">Post</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredAppointmentTime">Preferred Appointment Time</Label>
                    <Select
                      value={formData.preferredAppointmentTime}
                      onValueChange={(value) => handleChange("preferredAppointmentTime", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9am - 12pm)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                        <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                        <SelectItem value="no_preference">No Preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Consent & Privacy</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 rounded-lg border p-4">
                    <Checkbox
                      id="dataSharingConsent"
                      checked={formData.dataSharingConsent}
                      onCheckedChange={(checked) => handleChange("dataSharingConsent", checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="dataSharingConsent" className="cursor-pointer font-medium">
                        Data Sharing Consent
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I consent to sharing my clinical information with my GP and other healthcare providers as necessary for my care.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-lg border p-4">
                    <Checkbox
                      id="marketingConsent"
                      checked={formData.marketingConsent}
                      onCheckedChange={(checked) => handleChange("marketingConsent", checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="marketingConsent" className="cursor-pointer font-medium">
                        Marketing Communications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I consent to receiving marketing communications about products, services, and special offers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Privacy Notice:</strong> Your information will be stored securely and used only for providing eye care services. 
                  Timezone will be automatically detected from your postcode for appointment scheduling.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* FORM ACTIONS */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={addPatientMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addPatientMutation.isPending}>
              {addPatientMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Patient Record...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Patient Record
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
