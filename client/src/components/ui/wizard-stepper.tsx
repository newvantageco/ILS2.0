/**
 * Modern Wizard Stepper Component
 * 
 * A beautiful, animated multi-step process indicator
 * Used for eye tests, onboarding, and complex forms
 */

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowStepNavigation?: boolean;
}

export function WizardStepper({
  steps,
  currentStep,
  onStepClick,
  allowStepNavigation = false,
}: WizardStepperProps) {
  const handleStepClick = (index: number) => {
    if (allowStepNavigation && onStepClick) {
      onStepClick(index);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop: Horizontal stepper */}
      <div className="hidden md:block">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              const isUpcoming = index > currentStep;
              const isClickable = allowStepNavigation && (isComplete || isCurrent);

              return (
                <li
                  key={step.id}
                  className={cn(
                    "relative flex-1",
                    index !== steps.length - 1 && "pr-8"
                  )}
                >
                  {/* Connector line */}
                  {index !== steps.length - 1 && (
                    <div
                      className="absolute top-5 left-0 w-full h-0.5 -mr-8"
                      aria-hidden="true"
                    >
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          isComplete ? "bg-primary" : "bg-gray-200"
                        )}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={cn(
                      "relative flex flex-col items-center group",
                      isClickable && "cursor-pointer",
                      !isClickable && "cursor-default"
                    )}
                  >
                    {/* Step circle */}
                    <span
                      className={cn(
                        "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                        isComplete && "bg-primary border-primary text-white",
                        isCurrent && "bg-white border-primary text-primary shadow-lg scale-110",
                        isUpcoming && "bg-white border-gray-300 text-gray-400",
                        isClickable && "group-hover:shadow-lg group-hover:scale-105"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : step.icon ? (
                        <step.icon className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </span>

                    {/* Step label */}
                    <span className="mt-3 text-center">
                      <span
                        className={cn(
                          "block text-sm font-medium transition-colors",
                          (isComplete || isCurrent) && "text-primary",
                          isUpcoming && "text-gray-500"
                        )}
                      >
                        {step.title}
                      </span>
                      {step.description && (
                        <span className="block text-xs text-gray-500 mt-1">
                          {step.description}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Mobile: Vertical stepper */}
      <div className="block md:hidden">
        <nav aria-label="Progress">
          <ol className="space-y-4">
            {steps.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              const isUpcoming = index > currentStep;
              const isClickable = allowStepNavigation && (isComplete || isCurrent);

              return (
                <li key={step.id} className="relative">
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={cn(
                      "flex items-start w-full text-left p-3 rounded-lg transition-all",
                      isCurrent && "bg-primary/5 border border-primary/20",
                      isClickable && "hover:bg-gray-50"
                    )}
                  >
                    {/* Step indicator */}
                    <span
                      className={cn(
                        "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                        isComplete && "bg-primary border-primary text-white",
                        isCurrent && "bg-primary/10 border-primary text-primary",
                        isUpcoming && "bg-gray-100 border-gray-300 text-gray-400"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </span>

                    {/* Step content */}
                    <div className="ml-3 flex-1">
                      <span
                        className={cn(
                          "block text-sm font-medium",
                          (isComplete || isCurrent) && "text-primary",
                          isUpcoming && "text-gray-500"
                        )}
                      >
                        {step.title}
                      </span>
                      {step.description && (
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {step.description}
                        </span>
                      )}
                    </div>

                    {/* Current indicator */}
                    {isCurrent && (
                      <div className="ml-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      </div>
                    )}
                  </button>

                  {/* Vertical connector line */}
                  {index !== steps.length - 1 && (
                    <div className="absolute left-7 top-12 w-0.5 h-4 bg-gray-200" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactWizardStepper({
  steps,
  currentStep,
}: {
  steps: Step[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              isComplete && "bg-primary",
              isCurrent && "bg-primary animate-pulse",
              index > currentStep && "bg-gray-200"
            )}
          />
        );
      })}
    </div>
  );
}
