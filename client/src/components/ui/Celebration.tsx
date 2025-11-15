/**
 * Celebration Component
 *
 * Provides celebration animations (confetti, fireworks) for user achievements
 * and milestone moments to create positive reinforcement.
 *
 * Usage:
 * import { celebrate, useCelebration } from '@/components/ui/Celebration'
 *
 * // Simple usage:
 * celebrate('success')
 *
 * // With hook:
 * const { showCelebration } = useCelebration()
 * showCelebration({ type: 'milestone', message: 'First order!' })
 */

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, Star, Trophy, Zap, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type CelebrationType = 'success' | 'milestone' | 'achievement' | 'fireworks' | 'custom';

export interface CelebrationConfig {
  /** Type of celebration animation */
  type?: CelebrationType;

  /** Optional message to display */
  message?: string;

  /** Optional sub-message */
  subMessage?: string;

  /** Duration to show message (ms) */
  duration?: number;

  /** Custom confetti colors */
  colors?: string[];

  /** Intensity (1-10) */
  intensity?: number;

  /** Custom icon */
  icon?: React.ComponentType<{className?: string}>;
}

/**
 * Standalone celebration function
 */
export function celebrate(type: CelebrationType = 'success', config?: Partial<CelebrationConfig>) {
  const fullConfig: CelebrationConfig = {
    type,
    intensity: 5,
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
    ...config,
  };

  switch (type) {
    case 'success':
      confettiSuccess(fullConfig);
      break;
    case 'milestone':
      confettiMilestone(fullConfig);
      break;
    case 'achievement':
      confettiAchievement(fullConfig);
      break;
    case 'fireworks':
      confettiFireworks(fullConfig);
      break;
    default:
      confettiBasic(fullConfig);
  }
}

// Celebration Patterns

function confettiBasic(config: CelebrationConfig) {
  const count = (config.intensity || 5) * 20;
  const defaults = {
    origin: { y: 0.7 },
    colors: config.colors,
  };

  confetti({
    ...defaults,
    particleCount: count,
    spread: 70,
    startVelocity: 30,
  });
}

function confettiSuccess(config: CelebrationConfig) {
  const count = (config.intensity || 5) * 15;
  const colors = config.colors || ['#10b981', '#34d399'];

  // Burst from center
  confetti({
    particleCount: count,
    spread: 100,
    origin: { y: 0.6 },
    colors,
    shapes: ['circle', 'square'],
    ticks: 200,
  });
}

function confettiMilestone(config: CelebrationConfig) {
  const count = (config.intensity || 7) * 20;
  const colors = config.colors || ['#f59e0b', '#fbbf24', '#fcd34d'];

  // Star burst
  confetti({
    particleCount: count,
    spread: 360,
    origin: { y: 0.5 },
    colors,
    shapes: ['star'],
    scalar: 1.2,
    ticks: 300,
    gravity: 0.8,
  });
}

function confettiAchievement(config: CelebrationConfig) {
  const count = (config.intensity || 8) * 25;
  const colors = config.colors || ['#8b5cf6', '#a78bfa', '#c4b5fd'];

  // Trophy celebration
  const end = Date.now() + 1500;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

function confettiFireworks(config: CelebrationConfig) {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const colors = config.colors || ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...{
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
      },
      particleCount,
      origin: {
        x: randomInRange(0.1, 0.9),
        y: Math.random() - 0.2,
      },
      colors,
    });
  }, 250);
}

/**
 * Celebration Message Component
 */
interface CelebrationMessageProps extends CelebrationConfig {
  onComplete?: () => void;
}

export function CelebrationMessage({
  type = 'success',
  message,
  subMessage,
  duration = 3000,
  icon: Icon,
  onComplete,
}: CelebrationMessageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const iconMap = {
    success: CheckCircle,
    milestone: Star,
    achievement: Trophy,
    fireworks: PartyPopper,
    custom: Zap,
  };

  const IconComponent = Icon || iconMap[type] || CheckCircle;

  const colorMap = {
    success: 'text-green-500',
    milestone: 'text-yellow-500',
    achievement: 'text-purple-500',
    fireworks: 'text-blue-500',
    custom: 'text-gray-500',
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md text-center pointer-events-auto">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="inline-block"
        >
          <IconComponent className={cn('h-16 w-16 mx-auto', colorMap[type])} />
        </motion.div>

        {message && (
          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100"
          >
            {message}
          </motion.h3>
        )}

        {subMessage && (
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-gray-600 dark:text-gray-400"
          >
            {subMessage}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * useCelebration Hook
 *
 * React hook for managing celebrations with messages.
 *
 * Usage:
 * const { showCelebration } = useCelebration()
 * showCelebration({
 *   type: 'milestone',
 *   message: 'First Order Complete!',
 *   subMessage: 'You're on your way to success'
 * })
 */
export function useCelebration() {
  const [celebration, setCelebration] = useState<(CelebrationConfig & { show: boolean }) | null>(null);

  const showCelebration = (config: CelebrationConfig) => {
    // Trigger confetti
    celebrate(config.type || 'success', config);

    // Show message if provided
    if (config.message) {
      setCelebration({ ...config, show: true });
    }
  };

  const hideCelebration = () => {
    setCelebration(null);
  };

  const CelebrationComponent = () => (
    <AnimatePresence>
      {celebration?.show && (
        <CelebrationMessage
          {...celebration}
          onComplete={hideCelebration}
        />
      )}
    </AnimatePresence>
  );

  return {
    showCelebration,
    hideCelebration,
    CelebrationComponent,
  };
}

/**
 * Milestone Tracker
 *
 * Automatically celebrates user milestones.
 *
 * Usage:
 * const { checkMilestone } = useMilestoneTracker()
 * checkMilestone('orders-created', orderCount)
 */
export function useMilestoneTracker() {
  const { showCelebration } = useCelebration();

  const milestones = {
    'orders-created': [
      { value: 1, message: '🎉 First Order!', subMessage: 'Great start!' },
      { value: 10, message: '🌟 10 Orders!', subMessage: 'You're on a roll!' },
      { value: 50, message: '🏆 50 Orders!', subMessage: 'Incredible milestone!' },
      { value: 100, message: '🚀 100 Orders!', subMessage: 'You're a pro!' },
    ],
    'prescriptions-uploaded': [
      { value: 1, message: '📄 First Prescription!', subMessage: 'Well done!' },
      { value: 25, message: '📚 25 Prescriptions!', subMessage: 'Keep it up!' },
    ],
    'patients-added': [
      { value: 1, message: '👤 First Patient!', subMessage: 'Welcome aboard!' },
      { value: 50, message: '👥 50 Patients!', subMessage: 'Growing strong!' },
    ],
  };

  const checkMilestone = (type: keyof typeof milestones, currentValue: number) => {
    const typeMilestones = milestones[type];
    const achieved = typeMilestones.find((m) => m.value === currentValue);

    if (achieved) {
      const milestoneKey = `milestone-${type}-${currentValue}`;

      // Check if already celebrated
      if (localStorage.getItem(milestoneKey)) {
        return;
      }

      showCelebration({
        type: 'milestone',
        message: achieved.message,
        subMessage: achieved.subMessage,
        intensity: currentValue >= 100 ? 10 : currentValue >= 50 ? 8 : 6,
      });

      // Mark as celebrated
      localStorage.setItem(milestoneKey, 'true');
    }
  };

  return { checkMilestone };
}
