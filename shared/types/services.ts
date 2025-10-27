import type { WebSocket } from 'ws';

// Equipment Discovery Service Types
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

// Notification Service Types
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
  read?: boolean;
  readAt?: Date | null;
}

export interface NotificationService {
  sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void>;
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): () => void;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  clearNotifications(userId: string): Promise<void>;
}

// PDF Generation Service Types
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
}

export interface ExaminationRecord {
  type: string;
  rightEye: string;
  leftEye: string;
}

export interface ExaminationData {
  patientName: string;
  patientId: string;
  examinations: ExaminationRecord[];
  diagnosis: string;
  recommendations: string;
  doctorName: string;
  licenseNumber: string;
}

export interface PDFGenerationService {
  generatePrescription(data: PrescriptionData): Promise<Buffer>;
  generateExaminationReport(data: ExaminationData): Promise<Buffer>;
  extractTextFromPDF(pdfBuffer: Buffer): Promise<string>;
}