/**
 * Recall Management Page
 *
 * Automated patient recall system for annual eye examinations
 * - View patients due for recall (last exam > 12 months)
 * - Send bulk recall campaigns via Email/SMS/WhatsApp
 * - Track recall campaign performance
 *
 * SECURITY: Restricted to admin, company_admin, manager, receptionist roles
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Redirect, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { StatCard } from "@/components/StatCard";
import {
  Bell,
  Calendar,
  Mail,
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Eye,
  Search,
  Filter,
  Download,
  Shield,
  RefreshCw
} from "lucide-react";
import { format, subMonths, formatDistanceToNow } from "date-fns";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface PatientRecall {
  patientId: string;
  patientName: string;
  email?: string;
  phone?: string;
  lastExamDate: string;
  daysSinceExam: number;
  preferredContact?: 'email' | 'sms' | 'whatsapp';
}

interface RecallCampaign {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'whatsapp';
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  scheduledFor?: string;
  createdAt: string;
}

export default function RecallManagementPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [customMessage, setCustomMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  // SECURITY: Only allow authorized roles
  const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist'];
  const hasAccess = !!user && ALLOWED_ROLES.includes(user.role);

  // Fetch patients due for recall (placeholder - needs backend implementation)
  const { data: recallData, isLoading: recallLoading, refetch } = useQuery({
    queryKey: ['/api/recalls/due'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // This would query patients where last exam > 12 months ago
      // For now, returning mock data structure
      return {
        patients: [] as PatientRecall[],
        stats: {
          totalDue: 0,
          emailAvailable: 0,
          phoneAvailable: 0,
          highPriority: 0
        }
      };
    },
    enabled: hasAccess,
  });

  // Fetch recall campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ['/api/communications/campaigns', { category: 'recall' }],
    queryFn: async () => {
      const res = await fetch('/api/communications/campaigns?category=recall', { credentials: 'include' });
      if (!res.ok) return { campaigns: [] };
      return res.json();
    },
    enabled: hasAccess,
  });

  // Fetch communication templates
  const { data: templatesData } = useQuery({
    queryKey: ['/api/communications/templates', 'appointment'],
    queryFn: async () => {
      const res = await fetch('/api/communications/templates?category=appointment', { credentials: 'include' });
      if (!res.ok) return { templates: [] };
      return res.json();
    },
    enabled: hasAccess,
  });

  // Send recall campaign mutation
  const sendRecallMutation = useMutation({
    mutationFn: async (data: { patientIds: string[]; channel: string; message: string; scheduledFor?: string }) => {
      const res = await fetch('/api/communications/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `Recall Campaign - ${format(new Date(), 'yyyy-MM-dd')}`,
          channel: data.channel,
          category: 'recall',
          recipientIds: data.patientIds,
          message: data.message,
          scheduledFor: data.scheduledFor,
        }),
      });
      if (!res.ok) throw new Error('Failed to send recall');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recalls/due'] });
      queryClient.invalidateQueries({ queryKey: ['/api/communications/campaigns'] });
      toast({
        title: "Recall campaign sent",
        description: `Successfully sent recall to ${selectedPatients.size} patients`,
      });
      setSelectedPatients(new Set());
      setSendDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Failed to send recall",
        description: "An error occurred while sending the recall campaign",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedPatients.size === (recallData?.patients?.length || 0)) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(recallData?.patients?.map(p => p.patientId) || []));
    }
  };

  const handleSelectPatient = (patientId: string) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId);
    } else {
      newSelected.add(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const handleSendRecall = () => {
    if (selectedPatients.size === 0) {
      toast({
        title: "No patients selected",
        description: "Please select at least one patient to send recall",
        variant: "destructive",
      });
      return;
    }
    sendRecallMutation.mutate({
      patientIds: Array.from(selectedPatients),
      channel: selectedChannel,
      message: customMessage,
      scheduledFor: scheduledDate || undefined,
    });
  };

  const filteredPatients = recallData?.patients?.filter(patient =>
    searchTerm === "" ||
    patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const stats = recallData?.stats || { totalDue: 0, emailAvailable: 0, phoneAvailable: 0, highPriority: 0 };
  const campaigns = campaignsData?.campaigns || [];
  const templates = templatesData?.templates || [];

  const recallTemplates = templates.filter((t: any) =>
    t.name.toLowerCase().includes('recall') ||
    t.name.toLowerCase().includes('checkup') ||
    t.name.toLowerCase().includes('annual')
  );

  // Role-based access control - placed after all hooks
  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="h-6 w-6" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-red-700">
              You don&apos;t have permission to access Recall Management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">
              This feature is restricted to administrative and messaging roles only.
            </p>
            <p className="text-sm text-red-800 mt-2">
              Your role: <Badge variant="outline">{user.role}</Badge>
            </p>
            <Button onClick={() => window.history.back()} variant="outline" className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Patient Recall Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated recall campaigns for annual eye examinations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setSendDialogOpen(true)}
            disabled={selectedPatients.size === 0}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Send Recall ({selectedPatients.size})
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Patients Due"
          value={stats.totalDue.toLocaleString()}
          icon={Users}
          subtitle="Last exam > 12 months"
        />
        <StatCard
          title="Email Available"
          value={stats.emailAvailable.toLocaleString()}
          icon={Mail}
          subtitle="Can receive email recalls"
        />
        <StatCard
          title="Phone Available"
          value={stats.phoneAvailable.toLocaleString()}
          icon={MessageSquare}
          subtitle="Can receive SMS/WhatsApp"
        />
        <StatCard
          title="High Priority"
          value={stats.highPriority.toLocaleString()}
          icon={AlertCircle}
          subtitle="> 18 months overdue"
          className="border-amber-200 bg-amber-50"
        />
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Patients Due for Recall</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign History</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Patients</CardTitle>
              <CardDescription>Search and filter patients due for recall</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="email">Has Email</SelectItem>
                    <SelectItem value="phone">Has Phone</SelectItem>
                    <SelectItem value="both">Has Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Patients Due for Recall
                </span>
                <Badge variant="outline">{filteredPatients.length} patients</Badge>
              </CardTitle>
              <CardDescription>
                Select patients to include in recall campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recallLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading patients...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-muted-foreground">No patients currently due for recall</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This page shows patients whose last exam was more than 12 months ago
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedPatients.size === filteredPatients.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Last Exam</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                        <TableRow key={patient.patientId}>
                          <TableCell>
                            <Checkbox
                              checked={selectedPatients.has(patient.patientId)}
                              onCheckedChange={() => handleSelectPatient(patient.patientId)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{patient.patientName}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {patient.patientId.slice(0, 8)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{format(new Date(patient.lastExamDate), 'MMM d, yyyy')}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(patient.lastExamDate))} ago
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={patient.daysSinceExam > 540 ? 'destructive' : 'default'}>
                              {patient.daysSinceExam} days
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {patient.email && (
                                <Badge variant="outline" className="gap-1">
                                  <Mail className="h-3 w-3" /> Email
                                </Badge>
                              )}
                              {patient.phone && (
                                <Badge variant="outline" className="gap-1">
                                  <MessageSquare className="h-3 w-3" /> SMS
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {patient.daysSinceExam > 540 ? (
                              <Badge variant="destructive">High</Badge>
                            ) : patient.daysSinceExam > 450 ? (
                              <Badge className="bg-amber-500">Medium</Badge>
                            ) : (
                              <Badge variant="secondary">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recall Campaign History
              </CardTitle>
              <CardDescription>
                View past and scheduled recall campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <p className="text-muted-foreground">No recall campaigns yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {campaigns.map((campaign: RecallCampaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {campaign.recipientCount} recipients • {campaign.channel}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div>{campaign.sentCount} sent</div>
                          <div className="text-muted-foreground">{campaign.deliveredCount} delivered</div>
                        </div>
                        <Badge>{campaign.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recall Message Templates
              </CardTitle>
              <CardDescription>
                Pre-configured templates for recall communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recallTemplates.length === 0 ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <p className="text-muted-foreground">No recall templates available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visit Communications Hub to create templates
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {recallTemplates.map((template: any) => (
                    <Card key={template.id} className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          {template.name}
                          <Badge variant="outline">{template.channel}</Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm bg-muted p-3 rounded font-mono whitespace-pre-wrap">
                          {template.body.substring(0, 150)}
                          {template.body.length > 150 && '...'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Recall Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Recall Campaign</DialogTitle>
            <DialogDescription>
              Send recall reminders to {selectedPatients.size} selected patients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Communication Channel</Label>
              <Select value={selectedChannel} onValueChange={(v: any) => setSelectedChannel(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </span>
                  </SelectItem>
                  <SelectItem value="sms">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> SMS
                    </span>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <span className="flex items-center gap-2">
                      <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message (Optional - leave blank to use default template)</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter custom message or leave blank to use template..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Schedule For (Optional)</Label>
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to send immediately
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Campaign Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Recipients:</div>
                <div className="font-medium">{selectedPatients.size} patients</div>
                <div>Channel:</div>
                <div className="font-medium capitalize">{selectedChannel}</div>
                <div>Timing:</div>
                <div className="font-medium">
                  {scheduledDate ? format(new Date(scheduledDate), 'MMM d, yyyy h:mm a') : 'Send immediately'}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendRecall} disabled={sendRecallMutation.isPending}>
              {sendRecallMutation.isPending ? 'Sending...' : 'Send Recall Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
