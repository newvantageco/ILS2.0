/**
 * User Feedback Widget
 * Floating button for collecting user feedback, bug reports, and feature requests
 */

import { useState } from "react";
import { MessageSquare, Bug, Lightbulb, Star, X, Send, Camera } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type FeedbackType = "general" | "bug" | "feature" | "nps";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim() && feedbackType !== "nps") {
      toast({
        title: "Message required",
        description: "Please provide feedback details",
        variant: "destructive",
      });
      return;
    }

    if (feedbackType === "nps" && rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Submit feedback to your backend
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: feedbackType,
          message,
          email,
          rating: feedbackType === "nps" ? rating : undefined,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");

      toast({
        title: "Thank you! 🎉",
        description: "Your feedback helps us improve the platform.",
      });

      // Reset form
      setMessage("");
      setEmail("");
      setRating(0);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 h-14 w-14 p-0"
        aria-label="Send feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Feedback Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve by sharing your thoughts, reporting bugs, or
              suggesting new features.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={feedbackType}
            onValueChange={(value) => setFeedbackType(value as FeedbackType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                General
              </TabsTrigger>
              <TabsTrigger value="bug" className="text-xs">
                <Bug className="h-3 w-3 mr-1" />
                Bug
              </TabsTrigger>
              <TabsTrigger value="feature" className="text-xs">
                <Lightbulb className="h-3 w-3 mr-1" />
                Feature
              </TabsTrigger>
              <TabsTrigger value="nps" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Rate Us
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <FeedbackForm
                message={message}
                setMessage={setMessage}
                email={email}
                setEmail={setEmail}
                placeholder="Share your thoughts, suggestions, or general feedback..."
              />
            </TabsContent>

            <TabsContent value="bug" className="space-y-4">
              <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-900 dark:text-red-100">
                  <strong>Bug Report:</strong> Please describe what went wrong,
                  what you expected to happen, and steps to reproduce.
                </p>
              </div>
              <FeedbackForm
                message={message}
                setMessage={setMessage}
                email={email}
                setEmail={setEmail}
                placeholder="Describe the bug: What happened? What should have happened? Steps to reproduce..."
              />
            </TabsContent>

            <TabsContent value="feature" className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Feature Request:</strong> Tell us about the feature
                  you'd like to see and how it would help you.
                </p>
              </div>
              <FeedbackForm
                message={message}
                setMessage={setMessage}
                email={email}
                setEmail={setEmail}
                placeholder="Describe the feature you'd like and how it would help your workflow..."
              />
            </TabsContent>

            <TabsContent value="nps" className="space-y-4">
              <div className="space-y-3">
                <Label>
                  How likely are you to recommend ILS to a colleague?
                </Label>
                <div className="flex items-center justify-between gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <Button
                      key={num}
                      variant={rating === num ? "default" : "outline"}
                      size="sm"
                      className="w-10 h-10"
                      onClick={() => setRating(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nps-reason">
                  What's the main reason for your score? (Optional)
                </Label>
                <Textarea
                  id="nps-reason"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more about your rating..."
                  rows={4}
                />
              </div>

              {rating > 0 && (
                <Badge
                  variant={rating >= 9 ? "default" : rating >= 7 ? "secondary" : "destructive"}
                  className="w-full justify-center py-2"
                >
                  {rating >= 9
                    ? "🎉 Promoter - Thank you!"
                    : rating >= 7
                    ? "😊 Passive - We'll keep improving!"
                    : "😔 Detractor - We'll do better!"}
                </Badge>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FeedbackForm({
  message,
  setMessage,
  email,
  setEmail,
  placeholder,
}: {
  message: string;
  setMessage: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  placeholder: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="message">Your Feedback *</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          rows={6}
          required
        />
        <p className="text-xs text-muted-foreground">
          Current page: <code className="text-xs">{window.location.pathname}</code>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email (Optional)
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
        <p className="text-xs text-muted-foreground">
          We'll only use this to follow up on your feedback
        </p>
      </div>
    </>
  );
}
