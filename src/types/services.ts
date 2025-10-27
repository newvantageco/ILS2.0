import { WebSocket } from 'ws';

export interface Device {
  id: string;
  type: string;
  status: string;
}

export interface EquipmentDiscoveryService {
  handleDeviceConnection(device: Device): void;
  handleDeviceDisconnection(deviceId: string): void;
  updateDeviceStatus(deviceId: string, status: string): void;
  handleWebSocketConnection(ws: WebSocket): void;
  getConnectedDevices(): Device[];
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationSeverity = 'low' | 'medium' | 'high';
export type NotificationTarget = 'user' | 'role' | 'organization';

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  target: {
    type: NotificationTarget;
    id: string;
  };
  createdAt?: Date;
}

export interface NotificationService {
  handleConnection(ws: WebSocket, meta: { userId: string }): void;
  handleDisconnection(meta: { userId: string }): void;
  sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void>;
  broadcastNotification(notification: { type: string; message: string; broadcast: boolean }): Promise<void>;
  getNotificationHistory(userId: string): Promise<Notification[]>;
  getConnectedClients(): string[];
}

export interface PrescriptionData {
  patientName: string;
  patientId: string;
  prescription: {
    rightEye: {
      sphere: number;
      cylinder: number;
      axis: number;
      add?: string;
    };
    leftEye: {
      sphere: number;
      cylinder: number;
      axis: number;
      add?: string;
    };
  };
  doctorName: string;
  licenseNumber: string;
  date?: string;
}

export interface ExaminationData {
  patientName: string;
  patientId: string;
  examinations: Array<{
    type: string;
    rightEye: string;
    leftEye: string;
  }>;
  diagnosis: string;
  recommendations: string;
  doctorName: string;
  licenseNumber: string;
  date?: string;
}

export interface PDFGenerationService {
  generatePrescription(data: PrescriptionData): Promise<Buffer>;
  generateExaminationReport(data: ExaminationData): Promise<Buffer>;
  extractTextFromPDF(buffer: Buffer): Promise<string>;
}