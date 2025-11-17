/**
 * Real-time WebSocket Service for ILS 2.0 Frontend
 * 
 * Comprehensive real-time communication client including:
 * - WebSocket connection management
 * - Real-time notifications
 * - Live status updates
 * - Room-based messaging
 * - Connection resilience and retry logic
 */

import { io, Socket } from 'socket.io-client';

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

export interface RealtimeEventHandlers {
  onNotification?: (notification: NotificationData) => void;
  onMessage?: (message: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onRoomJoined?: (roomId: string) => void;
  onRoomLeft?: (roomId: string) => void;
  onUnreadCountUpdate?: (count: number) => void;
  onNotificationRead?: (notificationId: string) => void;
}

export class RealtimeService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: RealtimeEventHandlers = {};
  private connectionPromise: Promise<void> | null = null;
  private joinedRooms = new Set<string>();

  constructor() {
    this.initializeConnection();
  }

  /**
   * Initialize WebSocket connection
   */
  private async initializeConnection(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const token = this.getAuthToken();
        
        if (!token) {
          reject(new Error('No authentication token available'));
          return;
        }

        this.socket = io(process.env.VITE_WS_URL || 'http://localhost:5000', {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });

        this.setupEventHandlers();
        
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.eventHandlers.onConnected?.();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          this.isConnected = false;
          this.eventHandlers.onError?.(error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.eventHandlers.onDisconnected?.();
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.reconnect();
      }
    });

    this.socket.on('reconnect', () => {
      this.isConnected = true;
      this.eventHandlers.onConnected?.();
      
      // Rejoin all rooms after reconnection
      this.rejoinRooms();
    });

    this.socket.on('reconnect_error', (error) => {
      this.eventHandlers.onError?.(error);
    });

    // Notification events
    this.socket.on('notification', (notification: NotificationData) => {
      this.handleNotification(notification);
    });

    this.socket.on('notification-read', (data: { notificationId: string }) => {
      this.eventHandlers.onNotificationRead?.(data.notificationId);
    });

    this.socket.on('unread-count', (data: { count: number }) => {
      this.eventHandlers.onUnreadCountUpdate?.(data.count);
    });

    // Room events
    this.socket.on('room-joined', (data: { roomId: string }) => {
      this.joinedRooms.add(data.roomId);
      this.eventHandlers.onRoomJoined?.(data.roomId);
    });

    this.socket.on('room-left', (data: { roomId: string }) => {
      this.joinedRooms.delete(data.roomId);
      this.eventHandlers.onRoomLeft?.(data.roomId);
    });

    // Message events
    this.socket.on('message', (message: any) => {
      this.eventHandlers.onMessage?.(message);
    });
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(notification: NotificationData): void {
    // Show browser notification if permitted
    this.showBrowserNotification(notification);
    
    // Call custom handler
    this.eventHandlers.onNotification?.(notification);
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: NotificationData): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent' || notification.priority === 'high'
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto-close notification after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent' && notification.priority !== 'high') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Reconnect to WebSocket
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.eventHandlers.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    setTimeout(async () => {
      try {
        await this.initializeConnection();
      } catch (error) {
        this.reconnect();
      }
    }, delay);
  }

  /**
   * Rejoin all rooms after reconnection
   */
  private rejoinRooms(): void {
    this.joinedRooms.forEach(roomId => {
      this.socket?.emit('join-room', roomId);
    });
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string | null {
    // Try multiple sources for the token
    const token = localStorage.getItem('authToken') || 
                  sessionStorage.getItem('authToken') ||
                  document.cookie.split(';').find(c => c.trim().startsWith('authToken='))?.split('=')[1];
    
    return token || null;
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: RealtimeEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Join a room
   */
  async joinRoom(roomId: string): Promise<void> {
    await this.ensureConnected();
    this.socket?.emit('join-room', roomId);
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string): Promise<void> {
    await this.ensureConnected();
    this.socket?.emit('leave-room', roomId);
  }

  /**
   * Send message to room
   */
  async sendMessage(roomId: string, message: any, type?: string): Promise<void> {
    await this.ensureConnected();
    this.socket?.emit('send-message', { roomId, message, type });
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.ensureConnected();
    this.socket?.emit('mark-notification-read', notificationId);
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<void> {
    await this.ensureConnected();
    this.socket?.emit('get-unread-count');
  }

  /**
   * Ensure connection is established
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.initializeConnection();
    }
  }

  /**
   * Get connection status
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get joined rooms
   */
  getJoinedRooms(): string[] {
    return Array.from(this.joinedRooms);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.joinedRooms.clear();
    this.connectionPromise = null;
  }

  /**
   * Create notification sound
   */
  playNotificationSound(priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): void {
    try {
      const audio = new Audio();
      
      switch (priority) {
        case 'urgent':
          audio.src = '/sounds/urgent-notification.mp3';
          break;
        case 'high':
          audio.src = '/sounds/high-notification.mp3';
          break;
        case 'medium':
          audio.src = '/sounds/medium-notification.mp3';
          break;
        case 'low':
          audio.src = '/sounds/low-notification.mp3';
          break;
      }
      
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors (audio might be blocked by browser)
      });
    } catch (error) {
      // Ignore audio errors
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    connected: boolean;
    joinedRooms: number;
    reconnectAttempts: number;
    socketId: string | null;
  } {
    return {
      connected: this.isConnected,
      joinedRooms: this.joinedRooms.size,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null
    };
  }
}

// Singleton instance
let realtimeService: RealtimeService | null = null;

export function getRealtimeService(): RealtimeService {
  if (!realtimeService) {
    realtimeService = new RealtimeService();
  }
  return realtimeService;
}

export default realtimeService;
