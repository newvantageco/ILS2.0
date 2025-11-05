/**
 * Database Transaction Utilities
 * Provides safe transaction wrappers with automatic rollback on error
 */

import { Pool } from '@neondatabase/serverless';
import type { PoolClient } from '@neondatabase/serverless';
import { pool } from '../db';
import { createLogger } from './logger';
import { DatabaseError } from './ApiError';

const logger = createLogger('Transaction');

/**
 * Execute a function within a database transaction
 * Automatically commits on success or rolls back on error
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  customPool?: Pool
): Promise<T> {
  const dbPool = customPool || pool;
  const client = await dbPool.connect();

  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');

    const result = await callback(client);

    await client.query('COMMIT');
    logger.debug('Transaction committed');

    return result;
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.warn('Transaction rolled back', error);

    // Convert database errors to ApiError
    throw new DatabaseError(
      error.message || 'Database transaction failed',
      {
        code: error.code,
        detail: error.detail,
        hint: error.hint,
      }
    );
  } finally {
    client.release();
  }
}

/**
 * Execute multiple queries within a transaction
 * Useful for batch operations
 */
export async function executeInTransaction(
  queries: Array<{ text: string; values?: any[] }>,
  customPool?: Pool
): Promise<any[]> {
  return withTransaction(async (client) => {
    const results: any[] = [];

    for (const query of queries) {
      const result = await client.query(query.text, query.values);
      results.push(result);
    }

    return results;
  }, customPool);
}

/**
 * Transaction-safe insert that returns the inserted row
 */
export async function transactionalInsert<T = any>(
  table: string,
  data: Record<string, any>,
  returning: string = '*',
  client?: PoolClient
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

  const query = {
    text: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${returning}`,
    values,
  };

  if (client) {
    const result = await client.query(query.text, query.values);
    return result.rows[0];
  }

  return withTransaction(async (txClient) => {
    const result = await txClient.query(query.text, query.values);
    return result.rows[0];
  });
}

/**
 * Transaction-safe update that returns the updated row
 */
export async function transactionalUpdate<T = any>(
  table: string,
  id: number,
  data: Record<string, any>,
  returning: string = '*',
  client?: PoolClient
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const query = {
    text: `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING ${returning}`,
    values: [...values, id],
  };

  if (client) {
    const result = await client.query(query.text, query.values);
    return result.rows[0];
  }

  return withTransaction(async (txClient) => {
    const result = await txClient.query(query.text, query.values);
    return result.rows[0];
  });
}

/**
 * Transaction-safe delete
 */
export async function transactionalDelete(
  table: string,
  id: number,
  client?: PoolClient
): Promise<void> {
  const query = {
    text: `DELETE FROM ${table} WHERE id = $1`,
    values: [id],
  };

  if (client) {
    await client.query(query.text, query.values);
    return;
  }

  await withTransaction(async (txClient) => {
    await txClient.query(query.text, query.values);
  });
}

/**
 * Retry wrapper for transient database errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Only retry on transient errors
      const isTransient =
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === '40001' || // Serialization failure
        error.code === '40P01'; // Deadlock detected

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      logger.warn(`Database operation failed, retrying (${attempt}/${maxRetries})`, {
        error: error.message,
        code: error.code,
      });

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

/**
 * Execute a query with automatic retry on transient errors
 */
export async function queryWithRetry<T = any>(
  text: string,
  values?: any[],
  maxRetries: number = 3
): Promise<T[]> {
  return withRetry(async () => {
    const result = await pool.query(text, values);
    return result.rows;
  }, maxRetries);
}

/**
 * Optimistic locking helper
 * Prevents concurrent updates by checking version
 */
export async function optimisticUpdate<T = any>(
  table: string,
  id: number,
  data: Record<string, any>,
  expectedVersion: number,
  client?: PoolClient
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  // Increment version
  const newVersion = expectedVersion + 1;

  const query = {
    text: `
      UPDATE ${table} 
      SET ${setClause}, version = $${keys.length + 1}
      WHERE id = $${keys.length + 2} AND version = $${keys.length + 3}
      RETURNING *
    `,
    values: [...values, newVersion, id, expectedVersion],
  };

  const executeQuery = async (txClient: PoolClient) => {
    const result = await txClient.query(query.text, query.values);

    if (result.rowCount === 0) {
      throw new DatabaseError('Concurrent modification detected. Please refresh and try again.', {
        code: 'OPTIMISTIC_LOCK_FAILURE',
        id,
        expectedVersion,
      });
    }

    return result.rows[0];
  };

  if (client) {
    return executeQuery(client);
  }

  return withTransaction(executeQuery);
}

/**
 * Batch insert helper
 */
export async function batchInsert<T = any>(
  table: string,
  items: Record<string, any>[],
  returning: string = '*',
  batchSize: number = 100
): Promise<T[]> {
  if (items.length === 0) {
    return [];
  }

  const results: T[] = [];

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await withTransaction(async (client) => {
      for (const item of batch) {
        const inserted = await transactionalInsert<T>(table, item, returning, client);
        results.push(inserted);
      }
    });
  }

  return results;
}

export default {
  withTransaction,
  executeInTransaction,
  transactionalInsert,
  transactionalUpdate,
  transactionalDelete,
  withRetry,
  queryWithRetry,
  optimisticUpdate,
  batchInsert,
};
