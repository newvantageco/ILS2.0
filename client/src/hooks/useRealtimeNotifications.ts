/**
 * React Hook for Real-time Notifications
 * 
 * Provides easy integration with real-time notifications:
 * - Automatic connection management
 * - Notification state management
 * - Event handling
 * - Permission management
 */

import { useEffect, useState, useCallback } from 'react';
import { getRealtimeService, NotificationData, RealtimeEventHandlers } from '../services/RealtimeService';

interface UseRealtimeNotificationsOptions {
  autoConnect?: boolean;
  showBrowserNotifications?: boolean;
  enableSounds?: boolean;
  onNotification?: (notification: NotificationData) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

interface UseRealtimeNotificationsReturn {
  isConnected: boolean;
  unreadCount: number;
  notifications: NotificationData[];
  requestPermission: () => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<void>;
  getUnreadCount: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  connectionStats: {
    connected: boolean;
    joinedRooms: number;
    reconnectAttempts: number;
    socketId: string | null;
  };
}

export const useRealtimeNotifications = (
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn => {
  const {
    autoConnect = true,
    showBrowserNotifications = true,
    enableSounds = true,
    onNotification,
    onConnected,
    onDisconnected,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const realtimeService = getRealtimeService();

  // Handle new notification
  const handleNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
    
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // Call custom handler
    onNotification?.(notification);
  }, [onNotification]);

  // Handle connection events
  const handleConnected = useCallback(() => {
    setIsConnected(true);
    onConnected?.();
  }, [onConnected]);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    onDisconnected?.();
  }, [onDisconnected]);

  const handleError = useCallback((error: Error) => {
    onError?.(error);
  }, [onError]);

  // Handle unread count updates
  const handleUnreadCountUpdate = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!showBrowserNotifications) return false;
    
    const granted = await realtimeService.requestNotificationPermission();
    setPermissionGranted(granted);
    return granted;
  }, [realtimeService, showBrowserNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await realtimeService.markNotificationAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [realtimeService]);

  // Get unread count
  const getUnreadCount = useCallback(async (): Promise<void> => {
    try {
      await realtimeService.getUnreadCount();
    } catch (error) {
      console.error('Failed to get unread count:', error);
    }
  }, [realtimeService]);

  // Join room
  const joinRoom = useCallback(async (roomId: string): Promise<void> => {
    try {
      await realtimeService.joinRoom(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  }, [realtimeService]);

  // Leave room
  const leaveRoom = useCallback(async (roomId: string): Promise<void> => {
    try {
      await realtimeService.leaveRoom(roomId);
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  }, [realtimeService]);

  // Get connection stats
  const connectionStats = realtimeService.getStats();

  // Setup event handlers
  useEffect(() => {
    const handlers: RealtimeEventHandlers = {
      onNotification: handleNotification,
      onConnected: handleConnected,
      onDisconnected: handleDisconnected,
      onError: handleError,
      onUnreadCountUpdate: handleUnreadCountUpdate
    };

    realtimeService.setEventHandlers(handlers);

    // Request permission if enabled
    if (showBrowserNotifications) {
      requestPermission();
    }

    // Get initial unread count
    getUnreadCount();

    return () => {
      // Cleanup if needed
    };
  }, [
    realtimeService,
    handleNotification,
    handleConnected,
    handleDisconnected,
    handleError,
    handleUnreadCountUpdate,
    showBrowserNotifications,
    requestPermission,
    getUnreadCount
  ]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect) {
      // Service auto-connects on initialization
    }
  }, [autoConnect]);

  return {
    isConnected,
    unreadCount,
    notifications,
    requestPermission,
    markAsRead,
    getUnreadCount,
    joinRoom,
    leaveRoom,
    connectionStats
  };
};

export default useRealtimeNotifications;
