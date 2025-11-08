/**
 * Performance Monitoring Component
 * Displays real-time performance metrics for administrators
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceMetrics {
  timestamp: string;
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRate: string;
    slowestEndpoints?: Array<{
      endpoint: string;
      avgDuration: number;
      maxDuration: number;
      count: number;
      errorRate: string;
    }>;
  };
}

interface RecentMetrics {
  timestamp: string;
  timeWindow: string;
  metrics: {
    requests: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: string;
  };
}

async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
  const response = await fetch('/api/monitoring/metrics', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch performance metrics');
  }
  return response.json();
}

async function fetchRecentMetrics(minutes: number = 5): Promise<RecentMetrics> {
  const response = await fetch(`/api/monitoring/metrics/recent?minutes=${minutes}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch recent metrics');
  }
  return response.json();
}

export function PerformanceMonitor() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: fetchPerformanceMetrics,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-metrics'],
    queryFn: () => fetchRecentMetrics(5),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  if (metricsLoading || recentLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading performance data...</span>
      </div>
    );
  }

  const isHealthy = recent && parseFloat(recent.metrics.errorRate) < 5 && recent.metrics.avgResponseTime < 1000;

  return (
    <div className="space-y-6">
      {/* System Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Overall system performance status</CardDescription>
            </div>
            {isHealthy ? (
              <Badge className="bg-green-500 hover:bg-green-600">
                <CheckCircle className="mr-1 h-4 w-4" />
                Healthy
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-4 w-4" />
                Degraded
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Real-time Metrics (Last 5 Minutes) */}
      {recent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Performance (Last 5 Minutes)
            </CardTitle>
            <CardDescription>Updated every 10 seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Requests"
                value={recent.metrics.requests.toLocaleString()}
                icon={Activity}
              />
              <MetricCard
                label="Avg Response Time"
                value={`${recent.metrics.avgResponseTime}ms`}
                icon={Clock}
                status={recent.metrics.avgResponseTime > 1000 ? 'warning' : 'success'}
              />
              <MetricCard
                label="P95 Response Time"
                value={`${recent.metrics.p95ResponseTime}ms`}
                icon={TrendingUp}
                status={recent.metrics.p95ResponseTime > 2000 ? 'warning' : 'success'}
              />
              <MetricCard
                label="Error Rate"
                value={`${recent.metrics.errorRate}%`}
                icon={AlertTriangle}
                status={parseFloat(recent.metrics.errorRate) > 5 ? 'error' : 'success'}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Statistics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Statistics</CardTitle>
            <CardDescription>Total system performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total Requests"
                value={metrics.metrics.totalRequests.toLocaleString()}
                icon={Activity}
              />
              <MetricCard
                label="Avg Response Time"
                value={`${metrics.metrics.averageResponseTime}ms`}
                icon={Clock}
              />
              <MetricCard
                label="Slow Requests"
                value={metrics.metrics.slowRequests.toLocaleString()}
                icon={TrendingDown}
                status={metrics.metrics.slowRequests > 100 ? 'warning' : 'success'}
              />
              <MetricCard
                label="Error Rate"
                value={`${metrics.metrics.errorRate}%`}
                icon={AlertTriangle}
                status={parseFloat(metrics.metrics.errorRate) > 5 ? 'error' : 'success'}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slowest Endpoints */}
      {metrics?.metrics.slowestEndpoints && metrics.metrics.slowestEndpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Slowest Endpoints</CardTitle>
            <CardDescription>Top 10 endpoints by average response time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.metrics.slowestEndpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium">{endpoint.endpoint}</div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{endpoint.count} requests</span>
                      <span>Max: {endpoint.maxDuration}ms</span>
                      {parseFloat(endpoint.errorRate) > 0 && (
                        <span className="text-red-500">Error rate: {endpoint.errorRate}%</span>
                      )}
                    </div>
                  </div>
                  <Badge variant={endpoint.avgDuration > 1000 ? 'destructive' : 'secondary'}>
                    {endpoint.avgDuration}ms avg
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  status?: 'success' | 'warning' | 'error';
}

function MetricCard({ label, value, icon: Icon, status }: MetricCardProps) {
  const statusColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${status ? statusColors[status] : 'text-muted-foreground'}`} />
      </div>
      <div className={`text-2xl font-bold ${status ? statusColors[status] : ''}`}>{value}</div>
    </div>
  );
}
