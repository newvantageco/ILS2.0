/**
 * Automatic Timestamp and User Tracking Utilities
 * 
 * This module provides utilities to automatically track:
 * - Creation timestamp and user
 * - Last modification timestamp and user
 * - Change history with detailed timestamps
 */

import { type Request } from "express";

export interface TimestampFields {
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface ChangeHistoryEntry {
  timestamp: Date;
  userId: string;
  userName: string;
  userEmail: string;
  action: "created" | "updated" | "deleted" | "status_changed";
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
}

/**
 * Extract user information from authenticated request
 */
export function getUserInfo(req: any): {
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
} {
  const userId = req.user?.claims?.sub || req.user?.id || "system";
  const userName = req.user?.claims?.name || req.user?.name || "System";
  const userEmail = req.user?.claims?.email || req.user?.email || "system@ils.com";
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

  return { userId, userName, userEmail, ipAddress };
}

/**
 * Add creation timestamp and user to data
 */
export function addCreationTimestamp(data: any, req: any): any {
  const { userId, userName, userEmail, ipAddress } = getUserInfo(req);
  const now = new Date();

  return {
    ...data,
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
    changeHistory: [{
      timestamp: now,
      userId,
      userName,
      userEmail,
      action: "created" as const,
      ipAddress,
    }],
  };
}

/**
 * Add update timestamp and user to data
 */
export function addUpdateTimestamp(
  data: any, 
  req: any, 
  oldData?: any
): any {
  const { userId, userName, userEmail, ipAddress } = getUserInfo(req);
  const now = new Date();

  // Calculate what changed
  const changes: Record<string, { old: any; new: any }> = {};
  if (oldData) {
    Object.keys(data).forEach((key) => {
      if (data[key] !== oldData[key] && key !== 'updatedAt' && key !== 'updatedBy' && key !== 'changeHistory') {
        changes[key] = {
          old: oldData[key],
          new: data[key],
        };
      }
    });
  }

  // Get existing change history or create new array
  const existingHistory = oldData?.changeHistory || [];

  const historyEntry: ChangeHistoryEntry = {
    timestamp: now,
    userId,
    userName,
    userEmail,
    action: "updated",
    changes: Object.keys(changes).length > 0 ? changes : undefined,
    ipAddress,
  };

  return {
    ...data,
    updatedAt: now,
    updatedBy: userId,
    changeHistory: [...existingHistory, historyEntry],
  };
}

/**
 * Add status change to history
 */
export function addStatusChange(
  data: any,
  req: any,
  oldStatus: string,
  newStatus: string
): any {
  const { userId, userName, userEmail, ipAddress } = getUserInfo(req);
  const now = new Date();

  const existingHistory = data.changeHistory || [];

  const historyEntry: ChangeHistoryEntry = {
    timestamp: now,
    userId,
    userName,
    userEmail,
    action: "status_changed",
    changes: {
      status: { old: oldStatus, new: newStatus },
    },
    ipAddress,
  };

  return {
    ...data,
    updatedAt: now,
    updatedBy: userId,
    changeHistory: [...existingHistory, historyEntry],
  };
}

/**
 * Format timestamp for display (e.g., "2 Nov 2025, 11:30 PM by John Doe")
 */
export function formatTimestampWithUser(
  timestamp: Date | string,
  userName?: string,
  userEmail?: string
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  
  const formattedDate = date.toLocaleDateString('en-GB', options);
  
  if (userName) {
    return `${formattedDate} by ${userName}${userEmail ? ` (${userEmail})` : ''}`;
  }
  
  return formattedDate;
}

/**
 * Get relative time with user (e.g., "2 hours ago by John Doe")
 */
export function getRelativeTimeWithUser(
  timestamp: Date | string,
  userName?: string
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let timeStr = '';
  if (diffSecs < 60) {
    timeStr = 'just now';
  } else if (diffMins < 60) {
    timeStr = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatTimestampWithUser(date, userName);
  }

  return userName ? `${timeStr} by ${userName}` : timeStr;
}

/**
 * Middleware to automatically add timestamps to req.body
 */
export function timestampMiddleware(action: 'create' | 'update') {
  return (req: any, res: any, next: any) => {
    if (action === 'create') {
      req.body = addCreationTimestamp(req.body, req);
    } else {
      req.body = addUpdateTimestamp(req.body, req);
    }
    next();
  };
}
