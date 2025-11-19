/**
 * Modern Eye Test Wizard
 * 
 * Complete redesign of the eye examination interface with:
 * - Step-by-step wizard navigation
 * - Beautiful animations
 * - Auto-save functionality
 * - Keyboard shortcuts
 * - Progress tracking
 */

import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WizardStepper, type Step } from "@/components/ui/wizard-stepper";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  Eye,
  FileText,
  TestTube,
  Palette,
  Crosshair,
  Sparkles,
  Loader2,
} from "lucide-react";

// Import test components
import { VisualAcuityChart } from "./VisualAcuityChart";
import { ColorBlindnessTest, type ColorBlindnessResult } from "./ColorBlindnessTest";
import { VisualFieldTest } from "./VisualFieldTest";

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string | null;
  nhsNumber: string | null;
}

interface EyeTestData {
  patientHistory?: Record<string, any>;
  visualAcuity?: { R: string; L: string };
  colorBlindness?: ColorBlindnessResult;
  visualField?: { R: any; L: any };
  finalNotes?: string;
}

// Define wizard steps
const WIZARD_STEPS: Step[] = [
  {
    id: "history",
    title: "Patient History",
    description: "Review medical history",
    icon: FileText,
  },
  {
    id: "visual-acuity",
    title: "Visual Acuity",
    description: "Test clarity of vision",
    icon: Eye,
  },
  {
    id: "color-vision",
    title: "Color Vision",
    description: "Ishihara test",
    icon: Palette,
  },
  {
    id: "visual-field",
    title: "Visual Field",
    description: "Peripheral vision",
    icon: Crosshair,
  },
  {
    id: "review",
    title: "Review & Save",
    description: "Final examination",
    icon: CheckCircle2,
  },
];

export function EyeTestWizard() {
  const [, params] = useRoute("/ecp/patient/:id/test-wizard");
  const [, setLocation] = useLocation();
  const patientId = params?.id;
  const { toast } = useToast();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [testData, setTestData] = useState<EyeTestData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (Object.keys(testData).length > 0) {
      localStorage.setItem(
        `eye-test-draft-${patientId}`,
        JSON.stringify({ ...testData, timestamp: new Date() })
      );
      setLastSaved(new Date());
    }
  }, [testData, patientId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`eye-test-draft-${patientId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setTestData(parsed);
        toast({
          title: "Draft Restored",
          description: "Your previous work has been restored.",
        });
      } catch (error) {
        console.error("Failed to restore draft:", error);
      }
    }
  }, [patientId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ⌘/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        autoSave();
        toast({
          title: "Progress Saved",
          description: "Your work has been saved as a draft.",
        });
      }
      // ⌘/Ctrl + → to go next
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowRight") {
        e.preventDefault();
        if (currentStep < WIZARD_STEPS.length - 1) {
          handleNext();
        }
      }
      // ⌘/Ctrl + ← to go previous
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentStep > 0) {
          handlePrevious();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentStep, autoSave]);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      autoSave();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const updateTestData = (stepId: string, data: any) => {
    setTestData((prev) => ({
      ...prev,
      [stepId]: data,
    }));
  };

  // Final submission
  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/patients/${patientId}/examination`, {
        ...testData,
        completedAt: new Date(),
      });
    },
    onSuccess: () => {
      localStorage.removeItem(`eye-test-draft-${patientId}`);
      toast({
        title: "Examination Complete!",
        description: "Eye test results have been saved successfully.",
      });
      setLocation(`/ecp/patients/${patientId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save examination results.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/ecp/patients/${patientId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              Eye Examination
            </h1>
            <p className="text-sm text-muted-foreground">
              Patient: <span className="font-medium">{patient?.name}</span>
              {patient?.nhsNumber && (
                <span className="ml-2">• NHS: {patient.nhsNumber}</span>
              )}
            </p>
          </div>
        </div>

        {/* Auto-save indicator */}
        <div className="flex items-center gap-3">
          {lastSaved && (
            <Badge variant="outline" className="text-xs">
              <Save className="w-3 h-3 mr-1" />
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={autoSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      {/* Wizard Stepper */}
      <Card>
        <CardContent className="pt-6">
          <WizardStepper
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            allowStepNavigation={true}
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {WIZARD_STEPS[currentStep].icon && (
              <WIZARD_STEPS[currentStep].icon className="w-5 h-5" />
            )}
            {WIZARD_STEPS[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Content */}
          {currentStep === 0 && (
            <PatientHistoryStep
              data={testData.patientHistory}
              onChange={(data) => updateTestData("patientHistory", data)}
            />
          )}
          
          {currentStep === 1 && (
            <VisualAcuityStep
              data={testData.visualAcuity}
              onChange={(data) => updateTestData("visualAcuity", data)}
            />
          )}
          
          {currentStep === 2 && (
            <ColorVisionStep
              data={testData.colorBlindness}
              onChange={(data) => updateTestData("colorBlindness", data)}
            />
          )}
          
          {currentStep === 3 && (
            <VisualFieldStep
              data={testData.visualField}
              onChange={(data) => updateTestData("visualField", data)}
            />
          )}
          
          {currentStep === 4 && (
            <ReviewStep testData={testData} patient={patient} />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘</kbd>
              <span className="mx-1">+</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←</kbd>
              <span className="mx-2">/</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">→</kbd>
              <span className="ml-2">to navigate</span>
            </div>

            {currentStep === WIZARD_STEPS.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Examination
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded">⌘S</kbd>
              Save
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded">⌘→</kbd>
              Next
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded">⌘←</kbd>
              Previous
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step Components (placeholders for now - will expand)
function PatientHistoryStep({ data, onChange }: any) {
  return <div className="space-y-4">{/* Patient history form */}</div>;
}

function VisualAcuityStep({ data, onChange }: any) {
  return (
    <div className="space-y-4">
      <VisualAcuityChart
        onResultChange={(results) => onChange(results)}
      />
    </div>
  );
}

function ColorVisionStep({ data, onChange }: any) {
  return (
    <div className="space-y-4">
      <ColorBlindnessTest
        onComplete={(result) => onChange(result)}
      />
    </div>
  );
}

function VisualFieldStep({ data, onChange }: any) {
  return (
    <div className="space-y-4">
      <VisualFieldTest
        onTestComplete={(results) => onChange(results)}
      />
    </div>
  );
}

function ReviewStep({ testData, patient }: any) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Examination Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Patient</dt>
                <dd className="font-semibold">{patient?.name}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Date</dt>
                <dd className="font-semibold">
                  {new Date().toLocaleDateString()}
                </dd>
              </div>
              {/* Add more summary fields */}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
