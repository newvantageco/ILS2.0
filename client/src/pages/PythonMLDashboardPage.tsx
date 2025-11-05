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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Code,
  Activity,
  TrendingUp,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface PythonServiceStatus {
  status: 'online' | 'offline';
  version: string;
  uptime: number;
  models_loaded: number;
  last_prediction: string;
}

interface MLPrediction {
  id: string;
  model: string;
  input: any;
  prediction: any;
  confidence: number;
  timestamp: string;
  execution_time: number;
}

interface AnalyticsJob {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  started_at: string;
  completed_at?: string;
  result?: any;
}

export default function PythonMLDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // Fetch Python service status
  const { data: serviceStatus, isLoading: statusLoading } = useQuery<PythonServiceStatus>({
    queryKey: ['/api/python/health'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch recent predictions
  const { data: predictions } = useQuery<MLPrediction[]>({
    queryKey: ['/api/python/predictions', selectedTimeRange],
  });

  // Fetch analytics jobs
  const { data: jobs } = useQuery<AnalyticsJob[]>({
    queryKey: ['/api/python/jobs'],
    refetchInterval: 5000,
  });

  // Run analytics job mutation
  const runAnalytics = useMutation({
    mutationFn: async (jobType: string) => {
      const response = await fetch('/api/python/analytics/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ job_type: jobType }),
      });
      if (!response.ok) throw new Error('Failed to start analytics job');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/python/jobs'] });
      toast({
        title: "Analytics Started",
        description: "Python analytics job has been queued",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Start Job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Sample data for charts
  const performanceData = [
    { time: '00:00', predictions: 45, avg_time: 120 },
    { time: '04:00', predictions: 32, avg_time: 115 },
    { time: '08:00', predictions: 78, avg_time: 125 },
    { time: '12:00', predictions: 156, avg_time: 130 },
    { time: '16:00', predictions: 189, avg_time: 128 },
    { time: '20:00', predictions: 134, avg_time: 122 },
  ];

  const modelUsageData = [
    { name: 'QC Predictor', value: 45 },
    { name: 'Demand Forecast', value: 30 },
    { name: 'Anomaly Detection', value: 15 },
    { name: 'Other', value: 10 },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Python ML Service</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage Python-powered machine learning analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={serviceStatus?.status === 'online' ? 'default' : 'destructive'} className="gap-1">
            {serviceStatus?.status === 'online' ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {serviceStatus?.status === 'online' ? 'Online' : 'Offline'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/python/health'] })}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {serviceStatus?.status === 'offline' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Python ML service is offline. Please check the service logs and ensure the Python service is running.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceStatus?.status === 'online' ? 'Running' : 'Stopped'}
            </div>
            <p className="text-xs text-muted-foreground">
              {serviceStatus?.uptime ? `Uptime: ${Math.floor(serviceStatus.uptime / 3600)}h` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Models Loaded</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStatus?.models_loaded || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready for predictions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs?.filter(j => j.status === 'running').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="jobs">Analytics Jobs</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Prediction Volume</CardTitle>
                <CardDescription>Predictions over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="predictions" stroke="#8884d8" name="Predictions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Usage Distribution</CardTitle>
                <CardDescription>Predictions by model type</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modelUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {modelUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Average Response Time</CardTitle>
              <CardDescription>ML prediction latency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="avg_time" fill="#82ca9d" name="Avg Response Time (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Predictions</CardTitle>
                <CardDescription>Latest ML predictions from Python service</CardDescription>
              </div>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {predictions && predictions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Execution Time</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.slice(0, 10).map((pred) => (
                      <TableRow key={pred.id}>
                        <TableCell className="font-medium">{pred.model}</TableCell>
                        <TableCell>
                          <Badge variant={pred.confidence > 0.8 ? 'default' : 'secondary'}>
                            {(pred.confidence * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{pred.execution_time}ms</TableCell>
                        <TableCell>{new Date(pred.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No predictions found for the selected time range.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Analytics Jobs</CardTitle>
                <CardDescription>Python-powered analytics tasks</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => runAnalytics.mutate('qc_analysis')}
                  disabled={runAnalytics.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  QC Analysis
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runAnalytics.mutate('demand_forecast')}
                  disabled={runAnalytics.isPending}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Forecast
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {jobs && jobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              job.status === 'completed'
                                ? 'default'
                                : job.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="text-xs">{job.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(job.started_at).toLocaleString()}</TableCell>
                        <TableCell>
                          {job.completed_at
                            ? `${Math.floor(
                                (new Date(job.completed_at).getTime() -
                                  new Date(job.started_at).getTime()) /
                                  1000
                              )}s`
                            : 'In progress'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No analytics jobs found. Start a new job to see it here.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loaded Python Models</CardTitle>
              <CardDescription>ML models currently available in Python service</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <LineChartIcon className="h-4 w-4" />
                <AlertDescription>
                  {serviceStatus?.models_loaded
                    ? `${serviceStatus.models_loaded} models are currently loaded and ready for predictions.`
                    : 'Connect to Python service to see loaded models.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
