import { EventEmitter } from 'events';
import { networkInterfaces } from 'os';
import dgram from 'dgram';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

interface EquipmentInfo {
  id: string;
  type: string;
  model: string;
  manufacturer: string;
  ipAddress: string;
  port: number;
  protocol: 'DICOM' | 'RS232' | 'TCP' | 'HTTP';
  status: 'online' | 'offline' | 'error';
  lastSeen: Date;
  capabilities: string[];
}

class EquipmentDiscoveryService extends EventEmitter {
  private static instance: EquipmentDiscoveryService;
  private discoveryPort: number = 11112; // Standard DICOM port
  private socket: dgram.Socket;
  private knownEquipment: Map<string, EquipmentInfo> = new Map();
  private discoveryInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.socket = dgram.createSocket('udp4');
    this.setupSocket();
  }

  public static getInstance(): EquipmentDiscoveryService {
    if (!EquipmentDiscoveryService.instance) {
      EquipmentDiscoveryService.instance = new EquipmentDiscoveryService();
    }
    return EquipmentDiscoveryService.instance;
  }

  private setupSocket() {
    this.socket.on('message', (msg, rinfo) => {
      this.handleDiscoveryResponse(msg, rinfo);
    });

    this.socket.on('error', (err) => {
      console.error('Discovery socket error:', err);
      this.emit('error', err);
    });
  }

  private async handleDiscoveryResponse(msg: Buffer, rinfo: dgram.RemoteInfo) {
    try {
      const response = JSON.parse(msg.toString());
      const equipment: EquipmentInfo = {
        id: response.id,
        type: response.type,
        model: response.model,
        manufacturer: response.manufacturer,
        ipAddress: rinfo.address,
        port: rinfo.port,
        protocol: response.protocol,
        status: 'online',
        lastSeen: new Date(),
        capabilities: response.capabilities || []
      };

      this.knownEquipment.set(equipment.id, equipment);
      this.emit('equipmentFound', equipment);

      // Update equipment in database
      await this.updateEquipmentStatus(equipment);
    } catch (error) {
      console.error('Error handling discovery response:', error);
    }
  }

  private async updateEquipmentStatus(equipment: EquipmentInfo) {
    try {
      await db.insert(schema.equipment)
        .values({
          id: equipment.id,
          type: equipment.type,
          model: equipment.model,
          manufacturer: equipment.manufacturer,
          ipAddress: equipment.ipAddress,
          port: equipment.port,
          protocol: equipment.protocol,
          status: equipment.status,
          lastSeen: equipment.lastSeen,
          capabilities: equipment.capabilities
        })
        .onConflictDoUpdate({
          target: schema.equipment.id,
          set: {
            status: equipment.status,
            lastSeen: equipment.lastSeen,
            ipAddress: equipment.ipAddress,
            port: equipment.port
          }
        });
    } catch (error) {
      console.error('Error updating equipment status:', error);
    }
  }

  public startDiscovery() {
    // Broadcast discovery message every 30 seconds
    this.discoveryInterval = setInterval(() => {
      this.broadcastDiscovery();
    }, 30000);

    // Initial broadcast
    this.broadcastDiscovery();
  }

  public stopDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  private broadcastDiscovery() {
    const interfaces = networkInterfaces();
    const discoveryMessage = Buffer.from(JSON.stringify({
      type: 'DISCOVERY',
      timestamp: new Date().toISOString()
    }));

    Object.values(interfaces).forEach(iface => {
      iface?.forEach(addr => {
        if (addr.family === 'IPv4' && !addr.internal) {
          this.socket.send(
            discoveryMessage,
            0,
            discoveryMessage.length,
            this.discoveryPort,
            '255.255.255.255'
          );
        }
      });
    });
  }

  public async getKnownEquipment(): Promise<EquipmentInfo[]> {
    try {
      const equipment = await db.select()
        .from(schema.equipment)
        .where(eq(schema.equipment.status, 'online'))
        .execute();

      return equipment.map(e => ({
        id: e.id,
        type: e.type,
        model: e.model,
        manufacturer: e.manufacturer,
        ipAddress: e.ipAddress,
        port: e.port,
        protocol: e.protocol as EquipmentInfo['protocol'],
        status: e.status as EquipmentInfo['status'],
        lastSeen: e.lastSeen,
        capabilities: e.capabilities
      }));
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  }

  public async getEquipmentById(id: string): Promise<EquipmentInfo | null> {
    try {
      const [equipment] = await db.select()
        .from(schema.equipment)
        .where(eq(schema.equipment.id, id))
        .execute();

      if (!equipment) return null;

      return {
        id: equipment.id,
        type: equipment.type,
        model: equipment.model,
        manufacturer: equipment.manufacturer,
        ipAddress: equipment.ipAddress,
        port: equipment.port,
        protocol: equipment.protocol as EquipmentInfo['protocol'],
        status: equipment.status as EquipmentInfo['status'],
        lastSeen: equipment.lastSeen,
        capabilities: equipment.capabilities
      };
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return null;
    }
  }
}

export default EquipmentDiscoveryService;