/**
 * Workflow Builder Page
 *
 * Intelligent automation engine for multi-step patient engagement sequences.
 * Enables creation of automated workflows with triggers, delays, and conditional logic
 * to transform manual campaigns into intelligent, self-executing engagement systems.
 *
 * SECURITY: Requires admin, company_admin, or manager roles
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigate } from "wouter";
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
  Workflow,
  Plus,
  Play,
  Pause,
  Shield,
  GitBranch,
  Clock,
  Zap,
  Mail,
  Bell,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface WorkflowStep {
  id: string;
  type: 'send_message' | 'wait' | 'check_condition' | 'send_campaign';
  templateId?: string;
  delay?: number;
  condition?: string;
}

interface AutomatedWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger: 'recall_due' | 'appointment_scheduled' | 'exam_completed' | 'manual';
  status: 'active' | 'paused' | 'draft';
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  executionCount: number;
  successRate: number;
}

const TRIGGER_LABELS = {
  recall_due: 'Patient Due for Recall',
  appointment_scheduled: 'Appointment Scheduled',
  exam_completed: 'Examination Completed',
  manual: 'Manual Trigger',
};

const TRIGGER_ICONS = {
  recall_due: Bell,
  appointment_scheduled: Calendar,
  exam_completed: Zap,
  manual: Play,
};

export default function WorkflowBuilderPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomatedWorkflow | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTrigger, setFormTrigger] = useState<string>("recall_due");

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
              You do not have permission to manage automated workflows.
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

  // Fetch workflows
  const { data: workflowsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/communications/workflows'],
    queryFn: async () => {
      const res = await fetch('/api/communications/workflows', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch workflows');
      const data = await res.json();
      return {
        workflows: data.workflows as AutomatedWorkflow[],
      };
    },
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
  });

  // Create workflow mutation
  const createMutation = useMutation({
    mutationFn: async (workflowData: any) => {
      const res = await fetch('/api/communications/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(workflowData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create workflow');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow Created",
        description: "Your automated workflow has been created successfully.",
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

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormTrigger("recall_due");
  };

  const handleCreateWorkflow = () => {
    if (!formName || !formTrigger) {
      toast({
        title: "Validation Error",
        description: "Please provide workflow name and trigger.",
        variant: "destructive",
      });
      return;
    }

    // Create default 3-step workflow
    const defaultSteps: WorkflowStep[] = [
      {
        id: '1',
        type: 'send_message',
        templateId: templatesData?.[0]?.id,
      },
      {
        id: '2',
        type: 'wait',
        delay: 7, // 7 days
      },
      {
        id: '3',
        type: 'send_message',
        templateId: templatesData?.[0]?.id,
      },
    ];

    createMutation.mutate({
      name: formName,
      description: formDescription,
      trigger: formTrigger,
      steps: defaultSteps,
      status: 'draft',
    });
  };

  const handleViewWorkflow = (workflow: AutomatedWorkflow) => {
    setSelectedWorkflow(workflow);
    setViewDialogOpen(true);
  };

  // Calculate statistics
  const stats = {
    total: workflowsData?.workflows?.length || 0,
    active: workflowsData?.workflows?.filter(w => w.status === 'active').length || 0,
    totalExecutions: workflowsData?.workflows?.reduce((sum, w) => sum + (w.executionCount || 0), 0) || 0,
    avgSuccessRate: workflowsData?.workflows?.length
      ? (workflowsData.workflows.reduce((sum, w) => sum + (w.successRate || 0), 0) / workflowsData.workflows.length).toFixed(1)
      : '0.0',
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTriggerBadge = (trigger: string) => {
    const Icon = TRIGGER_ICONS[trigger as keyof typeof TRIGGER_ICONS];
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{TRIGGER_LABELS[trigger as keyof typeof TRIGGER_LABELS]}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="h-8 w-8" />
            Workflow Automation
          </h1>
          <p className="text-muted-foreground mt-1">
            Create intelligent multi-step patient engagement sequences
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Automated sequences</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">Workflow instances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Workflows ({workflowsData?.workflows?.length || 0})</CardTitle>
          <CardDescription>
            Manage your patient engagement automation sequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !workflowsData?.workflows || workflowsData.workflows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Workflow className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No workflows found</p>
              <p className="text-sm mt-2">
                Create your first automated workflow to get started
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Executions</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflowsData.workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          {workflow.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {workflow.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTriggerBadge(workflow.trigger)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{workflow.steps.length} steps</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{workflow.executionCount.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{workflow.successRate.toFixed(1)}%</div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewWorkflow(workflow)}
                        >
                          View
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

      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Automated Workflow</DialogTitle>
            <DialogDescription>
              Set up a multi-step patient engagement sequence
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflowName">Workflow Name *</Label>
              <Input
                id="workflowName"
                placeholder="e.g., Recall Follow-up Sequence"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflowDescription">Description</Label>
              <Textarea
                id="workflowDescription"
                placeholder="Brief description of this workflow..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggerSelect">Trigger Event *</Label>
              <Select value={formTrigger} onValueChange={setFormTrigger}>
                <SelectTrigger id="triggerSelect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recall_due">Patient Due for Recall</SelectItem>
                  <SelectItem value="appointment_scheduled">Appointment Scheduled</SelectItem>
                  <SelectItem value="exam_completed">Examination Completed</SelectItem>
                  <SelectItem value="manual">Manual Trigger</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When should this workflow start?
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Default Workflow Steps</div>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>1. Send initial message (using template)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>2. Wait 7 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>3. Send reminder message</span>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-3">
                You can customize steps after creating the workflow
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
              onClick={handleCreateWorkflow}
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
                  Create Workflow
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Workflow Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Workflow Details</DialogTitle>
            <DialogDescription>
              {selectedWorkflow?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedWorkflow && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <span className="text-sm font-medium">Trigger:</span>
                  <div className="mt-1">{getTriggerBadge(selectedWorkflow.trigger)}</div>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedWorkflow.status)}</div>
                </div>
                <div>
                  <span className="text-sm font-medium">Executions:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedWorkflow.executionCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Success Rate:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedWorkflow.successRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Workflow Steps:</span>
                <div className="space-y-2">
                  {selectedWorkflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        {step.type === 'send_message' && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Send Message</span>
                          </div>
                        )}
                        {step.type === 'wait' && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium">Wait {step.delay} days</span>
                          </div>
                        )}
                        {step.type === 'send_campaign' && (
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium">Send Campaign</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
