/**
 * Communication Template Builder Page
 *
 * Essential infrastructure for recall, waitlist, and campaign systems.
 * Enables creation and management of professional, compliant message templates
 * across email, SMS, and WhatsApp channels with variable substitution.
 *
 * SECURITY: Requires admin, company_admin, or manager roles
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  MessageSquare,
  FileText,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  Copy,
  Send,
  Search,
  Filter,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface CommunicationTemplate {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'whatsapp';
  category: 'recall' | 'appointment' | 'marketing' | 'follow_up' | 'notification';
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CHANNEL_ICONS = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
};

const CATEGORY_COLORS = {
  recall: 'bg-blue-100 text-blue-800',
  appointment: 'bg-green-100 text-green-800',
  marketing: 'bg-purple-100 text-purple-800',
  follow_up: 'bg-orange-100 text-orange-800',
  notification: 'bg-gray-100 text-gray-800',
};

export default function CommunicationTemplatesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CommunicationTemplate | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formChannel, setFormChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [formCategory, setFormCategory] = useState<'recall' | 'appointment' | 'marketing' | 'follow_up' | 'notification'>('recall');
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");

  const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager'];

  // Role-based access control
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="h-6 w-6" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-red-700">
              You do not have permission to manage communication templates.
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
              <p className="pt-2">
                Template management is restricted to administrators to ensure message quality and compliance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch templates
  const { data: templatesData, isLoading, refetch } = useQuery({
    queryKey: ['/api/communications/templates', filterChannel, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterChannel !== 'all') params.append('channel', filterChannel);
      if (filterCategory !== 'all') params.append('category', filterCategory);

      const res = await fetch(`/api/communications/templates?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await res.json();
      return {
        templates: data.templates as CommunicationTemplate[],
      };
    },
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const res = await fetch('/api/communications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create template');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Communication template has been created successfully.",
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

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch(`/api/communications/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Communication template has been deleted.",
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

  const resetForm = () => {
    setFormName("");
    setFormChannel('email');
    setFormCategory('recall');
    setFormSubject("");
    setFormBody("");
    setEditingTemplate(null);
  };

  const handleCreateTemplate = () => {
    if (!formName || !formBody) {
      toast({
        title: "Validation Error",
        description: "Please provide template name and body.",
        variant: "destructive",
      });
      return;
    }

    if (formChannel === 'email' && !formSubject) {
      toast({
        title: "Validation Error",
        description: "Email templates require a subject line.",
        variant: "destructive",
      });
      return;
    }

    // Extract variables from template body (e.g., {{patientName}}, {{appointmentDate}})
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables = Array.from(formBody.matchAll(variablePattern), m => m[1]);

    createMutation.mutate({
      name: formName,
      channel: formChannel,
      category: formCategory,
      subject: formChannel === 'email' ? formSubject : undefined,
      body: formBody,
      variables,
      isActive: true,
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(templateId);
    }
  };

  const handlePreviewTemplate = (template: CommunicationTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleDuplicateTemplate = (template: CommunicationTemplate) => {
    setFormName(`${template.name} (Copy)`);
    setFormChannel(template.channel);
    setFormCategory(template.category);
    setFormSubject(template.subject || "");
    setFormBody(template.body);
    setCreateDialogOpen(true);
  };

  // Filter and search logic
  const filteredTemplates = templatesData?.templates?.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.body.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  // Calculate statistics
  const stats = {
    total: templatesData?.templates?.length || 0,
    email: templatesData?.templates?.filter(t => t.channel === 'email').length || 0,
    sms: templatesData?.templates?.filter(t => t.channel === 'sms').length || 0,
    whatsapp: templatesData?.templates?.filter(t => t.channel === 'whatsapp').length || 0,
  };

  const getChannelIcon = (channel: 'email' | 'sms' | 'whatsapp') => {
    const Icon = CHANNEL_ICONS[channel];
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryBadge = (category: string) => {
    return (
      <Badge variant="outline" className={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}>
        {category.replace('_', ' ')}
      </Badge>
    );
  };

  const SAMPLE_VARIABLES = [
    '{{patientName}}',
    '{{appointmentDate}}',
    '{{appointmentTime}}',
    '{{practiceName}}',
    '{{practicePhone}}',
    '{{ecpName}}',
    '{{lastExamDate}}',
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Communication Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage templates for recalls, appointments, and campaigns
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Templates</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.email}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.whatsapp}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterChannel">Channel</Label>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger id="filterChannel">
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterCategory">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="filterCategory">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="recall">Recall</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Template Library ({filteredTemplates.length})</CardTitle>
          <CardDescription>
            Manage your communication templates across all channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No templates found</p>
              <p className="text-sm mt-2">
                Create your first template to get started
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(template.channel)}
                          <span className="capitalize">{template.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(template.category)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {template.variables.slice(0, 2).map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                          {template.variables.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(template.updatedAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreviewTemplate(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Design a reusable template for your communications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Annual Recall Reminder"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateChannel">Channel *</Label>
                <Select value={formChannel} onValueChange={(v: any) => setFormChannel(v)}>
                  <SelectTrigger id="templateChannel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateCategory">Category *</Label>
              <Select value={formCategory} onValueChange={(v: any) => setFormCategory(v)}>
                <SelectTrigger id="templateCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recall">Recall</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formChannel === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="templateSubject">Email Subject *</Label>
                <Input
                  id="templateSubject"
                  placeholder="e.g., Time for Your Annual Eye Exam"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="templateBody">Message Body *</Label>
              <Textarea
                id="templateBody"
                placeholder="Write your template here. Use {{variableName}} for personalization."
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                {formChannel === 'sms' && `Character count: ${formBody.length}/160`}
                {formChannel === 'whatsapp' && `Character count: ${formBody.length}/1000`}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Available Variables</Label>
              <div className="flex gap-2 flex-wrap">
                {SAMPLE_VARIABLES.map((variable) => (
                  <Badge
                    key={variable}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setFormBody(formBody + ' ' + variable)}
                  >
                    {variable}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click to insert into template
              </p>
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
              onClick={handleCreateTemplate}
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
                  Create Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              {previewTemplate?.name}
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg text-sm">
                <div>
                  <span className="font-medium">Channel:</span>
                  <p className="text-muted-foreground capitalize">{previewTemplate.channel}</p>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <p className="text-muted-foreground capitalize">{previewTemplate.category.replace('_', ' ')}</p>
                </div>
              </div>

              {previewTemplate.subject && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Subject:</span>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                    {previewTemplate.subject}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-sm font-medium">Message Body:</span>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded whitespace-pre-wrap">
                  {previewTemplate.body}
                </p>
              </div>

              {previewTemplate.variables.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Variables Used:</span>
                  <div className="flex gap-2 flex-wrap">
                    {previewTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
