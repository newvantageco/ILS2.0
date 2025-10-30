import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Clock,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Activity,
  Info,
  CheckCircle2
} from "lucide-react";

interface KPI {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'error';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  metadata: any;
}

interface Opportunity {
  type: string;
  title: string;
  description: string;
  estimatedImpact: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

interface AlertItem {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function BIDashboardPage() {
  const { data: kpisData } = useQuery<{ data: { kpis: KPI[] } }>({
    queryKey: ["/api/ai-intelligence/dashboard"],
  });

  const { data: insightsData } = useQuery<{ data: { insights: Insight[] } }>({
    queryKey: ["/api/ai-intelligence/insights"],
  });

  const { data: opportunitiesData } = useQuery<{ data: { opportunities: Opportunity[] } }>({
    queryKey: ["/api/ai-intelligence/opportunities"],
  });

  const { data: alertsData } = useQuery<{ data: { alerts: AlertItem[] } }>({
    queryKey: ["/api/ai-intelligence/alerts"],
  });

  const kpis = kpisData?.data?.kpis || [];
  const insights = insightsData?.data?.insights || [];
  const opportunities = opportunitiesData?.data?.opportunities || [];
  const alerts = alertsData?.data?.alerts || [];

  const getKPIIcon = (metric: string) => {
    switch (metric.toLowerCase()) {
      case 'total orders':
      case 'orders':
        return <Package className="h-5 w-5" />;
      case 'revenue':
      case 'total revenue':
        return <DollarSign className="h-5 w-5" />;
      case 'turnaround time':
      case 'avg turnaround':
        return <Clock className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
    };
    return colors[impact as keyof typeof colors] || 'bg-gray-500';
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-orange-500',
      low: 'bg-green-500',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6" aria-label="Analytics Dashboard">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" aria-label="Business Intelligence Dashboard">
          <BarChart3 className="h-8 w-8" />
          Business Intelligence Dashboard
        </h1>
        <p className="text-muted-foreground">
          AI-powered insights and analytics for your business
        </p>
      </div>

      {/* KPIs */}
      <section aria-label="Key Performance Indicators" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">KPI Overview</div>
          <div className="text-xs text-muted-foreground">Range: Last 30 days</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="text-muted-foreground">{getKPIIcon(kpi.metric)}</div>
                {getTrendIcon(kpi.trend)}
              </div>
              <div className="text-2xl font-bold mb-1" aria-label={`${kpi.metric} value`}>
                {kpi.metric.toLowerCase().includes('revenue') ? `$${kpi.value.toLocaleString()}` : kpi.value.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mb-2" aria-label="Metric name">{kpi.metric}</div>
              <div className="h-8 mb-2 flex items-end gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-1.5 bg-primary/30 rounded" style={{ height: `${20 + ((i * 13) % 60)}%` }} />
                ))}
              </div>
              <div className={`text-sm flex items-center gap-1 ${
                kpi.change > 0 ? 'text-green-600' : kpi.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                <span>{kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%</span>
                <span className="text-muted-foreground">vs {kpi.period}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </section>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card aria-label="Active Alerts">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({alerts.filter(a => !a.resolved).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(a => !a.resolved).map((alert, index) => (
                <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityBadge(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{alert.category}</span>
                      </div>
                      <AlertDescription>{alert.message}</AlertDescription>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card aria-label="AI-Generated Insights">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Insights</div>
              <div className="text-xs text-muted-foreground">
                Filter: All · <button className="underline" onClick={() => window.print()}>Export</button>
              </div>
            </div>
            {insights.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No insights available yet. Add more data to generate insights.
              </p>
            ) : (
              insights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge className={getImpactBadge(insight.impact)}>
                          {insight.impact.toUpperCase()} IMPACT
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="outline" className="bg-blue-50">
                            ACTIONABLE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Category: {insight.category}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card aria-label="Growth Opportunities">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Growth Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No opportunities identified yet. Continue using the system to discover growth opportunities.
              </p>
            ) : (
              opportunities.map((opportunity, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{opportunity.title}</h3>
                        <Badge className={getPriorityBadge(opportunity.priority)}>
                          {opportunity.priority.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {opportunity.description}
                      </p>
                      <div className="text-sm font-medium text-green-600">
                        Estimated Impact: {opportunity.estimatedImpact}
                      </div>
                    </div>
                  </div>
                  
                  {opportunity.actionItems.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium mb-2">Action Items:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {opportunity.actionItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
