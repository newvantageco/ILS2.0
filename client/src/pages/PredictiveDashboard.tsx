/**
 * Predictive Analytics Dashboard
 * ML-powered insights for proactive decision-making
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Calendar,
  Package,
  DollarSign,
  Sparkles,
  Activity,
  Loader2,
  Info,
} from 'lucide-react';
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
} from 'recharts';

export function PredictiveDashboard() {
  // Fetch dashboard data
  const { data, isLoading, error } = useQuery({
    queryKey: ['predictive-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/predictive-analytics/dashboard', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch predictions');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading predictions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load predictive analytics. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const dashboard = data?.dashboard || {};
  const { noShowPredictions, revenueForecast, inventoryForecast } = dashboard;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Predictive Analytics
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights for proactive decision-making
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="h-3 w-3 mr-1" />
          Live Predictions
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High-Risk No-Shows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{noShowPredictions?.highRisk || 0}</div>
                <p className="text-xs text-muted-foreground">Next 7 days</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total At-Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{noShowPredictions?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Appointments</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgent Reorders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{inventoryForecast?.urgent || 0}</div>
                <p className="text-xs text-muted-foreground">< 7 days stock</p>
              </div>
              <Package className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {revenueForecast?.projections?.[0]?.trend === 'increasing' ? (
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  ) : revenueForecast?.projections?.[0]?.trend === 'decreasing' ? (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  ) : (
                    <Activity className="h-6 w-6 text-gray-500" />
                  )}
                  <span className="capitalize">{revenueForecast?.projections?.[0]?.trend || 'Stable'}</span>
                </div>
                <p className="text-xs text-muted-foreground">Next quarter</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="no-shows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="no-shows">No-Show Predictions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Forecast</TabsTrigger>
        </TabsList>

        {/* No-Show Predictions Tab */}
        <TabsContent value="no-shows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming No-Show Risks</CardTitle>
              <CardDescription>
                Appointments with elevated no-show probability in the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {noShowPredictions?.predictions?.length > 0 ? (
                <div className="space-y-4">
                  {noShowPredictions.predictions.map((prediction: any) => (
                    <div
                      key={prediction.appointmentId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{prediction.patientName}</span>
                          <Badge
                            variant={
                              prediction.riskLevel === 'high'
                                ? 'destructive'
                                : prediction.riskLevel === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {prediction.riskLevel} risk
                          </Badge>
                          <Badge variant="outline">
                            {(prediction.noShowProbability * 100).toFixed(0)}% probability
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(prediction.appointmentDate).toLocaleString('en-GB', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {prediction.factors?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {prediction.factors.map((factor: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Send Reminder
                        </Button>
                        <Button size="sm">Call Patient</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No high-risk appointments in the next 7 days. Great job!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Forecast Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Projections</CardTitle>
              <CardDescription>
                ML-powered revenue forecasts with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueForecast?.projections?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueForecast.projections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => `£${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="projectedRevenue"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                        name="Projected Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  <div className="mt-6 space-y-4">
                    {revenueForecast.projections.map((projection: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-semibold">{projection.period}</div>
                          <div className="text-sm text-muted-foreground">
                            Confidence: £{projection.confidenceInterval.lower.toLocaleString()} - £
                            {projection.confidenceInterval.upper.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            £{projection.projectedRevenue.toLocaleString()}
                          </div>
                          <Badge
                            variant={
                              projection.trend === 'increasing'
                                ? 'default'
                                : projection.trend === 'decreasing'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {projection.trend === 'increasing' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {projection.trend === 'decreasing' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {projection.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient historical data for revenue forecasting.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Forecast Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reorder Recommendations</CardTitle>
              <CardDescription>
                Products predicted to run out of stock soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryForecast?.forecasts?.length > 0 ? (
                <div className="space-y-4">
                  {inventoryForecast.forecasts.map((forecast: any) => (
                    <div
                      key={forecast.productId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{forecast.productName}</span>
                          {forecast.daysUntilStockout < 7 && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current stock: {forecast.currentStock} | Days until stockout:{' '}
                          {forecast.daysUntilStockout}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Predicted demand: {forecast.predictedDemand} units (next 30 days)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{forecast.reorderQuantity}</div>
                        <p className="text-xs text-muted-foreground">Recommended order</p>
                        <Button size="sm" className="mt-2">
                          Create PO
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No urgent inventory reorders needed. All stock levels healthy!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <strong>Predictive Analytics:</strong> All predictions are generated using machine learning
          algorithms trained on your historical data. Accuracy improves over time as more data is
          collected.
        </AlertDescription>
      </Alert>
    </div>
  );
}
