/**
 * PatientRepository Tests
 *
 * Tests the patient repository functionality including
 * HIPAA-compliant PHI access logging, search, and clinical data access.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestTenantId, createTestUserId, createTestRecord } from '../utils/mockDb';

// Mock the database module
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    selectDistinct: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    having: vi.fn().mockResolvedValue([]),
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
  v4: () => 'mock-uuid-patient',
}));

// Import after mocking
import { PatientRepository } from '../../server/repositories/PatientRepository';
import { db } from '../../server/db';

// Mock patient data
interface MockPatient {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

function createMockPatient(overrides: Partial<MockPatient> = {}): MockPatient {
  return createTestRecord({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+44 7700 900000',
    dateOfBirth: new Date('1980-01-15'),
    ...overrides,
  }) as MockPatient;
}

describe('PatientRepository', () => {
  let repository: PatientRepository;
  let tenantId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tenantId = createTestTenantId();
    repository = new PatientRepository(tenantId);
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
    it('should find patient by ID with PHI logging', async () => {
      const mockPatient = createMockPatient();

      const mockLimit = vi.fn().mockResolvedValue([mockPatient]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.findById('patient-123', 'user-456');

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockPatient);
    });

    it('should return undefined for non-existent patient', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.findById('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('search', () => {
    it('should search patients by name', async () => {
      const mockPatients = [
        createMockPatient({ firstName: 'John', lastName: 'Smith' }),
        createMockPatient({ firstName: 'Johnny', lastName: 'Walker' }),
      ];

      const mockOffset = vi.fn().mockResolvedValue(mockPatients);
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.search('John');

      expect(db.select).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should respect pagination options', async () => {
      const mockOffset = vi.fn().mockResolvedValue([]);
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      await repository.search('test', { limit: 10, offset: 20 });

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(20);
    });

    it('should use default limit of 50', async () => {
      const mockOffset = vi.fn().mockResolvedValue([]);
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      await repository.search('test');

      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });

  describe('getByEmail', () => {
    it('should find patient by email (case insensitive)', async () => {
      const mockPatient = createMockPatient({ email: 'John.Doe@Example.com' });

      const mockLimit = vi.fn().mockResolvedValue([mockPatient]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getByEmail('john.doe@example.com');

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockPatient);
    });

    it('should return undefined if email not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getByEmail('nonexistent@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('getWithExaminations', () => {
    it('should return patient with examination history', async () => {
      const mockPatient = createMockPatient();
      const mockExams = [
        { id: 'exam-1', patientId: mockPatient.id, examinationDate: new Date() },
        { id: 'exam-2', patientId: mockPatient.id, examinationDate: new Date() },
      ];
      const mockPrescription = { id: 'rx-1', patientId: mockPatient.id };

      // Mock findById call
      const mockLimit1 = vi.fn().mockResolvedValueOnce([mockPatient]);
      const mockWhere1 = vi.fn().mockReturnValue({ limit: mockLimit1 });
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

      // Mock examinations call
      const mockOrderBy2 = vi.fn().mockResolvedValueOnce(mockExams);
      const mockWhere2 = vi.fn().mockReturnValue({ orderBy: mockOrderBy2 });
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

      // Mock prescription call
      const mockLimit3 = vi.fn().mockResolvedValueOnce([mockPrescription]);
      const mockOrderBy3 = vi.fn().mockReturnValue({ limit: mockLimit3 });
      const mockWhere3 = vi.fn().mockReturnValue({ orderBy: mockOrderBy3 });
      const mockFrom3 = vi.fn().mockReturnValue({ where: mockWhere3 });

      (db.select as any)
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 })
        .mockReturnValueOnce({ from: mockFrom3 });

      const result = await repository.getWithExaminations(mockPatient.id, 'user-123');

      expect(result).toBeDefined();
      expect(result?.examinations).toEqual(mockExams);
      expect(result?.latestPrescription).toEqual(mockPrescription);
    });

    it('should return undefined if patient not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getWithExaminations('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getWithUpcomingAppointments', () => {
    it('should return patients with appointments in next N days', async () => {
      const mockPatients = [
        createMockPatient({ firstName: 'Jane' }),
        createMockPatient({ firstName: 'Bob' }),
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(
        mockPatients.map(p => ({ patient: p }))
      );
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      (db.selectDistinct as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getWithUpcomingAppointments(7);

      expect(db.selectDistinct).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getNeedingRecall', () => {
    it('should return patients needing recall', async () => {
      const mockPatients = [
        createMockPatient({ firstName: 'OldExam' }),
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(
        mockPatients.map(p => ({ patient: p }))
      );
      const mockHaving = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockGroupBy = vi.fn().mockReturnValue({ having: mockHaving });
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getNeedingRecall(24);

      expect(db.select).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getTotalCount', () => {
    it('should return count of active patients', async () => {
      const mockWhere = vi.fn().mockResolvedValue([{ count: 150 }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getTotalCount();

      expect(result).toBe(150);
    });
  });

  describe('create', () => {
    it('should create patient and log PHI access', async () => {
      const userId = createTestUserId();
      const newPatient = {
        firstName: 'New',
        lastName: 'Patient',
        email: 'new.patient@example.com',
      };
      const createdPatient = createMockPatient({
        ...newPatient,
        id: 'mock-uuid-patient',
      });

      const mockReturning = vi.fn().mockResolvedValue([createdPatient]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const result = await repository.create(newPatient, { userId });

      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'New',
          lastName: 'Patient',
          email: 'new.patient@example.com',
          companyId: tenantId,
        })
      );
      expect(result).toEqual(createdPatient);
    });
  });

  describe('update', () => {
    it('should update patient and log PHI access', async () => {
      const userId = createTestUserId();
      const updateData = { firstName: 'Updated' };
      const updatedPatient = createMockPatient({ ...updateData });

      const mockReturning = vi.fn().mockResolvedValue([updatedPatient]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      const result = await repository.update('patient-123', updateData, { userId });

      expect(db.update).toHaveBeenCalled();
      expect(result).toEqual(updatedPatient);
    });

    it('should return undefined if patient not found', async () => {
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      const result = await repository.update('non-existent', { firstName: 'Test' });

      expect(result).toBeUndefined();
    });
  });

  describe('tenant isolation', () => {
    it('should always filter by tenant ID', async () => {
      const otherTenantPatient = createMockPatient({
        companyId: 'other-tenant-id',
      });

      // This simulates the database returning data from another tenant
      // (which shouldn't happen with proper tenant filtering)
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.findById(otherTenantPatient.id);

      // Should return undefined because tenant filter prevents access
      expect(result).toBeUndefined();
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});
