/**
 * Resource Quota Middleware
 * Enforces usage limits based on subscription tier
 * Prevents resource exhaustion from any single company
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { orders, patients, users, products, eyeExaminations } from '@shared/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { cacheService } from '../services/CacheService';

/**
 * Resource quotas by subscription plan
 */
export const SubscriptionQuotas = {
  FREE: {
    maxUsers: 3,
    maxPatients: 100,
    maxOrdersPerMonth: 50,
    maxProducts: 100,
    maxStorageMB: 100,
    maxExaminationsPerMonth: 25,
  },
  BASIC: {
    maxUsers: 10,
    maxPatients: 1000,
    maxOrdersPerMonth: 500,
    maxProducts: 1000,
    maxStorageMB: 1000,
    maxExaminationsPerMonth: 200,
  },
  PROFESSIONAL: {
    maxUsers: 50,
    maxPatients: 10000,
    maxOrdersPerMonth: 5000,
    maxProducts: 10000,
    maxStorageMB: 10000,
    maxExaminationsPerMonth: 2000,
  },
  ENTERPRISE: {
    maxUsers: -1,         // Unlimited
    maxPatients: -1,      // Unlimited
    maxOrdersPerMonth: -1, // Unlimited
    maxProducts: -1,      // Unlimited
    maxStorageMB: -1,     // Unlimited
    maxExaminationsPerMonth: -1, // Unlimited
  },
} as const;

type QuotaType = keyof typeof SubscriptionQuotas.FREE;

interface QuotaCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  quotaType: QuotaType;
  message?: string;
}

/**
 * Get company's subscription plan
 */
async function getCompanyPlan(companyId: string): Promise<keyof typeof SubscriptionQuotas> {
  try {
    // Try cache first
    const cached = await cacheService.get<string>(companyId, 'subscription_plan', {
      namespace: 'system',
      ttl: 300, // 5 minutes
    });

    if (cached) {
      return cached as keyof typeof SubscriptionQuotas;
    }

    // Query database
    const companyData = (await db.query.companies.findFirst({
      where: (companies, { eq }) => eq(companies.id, companyId),
      columns: { subscriptionPlan: true },
    })) as any;

    const plan = (companyData?.subscriptionPlan?.toUpperCase() || 'FREE') as keyof typeof SubscriptionQuotas;

    // Cache the result
    await cacheService.set(companyId, 'subscription_plan', plan, {
      namespace: 'system',
      ttl: 300,
    });

    return plan;
  } catch (error) {
    console.error('Error fetching company plan:', error);
    return 'FREE'; // Fail safe to most restrictive plan
  }
}

/**
 * Check if company has reached a specific quota
 */
async function checkQuota(
  companyId: string,
  quotaType: QuotaType
): Promise<QuotaCheckResult> {
  const plan = await getCompanyPlan(companyId);
  const quotas = SubscriptionQuotas[plan];
  const limit = quotas[quotaType] as number;

  // -1 means unlimited
  if (limit === -1) {
    return {
      allowed: true,
      current: 0,
      limit: -1,
      quotaType,
    };
  }

  let current = 0;

  try {
    switch (quotaType) {
      case 'maxUsers':
        const [userCount] = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.companyId, companyId));
        current = userCount?.count || 0;
        break;

      case 'maxPatients':
        const [patientCount] = await db
          .select({ count: count() })
          .from(patients)
          .where(eq(patients.companyId, companyId));
        current = patientCount?.count || 0;
        break;

      case 'maxProducts':
        const [productCount] = await db
          .select({ count: count() })
          .from(products)
          .where(eq(products.companyId, companyId));
        current = productCount?.count || 0;
        break;

      case 'maxOrdersPerMonth':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const [orderCount] = await db
          .select({ count: count() })
          .from(orders)
          .where(
            and(
              eq(orders.companyId, companyId),
              sql`${orders.orderDate} >= ${thirtyDaysAgo}`
            )
          );
        current = orderCount?.count || 0;
        break;

      case 'maxExaminationsPerMonth':
        const thirtyDaysAgoExam = new Date();
        thirtyDaysAgoExam.setDate(thirtyDaysAgoExam.getDate() - 30);
        
        const [examCount] = await db
          .select({ count: count() })
          .from(eyeExaminations)
          .where(
            and(
              eq(eyeExaminations.companyId, companyId),
              sql`${eyeExaminations.examinationDate} >= ${thirtyDaysAgoExam}`
            )
          );
        current = examCount?.count || 0;
        break;

      case 'maxStorageMB':
        // Storage check would require file system or S3 integration
        // For now, return allowed
        return { allowed: true, current: 0, limit, quotaType };

      default:
        return { allowed: true, current: 0, limit, quotaType };
    }

    const allowed = current < limit;

    return {
      allowed,
      current,
      limit,
      quotaType,
      message: allowed 
        ? undefined 
        : `You have reached the ${quotaType} limit (${limit}) for your ${plan} plan. Upgrade to continue.`,
    };
  } catch (error) {
    console.error(`Error checking quota ${quotaType}:`, error);
    // On error, allow the operation (fail open)
    return { allowed: true, current: 0, limit, quotaType };
  }
}

/**
 * Middleware to enforce user creation quota
 */
export function checkUserQuota() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId || (req.body?.companyId as string);

      if (!companyId) {
        return next();
      }

      const result = await checkQuota(companyId, 'maxUsers');

      if (!result.allowed) {
        return res.status(403).json({
          error: 'Quota exceeded',
          message: result.message,
          quota: {
            type: result.quotaType,
            current: result.current,
            limit: result.limit,
          },
        });
      }

      next();
    } catch (error) {
      console.error('User quota check error:', error);
      next(); // Fail open
    }
  };
}

/**
 * Middleware to enforce patient creation quota
 */
export function checkPatientQuota() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return next();
      }

      const result = await checkQuota(companyId, 'maxPatients');

      if (!result.allowed) {
        return res.status(403).json({
          error: 'Quota exceeded',
          message: result.message,
          quota: {
            type: result.quotaType,
            current: result.current,
            limit: result.limit,
          },
        });
      }

      next();
    } catch (error) {
      console.error('Patient quota check error:', error);
      next();
    }
  };
}

/**
 * Middleware to enforce order creation quota
 */
export function checkOrderQuota() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return next();
      }

      const result = await checkQuota(companyId, 'maxOrdersPerMonth');

      if (!result.allowed) {
        return res.status(403).json({
          error: 'Quota exceeded',
          message: result.message,
          quota: {
            type: result.quotaType,
            current: result.current,
            limit: result.limit,
          },
        });
      }

      next();
    } catch (error) {
      console.error('Order quota check error:', error);
      next();
    }
  };
}

/**
 * Middleware to enforce product creation quota
 */
export function checkProductQuota() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return next();
      }

      const result = await checkQuota(companyId, 'maxProducts');

      if (!result.allowed) {
        return res.status(403).json({
          error: 'Quota exceeded',
          message: result.message,
          quota: {
            type: result.quotaType,
            current: result.current,
            limit: result.limit,
          },
        });
      }

      next();
    } catch (error) {
      console.error('Product quota check error:', error);
      next();
    }
  };
}

/**
 * Middleware to enforce examination creation quota
 */
export function checkExaminationQuota() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return next();
      }

      const result = await checkQuota(companyId, 'maxExaminationsPerMonth');

      if (!result.allowed) {
        return res.status(403).json({
          error: 'Quota exceeded',
          message: result.message,
          quota: {
            type: result.quotaType,
            current: result.current,
            limit: result.limit,
          },
        });
      }

      next();
    } catch (error) {
      console.error('Examination quota check error:', error);
      next();
    }
  };
}

/**
 * Get all quota statuses for a company
 */
export async function getCompanyQuotaStatus(companyId: string) {
  const plan = await getCompanyPlan(companyId);
  const quotas = SubscriptionQuotas[plan];

  const results = await Promise.all([
    checkQuota(companyId, 'maxUsers'),
    checkQuota(companyId, 'maxPatients'),
    checkQuota(companyId, 'maxOrdersPerMonth'),
    checkQuota(companyId, 'maxProducts'),
    checkQuota(companyId, 'maxExaminationsPerMonth'),
  ]);

  return {
    plan,
    quotas: {
      users: results[0],
      patients: results[1],
      ordersPerMonth: results[2],
      products: results[3],
      examinationsPerMonth: results[4],
    },
  };
}
