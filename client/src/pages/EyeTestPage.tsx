import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  FileText,
  Save,
  CheckCircle2,
  ArrowLeft,
  TestTube,
  Palette,
  Crosshair,
  FileCheck,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { VisualAcuityChart } from "@/components/eye-test/VisualAcuityChart";
import { ColorBlindnessTest, type ColorBlindnessResult } from "@/components/eye-test/ColorBlindnessTest";
import { VisualFieldTest } from "@/components/eye-test/VisualFieldTest";
import { EXAM_TEMPLATES, type ExamTemplate } from "@/data/examTemplates";

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string | null;
  nhsNumber: string | null;
}

export default function EyeTestPage() {
  const [, params] = useRoute("/ecp/patient/:id/test");
  const patientId = params?.id;
  const [activeTab, setActiveTab] = useState("template");
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(null);
  const [templateData, setTemplateData] = useState<Record<string, any>>({});
  const [vaResults, setVaResults] = useState({ OD: "", OS: "" });
  const [colorBlindnessResult, setColorBlindnessResult] = useState<ColorBlindnessResult | null>(null);
  const [visualFieldResults, setVisualFieldResults] = useState<any>({ OD: null, OS: null });
  const { toast } = useToast();

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", patientId],
    enabled: !!patientId,
  });

  const createExaminationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/examinations", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/examinations"] });
      toast({
        title: "Examination Saved",
        description: "Eye examination has been saved successfully.",
      });
      setActiveTab("prescription");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save examination. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/prescriptions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({
        title: "Prescription Created",
        description: "Prescription has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExaminationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      patientId,
      visualAcuityOD: formData.get("visualAcuityOD") as string || null,
      visualAcuityOS: formData.get("visualAcuityOS") as string || null,
      autoRefractionODSphere: formData.get("autoRefractionODSphere") as string || null,
      autoRefractionODCylinder: formData.get("autoRefractionODCylinder") as string || null,
      autoRefractionODAxis: formData.get("autoRefractionODAxis") as string || null,
      autoRefractionOSSphere: formData.get("autoRefractionOSSphere") as string || null,
      autoRefractionOSCylinder: formData.get("autoRefractionOSCylinder") as string || null,
      autoRefractionOSAxis: formData.get("autoRefractionOSAxis") as string || null,
      notes: formData.get("notes") as string || null,
    };

    createExaminationMutation.mutate(data);
  };

  const handlePrescriptionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const expiryDate = formData.get("expiryDate") as string;
    
    const data = {
      patientId,
      issueDate: new Date().toISOString(),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      odSphere: formData.get("odSphere") as string || null,
      odCylinder: formData.get("odCylinder") as string || null,
      odAxis: formData.get("odAxis") as string || null,
      odAdd: formData.get("odAdd") as string || null,
      osSphere: formData.get("osSphere") as string || null,
      osCylinder: formData.get("osCylinder") as string || null,
      osAxis: formData.get("osAxis") as string || null,
      osAdd: formData.get("osAdd") as string || null,
      pd: formData.get("pd") as string || null,
    };

    createPrescriptionMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">Patient not found</h2>
        <p className="text-muted-foreground mt-2">The patient could not be loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/ecp/patients">
          <Button variant="outline" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Eye Examination</h1>
          <p className="text-muted-foreground mt-1">
            Patient: {patient.name}
            {patient.dateOfBirth && ` • DOB: ${patient.dateOfBirth}`}
            {patient.nhsNumber && (
              <Badge variant="outline" className="ml-2 font-mono">
                NHS: {patient.nhsNumber}
              </Badge>
            )}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="template" data-testid="tab-template">
            <FileCheck className="h-4 w-4 mr-2" />
            Template
          </TabsTrigger>
          <TabsTrigger value="visual-acuity" data-testid="tab-visual-acuity">
            <TestTube className="h-4 w-4 mr-2" />
            Visual Acuity
          </TabsTrigger>
          <TabsTrigger value="color-vision" data-testid="tab-color-vision">
            <Palette className="h-4 w-4 mr-2" />
            Color Vision
          </TabsTrigger>
          <TabsTrigger value="visual-field" data-testid="tab-visual-field">
            <Crosshair className="h-4 w-4 mr-2" />
            Visual Field
          </TabsTrigger>
          <TabsTrigger value="examination" data-testid="tab-examination">
            <Eye className="h-4 w-4 mr-2" />
            Examination
          </TabsTrigger>
          <TabsTrigger value="prescription" data-testid="tab-prescription">
            <FileText className="h-4 w-4 mr-2" />
            Prescription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Select Examination Template</CardTitle>
              <CardDescription>
                Choose a template to guide your examination workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {EXAM_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setActiveTab("examination");
                    }}
                    className="text-left p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {template.sections.map((section) => (
                        <Badge key={section.id} variant="outline" className="text-xs">
                          {section.title}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual-acuity">
          <div className="grid gap-6 md:grid-cols-2">
            <VisualAcuityChart
              eye="OD"
              initialValue={vaResults.OD}
              onResult={(result) => setVaResults({ ...vaResults, OD: result })}
            />
            <VisualAcuityChart
              eye="OS"
              initialValue={vaResults.OS}
              onResult={(result) => setVaResults({ ...vaResults, OS: result })}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setActiveTab("color-vision")}>
              Next: Color Vision Test
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="color-vision">
          <ColorBlindnessTest
            onComplete={(result) => {
              setColorBlindnessResult(result);
              toast({
                title: "Color Vision Test Complete",
                description: `Score: ${result.correctAnswers}/${result.totalPlates} - ${result.interpretation}`,
              });
            }}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setActiveTab("visual-field")}>
              Next: Visual Field Test
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="visual-field">
          <div className="grid gap-6 md:grid-cols-2">
            <VisualFieldTest
              eye="OD"
              onComplete={(results) => {
                setVisualFieldResults({ ...visualFieldResults, OD: results });
                toast({
                  title: "Visual Field Test Complete - OD",
                  description: "Results saved for right eye",
                });
              }}
            />
            <VisualFieldTest
              eye="OS"
              onComplete={(results) => {
                setVisualFieldResults({ ...visualFieldResults, OS: results });
                toast({
                  title: "Visual Field Test Complete - OS",
                  description: "Results saved for left eye",
                });
              }}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setActiveTab("examination")}>
              Continue to Full Examination
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="examination">
          <form onSubmit={handleExaminationSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Clinical Eye Examination</CardTitle>
                <CardDescription>
                  {selectedTemplate ? `${selectedTemplate.name} - ` : ""}Record visual acuity and refraction measurements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Show test results summary if available */}
                {(vaResults.OD || vaResults.OS || colorBlindnessResult || visualFieldResults.OD || visualFieldResults.OS) && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h3 className="font-semibold text-sm">Test Results Summary</h3>
                    {vaResults.OD && (
                      <p className="text-sm">Visual Acuity OD: {vaResults.OD}</p>
                    )}
                    {vaResults.OS && (
                      <p className="text-sm">Visual Acuity OS: {vaResults.OS}</p>
                    )}
                    {colorBlindnessResult && (
                      <p className="text-sm">
                        Color Vision: {colorBlindnessResult.correctAnswers}/{colorBlindnessResult.totalPlates} - {colorBlindnessResult.interpretation}
                      </p>
                    )}
                    {visualFieldResults.OD && (
                      <p className="text-sm">Visual Field OD: Complete</p>
                    )}
                    {visualFieldResults.OS && (
                      <p className="text-sm">Visual Field OS: Complete</p>
                    )}
                  </div>
                )}
                
                <div className="grid gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      Visual Acuity
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="visualAcuityOD">OD (Right Eye)</Label>
                        <Input
                          id="visualAcuityOD"
                          name="visualAcuityOD"
                          placeholder="e.g., 6/6"
                          defaultValue={vaResults.OD}
                          data-testid="input-va-od"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visualAcuityOS">OS (Left Eye)</Label>
                        <Input
                          id="visualAcuityOS"
                          name="visualAcuityOS"
                          placeholder="e.g., 6/6"
                          data-testid="input-va-os"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      Auto-Refraction - OD (Right Eye)
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="autoRefractionODSphere">Sphere</Label>
                        <Input
                          id="autoRefractionODSphere"
                          name="autoRefractionODSphere"
                          placeholder="e.g., -1.25"
                          data-testid="input-ar-od-sphere"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="autoRefractionODCylinder">Cylinder</Label>
                        <Input
                          id="autoRefractionODCylinder"
                          name="autoRefractionODCylinder"
                          placeholder="e.g., -0.50"
                          data-testid="input-ar-od-cylinder"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="autoRefractionODAxis">Axis</Label>
                        <Input
                          id="autoRefractionODAxis"
                          name="autoRefractionODAxis"
                          placeholder="e.g., 90"
                          data-testid="input-ar-od-axis"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      Auto-Refraction - OS (Left Eye)
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="autoRefractionOSSphere">Sphere</Label>
                        <Input
                          id="autoRefractionOSSphere"
                          name="autoRefractionOSSphere"
                          placeholder="e.g., -1.25"
                          data-testid="input-ar-os-sphere"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="autoRefractionOSCylinder">Cylinder</Label>
                        <Input
                          id="autoRefractionOSCylinder"
                          name="autoRefractionOSCylinder"
                          placeholder="e.g., -0.50"
                          data-testid="input-ar-os-cylinder"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="autoRefractionOSAxis">Axis</Label>
                        <Input
                          id="autoRefractionOSAxis"
                          name="autoRefractionOSAxis"
                          placeholder="e.g., 90"
                          data-testid="input-ar-os-axis"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Clinical Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Enter any additional observations or notes..."
                      rows={4}
                      data-testid="textarea-notes"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="submit"
                    disabled={createExaminationMutation.isPending}
                    data-testid="button-save-examination"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createExaminationMutation.isPending ? "Saving..." : "Save Examination"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="prescription">
          <form onSubmit={handlePrescriptionSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Optical Prescription</CardTitle>
                <CardDescription>
                  Create prescription based on examination results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="issueDate">Issue Date</Label>
                      <Input
                        id="issueDate"
                        name="issueDate"
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        disabled
                        data-testid="input-issue-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        type="date"
                        data-testid="input-expiry-date"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      OD (Right Eye)
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="odSphere">Sphere</Label>
                        <Input
                          id="odSphere"
                          name="odSphere"
                          placeholder="-1.25"
                          data-testid="input-rx-od-sphere"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="odCylinder">Cylinder</Label>
                        <Input
                          id="odCylinder"
                          name="odCylinder"
                          placeholder="-0.50"
                          data-testid="input-rx-od-cylinder"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="odAxis">Axis</Label>
                        <Input
                          id="odAxis"
                          name="odAxis"
                          placeholder="90"
                          data-testid="input-rx-od-axis"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="odAdd">Add</Label>
                        <Input
                          id="odAdd"
                          name="odAdd"
                          placeholder="+1.50"
                          data-testid="input-rx-od-add"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      OS (Left Eye)
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="osSphere">Sphere</Label>
                        <Input
                          id="osSphere"
                          name="osSphere"
                          placeholder="-1.25"
                          data-testid="input-rx-os-sphere"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="osCylinder">Cylinder</Label>
                        <Input
                          id="osCylinder"
                          name="osCylinder"
                          placeholder="-0.50"
                          data-testid="input-rx-os-cylinder"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="osAxis">Axis</Label>
                        <Input
                          id="osAxis"
                          name="osAxis"
                          placeholder="90"
                          data-testid="input-rx-os-axis"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="osAdd">Add</Label>
                        <Input
                          id="osAdd"
                          name="osAdd"
                          placeholder="+1.50"
                          data-testid="input-rx-os-add"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pd">Pupillary Distance (PD)</Label>
                      <Input
                        id="pd"
                        name="pd"
                        placeholder="63"
                        data-testid="input-rx-pd"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="submit"
                    disabled={createPrescriptionMutation.isPending}
                    data-testid="button-create-prescription"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
