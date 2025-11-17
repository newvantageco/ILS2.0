/**
 * Admin Dashboard Service for ILS 2.0
 * 
 * Comprehensive admin management system including:
 * - System health monitoring
 * - User management and analytics
 * - Performance metrics
 * - Configuration management
 * - Security monitoring
 */

import { logger } from '../utils/logger';
import { db } from '../db';
import { eq, desc, count, sum, avg, and, gte, lte, sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { getWebSocketService } from './WebSocketService';

export interface SystemHealthMetrics {
  overall: 'healthy' | 'warning' | 'critical';
  database: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime: number;
    connectionCount: number;
  };
  redis: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime: number;
    memoryUsage: number;
  };
  api: {
    status: 'operational' | 'degraded' | 'down';
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  ai: {
    status: 'operational' | 'degraded' | 'down';
    modelAvailability: number;
    averageProcessingTime: number;
    queueLength: number;
  };
  storage: {
    status: 'operational' | 'degraded' | 'down';
    totalSpace: number;
    usedSpace: number;
    availableSpace: number;
  };
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  usersByECP: Record<string, number>;
  topActiveUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    lastLogin: Date;
    activityScore: number;
  }>;
}

export interface PerformanceMetrics {
  apiResponseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  databaseQueries: {
    averageTime: number;
    slowQueries: number;
    totalQueries: number;
  };
  cachePerformance: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
  };
  errorRates: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
  };
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

export class AdminDashboardService {
  private webSocketService = getWebSocketService();

  /**
   * Get comprehensive system health metrics
   */
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      const [databaseHealth, redisHealth, apiHealth, aiHealth, storageHealth] = await Promise.all([
        this.getDatabaseHealth(),
        this.getRedisHealth(),
        this.getAPIHealth(),
        this.getAIHealth(),
        this.getStorageHealth()
      ]);

      // Determine overall health
      const healthScores = [
        databaseHealth.status === 'connected' ? 1 : 0,
        redisHealth.status === 'connected' ? 1 : 0,
        apiHealth.status === 'operational' ? 1 : 0,
        aiHealth.status === 'operational' ? 1 : 0,
        storageHealth.status === 'operational' ? 1 : 0
      ];

      let overall: 'healthy' | 'warning' | 'critical';
      if (healthScores.filter(score => score === 1).length >= 4) {
        overall = 'healthy';
      } else if (healthScores.filter(score => score === 1).length >= 2) {
        overall = 'warning';
      } else {
        overall = 'critical';
      }

      return {
        overall,
        database: databaseHealth,
        redis: redisHealth,
        api: apiHealth,
        ai: aiHealth,
        storage: storageHealth
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get system health');
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        usersByRole,
        usersByECP,
        topActiveUsers
      ] = await Promise.all([
        this.getTotalUsers(),
        this.getActiveUsers(),
        this.getNewUsersSince(today),
        this.getNewUsersSince(weekAgo),
        this.getNewUsersSince(monthAgo),
        this.getUsersByRole(),
        this.getUsersByECP(),
        this.getTopActiveUsers()
      ]);

      return {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        usersByRole,
        usersByECP,
        topActiveUsers
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get user analytics');
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const [apiMetrics, dbMetrics, cacheMetrics, errorMetrics] = await Promise.all([
        this.getAPIMetrics(),
        this.getDatabaseMetrics(),
        this.getCacheMetrics(),
        this.getErrorMetrics()
      ]);

      return {
        apiResponseTime: apiMetrics,
        databaseQueries: dbMetrics,
        cachePerformance: cacheMetrics,
        errorRates: errorMetrics
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get performance metrics');
      throw error;
    }
  }

  /**
   * Get activity logs with filtering
   */
  async getActivityLogs(options: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    logs: ActivityLog[];
    total: number;
  }> {
    try {
      const { limit = 50, offset = 0, userId, action, severity, startDate, endDate } = options;

      // Build query
      let query = db.select().from(schema.activityLogs);

      if (userId) {
        query = query.where(eq(schema.activityLogs.userId, userId));
      }

      if (action) {
        query = query.where(eq(schema.activityLogs.action, action));
      }

      if (severity) {
        query = query.where(eq(schema.activityLogs.severity, severity));
      }

      if (startDate) {
        query = query.where(gte(schema.activityLogs.timestamp, startDate));
      }

      if (endDate) {
        query = query.where(lte(schema.activityLogs.timestamp, endDate));
      }

      // Get logs and total count
      const [logs, totalResult] = await Promise.all([
        query.limit(limit).offset(offset).orderBy(desc(schema.activityLogs.timestamp)),
        db.select({ count: count() }).from(schema.activityLogs)
      ]);

      return {
        logs: logs.map(log => ({
          id: log.id,
          userId: log.userId,
          action: log.action,
          resource: log.resource,
          details: log.details,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          timestamp: log.timestamp,
          severity: log.severity
        })),
        total: totalResult[0].count
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get activity logs');
      throw error;
    }
  }

  /**
   * Get database health
   */
  private async getDatabaseHealth(): Promise<SystemHealthMetrics['database']> {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await db.select().from(schema.users).limit(1);
      
      const responseTime = Date.now() - startTime;
      
      // Get connection count (simplified)
      const connectionCount = 1; // Would need to query pg_stat_activity in production

      return {
        status: responseTime < 1000 ? 'connected' : 'error',
        responseTime,
        connectionCount
      };
    } catch (error) {
      return {
        status: 'disconnected',
        responseTime: 0,
        connectionCount: 0
      };
    }
  }

  /**
   * Get Redis health
   */
  private async getRedisHealth(): Promise<SystemHealthMetrics['redis']> {
    try {
      // Use existing Redis connection from queue config to avoid creating new connections
      const { getRedisConnection } = await import('../queue/config');
      const redisClient = getRedisConnection();
      
      if (!redisClient) {
        return {
          status: 'disconnected',
          responseTime: 0,
          memoryUsage: 0
        };
      }

      const startTime = Date.now();
      await redisClient.ping();
      const responseTime = Date.now() - startTime;
      
      const info = await redisClient.info('memory');
      const memoryUsage = this.parseRedisMemoryInfo(info);

      return {
        status: responseTime < 500 ? 'connected' : 'error',
        responseTime,
        memoryUsage
      };
    } catch (error) {
      return {
        status: 'disconnected',
        responseTime: 0,
        memoryUsage: 0
      };
    }
  }

  /**
   * Get API health
   */
  private async getAPIHealth(): Promise<SystemHealthMetrics['api']> {
    try {
      // This would typically query your metrics collection
      // For now, returning simulated data
      return {
        status: 'operational',
        averageResponseTime: 145,
        requestsPerMinute: 120,
        errorRate: 0.8
      };
    } catch (error) {
      return {
        status: 'down',
        averageResponseTime: 0,
        requestsPerMinute: 0,
        errorRate: 100
      };
    }
  }

  /**
   * Get AI service health
   */
  private async getAIHealth(): Promise<SystemHealthMetrics['ai']> {
    try {
      // Check AI service availability
      const response = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/health`);
      
      if (response.ok) {
        const health = await response.json();
        return {
          status: 'operational',
          modelAvailability: health.models_available || 0.95,
          averageProcessingTime: health.avg_processing_time || 2500,
          queueLength: health.queue_length || 0
        };
      } else {
        return {
          status: 'degraded',
          modelAvailability: 0,
          averageProcessingTime: 0,
          queueLength: 0
        };
      }
    } catch (error) {
      return {
        status: 'down',
        modelAvailability: 0,
        averageProcessingTime: 0,
        queueLength: 0
      };
    }
  }

  /**
   * Get storage health
   */
  private async getStorageHealth(): Promise<SystemHealthMetrics['storage']> {
    try {
      // This would typically query your storage provider
      // For now, returning simulated data
      const totalSpace = 100 * 1024 * 1024 * 1024; // 100GB
      const usedSpace = 45 * 1024 * 1024 * 1024; // 45GB
      const availableSpace = totalSpace - usedSpace;

      return {
        status: availableSpace > totalSpace * 0.1 ? 'operational' : 'degraded',
        totalSpace,
        usedSpace,
        availableSpace
      };
    } catch (error) {
      return {
        status: 'down',
        totalSpace: 0,
        usedSpace: 0,
        availableSpace: 0
      };
    }
  }

  /**
   * Helper methods for user analytics
   */
  private async getTotalUsers(): Promise<number> {
    const result = await db.select({ count: count() }).from(schema.users);
    return result[0].count;
  }

  private async getActiveUsers(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await db
      .select({ count: count() })
      .from(schema.users)
      .where(gte(schema.users.lastLogin, thirtyDaysAgo));
    return result[0].count;
  }

  private async getNewUsersSince(date: Date): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(schema.users)
      .where(gte(schema.users.createdAt, date));
    return result[0].count;
  }

  private async getUsersByRole(): Promise<Record<string, number>> {
    const result = await db
      .select({ role: schema.users.role, count: count() })
      .from(schema.users)
      .groupBy(schema.users.role);
    
    return result.reduce((acc, row) => {
      acc[row.role] = row.count;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getUsersByECP(): Promise<Record<string, number>> {
    const result = await db
      .select({ ecpId: schema.users.ecpId, count: count() })
      .from(schema.users)
      .where(sql`${schema.users.ecpId} IS NOT NULL`)
      .groupBy(schema.users.ecpId);
    
    return result.reduce((acc, row) => {
      acc[row.ecpId || 'unknown'] = row.count;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getTopActiveUsers(): Promise<UserAnalytics['topActiveUsers']> {
    // This would typically query user activity metrics
    // For now, returning empty array
    return [];
  }

  /**
   * Helper methods for performance metrics
   */
  private async getAPIMetrics(): Promise<PerformanceMetrics['apiResponseTime']> {
    // This would typically query your API metrics
    return {
      average: 145,
      p95: 280,
      p99: 450
    };
  }

  private async getDatabaseMetrics(): Promise<PerformanceMetrics['databaseQueries']> {
    // This would typically query your database metrics
    return {
      averageTime: 125,
      slowQueries: 3,
      totalQueries: 1250
    };
  }

  private async getCacheMetrics(): Promise<PerformanceMetrics['cachePerformance']> {
    // This would typically query your cache metrics
    return {
      hitRate: 94,
      missRate: 6,
      totalRequests: 890
    };
  }

  private async getErrorMetrics(): Promise<PerformanceMetrics['errorRates']> {
    // This would typically query your error metrics
    return {
      totalErrors: 12,
      errorRate: 0.8,
      errorsByType: {
        'ValidationError': 5,
        'AuthenticationError': 3,
        'DatabaseError': 2,
        'NetworkError': 2
      }
    };
  }

  /**
   * Parse Redis memory info
   */
  private parseRedisMemoryInfo(info: string): number {
    const lines = info.split('\r\n');
    const usedMemoryLine = lines.find(line => line.startsWith('used_memory:'));
    if (usedMemoryLine) {
      return parseInt(usedMemoryLine.split(':')[1]);
    }
    return 0;
  }

  /**
   * Broadcast system health update to admin users
   */
  async broadcastSystemHealth(): Promise<void> {
    try {
      const health = await this.getSystemHealth();
      
      if (this.webSocketService) {
        await this.webSocketService.sendToRole('admin', {
          id: `health_${Date.now()}`,
          type: 'system',
          title: 'System Health Update',
          message: `System status: ${health.overall.toUpperCase()}`,
          data: health,
          priority: health.overall === 'critical' ? 'urgent' : 
                   health.overall === 'warning' ? 'high' : 'low',
          timestamp: new Date(),
          read: false
        });
      }
    } catch (error) {
      logger.error({ error }, 'Failed to broadcast system health');
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;
