/**
 * Campaign Manager Page
 *
 * Orchestration layer for bulk patient communications using templates.
 * Enables creation, scheduling, and tracking of multi-channel campaigns
 * for recalls, appointments, and marketing initiatives.
 *
 * SECURITY: Requires admin, company_admin, or manager roles
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Plus,
  Play,
  Pause,
  BarChart3,
  Shield,
  Target,
  Calendar,
  Users,
  TrendingUp,
  Mail,
  MessageSquare,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  templateName?: string;
  channel: 'email' | 'sms' | 'whatsapp';
  targetAudience: string;
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
  launchedAt?: string;
  completedAt?: string;
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  running: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function CampaignManagerPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTemplateId, setFormTemplateId] = useState("");
  const [formTargetAudience, setFormTargetAudience] = useState<string>("all_patients");
  const [formScheduleDate, setFormScheduleDate] = useState("");
  const [formScheduleTime, setFormScheduleTime] = useState("");

  const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager'];
  const hasAccess = !!user && ALLOWED_ROLES.includes(user.role);

  // Fetch campaigns - moved before conditional returns for hooks rules
  const { data: campaignsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/communications/campaigns', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`/api/communications/campaigns?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const data = await res.json();
      return {
        campaigns: data.campaigns as Campaign[],
      };
    },
    enabled: hasAccess,
  });

  // Fetch templates for dropdown
  const { data: templatesData } = useQuery({
    queryKey: ['/api/communications/templates'],
    queryFn: async () => {
      const res = await fetch('/api/communications/templates', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      return data.templates || [];
    },
    enabled: hasAccess,
  });

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const res = await fetch('/api/communications/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(campaignData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully.",
      });
      refetch();
      resetForm();
      setCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Launch campaign mutation
  const launchMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/communications/campaigns/${campaignId}/launch`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to launch campaign');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Launched",
        description: "Your campaign is now running.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pause campaign mutation
  const pauseMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/communications/campaigns/${campaignId}/pause`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to pause campaign');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Paused",
        description: "Your campaign has been paused.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Role-based access control - placed after all hooks
  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="h-6 w-6" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-red-700">
              You do not have permission to manage campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-red-800">
              <p>
                <strong>Required roles:</strong> Admin, Company Admin, or Manager
              </p>
              <p>
                <strong>Your role:</strong> {user.role}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormTemplateId("");
    setFormTargetAudience("all_patients");
    setFormScheduleDate("");
    setFormScheduleTime("");
  };

  const handleCreateCampaign = () => {
    if (!formName || !formTemplateId) {
      toast({
        title: "Validation Error",
        description: "Please provide campaign name and select a template.",
        variant: "destructive",
      });
      return;
    }

    let scheduledFor = undefined;
    if (formScheduleDate && formScheduleTime) {
      scheduledFor = new Date(`${formScheduleDate}T${formScheduleTime}`).toISOString();
    }

    createMutation.mutate({
      name: formName,
      description: formDescription,
      templateId: formTemplateId,
      targetAudience: formTargetAudience,
      scheduledFor,
    });
  };

  const handleViewAnalytics = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setAnalyticsDialogOpen(true);
  };

  // Calculate statistics
  const stats = {
    total: campaignsData?.campaigns?.length || 0,
    running: campaignsData?.campaigns?.filter(c => c.status === 'running').length || 0,
    scheduled: campaignsData?.campaigns?.filter(c => c.status === 'scheduled').length || 0,
    completed: campaignsData?.campaigns?.filter(c => c.status === 'completed').length || 0,
    totalSent: campaignsData?.campaigns?.reduce((sum, c) => sum + (c.sentCount || 0), 0) || 0,
    avgDeliveryRate: campaignsData?.campaigns?.length
      ? (campaignsData.campaigns.reduce((sum, c) =>
          sum + (c.sentCount > 0 ? (c.deliveredCount / c.sentCount) * 100 : 0), 0
        ) / campaignsData.campaigns.filter(c => c.sentCount > 0).length || 0).toFixed(1)
      : '0.0',
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant="outline" className={STATUS_COLORS[status as keyof typeof STATUS_COLORS]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Send className="h-8 w-8" />
            Campaign Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage bulk patient communication campaigns
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.running}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDeliveryRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="filterStatus">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filterStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({campaignsData?.campaigns?.length || 0})</CardTitle>
          <CardDescription>
            Manage your patient communication campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !campaignsData?.campaigns || campaignsData.campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No campaigns found</p>
              <p className="text-sm mt-2">
                Create your first campaign to get started
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Sent / Delivered</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignsData.campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          {campaign.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {campaign.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(campaign.channel)}
                          <span className="capitalize">{campaign.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {campaign.recipientCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {campaign.sentCount} / {campaign.deliveredCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.sentCount > 0 ? (
                          <div className="text-sm">
                            {campaign.openRate ? `${campaign.openRate.toFixed(1)}% open` : 'N/A'}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(campaign.createdAt), 'MMM d')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {campaign.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => launchMutation.mutate(campaign.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Launch
                            </Button>
                          )}
                          {campaign.status === 'running' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pauseMutation.mutate(campaign.id)}
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewAnalytics(campaign)}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a bulk communication campaign using your templates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign Name *</Label>
              <Input
                id="campaignName"
                placeholder="e.g., April Recall Campaign"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignDescription">Description</Label>
              <Textarea
                id="campaignDescription"
                placeholder="Brief description of this campaign..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateSelect">Template *</Label>
              <Select value={formTemplateId} onValueChange={setFormTemplateId}>
                <SelectTrigger id="templateSelect">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesData?.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.channel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience *</Label>
              <Select value={formTargetAudience} onValueChange={setFormTargetAudience}>
                <SelectTrigger id="targetAudience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_patients">All Patients</SelectItem>
                  <SelectItem value="recall_due">Recall Due (12+ months)</SelectItem>
                  <SelectItem value="waitlist">Waitlist Patients</SelectItem>
                  <SelectItem value="no_exam">Never Examined</SelectItem>
                  <SelectItem value="custom">Custom Segment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleDate">Schedule Date (Optional)</Label>
                <Input
                  id="scheduleDate"
                  type="date"
                  value={formScheduleDate}
                  onChange={(e) => setFormScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleTime">Schedule Time</Label>
                <Input
                  id="scheduleTime"
                  type="time"
                  value={formScheduleTime}
                  onChange={(e) => setFormScheduleTime(e.target.value)}
                  disabled={!formScheduleDate}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setCreateDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Campaign Analytics</DialogTitle>
            <DialogDescription>
              {selectedCampaign?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recipients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedCampaign.recipientCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedCampaign.sentCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Delivered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedCampaign.deliveredCount}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedCampaign.sentCount > 0
                        ? `${((selectedCampaign.deliveredCount / selectedCampaign.sentCount) * 100).toFixed(1)}%`
                        : '0%'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedCampaign.failedCount}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedCampaign.openRate !== undefined && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Open Rate:</span>
                        <span className="font-bold">{selectedCampaign.openRate.toFixed(1)}%</span>
                      </div>
                      {selectedCampaign.clickRate !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm">Click Rate:</span>
                          <span className="font-bold">{selectedCampaign.clickRate.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyticsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
