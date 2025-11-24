/**
 * Subscriber AI Widget Component
 *
 * React component that displays the AI Assistant for subscriber companies.
 * Each subscriber gets their own isolated AI instance with their data.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot, Send, RotateCcw, HelpCircle, Loader2 } from 'lucide-react';
import './AIAssistant.css';

interface AIAssistantProps {
  tenantId: string;
  userId: string;
  userName: string;
  subscriptionTier: 'basic' | 'professional' | 'enterprise';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fromCache?: boolean;
  tokensUsed?: number;
}

interface UsageStats {
  requestsCount: number;
  tokensUsed: number;
  cacheHits: number;
  remainingRequests: number;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  tenantId,
  userId,
  userName,
  subscriptionTier
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [queryType, setQueryType] = useState<'sales' | 'inventory' | 'patient_analytics' | 'ophthalmic_knowledge'>('ophthalmic_knowledge');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Feature availability based on subscription tier
  const availableFeatures = {
    basic: ['ophthalmic_knowledge'],
    professional: ['ophthalmic_knowledge', 'sales', 'inventory'],
    enterprise: ['ophthalmic_knowledge', 'sales', 'inventory', 'patient_analytics']
  };

  const features = availableFeatures[subscriptionTier];

  // Load usage stats on mount
  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/ai/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const stats = await response.json();
        setUsageStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch usage stats:', err);
    }
  };

  const handleSendQuery = async () => {
    if (!inputQuery.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: inputQuery,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputQuery,
          context: {
            queryType: queryType
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        } else if (response.status === 403) {
          throw new Error('This feature is not available in your subscription plan.');
        } else {
          throw new Error(errorData.error || 'Failed to get response from AI');
        }
      }

      const result = await response.json();
      const data = result.data;

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        fromCache: false,
        tokensUsed: data.metadata?.tokensUsed
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update usage stats
      fetchUsageStats();

    } catch (err: any) {
      setError(err.message);
      console.error('AI query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
  };

  const getQueryTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ophthalmic_knowledge: 'Ophthalmic Knowledge',
      sales: 'Sales Analytics',
      inventory: 'Inventory Check',
      patient_analytics: 'Patient Trends'
    };
    return labels[type] || type;
  };

  const getQueryTypeDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      ophthalmic_knowledge: 'Ask about lenses, frames, prescriptions, and optical dispensing',
      sales: 'Query your sales data, revenue trends, and top products',
      inventory: 'Check stock levels, reorder points, and supplier information',
      patient_analytics: 'Analyze patient demographics and purchasing patterns (anonymized data)'
    };
    return descriptions[type] || '';
  };

  return (
    <div className="ai-assistant-container">
      <Card className="ai-assistant-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant
              <Badge variant="secondary" className="ml-2">
                {subscriptionTier.toUpperCase()}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              title="Clear conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Usage Stats */}
          {usageStats && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Requests Today</p>
                <p className="text-2xl font-bold">
                  {usageStats.requestsCount} / {usageStats.remainingRequests + usageStats.requestsCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cache Hits</p>
                <p className="text-2xl font-bold text-green-600">
                  {usageStats.cacheHits} ({usageStats.requestsCount > 0 ? Math.round((usageStats.cacheHits / usageStats.requestsCount) * 100) : 0}%)
                </p>
              </div>
            </div>
          )}

          {/* Query Type Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Query Type:</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getQueryTypeDescription(queryType)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Select value={queryType} onValueChange={(value: any) => setQueryType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select query type" />
              </SelectTrigger>
              <SelectContent>
                {features.includes('ophthalmic_knowledge') && (
                  <SelectItem value="ophthalmic_knowledge">
                    {getQueryTypeLabel('ophthalmic_knowledge')}
                  </SelectItem>
                )}
                {features.includes('sales') && (
                  <SelectItem value="sales">
                    {getQueryTypeLabel('sales')}
                  </SelectItem>
                )}
                {features.includes('inventory') && (
                  <SelectItem value="inventory">
                    {getQueryTypeLabel('inventory')}
                  </SelectItem>
                )}
                {features.includes('patient_analytics') && (
                  <SelectItem value="patient_analytics">
                    {getQueryTypeLabel('patient_analytics')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              {getQueryTypeDescription(queryType)}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Messages Display */}
          <div className="messages-container min-h-[400px] max-h-[600px] overflow-y-auto border rounded-lg p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Bot className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">Ask me anything about optical dispensing, your business data, or patient trends!</p>
                <div className="text-left space-y-2">
                  <p className="font-semibold">Example questions:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>&ldquo;What are progressive lenses?&rdquo;</li>
                    <li>&ldquo;What were our top 3 selling products last month?&rdquo;</li>
                    <li>&ldquo;Which items are low in stock?&rdquo;</li>
                    <li>&ldquo;What percentage of patients purchased progressive lenses?&rdquo;</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <strong>{msg.role === 'user' ? userName : 'AI Assistant'}</strong>
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className={`rounded-lg p-3 max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2">
                      {msg.fromCache && (
                        <Badge variant="secondary" className="text-xs">Cached</Badge>
                      )}
                      {msg.tokensUsed && (
                        <span className="text-xs text-muted-foreground">
                          {msg.tokensUsed} tokens
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            <Textarea
              value={inputQuery}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Ask about ${getQueryTypeLabel(queryType).toLowerCase()}...`}
              disabled={loading}
              rows={3}
            />
            <Button
              onClick={handleSendQuery}
              disabled={!inputQuery.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>

          {/* Subscription Info */}
          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>
              <strong>Your Plan:</strong> {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
            </p>
            {subscriptionTier !== 'enterprise' && (
              <p className="mt-2">
                <a href="/subscription/upgrade" className="text-primary hover:underline">
                  Upgrade
                </a> to unlock more features
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;
