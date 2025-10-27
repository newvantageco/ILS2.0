import { EquipmentDiscoveryServiceImpl } from '@/services/EquipmentDiscoveryService';
import type { Device } from '@/types/services';
import WebSocket from 'ws';

describe('EquipmentDiscoveryService', () => {
  let service: EquipmentDiscoveryServiceImpl;
  let mockWs: jest.Mocked<WebSocket>;

  beforeEach(() => {
    // Mock WebSocket implementation
    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
    } as any;

    // Initialize service with mock WebSocket
    service = new EquipmentDiscoveryServiceImpl();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Device Discovery', () => {
    it('should discover new devices when they connect', async () => {
      const mockDevice: Device = {
        id: 'device-1',
        type: 'scanner',
        status: 'online'
      };

      // Simulate device connection
      service.handleDeviceConnection(mockDevice);

      // Verify device is registered
      const devices = service.getConnectedDevices();
      expect(devices).toContainEqual(expect.objectContaining(mockDevice));
    });

    it('should remove devices when they disconnect', async () => {
      const mockDevice: Device = {
        id: 'device-1',
        type: 'scanner',
        status: 'online'
      };

      // Add and then remove device
      service.handleDeviceConnection(mockDevice);
      service.handleDeviceDisconnection(mockDevice.id);

      // Verify device is removed
      const devices = service.getConnectedDevices();
      expect(devices).not.toContainEqual(expect.objectContaining(mockDevice));
    });
  });

  describe('Device Status Updates', () => {
    it('should update device status', async () => {
      const mockDevice: Device = {
        id: 'device-1',
        type: 'scanner',
        status: 'online'
      };

      // Add device and update status
      service.handleDeviceConnection(mockDevice);
      service.updateDeviceStatus(mockDevice.id, 'busy');

      // Verify status is updated
      const devices = service.getConnectedDevices();
      const updatedDevice = devices.find(d => d.id === mockDevice.id);
      expect(updatedDevice?.status).toBe('busy');
    });
  });

  describe('WebSocket Communication', () => {
    it('should send device list to new connections', () => {
      const mockDevice: Device = {
        id: 'device-1',
        type: 'scanner',
        status: 'online'
      };

      service.handleDeviceConnection(mockDevice);
      service.handleWebSocketConnection(mockWs);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining(mockDevice.id)
      );
    });

    it('should broadcast device updates to all connections', async () => {
      const mockWs1 = { send: jest.fn() } as any;
      const mockWs2 = { send: jest.fn() } as any;

      service.handleWebSocketConnection(mockWs1);
      service.handleWebSocketConnection(mockWs2);

      const mockDevice: Device = {
        id: 'device-1',
        type: 'scanner',
        status: 'online'
      };

      service.handleDeviceConnection(mockDevice);

      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();
    });
  });
});