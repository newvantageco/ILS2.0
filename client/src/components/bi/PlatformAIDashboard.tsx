import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Building2,
  Brain,
  Zap,
  Target,
  Lightbulb,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface AIInsight {
  type: 'positive' | 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  recommendation: string;
}

interface ComprehensiveInsights {
  sales: {
    status: string;
    current_avg_revenue: number;
    trend_slope: number;
    predictions: Array<{
      date: string;
      predicted_revenue: number;
    }>;
    insights: AIInsight[];
  };
  inventory: {
    status: string;
    summary: {
      stockout_risk_count: number;
      overstock_count: number;
      popular_items_count: number;
    };
    stockout_risk: any[];
    insights: AIInsight[];
  };
  bookings: {
    status: string;
    utilization_metrics: {
      average_utilization: number;
      no_show_rate: number;
    };
    peak_hours: number[];
    off_peak_hours: number[];
    insights: AIInsight[];
  };
  comparative: {
    status: string;
    performance_score: number;
    platform_ranking: string;
    insights: AIInsight[];
  };
  summary: {
    total_insights: number;
    critical_count: number;
    warning_count: number;
    positive_count: number;
    top_priority_actions: string[];
  };
}

const InsightCard = ({ insight }: { insight: AIInsight }) => {
  const iconMap = {
    positive: <CheckCircle className="h-5 w-5 text-green-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    critical: <AlertTriangle className="h-5 w-5 text-red-600" />,
    info: <Zap className="h-5 w-5 text-blue-600" />,
  };

  const colorMap = {
    positive: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    critical: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50",
  };

  return (
    <Card className={`${colorMap[insight.type]} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {iconMap[insight.type]}
          {insight.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">{insight.message}</p>
        <div className="bg-white/50 p-2 rounded-md">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Recommendation:
          </p>
          <p className="text-sm">{insight.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function PlatformAIDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const queryParams = new URLSearchParams({
    startDate: format(dateRange?.from || new Date(), 'yyyy-MM-dd'),
    endDate: format(dateRange?.to || new Date(), 'yyyy-MM-dd'),
  });

  const { data: insights, isLoading, refetch } = useQuery<ComprehensiveInsights>({
    queryKey: ["ai-insights-comprehensive", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/ai-insights/comprehensive?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch AI insights");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <div className="text-muted-foreground">AI analyzing your business data...</div>
        </div>
      </div>
    );
  }

  if (!insights || insights.summary.total_insights === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-muted-foreground">No data available for AI analysis</div>
          <p className="text-sm text-muted-foreground mt-2">
            Ensure you have sales, inventory, and booking data in the selected date range
          </p>
        </div>
      </div>
    );
  }

  const allInsights = [
    ...insights.sales.insights,
    ...insights.inventory.insights,
    ...insights.bookings.insights,
    ...insights.comparative.insights,
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Business Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Python-powered analytics and actionable recommendations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI Insights Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.summary.total_insights}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all business areas
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{insights.summary.critical_count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate action
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">{insights.summary.warning_count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Areas needing attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{insights.summary.positive_count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Positive trends identified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Score */}
      {insights.comparative.status === 'success' && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Overall Performance Score
            </CardTitle>
            <CardDescription>Compared to platform benchmarks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">
                  {insights.comparative.performance_score.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">out of 100</div>
              </div>
              <div className="flex-1">
                <div className="mb-2">
                  <Badge variant="outline" className="text-lg py-1">
                    {insights.comparative.platform_ranking}
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      insights.comparative.performance_score >= 110
                        ? "bg-green-500"
                        : insights.comparative.performance_score >= 90
                        ? "bg-blue-500"
                        : insights.comparative.performance_score >= 75
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, insights.comparative.performance_score)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Priority Actions */}
      {insights.summary.top_priority_actions.length > 0 && (
        <Alert className="border-2 border-orange-300 bg-orange-50">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            <div className="font-semibold text-lg mb-2">🎯 Top Priority Actions</div>
            <ol className="list-decimal list-inside space-y-2">
              {insights.summary.top_priority_actions.map((action, index) => (
                <li key={index} className="text-sm font-medium">
                  {action}
                </li>
              ))}
            </ol>
          </AlertDescription>
        </Alert>
      )}

      {/* Insights by Category */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">
            Sales Trends ({insights.sales.insights.length})
          </TabsTrigger>
          <TabsTrigger value="inventory">
            Inventory ({insights.inventory.insights.length})
          </TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings ({insights.bookings.insights.length})
          </TabsTrigger>
          <TabsTrigger value="comparative">
            Benchmarks ({insights.comparative.insights.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend Analysis</CardTitle>
              <CardDescription>
                Current avg revenue: {formatCurrency(insights.sales.current_avg_revenue)} | 
                Trend: {insights.sales.trend_slope > 0 ? "📈 Growing" : "📉 Declining"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.sales.predictions.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">7-Day Revenue Forecast</h4>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {insights.sales.predictions.map((pred, i) => (
                      <div key={i} className="text-xs">
                        <div className="font-medium">
                          {format(new Date(pred.date), 'MMM d')}
                        </div>
                        <div className="text-primary font-bold">
                          {formatCurrency(pred.predicted_revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-4">
                {insights.sales.insights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stockout Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">
                  {insights.inventory.summary.stockout_risk_count}
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overstock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">
                  {insights.inventory.summary.overstock_count}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {insights.inventory.summary.popular_items_count}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4">
            {insights.inventory.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insights.bookings.utilization_metrics.average_utilization.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">No-Show Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insights.bookings.utilization_metrics.no_show_rate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
          {insights.bookings.peak_hours.length > 0 && (
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Peak Hours (80%+ booked)</h4>
                    <div className="flex flex-wrap gap-2">
                      {insights.bookings.peak_hours.map((hour) => (
                        <Badge key={hour} variant="default">
                          {hour}:00
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Off-Peak Hours (&lt;40% booked)</h4>
                    <div className="flex flex-wrap gap-2">
                      {insights.bookings.off_peak_hours.map((hour) => (
                        <Badge key={hour} variant="outline">
                          {hour}:00
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4">
            {insights.bookings.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparative" className="space-y-4 mt-4">
          <div className="grid gap-4">
            {insights.comparative.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Powered Badge */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 text-purple-600" />
            <span>Powered by Python AI Engine using pandas, numpy, and scikit-learn</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
