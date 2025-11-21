import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Key,
  Eye,
  EyeOff,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  Shield,
  Zap,
  Mail,
  CreditCard,
  ShoppingCart,
  Brain,
  Database,
  CloudIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface APIKeyConfig {
  category: string;
  keys: {
    name: string;
    key: string;
    envVar: string;
    description: string;
    icon: any;
    required: boolean;
    sensitive: boolean;
    testEndpoint?: string;
  }[];
}

const API_KEY_CATEGORIES: APIKeyConfig[] = [
  {
    category: "AI Services",
    keys: [
      {
        name: "OpenAI API Key",
        key: "openai",
        envVar: "OPENAI_API_KEY",
        description: "GPT-4, GPT-3.5 for AI assistant and clinical decision support",
        icon: Brain,
        required: false,
        sensitive: true,
        testEndpoint: "/api/system-admin/test-connection/openai",
      },
      {
        name: "Anthropic API Key",
        key: "anthropic",
        envVar: "ANTHROPIC_API_KEY",
        description: "Claude models for advanced AI analysis",
        icon: Brain,
        required: false,
        sensitive: true,
        testEndpoint: "/api/system-admin/test-connection/anthropic",
      },
    ],
  },
  {
    category: "Payment Processing",
    keys: [
      {
        name: "Stripe Secret Key",
        key: "stripe_secret",
        envVar: "STRIPE_SECRET_KEY",
        description: "Process payments and manage subscriptions",
        icon: CreditCard,
        required: true,
        sensitive: true,
        testEndpoint: "/api/system-admin/test-connection/stripe",
      },
      {
        name: "Stripe Publishable Key",
        key: "stripe_publishable",
        envVar: "STRIPE_PUBLISHABLE_KEY",
        description: "Client-side Stripe integration",
        icon: CreditCard,
        required: true,
        sensitive: false,
      },
      {
        name: "Stripe Webhook Secret",
        key: "stripe_webhook",
        envVar: "STRIPE_WEBHOOK_SECRET",
        description: "Verify Stripe webhook signatures",
        icon: Shield,
        required: true,
        sensitive: true,
      },
    ],
  },
  {
    category: "E-commerce Integration",
    keys: [
      {
        name: "Shopify API Key",
        key: "shopify_api",
        envVar: "SHOPIFY_API_KEY",
        description: "Shopify store integration for e-commerce",
        icon: ShoppingCart,
        required: false,
        sensitive: true,
        testEndpoint: "/api/system-admin/test-connection/shopify",
      },
      {
        name: "Shopify Secret Key",
        key: "shopify_secret",
        envVar: "SHOPIFY_SECRET_KEY",
        description: "Shopify webhook verification",
        icon: Shield,
        required: false,
        sensitive: true,
      },
      {
        name: "Shopify Store Domain",
        key: "shopify_domain",
        envVar: "SHOPIFY_STORE_DOMAIN",
        description: "Your Shopify store URL (e.g., mystore.myshopify.com)",
        icon: ShoppingCart,
        required: false,
        sensitive: false,
      },
    ],
  },
  {
    category: "Email & Communications",
    keys: [
      {
        name: "SMTP Host",
        key: "smtp_host",
        envVar: "SMTP_HOST",
        description: "Email server hostname",
        icon: Mail,
        required: true,
        sensitive: false,
      },
      {
        name: "SMTP Port",
        key: "smtp_port",
        envVar: "SMTP_PORT",
        description: "Email server port (usually 587 or 465)",
        icon: Mail,
        required: true,
        sensitive: false,
      },
      {
        name: "SMTP User",
        key: "smtp_user",
        envVar: "SMTP_USER",
        description: "Email authentication username",
        icon: Mail,
        required: true,
        sensitive: false,
      },
      {
        name: "SMTP Password",
        key: "smtp_password",
        envVar: "SMTP_PASSWORD",
        description: "Email authentication password",
        icon: Lock,
        required: true,
        sensitive: true,
        testEndpoint: "/api/system-admin/test-connection/smtp",
      },
    ],
  },
  {
    category: "Cloud Storage",
    keys: [
      {
        name: "AWS Access Key ID",
        key: "aws_access_key",
        envVar: "AWS_ACCESS_KEY_ID",
        description: "S3 file storage access key",
        icon: CloudIcon,
        required: false,
        sensitive: true,
      },
      {
        name: "AWS Secret Access Key",
        key: "aws_secret_key",
        envVar: "AWS_SECRET_ACCESS_KEY",
        description: "S3 file storage secret key",
        icon: Lock,
        required: false,
        sensitive: true,
        testEndpoint: "/api/system-admin/test-connection/aws-s3",
      },
      {
        name: "AWS Region",
        key: "aws_region",
        envVar: "AWS_REGION",
        description: "S3 bucket region (e.g., us-east-1)",
        icon: CloudIcon,
        required: false,
        sensitive: false,
      },
      {
        name: "S3 Bucket Name",
        key: "aws_s3_bucket",
        envVar: "AWS_S3_BUCKET",
        description: "S3 bucket for file storage",
        icon: Database,
        required: false,
        sensitive: false,
      },
    ],
  },
  {
    category: "External Integrations",
    keys: [
      {
        name: "LIMS API Base URL",
        key: "lims_api_url",
        envVar: "LIMS_API_BASE_URL",
        description: "Lab Information Management System API endpoint",
        icon: Database,
        required: false,
        sensitive: false,
      },
      {
        name: "LIMS API Key",
        key: "lims_api_key",
        envVar: "LIMS_API_KEY",
        description: "LIMS authentication key",
        icon: Key,
        required: false,
        sensitive: true,
        testEndpoint: "/api/system-admin/test-connection/lims",
      },
      {
        name: "LIMS Webhook Secret",
        key: "lims_webhook_secret",
        envVar: "LIMS_WEBHOOK_SECRET",
        description: "LIMS webhook signature verification",
        icon: Shield,
        required: false,
        sensitive: true,
      },
    ],
  },
];

export default function APIKeysManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Fetch current API key values (masked)
  const { data: apiKeys, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/system-admin/config/api-keys"],
  });

  // Save API key mutation
  const saveKeyMutation = useMutation({
    mutationFn: async ({ envVar, value }: { envVar: string; value: string }) => {
      const response = await fetch("/api/system-admin/config/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          key: envVar,
          value: value,
          category: "integration",
        }),
      });
      if (!response.ok) throw new Error("Failed to save API key");
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "API Key Saved",
        description: `${variables.envVar} has been updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-admin/config/api-keys"] });
      // Clear edited value after save
      setEditedValues(prev => {
        const updated = { ...prev };
        delete updated[variables.envVar];
        return updated;
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

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async ({ endpoint, keyValue }: { endpoint: string; keyValue?: string }) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ testValue: keyValue }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Connection test failed");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      const keyName = variables.endpoint.split("/").pop() || "unknown";
      setTestResults(prev => ({
        ...prev,
        [keyName]: { success: true, message: data.message || "Connection successful!" },
      }));
      toast({
        title: "Connection Successful",
        description: data.message || "API key is valid and working.",
      });
      setTestingKey(null);
    },
    onError: (error: Error, variables) => {
      const keyName = variables.endpoint.split("/").pop() || "unknown";
      setTestResults(prev => ({
        ...prev,
        [keyName]: { success: false, message: error.message },
      }));
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      setTestingKey(null);
    },
  });

  const toggleVisibility = (keyName: string) => {
    setVisibleKeys(prev => {
      const updated = new Set(prev);
      if (updated.has(keyName)) {
        updated.delete(keyName);
      } else {
        updated.add(keyName);
      }
      return updated;
    });
  };

  const handleValueChange = (envVar: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [envVar]: value }));
  };

  const handleSave = (envVar: string) => {
    const value = editedValues[envVar];
    if (value !== undefined) {
      saveKeyMutation.mutate({ envVar, value });
    }
  };

  const handleTestConnection = (endpoint: string, envVar: string) => {
    const keyValue = editedValues[envVar] || apiKeys?.[envVar];
    setTestingKey(envVar);
    testConnectionMutation.mutate({ endpoint, keyValue });
  };

  const getCurrentValue = (envVar: string): string => {
    if (editedValues[envVar] !== undefined) {
      return editedValues[envVar];
    }
    return apiKeys?.[envVar] || "";
  };

  const hasChanges = (envVar: string): boolean => {
    return editedValues[envVar] !== undefined && editedValues[envVar] !== (apiKeys?.[envVar] || "");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Key className="h-8 w-8" />
          API Keys Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage third-party service credentials and integration keys. All sensitive keys are encrypted at rest.
        </p>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> API keys are encrypted and stored securely. Never share these keys or commit them to version control.
          Use environment variables in production.
        </AlertDescription>
      </Alert>

      {/* API Keys by Category */}
      <Tabs defaultValue={API_KEY_CATEGORIES[0]?.category} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          {API_KEY_CATEGORIES.map((category) => (
            <TabsTrigger key={category.category} value={category.category}>
              {category.category}
            </TabsTrigger>
          ))}
        </TabsList>

        {API_KEY_CATEGORIES.map((categoryConfig) => (
          <TabsContent key={categoryConfig.category} value={categoryConfig.category} className="space-y-4">
            {categoryConfig.keys.map((keyConfig) => {
              const Icon = keyConfig.icon;
              const currentValue = getCurrentValue(keyConfig.envVar);
              const isVisible = visibleKeys.has(keyConfig.envVar);
              const changed = hasChanges(keyConfig.envVar);
              const testResult = testResults[keyConfig.key];
              const isTesting = testingKey === keyConfig.envVar;

              return (
                <Card key={keyConfig.envVar}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="h-5 w-5 text-primary" />
                      {keyConfig.name}
                      {keyConfig.required && (
                        <Badge variant="destructive" className="ml-2">Required</Badge>
                      )}
                      {currentValue && !keyConfig.testEndpoint && (
                        <Badge variant="outline" className="ml-auto">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configured
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{keyConfig.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={keyConfig.envVar} className="text-sm font-medium">
                        {keyConfig.envVar}
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={keyConfig.envVar}
                            type={isVisible ? "text" : "password"}
                            value={currentValue}
                            onChange={(e) => handleValueChange(keyConfig.envVar, e.target.value)}
                            placeholder={`Enter ${keyConfig.name.toLowerCase()}...`}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => toggleVisibility(keyConfig.envVar)}
                          >
                            {isVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleSave(keyConfig.envVar)}
                          disabled={!changed || saveKeyMutation.isPending}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {changed ? "Save" : "Saved"}
                        </Button>
                        {keyConfig.testEndpoint && (
                          <Button
                            onClick={() => handleTestConnection(keyConfig.testEndpoint!, keyConfig.envVar)}
                            disabled={!currentValue || isTesting}
                            variant="outline"
                            className="gap-2"
                          >
                            {isTesting ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                            Test
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                      <Alert variant={testResult.success ? "default" : "destructive"}>
                        {testResult.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>{testResult.message}</AlertDescription>
                      </Alert>
                    )}

                    {/* Unsaved Changes Warning */}
                    {changed && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          You have unsaved changes. Click "Save" to apply them.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2">
            <RefreshCw className="h-4 w-4" />
            Test All Connections
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Lock className="h-4 w-4" />
            Rotate All Keys
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Database className="h-4 w-4" />
            Export Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
