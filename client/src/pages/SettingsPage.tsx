import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, User, Bell, Users, Beaker, Plus, Check } from "lucide-react";
import type { OrganizationSettings, UserPreferences } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: orgSettings, isLoading: isLoadingOrg } = useQuery<OrganizationSettings>({
    queryKey: ["/api/settings/organization"],
  });

  const { data: userPreferences, isLoading: isLoadingPrefs } = useQuery<UserPreferences>({
    queryKey: ["/api/settings/preferences"],
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (data: Partial<OrganizationSettings>) => {
      const response = await apiRequest("PUT", "/api/settings/organization", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/organization"] });
      toast({
        title: "Settings updated",
        description: "Organization settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update organization settings.",
        variant: "destructive",
      });
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const response = await apiRequest("PUT", "/api/settings/preferences", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/preferences"] });
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and preferences</p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-settings">
          <TabsTrigger value="organization" data-testid="tab-organization">
            <Building2 className="mr-2 h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">
            <Users className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <User className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          <OrganizationSettings
            settings={orgSettings}
            isLoading={isLoadingOrg}
            onSave={(data) => updateOrgMutation.mutate(data)}
            isSaving={updateOrgMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <UserPreferencesSettings
            preferences={userPreferences}
            isLoading={isLoadingPrefs}
            onSave={(data) => updatePrefsMutation.mutate(data)}
            isSaving={updatePrefsMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrganizationSettings({ 
  settings, 
  isLoading, 
  onSave, 
  isSaving 
}: { 
  settings?: OrganizationSettings; 
  isLoading: boolean; 
  onSave: (data: any) => void; 
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    companyName: settings?.companyName || "",
    contactEmail: settings?.contactEmail || "",
    contactPhone: settings?.contactPhone || "",
    orderNumberPrefix: settings?.orderNumberPrefix || "ORD",
    defaultLeadTimeDays: settings?.defaultLeadTimeDays?.toString() || "7",
    address: {
      street: (settings?.address as any)?.street || "",
      city: (settings?.address as any)?.city || "",
      state: (settings?.address as any)?.state || "",
      zipCode: (settings?.address as any)?.zipCode || "",
      country: (settings?.address as any)?.country || "",
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      defaultLeadTimeDays: parseInt(formData.defaultLeadTimeDays) || 7,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Update your organization details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              data-testid="input-company-name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Optical Lab Inc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                data-testid="input-contact-email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                data-testid="input-contact-phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              data-testid="input-street"
              value={formData.address.street}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                data-testid="input-city"
                value={formData.address.city}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                placeholder="Portland"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                data-testid="input-state"
                value={formData.address.state}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                placeholder="OR"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                data-testid="input-zip-code"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                placeholder="97201"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                data-testid="input-country"
                value={formData.address.country}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                placeholder="USA"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Order Configuration</CardTitle>
          <CardDescription>Configure default order settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumberPrefix">Order Number Prefix</Label>
              <Input
                id="orderNumberPrefix"
                data-testid="input-order-prefix"
                value={formData.orderNumberPrefix}
                onChange={(e) => setFormData({ ...formData, orderNumberPrefix: e.target.value })}
                placeholder="ORD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultLeadTimeDays">Default Lead Time (Days)</Label>
              <Input
                id="defaultLeadTimeDays"
                data-testid="input-lead-time"
                type="number"
                min="1"
                value={formData.defaultLeadTimeDays}
                onChange={(e) => setFormData({ ...formData, defaultLeadTimeDays: e.target.value })}
                placeholder="7"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSaving}
              data-testid="button-save-organization"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function UserPreferencesSettings({ 
  preferences, 
  isLoading, 
  onSave, 
  isSaving 
}: { 
  preferences?: UserPreferences; 
  isLoading: boolean; 
  onSave: (data: any) => void; 
  isSaving: boolean;
}) {
  const [theme, setTheme] = useState(preferences?.theme || "light");
  const [language, setLanguage] = useState(preferences?.language || "en");
  const [emailNotifications, setEmailNotifications] = useState({
    orderUpdates: (preferences?.emailNotifications as any)?.orderUpdates ?? true,
    systemAlerts: (preferences?.emailNotifications as any)?.systemAlerts ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      theme,
      language,
      emailNotifications,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>Customize your application appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              data-testid="select-theme"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              data-testid="select-language"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="orderUpdates">Order Updates</Label>
              <p className="text-sm text-muted-foreground">Receive notifications about order status changes</p>
            </div>
            <Switch
              id="orderUpdates"
              data-testid="switch-order-updates"
              checked={emailNotifications.orderUpdates}
              onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, orderUpdates: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="systemAlerts">System Alerts</Label>
              <p className="text-sm text-muted-foreground">Receive important system notifications</p>
            </div>
            <Switch
              id="systemAlerts"
              data-testid="switch-system-alerts"
              checked={emailNotifications.systemAlerts}
              onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, systemAlerts: checked })}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSaving}
              data-testid="button-save-preferences"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function RoleManagement() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const availableRoles = (user as any)?.availableRoles || [];

  const addRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("POST", "/api/auth/add-role", { role });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Role added",
        description: "The role has been added to your account successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const roles = [
    {
      id: "ecp",
      name: "Eye Care Professional",
      description: "Submit and track lens orders for your patients",
      icon: Users,
      color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    },
    {
      id: "lab_tech",
      name: "Lab Technician",
      description: "Manage production queue and quality control",
      icon: Beaker,
      color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasRole = (roleId: string) => availableRoles.includes(roleId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>
            Add additional roles to your account to access different features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {roles.map((role) => {
              const Icon = role.icon;
              const hasThisRole = hasRole(role.id);

              return (
                <div
                  key={role.id}
                  className={`flex items-center justify-between p-4 rounded-md border ${role.color}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-md bg-background p-2">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{role.name}</h3>
                        {hasThisRole && (
                          <Badge variant="outline" className="gap-1">
                            <Check className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                  {!hasThisRole && (
                    <Button
                      size="sm"
                      onClick={() => addRoleMutation.mutate(role.id)}
                      disabled={addRoleMutation.isPending}
                      data-testid={`button-add-role-${role.id}`}
                    >
                      {addRoleMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      <Plus className="h-4 w-4 mr-1" />
                      Add Role
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 mt-0.5" />
              <p>
                You currently have access to {availableRoles.length || 0} role(s). 
                Use the role switcher in the header to switch between your roles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
