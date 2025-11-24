import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PatientFormData {
  name: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  nhsNumber: string;
  address: string;
  city: string;
  postcode: string;
  customerReferenceLabel: string;
  customerReferenceNumber: string;
}

export default function AddPatientModal({ open, onOpenChange }: AddPatientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    nhsNumber: "",
    address: "",
    city: "",
    postcode: "",
    customerReferenceLabel: "",
    customerReferenceNumber: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PatientFormData, string>> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Patient name is required";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      // Validate date of birth is not in the future
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (if provided) - UK format
    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // NHS Number validation (if provided) - 10 digits
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
          nhsNumber: data.nhsNumber.replace(/\s/g, "") || null,
          fullAddress: {
            address: data.address.trim() || null,
            city: data.city.trim() || null,
            postcode: data.postcode.trim() || null,
          },
          customerReferenceLabel: data.customerReferenceLabel.trim() || null,
          customerReferenceNumber: data.customerReferenceNumber.trim() || null,
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
        title: "Patient Added",
        description: "The patient has been successfully added to your records.",
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
      nhsNumber: "",
      address: "",
      city: "",
      postcode: "",
      customerReferenceLabel: "",
      customerReferenceNumber: "",
    });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      addPatientMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Patient
          </DialogTitle>
          <DialogDescription>
            Enter the patient&apos;s information below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>
            
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
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
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
                {errors.dateOfBirth && (
                  <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
                )}
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
                {errors.nhsNumber && (
                  <p className="text-xs text-destructive">{errors.nhsNumber}</p>
                )}
                <p className="text-xs text-muted-foreground">10-digit NHS number</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Contact Information</h3>
            
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
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+44 7700 900000"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Address</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="123 High Street"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) => handleChange("postcode", e.target.value.toUpperCase())}
                    placeholder="SW1A 1AA"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Optional Reference Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Additional Reference (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerReferenceLabel">Reference Label</Label>
                <Input
                  id="customerReferenceLabel"
                  value={formData.customerReferenceLabel}
                  onChange={(e) => handleChange("customerReferenceLabel", e.target.value)}
                  placeholder="e.g., Shopify ID, Insurance #"
                />
                <p className="text-xs text-muted-foreground">
                  Custom reference type for your records
                </p>
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

          {/* Actions */}
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
                  Adding Patient...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Patient
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
