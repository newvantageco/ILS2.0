import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingProgressProps {
  steps: OnboardingStep[];
  currentStep?: number;
  className?: string;
}

export function OnboardingProgress({
  steps,
  currentStep = 0,
  className,
}: OnboardingProgressProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Complete Your Setup
        </h3>
        <span className="text-sm text-gray-600">
          {steps.filter(s => s.completed).length} of {steps.length} complete
        </span>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
              step.completed
                ? 'bg-green-50 border-green-200'
                : index === currentStep
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                step.completed
                  ? 'bg-green-600 text-white'
                  : index === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              )}
            >
              {step.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                'flex-1 text-sm font-medium',
                step.completed
                  ? 'text-green-900'
                  : index === currentStep
                  ? 'text-blue-900'
                  : 'text-gray-700'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-500"
          style={{
            width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

// Compact version for header
export function OnboardingProgressBadge({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
      <div className="relative w-5 h-5">
        <svg className="transform -rotate-90" viewBox="0 0 20 20">
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.2"
          />
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 8}`}
            strokeDashoffset={`${2 * Math.PI * 8 * (1 - completed / total)}`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="font-medium">
        {percentage}% Complete
      </span>
    </div>
  );
}
