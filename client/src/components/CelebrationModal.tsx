/**
 * Celebration Modal with Confetti
 * Provides delightful success moments with animations
 */

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Trophy, Star, Sparkles, PartyPopper } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";

export interface CelebrationConfig {
  title: string;
  message: string;
  icon?: "check" | "trophy" | "star" | "sparkles" | "party";
  confettiType?: "default" | "stars" | "fireworks" | "cannon";
  badge?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: number; // Auto-close after X milliseconds
}

interface CelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CelebrationConfig;
}

export function CelebrationModal({
  open,
  onOpenChange,
  config,
}: CelebrationModalProps) {
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (open && !hasTriggered) {
      triggerConfetti(config.confettiType || "default");
      setHasTriggered(true);

      if (config.autoClose) {
        const timer = setTimeout(() => {
          onOpenChange(false);
        }, config.autoClose);
        return () => clearTimeout(timer);
      }
    }

    if (!open) {
      setHasTriggered(false);
    }
  }, [open, hasTriggered, config.confettiType, config.autoClose, onOpenChange]);

  const getIcon = () => {
    const iconClass = "h-16 w-16 text-green-500";
    switch (config.icon) {
      case "trophy":
        return <Trophy className={iconClass} />;
      case "star":
        return <Star className={iconClass} />;
      case "sparkles":
        return <Sparkles className={iconClass} />;
      case "party":
        return <PartyPopper className={iconClass} />;
      default:
        return <CheckCircle2 className={iconClass} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-green-100 dark:bg-green-950 p-4 animate-bounce">
              {getIcon()}
            </div>
            
            {config.badge && (
              <Badge variant="secondary" className="text-sm px-4 py-1">
                {config.badge}
              </Badge>
            )}
            
            <DialogTitle className="text-center text-2xl">
              {config.title}
            </DialogTitle>
            
            <DialogDescription className="text-center text-base">
              {config.message}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {config.secondaryAction && (
            <Button
              variant="outline"
              onClick={() => {
                config.secondaryAction?.onClick();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto"
            >
              {config.secondaryAction.label}
            </Button>
          )}
          
          {config.primaryAction && (
            <Button
              onClick={() => {
                config.primaryAction?.onClick();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto"
            >
              {config.primaryAction.label}
            </Button>
          )}
          
          {!config.primaryAction && !config.secondaryAction && (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Confetti Animation Functions
 */
function triggerConfetti(type: "default" | "stars" | "fireworks" | "cannon") {
  switch (type) {
    case "stars":
      triggerStarsConfetti();
      break;
    case "fireworks":
      triggerFireworksConfetti();
      break;
    case "cannon":
      triggerCannonConfetti();
      break;
    default:
      triggerDefaultConfetti();
  }
}

function triggerDefaultConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

function triggerStarsConfetti() {
  const defaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    shapes: ["star"],
    colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
  };

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ["star"],
    });

    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ["circle"],
    });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

function triggerFireworksConfetti() {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

function triggerCannonConfetti() {
  const end = Date.now() + 1 * 1000;

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Pre-configured Celebrations
 */
export const celebrations = {
  onboardingComplete: {
    title: "Welcome to ILS! 🎉",
    message: "Your account is all set up. Let's start creating orders!",
    icon: "party" as const,
    confettiType: "fireworks" as const,
    badge: "Setup Complete",
    primaryAction: {
      label: "Create First Order",
      onClick: () => (window.location.href = "/orders/new"),
    },
    secondaryAction: {
      label: "Explore Dashboard",
      onClick: () => (window.location.href = "/dashboard"),
    },
  },

  firstOrder: {
    title: "First Order Created! 🎊",
    message: "Great job! Your order is being processed by the lab.",
    icon: "trophy" as const,
    confettiType: "stars" as const,
    badge: "Milestone Achieved",
  },

  inventorySetup: {
    title: "Inventory Ready! ✨",
    message: "You've added your first products to inventory.",
    icon: "sparkles" as const,
    confettiType: "default" as const,
  },

  eyeTestComplete: {
    title: "Eye Test Completed! 👁️",
    message: "Patient examination saved successfully.",
    icon: "check" as const,
    confettiType: "default" as const,
  },

  subscriptionUpgrade: {
    title: "Upgraded to Professional! 🚀",
    message: "You now have access to advanced features and unlimited AI queries.",
    icon: "star" as const,
    confettiType: "cannon" as const,
    badge: "Professional Plan",
  },

  goalReached: {
    title: "Monthly Goal Reached! 🏆",
    message: "Congratulations! You've hit your monthly order target.",
    icon: "trophy" as const,
    confettiType: "fireworks" as const,
  },
};

/**
 * Hook for easy celebration triggering
 */
export function useCelebration() {
  const [celebrationState, setCelebrationState] = useState<{
    open: boolean;
    config: CelebrationConfig | null;
  }>({ open: false, config: null });

  const celebrate = (config: CelebrationConfig) => {
    setCelebrationState({ open: true, config });
  };

  const closeCelebration = () => {
    setCelebrationState({ open: false, config: null });
  };

  return {
    celebrate,
    celebrationState,
    closeCelebration,
  };
}
