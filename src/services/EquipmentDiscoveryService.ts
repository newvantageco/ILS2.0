import { WebSocket } from 'ws';
import type { Device, EquipmentDiscoveryService } from '@/types/services';

export class EquipmentDiscoveryServiceImpl implements EquipmentDiscoveryService {
  private devices: Map<string, Device>;
  private connections: Set<WebSocket>;

  constructor() {
    this.devices = new Map();
    this.connections = new Set();
  }

  public handleDeviceConnection(device: Device): void {
    this.devices.set(device.id, device);
    this.broadcastDevices();
  }

  public handleDeviceDisconnection(deviceId: string): void {
    this.devices.delete(deviceId);
    this.broadcastDevices();
  }

  public updateDeviceStatus(deviceId: string, status: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = status;
      this.devices.set(deviceId, device);
      this.broadcastDevices();
    }
  }

  public handleWebSocketConnection(ws: WebSocket): void {
    this.connections.add(ws);
    ws.send(JSON.stringify(Array.from(this.devices.values())));
  }

  public getConnectedDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  private broadcastDevices(): void {
    const devices = Array.from(this.devices.values());
    const message = JSON.stringify(devices);
    this.connections.forEach(ws => ws.send(message));
  }
}