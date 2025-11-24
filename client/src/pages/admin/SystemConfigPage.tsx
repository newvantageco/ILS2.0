import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Shield,
  Bell,
  Globe,
  DollarSign,
  Stethoscope,
  Palette,
  RefreshCw,
  History,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigSetting {
  id: number;
  key: string;
  value: string;
  category: string;
  description: string;
  dataType: string;
  defaultValue: string;
  isEncrypted: boolean;
  lastModified: string;
  modifiedBy: string;
}

interface ConfigCategory {
  name: string;
  icon: any;
  description: string;
  settings: string[];
}

const CONFIG_CATEGORIES: ConfigCategory[] = [
  {
    name: "system",
    icon: Settings,
    description: "Core system settings and general configuration",
    settings: ["system.name", "system.timezone", "system.maintenance_mode"],
  },
  {
    name: "security",
    icon: Shield,
    description: "Security policies, authentication, and access control",
    settings: [
      "security.session_timeout",
      "security.password_min_length",
      "security.mfa_enabled",
      "security.max_login_attempts",
    ],
  },
  {
    name: "integration",
    icon: Globe,
    description: "External system integrations and APIs",
    settings: ["integration.fhir_enabled", "integration.hl7_enabled"],
  },
  {
    name: "communication",
    icon: Bell,
    description: "Email, SMS, and notification settings",
    settings: [
      "communication.email_enabled",
      "communication.sms_enabled",
      "communication.smtp_host",
      "communication.smtp_password",
    ],
  },
  {
    name: "billing",
    icon: DollarSign,
    description: "Billing, payments, and financial settings",
    settings: ["billing.currency", "billing.tax_rate"],
  },
  {
    name: "clinical",
    icon: Stethoscope,
    description: "Clinical workflows and medical settings",
    settings: [
      "clinical.appointment_duration_default",
      "clinical.prescription_refill_days",
    ],
  },
  {
    name: "ui",
    icon: Palette,
    description: "User interface and display preferences",
    settings: ["ui.theme", "ui.items_per_page"],
  },
];

export default function SystemConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState("system");

  // Fetch all configuration settings
  const { data: settings, isLoading } = useQuery<{ settings: ConfigSetting[] }>({
    queryKey: ["/api/system-admin/config/settings"],
  });

  // Fetch configuration history
  const { data: history } = useQuery<{ changes: any[] }>({
    queryKey: ["/api/system-admin/config/history"],
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await fetch(`/api/system-admin/config/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value }),
      });
      if (!response.ok) throw new Error("Failed to update setting");
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Setting Updated",
        description: `${variables.key} has been updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-admin/config/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-admin/config/history"] });
      // Clear edited value
      setEditedValues(prev => {
        const updated = { ...prev };
        delete updated[variables.key];
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

  // Reset to default mutation
  const resetSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await fetch(`/api/system-admin/config/settings/${key}/reset`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to reset setting");
      return response.json();
    },
    onSuccess: (_, key) => {
      toast({
        title: "Setting Reset",
        description: `${key} has been reset to default value.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-admin/config/settings"] });
      // Clear edited value
      setEditedValues(prev => {
        const updated = { ...prev };
        delete updated[key];
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

  // Export configuration mutation
  const exportConfigMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/system-admin/config/export", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to export configuration");
      return response.json();
    },
    onSuccess: (data) => {
      // Download as JSON file
      const blob = new Blob([data.config], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ils-config-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Configuration Exported",
        description: "Configuration has been downloaded successfully.",
      });
    },
  });

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const value = editedValues[key];
    if (value !== undefined) {
      updateSettingMutation.mutate({ key, value });
    }
  };

  const handleReset = (key: string) => {
    resetSettingMutation.mutate(key);
  };

  const getCurrentValue = (key: string): string => {
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    const setting = settings?.settings.find(s => s.key === key);
    return setting?.value || setting?.defaultValue || "";
  };

  const hasChanges = (key: string): boolean => {
    const setting = settings?.settings.find(s => s.key === key);
    return editedValues[key] !== undefined && editedValues[key] !== (setting?.value || "");
  };

  const renderSettingInput = (setting: ConfigSetting) => {
    const currentValue = getCurrentValue(setting.key);
    const changed = hasChanges(setting.key);

    // Boolean settings
    if (setting.dataType === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor={setting.key}>{setting.key}</Label>
            <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
          </div>
          <Switch
            id={setting.key}
            checked={currentValue === "true"}
            onCheckedChange={(checked) => handleValueChange(setting.key, String(checked))}
          />
        </div>
      );
    }

    // Number settings
    if (setting.dataType === "number") {
      return (
        <div className="space-y-2">
          <Label htmlFor={setting.key}>{setting.key}</Label>
          <p className="text-sm text-muted-foreground">{setting.description}</p>
          <Input
            id={setting.key}
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
          />
        </div>
      );
    }

    // String settings (default)
    return (
      <div className="space-y-2">
        <Label htmlFor={setting.key}>{setting.key}</Label>
        <p className="text-sm text-muted-foreground">{setting.description}</p>
        <Input
          id={setting.key}
          type={setting.isEncrypted ? "password" : "text"}
          value={currentValue}
          onChange={(e) => handleValueChange(setting.key, e.target.value)}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const categorySettings = settings?.settings.filter(s => s.category === selectedCategory) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8" />
            System Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage system-wide settings and preferences. Changes take effect immediately.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportConfigMutation.mutate()}
            disabled={exportConfigMutation.isPending}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Configuration by Category */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          {CONFIG_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.name} value={category.name} className="gap-2">
                <Icon className="h-4 w-4" />
                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CONFIG_CATEGORIES.map((categoryConfig) => (
          <TabsContent key={categoryConfig.name} value={categoryConfig.name} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = categoryConfig.icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {categoryConfig.name.charAt(0).toUpperCase() + categoryConfig.name.slice(1)} Settings
                </CardTitle>
                <CardDescription>{categoryConfig.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {categorySettings.map((setting) => (
                  <div key={setting.key} className="pb-6 border-b last:border-0 last:pb-0">
                    {renderSettingInput(setting)}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        onClick={() => handleSave(setting.key)}
                        disabled={!hasChanges(setting.key) || updateSettingMutation.isPending}
                        size="sm"
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {hasChanges(setting.key) ? "Save Changes" : "Saved"}
                      </Button>

                      <Button
                        onClick={() => handleReset(setting.key)}
                        disabled={resetSettingMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset to Default
                      </Button>

                      {setting.isEncrypted && (
                        <Badge variant="secondary" className="ml-auto gap-1">
                          <Lock className="h-3 w-3" />
                          Encrypted
                        </Badge>
                      )}

                      {hasChanges(setting.key) && (
                        <Badge variant="outline" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Unsaved
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Default: {setting.defaultValue}</span>
                      <span>•</span>
                      <span>Last modified: {new Date(setting.lastModified).toLocaleString()}</span>
                      {setting.modifiedBy && (
                        <>
                          <span>•</span>
                          <span>by {setting.modifiedBy}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Configuration History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Configuration Changes
          </CardTitle>
          <CardDescription>
            Track who changed what and when
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history?.changes && history.changes.length > 0 ? (
            <div className="space-y-3">
              {history.changes.slice(0, 10).map((change: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{change.key}</p>
                    <p className="text-sm text-muted-foreground">
                      Changed from &ldquo;{change.oldValue}&rdquo; to &ldquo;{change.newValue}&rdquo;
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{new Date(change.timestamp).toLocaleString()}</p>
                    <p>{change.modifiedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No configuration changes yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning for unsaved changes */}
      {Object.keys(editedValues).length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {Object.keys(editedValues).length} unsaved change(s). Make sure to save your changes before leaving this page.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
