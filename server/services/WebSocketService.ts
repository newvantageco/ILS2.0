/**
 * WebSocket Service for ILS 2.0 Real-time Features
 * 
 * Comprehensive real-time communication system including:
 * - WebSocket connection management
 * - Real-time notifications
 * - Live status updates
 * - Room-based messaging
 * - Authentication and authorization
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { createAuthService } from './AuthService';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

// Create a singleton auth service instance
const authService = createAuthService();

export interface NotificationData {
  id: string;
  type: 'prescription' | 'order' | 'ai_analysis' | 'system' | 'appointment';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  ecpId?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface WebSocketClient {
  id: string;
  userId: string;
  ecpId?: string;
  role: string;
  socket: any;
  joinedRooms: Set<string>;
  lastActivity: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private ecpSockets: Map<string, Set<string>> = new Map(); // ecpId -> socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || [
          "http://localhost:3000",
          "http://localhost:5173"
        ],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.initializeEventHandlers();
    this.startCleanupInterval();
  }

  /**
   * Initialize WebSocket event handlers
   */
  private initializeEventHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));
    
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket service initialized');
  }

  /**
   * Authenticate WebSocket connection
   */
  private async authenticateSocket(socket: any, next: Function): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = await authService.verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid authentication token'));
      }

      // Get user details
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, decoded.sub)
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.ecpId = user.ecpId;
      socket.role = user.role;
      
      next();
    } catch (error) {
      logger.warn({ error }, 'WebSocket authentication failed');
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: any): void {
    const client: WebSocketClient = {
      id: socket.id,
      userId: socket.userId,
      ecpId: socket.ecpId,
      role: socket.role,
      socket,
      joinedRooms: new Set(),
      lastActivity: new Date()
    };

    this.clients.set(socket.id, client);

    // Track user sockets
    if (!this.userSockets.has(client.userId)) {
      this.userSockets.set(client.userId, new Set());
    }
    this.userSockets.get(client.userId)!.add(socket.id);

    // Track ECP sockets
    if (client.ecpId) {
      if (!this.ecpSockets.has(client.ecpId)) {
        this.ecpSockets.set(client.ecpId, new Set());
      }
      this.ecpSockets.get(client.ecpId)!.add(socket.id);
    }

    // Join default rooms
    this.joinDefaultRooms(socket, client);

    // Setup event handlers
    this.setupSocketEventHandlers(socket, client);

    // Send welcome notification
    this.sendNotification(client.userId, {
      id: this.generateNotificationId(),
      type: 'system',
      title: 'Connected',
      message: 'Real-time notifications are now active',
      priority: 'low',
      userId: client.userId,
      timestamp: new Date(),
      read: false
    });

    logger.info('Client connected via WebSocket', {
      socketId: socket.id,
      userId: client.userId,
      ecpId: client.ecpId,
      role: client.role
    });
  }

  /**
   * Join default rooms based on user role and ECP
   */
  private joinDefaultRooms(socket: any, client: WebSocketClient): void {
    // Join user-specific room
    socket.join(`user:${client.userId}`);

    // Join ECP room if applicable
    if (client.ecpId) {
      socket.join(`ecp:${client.ecpId}`);
    }

    // Join role-based rooms
    socket.join(`role:${client.role}`);

    // Join general notifications room
    socket.join('notifications');

    client.joinedRooms.add(`user:${client.userId}`);
    if (client.ecpId) {
      client.joinedRooms.add(`ecp:${client.ecpId}`);
    }
    client.joinedRooms.add(`role:${client.role}`);
    client.joinedRooms.add('notifications');
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEventHandlers(socket: any, client: WebSocketClient): void {
    // Join custom room
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      client.joinedRooms.add(roomId);
      client.lastActivity = new Date();
      
      socket.emit('room-joined', { roomId });
      logger.debug('Client joined room', { socketId: socket.id, roomId });
    });

    // Leave room
    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      client.joinedRooms.delete(roomId);
      client.lastActivity = new Date();
      
      socket.emit('room-left', { roomId });
      logger.debug('Client left room', { socketId: socket.id, roomId });
    });

    // Send message to room
    socket.on('send-message', (data: { roomId: string; message: any; type?: string }) => {
      client.lastActivity = new Date();
      
      socket.to(data.roomId).emit('message', {
        ...data,
        from: client.userId,
        timestamp: new Date()
      });
    });

    // Mark notification as read
    socket.on('mark-notification-read', (notificationId: string) => {
      client.lastActivity = new Date();
      this.markNotificationAsRead(client.userId, notificationId);
    });

    // Get unread notifications count
    socket.on('get-unread-count', () => {
      client.lastActivity = new Date();
      this.getUnreadNotificationsCount(client.userId);
    });

    // Handle disconnect
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnect(socket, client, reason);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error({ error, socketId: socket.id }, 'WebSocket error');
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(socket: any, client: WebSocketClient, reason: string): void {
    this.clients.delete(socket.id);

    // Remove from user sockets
    const userSocketSet = this.userSockets.get(client.userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(client.userId);
      }
    }

    // Remove from ECP sockets
    if (client.ecpId) {
      const ecpSocketSet = this.ecpSockets.get(client.ecpId);
      if (ecpSocketSet) {
        ecpSocketSet.delete(socket.id);
        if (ecpSocketSet.size === 0) {
          this.ecpSockets.delete(client.ecpId);
        }
      }
    }

    logger.info('Client disconnected from WebSocket', {
      socketId: socket.id,
      userId: client.userId,
      reason
    });
  }

  /**
   * Send notification to specific user
   */
  async sendNotification(userId: string, notification: NotificationData): Promise<void> {
    try {
      // Store notification in database
      await this.storeNotification(notification);

      // Send to user's connected sockets
      const userSocketIds = this.userSockets.get(userId);
      if (userSocketIds && userSocketIds.size > 0) {
        this.io.to(`user:${userId}`).emit('notification', notification);
        
        logger.info('Notification sent via WebSocket', {
          userId,
          type: notification.type,
          priority: notification.priority,
          socketCount: userSocketIds.size
        });
      }
    } catch (error) {
      logger.error({ error, userId }, 'Failed to send notification');
    }
  }

  /**
   * Send notification to all ECP users
   */
  async sendToECP(ecpId: string, notification: Omit<NotificationData, 'userId'>): Promise<void> {
    try {
      const ecpSocketIds = this.ecpSockets.get(ecpId);
      if (ecpSocketIds && ecpSocketIds.size > 0) {
        this.io.to(`ecp:${ecpId}`).emit('notification', {
          ...notification,
          id: this.generateNotificationId()
        });
        
        logger.info('ECP notification sent via WebSocket', {
          ecpId,
          type: notification.type,
          socketCount: ecpSocketIds.size
        });
      }
    } catch (error) {
      logger.error({ error, ecpId }, 'Failed to send ECP notification');
    }
  }

  /**
   * Send notification to role-based group
   */
  async sendToRole(role: string, notification: Omit<NotificationData, 'userId'>): Promise<void> {
    try {
      this.io.to(`role:${role}`).emit('notification', {
        ...notification,
        id: this.generateNotificationId()
      });
      
      logger.info('Role notification sent via WebSocket', {
        role,
        type: notification.type
      });
    } catch (error) {
      logger.error({ error, role }, 'Failed to send role notification');
    }
  }

  /**
   * Broadcast to all connected clients
   */
  async broadcast(notification: Omit<NotificationData, 'userId'>): Promise<void> {
    try {
      this.io.emit('notification', {
        ...notification,
        id: this.generateNotificationId()
      });
      
      logger.info('Broadcast notification sent', {
        type: notification.type,
        clientCount: this.clients.size
      });
    } catch (error) {
      logger.error({ error }, 'Failed to broadcast notification');
    }
  }

  /**
   * Store notification in database
   */
  private async storeNotification(notification: NotificationData): Promise<void> {
    try {
      await db.insert(schema.notifications).values({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        priority: notification.priority,
        read: false,
        actionUrl: notification.actionUrl || null,
        createdAt: notification.timestamp
      });
    } catch (error) {
      logger.error({ error }, 'Failed to store notification in database');
    }
  }

  /**
   * Mark notification as read
   */
  private async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await db
        .update(schema.notifications)
        .set({ read: true, readAt: new Date() })
        .where(eq(schema.notifications.id, notificationId))
        .where(eq(schema.notifications.userId, userId));

      // Send confirmation to user's sockets
      this.io.to(`user:${userId}`).emit('notification-read', { notificationId });
    } catch (error) {
      logger.error({ error, userId, notificationId }, 'Failed to mark notification as read');
    }
  }

  /**
   * Get unread notifications count
   */
  private async getUnreadNotificationsCount(userId: string): Promise<void> {
    try {
      const result = await db.query.notifications.findMany({
        where: and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.read, false)
        )
      });

      const count = result.length;
      this.io.to(`user:${userId}`).emit('unread-count', { count });
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get unread notifications count');
    }
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start cleanup interval for inactive connections
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 300000); // Every 5 minutes
  }

  /**
   * Cleanup inactive connections
   */
  private cleanupInactiveConnections(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    this.clients.forEach((client, socketId) => {
      if (now.getTime() - client.lastActivity.getTime() > inactiveThreshold) {
        client.socket.disconnect(true);
        logger.info('Cleaned up inactive connection', { socketId });
      }
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    userConnections: number;
    ecpConnections: number;
    connectionsByRole: Record<string, number>;
  } {
    const connectionsByRole: Record<string, number> = {};

    this.clients.forEach(client => {
      connectionsByRole[client.role] = (connectionsByRole[client.role] || 0) + 1;
    });

    return {
      totalConnections: this.clients.size,
      userConnections: this.userSockets.size,
      ecpConnections: this.ecpSockets.size,
      connectionsByRole
    };
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    this.io.close();
    this.clients.clear();
    this.userSockets.clear();
    this.ecpSockets.clear();
    logger.info('WebSocket service shutdown completed');
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export function initializeWebSocket(server: HTTPServer): WebSocketService {
  if (!webSocketService) {
    webSocketService = new WebSocketService(server);
  }
  return webSocketService;
}

export function getWebSocketService(): WebSocketService | null {
  return webSocketService;
}

export default webSocketService;
