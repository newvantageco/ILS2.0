/**
 * Mock Database Utilities
 *
 * Provides in-memory database mocking for repository tests.
 * This allows testing repository logic without a real database.
 */

import { vi } from 'vitest';

// Type for mock records
export interface MockRecord {
  id: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

// In-memory storage for mock database
const mockStorage = new Map<string, MockRecord[]>();

/**
 * Creates a mock database implementation
 */
export function createMockDb() {
  // Reset storage before each test
  mockStorage.clear();

  const mockSelect = vi.fn().mockReturnThis();
  const mockFrom = vi.fn().mockReturnThis();
  const mockWhere = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockOffset = vi.fn().mockReturnThis();
  const mockOrderBy = vi.fn().mockReturnThis();
  const mockGroupBy = vi.fn().mockReturnThis();
  const mockHaving = vi.fn().mockReturnThis();
  const mockInnerJoin = vi.fn().mockReturnThis();
  const mockLeftJoin = vi.fn().mockReturnThis();

  const mockInsert = vi.fn().mockReturnThis();
  const mockValues = vi.fn().mockReturnThis();
  const mockReturning = vi.fn();

  const mockUpdate = vi.fn().mockReturnThis();
  const mockSet = vi.fn().mockReturnThis();

  const mockDelete = vi.fn().mockReturnThis();

  return {
    select: mockSelect,
    from: mockFrom,
    where: mockWhere,
    limit: mockLimit,
    offset: mockOffset,
    orderBy: mockOrderBy,
    groupBy: mockGroupBy,
    having: mockHaving,
    innerJoin: mockInnerJoin,
    leftJoin: mockLeftJoin,
    insert: mockInsert,
    values: mockValues,
    returning: mockReturning,
    update: mockUpdate,
    set: mockSet,
    delete: mockDelete,
    // Helper to chain methods
    _chainMocks: () => {
      mockSelect.mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            limit: mockLimit.mockReturnValue({
              offset: mockOffset.mockReturnValue({
                orderBy: mockOrderBy.mockResolvedValue([]),
              }),
            }),
          }),
          innerJoin: mockInnerJoin.mockReturnThis(),
          leftJoin: mockLeftJoin.mockReturnThis(),
          groupBy: mockGroupBy.mockReturnThis(),
          having: mockHaving.mockReturnThis(),
        }),
      });

      mockInsert.mockReturnValue({
        values: mockValues.mockReturnValue({
          returning: mockReturning,
        }),
      });

      mockUpdate.mockReturnValue({
        set: mockSet.mockReturnValue({
          where: mockWhere.mockReturnValue({
            returning: mockReturning,
          }),
        }),
      });

      mockDelete.mockReturnValue({
        where: mockWhere.mockReturnValue({
          returning: mockReturning,
        }),
      });
    },
    _getMocks: () => ({
      select: mockSelect,
      from: mockFrom,
      where: mockWhere,
      limit: mockLimit,
      offset: mockOffset,
      orderBy: mockOrderBy,
      groupBy: mockGroupBy,
      having: mockHaving,
      innerJoin: mockInnerJoin,
      leftJoin: mockLeftJoin,
      insert: mockInsert,
      values: mockValues,
      returning: mockReturning,
      update: mockUpdate,
      set: mockSet,
      delete: mockDelete,
    }),
  };
}

/**
 * Creates a mock table for testing
 */
export function createMockTable(tableName: string) {
  return {
    id: { name: 'id' },
    companyId: { name: 'companyId' },
    createdAt: { name: 'createdAt' },
    updatedAt: { name: 'updatedAt' },
    deletedAt: { name: 'deletedAt' },
    deletedBy: { name: 'deletedBy' },
    _tableName: tableName,
  };
}

/**
 * Create a test record with default values
 */
export function createTestRecord<T extends MockRecord>(
  overrides: Partial<T> = {}
): T {
  const now = new Date();
  return {
    id: `test-${Math.random().toString(36).substr(2, 9)}`,
    companyId: 'test-company-id',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as T;
}

/**
 * Create multiple test records
 */
export function createTestRecords<T extends MockRecord>(
  count: number,
  overridesFn?: (index: number) => Partial<T>
): T[] {
  return Array.from({ length: count }, (_, i) =>
    createTestRecord<T>(overridesFn?.(i) || {})
  );
}

/**
 * Generates a test tenant ID
 */
export function createTestTenantId(): string {
  return `tenant-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a test user ID
 */
export function createTestUserId(): string {
  return `user-${Math.random().toString(36).substr(2, 9)}`;
}
