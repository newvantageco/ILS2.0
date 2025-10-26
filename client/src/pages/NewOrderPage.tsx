import { ProgressStepper } from "@/components/ProgressStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";

const steps = [
  { label: "Patient Info", description: "Basic details" },
  { label: "Prescription", description: "Rx values" },
  { label: "Lens & Frame", description: "Product selection" },
  { label: "Review", description: "Confirm order" },
];

export default function NewOrderPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    patientName: "",
    patientDOB: "",
    customerReference: "",
    odSphere: "",
    odCylinder: "",
    odAxis: "",
    odAdd: "",
    osSphere: "",
    osCylinder: "",
    osAxis: "",
    osAdd: "",
    pd: "",
    traceFileUrl: "",
    lensType: "",
    lensMaterial: "",
    coating: "",
    frameType: "",
    notes: "",
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order created successfully",
        description: "Your lens order has been submitted.",
      });
      setLocation("/ecp/dashboard");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        window.location.href = "/api/login";
      } else {
        toast({
          title: "Failed to create order",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!formData.patientName || !formData.lensType || !formData.lensMaterial || !formData.coating) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      patientName: formData.patientName,
      patientDOB: formData.patientDOB || undefined,
      customerReference: formData.customerReference || undefined,
      odSphere: formData.odSphere || undefined,
      odCylinder: formData.odCylinder || undefined,
      odAxis: formData.odAxis || undefined,
      odAdd: formData.odAdd || undefined,
      osSphere: formData.osSphere || undefined,
      osCylinder: formData.osCylinder || undefined,
      osAxis: formData.osAxis || undefined,
      osAdd: formData.osAdd || undefined,
      pd: formData.pd || undefined,
      traceFileUrl: formData.traceFileUrl || undefined,
      lensType: formData.lensType,
      lensMaterial: formData.lensMaterial,
      coating: formData.coating,
      frameType: formData.frameType || undefined,
      notes: formData.notes || undefined,
      status: "pending" as const,
    };

    createOrderMutation.mutate(orderData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Create New Order</h1>
        <p className="text-muted-foreground mt-1">
          Complete the form to submit a new lens order.
        </p>
      </div>

      <ProgressStepper steps={steps} currentStep={currentStep} />

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient-name">Patient Name *</Label>
                <Input
                  id="patient-name"
                  value={formData.patientName}
                  onChange={(e) => updateFormData("patientName", e.target.value)}
                  placeholder="Enter patient full name"
                  data-testid="input-patient-name"
                />
              </div>
              <div>
                <Label htmlFor="patient-dob">Date of Birth</Label>
                <Input
                  id="patient-dob"
                  type="date"
                  value={formData.patientDOB}
                  onChange={(e) => updateFormData("patientDOB", e.target.value)}
                  data-testid="input-patient-dob"
                />
              </div>
              <div>
                <Label htmlFor="customer-reference">Customer Reference</Label>
                <Input
                  id="customer-reference"
                  value={formData.customerReference}
                  onChange={(e) => updateFormData("customerReference", e.target.value)}
                  placeholder="Enter your internal reference number (optional)"
                  data-testid="input-customer-reference"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add your own reference number or ID to track this order in your system.
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">OD (Right Eye)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="od-sphere">Sphere</Label>
                    <Input
                      id="od-sphere"
                      value={formData.odSphere}
                      onChange={(e) => updateFormData("odSphere", e.target.value)}
                      placeholder="e.g., -2.50"
                      className="font-mono"
                      data-testid="input-od-sphere"
                    />
                  </div>
                  <div>
                    <Label htmlFor="od-cylinder">Cylinder</Label>
                    <Input
                      id="od-cylinder"
                      value={formData.odCylinder}
                      onChange={(e) => updateFormData("odCylinder", e.target.value)}
                      placeholder="e.g., -0.75"
                      className="font-mono"
                      data-testid="input-od-cylinder"
                    />
                  </div>
                  <div>
                    <Label htmlFor="od-axis">Axis</Label>
                    <Input
                      id="od-axis"
                      value={formData.odAxis}
                      onChange={(e) => updateFormData("odAxis", e.target.value)}
                      placeholder="e.g., 180"
                      className="font-mono"
                      data-testid="input-od-axis"
                    />
                  </div>
                  <div>
                    <Label htmlFor="od-add">Add</Label>
                    <Input
                      id="od-add"
                      value={formData.odAdd}
                      onChange={(e) => updateFormData("odAdd", e.target.value)}
                      placeholder="e.g., +2.00"
                      className="font-mono"
                      data-testid="input-od-add"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">OS (Left Eye)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="os-sphere">Sphere</Label>
                    <Input
                      id="os-sphere"
                      value={formData.osSphere}
                      onChange={(e) => updateFormData("osSphere", e.target.value)}
                      placeholder="e.g., -2.25"
                      className="font-mono"
                      data-testid="input-os-sphere"
                    />
                  </div>
                  <div>
                    <Label htmlFor="os-cylinder">Cylinder</Label>
                    <Input
                      id="os-cylinder"
                      value={formData.osCylinder}
                      onChange={(e) => updateFormData("osCylinder", e.target.value)}
                      placeholder="e.g., -0.50"
                      className="font-mono"
                      data-testid="input-os-cylinder"
                    />
                  </div>
                  <div>
                    <Label htmlFor="os-axis">Axis</Label>
                    <Input
                      id="os-axis"
                      value={formData.osAxis}
                      onChange={(e) => updateFormData("osAxis", e.target.value)}
                      placeholder="e.g., 90"
                      className="font-mono"
                      data-testid="input-os-axis"
                    />
                  </div>
                  <div>
                    <Label htmlFor="os-add">Add</Label>
                    <Input
                      id="os-add"
                      value={formData.osAdd}
                      onChange={(e) => updateFormData("osAdd", e.target.value)}
                      placeholder="e.g., +2.00"
                      className="font-mono"
                      data-testid="input-os-add"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="pd">Pupillary Distance (PD)</Label>
                <Input
                  id="pd"
                  value={formData.pd}
                  onChange={(e) => updateFormData("pd", e.target.value)}
                  placeholder="e.g., 63"
                  className="font-mono max-w-32"
                  data-testid="input-pd"
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Digital Trace File (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a digital trace file from your edging system for precision frame measurements.
                </p>
                <div>
                  <Label htmlFor="trace-file">Trace File URL</Label>
                  <Input
                    id="trace-file"
                    value={formData.traceFileUrl}
                    onChange={(e) => updateFormData("traceFileUrl", e.target.value)}
                    placeholder="https://example.com/trace-files/trace123.xml"
                    data-testid="input-trace-file"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the URL of the uploaded trace file (OMA, XML, or CSV format).
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="lens-type">Lens Type *</Label>
                <Select
                  value={formData.lensType}
                  onValueChange={(value) => updateFormData("lensType", value)}
                >
                  <SelectTrigger id="lens-type" data-testid="select-lens-type">
                    <SelectValue placeholder="Select lens type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Vision">Single Vision</SelectItem>
                    <SelectItem value="Bifocal">Bifocal</SelectItem>
                    <SelectItem value="Progressive">Progressive</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lens-material">Lens Material *</Label>
                <Select
                  value={formData.lensMaterial}
                  onValueChange={(value) => updateFormData("lensMaterial", value)}
                >
                  <SelectTrigger id="lens-material" data-testid="select-lens-material">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CR-39">CR-39 (Standard Plastic)</SelectItem>
                    <SelectItem value="Polycarbonate">Polycarbonate</SelectItem>
                    <SelectItem value="Trivex">Trivex</SelectItem>
                    <SelectItem value="High-Index 1.67">High-Index 1.67</SelectItem>
                    <SelectItem value="High-Index 1.74">High-Index 1.74</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="coating">Coating *</Label>
                <Select
                  value={formData.coating}
                  onValueChange={(value) => updateFormData("coating", value)}
                >
                  <SelectTrigger id="coating" data-testid="select-coating">
                    <SelectValue placeholder="Select coating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Anti-Reflective">Anti-Reflective</SelectItem>
                    <SelectItem value="Scratch Resistant">Scratch Resistant</SelectItem>
                    <SelectItem value="Blue Light Filter">Blue Light Filter</SelectItem>
                    <SelectItem value="Photochromic">Photochromic (Transitions)</SelectItem>
                    <SelectItem value="Polarized">Polarized</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frame-type">Frame Type</Label>
                <Select
                  value={formData.frameType}
                  onValueChange={(value) => updateFormData("frameType", value)}
                >
                  <SelectTrigger id="frame-type" data-testid="select-frame-type">
                    <SelectValue placeholder="Select frame type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Rim">Full Rim</SelectItem>
                    <SelectItem value="Semi-Rimless">Semi-Rimless</SelectItem>
                    <SelectItem value="Rimless">Rimless</SelectItem>
                    <SelectItem value="Sport">Sport</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Patient Information</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {formData.patientName}</p>
                  {formData.patientDOB && <p><span className="text-muted-foreground">DOB:</span> {formData.patientDOB}</p>}
                  {formData.customerReference && <p><span className="text-muted-foreground">Customer Reference:</span> {formData.customerReference}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Prescription</h3>
                <div className="text-sm font-mono space-y-1">
                  {(formData.odSphere || formData.odCylinder || formData.odAxis || formData.odAdd) && (
                    <p><span className="text-muted-foreground">OD:</span> SPH {formData.odSphere || "—"} CYL {formData.odCylinder || "—"} AXIS {formData.odAxis || "—"} ADD {formData.odAdd || "—"}</p>
                  )}
                  {(formData.osSphere || formData.osCylinder || formData.osAxis || formData.osAdd) && (
                    <p><span className="text-muted-foreground">OS:</span> SPH {formData.osSphere || "—"} CYL {formData.osCylinder || "—"} AXIS {formData.osAxis || "—"} ADD {formData.osAdd || "—"}</p>
                  )}
                  {formData.pd && <p><span className="text-muted-foreground">PD:</span> {formData.pd}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Lens Specifications</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Type:</span> {formData.lensType}</p>
                  <p><span className="text-muted-foreground">Material:</span> {formData.lensMaterial}</p>
                  <p><span className="text-muted-foreground">Coating:</span> {formData.coating}</p>
                  {formData.frameType && <p><span className="text-muted-foreground">Frame:</span> {formData.frameType}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData("notes", e.target.value)}
                  placeholder="Any special instructions or notes..."
                  rows={4}
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              data-testid="button-back"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={createOrderMutation.isPending}
              data-testid="button-next"
            >
              {createOrderMutation.isPending ? (
                <>Submitting...</>
              ) : currentStep === steps.length - 1 ? (
                <>Submit Order</>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
