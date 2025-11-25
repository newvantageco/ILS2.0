/**
 * pgvector Schema Extensions
 *
 * This file adds vector type support to the schema for semantic search.
 * To use pgvector with Drizzle ORM, we define a custom type.
 *
 * Usage:
 * import { vector } from './schema-pgvector';
 * embedding: vector('embedding', 1536)
 */

import { customType } from 'drizzle-orm/pg-core';

/**
 * Custom vector type for pgvector
 *
 * @param name - Column name
 * @param dimensions - Vector dimensions (e.g., 1536 for OpenAI ada-002)
 *
 * @example
 * export const myTable = pgTable('my_table', {
 *   embedding: vector('embedding', 1536)
 * });
 */
export const vector = (name: string, dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]): string {
      // Convert JavaScript array to PostgreSQL vector format
      return JSON.stringify(value);
    },
    fromDriver(value: string): number[] {
      // Convert PostgreSQL vector to JavaScript array
      // pgvector returns vectors as strings like "[1,2,3]"
      if (typeof value === 'string') {
        // Remove brackets and split by comma
        const cleaned = value.replace(/[\[\]]/g, '');
        return cleaned.split(',').map(Number);
      }
      // If already an array (shouldn't happen but defensive)
      return value as unknown as number[];
    },
  })(name);

/**
 * Type helper for vector columns
 */
export type VectorColumn = ReturnType<typeof vector>;

/**
 * Helper function to calculate cosine distance in SQL
 *
 * @example
 * const results = await db.execute(sql`
 *   SELECT *, ${cosineDistance('embedding', queryEmbedding)} as distance
 *   FROM ai_knowledge_base
 *   ORDER BY distance
 *   LIMIT 5
 * `);
 */
import { sql } from 'drizzle-orm';

export function cosineDistance(columnName: string, embedding: number[]) {
  return sql`${sql.raw(columnName)} <=> ${JSON.stringify(embedding)}::vector`;
}

/**
 * Helper function to calculate cosine similarity (1 - distance)
 */
export function cosineSimilarity(columnName: string, embedding: number[]) {
  return sql`1 - (${sql.raw(columnName)} <=> ${JSON.stringify(embedding)}::vector)`;
}

/**
 * Helper function to calculate L2 distance (Euclidean)
 */
export function l2Distance(columnName: string, embedding: number[]) {
  return sql`${sql.raw(columnName)} <-> ${JSON.stringify(embedding)}::vector`;
}

/**
 * Helper function to calculate inner product distance
 */
export function innerProductDistance(columnName: string, embedding: number[]) {
  return sql`${sql.raw(columnName)} <#> ${JSON.stringify(embedding)}::vector`;
}
