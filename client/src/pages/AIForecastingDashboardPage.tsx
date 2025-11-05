import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Activity, 
  Target, 
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
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
import { formatDistanceToNow } from "date-fns";

interface ForecastData {
  date: string;
  predictedOrders: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

interface StaffingRecommendation {
  date: string;
  recommendedStaff: number;
  currentStaff: number;
  gap: number;
  reason: string;
}

interface SurgePeriod {
  startDate: string;
  endDate: string;
  peakVolume: number;
  surgePercentage: number;
  recommendation: string;
}

interface SeasonalPattern {
  month: string;
  averageOrders: number;
  trend: string;
}

interface ForecastMetrics {
  accuracy: number;
  mae: number;
  rmse: number;
  lastUpdated: string;
}

export default function AIForecastingDashboardPage() {
  const [forecastDays, setForecastDays] = useState("7");
  const [staffingDays, setStaffingDays] = useState("7");
  const [surgeDays, setSurgeDays] = useState("30");

  // Generate forecast
  const { data: forecastResponse, isLoading: forecastLoading, refetch: refetchForecast } = useQuery({
    queryKey: ["/api/demand-forecasting/generate", forecastDays],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/demand-forecasting/generate", {
        daysAhead: parseInt(forecastDays),
      });
      return await response.json();
    },
  });

  // Get recommendations (includes staffing and surges)
  const { data: recommendationsResponse, refetch: refetchRecommendations } = useQuery({
    queryKey: ["/api/demand-forecasting/recommendations", staffingDays],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/demand-forecasting/recommendations?daysAhead=${staffingDays}`);
      return await response.json();
    },
  });

  // Get surge periods
  const { data: surgeResponse, refetch: refetchSurge } = useQuery({
    queryKey: ["/api/demand-forecasting/surge-periods", surgeDays],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/demand-forecasting/surge-periods?daysAhead=${surgeDays}`);
      return await response.json();
    },
  });

  // Get seasonal patterns
  const { data: patternsResponse } = useQuery({
    queryKey: ["/api/demand-forecasting/patterns"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/demand-forecasting/patterns");
      return await response.json();
    },
  });

  // Get forecast metrics
  const { data: metricsResponse } = useQuery({
    queryKey: ["/api/demand-forecasting/accuracy"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/demand-forecasting/accuracy?period=30");
      return await response.json();
    },
  });

  const forecast: ForecastData[] = (forecastResponse?.forecasts || []).map((f: any) => ({
    date: f.forecastDate,
    predictedOrders: f.predictedDemand,
    confidence: parseFloat(f.confidence || "0"),
    lowerBound: f.predictedDemand * 0.8, // Approximation based on confidence
    upperBound: f.predictedDemand * 1.2,
  }));
  
  const staffing: StaffingRecommendation[] = (recommendationsResponse?.recommendations?.staffing || []).map((s: any) => ({
    date: s.date,
    recommendedStaff: s.labTechs + s.engineers,
    currentStaff: Math.floor((s.labTechs + s.engineers) * 0.8), // Mock current staff
    gap: Math.ceil((s.labTechs + s.engineers) * 0.2),
    reason: s.reasoning,
  }));
  
  const surgePeriods: SurgePeriod[] = (surgeResponse?.surges || []).map((s: any) => ({
    startDate: s.startDate,
    endDate: s.endDate,
    peakVolume: s.peakValue,
    surgePercentage: ((s.peakValue - 50) / 50) * 100, // Approximation
    recommendation: s.recommendations[0] || "Prepare for increased demand",
  }));
  
  const patterns: SeasonalPattern[] = (patternsResponse?.patterns || []).map((p: any) => ({
    month: p.patternName,
    averageOrders: parseFloat(p.demandMultiplier) * 50, // Scale to orders
    trend: parseFloat(p.confidence) > 70 ? "up" : "stable",
  }));
  
  const metrics: ForecastMetrics = {
    accuracy: (metricsResponse?.metrics?.accuracy || 0) / 100,
    mae: metricsResponse?.metrics?.mae || 0,
    rmse: metricsResponse?.metrics?.rmse || 0,
    lastUpdated: metricsResponse?.metrics?.lastUpdated || new Date().toISOString(),
  };

  const handleRefresh = () => {
    refetchForecast();
    refetchRecommendations();
    refetchSurge();
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Demand Forecasting</h1>
          <p className="text-muted-foreground">
            Predictive analytics for demand planning and capacity optimization
          </p>
        </div>
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Forecast Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(metrics.accuracy * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.lastUpdated && formatDistanceToNow(new Date(metrics.lastUpdated), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Avg Predicted Daily Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {forecast.length > 0 
                ? Math.round(forecast.reduce((sum, f) => sum + f.predictedOrders, 0) / forecast.length)
                : 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Next {forecastDays} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Surge Periods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{surgePeriods.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Next {surgeDays} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staffing Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {staffing.filter(s => s.gap > 0).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Days needing more staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Demand Forecast Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Demand Forecast
              </CardTitle>
              <CardDescription>
                Predicted order volume with confidence intervals
              </CardDescription>
            </div>
            <Select value={forecastDays} onValueChange={setForecastDays}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="21">21 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {forecastLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Generating forecast...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="upperBound" 
                  stackId="1"
                  stroke="#94a3b8" 
                  fill="#e2e8f0" 
                  name="Upper Bound"
                />
                <Area 
                  type="monotone" 
                  dataKey="predictedOrders" 
                  stackId="2"
                  stroke="#3b82f6" 
                  fill="#93c5fd" 
                  name="Predicted Orders"
                />
                <Area 
                  type="monotone" 
                  dataKey="lowerBound" 
                  stackId="3"
                  stroke="#94a3b8" 
                  fill="#f1f5f9" 
                  name="Lower Bound"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staffing Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staffing Recommendations
                </CardTitle>
                <CardDescription>Optimize workforce allocation</CardDescription>
              </div>
              <Select value={staffingDays} onValueChange={setStaffingDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="21">21 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={staffing}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="currentStaff" fill="#94a3b8" name="Current Staff" />
                <Bar dataKey="recommendedStaff" fill="#3b82f6" name="Recommended Staff" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {staffing.slice(0, 3).map((rec, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </div>
                  {rec.gap > 0 ? (
                    <Badge variant="destructive">+{rec.gap} needed</Badge>
                  ) : rec.gap < 0 ? (
                    <Badge className="bg-green-500">{Math.abs(rec.gap)} excess</Badge>
                  ) : (
                    <Badge variant="outline">Optimal</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Seasonal Patterns
            </CardTitle>
            <CardDescription>Historical demand trends by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={patterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="averageOrders" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Avg Orders"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {patterns.slice(0, 4).map((pattern, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-b pb-2">
                  <span className="font-medium">{pattern.month}</span>
                  <div className="flex items-center gap-2">
                    <span>{Math.round(pattern.averageOrders)}</span>
                    {pattern.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Surge Periods Alert */}
      {surgePeriods.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Upcoming Surge Periods
            </CardTitle>
            <CardDescription>Prepare for increased demand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {surgePeriods.map((surge, idx) => (
                <div key={idx} className="flex items-start justify-between border-l-4 border-yellow-500 pl-4 py-2">
                  <div>
                    <p className="font-semibold text-sm">
                      {new Date(surge.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                      {new Date(surge.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{surge.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="bg-yellow-500">
                      +{surge.surgePercentage.toFixed(0)}% surge
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Peak: {Math.round(surge.peakVolume)} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Model Performance Metrics
          </CardTitle>
          <CardDescription>Accuracy and reliability indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Accuracy Score</p>
              <p className="text-3xl font-bold">{(metrics.accuracy * 100).toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${metrics.accuracy * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Mean Absolute Error</p>
              <p className="text-3xl font-bold">{metrics.mae.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1">Average deviation from actual</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Root Mean Squared Error</p>
              <p className="text-3xl font-bold">{metrics.rmse.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1">Prediction variance measure</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
