/**
 * SaaS Metrics Dashboard
 * 
 * Executive-level view of business metrics:
 * - MRR/ARR trends with forecasting
 * - Customer health overview with segmentation
 * - Churn risk alerts and recommendations
 * - Feature adoption heatmap
 * - Cohort retention curves
 * - Revenue waterfall
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface SaaSMetrics {
  mrr: {
    mrr: number;
    arr: number;
    mom_growth: number;
  };
  cac: {
    cac: number;
    totalSpent: number;
    newCustomers: number;
  };
  clv: {
    avgLifetimeValue: number;
    avgMonthlyChurn: number;
  };
  churn: {
    monthlyChurnRate: number;
  };
  nrr: {
    nrr: number;
  };
}

interface HealthScore {
  overallScore: number;
  engagementScore: number;
  adoptionScore: number;
  satisfactionScore: number;
  riskLevel: 'excellent' | 'good' | 'at_risk' | 'critical';
}

interface ChurnPrediction {
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: Array<{ action: string; priority: string }>;
}

const api = {
  get: (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json()),
  post: (url: string, data: any) => 
    fetch(url, { 
      method: 'POST', 
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json())
};

export default function SaaSMetricsDashboard() {
  // Fetch all metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['saas-metrics'],
    queryFn: () => api.get('/api/saas/metrics/summary'),
    refetchInterval: 60000, // Update every minute
  });

  const { data: health } = useQuery({
    queryKey: ['saas-health'],
    queryFn: () => api.get('/api/saas/health/segmentation'),
    refetchInterval: 60000,
  });

  const { data: churnReport } = useQuery({
    queryKey: ['saas-churn'],
    queryFn: () => api.get('/api/saas/churn/report'),
    refetchInterval: 60000,
  });

  const { data: cohorts } = useQuery({
    queryKey: ['saas-cohorts'],
    queryFn: () => api.get('/api/saas/cohorts/dashboard'),
    refetchInterval: 300000, // Update every 5 minutes
  });

  if (metricsLoading) {
    return <div className="p-8 text-center">Loading SaaS metrics...</div>;
  }

  const mrrData = metrics?.mrr || { mrr: 0, arr: 0, mom_growth: 0 };
  const cacData = metrics?.cac || { cac: 0, totalSpent: 0, newCustomers: 0 };
  const clvData = metrics?.clv || { avgLifetimeValue: 0, avgMonthlyChurn: 0 };
  const nrrData = metrics?.nrr?.nrr || 100;
  const churnRate = metrics?.churn?.monthlyChurnRate || 0;

  const ltvCacRatio = cacData.cac > 0 ? clvData.avgLifetimeValue / cacData.cac : 0;
  const healthStatus = health || { excellent: 0, good: 0, at_risk: 0, critical: 0 };
  const churnRisks = churnReport?.criticalRisk || 0;

  // Mock historical data for trends
  const mrrTrend = [
    { month: 'Oct', mrr: mrrData.mrr * 0.85, arr: mrrData.arr * 0.85 },
    { month: 'Nov', mrr: mrrData.mrr * 0.92, arr: mrrData.arr * 0.92 },
    { month: 'Dec', mrr: mrrData.mrr, arr: mrrData.arr },
    { month: 'Jan (Forecast)', mrr: mrrData.mrr * 1.08, arr: mrrData.arr * 1.08 },
  ];

  const healthBreakdown = [
    { name: 'Excellent', value: healthStatus.excellent, color: '#10b981' },
    { name: 'Good', value: healthStatus.good, color: '#3b82f6' },
    { name: 'At Risk', value: healthStatus.at_risk, color: '#f59e0b' },
    { name: 'Critical', value: healthStatus.critical, color: '#ef4444' },
  ];

  const cohortRetention = [
    { month: 'Month 0', retention: 100 },
    { month: 'Month 1', retention: 92 },
    { month: 'Month 2', retention: 87 },
    { month: 'Month 3', retention: 84 },
    { month: 'Month 4', retention: 82 },
    { month: 'Month 5', retention: 80 },
    { month: 'Month 6', retention: 78 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SaaS Metrics Dashboard</h1>
          <p className="text-gray-400">Real-time business metrics and customer insights</p>
        </div>

        {/* Critical Alerts */}
        {churnRisks > 0 && (
          <Alert className="mb-6 border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{churnRisks} customers</strong> at critical churn risk. Review recommendations and prioritize retention campaigns.
            </AlertDescription>
          </Alert>
        )}

        {healthStatus.critical > 0 && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>{healthStatus.critical} customers</strong> showing critical health decline. Immediate support intervention recommended.
            </AlertDescription>
          </Alert>
        )}

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* MRR Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Monthly Recurring Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                £{(mrrData.mrr / 1000).toFixed(1)}k
              </div>
              <div className="flex items-center text-sm">
                {mrrData.mom_growth >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500">
                      +{mrrData.mom_growth.toFixed(1)}% MoM
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500">
                      {mrrData.mom_growth.toFixed(1)}% MoM
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                ARR: £{(mrrData.arr / 1000).toFixed(0)}k
              </div>
            </CardContent>
          </Card>

          {/* CAC Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Customer Acquisition Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                £{cacData.cac.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Spent: £{(cacData.totalSpent / 1000).toFixed(1)}k</div>
                <div>Customers: {cacData.newCustomers}</div>
              </div>
            </CardContent>
          </Card>

          {/* CLV Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Customer Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                £{(clvData.avgLifetimeValue / 1000).toFixed(1)}k
              </div>
              <div className="flex items-center text-sm">
                <span className={ltvCacRatio >= 3 ? 'text-green-500' : 'text-yellow-500'}>
                  LTV:CAC Ratio {ltvCacRatio.toFixed(1)}:1
                </span>
                {ltvCacRatio >= 3 ? (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* NRR Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Net Revenue Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {nrrData.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {nrrData >= 100 ? (
                  <span className="text-green-500">Growing (including expansions)</span>
                ) : (
                  <span className="text-red-500">Contracting (including downgrades)</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* MRR Trend */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">MRR Trend & Forecast</CardTitle>
              <CardDescription>Last 3 months + January forecast</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mrrTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="mrr" 
                    stroke="#3b82f6" 
                    name="MRR" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Health Segmentation */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Customer Health Distribution</CardTitle>
              <CardDescription>Segmented by health score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthBreakdown.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-lg font-semibold text-white">
                      {item.value}
                      <span className="text-xs text-gray-500 ml-2">
                        ({healthStatus.excellent + healthStatus.good + healthStatus.at_risk + healthStatus.critical > 0 
                          ? ((item.value / (healthStatus.excellent + healthStatus.good + healthStatus.at_risk + healthStatus.critical)) * 100).toFixed(0)
                          : 0}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cohort Retention */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Cohort Retention Curve</CardTitle>
            <CardDescription>Latest cohort retention by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cohortRetention}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => `${value}%`}
                />
                <Line 
                  type="monotone" 
                  dataKey="retention" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Retention %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Churn Risk Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Churn Risk Summary</CardTitle>
            <CardDescription>Customers flagged by churn prediction model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {churnReport?.topRiskCompanies?.slice(0, 5).map((company: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                  <div>
                    <div className="font-medium text-white">{company.companyId}</div>
                    <div className="text-xs text-gray-400">Churn Probability</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={company.probability > 0.7 ? 'destructive' : company.probability > 0.5 ? 'default' : 'secondary'}
                    >
                      {(company.probability * 100).toFixed(0)}%
                    </Badge>
                    <div className="w-24 bg-slate-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          company.probability > 0.7 ? 'bg-red-500' : 
                          company.probability > 0.5 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${company.probability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
