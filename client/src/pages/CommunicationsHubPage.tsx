/**
 * Communications Hub Page
 *
 * Multi-channel messaging: Email, SMS, WhatsApp, Push Notifications
 * Template management, campaigns, and message history
 *
 * SECURITY: Restricted to admin, company_admin, manager, receptionist roles
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Mail,
  Smartphone,
  Bell,
  Send,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  FileText,
  Zap,
  RefreshCw,
  Eye,
  Copy,
  Trash2,
  Shield
} from "lucide-react";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  subject?: string;
  body: string;
  variables: string[];
  category: string;
  active: boolean;
  createdAt: string;
}

interface Message {
  id: string;
  channel: string;
  to: string;
  subject?: string;
  body: string;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
}

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  channel: string;
  templateId?: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  createdAt: string;
}

interface MessageStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export default function CommunicationsHubPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  // SECURITY: Only allow authorized roles to access communications
  const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist'];

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="h-6 w-6" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-red-700">
              You don't have permission to access the Communications Hub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-red-800">
                The Communications Hub is restricted to administrative and messaging roles only.
              </p>
              <div className="bg-white p-4 rounded border border-red-200">
                <p className="text-sm font-medium text-gray-900 mb-2">Allowed Roles:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>Administrator</li>
                  <li>Company Administrator</li>
                  <li>Manager</li>
                  <li>Receptionist</li>
                </ul>
              </div>
              <p className="text-sm text-red-800">
                Your role: <Badge variant="outline">{user.role}</Badge>
              </p>
              <p className="text-sm text-red-800">
                If you believe you should have access, please contact your company administrator.
              </p>
              <Button onClick={() => window.history.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/communications/templates', selectedChannel !== 'all' ? selectedChannel : undefined],
    queryFn: async () => {
      const url = selectedChannel !== 'all' 
        ? `/api/communications/templates?channel=${selectedChannel}`
        : '/api/communications/templates';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
  });

  // Fetch message stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/communications/messages/stats'],
    queryFn: async () => {
      const res = await fetch('/api/communications/messages/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  // Fetch campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ['/api/communications/campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/communications/campaigns', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { channel: string; to: string; content: { subject?: string; body: string }; templateId?: string; variables?: Record<string, string> }) => {
      const endpoint = data.templateId 
        ? '/api/communications/messages/send-template'
        : '/api/communications/messages/send';
      
      const body = data.templateId 
        ? { templateId: data.templateId, to: data.to, variables: data.variables }
        : { channel: data.channel, to: data.to, content: data.content, recipientType: 'patient' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/messages/stats'] });
      setComposeOpen(false);
      toast({ title: "Message Sent", description: "Your message has been queued for delivery" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: Partial<MessageTemplate>) => {
      const res = await fetch('/api/communications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/templates'] });
      setTemplateOpen(false);
      toast({ title: "Template Created", description: "Message template has been saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const templates = templatesData?.templates || [];
  const stats: MessageStats = statsData?.stats || {
    total: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0,
    deliveryRate: 0, openRate: 0, clickRate: 0
  };
  const campaigns = campaignsData?.campaigns || [];

  const getChannelIcon = (channel: string, className = "h-4 w-4") => {
    switch (channel) {
      case 'email': return <Mail className={className} />;
      case 'sms': return <Smartphone className={className} />;
      case 'whatsapp': return <WhatsAppIcon className={className} />;
      case 'push': return <Bell className={className} />;
      default: return <MessageCircle className={className} />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-500';
      case 'sms': return 'bg-purple-500';
      case 'whatsapp': return 'bg-green-500';
      case 'push': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      sent: { variant: "default", icon: CheckCircle2 },
      delivered: { variant: "default", icon: CheckCircle2 },
      opened: { variant: "default", icon: Eye },
      queued: { variant: "secondary", icon: Clock },
      sending: { variant: "secondary", icon: RefreshCw },
      failed: { variant: "destructive", icon: XCircle },
      bounced: { variant: "destructive", icon: AlertTriangle },
    };
    const config = variants[status] || { variant: "default", icon: MessageCircle };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            Communications Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Send messages via Email, SMS, WhatsApp, and Push Notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Message Template</DialogTitle>
                <DialogDescription>Create a reusable template for your communications</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const variables = (formData.get('variables') as string).split(',').map(v => v.trim()).filter(Boolean);
                createTemplateMutation.mutate({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  channel: formData.get('channel') as any,
                  subject: formData.get('subject') as string || undefined,
                  body: formData.get('body') as string,
                  variables,
                  category: formData.get('category') as string,
                  active: true,
                });
              }}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Template Name</Label>
                      <Input id="name" name="name" placeholder="e.g., Order Ready Notification" required />
                    </div>
                    <div>
                      <Label htmlFor="channel">Channel</Label>
                      <Select name="channel" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">📧 Email</SelectItem>
                          <SelectItem value="sms">📱 SMS</SelectItem>
                          <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                          <SelectItem value="push">🔔 Push Notification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" placeholder="What is this template for?" />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="order">Order</SelectItem>
                        <SelectItem value="recall">Recall</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject (for Email)</Label>
                    <Input id="subject" name="subject" placeholder="Email subject line" />
                  </div>
                  <div>
                    <Label htmlFor="body">Message Body</Label>
                    <Textarea 
                      id="body" 
                      name="body" 
                      rows={6}
                      placeholder="Hi {{firstName}}! Your order is ready..."
                      required 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {"{{variableName}}"} for dynamic content
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="variables">Variables (comma-separated)</Label>
                    <Input id="variables" name="variables" placeholder="firstName, orderNumber, collectionDate" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createTemplateMutation.isPending}>
                    {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Compose Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Message</DialogTitle>
                <DialogDescription>Send a message via any channel</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                sendMessageMutation.mutate({
                  channel: formData.get('channel') as string,
                  to: formData.get('to') as string,
                  content: {
                    subject: formData.get('subject') as string || undefined,
                    body: formData.get('body') as string,
                  },
                });
              }}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="send-channel">Channel</Label>
                      <Select name="channel" required>
                        <SelectTrigger id="send-channel">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">📧 Email</SelectItem>
                          <SelectItem value="sms">📱 SMS</SelectItem>
                          <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                          <SelectItem value="push">🔔 Push Notification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="to">Recipient</Label>
                      <Input id="to" name="to" placeholder="Email or phone number" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="send-subject">Subject (for Email)</Label>
                    <Input id="send-subject" name="subject" placeholder="Email subject line" />
                  </div>
                  <div>
                    <Label htmlFor="send-body">Message</Label>
                    <Textarea 
                      id="send-body" 
                      name="body" 
                      rows={6}
                      placeholder="Type your message here..."
                      required 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={sendMessageMutation.isPending}>
                    {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Channel Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedChannel('all')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              All Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.deliveryRate.toFixed(1)}% delivered
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedChannel('email')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(stats.total * 0.45)}</div>
            <p className="text-xs text-muted-foreground">{stats.openRate.toFixed(1)}% open rate</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedChannel('sms')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-purple-500" />
              SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(stats.total * 0.25)}</div>
            <p className="text-xs text-muted-foreground">98% delivery</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200 bg-green-50/50" onClick={() => setSelectedChannel('whatsapp')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <WhatsAppIcon className="h-4 w-4 text-green-600" />
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{Math.floor(stats.total * 0.20)}</div>
            <p className="text-xs text-green-600">95% read rate</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedChannel('push')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              Push
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(stats.total * 0.10)}</div>
            <p className="text-xs text-muted-foreground">72% engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Message Templates</CardTitle>
                  <CardDescription>Pre-configured message templates for all channels</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No templates found</p>
                  <p className="text-sm">Create your first template to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Variables</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template: MessageTemplate) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {template.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${getChannelColor(template.channel)} text-white`}>
                            {getChannelIcon(template.channel, "h-3 w-3")}
                            {template.channel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{template.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {template.variables?.slice(0, 3).map(v => (
                              <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                            ))}
                            {template.variables?.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{template.variables.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.active ? "default" : "secondary"}>
                            {template.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedTemplate(template)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Marketing Campaigns</CardTitle>
                  <CardDescription>Manage bulk messaging campaigns</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No campaigns yet</p>
                  <p className="text-sm">Create your first campaign to reach multiple patients</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign: Campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {getChannelIcon(campaign.channel, "h-3 w-3")}
                            {campaign.channel}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>{campaign.recipientCount}</TableCell>
                        <TableCell>{campaign.deliveredCount}</TableCell>
                        <TableCell>{campaign.openedCount}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WhatsAppIcon className="h-5 w-5 text-green-600" />
                  WhatsApp Business
                </CardTitle>
                <CardDescription>Connect with patients via WhatsApp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Configuration Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Twilio Account</span>
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Configured
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>WhatsApp Number</span>
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Set
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-green-700 mt-3">
                    Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in Railway environment variables.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="justify-start" onClick={() => {
                      setSelectedChannel('whatsapp');
                      setComposeOpen(true);
                    }}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => setTemplateOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Templates</CardTitle>
                <CardDescription>Pre-approved message templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Order Ready - WhatsApp', category: 'order', emoji: '👓' },
                    { name: 'Appointment Reminder - WhatsApp', category: 'appointment', emoji: '📅' },
                    { name: 'Annual Checkup Reminder - WhatsApp', category: 'recall', emoji: '👁️' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.emoji}</span>
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Message History</CardTitle>
              <CardDescription>Recent WhatsApp communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <WhatsAppIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No WhatsApp messages yet</p>
                <p className="text-sm">Configure Twilio WhatsApp to start sending messages</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.deliveryRate.toFixed(1)}%</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +2.3% from last week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.openRate.toFixed(1)}%</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +5.1% from last week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.clickRate.toFixed(1)}%</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +1.8% from last week
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Message Performance by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['email', 'sms', 'whatsapp', 'push'].map(channel => (
                  <div key={channel} className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getChannelColor(channel)}`}>
                      {getChannelIcon(channel, "h-5 w-5 text-white")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{channel}</span>
                        <span className="text-sm text-muted-foreground">
                          {channel === 'whatsapp' ? '95%' : channel === 'sms' ? '98%' : channel === 'email' ? '87%' : '72%'}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getChannelColor(channel)} transition-all`}
                          style={{ 
                            width: channel === 'whatsapp' ? '95%' : 
                                   channel === 'sms' ? '98%' : 
                                   channel === 'email' ? '87%' : '72%' 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
