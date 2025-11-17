/**
 * FeedbackModal Component
 *
 * Collects user feedback, feature requests, and bug reports.
 * Can be triggered contextually or via a feedback button.
 *
 * Usage:
 * const { openFeedback } = useFeedbackModal()
 * openFeedback({ type: 'feature', context: 'orders-page' })
 */

import { useState } from 'react';
import { MessageSquare, Bug, Lightbulb, X, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFeedback } from '@/hooks/useFeedback';
import { cn } from '@/lib/utils';

export type FeedbackType = 'general' | 'feature' | 'bug' | 'improvement';

export interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: FeedbackType;
  context?: string;
}

const feedbackTypes = [
  {
    value: 'general' as const,
    label: 'General Feedback',
    icon: MessageSquare,
    color: 'text-blue-500',
    description: 'Share your thoughts about the platform',
  },
  {
    value: 'feature' as const,
    label: 'Feature Request',
    icon: Lightbulb,
    color: 'text-yellow-500',
    description: 'Suggest a new feature or improvement',
  },
  {
    value: 'bug' as const,
    label: 'Report a Bug',
    icon: Bug,
    color: 'text-red-500',
    description: 'Let us know about any issues you encountered',
  },
  {
    value: 'improvement' as const,
    label: 'Suggest Improvement',
    icon: MessageSquare,
    color: 'text-green-500',
    description: 'Help us make existing features better',
  },
];

export function FeedbackModal({
  open,
  onClose,
  defaultType = 'general',
  context,
}: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>(defaultType);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showError({ title: 'Please enter your feedback' });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type,
          message: message.trim(),
          email: email.trim() || undefined,
          context: context || window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      showSuccess({ title: 'Thank you for your feedback! We appreciate your input.' });
      setMessage('');
      setEmail('');
      onClose();
    } catch (err) {
      console.error('Feedback submission error:', err);
      showError({ title: 'Failed to submit feedback. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = feedbackTypes.find((t) => t.value === type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <span>Share Your Feedback</span>
          </DialogTitle>
          <DialogDescription>
            Help us improve ILS 2.0 by sharing your thoughts, suggestions, or reporting issues.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type Selection */}
          <div className="space-y-3">
            <Label>What would you like to share?</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as FeedbackType)}>
              {feedbackTypes.map((feedbackType) => (
                <div
                  key={feedbackType.value}
                  className={cn(
                    'flex items-start space-x-3 rounded-lg border-2 p-3 transition-colors cursor-pointer',
                    type === feedbackType.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                  onClick={() => setType(feedbackType.value)}
                >
                  <RadioGroupItem value={feedbackType.value} id={feedbackType.value} />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={feedbackType.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <feedbackType.icon className={cn('h-4 w-4', feedbackType.color)} />
                      <span className="font-medium text-sm">{feedbackType.label}</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {feedbackType.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="feedback-message">
              Your {selectedType?.label.toLowerCase()}
            </Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === 'bug'
                  ? 'Describe what happened, what you expected, and how to reproduce the issue...'
                  : type === 'feature'
                  ? 'Describe the feature you\'d like to see and how it would help you...'
                  : 'Share your thoughts...'
              }
              rows={6}
              className="resize-none"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {message.length}/1000 characters
            </p>
          </div>

          {/* Optional Email */}
          <div className="space-y-2">
            <Label htmlFor="feedback-email">
              Email (optional)
            </Label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              We'll reach out if we need more details
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Context: {context || 'Current page'}
            </p>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !message.trim()}>
                {submitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Floating Feedback Button
 *
 * Always-visible feedback button (usually bottom-left corner).
 *
 * Usage:
 * <FloatingFeedbackButton />
 */
export function FloatingFeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-50 flex items-center space-x-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all hover:scale-105"
        aria-label="Send Feedback"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="font-medium text-sm hidden sm:inline">Feedback</span>
      </button>

      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
