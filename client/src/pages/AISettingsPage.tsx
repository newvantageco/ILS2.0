/**
 * AI Settings Page
 * 
 * Configure AI provider settings and API keys
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Bot, Key, Settings, Check, AlertCircle, Info } from "lucide-react";

interface AISettings {
  provider: 'openai' | 'anthropic';
  model: string;
  openaiAvailable: boolean;
  anthropicAvailable: boolean;
  learningProgress: number;
}

export default function AISettingsPage() {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [model, setModel] = useState<string>('gpt-4-turbo-preview');

  // Fetch current AI settings
  const { data: settings, isLoading } = useQuery<AISettings>({
    queryKey: ['/api/ai-assistant/settings'],
  });

  // Update AI settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { provider: string; model: string }) => {
      const response = await fetch('/api/ai-assistant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-assistant/settings'] });
      toast({
        title: "Settings Updated",
        description: "AI provider settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({ provider, model });
  };

  const openaiModels = [
    { value: 'gpt-4', label: 'GPT-4 (Most Capable)', cost: '$$$$' },
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo (Faster, Cheaper)', cost: '$$$' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fast, Economical)', cost: '$' },
  ];

  const anthropicModels = [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most Capable)', cost: '$$$$' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Balanced)', cost: '$$' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast, Economical)', cost: '$' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          AI Assistant Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure your external AI providers and model preferences
        </p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Provider Status
          </CardTitle>
          <CardDescription>
            Current availability of AI providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-semibold">OpenAI</div>
                <div className="text-sm text-muted-foreground">GPT-4, GPT-3.5</div>
              </div>
              {settings?.openaiAvailable ? (
                <Badge variant="default" className="bg-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-semibold">Anthropic</div>
                <div className="text-sm text-muted-foreground">Claude 3</div>
              </div>
              {settings?.anthropicAvailable ? (
                <Badge variant="default" className="bg-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
          </div>

          {/* Learning Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Learning Progress</span>
              <span className="text-muted-foreground">{settings?.learningProgress || 0}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${settings?.learningProgress || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              As the AI learns from your conversations, it will rely less on external providers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
          <CardDescription>
            Select your preferred AI provider and model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select value={provider} onValueChange={(val) => setProvider(val as 'openai' | 'anthropic')}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai" disabled={!settings?.openaiAvailable}>
                  OpenAI (ChatGPT) {!settings?.openaiAvailable && '- Not Configured'}
                </SelectItem>
                <SelectItem value="anthropic" disabled={!settings?.anthropicAvailable}>
                  Anthropic (Claude) {!settings?.anthropicAvailable && '- Not Configured'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {provider === 'openai' ? (
                  openaiModels.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label} <span className="text-muted-foreground ml-2">{m.cost}</span>
                    </SelectItem>
                  ))
                ) : (
                  anthropicModels.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label} <span className="text-muted-foreground ml-2">{m.cost}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="w-full"
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Configure your API keys in the server environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">To enable external AI providers:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Get your OpenAI API key from: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a></li>
                  <li>Get your Anthropic API key from: <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a></li>
                  <li>Add the keys to your <code className="bg-muted px-1 py-0.5 rounded">.env</code> file:
                    <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto">
{`OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...`}
                    </pre>
                  </li>
                  <li>Restart the server for changes to take effect</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          {!settings?.openaiAvailable && !settings?.anthropicAvailable && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No AI providers are currently configured. Please add at least one API key to enable AI features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Model Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Model Comparison</CardTitle>
          <CardDescription>
            Choose the right model for your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">OpenAI Models</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>GPT-4:</strong> Most capable, best for complex reasoning and analysis</li>
                <li>• <strong>GPT-4 Turbo:</strong> Faster and more cost-effective than GPT-4</li>
                <li>• <strong>GPT-3.5 Turbo:</strong> Fast responses, ideal for simple queries</li>
              </ul>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Anthropic Models</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Claude 3 Opus:</strong> Most intelligent, handles complex tasks</li>
                <li>• <strong>Claude 3 Sonnet:</strong> Balanced performance and speed</li>
                <li>• <strong>Claude 3 Haiku:</strong> Fastest responses, most economical</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
