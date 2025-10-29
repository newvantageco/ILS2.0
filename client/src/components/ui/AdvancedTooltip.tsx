import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AdvancedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  className?: string;
  showArrow?: boolean;
  rich?: boolean; // For rich content with styling
}

export function AdvancedTooltip({
  children,
  content,
  side = "top",
  align = "center",
  delayDuration = 200,
  className,
  showArrow = true,
  rich = false,
}: AdvancedTooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <AnimatePresence>
          {open && (
            <TooltipPrimitive.Portal forceMount>
              <TooltipPrimitive.Content
                side={side}
                align={align}
                className={cn(
                  "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
                  rich && "px-4 py-3 max-w-xs",
                  className
                )}
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: side === "top" ? 4 : -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: side === "top" ? 4 : -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {content}
                  {showArrow && <TooltipPrimitive.Arrow className="fill-popover" />}
                </motion.div>
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// Specialized tooltip for keyboard shortcuts
export function KeyboardShortcutTooltip({
  children,
  keys,
  description,
}: {
  children: React.ReactNode;
  keys: string[];
  description: string;
}) {
  return (
    <AdvancedTooltip
      content={
        <div className="flex flex-col gap-1">
          <p className="font-medium">{description}</p>
          <div className="flex gap-1 mt-1">
            {keys.map((key, i) => (
              <React.Fragment key={key}>
                {i > 0 && <span className="text-muted-foreground">+</span>}
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                  {key}
                </kbd>
              </React.Fragment>
            ))}
          </div>
        </div>
      }
      rich
    >
      {children}
    </AdvancedTooltip>
  );
}
