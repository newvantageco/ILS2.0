import React, { useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
  onNext?: () => void | Promise<void>;
  onPrevious?: () => void | Promise<void>;
}

interface WizardStepperProps {
  steps: WizardStep[];
  onComplete?: () => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  showStepNumbers?: boolean;
  allowSkip?: boolean;
  persistProgress?: boolean;
  storageKey?: string;
}

export function WizardStepper({
  steps,
  onComplete,
  onCancel,
  className,
  showStepNumbers = true,
  allowSkip = false,
  persistProgress = false,
  storageKey = 'wizard-progress',
}: WizardStepperProps) {
  // Load persisted step from localStorage if enabled
  const getInitialStep = () => {
    if (persistProgress && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 0 && parsed < steps.length) {
          return parsed;
        }
      }
    }
    return 0;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const currentStepData = steps[currentStep];

  // Persist current step to localStorage
  const persistStep = useCallback(
    (step: number) => {
      if (persistProgress && storageKey) {
        localStorage.setItem(storageKey, step.toString());
      }
    },
    [persistProgress, storageKey]
  );

  const handleNext = useCallback(async () => {
    setIsValidating(true);

    try {
      // Run validation if provided
      if (currentStepData.validate) {
        const isValid = await currentStepData.validate();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      }

      // Run onNext callback if provided
      if (currentStepData.onNext) {
        await currentStepData.onNext();
      }

      // Mark current step as completed
      setCompletedSteps((prev) => new Set(prev).add(currentStep));

      // Move to next step or complete
      if (currentStep === steps.length - 1) {
        // Last step - complete the wizard
        if (onComplete) {
          await onComplete();
        }
        // Clear persisted progress on completion
        if (persistProgress && storageKey) {
          localStorage.removeItem(storageKey);
        }
      } else {
        setDirection('forward');
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        persistStep(nextStep);
      }
    } catch (error) {
      console.error('Error in wizard step:', error);
    } finally {
      setIsValidating(false);
    }
  }, [currentStep, currentStepData, steps.length, onComplete, persistProgress, storageKey, persistStep]);

  const handlePrevious = useCallback(async () => {
    if (currentStep > 0) {
      // Run onPrevious callback if provided
      if (currentStepData.onPrevious) {
        await currentStepData.onPrevious();
      }

      setDirection('backward');
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      persistStep(prevStep);
    }
  }, [currentStep, currentStepData, persistStep]);

  const handleSkip = useCallback(() => {
    if (allowSkip && currentStep < steps.length - 1) {
      setDirection('forward');
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      persistStep(nextStep);
    }
  }, [allowSkip, currentStep, steps.length, persistStep]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setDirection(stepIndex > currentStep ? 'forward' : 'backward');
        setCurrentStep(stepIndex);
        persistStep(stepIndex);
      }
    },
    [currentStep, steps.length, persistStep]
  );

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Step Indicators */}
      <div className="mb-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          </div>
          <div className="mt-2 text-sm text-muted-foreground text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Step Pills */}
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isClickable = index <= currentStep || completedSteps.has(index);

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => isClickable && goToStep(index)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isCurrent && 'bg-primary text-primary-foreground shadow-md',
                    isCompleted && !isCurrent && 'bg-primary/20 text-primary hover:bg-primary/30',
                    !isCurrent && !isCompleted && 'bg-muted text-muted-foreground',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    ) : showStepNumbers ? (
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium',
                          isCurrent ? 'bg-primary-foreground text-primary' : 'bg-background text-foreground'
                        )}
                      >
                        {index + 1}
                      </div>
                    ) : step.icon ? (
                      <div className="w-5 h-5">{step.icon}</div>
                    ) : null}
                    <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                  </div>
                </button>

                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
          {currentStepData.description && (
            <p className="text-muted-foreground">{currentStepData.description}</p>
          )}
        </div>

        <div className="min-h-[300px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={(dir) => ({
                opacity: 0,
                x: dir === 'forward' ? 50 : -50,
              })}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={(dir) => ({
                opacity: 0,
                x: dir === 'forward' ? -50 : 50,
              })}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {currentStepData.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isValidating}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}

            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isValidating}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {allowSkip && currentStep < steps.length - 1 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isValidating}
              >
                Skip
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={isValidating}
              className="min-w-[120px]"
            >
              {isValidating ? (
                'Validating...'
              ) : currentStep === steps.length - 1 ? (
                'Complete'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Export types for use in consuming components
export type { WizardStepperProps };
