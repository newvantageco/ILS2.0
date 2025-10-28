/**
 * WebSocket Real-Time Sync Service
 * 
 * Provides real-time bidirectional communication for:
 * - Order status updates (sub-second propagation)
 * - Anomaly alerts
 * - Bottleneck notifications
 * - Dashboard metrics updates
 * 
 * Supports landing page promises:
 * - "Status updates reach your system in under 1 second"
 * - "Sub-second status propagation"
 * - "Real-time visibility - both systems always in sync"
 */

import { WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";
import { createLogger, type Logger } from "./utils/logger";
import type { IncomingMessage } from "http";

export interface WebSocketMessage {
  type: "order_status" | "anomaly_alert" | "bottleneck_alert" | "metric_update" | "lims_sync";
  payload: any;
  timestamp: string;
  organizationId?: string;
}

export interface ConnectedClient {
  id: string;
  socket: WebSocket;
  userId: string;
  organizationId: string;
  roles: string[];
  connectedAt: Date;
  lastActivity: Date;
}

export class WebSocketService {
  private logger: Logger;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private rooms: Map<string, Set<string>> = new Map(); // organizationId -> Set<clientId>
  
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly CLIENT_TIMEOUT = 60000; // 60 seconds
  private heartbeatTimer?: NodeJS.Timeout;

  constructor() {
    this.logger = createLogger("WebSocketService");
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.logger.info("Initializing WebSocket server");

    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: "/ws",
    });

    this.wss.on("connection", (socket: WebSocket, request: IncomingMessage) => {
      this.handleConnection(socket, request);
    });

    this.wss.on("error", (error) => {
      this.logger.error("WebSocket server error", error);
    });

    // Start heartbeat monitoring
    this.startHeartbeat();

    this.logger.info("WebSocket server initialized", {
      path: "/ws",
      heartbeatInterval: this.HEARTBEAT_INTERVAL,
    });
  }

  /**
   * Broadcast order status update to all clients in organization
   */
  broadcastOrderStatus(orderId: string, status: string, organizationId: string, metadata?: any): void {
    const message: WebSocketMessage = {
      type: "order_status",
      payload: {
        orderId,
        status,
        ...metadata,
      },
      timestamp: new Date().toISOString(),
      organizationId,
    };

    this.broadcastToRoom(organizationId, message);
    
    this.logger.debug("Order status broadcasted", {
      orderId,
      status,
      organizationId,
      recipients: this.rooms.get(organizationId)?.size || 0,
    });
  }

  /**
   * Broadcast anomaly alert
   */
  broadcastAnomalyAlert(alert: any, organizationId: string): void {
    const message: WebSocketMessage = {
      type: "anomaly_alert",
      payload: alert,
      timestamp: new Date().toISOString(),
      organizationId,
    };

    this.broadcastToRoom(organizationId, message);
    
    this.logger.warn("Anomaly alert broadcasted", {
      alertType: alert.type,
      severity: alert.severity,
      organizationId,
    });
  }

  /**
   * Broadcast bottleneck notification
   */
  broadcastBottleneckAlert(bottleneck: any, organizationId: string): void {
    const message: WebSocketMessage = {
      type: "bottleneck_alert",
      payload: bottleneck,
      timestamp: new Date().toISOString(),
      organizationId,
    };

    this.broadcastToRoom(organizationId, message);
    
    this.logger.warn("Bottleneck alert broadcasted", {
      location: bottleneck.location,
      severity: bottleneck.severity,
      organizationId,
    });
  }

  /**
   * Broadcast metric update (for real-time dashboards)
   */
  broadcastMetricUpdate(metric: string, value: number, organizationId: string): void {
    const message: WebSocketMessage = {
      type: "metric_update",
      payload: {
        metric,
        value,
      },
      timestamp: new Date().toISOString(),
      organizationId,
    };

    this.broadcastToRoom(organizationId, message);
  }

  /**
   * Broadcast LIMS sync event
   */
  broadcastLimsSync(jobId: string, jobStatus: string, orderId: string, organizationId: string): void {
    const message: WebSocketMessage = {
      type: "lims_sync",
      payload: {
        jobId,
        jobStatus,
        orderId,
      },
      timestamp: new Date().toISOString(),
      organizationId,
    };

    this.broadcastToRoom(organizationId, message);
    
    this.logger.debug("LIMS sync broadcasted", {
      jobId,
      jobStatus,
      orderId,
      organizationId,
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    connectionsByOrganization: Record<string, number>;
    activeClients: ConnectedClient[];
  } {
    const connectionsByOrganization: Record<string, number> = {};
    
    this.rooms.forEach((clientIds, orgId) => {
      connectionsByOrganization[orgId] = clientIds.size;
    });

    return {
      totalConnections: this.clients.size,
      connectionsByOrganization,
      activeClients: Array.from(this.clients.values()),
    };
  }

  /**
   * Close all connections and shutdown
   */
  shutdown(): void {
    this.logger.info("Shutting down WebSocket server");

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.socket.close(1000, "Server shutdown");
    });

    this.clients.clear();
    this.rooms.clear();

    if (this.wss) {
      this.wss.close();
    }

    this.logger.info("WebSocket server shutdown complete");
  }

  // ========== PRIVATE METHODS ==========

  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const clientId = this.generateClientId();
    
    this.logger.info("WebSocket connection attempt", { 
      clientId,
      ip: request.socket.remoteAddress,
    });

    // Extract auth info from query params or headers
    const auth = this.extractAuthInfo(request);
    if (!auth) {
      this.logger.warn("WebSocket connection rejected - missing auth", { clientId });
      socket.close(4001, "Authentication required");
      return;
    }

    // Create client record
    const client: ConnectedClient = {
      id: clientId,
      socket,
      userId: auth.userId,
      organizationId: auth.organizationId,
      roles: auth.roles,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.clients.set(clientId, client);
    this.joinRoom(client.organizationId, clientId);

    // Set up socket event handlers
    socket.on("message", (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    socket.on("pong", () => {
      this.handlePong(clientId);
    });

    socket.on("close", (code: number, reason: Buffer) => {
      this.handleDisconnection(clientId, code, reason.toString());
    });

    socket.on("error", (error: Error) => {
      this.logger.error("WebSocket client error", error, { clientId });
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: "lims_sync",
      payload: {
        message: "Connected to ILS Real-Time Sync",
        clientId,
        features: ["order_status", "anomaly_alert", "bottleneck_alert", "metric_update"],
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.info("WebSocket client connected", {
      clientId,
      userId: auth.userId,
      organizationId: auth.organizationId,
      totalConnections: this.clients.size,
    });
  }

  private handleMessage(clientId: string, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    try {
      const message = JSON.parse(data.toString());
      
      this.logger.debug("WebSocket message received", {
        clientId,
        messageType: message.type,
      });

      // Handle different message types
      if (message.type === "ping") {
        this.sendToClient(clientId, {
          type: "lims_sync",
          payload: { pong: true },
          timestamp: new Date().toISOString(),
        });
      } else if (message.type === "subscribe") {
        // Handle subscription to specific events
        this.logger.debug("Client subscribed", {
          clientId,
          subscription: message.payload,
        });
      }
    } catch (error) {
      this.logger.error("Failed to parse WebSocket message", error as Error, { clientId });
    }
  }

  private handlePong(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  private handleDisconnection(clientId: string, code: number, reason: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.leaveRoom(client.organizationId, clientId);
    this.clients.delete(clientId);

    this.logger.info("WebSocket client disconnected", {
      clientId,
      userId: client.userId,
      organizationId: client.organizationId,
      code,
      reason: reason || "No reason provided",
      duration: Date.now() - client.connectedAt.getTime(),
      totalConnections: this.clients.size,
    });
  }

  private broadcastToRoom(organizationId: string, message: WebSocketMessage): void {
    const clientIds = this.rooms.get(organizationId);
    if (!clientIds || clientIds.size === 0) {
      this.logger.debug("No clients in room", { organizationId });
      return;
    }

    let sentCount = 0;
    clientIds.forEach((clientId) => {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });

    this.logger.debug("Message broadcasted to room", {
      organizationId,
      messageType: message.type,
      recipients: clientIds.size,
      sent: sentCount,
    });
  }

  private sendToClient(clientId: string, message: WebSocketMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    if (client.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.logger.error("Failed to send message to client", error as Error, { clientId });
      return false;
    }
  }

  private joinRoom(organizationId: string, clientId: string): void {
    if (!this.rooms.has(organizationId)) {
      this.rooms.set(organizationId, new Set());
    }
    this.rooms.get(organizationId)!.add(clientId);
  }

  private leaveRoom(organizationId: string, clientId: string): void {
    const room = this.rooms.get(organizationId);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.rooms.delete(organizationId);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      
      this.clients.forEach((client, clientId) => {
        // Check for inactive clients
        if (now - client.lastActivity.getTime() > this.CLIENT_TIMEOUT) {
          this.logger.warn("Client timeout - disconnecting", { clientId });
          client.socket.close(4000, "Timeout");
          this.handleDisconnection(clientId, 4000, "Timeout");
          return;
        }

        // Send ping
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping();
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  private extractAuthInfo(request: IncomingMessage): {
    userId: string;
    organizationId: string;
    roles: string[];
  } | null {
    // Extract from query params (for demo purposes)
    // In production, validate JWT token from Authorization header or query param
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    const userId = url.searchParams.get("userId");
    const organizationId = url.searchParams.get("organizationId");
    const roles = url.searchParams.get("roles")?.split(",") || ["user"];

    if (!userId || !organizationId) {
      return null;
    }

    // TODO: Validate token and extract claims
    return {
      userId,
      organizationId,
      roles,
    };
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
