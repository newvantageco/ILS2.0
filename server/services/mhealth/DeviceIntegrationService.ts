import { v4 as uuidv4 } from 'uuid';

export interface MedicalDevice {
  id: string;
  deviceId: string;
  deviceType: 'blood_pressure_monitor' | 'glucometer' | 'pulse_oximeter' | 'weight_scale' | 'wearable';
  manufacturer: string;
  model: string;
  patientId?: string;
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
  batteryLevel?: number;
}

export interface DeviceReading {
  id: string;
  deviceId: string;
  patientId: string;
  dataType: string;
  value: number;
  unit: string;
  timestamp: Date;
  synced: boolean;
}

export interface WearableData {
  id: string;
  patientId: string;
  dataType: 'steps' | 'sleep' | 'activity' | 'heart_rate_continuous';
  value: number;
  date: Date;
  deviceId: string;
}

export class DeviceIntegrationService {
  private static devices: Map<string, MedicalDevice> = new Map();
  private static readings: Map<string, DeviceReading> = new Map();
  private static wearableData: Map<string, WearableData> = new Map();

  static registerDevice(data: Omit<MedicalDevice, 'id' | 'status'>): MedicalDevice {
    const device: MedicalDevice = { ...data, id: uuidv4(), status: 'active' };
    this.devices.set(device.id, device);
    return device;
  }

  static assignDevice(deviceId: string, patientId: string): MedicalDevice {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error('Device not found');
    device.patientId = patientId;
    this.devices.set(deviceId, device);
    return device;
  }

  static syncDeviceData(data: Omit<DeviceReading, 'id' | 'synced'>): DeviceReading {
    const reading: DeviceReading = { ...data, id: uuidv4(), synced: true };
    this.readings.set(reading.id, reading);
    return reading;
  }

  static recordWearableData(data: Omit<WearableData, 'id'>): WearableData {
    const wearable: WearableData = { ...data, id: uuidv4() };
    this.wearableData.set(wearable.id, wearable);
    return wearable;
  }

  static getDeviceReadings(deviceId: string, startDate?: Date): DeviceReading[] {
    let readings = Array.from(this.readings.values()).filter(r => r.deviceId === deviceId);
    if (startDate) readings = readings.filter(r => r.timestamp >= startDate);
    return readings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static getPatientDevices(patientId: string): MedicalDevice[] {
    return Array.from(this.devices.values())
      .filter(d => d.patientId === patientId && d.status === 'active');
  }

  static getWearableData(patientId: string, dataType?: string): WearableData[] {
    let data = Array.from(this.wearableData.values()).filter(w => w.patientId === patientId);
    if (dataType) data = data.filter(w => w.dataType === dataType);
    return data;
  }

  static getStatistics() {
    return {
      totalDevices: this.devices.size,
      activeDevices: Array.from(this.devices.values()).filter(d => d.status === 'active').length,
      totalReadings: this.readings.size,
      wearableDataPoints: this.wearableData.size
    };
  }
}
