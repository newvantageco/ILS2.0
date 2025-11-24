import { EventEmitter } from 'events';
import { networkInterfaces } from 'os';
import dgram from 'dgram';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { equipmentStatusEnum } from '@shared/schema';

type EquipmentStatus = typeof equipmentStatusEnum.enumValues[number];
type EquipmentProtocol = 'DICOM' | 'RS232' | 'TCP' | 'HTTP';

interface EquipmentInfo {
  id: string;
  name: string;
  model: string | null;
  serialNumber: string;
  status: EquipmentStatus;
  lastSeen: Date;
  protocol?: EquipmentProtocol;
  ipAddress?: string;
  port?: number;
  metadata: Record<string, unknown>;
}

class EquipmentDiscoveryService extends EventEmitter {
  private static instance: EquipmentDiscoveryService;
  private discoveryPort: number = 11112; // Standard DICOM port
  private socket: dgram.Socket;
  private knownEquipment: Map<string, EquipmentInfo> = new Map();
  private discoveryInterval: NodeJS.Timeout | null = null;
  private defaultCompanyId: string | null = null;

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
        id: response.id || `${rinfo.address}:${rinfo.port}`,
        name: response.name || response.type || 'Unknown Device',
        model: response.model || 'Unknown Model',
        serialNumber: response.serialNumber || response.id || `${Date.now()}`,
        status: this.mapStatus(response.status),
        lastSeen: new Date(),
        protocol: response.protocol,
        ipAddress: rinfo.address,
        port: rinfo.port,
        metadata: {
          manufacturer: response.manufacturer,
          ipAddress: rinfo.address,
          port: rinfo.port,
          protocol: response.protocol,
          capabilities: response.capabilities || []
        }
      };

      this.knownEquipment.set(equipment.id, equipment);
      this.emit('equipmentFound', equipment);

      await this.updateEquipmentStatus(equipment);
    } catch (error) {
      console.error('Error handling discovery response:', error);
    }
  }

  private async updateEquipmentStatus(equipment: EquipmentInfo) {
    try {
      // Lazily resolve a default company to associate discovered equipment with
      if (!this.defaultCompanyId) {
        const [company] = await db.select({ id: schema.companies.id }).from(schema.companies).limit(1);
        if (company) {
          this.defaultCompanyId = company.id;
        } else {
          // No company exists yet; skip persistence until bootstrap creates one
          return;
        }
      }

      await db.insert(schema.equipment)
        .values({
          // id is generated in the database; we use it only for conflict target
          name: equipment.name,
          model: equipment.model ?? null,
          serialNumber: equipment.serialNumber,
          status: equipment.status,
          companyId: this.defaultCompanyId,
          metadata: {
            ...equipment.metadata,
            protocol: equipment.protocol,
            ipAddress: equipment.ipAddress,
            port: equipment.port
          },
          updatedAt: equipment.lastSeen
        })
        .onConflictDoUpdate({
          target: schema.equipment.serialNumber,
          set: {
            status: equipment.status,
            updatedAt: equipment.lastSeen,
            metadata: {
              ...equipment.metadata,
              protocol: equipment.protocol,
              ipAddress: equipment.ipAddress,
              port: equipment.port
            }
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
        .execute();

      return equipment.map(e => ({
        id: e.id,
        name: e.name,
        model: e.model ?? null,
        serialNumber: e.serialNumber,
        status: e.status as EquipmentStatus,
        lastSeen: e.updatedAt,
        protocol: (e.metadata as Record<string, unknown> | null)?.protocol as EquipmentProtocol | undefined,
        ipAddress: (e.metadata as Record<string, unknown> | null)?.ipAddress as string | undefined,
        port: (e.metadata as Record<string, unknown> | null)?.port as number | undefined,
        metadata: (e.metadata ?? {}) as Record<string, unknown>
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
        name: equipment.name,
        model: equipment.model ?? null,
        serialNumber: equipment.serialNumber,
        status: equipment.status as EquipmentStatus,
        lastSeen: equipment.updatedAt,
        protocol: (equipment.metadata as Record<string, unknown> | null)?.protocol as EquipmentProtocol | undefined,
        ipAddress: (equipment.metadata as Record<string, unknown> | null)?.ipAddress as string | undefined,
        port: (equipment.metadata as Record<string, unknown> | null)?.port as number | undefined,
        metadata: (equipment.metadata ?? {}) as Record<string, unknown>
      };
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return null;
    }
  }

  private mapStatus(status: string | undefined): EquipmentStatus {
    switch (status) {
      case 'offline':
        return 'offline';
      case 'maintenance':
        return 'maintenance';
      case 'repair':
      case 'error':
        return 'repair';
      default:
        return 'operational';
    }
  }
}

export default EquipmentDiscoveryService;