import { useState, useRef, useEffect } from "react";
import { Bot, X, Minus, Maximize2, Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch AI usage stats
  const { data: aiUsage } = useQuery<{
    queriesUsed: number;
    queriesLimit: number;
    cacheHits: number;
    subscriptionTier: string;
  }>({
    queryKey: ["/api/ai/usage/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const usagePercentage = aiUsage?.queriesLimit
    ? Math.round((aiUsage.queriesUsed / aiUsage.queriesLimit) * 100)
    : 0;

  const isNearLimit = usagePercentage > 80;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Ask AI mutation
  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await fetch("/api/master-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: question,
          conversationId,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to get AI response");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-assistant",
          role: "assistant",
          content: data.response || data.answer || "I apologize, I couldn't process that request.",
          timestamp: new Date(),
        },
      ]);

      // Update conversation ID
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
    },
    onError: (error: Error) => {
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-error",
          role: "assistant",
          content: `I encountered an error: ${error.message}. Please try again or contact support if the issue persists.`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || askMutation.isPending) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    askMutation.mutate(input);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 hover:scale-110"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 w-96 bg-background border rounded-lg shadow-2xl z-50 flex flex-col transition-all duration-200",
        isMinimized ? "h-14" : "h-[600px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <span className="font-semibold">AI Assistant</span>
            {aiUsage?.subscriptionTier && (
              <Badge variant="secondary" className="ml-2 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {aiUsage.subscriptionTier}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Usage Indicator */}
          {aiUsage && (
            <div className="px-4 pt-3 pb-2 border-b bg-muted/30">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {aiUsage.queriesUsed} / {aiUsage.queriesLimit} queries
                </span>
                <span className={cn(
                  "font-medium",
                  isNearLimit ? "text-orange-600" : "text-muted-foreground"
                )}>
                  {usagePercentage}% used
                </span>
              </div>
              <Progress value={usagePercentage} className="h-1" />
              {isNearLimit && (
                <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Approaching query limit</span>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Hello! I&apos;m your AI assistant. Ask me anything about your
                  business, inventory, patients, or how to use the system.
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
                        "max-w-[80%] rounded-lg p-3 text-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {askMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={askMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || askMutation.isPending}
                size="icon"
              >
                {askMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
