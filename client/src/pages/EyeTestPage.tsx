import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WizardStepper, type WizardStep } from "@/components/ui/WizardStepper";
import {
  Eye,
  FileText,
  ArrowLeft,
  TestTube,
  Palette,
  Crosshair,
  FileCheck,
  DoorOpen,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { VisualAcuityChart } from "@/components/eye-test/VisualAcuityChart";
import { ColorBlindnessTest, type ColorBlindnessResult } from "@/components/eye-test/ColorBlindnessTest";
import { VisualFieldTest } from "@/components/eye-test/VisualFieldTest";
import { EXAM_TEMPLATES, type ExamTemplate } from "@/data/examTemplates";
import { EYE_TERMINOLOGY } from "../../../shared/terminology";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string | null;
  nhsNumber: string | null;
}

interface TestRoom {
  id: string;
  roomName: string;
  roomCode: string | null;
  currentStatus: string;
  equipmentList: string | null;
  allowRemoteAccess: boolean;
  isActive: boolean;
}

export default function EyeTestPageModern() {
  const [, params] = useRoute("/ecp/patient/:id/test");
  const patientId = params?.id;

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(null);
  const [vaResults, setVaResults] = useState({ R: "", L: "" });
  const [colorBlindnessResult, setColorBlindnessResult] = useState<ColorBlindnessResult | null>(null);
  const [visualFieldResults, setVisualFieldResults] = useState<any>({ R: null, L: null });
  const [selectedTestRoom, setSelectedTestRoom] = useState<string>("");
  const [examinationData, setExaminationData] = useState<Record<string, any>>({});
  const [prescriptionData, setPrescriptionData] = useState<Record<string, any>>({});

  const { toast } = useToast();

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", patientId],
    enabled: !!patientId,
  });

  const { data: testRooms } = useQuery<TestRoom[]>({
    queryKey: ["/api/ecp/test-rooms"],
  });

  const availableTestRooms = testRooms?.filter(
    room => room.isActive && room.currentStatus === "available"
  );

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

  // Define wizard steps
  const steps: WizardStep[] = [
    {
      id: "template",
      title: "Template",
      description: "Select an examination template to guide your workflow",
      icon: <FileCheck className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a template to guide your examination workflow. You can skip this step if you prefer a custom examination.
          </p>
          <div className="grid gap-4">
            {EXAM_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`text-left p-4 border-2 rounded-lg hover:bg-accent transition-all ${
                  selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {template.description}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {template.sections.map((section) => (
                    <Badge key={section.id} variant="outline" className="text-xs">
                      {section.title}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
          {selectedTemplate && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium">Selected: {selectedTemplate.name}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "visual-acuity",
      title: "Visual Acuity",
      description: "Test visual acuity for both eyes",
      icon: <TestTube className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <VisualAcuityChart
              eye="R"
              initialValue={vaResults.R}
              onResult={(result) => setVaResults({ ...vaResults, R: result })}
            />
            <VisualAcuityChart
              eye="L"
              initialValue={vaResults.L}
              onResult={(result) => setVaResults({ ...vaResults, L: result })}
            />
          </div>
          {(vaResults.R || vaResults.L) && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium">Results:</p>
              {vaResults.R && <p className="text-sm">Right Eye: {vaResults.R}</p>}
              {vaResults.L && <p className="text-sm">Left Eye: {vaResults.L}</p>}
            </div>
          )}
        </div>
      ),
      validate: async () => {
        if (!vaResults.R && !vaResults.L) {
          toast({
            title: "Visual Acuity Required",
            description: "Please test at least one eye before continuing.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      },
    },
    {
      id: "color-vision",
      title: "Color Vision",
      description: "Assess color vision using Ishihara plates",
      icon: <Palette className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <ColorBlindnessTest
            onComplete={(result) => {
              setColorBlindnessResult(result);
              toast({
                title: "Color Vision Test Complete",
                description: `Score: ${result.correctAnswers}/${result.totalPlates} - ${result.interpretation}`,
              });
            }}
          />
          {colorBlindnessResult && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium">Results:</p>
              <p className="text-sm">Score: {colorBlindnessResult.correctAnswers}/{colorBlindnessResult.totalPlates}</p>
              <p className="text-sm">Interpretation: {colorBlindnessResult.interpretation}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "visual-field",
      title: "Visual Field",
      description: "Test peripheral vision for both eyes",
      icon: <Crosshair className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <VisualFieldTest
              eye="R"
              onComplete={(results) => {
                setVisualFieldResults({ ...visualFieldResults, R: results });
                toast({
                  title: "Visual Field Test Complete - R",
                  description: "Results saved for right eye",
                });
              }}
            />
            <VisualFieldTest
              eye="L"
              onComplete={(results) => {
                setVisualFieldResults({ ...visualFieldResults, L: results });
                toast({
                  title: "Visual Field Test Complete - L",
                  description: "Results saved for left eye",
                });
              }}
            />
          </div>
          {(visualFieldResults.R || visualFieldResults.L) && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium">Results:</p>
              {visualFieldResults.R && <p className="text-sm">Right Eye: Complete</p>}
              {visualFieldResults.L && <p className="text-sm">Left Eye: Complete</p>}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "examination",
      title: "Examination",
      description: "Clinical examination and refraction",
      icon: <Eye className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          {/* Test Room Selection */}
          <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Test Room Selection</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="testRoom">Select Test Room *</Label>
                <Select
                  value={selectedTestRoom}
                  onValueChange={setSelectedTestRoom}
                  required
                >
                  <SelectTrigger id="testRoom" className="bg-background">
                    <SelectValue placeholder="Choose test room..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTestRooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{room.roomName}</span>
                          {room.roomCode && (
                            <Badge variant="outline" className="text-xs">
                              {room.roomCode}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTestRoom && availableTestRooms?.find(r => r.id === selectedTestRoom) && (
                <div className="space-y-2">
                  <Label>Room Details</Label>
                  <div className="p-3 bg-background rounded-md border text-sm space-y-1">
                    {availableTestRooms.find(r => r.id === selectedTestRoom)?.equipmentList && (
                      <p className="text-muted-foreground">
                        Equipment: {availableTestRooms.find(r => r.id === selectedTestRoom)?.equipmentList}
                      </p>
                    )}
                    {availableTestRooms.find(r => r.id === selectedTestRoom)?.allowRemoteAccess && (
                      <Badge variant="outline" className="gap-1">
                        <Wifi className="h-3 w-3" />
                        Remote Access
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Results Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Test Results Summary</h3>
            {vaResults.R && <p className="text-sm">Visual Acuity R: {vaResults.R}</p>}
            {vaResults.L && <p className="text-sm">Visual Acuity L: {vaResults.L}</p>}
            {colorBlindnessResult && (
              <p className="text-sm">
                Color Vision: {colorBlindnessResult.correctAnswers}/{colorBlindnessResult.totalPlates} - {colorBlindnessResult.interpretation}
              </p>
            )}
            {visualFieldResults.R && <p className="text-sm">Visual Field R: Complete</p>}
            {visualFieldResults.L && <p className="text-sm">Visual Field L: Complete</p>}
          </div>

          {/* Examination Form */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Visual Acuity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visualAcuityOD">{EYE_TERMINOLOGY.RIGHT_EYE}</Label>
                  <Input
                    id="visualAcuityOD"
                    placeholder="e.g., 6/6"
                    defaultValue={vaResults.R}
                    onChange={(e) => setExaminationData({ ...examinationData, visualAcuityOD: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visualAcuityOS">{EYE_TERMINOLOGY.LEFT_EYE}</Label>
                  <Input
                    id="visualAcuityOS"
                    placeholder="e.g., 6/6"
                    defaultValue={vaResults.L}
                    onChange={(e) => setExaminationData({ ...examinationData, visualAcuityOS: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Auto-Refraction - {EYE_TERMINOLOGY.RIGHT_EYE}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Sphere</Label>
                  <Input
                    placeholder="e.g., -1.25"
                    onChange={(e) => setExaminationData({ ...examinationData, autoRefractionODSphere: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cylinder</Label>
                  <Input
                    placeholder="e.g., -0.50"
                    onChange={(e) => setExaminationData({ ...examinationData, autoRefractionODCylinder: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Axis</Label>
                  <Input
                    placeholder="e.g., 90"
                    onChange={(e) => setExaminationData({ ...examinationData, autoRefractionODAxis: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Auto-Refraction - {EYE_TERMINOLOGY.LEFT_EYE}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Sphere</Label>
                  <Input
                    placeholder="e.g., -1.25"
                    onChange={(e) => setExaminationData({ ...examinationData, autoRefractionOSSphere: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cylinder</Label>
                  <Input
                    placeholder="e.g., -0.50"
                    onChange={(e) => setExaminationData({ ...examinationData, autoRefractionOSCylinder: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Axis</Label>
                  <Input
                    placeholder="e.g., 90"
                    onChange={(e) => setExaminationData({ ...examinationData, autoRefractionOSAxis: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Clinical Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional observations or notes..."
                rows={4}
                onChange={(e) => setExaminationData({ ...examinationData, notes: e.target.value })}
              />
            </div>
          </div>
        </div>
      ),
      validate: async () => {
        if (!selectedTestRoom) {
          toast({
            title: "Test Room Required",
            description: "Please select a test room before continuing.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      },
      onNext: async () => {
        // Save examination
        await createExaminationMutation.mutateAsync({
          patientId,
          testRoomId: selectedTestRoom,
          ...examinationData,
        });
      },
    },
    {
      id: "prescription",
      title: "Prescription",
      description: "Create optical prescription",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                onChange={(e) => setPrescriptionData({ ...prescriptionData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">{EYE_TERMINOLOGY.RIGHT_EYE}</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Sphere</Label>
                <Input
                  placeholder="-1.25"
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, odSphere: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cylinder</Label>
                <Input
                  placeholder="-0.50"
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, odCylinder: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Axis</Label>
                <Input
                  placeholder="90"
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, odAxis: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Add</Label>
                <Input
                  placeholder="+1.50"
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, odAdd: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">{EYE_TERMINOLOGY.LEFT_EYE}</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Sphere</Label>
                <Input
                  placeholder="-1.25"
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, osSphere: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cylinder</Label>
                <Input
                  placeholder="-0.50"
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, osCylinder: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Axis</Label>
                <Input
                  placeholder="90"
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, osAxis: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Add</Label>
                <Input
                  placeholder="+1.50"
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, osAdd: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pd">Pupillary Distance (PD)</Label>
              <Input
                id="pd"
                placeholder="63"
                onChange={(e) => setPrescriptionData({ ...prescriptionData, pd: e.target.value })}
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/ecp/patients">
          <Button variant="outline" size="sm">
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

      <WizardStepper
        steps={steps}
        onComplete={async () => {
          // Create prescription
          await createPrescriptionMutation.mutateAsync({
            patientId,
            issueDate: new Date().toISOString(),
            ...prescriptionData,
          });

          toast({
            title: "Examination Complete!",
            description: "All examination data and prescription have been saved.",
          });
        }}
        persistProgress
        storageKey={`eye-exam-${patientId}`}
        showStepNumbers
      />
    </div>
  );
}
