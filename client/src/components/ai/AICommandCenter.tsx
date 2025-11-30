/**
 * AI Command Center - Task-Oriented AI Interface
 *
 * Design Philosophy:
 * - AI as an invisible, integrated layer - not a separate chat module
 * - Task-oriented UI with quick actions, not just chat
 * - Predictive assistance - anticipate user needs
 * - Visual confirmation with confidence indicators
 * - Multi-modal input - not just text
 *
 * Inspired by Linear, Notion, and modern AI UX patterns
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Command,
  Search,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Brain,
  Target,
  BarChart3,
  MessageSquare,
  X,
  ChevronRight,
  Loader2,
  Send,
  Mic,
  Image,
  Paperclip,
} from "lucide-react";

// Types
interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  category: "analytics" | "patients" | "orders" | "clinical" | "admin";
  command: string;
  confidence?: number;
}

interface AISuggestion {
  id: string;
  type: "insight" | "action" | "alert" | "prediction";
  title: string;
  description: string;
  confidence: number;
  priority: "high" | "medium" | "low";
  actionLabel?: string;
  actionCommand?: string;
}

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  actions?: { label: string; command: string }[];
}

// Quick Actions - Task-oriented, not just chat
const quickActions: QuickAction[] = [
  {
    id: "analyze-revenue",
    icon: TrendingUp,
    label: "Analyze Revenue",
    description: "Get revenue insights and forecasts",
    category: "analytics",
    command: "analyze revenue trends for this month",
    confidence: 95,
  },
  {
    id: "patient-recalls",
    icon: Users,
    label: "Patient Recalls",
    description: "View patients due for recall",
    category: "patients",
    command: "show patients due for recall this week",
    confidence: 92,
  },
  {
    id: "order-status",
    icon: Package,
    label: "Order Status",
    description: "Check pending orders and delays",
    category: "orders",
    command: "summarize order status and delays",
    confidence: 88,
  },
  {
    id: "schedule-optimize",
    icon: Calendar,
    label: "Optimize Schedule",
    description: "AI-powered schedule optimization",
    category: "clinical",
    command: "suggest schedule optimizations for next week",
    confidence: 85,
  },
  {
    id: "inventory-alerts",
    icon: AlertCircle,
    label: "Inventory Alerts",
    description: "Low stock and reorder suggestions",
    category: "orders",
    command: "show inventory alerts and reorder suggestions",
    confidence: 90,
  },
  {
    id: "clinical-summary",
    icon: FileText,
    label: "Daily Summary",
    description: "Generate clinical day summary",
    category: "clinical",
    command: "generate clinical summary for today",
    confidence: 87,
  },
];

// AI-powered suggestions
const mockSuggestions: AISuggestion[] = [
  {
    id: "1",
    type: "insight",
    title: "Revenue trending up 12%",
    description: "Compared to last month, driven by spectacle sales",
    confidence: 94,
    priority: "high",
    actionLabel: "View Details",
    actionCommand: "show revenue breakdown",
  },
  {
    id: "2",
    type: "alert",
    title: "5 patients due for recall",
    description: "Annual eye exams overdue by 30+ days",
    confidence: 98,
    priority: "high",
    actionLabel: "Send Reminders",
    actionCommand: "send recall reminders",
  },
  {
    id: "3",
    type: "prediction",
    title: "Busy period predicted",
    description: "Next week expected to be 25% busier than average",
    confidence: 78,
    priority: "medium",
    actionLabel: "Prepare",
    actionCommand: "show staffing recommendations",
  },
];

interface AICommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "panel" | "modal" | "inline";
}

export function AICommandCenter({
  isOpen,
  onClose,
  mode = "panel",
}: AICommandCenterProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"command" | "chat" | "insights">("command");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!isOpen) {
          // This would be handled by parent
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // AI Query mutation
  const aiMutation = useMutation({
    mutationFn: async (userQuery: string) => {
      const response = await fetch("/api/master-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response || data.answer || "I processed your request.",
        timestamp: new Date(),
        confidence: data.confidence || 85,
        sources: data.sources,
        actions: data.suggestedActions,
      };
      setMessages((prev) => [...prev, aiMessage]);
    },
    onError: (error: Error) => {
      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `I encountered an issue: ${error.message}. Please try again.`,
        timestamp: new Date(),
        confidence: 0,
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!query.trim() || aiMutation.isPending) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    aiMutation.mutate(query);
    setQuery("");
    setActiveTab("chat");
  }, [query, aiMutation]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    setQuery(action.command);
    handleSubmit();
  }, [handleSubmit]);

  const handleSuggestionAction = useCallback((suggestion: AISuggestion) => {
    if (suggestion.actionCommand) {
      setQuery(suggestion.actionCommand);
      handleSubmit();
    }
  }, [handleSubmit]);

  // Filter quick actions based on query
  const filteredActions = query
    ? quickActions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.description.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center pt-[10vh]",
        "bg-background/80 backdrop-blur-sm",
        "animate-fade-in"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-2xl mx-4",
          "bg-card border border-border rounded-xl shadow-2xl",
          "overflow-hidden",
          "animate-scale-in",
          isExpanded ? "h-[70vh]" : "max-h-[60vh]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Command Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Ask AI anything or type a command..."
              className={cn(
                "pl-10 pr-24 py-6 text-base",
                "bg-transparent border-0",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/60"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Image className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!query.trim() || aiMutation.isPending}
                size="sm"
                className="h-8 px-3"
              >
                {aiMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-3">
            <button
              onClick={() => setActiveTab("command")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === "command"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Command className="w-3 h-3 inline mr-1.5" />
              Commands
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === "chat"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <MessageSquare className="w-3 h-3 inline mr-1.5" />
              Chat
              {messages.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                  {messages.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === "insights"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Lightbulb className="w-3 h-3 inline mr-1.5" />
              Insights
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[45vh]">
          {activeTab === "command" && (
            <div className="p-4 space-y-4">
              {/* AI Suggestions */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  AI Suggestions
                </h3>
                <div className="space-y-2">
                  {mockSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionAction(suggestion)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg text-left",
                        "bg-muted/50 hover:bg-muted transition-colors",
                        "border border-transparent hover:border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          suggestion.type === "insight" && "bg-primary/10 text-primary",
                          suggestion.type === "alert" && "bg-warning-muted text-warning",
                          suggestion.type === "prediction" && "bg-info-muted text-info"
                        )}
                      >
                        {suggestion.type === "insight" && <TrendingUp className="w-4 h-4" />}
                        {suggestion.type === "alert" && <AlertCircle className="w-4 h-4" />}
                        {suggestion.type === "prediction" && <Target className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{suggestion.title}</span>
                          <span className="ai-confidence ai-confidence-high text-xs">
                            {suggestion.confidence}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {suggestion.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {filteredActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg text-left",
                        "bg-muted/30 hover:bg-muted transition-colors",
                        "border border-transparent hover:border-border"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <action.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block">{action.label}</span>
                        <span className="text-xs text-muted-foreground block truncate">
                          {action.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Start a conversation with AI
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Ask questions, get insights, or execute commands
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl p-3",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>

                        {/* Confidence indicator for AI messages */}
                        {message.role === "assistant" && message.confidence !== undefined && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                            <span
                              className={cn(
                                "text-xs font-medium",
                                message.confidence >= 80
                                  ? "text-success"
                                  : message.confidence >= 50
                                  ? "text-warning"
                                  : "text-muted-foreground"
                              )}
                            >
                              {message.confidence}% confidence
                            </span>
                            {message.sources && (
                              <span className="text-xs text-muted-foreground">
                                • {message.sources.length} sources
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {message.actions.map((action, i) => (
                              <Button
                                key={i}
                                variant="secondary"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setQuery(action.command);
                                  handleSubmit();
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {aiMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-xl p-3">
                        <div className="ai-typing">
                          <span className="ai-typing-dot" />
                          <span className="ai-typing-dot" />
                          <span className="ai-typing-dot" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "insights" && (
            <div className="p-4 space-y-4">
              {/* Real-time metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Patients Today</span>
                  </div>
                  <span className="text-xl font-bold">24</span>
                  <span className="text-xs text-success ml-1">+12%</span>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-muted-foreground">Revenue</span>
                  </div>
                  <span className="text-xl font-bold">£4.2k</span>
                  <span className="text-xs text-success ml-1">+8%</span>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-xs text-muted-foreground">Avg Wait</span>
                  </div>
                  <span className="text-xl font-bold">12m</span>
                  <span className="text-xs text-destructive ml-1">+2m</span>
                </div>
              </div>

              {/* AI-powered insights */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  AI Insights
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-success-muted/30 border border-success/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Strong Performance</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your practice is performing 15% above regional average this week.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-warning-muted/30 border border-warning/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Inventory Alert</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        3 frame styles are running low. Reorder suggested within 5 days.
                      </p>
                      <Button variant="ghost" size="sm" className="h-6 mt-1 text-xs">
                        View Items
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-info-muted/30 border border-info/20 rounded-lg">
                    <Zap className="w-5 h-5 text-info shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Optimization Opportunity</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rescheduling 2 appointments could reduce patient wait times by 20%.
                      </p>
                      <Button variant="ghost" size="sm" className="h-6 mt-1 text-xs">
                        Optimize
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs">
              ⌘K
            </kbd>
            <span>to open</span>
            <span className="mx-1">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs">
              Esc
            </kbd>
            <span>to close</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
            <X className="w-3 h-3 mr-1" />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// Floating AI Button with context-aware suggestions
export function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "fixed bottom-6 right-6 z-40",
          "w-12 h-12 rounded-full",
          "bg-gradient-to-br from-primary to-purple-600",
          "text-white shadow-lg",
          "hover:shadow-xl hover:scale-105",
          "transition-all duration-200",
          "flex items-center justify-center",
          "animate-ai-glow"
        )}
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={cn(
            "fixed bottom-20 right-6 z-40",
            "px-3 py-2 rounded-lg",
            "bg-popover border border-border shadow-lg",
            "animate-fade-in-up"
          )}
        >
          <div className="flex items-center gap-2 text-sm">
            <span>AI Command Center</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      <AICommandCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default AICommandCenter;
