/**
 * User Repository
 *
 * Tenant-scoped repository for user management.
 * Handles users within a company context.
 *
 * NOTE: For authentication flows that need cross-tenant access,
 * use AuthRepository instead.
 */

import { db } from '../db';
import {
  users,
  userRoles,
  userPreferences,
} from '@shared/schema';
import type { User, UserPreferences } from '@shared/schema';
import { eq, and, desc, sql, or, inArray } from 'drizzle-orm';
import { BaseRepository, type QueryOptions } from './BaseRepository';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UserWithRoles extends User {
  roles?: Array<{
    id: string;
    role: string;
    isPrimary: boolean;
  }>;
  preferences?: UserPreferences;
}

export interface UserFilters {
  role?: string;
  status?: string;
  isActive?: boolean;
}

// ============================================
// USER REPOSITORY CLASS
// ============================================

export class UserRepository extends BaseRepository<typeof users, User, User> {
  constructor(tenantId: string) {
    super(users, tenantId, 'companyId');
  }

  // ============================================
  // EXTENDED QUERY METHODS
  // ============================================

  /**
   * Get user with all roles
   */
  async getUserWithRoles(id: string): Promise<UserWithRoles | undefined> {
    const user = await this.findById(id);

    if (!user) return undefined;

    // Get all roles for user
    const roles = await db
      .select({
        id: userRoles.id,
        role: userRoles.role,
        isPrimary: userRoles.isPrimary,
      })
      .from(userRoles)
      .where(eq(userRoles.userId, id));

    // Get preferences
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, id))
      .limit(1);

    return {
      ...user,
      roles,
      preferences: prefs,
    };
  }

  /**
   * Get user by email within tenant
   */
  async getByEmail(email: string): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.companyId, this.tenantId),
        sql`LOWER(${users.email}) = LOWER(${email})`
      ))
      .limit(1);

    return result;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences | undefined> {
    // Verify user belongs to tenant
    const user = await this.findById(userId);
    if (!user) return undefined;

    // Check if preferences exist
    const [existing] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(userPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId))
        .returning();

      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(userPreferences)
        .values({
          id: userId,
          userId,
          ...preferences,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .returning();

      return created;
    }
  }

  /**
   * Get users by role
   */
  async getByRole(role: string, options: QueryOptions = {}): Promise<User[]> {
    return this.findMany(
      eq(users.role, role),
      options
    );
  }

  /**
   * Get all suppliers (users with supplier role) in tenant
   */
  async getSuppliers(): Promise<User[]> {
    return this.getByRole('supplier');
  }

  /**
   * Get all ECPs in tenant
   */
  async getECPs(): Promise<User[]> {
    return this.getByRole('ecp');
  }

  /**
   * Get all lab technicians in tenant
   */
  async getLabTechs(): Promise<User[]> {
    return this.getByRole('lab_tech');
  }

  /**
   * Search users by name or email
   */
  async search(query: string, options: QueryOptions = {}): Promise<User[]> {
    const { limit = 50, offset = 0 } = options;
    const searchTerm = `%${query}%`;

    const result = await db
      .select()
      .from(users)
      .where(and(
        eq(users.companyId, this.tenantId),
        or(
          sql`${users.firstName} ILIKE ${searchTerm}`,
          sql`${users.lastName} ILIKE ${searchTerm}`,
          sql`${users.email} ILIKE ${searchTerm}`,
          sql`CONCAT(${users.firstName}, ' ', ${users.lastName}) ILIKE ${searchTerm}`
        )
      ))
      .orderBy(users.lastName, users.firstName)
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Get active users count
   */
  async getActiveCount(): Promise<number> {
    return this.count(eq(users.accountStatus, 'active'));
  }

  /**
   * Get users by multiple IDs
   */
  async getByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const result = await db
      .select()
      .from(users)
      .where(and(
        eq(users.companyId, this.tenantId),
        inArray(users.id, ids)
      ));

    return result;
  }
}

export default UserRepository;
