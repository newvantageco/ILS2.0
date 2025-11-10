import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  CloudIcon,
  HardDrive,
  Cpu,
  MemoryStick,
  Clock,
  Zap,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Bell,
} from "lucide-react";

interface ComponentStatus {
  id: string;
  name: string;
  type: string;
  status: "healthy" | "degraded" | "critical" | "offline";
  lastCheck: string;
  uptime: number;
  message?: string;
}

interface SystemHealth {
  overall: "healthy" | "degraded" | "critical";
  components: ComponentStatus[];
  lastCheck: string;
  uptime: number;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  processes: {
    active: number;
    total: number;
  };
}

interface Alert {
  id: number;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "text-green-500";
    case "degraded":
      return "text-yellow-500";
    case "critical":
      return "text-red-500";
    case "offline":
      return "text-gray-500";
    default:
      return "text-gray-500";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return CheckCircle;
    case "degraded":
      return AlertTriangle;
    case "critical":
    case "offline":
      return XCircle;
    default:
      return AlertCircle;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
    healthy: "default",
    degraded: "secondary",
    critical: "destructive",
    offline: "outline",
  };
  return variants[status] || "outline";
};

export default function SystemHealthDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system health status
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery<{ health: SystemHealth }>({
    queryKey: ["/api/system-admin/health"],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
  });

  // Fetch system metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery<{ metrics: SystemMetrics }>({
    queryKey: ["/api/system-admin/metrics/system"],
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds
  });

  // Fetch active alerts
  const { data: alerts } = useQuery<{ alerts: Alert[] }>({
    queryKey: ["/api/system-admin/alerts"],
    refetchInterval: autoRefresh ? 15000 : false,
  });

  const handleRefreshAll = () => {
    refetchHealth();
    refetchMetrics();
  };

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const systemHealth = health?.health;
  const systemMetrics = metrics?.metrics;
  const systemAlerts = alerts?.alerts || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8" />
            System Health Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring of system components and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto-refresh {autoRefresh ? "On" : "Off"}
          </Button>
          <Button onClick={handleRefreshAll} size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      <Card className={systemHealth?.overall === "critical" ? "border-red-500" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Overall System Status
            <Badge variant={getStatusBadge(systemHealth?.overall || "offline")} className="ml-auto">
              {systemHealth?.overall?.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            System uptime: {Math.floor((systemHealth?.uptime || 0) / 60)} minutes
            {" • "}
            Last checked: {systemHealth?.lastCheck ? new Date(systemHealth.lastCheck).toLocaleTimeString() : "Never"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Component Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemHealth?.components.map((component) => {
          const StatusIcon = getStatusIcon(component.status);
          const statusColor = getStatusColor(component.status);

          return (
            <Card key={component.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                  {component.name}
                  <Badge variant={getStatusBadge(component.status)} className="ml-auto text-xs">
                    {component.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{component.type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="font-medium">{Math.floor(component.uptime / 60)}m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Check:</span>
                  <span className="font-medium">
                    {new Date(component.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
                {component.message && (
                  <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                    {component.message}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.cpu.usage.toFixed(1)}%</div>
            <Progress value={systemMetrics?.cpu.usage || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {systemMetrics?.cpu.cores} cores • Load: {systemMetrics?.cpu.loadAverage[0]?.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MemoryStick className="h-4 w-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.memory.percentage.toFixed(1)}%</div>
            <Progress value={systemMetrics?.memory.percentage || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {((systemMetrics?.memory.used || 0) / 1024 / 1024 / 1024).toFixed(2)} GB of{" "}
              {((systemMetrics?.memory.total || 0) / 1024 / 1024 / 1024).toFixed(2)} GB
            </p>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.disk.percentage.toFixed(1)}%</div>
            <Progress value={systemMetrics?.disk.percentage || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {((systemMetrics?.disk.used || 0) / 1024 / 1024 / 1024).toFixed(2)} GB of{" "}
              {((systemMetrics?.disk.total || 0) / 1024 / 1024 / 1024).toFixed(2)} GB
            </p>
          </CardContent>
        </Card>

        {/* Active Processes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Processes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.processes.active}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {systemMetrics?.processes.active} active of {systemMetrics?.processes.total} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Alerts
            {systemAlerts.filter(a => !a.acknowledged).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {systemAlerts.filter(a => !a.acknowledged).length} New
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            System alerts and notifications requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {systemAlerts.length > 0 ? (
            <div className="space-y-3">
              {systemAlerts.slice(0, 10).map((alert) => {
                const getSeverityIcon = () => {
                  switch (alert.severity) {
                    case "critical":
                      return <XCircle className="h-5 w-5 text-red-500" />;
                    case "error":
                      return <AlertCircle className="h-5 w-5 text-red-400" />;
                    case "warning":
                      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
                    default:
                      return <CheckCircle className="h-5 w-5 text-blue-500" />;
                  }
                };

                return (
                  <Alert key={alert.id} variant={alert.severity === "critical" || alert.severity === "error" ? "destructive" : "default"}>
                    {getSeverityIcon()}
                    <AlertTitle className="flex items-center gap-2">
                      {alert.source}
                      <Badge variant="outline" className="ml-auto text-xs">
                        {alert.severity}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      {alert.message}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        {!alert.acknowledged && (
                          <Button size="sm" variant="outline">
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
              <p>No active alerts - All systems operating normally</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Network In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((systemMetrics?.network.bytesIn || 0) / 1024 / 1024).toFixed(2)} MB
            </div>
            <p className="text-xs text-muted-foreground">Inbound traffic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              Network Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((systemMetrics?.network.bytesOut || 0) / 1024 / 1024).toFixed(2)} MB
            </div>
            <p className="text-xs text-muted-foreground">Outbound traffic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((systemHealth?.uptime || 0) / 60 / 60)} hrs
            </div>
            <p className="text-xs text-muted-foreground">
              Since {systemHealth?.lastCheck ? new Date(Date.now() - (systemHealth.uptime * 1000)).toLocaleString() : "unknown"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
