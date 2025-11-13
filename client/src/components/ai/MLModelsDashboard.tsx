/**
 * ML Models Dashboard Component
 *
 * Real-time dashboard showing performance metrics for all deployed ML models
 * including Holt-Winters forecasting, Z-Score anomaly detection, and Linear Regression
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Activity,
  Zap,
  CheckCircle2,
  XCircle,
  BarChart3,
  LineChart,
  Target,
  Clock,
  Cpu,
  Database,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface ModelMetrics {
  mape?: number;
  rmse?: number;
  mae?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  r2?: number;
}

interface ModelVersion {
  id: string;
  modelName: string;
  modelType: string;
  algorithm: string;
  version: string;
  status: string;
  metrics: ModelMetrics;
  hyperparameters: Record<string, any>;
  createdAt: string;
}

interface ModelDeployment {
  id: string;
  modelVersionId: string;
  environment: string;
  status: string;
  endpoint: string;
  deployedAt: string;
  config: Record<string, any>;
}

interface PredictionStats {
  modelId: string;
  modelName: string;
  totalPredictions: number;
  avgResponseTime: number;
  successRate: number;
  lastPrediction?: string;
}

export function MLModelsDashboard() {
  const [activeModel, setActiveModel] = useState<string | null>(null);

  // Fetch all models
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/ai-ml/models'],
    queryFn: async () => {
      const res = await fetch('/api/ai-ml/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch deployments
  const { data: deploymentsData, isLoading: deploymentsLoading } = useQuery({
    queryKey: ['/api/ai-ml/deployments'],
    queryFn: async () => {
      const res = await fetch('/api/ai-ml/deployments');
      if (!res.ok) throw new Error('Failed to fetch deployments');
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Fetch prediction stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/ai-ml/prediction-stats'],
    queryFn: async () => {
      const res = await fetch('/api/ai-ml/prediction-stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time stats
  });

  const models: ModelVersion[] = modelsData?.models || [];
  const deployments: ModelDeployment[] = deploymentsData?.deployments || [];
  const predictionStats: PredictionStats[] = statsData?.stats || [];

  // Calculate overall system health
  const activeModels = models.filter(m => m.status === 'active').length;
  const activeDeployments = deployments.filter(d => d.status === 'active').length;
  const avgAccuracy = models.length > 0
    ? models.reduce((sum, m) => sum + (m.metrics.accuracy || 0), 0) / models.length
    : 0;
  const totalPredictions = predictionStats.reduce((sum, s) => sum + s.totalPredictions, 0);

  // Prepare data for performance chart
  const performanceData = models.map(model => ({
    name: model.modelName,
    accuracy: model.metrics.accuracy || 0,
    mape: model.metrics.mape || 0,
    precision: model.metrics.precision ? model.metrics.precision * 100 : 0,
  }));

  // Prepare response time data
  const responseTimeData = predictionStats.map(stat => ({
    name: stat.modelName,
    avgResponseTime: stat.avgResponseTime,
    successRate: stat.successRate * 100,
  }));

  if (modelsLoading || deploymentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading ML models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeModels}</div>
            <p className="text-xs text-muted-foreground">
              {models.length} total models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeployments}</div>
            <p className="text-xs text-muted-foreground">
              Production ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAccuracy.toFixed(1)}%</div>
            <Progress value={avgAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance Metrics</CardTitle>
          <CardDescription>
            Accuracy, MAPE, and Precision across all deployed models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy %" />
              <Bar dataKey="mape" fill="#82ca9d" name="MAPE %" />
              <Bar dataKey="precision" fill="#ffc658" name="Precision %" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Response Time & Success Rate */}
      {responseTimeData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
              <CardDescription>Average prediction response time (ms)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Response Time (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success Rate</CardTitle>
              <CardDescription>Prediction success rate by model</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="successRate" fill="#82ca9d" name="Success Rate %" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Models List */}
      <Card>
        <CardHeader>
          <CardTitle>Deployed Models</CardTitle>
          <CardDescription>All active ML models and their configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Models</TabsTrigger>
              <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
              <TabsTrigger value="anomaly">Anomaly Detection</TabsTrigger>
              <TabsTrigger value="regression">Regression</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {models.map((model) => (
                <Card key={model.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {model.modelType === 'time_series_forecasting' && (
                          <TrendingUp className="h-5 w-5 text-blue-500" />
                        )}
                        {model.modelType === 'anomaly_detection' && (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        )}
                        {model.modelType === 'regression' && (
                          <LineChart className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{model.modelName}</CardTitle>
                          <CardDescription className="text-sm">
                            {model.algorithm.replace(/_/g, ' ').toUpperCase()} • v{model.version}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                        {model.status === 'active' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {model.status === 'deprecated' && <XCircle className="h-3 w-3 mr-1" />}
                        {model.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {model.metrics.accuracy && (
                        <div>
                          <p className="text-sm text-muted-foreground">Accuracy</p>
                          <p className="text-2xl font-bold">{model.metrics.accuracy.toFixed(1)}%</p>
                        </div>
                      )}
                      {model.metrics.mape && (
                        <div>
                          <p className="text-sm text-muted-foreground">MAPE</p>
                          <p className="text-2xl font-bold">{model.metrics.mape.toFixed(1)}%</p>
                        </div>
                      )}
                      {model.metrics.rmse && (
                        <div>
                          <p className="text-sm text-muted-foreground">RMSE</p>
                          <p className="text-2xl font-bold">{model.metrics.rmse.toFixed(2)}</p>
                        </div>
                      )}
                      {model.metrics.precision && (
                        <div>
                          <p className="text-sm text-muted-foreground">Precision</p>
                          <p className="text-2xl font-bold">{(model.metrics.precision * 100).toFixed(1)}%</p>
                        </div>
                      )}
                      {model.metrics.recall && (
                        <div>
                          <p className="text-sm text-muted-foreground">Recall</p>
                          <p className="text-2xl font-bold">{(model.metrics.recall * 100).toFixed(1)}%</p>
                        </div>
                      )}
                      {model.metrics.f1Score && (
                        <div>
                          <p className="text-sm text-muted-foreground">F1 Score</p>
                          <p className="text-2xl font-bold">{(model.metrics.f1Score * 100).toFixed(1)}%</p>
                        </div>
                      )}
                      {model.metrics.r2 && (
                        <div>
                          <p className="text-sm text-muted-foreground">R²</p>
                          <p className="text-2xl font-bold">{model.metrics.r2.toFixed(3)}</p>
                        </div>
                      )}
                    </div>

                    {/* Hyperparameters */}
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-2">Hyperparameters</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(model.hyperparameters).map(([key, value]) => (
                          <Badge key={key} variant="outline">
                            {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Deployment Info */}
                    {deployments
                      .filter(d => d.modelVersionId === model.id)
                      .map(deployment => (
                        <div key={deployment.id} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <Zap className="h-4 w-4" />
                          Deployed to <Badge variant="secondary">{deployment.environment}</Badge>
                          at {deployment.endpoint}
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}

              {models.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No models deployed yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="forecasting">
              {/* Filter for forecasting models */}
              {models.filter(m => m.modelType === 'time_series_forecasting').length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No forecasting models</p>
              ) : (
                <div className="space-y-4">
                  {/* Same card structure as above, filtered */}
                </div>
              )}
            </TabsContent>

            <TabsContent value="anomaly">
              {/* Filter for anomaly detection models */}
              {models.filter(m => m.modelType === 'anomaly_detection').length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No anomaly detection models</p>
              ) : (
                <div className="space-y-4">
                  {/* Same card structure as above, filtered */}
                </div>
              )}
            </TabsContent>

            <TabsContent value="regression">
              {/* Filter for regression models */}
              {models.filter(m => m.modelType === 'regression').length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No regression models</p>
              ) : (
                <div className="space-y-4">
                  {/* Same card structure as above, filtered */}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
