/**
 * NPSSurvey Component
 *
 * Net Promoter Score (NPS) survey to measure user satisfaction.
 * Triggered contextually after key user actions or milestones.
 *
 * Usage:
 * <NPSSurvey
 *   open={showNPS}
 *   onClose={() => setShowNPS(false)}
 *   trigger="10-orders-completed"
 * />
 */

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Meh, X } from 'lucide-react';
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
import { useFeedback } from '@/hooks/useFeedback';
import { cn } from '@/lib/utils';

export interface NPSSurveyProps {
  open: boolean;
  onClose: () => void;
  trigger?: string;
  context?: string;
}

export function NPSSurvey({ open, onClose, trigger, context }: NPSSurveyProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState<'score' | 'feedback' | 'thanks'>('score');
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useFeedback();

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore);
    setStep('feedback');
  };

  const handleSubmit = async () => {
    if (score === null) {
      showError('Please select a score');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          score,
          feedback: feedback.trim(),
          trigger: trigger || 'manual',
          context: context || window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to submit NPS');

      setStep('thanks');

      // Close after showing thanks message
      setTimeout(() => {
        onClose();
        // Reset state
        setTimeout(() => {
          setScore(null);
          setFeedback('');
          setStep('score');
        }, 300);
      }, 2000);
    } catch (err) {
      console.error('NPS submission error:', err);
      showError('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getNPSCategory = (score: number) => {
    if (score >= 9) return { label: 'Promoter', color: 'text-green-600', icon: ThumbsUp };
    if (score >= 7) return { label: 'Passive', color: 'text-yellow-600', icon: Meh };
    return { label: 'Detractor', color: 'text-red-600', icon: ThumbsDown };
  };

  const category = score !== null ? getNPSCategory(score) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'score' && (
          <>
            <DialogHeader>
              <DialogTitle>How likely are you to recommend ILS 2.0?</DialogTitle>
              <DialogDescription>
                Your feedback helps us improve the platform for everyone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Score Selection */}
              <div className="space-y-4">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Not at all likely</span>
                  <span>Extremely likely</span>
                </div>

                <div className="grid grid-cols-11 gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleScoreSelect(num)}
                      className={cn(
                        'aspect-square rounded-lg border-2 font-semibold text-sm transition-all hover:scale-110',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        num <= 6
                          ? 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 focus:ring-red-500'
                          : num <= 8
                          ? 'border-yellow-300 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950 focus:ring-yellow-500'
                          : 'border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 focus:ring-green-500',
                        score === num
                          ? num <= 6
                            ? 'bg-red-100 border-red-500 dark:bg-red-900'
                            : num <= 8
                            ? 'bg-yellow-100 border-yellow-500 dark:bg-yellow-900'
                            : 'bg-green-100 border-green-500 dark:bg-green-900'
                          : ''
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {step === 'feedback' && score !== null && category && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <category.icon className={cn('h-5 w-5', category.color)} />
                <span>Thanks for your rating!</span>
              </DialogTitle>
              <DialogDescription>
                You rated us {score}/10 ({category.label})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nps-feedback">
                  {score >= 9
                    ? "What do you love most about ILS 2.0?"
                    : score >= 7
                    ? "What could we do to improve?"
                    : "What's the main reason for your score?"}
                </Label>
                <Textarea
                  id="nps-feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts... (optional)"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={onClose}>
                  Skip
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'thanks' && (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <ThumbsUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Thank you for your feedback!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your input helps us make ILS 2.0 better for everyone.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * useNPSTrigger Hook
 *
 * Automatically triggers NPS survey based on user actions and milestones.
 *
 * Usage:
 * const { triggerNPS } = useNPSTrigger()
 *
 * // In your success handlers:
 * triggerNPS('order-completed', { orderCount: 10 })
 */
export function useNPSTrigger() {
  const [showNPS, setShowNPS] = useState(false);
  const [trigger, setTrigger] = useState<string>('');

  const triggerNPS = (triggerType: string, metadata?: Record<string, any>) => {
    // Check if user has already seen NPS recently
    const lastNPS = localStorage.getItem('lastNPSSurvey');
    if (lastNPS) {
      const daysSince = (Date.now() - parseInt(lastNPS)) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        // Don't show again within 30 days
        return;
      }
    }

    // Check if this specific trigger has been shown
    const triggerKey = `nps-${triggerType}`;
    if (localStorage.getItem(triggerKey)) {
      return; // Already shown for this trigger
    }

    setTrigger(triggerType);
    setShowNPS(true);

    // Mark trigger as shown
    localStorage.setItem(triggerKey, 'true');
    localStorage.setItem('lastNPSSurvey', Date.now().toString());
  };

  const closeNPS = () => {
    setShowNPS(false);
  };

  return {
    showNPS,
    triggerNPS,
    closeNPS,
    NPSSurveyComponent: () => (
      <NPSSurvey open={showNPS} onClose={closeNPS} trigger={trigger} />
    ),
  };
}
