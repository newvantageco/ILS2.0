/**
 * System Health Card Component for Admin Dashboard
 * 
 * Displays real-time system health metrics with visual indicators
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Wifi, 
  Server, 
  HardDrive, 
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { SystemHealth } from '@/hooks/useAdminDashboard';

interface SystemHealthCardProps {
  health: SystemHealth;
  loading?: boolean;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ 
  health, 
  loading = false 
}) => {
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
      case 'disconnected':
      case 'down':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
      case 'disconnected':
      case 'down':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverallHealthColor = (overall: string) => {
    switch (overall) {
      case 'healthy':
        return 'border-green-500/30 bg-gradient-to-br from-green-50/50 via-background to-background';
      case 'warning':
        return 'border-yellow-500/30 bg-gradient-to-br from-yellow-50/50 via-background to-background';
      case 'critical':
        return 'border-red-500/30 bg-gradient-to-br from-red-50/50 via-background to-background';
      default:
        return 'border-gray-500/30 bg-gradient-to-br from-gray-50/50 via-background to-background';
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${getOverallHealthColor(health.overall)} shadow-lg`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health
          </CardTitle>
          <Badge className={getHealthColor(health.overall)}>
            {getHealthIcon(health.overall)}
            <span className="ml-1">{health.overall.toUpperCase()}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Database */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-gray-600">{health.database.responseTime}ms</p>
              </div>
            </div>
            <Badge className={getHealthColor(health.database.status)}>
              {health.database.status}
            </Badge>
          </div>

          {/* Redis */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Redis Cache</p>
                <p className="text-xs text-gray-600">{health.redis.responseTime}ms</p>
              </div>
            </div>
            <Badge className={getHealthColor(health.redis.status)}>
              {health.redis.status}
            </Badge>
          </div>

          {/* API */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">API Service</p>
                <p className="text-xs text-gray-600">{health.api.averageResponseTime}ms</p>
              </div>
            </div>
            <Badge className={getHealthColor(health.api.status)}>
              {health.api.status}
            </Badge>
          </div>

          {/* AI Service */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              <div>
                <p className="text-sm font-medium">AI Service</p>
                <p className="text-xs text-gray-600">{Math.round(health.ai.modelAvailability * 100)}% available</p>
              </div>
            </div>
            <Badge className={getHealthColor(health.ai.status)}>
              {health.ai.status}
            </Badge>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">API Requests/min:</span>
              <span className="font-medium">{health.api.requestsPerMinute}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Error Rate:</span>
              <span className="font-medium">{health.api.errorRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">AI Queue Length:</span>
              <span className="font-medium">{health.ai.queueLength}</span>
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Storage Usage</span>
            </div>
            <Badge className={getHealthColor(health.storage.status)}>
              {health.storage.status}
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Used Space:</span>
              <span className="font-medium">
                {Math.round((health.storage.usedSpace / health.storage.totalSpace) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(health.storage.usedSpace / health.storage.totalSpace) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;
