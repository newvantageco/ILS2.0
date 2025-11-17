/**
 * Analytics Summary Cards Component for ILS 2.0
 * 
 * Displays key analytics metrics with trend indicators and status badges
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Brain,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface KeyMetrics {
  totalPrescriptions: number;
  totalOrders: number;
  totalAnalyses: number;
  totalUsers: number;
  totalRevenue: number;
  aiAccuracyRate: number;
  averageOrderValue: number;
  userRetentionRate: number;
  profitMargins: number;
}

interface AnalyticsSummaryCardsProps {
  metrics: KeyMetrics;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
  status?: 'excellent' | 'good' | 'needs-improvement';
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  status,
  loading = false
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'needs-improvement':
        return 'text-red-600 bg-red-100';
      default:
        return '';
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      case 'neutral':
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2" />
          <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {getTrendIcon(trend.direction)}
            <span className={`text-xs ml-1 ${
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend.value > 0 ? `${trend.value}%` : `${trend.value}%`}
            </span>
          </div>
        )}
        {status && (
          <Badge className={`mt-2 ${getStatusColor(status)}`}>
            {status.replace('-', ' ')}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({ 
  metrics, 
  loading = false 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getAccuracyStatus = (rate: number) => {
    if (rate >= 90) return 'excellent';
    if (rate >= 80) return 'good';
    return 'needs-improvement';
  };

  const getRetentionStatus = (rate: number) => {
    if (rate >= 80) return 'excellent';
    if (rate >= 60) return 'good';
    return 'needs-improvement';
  };

  const getProfitStatus = (margin: number) => {
    if (margin >= 30) return 'excellent';
    if (margin >= 20) return 'good';
    return 'needs-improvement';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <MetricCard
        title="Total Prescriptions"
        value={metrics.totalPrescriptions}
        subtitle={`AI Accuracy: ${formatPercentage(metrics.aiAccuracyRate)}`}
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        status={getAccuracyStatus(metrics.aiAccuracyRate)}
        loading={loading}
      />

      <MetricCard
        title="Total Orders"
        value={metrics.totalOrders}
        subtitle={`Avg Value: ${formatCurrency(metrics.averageOrderValue)}`}
        icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />

      <MetricCard
        title="AI Analyses"
        value={metrics.totalAnalyses}
        subtitle="AI-powered insights"
        icon={<Brain className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />

      <MetricCard
        title="Total Users"
        value={metrics.totalUsers}
        subtitle={`Retention: ${formatPercentage(metrics.userRetentionRate)}`}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        status={getRetentionStatus(metrics.userRetentionRate)}
        loading={loading}
      />

      <MetricCard
        title="Total Revenue"
        value={formatCurrency(metrics.totalRevenue)}
        subtitle={`Margin: ${formatPercentage(metrics.profitMargins)}`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        status={getProfitStatus(metrics.profitMargins)}
        loading={loading}
      />
    </div>
  );
};

export default AnalyticsSummaryCards;
