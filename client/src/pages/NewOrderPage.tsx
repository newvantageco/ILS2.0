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

const steps = [
  { label: "Patient Info", description: "Basic details" },
  { label: "Prescription", description: "Rx values" },
  { label: "Lens & Frame", description: "Product selection" },
  { label: "Review", description: "Confirm order" },
];

export default function NewOrderPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    patientName: "",
    patientDOB: "",
    odSphere: "",
    odCylinder: "",
    odAxis: "",
    odAdd: "",
    osSphere: "",
    osCylinder: "",
    osAxis: "",
    osAdd: "",
    pd: "",
    lensType: "",
    lensMaterial: "",
    coating: "",
    frameType: "",
    notes: "",
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      console.log('Moving to step', currentStep + 1);
    } else {
      console.log('Submitting order', formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
                      placeholder="e.g., -1.00"
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
                      placeholder="e.g., 175"
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
                  className="font-mono max-w-xs"
                  data-testid="input-pd"
                />
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
                    <SelectItem value="single-vision">Single Vision</SelectItem>
                    <SelectItem value="progressive">Progressive</SelectItem>
                    <SelectItem value="bifocal">Bifocal</SelectItem>
                    <SelectItem value="trifocal">Trifocal</SelectItem>
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
                    <SelectValue placeholder="Select lens material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cr39">CR-39 (Plastic)</SelectItem>
                    <SelectItem value="polycarbonate">Polycarbonate</SelectItem>
                    <SelectItem value="high-index">High Index 1.67</SelectItem>
                    <SelectItem value="trivex">Trivex</SelectItem>
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
                    <SelectItem value="ar">Anti-Reflective</SelectItem>
                    <SelectItem value="blue-light">Blue Light Filter</SelectItem>
                    <SelectItem value="scratch">Scratch Resistant</SelectItem>
                    <SelectItem value="premium">Premium Multi-Coat</SelectItem>
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
                    <SelectItem value="full-rim">Full Rim</SelectItem>
                    <SelectItem value="semi-rimless">Semi-Rimless</SelectItem>
                    <SelectItem value="rimless">Rimless</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Special Instructions</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData("notes", e.target.value)}
                  placeholder="Any special requirements or notes..."
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-md border border-border p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Patient Information</h3>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {formData.patientName || "Not provided"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">DOB:</span>{" "}
                    {formData.patientDOB || "Not provided"}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Prescription</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">OD (Right)</p>
                      <p className="font-mono">
                        SPH: {formData.odSphere || "--"} CYL: {formData.odCylinder || "--"} AXIS: {formData.odAxis || "--"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">OS (Left)</p>
                      <p className="font-mono">
                        SPH: {formData.osSphere || "--"} CYL: {formData.osCylinder || "--"} AXIS: {formData.osAxis || "--"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">PD:</span> {formData.pd || "--"} mm
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Lens Details</h3>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Type:</span>{" "}
                    {formData.lensType || "Not selected"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Material:</span>{" "}
                    {formData.lensMaterial || "Not selected"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Coating:</span>{" "}
                    {formData.coating || "Not selected"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          data-testid="button-back"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} data-testid="button-next">
          {currentStep === steps.length - 1 ? "Submit Order" : "Next"}
          {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
