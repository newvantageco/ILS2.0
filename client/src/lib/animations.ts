/**
 * Advanced Animation Utilities
 * Framer Motion variants and helpers for consistent animations across the app
 */

import { Variants, Transition } from "framer-motion";

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  spring: {
    type: "spring" as const,
    stiffness: 260,
    damping: 20,
  },
  springBouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
  },
  springSmooth: {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
  },
  tween: {
    type: "tween" as const,
    duration: 0.3,
    ease: "easeInOut",
  },
  tweenFast: {
    type: "tween" as const,
    duration: 0.15,
    ease: "easeInOut",
  },
  tweenSlow: {
    type: "tween" as const,
    duration: 0.5,
    ease: "easeInOut",
  },
};

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transitions.tweenFast,
  },
};

export const slideVariants: Variants = {
  initial: (direction: "left" | "right" | "up" | "down" = "right") => ({
    opacity: 0,
    x: direction === "left" ? -50 : direction === "right" ? 50 : 0,
    y: direction === "up" ? -50 : direction === "down" ? 50 : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: transitions.spring,
  },
  exit: (direction: "left" | "right" | "up" | "down" = "left") => ({
    opacity: 0,
    x: direction === "left" ? -50 : direction === "right" ? 50 : 0,
    y: direction === "up" ? -50 : direction === "down" ? 50 : 0,
    transition: transitions.tweenFast,
  }),
};

export const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: transitions.tween,
  },
  exit: {
    opacity: 0,
    transition: transitions.tweenFast,
  },
};

export const scaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: transitions.tweenFast,
  },
};

// ============================================================================
// LIST ANIMATIONS
// ============================================================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: transitions.tweenFast,
  },
};

export const staggerItemHorizontal: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transitions.tweenFast,
  },
};

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: transitions.springBouncy,
  },
  tap: {
    scale: 0.98,
    transition: transitions.tweenFast,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: transitions.tweenFast,
  },
};

export const cardHoverVariants: Variants = {
  initial: {
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  hover: {
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    transition: transitions.tweenFast,
  },
};

// ============================================================================
// MODAL/DIALOG ANIMATIONS
// ============================================================================

export const modalOverlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: transitions.tweenFast,
  },
  exit: {
    opacity: 0,
    transition: transitions.tweenFast,
  },
};

export const modalContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: transitions.tweenFast,
  },
};

export const drawerVariants: Variants = {
  initial: (direction: "left" | "right" | "top" | "bottom" = "right") => ({
    x: direction === "left" ? "-100%" : direction === "right" ? "100%" : 0,
    y: direction === "top" ? "-100%" : direction === "bottom" ? "100%" : 0,
  }),
  animate: {
    x: 0,
    y: 0,
    transition: transitions.spring,
  },
  exit: (direction: "left" | "right" | "top" | "bottom" = "right") => ({
    x: direction === "left" ? "-100%" : direction === "right" ? "100%" : 0,
    y: direction === "top" ? "-100%" : direction === "bottom" ? "100%" : 0,
    transition: transitions.tweenFast,
  }),
};

// ============================================================================
// BUTTON ANIMATIONS
// ============================================================================

export const buttonVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: transitions.tweenFast,
  },
  tap: {
    scale: 0.95,
    transition: transitions.tweenFast,
  },
};

export const iconButtonVariants: Variants = {
  initial: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: transitions.springBouncy,
  },
  tap: {
    scale: 0.9,
    rotate: -5,
    transition: transitions.tweenFast,
  },
};

// ============================================================================
// NOTIFICATION/TOAST ANIMATIONS
// ============================================================================

export const notificationVariants: Variants = {
  initial: {
    opacity: 0,
    y: -100,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.springBouncy,
  },
  exit: {
    opacity: 0,
    x: 200,
    transition: transitions.tweenFast,
  },
};

// ============================================================================
// NUMBER COUNTER ANIMATION
// ============================================================================

export const createCounterAnimation = (from: number, to: number, duration = 1) => ({
  initial: { value: from },
  animate: {
    value: to,
    transition: {
      duration,
      ease: "easeOut",
    },
  },
});

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export const pulseVariants: Variants = {
  initial: {
    opacity: 1,
    scale: 1,
  },
  animate: {
    opacity: [1, 0.7, 1],
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const dotsVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ============================================================================
// PROGRESS ANIMATIONS
// ============================================================================

export const progressBarVariants: Variants = {
  initial: {
    scaleX: 0,
  },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: transitions.spring,
  }),
};

export const progressRingVariants = {
  initial: {
    pathLength: 0,
  },
  animate: (progress: number) => ({
    pathLength: progress / 100,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

// ============================================================================
// COLLAPSE/EXPAND ANIMATIONS
// ============================================================================

export const collapseVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: transitions.tweenFast,
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: transitions.spring,
  },
};

export const accordionVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
  },
  expanded: {
    height: "auto",
    opacity: 1,
    overflow: "visible",
    transition: transitions.spring,
  },
};

// ============================================================================
// GESTURE ANIMATIONS
// ============================================================================

export const swipeableVariants: Variants = {
  initial: {
    x: 0,
  },
  swipeLeft: {
    x: -100,
    transition: transitions.tweenFast,
  },
  swipeRight: {
    x: 100,
    transition: transitions.tweenFast,
  },
};

// ============================================================================
// ADVANCED EFFECTS
// ============================================================================

export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const glowVariants: Variants = {
  initial: {
    boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)",
  },
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(59, 130, 246, 0.4)",
      "0 0 0 10px rgba(59, 130, 246, 0)",
      "0 0 0 0 rgba(59, 130, 246, 0)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a stagger delay for list items
 */
export const getStaggerDelay = (index: number, baseDelay = 0.05) => {
  return index * baseDelay;
};

/**
 * Create custom spring transition
 */
export const createSpringTransition = (
  stiffness = 260,
  damping = 20
): Transition => ({
  type: "spring",
  stiffness,
  damping,
});

/**
 * Create custom tween transition
 */
export const createTweenTransition = (
  duration = 0.3,
  ease: string | number[] = "easeInOut"
): Transition => ({
  type: "tween",
  duration,
  ease,
});

/**
 * Combine multiple variants
 */
export const combineVariants = (...variants: Variants[]): Variants => {
  return variants.reduce((acc, variant) => ({ ...acc, ...variant }), {});
};

// ============================================================================
// PRESET ANIMATIONS
// ============================================================================

export const presetAnimations = {
  // Fade in from bottom
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  // Fade in from top
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  // Zoom in
  zoomIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  // Slide from right
  slideFromRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
  },
  // Slide from left
  slideFromLeft: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  },
  // Flip in
  flipIn: {
    initial: { opacity: 0, rotateX: -90 },
    animate: { opacity: 1, rotateX: 0 },
    exit: { opacity: 0, rotateX: 90 },
  },
  // Bounce in
  bounceIn: {
    initial: { opacity: 0, scale: 0 },
    animate: {
      opacity: 1,
      scale: [0, 1.2, 1],
      transition: transitions.springBouncy,
    },
    exit: { opacity: 0, scale: 0 },
  },
};

export default {
  transitions,
  pageVariants,
  slideVariants,
  fadeVariants,
  scaleVariants,
  staggerContainer,
  staggerItem,
  cardVariants,
  modalOverlayVariants,
  modalContentVariants,
  buttonVariants,
  notificationVariants,
  collapseVariants,
  presetAnimations,
};
