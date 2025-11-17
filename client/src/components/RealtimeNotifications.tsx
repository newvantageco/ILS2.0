/**
 * Real-time Notifications Component for ILS 2.0
 * 
 * Displays real-time notifications with:
 * - Toast notifications
 * - Notification center
 * - Unread count badge
 * - Mark as read functionality
 * - Notification filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { getRealtimeService, NotificationData, RealtimeEventHandlers } from '../services/RealtimeService';
import { cn } from '../lib/utils';

interface RealtimeNotificationsProps {
  className?: string;
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showBadge?: boolean;
  enableSounds?: boolean;
}

interface ToastNotification extends NotificationData {
  id: string;
  visible: boolean;
  removing: boolean;
}

export const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({
  className,
  maxVisible = 5,
  position = 'top-right',
  showBadge = true,
  enableSounds = true
}) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [allNotifications, setAllNotifications] = useState<NotificationData[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'prescription' | 'order' | 'ai_analysis' | 'system' | 'appointment'>('all');
  
  const realtimeService = getRealtimeService();

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  // Get notification icon based on type and priority
  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = 'w-5 h-5';
    
    switch (type) {
      case 'prescription':
        return <CheckCircle className={cn(iconClass, 'text-blue-500')} />;
      case 'order':
        return <Check className={cn(iconClass, 'text-green-500')} />;
      case 'ai_analysis':
        return <Info className={cn(iconClass, 'text-purple-500')} />;
      case 'appointment':
        return <AlertCircle className={cn(iconClass, 'text-orange-500')} />;
      case 'system':
        return <AlertTriangle className={cn(iconClass, 'text-red-500')} />;
      default:
        return <Info className={cn(iconClass, 'text-gray-500')} />;
    }
  };

  // Get priority color classes
  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-200 bg-red-50 text-red-900';
      case 'high':
        return 'border-orange-200 bg-orange-50 text-orange-900';
      case 'medium':
        return 'border-blue-200 bg-blue-50 text-blue-900';
      case 'low':
        return 'border-gray-200 bg-gray-50 text-gray-900';
      default:
        return 'border-gray-200 bg-white text-gray-900';
    }
  };

  // Handle new notification
  const handleNotification = useCallback((notification: NotificationData) => {
    // Add to toast notifications
    const toast: ToastNotification = {
      ...notification,
      id: `toast_${Date.now()}_${Math.random()}`,
      visible: false,
      removing: false
    };

    setToasts(prev => {
      const updated = [toast, ...prev].slice(0, maxVisible);
      return updated;
    });

    // Show toast with animation
    setTimeout(() => {
      setToasts(prev => 
        prev.map(t => t.id === toast.id ? { ...t, visible: true } : t)
      );
    }, 100);

    // Play sound if enabled
    if (enableSounds) {
      realtimeService.playNotificationSound(notification.priority);
    }

    // Auto-hide toast after 5 seconds (except urgent)
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        removeToast(toast.id);
      }, 5000);
    }

    // Update unread count
    setUnreadCount(prev => prev + 1);

    // Add to all notifications
    setAllNotifications(prev => [notification, ...prev]);
  }, [maxVisible, enableSounds, realtimeService]);

  // Remove toast notification
  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => 
      prev.map(t => t.id === toastId ? { ...t, removing: true } : t)
    );

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 300);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await realtimeService.markNotificationAsRead(notificationId);
      
      setAllNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [realtimeService]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = allNotifications.filter(n => !n.read);
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  }, [allNotifications, markAsRead]);

  // Filter notifications
  const filteredNotifications = allNotifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'prescription':
      case 'order':
      case 'ai_analysis':
      case 'system':
      case 'appointment':
        return notification.type === filter;
      default:
        return true;
    }
  });

  // Setup event handlers
  useEffect(() => {
    const handlers: RealtimeEventHandlers = {
      onNotification: handleNotification,
      onUnreadCountUpdate: setUnreadCount
    };

    realtimeService.setEventHandlers(handlers);

    // Request notification permission
    realtimeService.requestNotificationPermission();

    // Get initial unread count
    realtimeService.getUnreadCount();

    return () => {
      // Cleanup if needed
    };
  }, [realtimeService, handleNotification]);

  return (
    <>
      {/* Toast Notifications */}
      <div className={cn(
        'fixed z-50 space-y-2 pointer-events-none',
        positionClasses[position],
        className
      )}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto max-w-sm w-full bg-white rounded-lg shadow-lg border p-4 transform transition-all duration-300',
              toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
              toast.removing ? 'translate-x-full opacity-0' : '',
              getPriorityClasses(toast.priority)
            )}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getNotificationIcon(toast.type, toast.priority)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {toast.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {toast.message}
                </p>
                
                {toast.actionUrl && (
                  <button
                    onClick={() => window.location.href = toast.actionUrl!}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
                  >
                    View Details
                  </button>
                )}
              </div>
              
              <div className="flex-shrink-0 flex space-x-1">
                {!toast.read && (
                  <button
                    onClick={() => markAsRead(toast.id)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Bell with Badge */}
      {showBadge && (
        <div className="relative">
          <button
            onClick={() => setShowNotificationCenter(!showNotificationCenter)}
            className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <Bell className="w-6 h-6" />
            
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Center */}
          {showNotificationCenter && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotificationCenter(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex space-x-2 mt-3 overflow-x-auto">
                  {['all', 'unread', 'prescription', 'order', 'ai_analysis', 'system', 'appointment'].map(filterType => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType as any)}
                      className={cn(
                        'px-3 py-1 text-sm rounded-full whitespace-nowrap',
                        filter === filterType
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications list */}
              <div className="max-h-96 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredNotifications.map(notification => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 hover:bg-gray-50 transition-colors',
                          !notification.read && 'bg-blue-50'
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <span className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            
                            {notification.actionUrl && (
                              <button
                                onClick={() => window.location.href = notification.actionUrl!}
                                className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default RealtimeNotifications;
