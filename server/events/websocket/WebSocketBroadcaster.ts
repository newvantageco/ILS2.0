/**
 * WebSocket Broadcaster
 * 
 * Broadcasts events to connected WebSocket clients in real-time.
 * Integrates with existing WebSocket service.
 */

import { EventBus } from '../EventBus';
import type { Event } from '../EventBus';

/**
 * WebSocket connection tracking
 * In production, this would integrate with the existing WebSocket service
 */
interface WebSocketConnection {
  userId?: string;
  companyId?: string;
  socket: any; // WebSocket instance
}

/**
 * WebSocket Broadcaster Class
 */
export class WebSocketBroadcaster {
  private static connections: Map<string, WebSocketConnection> = new Map();

  /**
   * Register a WebSocket connection
   */
  static registerConnection(
    connectionId: string,
    socket: any,
    userId?: string,
    companyId?: string
  ): void {
    this.connections.set(connectionId, {
      userId,
      companyId,
      socket,
    });

    console.log(`WebSocket connected: ${connectionId} (user: ${userId}, company: ${companyId})`);
  }

  /**
   * Unregister a WebSocket connection
   */
  static unregisterConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    console.log(`WebSocket disconnected: ${connectionId}`);
  }

  /**
   * Broadcast event to specific user
   */
  static async broadcastToUser(userId: string, event: Event): Promise<void> {
    const userConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.userId === userId
    );

    if (userConnections.length === 0) {
      console.log(`No WebSocket connections for user: ${userId}`);
      return;
    }

    const message = JSON.stringify({
      type: 'event',
      event: {
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
      },
    });

    for (const conn of userConnections) {
      try {
        conn.socket.send(message);
      } catch (error) {
        console.error(`Failed to send to WebSocket:`, error);
      }
    }

    console.log(`✅ Broadcast to user ${userId}: ${event.type} (${userConnections.length} connections)`);
  }

  /**
   * Broadcast event to all users in a company
   */
  static async broadcastToCompany(companyId: string, event: Event): Promise<void> {
    const companyConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.companyId === companyId
    );

    if (companyConnections.length === 0) {
      console.log(`No WebSocket connections for company: ${companyId}`);
      return;
    }

    const message = JSON.stringify({
      type: 'event',
      event: {
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
      },
    });

    for (const conn of companyConnections) {
      try {
        conn.socket.send(message);
      } catch (error) {
        console.error(`Failed to send to WebSocket:`, error);
      }
    }

    console.log(`✅ Broadcast to company ${companyId}: ${event.type} (${companyConnections.length} connections)`);
  }

  /**
   * Broadcast event to all connected clients
   */
  static async broadcastToAll(event: Event): Promise<void> {
    const message = JSON.stringify({
      type: 'event',
      event: {
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
      },
    });

    const allConnections = Array.from(this.connections.values());
    for (const conn of allConnections) {
      try {
        conn.socket.send(message);
      } catch (error) {
        console.error(`Failed to send to WebSocket:`, error);
      }
    }

    console.log(`✅ Broadcast to all: ${event.type} (${this.connections.size} connections)`);
  }

  /**
   * Initialize WebSocket event listeners
   */
  static initialize(): void {
    // Broadcast user-specific events
    EventBus.subscribe('*', async (event: Event) => {
      if (event.userId) {
        await this.broadcastToUser(event.userId, event);
      }
      
      if (event.companyId) {
        await this.broadcastToCompany(event.companyId, event);
      }
    });

    console.log('✅ WebSocket broadcaster initialized');
  }

  /**
   * Get connection count
   */
  static getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get connections for user
   */
  static getUserConnectionCount(userId: string): number {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.userId === userId
    ).length;
  }

  /**
   * Get connections for company
   */
  static getCompanyConnectionCount(companyId: string): number {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.companyId === companyId
    ).length;
  }
}
