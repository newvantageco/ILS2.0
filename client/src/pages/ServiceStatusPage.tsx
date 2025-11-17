import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Database, 
  Cloud, 
  Cpu,
  Activity,
  Globe,
  Eye,
  Brain,
  ShoppingCart,
  Clock,
  Signal
} from 'lucide-react';

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'error' | 'degraded';
  responseTime?: number;
  error?: string;
  name: string;
  url?: string;
}

interface VerificationResult {
  timestamp: string;
  services: Record<string, ServiceStatus>;
  endpoints: Record<string, any>;
  database: {
    connection: ServiceStatus;
    tables: {
      total: number;
      existing: string[];
      missing: string[];
      critical: string[];
    };
  };
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    errors: number;
  };
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    healthPercentage: number;
    recommendation: string;
  };
}

export default function ServiceStatusPage() {
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchServiceStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/verification/status');
      if (response.ok) {
        const data = await response.json();
        setVerification(data);
        setLastRefresh(new Date());
      } else {
        console.error('Failed to fetch service status');
      }
    } catch (error) {
      console.error('Error fetching service status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      healthy: 'default',
      unhealthy: 'destructive',
      degraded: 'secondary',
      error: 'destructive'
    };
    
    const colors: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800 border-green-200',
      unhealthy: 'bg-red-100 text-red-800 border-red-200',
      degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge className={colors[status] || colors.degraded}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  if (!verification) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading service status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Service Status Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of ILS 2.0 platform services
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={fetchServiceStatus} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(verification.overall.status)}
            Overall System Status
          </CardTitle>
          <CardDescription>
            {verification.overall.recommendation}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {verification.overall.healthPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Health Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {verification.summary.healthy}
              </div>
              <div className="text-sm text-muted-foreground">Healthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {verification.summary.unhealthy}
              </div>
              <div className="text-sm text-muted-foreground">Unhealthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {verification.summary.errors}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Status */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Core Services</TabsTrigger>
          <TabsTrigger value="ai-ml">AI/ML Services</TabsTrigger>
          <TabsTrigger value="shopify">Shopify Integration</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        {/* Core Services */}
        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(verification.services).map(([key, service]) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {key.includes('database') && <Database className="h-5 w-5" />}
                      {key.includes('redis') && <Server className="h-5 w-5" />}
                      {key.includes('aws') && <Cloud className="h-5 w-5" />}
                      {key.includes('resend') && <Globe className="h-5 w-5" />}
                      {service.name}
                    </span>
                    {getStatusIcon(service.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getStatusBadge(service.status)}
                    {service.responseTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3" />
                        Response: {formatResponseTime(service.responseTime)}
                      </div>
                    )}
                    {service.error && (
                      <Alert>
                        <AlertDescription className="text-xs">
                          {service.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI/ML Services */}
        <TabsContent value="ai-ml">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* AI Service Status */}
              {Object.entries(verification.services)
                .filter(([key]) => key.includes('ai') || key.includes('openai') || key.includes('anthropic') || key.includes('python'))
                .map(([key, service]) => (
                  <Card key={key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          {service.name}
                        </span>
                        {getStatusIcon(service.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getStatusBadge(service.status)}
                        {service.responseTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3" />
                            Response: {formatResponseTime(service.responseTime)}
                          </div>
                        )}
                        {service.error && (
                          <Alert>
                            <AlertDescription className="text-xs">
                              {service.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* AI/ML Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  AI/ML API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(verification.endpoints.ai_ml || {}).map(([endpoint, status]: [string, any]) => (
                    <div key={endpoint} className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm font-mono">{endpoint}</span>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status.status)}
                        <span className="text-xs text-muted-foreground">
                          {status.statusCode}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shopify Integration */}
        <TabsContent value="shopify">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Shopify API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(verification.endpoints.shopify || {}).map(([endpoint, status]: [string, any]) => (
                    <div key={endpoint} className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm font-mono">{endpoint}</span>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status.status)}
                        <span className="text-xs text-muted-foreground">
                          {status.statusCode}
                        </span>
                        {status.requiresAuth && (
                          <Badge variant="outline" className="text-xs">
                            Auth Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Status */}
        <TabsContent value="database">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Connection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatusBadge(verification.database.connection.status)}
                  {verification.database.connection.error && (
                    <Alert>
                      <AlertDescription>
                        {verification.database.connection.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Schema</CardTitle>
                <CardDescription>
                  Overview of database tables and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {verification.database.tables.total}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Tables</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {verification.database.tables.existing.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Existing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {verification.database.tables.missing.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Missing</div>
                  </div>
                </div>

                {verification.database.tables.critical.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical tables missing:</strong> {verification.database.tables.critical.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}

                {verification.database.tables.critical.length === 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      All critical database tables are present and accessible.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
