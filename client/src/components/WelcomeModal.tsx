import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, ShoppingBag, BarChart, Users } from 'lucide-react';
import { useLocation } from 'wouter';

interface WelcomeModalProps {
  open?: boolean;
  onClose?: () => void;
}

export function WelcomeModal({ open: controlledOpen, onClose }: WelcomeModalProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome && controlledOpen === undefined) {
      setOpen(true);
    } else if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
    }
  }, [controlledOpen]);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setOpen(false);
    onClose?.();
  };

  const handleGetStarted = () => {
    handleClose();
    setLocation('/signup');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const steps = [
    {
      icon: Sparkles,
      title: 'Welcome to ILS!',
      description: 'The all-in-one platform for modern eyecare. Unify your practice, lab, and suppliers in one powerful system.',
      color: 'blue',
    },
    {
      icon: ShoppingBag,
      title: 'Streamline Operations',
      description: 'Process POS transactions, manage prescriptions, and order lenses—all from one dashboard. Say goodbye to juggling multiple systems.',
      color: 'green',
    },
    {
      icon: BarChart,
      title: 'AI-Powered Insights',
      description: 'Get morning briefings, low stock alerts, and autonomous purchase order recommendations. Let AI handle the routine tasks.',
      color: 'purple',
    },
    {
      icon: Users,
      title: 'Connect Your Network',
      description: 'Join our marketplace to connect with labs and suppliers. Direct ordering, real-time tracking, and seamless collaboration.',
      color: 'orange',
    },
  ];

  const step = steps[currentStep];
  const Icon = step.icon;

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to ILS</DialogTitle>
          <DialogDescription className="sr-only">
            Get started with the Integrated Lens System
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full ${colorClasses[step.color as keyof typeof colorClasses]} flex items-center justify-center`}>
              <Icon className="h-10 w-10" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {step.title}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-blue-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
