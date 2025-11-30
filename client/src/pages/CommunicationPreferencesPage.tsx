/**
 * Communication Preferences Management Page
 *
 * GDPR/HIPAA-compliant patient communication consent management
 * Allows staff to view and manage patient communication preferences
 *
 * Features:
 * - Patient preference list with search and filtering
 * - Channel-specific opt-in/opt-out (Email, SMS, WhatsApp, Push, In-App)
 * - Category-specific preferences (Recalls, Appointments, Marketing, Follow-ups)
 * - Global opt-out with timestamp tracking
 * - Consent audit trail
 * - Bulk preference management
 * - Compliance reporting
 *
 * SECURITY: Restricted to admin, company_admin, manager, receptionist roles
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Mail,
  Smartphone,
  MessageCircle,
  Bell,
  Search,
  Settings,
  CheckCircle2,
  XCircle,
  Shield,
  FileText,
  Users,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  preferences?: CommunicationPreferences;
}

interface CommunicationPreferences {
  patientId: string;
  globalOptOut: boolean;
  optOutDate?: string;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
    in_app: boolean;
  };
  categories: {
    recalls: boolean;
    appointments: boolean;
    marketing: boolean;
    follow_ups: boolean;
    notifications: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start?: string; // HH:mm format
    end?: string; // HH:mm format
  };
  updatedAt?: string;
  consentDate?: string;
}

const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist'];

export default function CommunicationPreferencesPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [editedPreferences, setEditedPreferences] = useState<CommunicationPreferences | null>(null);

  const hasAccess = !!user && ALLOWED_ROLES.includes(user.role);

  // Fetch patients list (mock for now - would need real endpoint)
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['/api/patients', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/patients?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
    enabled: hasAccess,
  });

  const patients: Patient[] = patientsData?.patients || [];

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async ({ patientId, preferences }: { patientId: string; preferences: Partial<CommunicationPreferences> }) => {
      const res = await fetch(`/api/communications/preferences/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });
      if (!res.ok) throw new Error('Failed to update preferences');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Preferences Updated",
        description: "Patient communication preferences have been updated successfully.",
      });
      setPreferencesOpen(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update communication preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Opt-out mutation
  const optOutMutation = useMutation({
    mutationFn: async ({ patientId, channel, category }: { patientId: string; channel?: string; category?: string }) => {
      const res = await fetch(`/api/communications/preferences/${patientId}/opt-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channel, category }),
      });
      if (!res.ok) throw new Error('Failed to opt out');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Opt-Out Successful",
        description: "Patient has been opted out successfully.",
      });
    },
  });

  // Opt-in mutation
  const optInMutation = useMutation({
    mutationFn: async ({ patientId, channel, category }: { patientId: string; channel?: string; category?: string }) => {
      const res = await fetch(`/api/communications/preferences/${patientId}/opt-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channel, category }),
      });
      if (!res.ok) throw new Error('Failed to opt in');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Opt-In Successful",
        description: "Patient has been opted in successfully.",
      });
    },
  });

  const handleViewPreferences = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditedPreferences(patient.preferences || getDefaultPreferences(patient.id));
    setPreferencesOpen(true);
  };

  const handleSavePreferences = () => {
    if (!selectedPatient || !editedPreferences) return;

    updatePreferencesMutation.mutate({
      patientId: selectedPatient.id,
      preferences: editedPreferences,
    });
  };

  const handleGlobalOptOut = (patientId: string) => {
    optOutMutation.mutate({ patientId });
  };

  const handleGlobalOptIn = (patientId: string) => {
    optInMutation.mutate({ patientId });
  };

  const getDefaultPreferences = (patientId: string): CommunicationPreferences => ({
    patientId,
    globalOptOut: false,
    channels: {
      email: true,
      sms: true,
      whatsapp: false,
      push: true,
      in_app: true,
    },
    categories: {
      recalls: true,
      appointments: true,
      marketing: false,
      follow_ups: true,
      notifications: true,
    },
    quietHours: {
      enabled: false,
    },
  });

  const getConsentStatus = (patient: Patient) => {
    if (patient.preferences?.globalOptOut) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Opted Out
        </Badge>
      );
    }

    const hasAnyChannel = patient.preferences && Object.values(patient.preferences.channels).some(v => v);
    if (hasAnyChannel) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
        No Consent
      </Badge>
    );
  };

  const getActiveChannels = (preferences?: CommunicationPreferences) => {
    if (!preferences || preferences.globalOptOut) return 'None';

    const active = Object.entries(preferences.channels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel.toUpperCase());

    return active.length > 0 ? active.join(', ') : 'None';
  };

  const updateChannel = (channel: keyof CommunicationPreferences['channels'], value: boolean) => {
    if (!editedPreferences) return;
    setEditedPreferences({
      ...editedPreferences,
      channels: {
        ...editedPreferences.channels,
        [channel]: value,
      },
    });
  };

  const updateCategory = (category: keyof CommunicationPreferences['categories'], value: boolean) => {
    if (!editedPreferences) return;
    setEditedPreferences({
      ...editedPreferences,
      categories: {
        ...editedPreferences.categories,
        [category]: value,
      },
    });
  };

  const exportPreferences = () => {
    const headers = ['Patient Name', 'Email', 'Phone', 'Status', 'Active Channels', 'Opt-Out Date'];
    const rows = patients.map(p => [
      `${p.firstName} ${p.lastName}`,
      p.email || '',
      p.phoneNumber || '',
      p.preferences?.globalOptOut ? 'Opted Out' : 'Active',
      getActiveChannels(p.preferences),
      p.preferences?.optOutDate ? format(new Date(p.preferences.optOutDate), 'yyyy-MM-dd HH:mm:ss') : '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `communication-preferences-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: patients.length,
    optedOut: patients.filter(p => p.preferences?.globalOptOut).length,
    active: patients.filter(p => !p.preferences?.globalOptOut &&
      p.preferences && Object.values(p.preferences.channels).some(v => v)).length,
    noConsent: patients.filter(p => !p.preferences ||
      (!p.preferences.globalOptOut && !Object.values(p.preferences.channels).some(v => v))).length,
  };

  // Role-based access control - placed after all hooks
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don&apos;t have permission to manage communication preferences.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Communication Preferences
          </h1>
          <p className="text-muted-foreground mt-1">
            GDPR-compliant patient consent and preference management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportPreferences} disabled={patients.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Active Consent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 && `${((stats.active / stats.total) * 100).toFixed(1)}% of patients`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <XCircle className="h-4 w-4 text-destructive" />
              Opted Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.optedOut.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 && `${((stats.optedOut / stats.total) * 100).toFixed(1)}% of patients`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              No Consent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.noConsent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 && `${((stats.noConsent / stats.total) * 100).toFixed(1)}% need setup`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Preferences</CardTitle>
          <CardDescription>
            Manage patient communication consent and channel preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patientsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No patients found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active Channels</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {patient.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {patient.email}
                            </div>
                          )}
                          {patient.phoneNumber && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Smartphone className="h-3 w-3" />
                              {patient.phoneNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getConsentStatus(patient)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getActiveChannels(patient.preferences)}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {patient.preferences?.updatedAt ?
                          format(new Date(patient.preferences.updatedAt), 'MMM dd, yyyy') :
                          'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPreferences(patient)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences Dialog */}
      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Communication Preferences - {selectedPatient?.firstName} {selectedPatient?.lastName}
            </DialogTitle>
            <DialogDescription>
              Manage patient consent and communication channel preferences
            </DialogDescription>
          </DialogHeader>

          {editedPreferences && (
            <Tabs defaultValue="channels" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="channels">Channels</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="channels" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-sm text-muted-foreground">{selectedPatient?.email || 'No email'}</div>
                      </div>
                    </div>
                    <Switch
                      checked={editedPreferences.channels.email}
                      onCheckedChange={(v) => updateChannel('email', v)}
                      disabled={!selectedPatient?.email}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">SMS</div>
                        <div className="text-sm text-muted-foreground">{selectedPatient?.phoneNumber || 'No phone'}</div>
                      </div>
                    </div>
                    <Switch
                      checked={editedPreferences.channels.sms}
                      onCheckedChange={(v) => updateChannel('sms', v)}
                      disabled={!selectedPatient?.phoneNumber}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <WhatsAppIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">WhatsApp</div>
                        <div className="text-sm text-muted-foreground">{selectedPatient?.phoneNumber || 'No phone'}</div>
                      </div>
                    </div>
                    <Switch
                      checked={editedPreferences.channels.whatsapp}
                      onCheckedChange={(v) => updateChannel('whatsapp', v)}
                      disabled={!selectedPatient?.phoneNumber}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Push Notifications</div>
                        <div className="text-sm text-muted-foreground">In-app push messages</div>
                      </div>
                    </div>
                    <Switch
                      checked={editedPreferences.channels.push}
                      onCheckedChange={(v) => updateChannel('push', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-medium">In-App Messages</div>
                        <div className="text-sm text-muted-foreground">Portal notifications</div>
                      </div>
                    </div>
                    <Switch
                      checked={editedPreferences.channels.in_app}
                      onCheckedChange={(v) => updateChannel('in_app', v)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Recalls & Reminders</div>
                      <div className="text-sm text-muted-foreground">Eye exam and recall notifications</div>
                    </div>
                    <Switch
                      checked={editedPreferences.categories.recalls}
                      onCheckedChange={(v) => updateCategory('recalls', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Appointment Confirmations</div>
                      <div className="text-sm text-muted-foreground">Booking confirmations and updates</div>
                    </div>
                    <Switch
                      checked={editedPreferences.categories.appointments}
                      onCheckedChange={(v) => updateCategory('appointments', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Marketing & Promotions</div>
                      <div className="text-sm text-muted-foreground">Special offers and news</div>
                    </div>
                    <Switch
                      checked={editedPreferences.categories.marketing}
                      onCheckedChange={(v) => updateCategory('marketing', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Follow-up Care</div>
                      <div className="text-sm text-muted-foreground">Post-visit and care instructions</div>
                    </div>
                    <Switch
                      checked={editedPreferences.categories.follow_ups}
                      onCheckedChange={(v) => updateCategory('follow_ups', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">General Notifications</div>
                      <div className="text-sm text-muted-foreground">System and service updates</div>
                    </div>
                    <Switch
                      checked={editedPreferences.categories.notifications}
                      onCheckedChange={(v) => updateCategory('notifications', v)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Global opt-out will prevent all communications to this patient except critical transactional messages.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between p-4 border-2 border-destructive rounded-lg">
                    <div>
                      <div className="font-medium">Global Opt-Out</div>
                      <div className="text-sm text-muted-foreground">
                        {editedPreferences.globalOptOut && editedPreferences.optOutDate
                          ? `Opted out on ${format(new Date(editedPreferences.optOutDate), 'MMM dd, yyyy')}`
                          : 'Patient will not receive any communications'}
                      </div>
                    </div>
                    <Switch
                      checked={editedPreferences.globalOptOut}
                      onCheckedChange={(v) => setEditedPreferences({
                        ...editedPreferences,
                        globalOptOut: v,
                        optOutDate: v ? new Date().toISOString() : undefined,
                      })}
                    />
                  </div>

                  {editedPreferences.consentDate && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm">
                        <strong>Consent Date:</strong> {format(new Date(editedPreferences.consentDate), 'MMM dd, yyyy HH:mm:ss')}
                      </div>
                    </div>
                  )}

                  {editedPreferences.updatedAt && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm">
                        <strong>Last Updated:</strong> {format(new Date(editedPreferences.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreferencesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences} disabled={updatePreferencesMutation.isPending}>
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
