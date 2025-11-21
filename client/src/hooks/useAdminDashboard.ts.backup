/**
 * Admin Dashboard Hook for ILS 2.0
 * 
 * Provides admin dashboard functionality including:
 * - System health monitoring
 * - User management
 * - Analytics data
 * - Real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRealtimeNotifications } from './useRealtimeNotifications';
import type { NotificationData } from '../services/RealtimeService';

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  database: { status: string; responseTime: number; connectionCount: number };
  redis: { status: string; responseTime: number; memoryUsage: number };
  api: { status: string; averageResponseTime: number; requestsPerMinute: number; errorRate: number };
  ai: { status: string; modelAvailability: number; averageProcessingTime: number; queueLength: number };
  storage: { status: string; totalSpace: number; usedSpace: number; availableSpace: number };
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  usersByECP: Record<string, number>;
}

export interface DashboardStats {
  users: number;
  prescriptions: number;
  orders: number;
  systemUptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  nodeVersion: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const useAdminDashboard = () => {
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Use real-time notifications hook for admin alerts
  const realtimeNotifications = useRealtimeNotifications({
    onNotification: (notification: NotificationData) => {
      // Handle critical system alerts
      if (notification.type === 'system' && notification.priority === 'urgent') {
        // Auto-refresh health data when critical alerts arrive
        refetchHealth();
      }
    }
  });

  // System Health Query
  const {
    data: systemHealth,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth
  } = useQuery<SystemHealth>({
    queryKey: ['/api/admin/health'],
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds if auto-refresh enabled
  });

  // User Analytics Query
  const {
    data: userAnalytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery<UserAnalytics>({
    queryKey: ['/api/admin/analytics/users'],
    refetchInterval: autoRefresh ? 60000 : false, // 1 minute if auto-refresh enabled
  });

  // Dashboard Stats Query
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: autoRefresh ? 60000 : false, // 1 minute if auto-refresh enabled
  });

  // Activity Logs Query
  const {
    data: activityLogs,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs
  } = useQuery<{
    logs: ActivityLog[];
    total: number;
  }>({
    queryKey: ['/api/admin/activity-logs'],
    refetchInterval: autoRefresh ? 120000 : false, // 2 minutes if auto-refresh enabled
  });

  // Update User Role Mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest('PUT', '/api/admin/users/role', { userId, role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/users'] });
    }
  });

  // Update User Status Mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const response = await apiRequest('PUT', '/api/admin/users/status', { userId, active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/users'] });
    }
  });

  // Broadcast Health Mutation
  const broadcastHealthMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/broadcast/health');
      return response.json();
    }
  });

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetchHealth(),
      refetchAnalytics(),
      refetchStats(),
      refetchLogs()
    ]);
  }, [refetchHealth, refetchAnalytics, refetchStats, refetchLogs]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Format bytes helper
  const formatBytes = useCallback((bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Format uptime helper
  const formatUptime = useCallback((seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }, []);

  // Get health status color
  const getHealthColor = useCallback((status: string): string => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'disconnected':
      case 'down':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Calculate overall loading state
  const isLoading = healthLoading || analyticsLoading || statsLoading || logsLoading;

  // Calculate overall error state
  const hasErrors = !!(healthError || analyticsError || statsError || logsError);

  // Get system health summary
  const getHealthSummary = useCallback(() => {
    if (!systemHealth) return null;

    const services = [
      systemHealth.database.status === 'connected',
      systemHealth.redis.status === 'connected',
      systemHealth.api.status === 'operational',
      systemHealth.ai.status === 'operational'
    ];

    const healthyCount = services.filter(Boolean).length;
    const totalCount = services.length;

    return {
      healthyServices: healthyCount,
      totalServices: totalCount,
      healthPercentage: Math.round((healthyCount / totalCount) * 100)
    };
  }, [systemHealth]);

  // Get user growth metrics
  const getUserGrowthMetrics = useCallback(() => {
    if (!userAnalytics) return null;

    const { newUsersToday, newUsersThisWeek, newUsersThisMonth } = userAnalytics;
    
    return {
      dailyGrowth: newUsersToday,
      weeklyGrowth: newUsersThisWeek,
      monthlyGrowth: newUsersThisMonth,
      weeklyAverage: Math.round(newUsersThisWeek / 7),
      monthlyAverage: Math.round(newUsersThisMonth / 30)
    };
  }, [userAnalytics]);

  return {
    // Data
    systemHealth,
    userAnalytics,
    dashboardStats,
    activityLogs,
    
    // Loading states
    isLoading,
    healthLoading,
    analyticsLoading,
    statsLoading,
    logsLoading,
    
    // Error states
    hasErrors,
    healthError,
    analyticsError,
    statsError,
    logsError,
    
    // Mutations
    updateUserRoleMutation,
    updateUserStatusMutation,
    broadcastHealthMutation,
    
    // Actions
    refreshAll,
    toggleAutoRefresh,
    updateUserRole: updateUserRoleMutation.mutateAsync,
    updateUserStatus: updateUserStatusMutation.mutateAsync,
    broadcastHealth: broadcastHealthMutation.mutateAsync,
    
    // State
    autoRefresh,
    
    // Helpers
    formatBytes,
    formatUptime,
    getHealthColor,
    getHealthSummary,
    getUserGrowthMetrics
  };
};

export default useAdminDashboard;
