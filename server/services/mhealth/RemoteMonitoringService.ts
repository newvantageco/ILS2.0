import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

export type VitalType = 'blood_pressure' | 'heart_rate' | 'temperature' | 'spo2' | 'weight' | 'glucose';

export interface MonitoringProgram {
  id: string;
  name: string;
  condition: string;
  vitalTypes: VitalType[];
  thresholds: Array<{vitalType: VitalType; min?: number; max?: number; unit: string}>;
  active: boolean;
}

export interface PatientMonitoring {
  id: string;
  patientId: string;
  programId: string;
  status: 'active' | 'paused' | 'completed';
  startDate: Date;
  adherenceRate: number;
}

export interface VitalReading {
  id: string;
  patientId: string;
  vitalType: VitalType;
  value: number;
  unit: string;
  readingDate: Date;
  source: 'device' | 'manual';
}

export interface MonitoringAlert {
  id: string;
  patientId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  resolved: boolean;
  createdAt: Date;
}

export class RemoteMonitoringService {
  private static programs: Map<string, MonitoringProgram> = new Map();
  private static patientMonitoring: Map<string, PatientMonitoring> = new Map();
  private static readings: Map<string, VitalReading> = new Map();
  private static alerts: Map<string, MonitoringAlert> = new Map();

  static createProgram(data: Omit<MonitoringProgram, 'id' | 'active'>): MonitoringProgram {
    const program: MonitoringProgram = { ...data, id: uuidv4(), active: true };
    this.programs.set(program.id, program);
    return program;
  }

  static enrollPatient(patientId: string, programId: string): PatientMonitoring {
    const monitoring: PatientMonitoring = {
      id: uuidv4(),
      patientId,
      programId,
      status: 'active',
      startDate: new Date(),
      adherenceRate: 100
    };
    this.patientMonitoring.set(monitoring.id, monitoring);
    return monitoring;
  }

  static recordReading(data: Omit<VitalReading, 'id'>): VitalReading {
    const reading: VitalReading = { ...data, id: uuidv4() };
    this.readings.set(reading.id, reading);
    this.checkThresholds(reading);
    return reading;
  }

  private static checkThresholds(reading: VitalReading): void {
    const monitoring = Array.from(this.patientMonitoring.values()).find(
      m => m.patientId === reading.patientId && m.status === 'active'
    );
    if (!monitoring) return;

    const program = this.programs.get(monitoring.programId);
    if (!program) return;

    const threshold = program.thresholds.find(t => t.vitalType === reading.vitalType);
    if (!threshold) return;

    if ((threshold.min && reading.value < threshold.min) || (threshold.max && reading.value > threshold.max)) {
      this.createAlert({
        patientId: reading.patientId,
        severity: 'warning',
        message: `${reading.vitalType} out of range: ${reading.value}${reading.unit}`
      });
    }
  }

  static createAlert(data: Omit<MonitoringAlert, 'id' | 'resolved' | 'createdAt'>): MonitoringAlert {
    const alert: MonitoringAlert = { ...data, id: uuidv4(), resolved: false, createdAt: new Date() };
    this.alerts.set(alert.id, alert);
    logger.info(`Alert created: ${data.severity} - ${data.message}`);
    return alert;
  }

  static getReadings(patientId: string): VitalReading[] {
    return Array.from(this.readings.values())
      .filter(r => r.patientId === patientId)
      .sort((a, b) => b.readingDate.getTime() - a.readingDate.getTime());
  }

  static getActiveAlerts(patientId?: string): MonitoringAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => !a.resolved && (!patientId || a.patientId === patientId));
  }

  static getPrograms(): MonitoringProgram[] {
    return Array.from(this.programs.values()).filter(p => p.active);
  }

  static getStatistics() {
    return {
      programs: this.programs.size,
      activeMonitoring: Array.from(this.patientMonitoring.values()).filter(m => m.status === 'active').length,
      totalReadings: this.readings.size,
      activeAlerts: this.getActiveAlerts().length
    };
  }
}
