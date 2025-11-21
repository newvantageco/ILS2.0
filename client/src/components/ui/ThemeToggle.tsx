/**
 * Theme Toggle Component
 *
 * Beautiful animated dark/light mode toggle with system preference detection
 * Features: smooth animations, icon transitions, keyboard support
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "switch" | "dropdown";
}

const iconVariants = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: { scale: 1, rotate: 0, opacity: 1 },
  exit: { scale: 0, rotate: 180, opacity: 0 },
};

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

// Get initial theme from localStorage or system preference
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";

  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored && ["light", "dark", "system"].includes(stored)) {
    return stored;
  }
  return "system";
}

// Get actual theme based on system preference
function getActualTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const actual = getActualTheme(theme);
    setActualTheme(actual);

    if (actual === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        setActualTheme(getActualTheme("system"));
        const root = document.documentElement;
        if (mediaQuery.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(actualTheme === "dark" ? "light" : "dark");
  };

  // Simple Icon Button Toggle
  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={cn("relative w-10 h-10 rounded-full", className)}
        aria-label={`Switch to ${actualTheme === "dark" ? "light" : "dark"} mode`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {actualTheme === "dark" ? (
            <motion.div
              key="moon"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className="absolute"
            >
              <Moon className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className="absolute"
            >
              <Sun className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    );
  }

  // Animated Switch Toggle
  if (variant === "switch") {
    return (
      <motion.button
        onClick={toggleTheme}
        className={cn(
          "relative w-16 h-8 rounded-full p-1 transition-colors duration-300",
          actualTheme === "dark"
            ? "bg-slate-700"
            : "bg-amber-100",
          className
        )}
        aria-label={`Switch to ${actualTheme === "dark" ? "light" : "dark"} mode`}
        whileTap={{ scale: 0.95 }}
      >
        {/* Background Icons */}
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <Sun className={cn(
            "w-4 h-4 transition-opacity",
            actualTheme === "dark" ? "opacity-30" : "opacity-100 text-amber-500"
          )} />
          <Moon className={cn(
            "w-4 h-4 transition-opacity",
            actualTheme === "dark" ? "opacity-100 text-blue-300" : "opacity-30"
          )} />
        </div>

        {/* Sliding Knob */}
        <motion.div
          layout
          className={cn(
            "relative w-6 h-6 rounded-full shadow-md flex items-center justify-center z-10",
            actualTheme === "dark"
              ? "bg-slate-900"
              : "bg-white"
          )}
          initial={false}
          animate={{
            x: actualTheme === "dark" ? 32 : 0,
          }}
          transition={springTransition}
        >
          <AnimatePresence mode="wait" initial={false}>
            {actualTheme === "dark" ? (
              <motion.div
                key="moon-knob"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <Moon className="w-3 h-3 text-blue-300" />
              </motion.div>
            ) : (
              <motion.div
                key="sun-knob"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <Sun className="w-3 h-3 text-amber-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.button>
    );
  }

  // Dropdown Menu with System Option
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative w-10 h-10 rounded-full", className)}
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "system" ? (
              <motion.div
                key="system"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springTransition}
                className="absolute"
              >
                <Monitor className="h-5 w-5" />
              </motion.div>
            ) : actualTheme === "dark" ? (
              <motion.div
                key="moon"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springTransition}
                className="absolute"
              >
                <Moon className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springTransition}
                className="absolute"
              >
                <Sun className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            theme === "light" && "bg-accent"
          )}
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === "light" && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            theme === "dark" && "bg-accent"
          )}
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            theme === "system" && "bg-accent"
          )}
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === "system" && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Standalone hook for theme management
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const actual = getActualTheme(theme);
    setActualTheme(actual);

    if (actual === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        setActualTheme(getActualTheme("system"));
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return {
    theme,
    setTheme,
    actualTheme,
    toggleTheme: () => setTheme(actualTheme === "dark" ? "light" : "dark"),
    isDark: actualTheme === "dark",
    isLight: actualTheme === "light",
    isSystem: theme === "system",
  };
}

export default ThemeToggle;
