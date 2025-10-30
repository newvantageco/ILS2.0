import { WebSocket, WebSocketServer } from 'ws';
import fs from 'fs/promises';
import { db } from '../server/db';

// Global test utilities
export const createMockWebSocket = () => ({
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
} as unknown as jest.Mocked<WebSocket>);

// Database utilities
export const setupTestDb = async () => {
  // Setup test database or clear existing data
  const anyDb = db as any;
  if (typeof anyDb.raw === 'function') {
    await anyDb.raw('BEGIN');
  }
};

export const teardownTestDb = async () => {
  // Rollback any changes made during tests
  const anyDb = db as any;
  if (typeof anyDb.raw === 'function') {
    await anyDb.raw('ROLLBACK');
  }
};

// Authentication utilities
export const createTestToken = (userId: string) => {
  // Create a test JWT token
  return `test-token-${userId}`;
};

// WebSocket test utilities
export const createTestWebSocketServer = () => {
  const wss = new WebSocketServer({ noServer: true });
  const connectedClients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    connectedClients.add(ws);
    ws.on('close', () => connectedClients.delete(ws));
  });

  return {
    wss,
    connectedClients,
    close: () => {
      connectedClients.forEach(client => client.close());
      wss.close();
    }
  };
};

// Mock data generators
export const createTestPrescription = (overrides = {}) => ({
  patientName: 'Test Patient',
  patientId: 'TEST123',
  date: new Date().toISOString(),
  prescription: {
    rightEye: {
      sphere: -1.25,
      cylinder: -0.5,
      axis: 180,
      add: '+2.00'
    },
    leftEye: {
      sphere: -1.50,
      cylinder: -0.75,
      axis: 175,
      add: '+2.00'
    }
  },
  doctorName: 'Dr. Test',
  licenseNumber: 'TEST456',
  ...overrides
});

export const createTestExamination = (overrides = {}) => ({
  patientName: 'Test Patient',
  patientId: 'TEST123',
  date: new Date().toISOString(),
  examinations: [
    {
      type: 'Visual Acuity',
      rightEye: '20/20',
      leftEye: '20/25'
    },
    {
      type: 'Intraocular Pressure',
      rightEye: '14 mmHg',
      leftEye: '15 mmHg'
    }
  ],
  diagnosis: 'Test diagnosis',
  recommendations: 'Test recommendations',
  doctorName: 'Dr. Test',
  licenseNumber: 'TEST456',
  ...overrides
});

export const createTestNotification = (overrides = {}) => ({
  type: 'TEST_NOTIFICATION',
  message: 'Test notification message',
  userId: 'test-user',
  metadata: { test: true },
  ...overrides
});

// Helper to wait for WebSocket messages
export const waitForWebSocketMessage = (ws: WebSocket): Promise<any> => {
  return new Promise((resolve) => {
    ws.once('message', (data) => {
      resolve(JSON.parse(data.toString()));
    });
  });
};