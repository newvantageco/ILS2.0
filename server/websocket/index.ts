/**
 * WebSocket Server for Real-Time Lab Dashboard
 * 
 * This module sets up WebSocket connections for real-time order updates.
 * It integrates with the event system to broadcast order changes to connected clients.
 * 
 * ARCHITECTURE:
 * =============
 * - Uses native WebSocket (ws package) instead of Socket.io for simplicity
 * - Clients are organized by company rooms for multi-tenancy
 * - Subscribes to order events and broadcasts to relevant company rooms
 * - Authenticates WebSocket connections using session cookies
 * 
 * REAL-TIME EVENTS:
 * ================
 * - order:created → New order arrives
 * - order:status_changed → Order moves between workflow stages
 * - order:shipped → Order completed and shipped
 * - order:assigned → QC technician assigned
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import { EventBus } from '../events/EventBus';
import { PatientJourneyEvent } from '../events/PatientJourneyEvents';
import logger from '../utils/logger';


interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  companyId?: string;
  role?: string;
  isAlive?: boolean;
}

// Company rooms: Map<companyId, Set<WebSocket>>
const companyRooms = new Map<string, Set<AuthenticatedWebSocket>>();

export function setupWebSocket(server: Server, sessionMiddleware: any) {
  const wss = new WebSocketServer({
    noServer: true,
    path: '/ws'
  });

  // Handle WebSocketServer errors to prevent crashes
  wss.on('error', (error) => {
    logger.error('[WebSocket] WebSocketServer error:', error);
  });

  // Handle HTTP upgrade requests
  server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws') {
      socket.destroy();
      return;
    }

    // Parse cookies and authenticate - simple implementation
    const cookieHeader = request.headers.cookie || '';
    const sessionMatch = cookieHeader.match(/connect\.sid=([^;]+)/);
    const sessionID = sessionMatch ? sessionMatch[1] : null;

    if (!sessionID) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Get session data
    sessionMiddleware.store.get(sessionID.split('.')[0].substring(2), (err: any, session: any) => {
      if (err || !session || !session.passport?.user) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, session.passport.user);
      });
    });
  });

  // Handle new WebSocket connections
  wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage, userId: string) => {
    logger.info(`[WebSocket] New connection from user: ${userId}`);

    // Store user info on WebSocket connection
    ws.userId = userId;
    ws.isAlive = true;

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established',
      timestamp: new Date().toISOString()
    }));

    // Handle incoming messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join-company') {
          // Join company room for filtered updates
          const companyId = data.companyId;
          ws.companyId = companyId;
          
          if (!companyRooms.has(companyId)) {
            companyRooms.set(companyId, new Set());
          }
          companyRooms.get(companyId)!.add(ws);
          
          logger.info(`[WebSocket] User ${userId} joined company room: ${companyId}`);
          
          ws.send(JSON.stringify({
            type: 'room-joined',
            companyId,
            timestamp: new Date().toISOString()
          }));
        }
        
        if (data.type === 'ping') {
          ws.isAlive = true;
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        logger.error('[WebSocket] Error processing message:', error);
      }
    });

    // Handle pong responses for heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle disconnection
    ws.on('close', () => {
      logger.info(`[WebSocket] User ${userId} disconnected`);
      
      // Remove from company room
      if (ws.companyId && companyRooms.has(ws.companyId)) {
        companyRooms.get(ws.companyId)!.delete(ws);
        
        // Clean up empty rooms
        if (companyRooms.get(ws.companyId)!.size === 0) {
          companyRooms.delete(ws.companyId);
        }
      }
    });

    ws.on('error', (error) => {
      logger.error('[WebSocket] Connection error:', error);
    });
  });

  // Heartbeat to detect broken connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Every 30 seconds

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Subscribe to order events and broadcast to company rooms
  setupEventListeners();

  logger.info('[WebSocket] WebSocket server initialized on /ws endpoint');
}

/**
 * Subscribe to EventBus and broadcast real-time updates
 */
function setupEventListeners() {
  // Order Created
  EventBus.subscribe(PatientJourneyEvent.ORDER_CREATED, (payload: any) => {
    broadcastToCompany(payload.companyId, {
      type: 'order:created',
      data: payload,
      timestamp: new Date().toISOString()
    });
  });

  // Order Status Changed
  EventBus.subscribe(PatientJourneyEvent.ORDER_STATUS_CHANGED, (payload: any) => {
    broadcastToCompany(payload.companyId, {
      type: 'order:status_changed',
      data: payload,
      timestamp: new Date().toISOString()
    });
  });

  // Order Shipped
  EventBus.subscribe(PatientJourneyEvent.ORDER_SHIPPED, (payload: any) => {
    broadcastToCompany(payload.companyId, {
      type: 'order:shipped',
      data: payload,
      timestamp: new Date().toISOString()
    });
  });

  // Invoice Paid (triggers auto-order creation)
  EventBus.subscribe(PatientJourneyEvent.INVOICE_PAID, (payload: any) => {
    broadcastToCompany(payload.companyId, {
      type: 'invoice:paid',
      data: payload,
      timestamp: new Date().toISOString()
    });
  });

  logger.info('[WebSocket] Event listeners registered for real-time broadcasts');
}

/**
 * Safely send a message to a WebSocket client with error handling
 */
function safeSend(client: AuthenticatedWebSocket, message: string): boolean {
  if (client.readyState !== WebSocket.OPEN) {
    return false;
  }
  try {
    client.send(message, (error) => {
      if (error) {
        logger.error(`[WebSocket] Send error for user ${client.userId}:`, error);
      }
    });
    return true;
  } catch (error) {
    logger.error(`[WebSocket] Send exception for user ${client.userId}:`, error);
    return false;
  }
}

/**
 * Broadcast message to all clients in a company room
 */
function broadcastToCompany(companyId: string, message: any) {
  const room = companyRooms.get(companyId);

  if (!room || room.size === 0) {
    return; // No clients in this room
  }

  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  room.forEach((client: AuthenticatedWebSocket) => {
    if (safeSend(client, messageStr)) {
      sentCount++;
    }
  });

  if (sentCount > 0) {
    logger.info(`[WebSocket] Broadcast ${message.type} to ${sentCount} clients in company ${companyId}`);
  }
}

/**
 * Broadcast to all connected clients (admin notifications)
 */
export function broadcastToAll(message: any) {
  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  companyRooms.forEach((room) => {
    room.forEach((client: AuthenticatedWebSocket) => {
      if (safeSend(client, messageStr)) {
        sentCount++;
      }
    });
  });

  logger.info(`[WebSocket] Broadcast to ${sentCount} total clients`);
}

/**
 * Get active connection stats
 */
export function getWebSocketStats() {
  let totalConnections = 0;
  const roomStats: Record<string, number> = {};

  companyRooms.forEach((room, companyId) => {
    const activeCount = Array.from(room).filter(
      (ws: AuthenticatedWebSocket) => ws.readyState === WebSocket.OPEN
    ).length;
    
    roomStats[companyId] = activeCount;
    totalConnections += activeCount;
  });

  return {
    totalConnections,
    totalRooms: companyRooms.size,
    roomStats
  };
}
