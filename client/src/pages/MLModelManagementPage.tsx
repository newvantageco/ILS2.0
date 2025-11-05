import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  XCircle,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Download,
  Upload,
  Zap,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MLModel {
  id: string;
  name: string;
  type: string;
  version: string;
  status: 'training' | 'active' | 'inactive' | 'failed';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataSize: number;
  lastTrained: string;
  deployedAt?: string;
  description: string;
}

interface ModelMetrics {
  accuracy: number[];
  loss: number[];
  epochs: number[];
}

export default function MLModelManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);

  // Fetch ML models
  const { data: models, isLoading } = useQuery<MLModel[]>({
    queryKey: ['/api/ml/models'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Deploy model mutation
  const deployModel = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await fetch(`/api/ml/models/${modelId}/deploy`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to deploy model');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ml/models'] });
      toast({
        title: "Model Deployed",
        description: "Model has been successfully deployed to production",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Stop model mutation
  const stopModel = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await fetch(`/api/ml/models/${modelId}/stop`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to stop model');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ml/models'] });
      toast({
        title: "Model Stopped",
        description: "Model has been deactivated",
      });
    },
  });

  // Retrain model mutation
  const retrainModel = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await fetch(`/api/ml/models/${modelId}/retrain`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to retrain model');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ml/models'] });
      toast({
        title: "Training Started",
        description: "Model retraining has been initiated",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      active: { variant: "default", icon: CheckCircle2 },
      training: { variant: "secondary", icon: RefreshCw },
      inactive: { variant: "outline", icon: PauseCircle },
      failed: { variant: "destructive", icon: XCircle },
    };
    const config = variants[status] || variants.inactive;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const sampleMetrics: ModelMetrics = {
    accuracy: [0.65, 0.72, 0.78, 0.82, 0.86, 0.89, 0.91, 0.92, 0.93, 0.94],
    loss: [0.85, 0.72, 0.58, 0.45, 0.35, 0.28, 0.22, 0.18, 0.15, 0.12],
    epochs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  };

  const trainingData = sampleMetrics.epochs.map((epoch, i) => ({
    epoch,
    accuracy: sampleMetrics.accuracy[i] * 100,
    loss: sampleMetrics.loss[i],
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ML Model Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage machine learning models, monitor performance, and deploy updates
          </p>
        </div>
        <Dialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Train New Model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Train New Model</DialogTitle>
              <DialogDescription>
                Configure and start training a new machine learning model
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="model-name">Model Name</Label>
                <Input id="model-name" placeholder="Enter model name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model-type">Model Type</Label>
                <select id="model-type" className="w-full p-2 border rounded-md">
                  <option>Quality Control Predictor</option>
                  <option>Demand Forecasting</option>
                  <option>Anomaly Detection</option>
                  <option>Custom Model</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="training-data">Training Data Size</Label>
                <Input id="training-data" type="number" placeholder="1000" />
              </div>
              <Button className="w-full">Start Training</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models?.filter(m => m.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models && models.length > 0 
                ? `${(models.reduce((acc, m) => acc + m.accuracy, 0) / models.length * 100).toFixed(1)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models?.filter(m => m.status === 'training').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Models in training
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4M</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="training">Training History</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Registry</CardTitle>
              <CardDescription>
                All machine learning models and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading models...</div>
              ) : models && models.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Last Trained</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">{model.name}</TableCell>
                        <TableCell>{model.type}</TableCell>
                        <TableCell>{model.version}</TableCell>
                        <TableCell>{getStatusBadge(model.status)}</TableCell>
                        <TableCell>{(model.accuracy * 100).toFixed(1)}%</TableCell>
                        <TableCell>{new Date(model.lastTrained).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {model.status === 'inactive' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deployModel.mutate(model.id)}
                              >
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {model.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => stopModel.mutate(model.id)}
                              >
                                <PauseCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retrainModel.mutate(model.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No models found. Train your first model to get started.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
              <CardDescription>
                Real-time performance metrics for active models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-medium mb-4">Training Progress</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trainingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
                      <YAxis yAxisId="left" label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Loss', angle: 90, position: 'insideRight' }} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy" />
                      <Line yAxisId="right" type="monotone" dataKey="loss" stroke="#82ca9d" name="Loss" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {models && models.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-4">Model Comparison</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={models.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={(m) => m.accuracy * 100} fill="#8884d8" name="Accuracy %" />
                        <Bar dataKey={(m) => m.precision * 100} fill="#82ca9d" name="Precision %" />
                        <Bar dataKey={(m) => m.recall * 100} fill="#ffc658" name="Recall %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training History</CardTitle>
              <CardDescription>
                Historical training runs and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Training history will be populated as models are trained and retrained.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
