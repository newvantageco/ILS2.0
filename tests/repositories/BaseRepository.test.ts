/**
 * BaseRepository Tests
 *
 * Tests the abstract base repository class functionality
 * including tenant filtering, CRUD operations, and audit logging.
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
  v4: () => 'mock-uuid-1234',
}));

// Import after mocking
import { BaseRepository } from '../../server/repositories/BaseRepository';
import { db } from '../../server/db';

// Create a concrete test repository
class TestRepository extends BaseRepository<any> {
  constructor(tenantId: string) {
    super(
      {
        id: { name: 'id' },
        companyId: { name: 'companyId' },
        createdAt: { name: 'createdAt' },
        updatedAt: { name: 'updatedAt' },
        name: { name: 'name' },
      } as any,
      tenantId,
      'companyId' as any
    );
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let tenantId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tenantId = createTestTenantId();
    repository = new TestRepository(tenantId);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with tenant ID', () => {
      expect(repository.getTenantId()).toBe(tenantId);
    });

    it('should use provided tenant column', () => {
      const customTenantRepo = new TestRepository(tenantId);
      expect(customTenantRepo.getTenantId()).toBe(tenantId);
    });
  });

  describe('findById', () => {
    it('should query with tenant filter', async () => {
      const mockRecord = createTestRecord({ name: 'Test' });

      // Setup mock chain
      const mockLimit = vi.fn().mockResolvedValue([mockRecord]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.findById('test-id');

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockRecord);
    });

    it('should return undefined if record not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.findById('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('findMany', () => {
    it('should return paginated results', async () => {
      const mockRecords = [
        createTestRecord({ name: 'Test 1' }),
        createTestRecord({ name: 'Test 2' }),
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockRecords);
      const mockOffset = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.findMany(undefined, { limit: 10, offset: 0 });

      expect(result).toEqual(mockRecords);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(0);
    });

    it('should use default pagination values', async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockOffset = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      await repository.findMany();

      expect(mockLimit).toHaveBeenCalledWith(100);
      expect(mockOffset).toHaveBeenCalledWith(0);
    });
  });

  describe('findAll', () => {
    it('should delegate to findMany with options', async () => {
      const mockRecords = [createTestRecord()];

      const mockOrderBy = vi.fn().mockResolvedValue(mockRecords);
      const mockOffset = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.findAll({ limit: 50 });

      expect(result).toEqual(mockRecords);
      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });

  describe('count', () => {
    it('should return record count with tenant filter', async () => {
      const mockWhere = vi.fn().mockResolvedValue([{ count: 5 }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.count();

      expect(result).toBe(5);
    });

    it('should return 0 if no records', async () => {
      const mockWhere = vi.fn().mockResolvedValue([{ count: 0 }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true if record exists', async () => {
      const mockRecord = createTestRecord();

      const mockLimit = vi.fn().mockResolvedValue([mockRecord]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.exists('test-id');

      expect(result).toBe(true);
    });

    it('should return false if record does not exist', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.exists('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should insert record with tenant ID and timestamps', async () => {
      const newRecord = { name: 'New Record' };
      const createdRecord = createTestRecord({ ...newRecord, id: 'mock-uuid-1234' });

      const mockReturning = vi.fn().mockResolvedValue([createdRecord]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const result = await repository.create(newRecord);

      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Record',
          companyId: tenantId,
          id: 'mock-uuid-1234',
        })
      );
      expect(result).toEqual(createdRecord);
    });

    it('should use provided ID if given', async () => {
      const newRecord = { id: 'custom-id', name: 'New Record' };
      const createdRecord = createTestRecord({ ...newRecord });

      const mockReturning = vi.fn().mockResolvedValue([createdRecord]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      await repository.create(newRecord);

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'custom-id',
        })
      );
    });

    it('should include createdBy if userId provided', async () => {
      const userId = createTestUserId();
      const newRecord = { name: 'New Record' };
      const createdRecord = createTestRecord({ ...newRecord, createdBy: userId });

      const mockReturning = vi.fn().mockResolvedValue([createdRecord]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      await repository.create(newRecord, { userId });

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: userId,
        })
      );
    });
  });

  describe('createMany', () => {
    it('should insert multiple records with tenant ID', async () => {
      const newRecords = [
        { name: 'Record 1' },
        { name: 'Record 2' },
      ];
      const createdRecords = newRecords.map(r => createTestRecord(r));

      const mockReturning = vi.fn().mockResolvedValue(createdRecords);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const result = await repository.createMany(newRecords);

      expect(db.insert).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update record with tenant filter', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedRecord = createTestRecord({ ...updateData });

      const mockReturning = vi.fn().mockResolvedValue([updatedRecord]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      const result = await repository.update('test-id', updateData);

      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toEqual(updatedRecord);
    });

    it('should not allow updating tenant ID', async () => {
      const updateData = { name: 'Updated', companyId: 'malicious-tenant' };
      const updatedRecord = createTestRecord({ name: 'Updated' });

      const mockReturning = vi.fn().mockResolvedValue([updatedRecord]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      await repository.update('test-id', updateData);

      // Verify companyId was stripped from update
      expect(mockSet).toHaveBeenCalledWith(
        expect.not.objectContaining({
          companyId: 'malicious-tenant',
        })
      );
    });

    it('should return undefined if record not found', async () => {
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      const result = await repository.update('non-existent-id', { name: 'Test' });

      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete record with tenant filter', async () => {
      const mockReturning = vi.fn().mockResolvedValue([{ id: 'test-id' }]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.delete as any).mockReturnValue({ where: mockWhere });

      const result = await repository.delete('test-id');

      expect(db.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if record not found', async () => {
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.delete as any).mockReturnValue({ where: mockWhere });

      const result = await repository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('getTenantId', () => {
    it('should return the tenant ID', () => {
      expect(repository.getTenantId()).toBe(tenantId);
    });
  });
});
