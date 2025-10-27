import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { orderStatusEnum } from '../../shared/schema';

interface OrderUpdate {
  orderId: string;
  status: typeof orderStatusEnum.enumValues[number];
  timestamp: Date;
  details?: {
    location?: string;
    stage?: string;
    completedSteps?: string[];
    nextStep?: string;
    estimatedCompletion?: Date;
  };
}

class OrderTrackingService {
  private wss: WebSocketServer;
  private connections: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const orderId = new URL(req.url, 'http://localhost').searchParams.get('orderId');
      
      if (orderId) {
        // Add connection to tracking map
        if (!this.connections.has(orderId)) {
          this.connections.set(orderId, new Set());
        }
        this.connections.get(orderId)?.add(ws);

        // Setup disconnect handler
        ws.on('close', () => {
          this.connections.get(orderId)?.delete(ws);
          if (this.connections.get(orderId)?.size === 0) {
            this.connections.delete(orderId);
          }
        });
      }
    });
  }

  public async broadcastOrderUpdate(update: OrderUpdate) {
    const connections = this.connections.get(update.orderId);
    if (connections) {
      const message = JSON.stringify(update);
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  public async updateOrderStatus(
    orderId: string,
    status: typeof orderStatusEnum.enumValues[number],
    details?: OrderUpdate['details']
  ) {
    const update: OrderUpdate = {
      orderId,
      status,
      timestamp: new Date(),
      details
    };

    // Broadcast the update
    await this.broadcastOrderUpdate(update);

    // Store the update in the database
    await db.update(schema.orders)
      .set({
        status,
        updatedAt: update.timestamp,
        statusDetails: details
      })
      .where(eq(schema.orders.id, orderId));

    return update;
  }

  public getActiveConnections(orderId: string): number {
    return this.connections.get(orderId)?.size ?? 0;
  }
}

export default OrderTrackingService;