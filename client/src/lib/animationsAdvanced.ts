/**
 * Advanced Animation System - Super Enhanced Edition
 *
 * A comprehensive animation library with performance optimization,
 * accessibility features, and advanced effects for production use.
 *
 * @module animationsAdvanced
 * @author Claude Code
 */

import { Variants, Transition, MotionProps } from "framer-motion";

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get appropriate transition based on user preferences
 */
export const getAccessibleTransition = (
  normalTransition: Transition,
  reducedTransition: Transition = { duration: 0.01 }
): Transition => {
  return prefersReducedMotion() ? reducedTransition : normalTransition;
};

/**
 * Optimize animations for performance
 */
export const performanceOptimizedProps: MotionProps = {
  style: {
    willChange: 'transform',
  },
  layout: false,
};

// ============================================================================
// ADVANCED TRANSITIONS
// ============================================================================

export const advancedTransitions = {
  // Smooth physics-based springs
  physics: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  physicsBouncy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 28,
    mass: 0.5,
  },
  physicsGentle: {
    type: "spring" as const,
    stiffness: 150,
    damping: 25,
    mass: 1,
  },

  // Bezier curve tweens
  bezierSmooth: {
    type: "tween" as const,
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1], // Custom bezier
  },
  bezierSharp: {
    type: "tween" as const,
    duration: 0.3,
    ease: [0.4, 0, 0.6, 1],
  },
  bezierEaseOut: {
    type: "tween" as const,
    duration: 0.35,
    ease: [0, 0, 0.2, 1],
  },

  // Special effects
  elastic: {
    type: "spring" as const,
    stiffness: 600,
    damping: 15,
  },
  bounce: {
    type: "spring" as const,
    stiffness: 700,
    damping: 12,
    mass: 0.3,
  },
};

// ============================================================================
// 3D TRANSFORM ANIMATIONS
// ============================================================================

export const transform3DVariants: Variants = {
  initial: {
    opacity: 0,
    rotateX: -15,
    rotateY: 15,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: advancedTransitions.physics,
  },
  exit: {
    opacity: 0,
    rotateX: 15,
    rotateY: -15,
    scale: 0.9,
    transition: advancedTransitions.bezierSharp,
  },
};

export const flipCardVariants: Variants = {
  front: {
    rotateY: 0,
    transition: advancedTransitions.physics,
  },
  back: {
    rotateY: 180,
    transition: advancedTransitions.physics,
  },
};

export const cubeRotateVariants: Variants = {
  initial: {
    rotateY: -90,
    opacity: 0,
  },
  animate: {
    rotateY: 0,
    opacity: 1,
    transition: advancedTransitions.physics,
  },
  exit: {
    rotateY: 90,
    opacity: 0,
    transition: advancedTransitions.bezierSharp,
  },
};

// ============================================================================
// PARALLAX EFFECTS
// ============================================================================

export const createParallaxVariant = (speed: number = 0.5): Variants => ({
  initial: { y: 0 },
  animate: {
    y: [0, -50 * speed, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
});

export const parallaxLayerVariants = {
  background: createParallaxVariant(0.3),
  midground: createParallaxVariant(0.6),
  foreground: createParallaxVariant(1),
};

// ============================================================================
// MORPHING ANIMATIONS
// ============================================================================

export const morphVariants: Variants = {
  circle: {
    borderRadius: "50%",
    transition: advancedTransitions.physics,
  },
  square: {
    borderRadius: "0%",
    transition: advancedTransitions.physics,
  },
  rounded: {
    borderRadius: "12px",
    transition: advancedTransitions.physics,
  },
};

export const sizeTransformVariants: Variants = {
  compact: {
    scale: 0.8,
    opacity: 0.8,
    transition: advancedTransitions.bezierSmooth,
  },
  normal: {
    scale: 1,
    opacity: 1,
    transition: advancedTransitions.bezierSmooth,
  },
  expanded: {
    scale: 1.2,
    opacity: 1,
    transition: advancedTransitions.bezierSmooth,
  },
};

// ============================================================================
// ADVANCED STAGGER PATTERNS
// ============================================================================

export const staggerPatterns = {
  // Sequential from first to last
  sequential: {
    staggerChildren: 0.08,
    delayChildren: 0.1,
  },
  // Reverse order
  reverse: {
    staggerChildren: 0.08,
    delayChildren: 0.1,
    staggerDirection: -1 as const,
  },
  // From center outward
  centerOut: {
    staggerChildren: 0.06,
    delayChildren: 0.15,
  },
  // Random order
  random: {
    staggerChildren: 0.05,
    delayChildren: 0.1,
  },
  // Wave effect
  wave: {
    staggerChildren: 0.03,
    delayChildren: 0.05,
  },
};

export const createGridStagger = (
  rows: number,
  cols: number,
  delay: number = 0.05
) => ({
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: 0.1,
    },
  },
});

// ============================================================================
// TEXT ANIMATIONS
// ============================================================================

export const textRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export const textGlitchVariants: Variants = {
  initial: {
    opacity: 1,
    x: 0,
  },
  glitch: {
    opacity: [1, 0.8, 1, 0.9, 1],
    x: [-2, 2, -2, 2, 0],
    textShadow: [
      "0 0 0 transparent",
      "2px 0 0 #ff0000, -2px 0 0 #00ffff",
      "0 0 0 transparent",
    ],
    transition: {
      duration: 0.3,
      times: [0, 0.25, 0.5, 0.75, 1],
    },
  },
};

export const typewriterVariants: Variants = {
  hidden: { width: 0 },
  visible: {
    width: "100%",
    transition: {
      duration: 2,
      ease: "linear",
    },
  },
};

// ============================================================================
// DATA VISUALIZATION ANIMATIONS
// ============================================================================

export const chartLineVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.5, ease: "easeInOut" },
      opacity: { duration: 0.3 },
    },
  },
};

export const barChartVariants: Variants = {
  hidden: {
    scaleY: 0,
    opacity: 0,
  },
  visible: (i: number = 0) => ({
    scaleY: 1,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export const pieChartVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: (i: number = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: "easeOut",
    },
  }),
};

// ============================================================================
// SCROLL-TRIGGERED ANIMATIONS
// ============================================================================

export const scrollFadeInVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: advancedTransitions.physics,
  },
};

export const scrollSlideInVariants = (direction: "left" | "right" = "left"): Variants => ({
  hidden: {
    opacity: 0,
    x: direction === "left" ? -100 : 100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: advancedTransitions.physics,
  },
});

export const scrollScaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: advancedTransitions.physicsBouncy,
  },
};

// ============================================================================
// LOADING STATES
// ============================================================================

export const skeletonPulseVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const shimmerLoadingVariants: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const progressBarVariants: Variants = {
  initial: {
    scaleX: 0,
    transformOrigin: "left",
  },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

// ============================================================================
// NOTIFICATION & ALERT ANIMATIONS
// ============================================================================

export const alertVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: advancedTransitions.physicsBouncy,
  },
  exit: {
    opacity: 0,
    x: 300,
    transition: advancedTransitions.bezierSharp,
  },
};

export const successCheckmarkVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: "easeOut" },
      opacity: { duration: 0.2 },
    },
  },
};

// ============================================================================
// GESTURE-BASED ANIMATIONS
// ============================================================================

export const dragConstraints = {
  top: -50,
  bottom: 50,
  left: -50,
  right: 50,
};

export const swipeableCardVariants: Variants = {
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.5,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

// ============================================================================
// ADVANCED EASING FUNCTIONS
// ============================================================================

export const customEasings = {
  // Material Design
  materialStandard: [0.4, 0.0, 0.2, 1],
  materialDecelerate: [0.0, 0.0, 0.2, 1],
  materialAccelerate: [0.4, 0.0, 1, 1],

  // iOS
  iosStandard: [0.25, 0.1, 0.25, 1],

  // Custom
  snappy: [0.5, 0, 0.5, 1],
  smooth: [0.3, 0, 0.3, 1],
  dramatic: [0.7, 0, 0.3, 1],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a custom stagger with dynamic delay
 */
export const createDynamicStagger = (
  baseDelay: number,
  itemCount: number,
  maxDelay: number = 1
) => {
  const calculatedDelay = Math.min(baseDelay, maxDelay / itemCount);
  return {
    staggerChildren: calculatedDelay,
    delayChildren: 0.1,
  };
};

/**
 * Get animation duration based on distance
 */
export const getDurationByDistance = (
  distance: number,
  minDuration: number = 0.3,
  maxDuration: number = 1,
  pixelsPerSecond: number = 500
): number => {
  const calculatedDuration = distance / pixelsPerSecond;
  return Math.max(minDuration, Math.min(maxDuration, calculatedDuration));
};

/**
 * Create viewport-based animation config
 */
export const createViewportConfig = (
  amount: number = 0.3,
  once: boolean = true
) => ({
  viewport: { once, amount },
});

/**
 * Combine multiple animations
 */
export const combineAnimations = (...animations: Variants[]): Variants => {
  return animations.reduce((acc, curr) => {
    Object.keys(curr).forEach(key => {
      acc[key] = { ...acc[key], ...curr[key] };
    });
    return acc;
  }, {} as Variants);
};

/**
 * Create responsive animation based on screen size
 */
export const createResponsiveVariant = (
  mobile: Variants,
  desktop: Variants
): Variants => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return isMobile ? mobile : desktop;
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Log animation performance
 */
export const logAnimationPerformance = (name: string, startTime: number) => {
  const duration = performance.now() - startTime;
  if (duration > 16.67) { // Slower than 60fps
    console.warn(`Animation "${name}" took ${duration.toFixed(2)}ms (target: <16.67ms)`);
  }
};

/**
 * Throttle animations based on performance
 */
export const shouldReduceAnimations = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check if device is low-end
  const connection = (navigator as any).connection;
  const lowEndDevice = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';

  return prefersReducedMotion() || lowEndDevice;
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  // Transitions
  advancedTransitions,
  customEasings,

  // 3D Effects
  transform3DVariants,
  flipCardVariants,
  cubeRotateVariants,

  // Patterns
  staggerPatterns,
  parallaxLayerVariants,

  // Text
  textRevealVariants,
  textGlitchVariants,
  typewriterVariants,

  // Charts
  chartLineVariants,
  barChartVariants,
  pieChartVariants,

  // Scroll
  scrollFadeInVariants,
  scrollSlideInVariants,
  scrollScaleInVariants,

  // Loading
  skeletonPulseVariants,
  shimmerLoadingVariants,
  progressBarVariants,

  // Notifications
  alertVariants,
  successCheckmarkVariants,

  // Gestures
  swipeableCardVariants,
  dragConstraints,

  // Utilities
  prefersReducedMotion,
  getAccessibleTransition,
  createDynamicStagger,
  getDurationByDistance,
  combineAnimations,
  shouldReduceAnimations,
};
