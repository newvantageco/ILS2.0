/**
 * NotificationBell Component
 * 
 * Displays AI-generated proactive insights and daily briefings.
 * Shows in top-right corner with badge count for unread notifications.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Check, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  type: "briefing" | "alert" | "reminder" | "insight";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  summary?: string;
  recommendation?: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const response = await fetch("/api/ai-notifications/unread-count", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch unread count");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["ai-notifications"],
    queryFn: async () => {
      const response = await fetch("/api/ai-notifications?limit=20", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    enabled: isOpen, // Only fetch when panel is open
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationIds: string[] | "all") => {
      const response = await fetch("/api/ai-notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notificationIds }),
      });
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const unreadCount = unreadData?.count || 0;
  const notifications: Notification[] = notificationsData?.notifications || [];

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markReadMutation.mutate([notification.id]);
    }

    // Navigate if actionUrl exists
    if (notification.actionUrl) {
      setIsOpen(false);
      setLocation(notification.actionUrl);
    }
  };

  const handleMarkAllRead = () => {
    markReadMutation.mutate("all");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-900";
      case "high":
        return "bg-orange-50 border-orange-200 text-orange-900";
      case "medium":
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "low":
        return "bg-gray-50 border-gray-200 text-gray-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "ℹ️";
      case "low":
        return "📝";
      default:
        return "📬";
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900">
                AI Insights
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading insights...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No insights yet</p>
                  <p className="text-sm mt-1">
                    Check back tomorrow for your daily briefing
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? "bg-blue-50/30" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0 mt-1">
                          {getPriorityIcon(notification.priority)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                            {notification.message}
                          </p>
                          {notification.recommendation && (
                            <p className="text-sm text-blue-600 mt-2 font-medium">
                              💡 {notification.recommendation}
                            </p>
                          )}
                          {notification.actionUrl && (
                            <button className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-2">
                              {notification.actionLabel || "View Details"}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setLocation("/insights");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all insights →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
