/**
 * Keyboard Shortcuts Help Modal
 *
 * A beautiful modal showing all available keyboard shortcuts
 * Triggered by pressing "?" or using the help menu
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Keyboard,
  Navigation,
  Search,
  Command,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ShortcutItem {
  keys: string[];
  description: string;
  category?: string;
}

interface ShortcutCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcuts: ShortcutItem[];
}

interface KeyboardShortcutsHelpProps {
  isOpen?: boolean;
  onClose?: () => void;
  userRole?: string;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

// Format key for display (Mac vs Windows)
function formatKey(key: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const keyMap: Record<string, { mac: string; win: string }> = {
    cmd: { mac: "⌘", win: "Ctrl" },
    ctrl: { mac: "⌃", win: "Ctrl" },
    alt: { mac: "⌥", win: "Alt" },
    shift: { mac: "⇧", win: "Shift" },
    enter: { mac: "↵", win: "Enter" },
    esc: { mac: "Esc", win: "Esc" },
    tab: { mac: "⇥", win: "Tab" },
    up: { mac: "↑", win: "↑" },
    down: { mac: "↓", win: "↓" },
    left: { mac: "←", win: "←" },
    right: { mac: "→", win: "→" },
  };

  const mapping = keyMap[key.toLowerCase()];
  if (mapping) {
    return isMac ? mapping.mac : mapping.win;
  }

  return key.toUpperCase();
}

// Keyboard key component
function KeyCap({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[24px] h-6 px-1.5",
        "text-xs font-medium",
        "bg-muted border border-border rounded",
        "shadow-[0_1px_0_1px_rgba(0,0,0,0.08)]",
        "text-muted-foreground"
      )}
    >
      {formatKey(children)}
    </kbd>
  );
}

// Shortcut row component
function ShortcutRow({ shortcut }: { shortcut: ShortcutItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <span className="text-sm">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, idx) => (
          <span key={idx} className="flex items-center">
            <KeyCap>{key}</KeyCap>
            {idx < shortcut.keys.length - 1 && (
              <span className="text-muted-foreground mx-0.5">+</span>
            )}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function KeyboardShortcutsHelp({
  isOpen: controlledOpen,
  onClose,
  userRole = "ecp",
}: KeyboardShortcutsHelpProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  // Listen for ? key to open help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        if (controlledOpen === undefined) {
          setInternalOpen((prev) => !prev);
        }
      }

      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [controlledOpen, isOpen]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };

  // Define shortcuts based on role
  const getShortcutCategories = (): ShortcutCategory[] => {
    const globalShortcuts: ShortcutCategory = {
      name: "Global",
      icon: Keyboard,
      shortcuts: [
        { keys: ["cmd", "k"], description: "Open command palette" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["esc"], description: "Close modal / Cancel" },
        { keys: ["cmd", "/"], description: "Toggle sidebar" },
      ],
    };

    const navigationShortcuts: ShortcutCategory = {
      name: "Navigation",
      icon: Navigation,
      shortcuts: [
        { keys: ["alt", "d"], description: "Go to dashboard" },
        { keys: ["alt", "s"], description: "Go to settings" },
        { keys: ["alt", "h"], description: "Go home" },
      ],
    };

    const searchShortcuts: ShortcutCategory = {
      name: "Search",
      icon: Search,
      shortcuts: [
        { keys: ["cmd", "f"], description: "Focus search" },
        { keys: ["enter"], description: "Select result" },
        { keys: ["up"], description: "Previous result" },
        { keys: ["down"], description: "Next result" },
      ],
    };

    // Role-specific shortcuts
    const roleShortcuts: ShortcutCategory = {
      name: "Actions",
      icon: Command,
      shortcuts: [],
    };

    if (userRole === "ecp") {
      roleShortcuts.shortcuts = [
        { keys: ["alt", "n"], description: "New patient" },
        { keys: ["alt", "o"], description: "New order" },
        { keys: ["alt", "p"], description: "Open POS" },
        { keys: ["cmd", "s"], description: "Save changes" },
        { keys: ["cmd", "enter"], description: "Submit form" },
      ];
    } else if (userRole === "lab_tech" || userRole === "engineer") {
      roleShortcuts.shortcuts = [
        { keys: ["alt", "q"], description: "View queue" },
        { keys: ["alt", "p"], description: "Production dashboard" },
        { keys: ["cmd", "shift", "s"], description: "Ship order" },
      ];
    } else if (userRole === "admin") {
      roleShortcuts.shortcuts = [
        { keys: ["alt", "u"], description: "User management" },
        { keys: ["alt", "c"], description: "Company settings" },
        { keys: ["alt", "a"], description: "Approve user" },
      ];
    }

    const systemShortcuts: ShortcutCategory = {
      name: "System",
      icon: Settings,
      shortcuts: [
        { keys: ["cmd", ","], description: "Open settings" },
        { keys: ["cmd", "shift", "l"], description: "Toggle dark mode" },
        { keys: ["f11"], description: "Toggle fullscreen" },
      ],
    };

    return [
      globalShortcuts,
      navigationShortcuts,
      searchShortcuts,
      roleShortcuts,
      systemShortcuts,
    ].filter((cat) => cat.shortcuts.length > 0);
  };

  const categories = getShortcutCategories();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                  <p className="text-sm text-muted-foreground">
                    Press{" "}
                    <KeyCap>?</KeyCap> anytime to show this help
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((category) => (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <category.icon className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">{category.name}</h3>
                    </div>
                    <div className="space-y-1">
                      {category.shortcuts.map((shortcut, idx) => (
                        <ShortcutRow key={idx} shortcut={shortcut} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HelpCircle className="w-4 h-4" />
                <span>Shortcuts work when not in an input field</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {navigator.platform.toUpperCase().indexOf("MAC") >= 0
                  ? "macOS"
                  : "Windows/Linux"}
              </Badge>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Simple hook to toggle keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA" &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

export default KeyboardShortcutsHelp;
