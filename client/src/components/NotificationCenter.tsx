import React, { useEffect, useState } from 'react';
import { Bell, Info, AlertCircle, CheckCircle, X, Sparkles, ExternalLink, TrendingUp } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SystemNotification {
  id: string;
  type: 'order_update' | 'equipment_status' | 'system_alert' | 'user_message';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  data?: Record<string, any>;
  createdAt: Date;
  read: boolean;
  source: 'system';
}

interface AINotification {
  id: string;
  type: 'briefing' | 'alert' | 'reminder' | 'insight';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  summary?: string;
  recommendation?: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  createdAt: string;
  source: 'ai';
}

type Notification = SystemNotification | AINotification;

export const NotificationCenter: React.FC = () => {
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [aiNotifications, setAINotifications] = useState<AINotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userId = user?.id;
  const ws = useWebSocket(userId ? `ws://localhost:3000/ws?userId=${userId}` : null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch initial notifications
    void fetchSystemNotifications();
    void fetchAINotifications();
  }, []);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        handleNewSystemNotification(notification);
      };
    }
  }, [ws]);

  useEffect(() => {
    // Update total unread count
    const systemUnread = systemNotifications.filter(n => !n.read).length;
    const aiUnread = aiNotifications.filter(n => !n.isRead).length;
    setUnreadCount(systemUnread + aiUnread);
  }, [systemNotifications, aiNotifications]);

  const fetchSystemNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', { credentials: 'include' });
      if (!response.ok) return;
      const data: any[] = await response.json();
      const hydrated = data.map(n => ({
        ...n,
        createdAt: new Date(n.createdAt),
        source: 'system' as const
      }));
      setSystemNotifications(hydrated);
    } catch (error) {
      console.error('Error fetching system notifications:', error);
    }
  };

  const fetchAINotifications = async () => {
    try {
      const response = await fetch('/api/ai-notifications?limit=20', { credentials: 'include' });
      if (!response.ok) return;
      const data = await response.json();
      const notifications = (data.notifications || []).map((n: any) => ({
        ...n,
        source: 'ai' as const
      }));
      setAINotifications(notifications);
    } catch (error) {
      console.error('Error fetching AI notifications:', error);
    }
  };

  const handleNewSystemNotification = (notification: any) => {
    const hydrated: SystemNotification = {
      ...notification,
      createdAt: new Date(notification.createdAt),
      source: 'system'
    };
    setSystemNotifications(prev => [hydrated, ...prev]);
    
    // Show toast for new notification
    toast({
      title: hydrated.title,
      description: hydrated.message,
      variant: hydrated.severity === 'error' ? 'destructive' : 'default'
    });
  };

  const markSystemAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
      setSystemNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking system notification as read:', error);
    }
  };

  const markAIAsRead = async (id: string) => {
    try {
      await fetch('/api/ai-notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setAINotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking AI notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all([
        fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' }),
        fetch('/api/ai-notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notificationIds: 'all' }),
        })
      ]);
      
      setSystemNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setAINotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteSystemNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE', credentials: 'include' });
      setSystemNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting system notification:', error);
    }
  };

  const getSeverityIcon = (severity: SystemNotification['severity']) => {
    switch (severity) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityIcon = (priority: AINotification['priority']) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleAINotificationClick = (notification: AINotification) => {
    if (!notification.isRead) {
      markAIAsRead(notification.id);
    }
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
    }
  };

  const allNotifications = [
    ...systemNotifications.map(n => ({ ...n, sortDate: n.createdAt })),
    ...aiNotifications.map(n => ({ ...n, sortDate: new Date(n.createdAt) }))
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </CardHeader>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-3 px-4 pt-2">
              <TabsTrigger value="all">
                All ({allNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="system">
                System ({systemNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="h-3 w-3 mr-1" />
                AI ({aiNotifications.length})
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[400px]">
              <TabsContent value="all" className="mt-0">
                {allNotifications.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">
                    No notifications
                  </p>
                ) : (
                  allNotifications.map((notification) => {
                    const isSystem = notification.source === 'system';
                    const isRead = isSystem 
                      ? (notification as SystemNotification).read 
                      : (notification as AINotification).isRead;
                    
                    return (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-3 p-4 border-b hover:bg-muted/50 transition-colors ${
                          !isRead ? 'bg-muted/30' : ''
                        }`}
                      >
                        <div className="mt-1 shrink-0">
                          {isSystem ? (
                            getSeverityIcon((notification as SystemNotification).severity)
                          ) : (
                            <div className="relative">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                            </div>
                          )}
                        </div>
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (!isSystem) {
                              handleAINotificationClick(notification as AINotification);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium leading-tight">
                              {notification.title}
                            </h4>
                            {!isSystem && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                AI
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          {!isSystem && (notification as AINotification).recommendation && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                              💡 {(notification as AINotification).recommendation}
                            </p>
                          )}
                          {!isSystem && (notification as AINotification).actionLabel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 mt-2 text-xs text-blue-600 hover:text-blue-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAINotificationClick(notification as AINotification);
                              }}
                            >
                              {(notification as AINotification).actionLabel}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.sortDate.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {!isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                if (isSystem) {
                                  markSystemAsRead(notification.id);
                                } else {
                                  markAIAsRead(notification.id);
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {isSystem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => deleteSystemNotification(notification.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="system" className="mt-0">
                {systemNotifications.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">
                    No system notifications
                  </p>
                ) : (
                  systemNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-4 border-b hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className="mt-1">
                        {getSeverityIcon(notification.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.createdAt.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => markSystemAsRead(notification.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => deleteSystemNotification(notification.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="ai" className="mt-0">
                {aiNotifications.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">
                    No AI notifications
                  </p>
                ) : (
                  aiNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''
                      }`}
                      onClick={() => handleAINotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getPriorityIcon(notification.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium leading-tight">
                              {notification.title}
                            </h4>
                            <Badge 
                              variant={notification.priority === 'critical' ? 'destructive' : 'outline'}
                              className="text-xs shrink-0"
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          {notification.recommendation && (
                            <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded text-xs">
                              <span className="font-medium">💡 Recommendation:</span>
                              <p className="mt-1">{notification.recommendation}</p>
                            </div>
                          )}
                          {notification.actionLabel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 mt-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              {notification.actionLabel}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAIAsRead(notification.id);
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </Card>
      </PopoverContent>
    </Popover>
  );
};