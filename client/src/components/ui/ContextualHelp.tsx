/**
 * ContextualHelp Component
 *
 * Provides inline contextual help with tooltips, popovers, and documentation links.
 * Helps users understand complex features without leaving the page.
 *
 * Usage:
 * <ContextualHelp
 *   title="What is a LIMS job?"
 *   content="LIMS (Laboratory Information Management System) jobs..."
 *   learnMoreUrl="/docs/lims"
 * />
 */

import { useState } from 'react';
import { HelpCircle, ExternalLink, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ContextualHelpProps {
  /** Title of the help content */
  title: string;

  /** Main help content (supports markdown-style text) */
  content: string;

  /** Optional "Learn more" documentation link */
  learnMoreUrl?: string;

  /** Optional video tutorial link */
  videoUrl?: string;

  /** Position of the help icon */
  position?: 'inline' | 'floating';

  /** Size of the help icon */
  size?: 'sm' | 'md' | 'lg';

  /** Custom class name */
  className?: string;

  /** Whether to show on hover or click */
  trigger?: 'hover' | 'click';
}

export function ContextualHelp({
  title,
  content,
  learnMoreUrl,
  videoUrl,
  position = 'inline',
  size = 'md',
  className,
  trigger = 'click',
}: ContextualHelpProps) {
  const [open, setOpen] = useState(false);

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full transition-colors',
            'hover:bg-blue-50 dark:hover:bg-blue-950',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            position === 'inline' ? 'ml-1' : 'fixed bottom-4 right-4 z-50 p-3 bg-blue-500 text-white shadow-lg hover:bg-blue-600',
            className
          )}
          aria-label="Help"
          onMouseEnter={() => trigger === 'hover' && setOpen(true)}
          onMouseLeave={() => trigger === 'hover' && setOpen(false)}
        >
          <HelpCircle
            className={cn(
              iconSizes[size],
              position === 'inline' ? 'text-blue-500' : 'text-white'
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 shadow-xl"
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start space-x-2 flex-1">
            <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {title}
            </h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {content}
          </p>

          {/* Actions */}
          <div className="flex flex-col space-y-2 pt-2">
            {learnMoreUrl && (
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Learn more in documentation
              </a>
            )}

            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                <svg
                  className="h-4 w-4 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch video tutorial
              </a>
            )}
          </div>
        </div>

        {/* Footer tip */}
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
          💡 Tip: You can find more help in the{' '}
          <a href="/help" className="text-blue-600 dark:text-blue-400 hover:underline">
            Help Center
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * ContextualHelpText Component
 *
 * Simplified version for inline text with help tooltip.
 *
 * Usage:
 * <ContextualHelpText tooltip="This field is required for compliance">
 *   GOC Registration Number
 * </ContextualHelpText>
 */
export interface ContextualHelpTextProps {
  children: React.ReactNode;
  tooltip: string;
  className?: string;
}

export function ContextualHelpText({
  children,
  tooltip,
  className,
}: ContextualHelpTextProps) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      {children}
      <ContextualHelp
        title="Info"
        content={tooltip}
        size="sm"
        position="inline"
      />
    </span>
  );
}

/**
 * FloatingHelp Component
 *
 * Page-level floating help button (bottom-right corner).
 *
 * Usage:
 * <FloatingHelp
 *   title="Orders Page Help"
 *   content="Learn how to create and manage orders..."
 *   learnMoreUrl="/docs/orders"
 * />
 */
export function FloatingHelp(props: Omit<ContextualHelpProps, 'position'>) {
  return <ContextualHelp {...props} position="floating" size="lg" />;
}
