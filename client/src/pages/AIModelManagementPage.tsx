/**
 * AI Model Management Dashboard
 * 
 * Platform admin interface for managing master AI models, training, and deployments
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { 
  Brain, 
  Upload, 
  Zap, 
  Database, 
  Rocket, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  Package,
  FileText,
  Play,
  Pause,
  RefreshCw,
  Download,
  Eye,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";

interface ModelVersion {
  id: string;
  versionNumber: string;
  description: string;
  modelName: string;
  status: 'draft' | 'training' | 'testing' | 'approved' | 'deprecated';
  createdAt: string;
  approvedAt?: string;
  trainingDataCount?: number;
  deploymentCount?: number;
}

interface TrainingDataset {
  id: string;
  category: string;
  title: string;
  content: string;
  contentType: string;
  source?: string;
  qualityScore?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  tags?: string[];
}

interface TrainingJob {
  id: string;
  modelVersionId: string;
  jobType: 'initial_training' | 'incremental' | 'retraining' | 'evaluation';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  metrics?: {
    accuracy?: number;
    loss?: number;
    epochs?: number;
  };
}

interface Deployment {
  id: string;
  companyId: string;
  companyName?: string;
  modelVersionId: string;
  versionNumber: string;
  deploymentStatus: 'pending' | 'active' | 'rolled_back' | 'failed';
  deployedAt?: string;
}

interface CompanyStats {
  totalCompanies: number;
  aiEnabledCompanies: number;
  byModelVersion: Record<string, number>;
  averageLearningProgress: number;
}

export default function AIModelManagementPage() {
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [createVersionOpen, setCreateVersionOpen] = useState(false);
  const [createDatasetOpen, setCreateDatasetOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);

  // Fetch model versions
  const { data: versions = [], isLoading: versionsLoading } = useQuery<ModelVersion[]>({
    queryKey: ['/api/master-ai/versions'],
    queryFn: async () => {
      const res = await fetch('/api/master-ai/versions');
      if (!res.ok) throw new Error('Failed to fetch versions');
      const data = await res.json();
      return data.versions || [];
    },
  });

  // Fetch training jobs
  const { data: trainingJobs = [] } = useQuery<TrainingJob[]>({
    queryKey: ['/api/master-ai/training-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/master-ai/training-jobs');
      if (!res.ok) throw new Error('Failed to fetch training jobs');
      const data = await res.json();
      return data.jobs || [];
    },
  });

  // Fetch training datasets
  const { data: datasets = [] } = useQuery<TrainingDataset[]>({
    queryKey: ['/api/master-ai/training-data'],
    queryFn: async () => {
      const res = await fetch('/api/master-ai/training-data');
      if (!res.ok) throw new Error('Failed to fetch training data');
      const data = await res.json();
      return data.datasets || [];
    },
  });

  // Fetch deployments
  const { data: deployments = [] } = useQuery<Deployment[]>({
    queryKey: ['/api/master-ai/deployments'],
    queryFn: async () => {
      const res = await fetch('/api/master-ai/deployments');
      if (!res.ok) throw new Error('Failed to fetch deployments');
      const data = await res.json();
      return data.deployments || [];
    },
  });

  // Fetch company stats
  const { data: companyStats } = useQuery<CompanyStats>({
    queryKey: ['/api/master-ai/company-stats'],
    queryFn: async () => {
      const res = await fetch('/api/master-ai/company-stats');
      if (!res.ok) throw new Error('Failed to fetch company stats');
      const data = await res.json();
      return data.stats;
    },
  });

  // Create model version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: { versionNumber: string; description: string; modelName: string }) => {
      const res = await fetch('/api/master-ai/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create version');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-ai/versions'] });
      setCreateVersionOpen(false);
      toast({ title: "Success", description: "Model version created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Approve version mutation
  const approveVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetch(`/api/master-ai/versions/${versionId}/approve`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('Failed to approve version');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-ai/versions'] });
      toast({ title: "Success", description: "Model version approved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create training job mutation
  const createTrainingJobMutation = useMutation({
    mutationFn: async (data: { modelVersionId: string; jobType: string }) => {
      const res = await fetch('/api/master-ai/training-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create training job');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-ai/training-jobs'] });
      toast({ title: "Success", description: "Training job queued" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create training dataset mutation
  const createDatasetMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/master-ai/training-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create training data');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-ai/training-data'] });
      setCreateDatasetOpen(false);
      toast({ title: "Success", description: "Training dataset created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Deploy model mutation
  const deployModelMutation = useMutation({
    mutationFn: async (data: { modelVersionId: string; deploymentType: string; companyIds?: string[] }) => {
      const res = await fetch('/api/master-ai/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to deploy model');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-ai/deployments'] });
      setDeployDialogOpen(false);
      toast({ title: "Success", description: "Model deployment initiated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      draft: { variant: "secondary", icon: FileText },
      training: { variant: "default", icon: Zap },
      testing: { variant: "default", icon: Activity },
      approved: { variant: "default", icon: CheckCircle2 },
      deprecated: { variant: "secondary", icon: XCircle },
      queued: { variant: "secondary", icon: Clock },
      running: { variant: "default", icon: RefreshCw },
      completed: { variant: "default", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: AlertCircle },
      pending: { variant: "secondary", icon: Clock },
      active: { variant: "default", icon: CheckCircle2 },
      rolled_back: { variant: "secondary", icon: RefreshCw },
    };
    const config = variants[status] || { variant: "default", icon: FileText };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (versionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Model Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage master AI models, training, and deployments across all companies
          </p>
        </div>
        <Dialog open={createVersionOpen} onOpenChange={setCreateVersionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Model Version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Model Version</DialogTitle>
              <DialogDescription>Define a new AI model version for training and deployment</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createVersionMutation.mutate({
                versionNumber: formData.get('versionNumber') as string,
                description: formData.get('description') as string,
                modelName: formData.get('modelName') as string,
              });
            }}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="versionNumber">Version Number</Label>
                  <Input id="versionNumber" name="versionNumber" placeholder="e.g., v2.5.0" required />
                </div>
                <div>
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input id="modelName" name="modelName" defaultValue="ils-master-ai" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="What's new in this version?" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createVersionMutation.isPending}>
                  {createVersionMutation.isPending ? "Creating..." : "Create Version"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Model Versions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{versions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {versions.filter(v => v.status === 'approved').length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              AI-Enabled Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats?.aiEnabledCompanies || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {companyStats?.totalCompanies || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              Training Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingJobs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {trainingJobs.filter(j => j.status === 'running').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              Training Datasets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {datasets.filter(d => d.status === 'approved').length} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="versions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="versions">Model Versions</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Model Versions Tab */}
        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Versions</CardTitle>
              <CardDescription>Manage AI model versions and their lifecycle</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Model Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Training Data</TableHead>
                    <TableHead>Deployments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No model versions yet</p>
                        <p className="text-sm">Create your first model version to get started</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">{version.versionNumber}</TableCell>
                        <TableCell>{version.modelName}</TableCell>
                        <TableCell>{getStatusBadge(version.status)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{version.trainingDataCount || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{version.deploymentCount || 0}</Badge>
                        </TableCell>
                        <TableCell>{new Date(version.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {version.status === 'draft' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    createTrainingJobMutation.mutate({
                                      modelVersionId: version.id,
                                      jobType: 'initial_training',
                                    });
                                  }}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Train
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => approveVersionMutation.mutate(version.id)}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                              </>
                            )}
                            {version.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedVersion(version.id);
                                  setDeployDialogOpen(true);
                                }}
                              >
                                <Rocket className="h-3 w-3 mr-1" />
                                Deploy
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Jobs Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Jobs</CardTitle>
              <CardDescription>Monitor AI model training progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Metrics</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No training jobs yet</p>
                        <p className="text-sm">Start training a model version to see jobs here</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    trainingJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">{job.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.jobType}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          {job.progress !== undefined ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all" 
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-xs">{job.progress}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {job.metrics ? (
                            <div className="text-xs space-y-1">
                              {job.metrics.accuracy && (
                                <div>Accuracy: {(job.metrics.accuracy * 100).toFixed(1)}%</div>
                              )}
                              {job.metrics.loss && (
                                <div>Loss: {job.metrics.loss.toFixed(4)}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Datasets Tab */}
        <TabsContent value="datasets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Training Datasets</CardTitle>
                <CardDescription>Manage training data for AI models</CardDescription>
              </div>
              <Dialog open={createDatasetOpen} onOpenChange={setCreateDatasetOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Training Dataset</DialogTitle>
                    <DialogDescription>Add new training data to improve AI models</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean);
                    createDatasetMutation.mutate({
                      category: formData.get('category'),
                      title: formData.get('title'),
                      content: formData.get('content'),
                      contentType: formData.get('contentType'),
                      source: formData.get('source'),
                      tags,
                    });
                  }}>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select name="category" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="optical">Optical Knowledge</SelectItem>
                              <SelectItem value="clinical">Clinical Guidelines</SelectItem>
                              <SelectItem value="product">Product Information</SelectItem>
                              <SelectItem value="customer_service">Customer Service</SelectItem>
                              <SelectItem value="technical">Technical Support</SelectItem>
                              <SelectItem value="business">Business Insights</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="contentType">Content Type</Label>
                          <Select name="contentType" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="qa_pair">Q&A Pair</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="conversation">Conversation</SelectItem>
                              <SelectItem value="guide">Guide</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" placeholder="Brief description" required />
                      </div>
                      <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea 
                          id="content" 
                          name="content" 
                          placeholder="Training data content..." 
                          rows={6}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="source">Source (Optional)</Label>
                        <Input id="source" name="source" placeholder="e.g., Manual v2.1, Expert Review" />
                      </div>
                      <div>
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input id="tags" name="tags" placeholder="prescription, lens, coating" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createDatasetMutation.isPending}>
                        {createDatasetMutation.isPending ? "Uploading..." : "Upload Dataset"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No training datasets yet</p>
                        <p className="text-sm">Upload training data to improve AI models</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    datasets.slice(0, 20).map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell className="font-medium max-w-xs truncate">{dataset.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{dataset.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{dataset.contentType}</TableCell>
                        <TableCell>{getStatusBadge(dataset.status)}</TableCell>
                        <TableCell>
                          {dataset.qualityScore !== undefined ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden max-w-[60px]">
                                <div 
                                  className="h-full bg-green-500 transition-all" 
                                  style={{ width: `${dataset.qualityScore * 100}%` }}
                                />
                              </div>
                              <span className="text-xs">{(dataset.qualityScore * 100).toFixed(0)}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(dataset.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {datasets.length > 20 && (
                <div className="text-center py-4">
                  <Button variant="outline" size="sm">
                    View All {datasets.length} Datasets
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployments Tab */}
        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Deployments</CardTitle>
              <CardDescription>Track model deployments across companies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deployed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        <Rocket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No deployments yet</p>
                        <p className="text-sm">Deploy approved models to companies</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    deployments.slice(0, 20).map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell className="font-medium">{deployment.companyName || deployment.companyId}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{deployment.versionNumber}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(deployment.deploymentStatus)}</TableCell>
                        <TableCell>
                          {deployment.deployedAt ? new Date(deployment.deployedAt).toLocaleString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Version Distribution</CardTitle>
                <CardDescription>Companies by deployed model version</CardDescription>
              </CardHeader>
              <CardContent>
                {companyStats?.byModelVersion && Object.keys(companyStats.byModelVersion).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(companyStats.byModelVersion).map(([version, count]) => (
                      <div key={version} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge>{version}</Badge>
                          <span className="text-sm text-muted-foreground">{count} companies</span>
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${(count / (companyStats.totalCompanies || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium">
                          {((count / (companyStats.totalCompanies || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No deployment data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Learning Progress</CardTitle>
                <CardDescription>AI learning progress across all companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-4 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all" 
                        style={{ width: `${(companyStats?.averageLearningProgress || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {((companyStats?.averageLearningProgress || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Deploy Model Dialog */}
      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Model</DialogTitle>
            <DialogDescription>Deploy this model version to companies</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            deployModelMutation.mutate({
              modelVersionId: selectedVersion!,
              deploymentType: formData.get('deploymentType') as string,
            });
          }}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="deploymentType">Deployment Type</Label>
                <Select name="deploymentType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select deployment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (All Companies)</SelectItem>
                    <SelectItem value="gradual_rollout">Gradual Rollout</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Important</p>
                    <p className="mt-1">
                      Deploying a model will update AI assistants for all AI-enabled companies.
                      Ensure the model has been thoroughly tested.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={deployModelMutation.isPending}>
                {deployModelMutation.isPending ? "Deploying..." : "Deploy Model"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
