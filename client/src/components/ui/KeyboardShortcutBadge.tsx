import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KeyboardShortcutBadgeProps {
  shortcut: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
}

/**
 * Display a keyboard shortcut badge
 * 
 * @example
 * <KeyboardShortcutBadge shortcut="⌘N" />
 * <KeyboardShortcutBadge shortcut="Ctrl+S" variant="outline" />
 */
export function KeyboardShortcutBadge({ shortcut, className, variant = 'secondary' }: KeyboardShortcutBadgeProps) {
  return (
    <Badge 
      variant={variant} 
      className={cn(
        'font-mono text-xs px-1.5 py-0.5 h-5',
        className
      )}
    >
      {shortcut}
    </Badge>
  );
}

/**
 * Display keyboard shortcut as KBD element
 * 
 * @example
 * <Kbd>⌘K</Kbd>
 * <Kbd>Ctrl+N</Kbd>
 */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd 
      className={cn(
        'inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-medium bg-muted border border-border rounded shadow-sm',
        className
      )}
    >
      {children}
    </kbd>
  );
}
