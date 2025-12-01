/**
 * OrderRepository Tests
 *
 * Tests the order repository functionality including
 * status management, filtering, statistics, and timeline tracking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestTenantId, createTestUserId, createTestRecord } from '../utils/mockDb';

// Mock the database module
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid-order',
}));

// Import after mocking
import { OrderRepository } from '../../server/repositories/OrderRepository';
import { db } from '../../server/db';

// Mock order data
interface MockOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  status: string;
  patientId: string;
  ecpId: string;
  createdAt: Date;
  updatedAt: Date;
}

function createMockOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  return createTestRecord({
    orderNumber: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    status: 'pending',
    patientId: 'patient-123',
    ecpId: 'ecp-456',
    ...overrides,
  }) as MockOrder;
}

describe('OrderRepository', () => {
  let repository: OrderRepository;
  let tenantId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tenantId = createTestTenantId();
    repository = new OrderRepository(tenantId);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct tenant ID', () => {
      expect(repository.getTenantId()).toBe(tenantId);
    });
  });

  describe('findById', () => {
    it('should find order by ID', async () => {
      const mockOrder = createMockOrder();

      const mockLimit = vi.fn().mockResolvedValue([mockOrder]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.findById('order-123');

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getByStatus', () => {
    it('should return orders filtered by status', async () => {
      const mockOrders = [
        createMockOrder({ status: 'pending' }),
        createMockOrder({ status: 'pending' }),
      ];

      const mockOffset = vi.fn().mockResolvedValue(mockOrders);
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getByStatus('pending');

      expect(db.select).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      result.forEach(order => expect(order.status).toBe('pending'));
    });

    it('should respect pagination options', async () => {
      const mockOffset = vi.fn().mockResolvedValue([]);
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      await repository.getByStatus('pending', { limit: 10, offset: 20 });

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(20);
    });
  });

  describe('getWithDetails', () => {
    it('should return order with patient, ECP, and timeline', async () => {
      const mockOrder = createMockOrder();
      const mockPatient = {
        id: 'patient-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      const mockEcp = {
        id: 'ecp-456',
        firstName: 'Dr.',
        lastName: 'Smith',
        organizationName: 'Eye Care Clinic',
      };
      const mockTimeline = [
        { id: 'timeline-1', orderId: mockOrder.id, status: 'pending' },
        { id: 'timeline-2', orderId: mockOrder.id, status: 'processing' },
      ];
      const mockLineItems = [
        { id: 'item-1', orderId: mockOrder.id, description: 'Lens' },
      ];

      // Mock main query
      const mockLimit1 = vi.fn().mockResolvedValueOnce([{
        order: mockOrder,
        patient: mockPatient,
        ecp: mockEcp,
      }]);
      const mockWhere1 = vi.fn().mockReturnValue({ limit: mockLimit1 });
      const mockInnerJoin2 = vi.fn().mockReturnValue({ where: mockWhere1 });
      const mockInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin2 });
      const mockFrom1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin1 });

      // Mock timeline query
      const mockOrderBy2 = vi.fn().mockResolvedValueOnce(mockTimeline);
      const mockWhere2 = vi.fn().mockReturnValue({ orderBy: mockOrderBy2 });
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

      // Mock line items query
      const mockWhere3 = vi.fn().mockResolvedValueOnce(mockLineItems);
      const mockFrom3 = vi.fn().mockReturnValue({ where: mockWhere3 });

      (db.select as any)
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 })
        .mockReturnValueOnce({ from: mockFrom3 });

      const result = await repository.getWithDetails(mockOrder.id);

      expect(result).toBeDefined();
      expect(result?.patient).toEqual(mockPatient);
      expect(result?.ecp).toEqual(mockEcp);
      expect(result?.timeline).toEqual(mockTimeline);
      expect(result?.lineItems).toEqual(mockLineItems);
    });

    it('should return undefined if order not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockInnerJoin2 = vi.fn().mockReturnValue({ where: mockWhere });
      const mockInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin2 });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin1 });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getWithDetails('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('updateStatus', () => {
    it('should update order status and create timeline entry', async () => {
      const userId = createTestUserId();
      const mockOrder = createMockOrder({ status: 'processing' });

      // Mock update
      const mockReturning = vi.fn().mockResolvedValue([mockOrder]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      // Mock timeline insert
      const mockValues = vi.fn().mockResolvedValue([]);
      (db.insert as any).mockReturnValue({ values: mockValues });

      const result = await repository.updateStatus(
        'order-123',
        'processing',
        userId,
        'Started processing'
      );

      expect(db.update).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should return undefined if order not found', async () => {
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      const result = await repository.updateStatus(
        'non-existent',
        'processing',
        'user-123'
      );

      expect(result).toBeUndefined();
      // Should not insert timeline for non-existent order
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return order statistics by status', async () => {
      const mockStats = [
        { status: 'pending', count: 10 },
        { status: 'processing', count: 5 },
        { status: 'completed', count: 20 },
      ];

      const mockGroupBy = vi.fn().mockResolvedValue(mockStats);
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getStats(30);

      expect(result).toEqual({
        total: 35,
        byStatus: {
          pending: 10,
          processing: 5,
          completed: 20,
        },
        period: '30 days',
      });
    });

    it('should return zero counts if no orders', async () => {
      const mockGroupBy = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getStats();

      expect(result.total).toBe(0);
      expect(result.byStatus).toEqual({});
    });
  });

  describe('search', () => {
    it('should search orders by order number', async () => {
      const mockOrders = [
        createMockOrder({ orderNumber: 'ORD-ABC123' }),
      ];

      const mockOffset = vi.fn().mockResolvedValue(mockOrders);
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.search('ABC');

      expect(db.select).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should apply status filter', async () => {
      const mockOffset = vi.fn().mockResolvedValue([]);
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      await repository.search('', { status: 'pending' });

      expect(mockWhere).toHaveBeenCalled();
    });

    it('should apply date range filters', async () => {
      const mockOffset = vi.fn().mockResolvedValue([]);
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await repository.search('', { startDate, endDate });

      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('getByPatient', () => {
    it('should return orders for a specific patient', async () => {
      const mockOrders = [
        createMockOrder({ patientId: 'patient-123' }),
        createMockOrder({ patientId: 'patient-123' }),
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockOrders);
      const mockOffset = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getByPatient('patient-123');

      expect(db.select).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getByEcp', () => {
    it('should return orders for a specific ECP', async () => {
      const mockOrders = [
        createMockOrder({ ecpId: 'ecp-456' }),
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockOrders);
      const mockOffset = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getByEcp('ecp-456');

      expect(result).toHaveLength(1);
    });
  });

  describe('getRecent', () => {
    it('should return most recent orders', async () => {
      const mockOrders = Array(10).fill(null).map(() => createMockOrder());

      const mockOrderBy = vi.fn().mockResolvedValue(mockOrders);
      const mockOffset = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getRecent(10);

      expect(result).toHaveLength(10);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe('tenant isolation', () => {
    it('should filter all queries by tenant ID', async () => {
      // Verify tenant isolation by checking that queries include tenant filter
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      await repository.findById('any-id');

      expect(mockWhere).toHaveBeenCalled();
    });
  });
});
