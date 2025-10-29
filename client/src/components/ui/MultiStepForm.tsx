import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  content: React.ReactNode;
}

interface MultiStepFormProps {
  steps: Step[];
  onComplete: (data: Record<string, any>) => void;
  onCancel?: () => void;
  className?: string;
}

export function MultiStepForm({
  steps,
  onComplete,
  onCancel,
  className,
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
    new Set()
  );

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (!isLastStep) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on completed steps or the next step
    if (completedSteps.has(stepIndex) || stepIndex === currentStep + 1) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isClickable = isCompleted || index === currentStep + 1;

          return (
            <React.Fragment key={step.id}>
              <motion.button
                onClick={() => isClickable && handleStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 flex-1",
                  isClickable && "cursor-pointer",
                  !isClickable && "opacity-50 cursor-not-allowed"
                )}
                whileHover={isClickable ? { scale: 1.05 } : {}}
              >
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                    isCompleted &&
                      "bg-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground"
                  )}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                  }}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </motion.div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.optional && (
                    <p className="text-xs text-muted-foreground">Optional</p>
                  )}
                </div>
              </motion.button>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          <div className="mb-4">
            <h3 className="text-2xl font-semibold">{currentStepData.title}</h3>
            {currentStepData.description && (
              <p className="text-muted-foreground mt-1">
                {currentStepData.description}
              </p>
            )}
          </div>
          {currentStepData.content}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-2">
          {!isFirstStep && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <Button onClick={handleNext}>
          {isLastStep ? (
            "Complete"
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
