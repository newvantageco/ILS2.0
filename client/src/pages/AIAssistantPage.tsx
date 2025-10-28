import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Send, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Star,
  ThumbsUp,
  ThumbsDown,
  Bot,
  User,
  Loader2,
  Brain,
  CheckCircle2
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  usedExternalAi: boolean;
  confidence: string | null;
  metadata: any;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AIResponse {
  answer: string;
  confidence: number;
  usedExternalAi: boolean;
  sources: Array<{
    type: 'learned' | 'document' | 'external';
    reference?: string;
    relevance: number;
  }>;
  suggestions?: string[];
  learningOpportunity?: boolean;
}

export default function AIAssistantPage() {
  const [question, setQuestion] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/ai-assistant/conversations"],
  });

  // Fetch current conversation messages
  const { data: conversationData } = useQuery<{ data: { messages: Message[] } }>({
    queryKey: ["/api/ai-assistant/conversations", currentConversationId],
    enabled: !!currentConversationId,
  });

  // Fetch learning progress
  const { data: progressData } = useQuery<{ 
    data: {
      progress: number;
      status: string;
      useExternalAi: boolean;
      stats: {
        learnedQA: number;
        documents: number;
        conversations: number;
        avgConfidence: number;
      };
    };
  }>({
    queryKey: ["/api/ai-assistant/learning-progress"],
  });

  // Fetch knowledge base
  const { data: knowledgeBase } = useQuery<{ 
    data: Array<{
      id: string;
      filename: string;
      category: string;
      createdAt: string;
    }>;
  }>({
    queryKey: ["/api/ai-assistant/knowledge"],
  });

  // Fetch stats
  const { data: stats } = useQuery<{
    data: {
      totalConversations: number;
      localAnswers: number;
      autonomyRate: number;
      avgUserRating: number;
    };
  }>({
    queryKey: ["/api/ai-assistant/stats"],
  });

  // Ask question mutation
  const askMutation = useMutation({
    mutationFn: async (data: { question: string; conversationId?: string }) => {
      const response = await fetch("/api/ai-assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/conversations"] });
      if (currentConversationId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/ai-assistant/conversations", currentConversationId] 
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/stats"] });
      setQuestion("");
    },
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/ai-assistant/knowledge/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/learning-progress"] });
      setFile(null);
    },
  });

  // Submit feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (data: { 
      messageId: string; 
      conversationId: string;
      rating: number;
      helpful?: boolean;
      accurate?: boolean;
    }) => {
      const response = await fetch(`/api/ai-assistant/conversations/${data.conversationId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      setShowFeedback(null);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/stats"] });
    },
  });

  const handleAsk = () => {
    if (!question.trim()) return;
    askMutation.mutate({
      question,
      conversationId: currentConversationId || undefined,
    });
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    if (!currentConversationId) return;
    feedbackMutation.mutate({
      messageId,
      conversationId: currentConversationId,
      rating: feedbackRating,
      helpful,
      accurate: helpful,
    });
  };

  const messages = conversationData?.data?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mostly_autonomous': return 'bg-green-500';
      case 'learning': return 'bg-blue-500';
      case 'early_learning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Your intelligent business assistant that learns over time
          </p>
        </div>
      </div>

      {/* Learning Progress Card */}
      {progressData?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-bold">{progressData.data.progress}%</div>
                  <Badge className={getStatusColor(progressData.data.status)}>
                    {progressData.data.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="text-right text-sm">
                  <div>External AI: {progressData.data.useExternalAi ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressData.data.progress}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold">{progressData.data.stats.learnedQA}</div>
                  <div className="text-xs text-muted-foreground">Learned Q&A</div>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold">{progressData.data.stats.documents}</div>
                  <div className="text-xs text-muted-foreground">Documents</div>
                </div>
                <div className="p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold">{progressData.data.stats.conversations}</div>
                  <div className="text-xs text-muted-foreground">Conversations</div>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <div className="text-2xl font-bold">
                    {(progressData.data.stats.avgConfidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Confidence</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            <Button 
              onClick={() => setCurrentConversationId(null)}
              variant="outline" 
              className="w-full justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
            {conversations?.map((conv) => (
              <Button
                key={conv.id}
                onClick={() => setCurrentConversationId(conv.id)}
                variant={currentConversationId === conv.id ? "default" : "ghost"}
                className="w-full justify-start text-left"
              >
                <div className="truncate">
                  {conv.title}
                  <div className="text-xs text-muted-foreground">
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation by asking a question below</p>
                </div>
              ) : (
                messages.map((msg: Message) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-300'} rounded-full p-2`}>
                        {msg.role === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className={`p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white border'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          
                          {msg.role === 'assistant' && msg.metadata?.sources && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex flex-wrap gap-2">
                                {msg.metadata.sources.map((source: any, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {source.type}: {(source.relevance * 100).toFixed(0)}%
                                  </Badge>
                                ))}
                              </div>
                              {msg.confidence && (
                                <div className="text-xs mt-1">
                                  Confidence: {(parseFloat(msg.confidence) * 100).toFixed(0)}%
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {msg.role === 'assistant' && (
                          <div className="flex gap-2 mt-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleFeedback(msg.id, true)}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleFeedback(msg.id, false)}
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask me anything about your business..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                rows={3}
                className="flex-1"
              />
              <Button 
                onClick={handleAsk} 
                disabled={!question.trim() || askMutation.isPending}
              >
                {askMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {askMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {askMutation.error?.message || "Failed to send message"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Base & Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Knowledge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.csv,.json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Supported: PDF, DOCX, DOC, TXT, CSV, JSON (Max 10MB)
              </p>
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
            {uploadMutation.isSuccess && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Document uploaded and processed successfully!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {knowledgeBase?.data?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No documents uploaded yet
                </p>
              ) : (
                knowledgeBase?.data?.map((doc: any) => (
                  <div key={doc.id} className="p-3 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">{doc.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge>{doc.category || 'General'}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      {stats?.data && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold">{stats.data.totalConversations}</div>
                <div className="text-sm text-muted-foreground">Total Conversations</div>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold">{stats.data.localAnswers}</div>
                <div className="text-sm text-muted-foreground">Local Answers</div>
              </div>
              <div className="p-4 bg-purple-50 rounded">
                <div className="text-2xl font-bold">{stats.data.autonomyRate.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Autonomy Rate</div>
              </div>
              <div className="p-4 bg-orange-50 rounded">
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  {stats.data.avgUserRating.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
