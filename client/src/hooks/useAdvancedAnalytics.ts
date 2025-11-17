/**
 * Advanced Analytics Hook for ILS 2.0
 * 
 * Provides advanced analytics functionality including:
 * - Business intelligence metrics
 * - Prescription analytics
 * - Order performance tracking
 * - AI model analytics
 * - User behavior analysis
 * - Financial reporting
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface PrescriptionAnalytics {
  totalPrescriptions: number;
  prescriptionsByMonth: Array<{ month: string; count: number }>;
  prescriptionsByType: Record<string, number>;
  prescriptionsByECP: Record<string, number>;
  averageProcessingTime: number;
  aiAccuracyRate: number;
  topPrescribedMedications: Array<{
    medication: string;
    count: number;
    percentage: number;
  }>;
}

export interface OrderAnalytics {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  ordersByMonth: Array<{ month: string; count: number; revenue: number }>;
  averageOrderValue: number;
  orderFulfillmentTime: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface AIAnalytics {
  totalAnalyses: number;
  accuracyByModel: Record<string, number>;
  processingTimeByModel: Record<string, number>;
  analysesByType: Record<string, number>;
  confidenceScores: {
    average: number;
    distribution: Array<{ range: string; count: number }>;
  };
  errorRates: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
  };
}

export interface UserAnalytics {
  userGrowthMetrics: {
    totalUsers: number;
    newUsersThisMonth: number;
    newUsersThisWeek: number;
    userRetentionRate: number;
    churnRate: number;
  };
  userActivityMetrics: {
    activeUsersToday: number;
    activeUsersThisWeek: number;
    activeUsersThisMonth: number;
    averageSessionDuration: number;
    pageViewsPerSession: number;
  };
  userDemographics: {
    usersByRole: Record<string, number>;
    usersByECP: Record<string, number>;
    geographicDistribution: Record<string, number>;
  };
}

export interface FinancialAnalytics {
  totalRevenue: number;
  revenueByMonth: Array<{ month: string; revenue: number; profit: number }>;
  revenueBySource: Record<string, number>;
  averageRevenuePerUser: number;
  subscriptionMetrics: {
    activeSubscriptions: number;
    monthlyRecurringRevenue: number;
    subscriptionGrowthRate: number;
  };
  costAnalysis: {
    totalCosts: number;
    costsByCategory: Record<string, number>;
    profitMargins: number;
  };
}

export interface AnalyticsDashboardData {
  prescriptions: PrescriptionAnalytics;
  orders: OrderAnalytics;
  ai: AIAnalytics;
  users: UserAnalytics;
  financial: FinancialAnalytics;
  generatedAt: string;
}

export interface ReportConfig {
  name: string;
  type: 'prescription' | 'order' | 'ai' | 'user' | 'financial' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on-demand';
  parameters: Record<string, any>;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  active: boolean;
}

export const useAdvancedAnalytics = (options: {
  startDate?: Date;
  endDate?: Date;
  autoRefresh?: boolean;
} = {}) => {
  const queryClient = useQueryClient();
  const { startDate, endDate, autoRefresh = true } = options;

  // Dashboard Analytics Query
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery<AnalyticsDashboardData>({
    queryKey: ['/api/analytics/advanced/dashboard', { startDate, endDate }],
    refetchInterval: autoRefresh ? 60000 : false, // 1 minute if auto-refresh enabled
  });

  // Prescription Analytics Query
  const {
    data: prescriptionAnalytics,
    isLoading: prescriptionLoading,
    error: prescriptionError,
    refetch: refetchPrescriptions
  } = useQuery<PrescriptionAnalytics>({
    queryKey: ['/api/analytics/advanced/prescriptions', { startDate, endDate }],
    refetchInterval: autoRefresh ? 120000 : false, // 2 minutes if auto-refresh enabled
  });

  // Order Analytics Query
  const {
    data: orderAnalytics,
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrders
  } = useQuery<OrderAnalytics>({
    queryKey: ['/api/analytics/advanced/orders', { startDate, endDate }],
    refetchInterval: autoRefresh ? 120000 : false, // 2 minutes if auto-refresh enabled
  });

  // AI Analytics Query
  const {
    data: aiAnalytics,
    isLoading: aiLoading,
    error: aiError,
    refetch: refetchAI
  } = useQuery<AIAnalytics>({
    queryKey: ['/api/analytics/advanced/ai', { startDate, endDate }],
    refetchInterval: autoRefresh ? 120000 : false, // 2 minutes if auto-refresh enabled
  });

  // User Analytics Query
  const {
    data: userAnalytics,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUsers
  } = useQuery<UserAnalytics>({
    queryKey: ['/api/analytics/advanced/users', { startDate, endDate }],
    refetchInterval: autoRefresh ? 300000 : false, // 5 minutes if auto-refresh enabled
  });

  // Financial Analytics Query
  const {
    data: financialAnalytics,
    isLoading: financialLoading,
    error: financialError,
    refetch: refetchFinancial
  } = useQuery<FinancialAnalytics>({
    queryKey: ['/api/analytics/advanced/financial', { startDate, endDate }],
    refetchInterval: autoRefresh ? 300000 : false, // 5 minutes if auto-refresh enabled
  });

  // Analytics Summary Query
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useQuery<any>({
    queryKey: ['/api/analytics/advanced/summary'],
    refetchInterval: autoRefresh ? 60000 : false, // 1 minute if auto-refresh enabled
  });

  // Generate Report Mutation
  const generateReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await apiRequest('POST', '/api/analytics/reports', config);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/advanced/dashboard'] });
    }
  });

  // Schedule Report Mutation
  const scheduleReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await apiRequest('POST', '/api/analytics/reports/schedule', config);
      return response.json();
    }
  });

  // Export Data Mutation
  const exportDataMutation = useMutation({
    mutationFn: async ({ type, format }: { type: string; format: string }) => {
      const response = await fetch(`/api/analytics/export/${type}?format=${format}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      return response.blob();
    }
  });

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetchDashboard(),
      refetchPrescriptions(),
      refetchOrders(),
      refetchAI(),
      refetchUsers(),
      refetchFinancial(),
      refetchSummary()
    ]);
  }, [
    refetchDashboard,
    refetchPrescriptions,
    refetchOrders,
    refetchAI,
    refetchUsers,
    refetchFinancial,
    refetchSummary
  ]);

  // Generate report
  const generateReport = useCallback(async (config: ReportConfig) => {
    return await generateReportMutation.mutateAsync(config);
  }, [generateReportMutation]);

  // Schedule report
  const scheduleReport = useCallback(async (config: ReportConfig) => {
    return await scheduleReportMutation.mutateAsync(config);
  }, [scheduleReportMutation]);

  // Export data
  const exportData = useCallback(async (type: string, format: string) => {
    const blob = await exportDataMutation.mutateAsync({ type, format });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [exportDataMutation]);

  // Calculate overall loading state
  const isLoading = dashboardLoading || prescriptionLoading || orderLoading || 
                   aiLoading || userLoading || financialLoading || summaryLoading;

  // Calculate overall error state
  const hasErrors = !!(dashboardError || prescriptionError || orderError || 
                      aiError || userError || financialError || summaryError);

  // Get key metrics for quick display
  const getKeyMetrics = useCallback(() => {
    if (!dashboardData) return null;

    return {
      totalPrescriptions: dashboardData.prescriptions.totalPrescriptions,
      totalOrders: dashboardData.orders.totalOrders,
      totalAnalyses: dashboardData.ai.totalAnalyses,
      totalUsers: dashboardData.users.userGrowthMetrics.totalUsers,
      totalRevenue: dashboardData.financial.totalRevenue,
      aiAccuracyRate: dashboardData.prescriptions.aiAccuracyRate,
      averageOrderValue: dashboardData.orders.averageOrderValue,
      userRetentionRate: dashboardData.users.userGrowthMetrics.userRetentionRate,
      profitMargins: dashboardData.financial.costAnalysis.profitMargins
    };
  }, [dashboardData]);

  // Get performance indicators
  const getPerformanceIndicators = useCallback(() => {
    if (!dashboardData) return null;

    const metrics = getKeyMetrics();
    if (!metrics) return null;

    return {
      aiAccuracy: {
        value: metrics.aiAccuracyRate,
        status: metrics.aiAccuracyRate >= 90 ? 'excellent' : 
                metrics.aiAccuracyRate >= 80 ? 'good' : 'needs-improvement'
      },
      userRetention: {
        value: metrics.userRetentionRate,
        status: metrics.userRetentionRate >= 80 ? 'excellent' : 
                metrics.userRetentionRate >= 60 ? 'good' : 'needs-improvement'
      },
      profitMargins: {
        value: metrics.profitMargins,
        status: metrics.profitMargins >= 30 ? 'excellent' : 
                metrics.profitMargins >= 20 ? 'good' : 'needs-improvement'
      }
    };
  }, [dashboardData, getKeyMetrics]);

  return {
    // Data
    dashboardData,
    prescriptionAnalytics,
    orderAnalytics,
    aiAnalytics,
    userAnalytics,
    financialAnalytics,
    summaryData,
    
    // Loading states
    isLoading,
    dashboardLoading,
    prescriptionLoading,
    orderLoading,
    aiLoading,
    userLoading,
    financialLoading,
    summaryLoading,
    
    // Error states
    hasErrors,
    dashboardError,
    prescriptionError,
    orderError,
    aiError,
    userError,
    financialError,
    summaryError,
    
    // Mutations
    generateReportMutation,
    scheduleReportMutation,
    exportDataMutation,
    
    // Actions
    refreshAll,
    generateReport,
    scheduleReport,
    exportData,
    
    // Helpers
    getKeyMetrics,
    getPerformanceIndicators
  };
};

export default useAdvancedAnalytics;
