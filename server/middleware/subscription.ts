import { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../db';
import { users, companies } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { isPlatformAdmin } from '../utils/rbac';
import logger from '../utils/logger';


export interface SubscriptionInfo {
  userPlan: 'free_ecp' | 'full';
  companyPlan: 'free_ecp' | 'full';
  allowedFeatures: string[];
  isPlatformAdmin: boolean;
  isActive: boolean;
}

export interface SubscriptionRequest extends Request {
  subscription?: SubscriptionInfo;
}

/**
 * Middleware to check user and company subscription status
 * Enforces feature access based on subscription tier
 * Platform admins get unrestricted access
 */
export const checkSubscription: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as any;
    const user = authReq.user;

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user ID from different auth sources
    const userId = user.id || user.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Get user subscription details from database
    const [userDetails] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!userDetails) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Platform admin gets all access (check from database using RBAC)
    if (isPlatformAdmin(userDetails.role as any)) {
      authReq.subscription = {
        userPlan: 'full',
        companyPlan: 'full',
        allowedFeatures: ['all'],
        isPlatformAdmin: true,
        isActive: true
      };
      return next();
    }

    if (!userDetails.isActive) {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // If no company, limited access
    if (!userDetails.companyId) {
      authReq.subscription = {
        userPlan: userDetails.subscriptionPlan || 'free_ecp',
        companyPlan: 'free_ecp',
        allowedFeatures: ['ophthalmic_knowledge'],
        isPlatformAdmin: false,
        isActive: true  // Changed from false to true - allow basic access
      };
      return next();
    }

    // Get company subscription details
    const [companyDetails] = await db
      .select({
        subscriptionPlan: companies.subscriptionPlan,
        aiEnabled: companies.aiEnabled,
        stripeSubscriptionStatus: companies.stripeSubscriptionStatus,
        isSubscriptionExempt: companies.isSubscriptionExempt,
        status: companies.status
      })
      .from(companies)
      .where(eq(companies.id, userDetails.companyId));

    if (!companyDetails) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if company is active
    if (companyDetails.status !== 'active' && companyDetails.status !== 'pending_approval') {
      return res.status(403).json({ 
        error: 'Company account is not active',
        status: companyDetails.status
      });
    }

    // Check if AI is enabled for company
    if (!companyDetails.aiEnabled) {
      // Allow if user has individual subscription or is on free tier (knowledge base only)
      if (userDetails.subscriptionPlan === 'full' || userDetails.subscriptionPlan === 'free_ecp') {
        authReq.subscription = {
          userPlan: userDetails.subscriptionPlan,
          companyPlan: 'free_ecp',
          allowedFeatures: userDetails.subscriptionPlan === 'full' 
            ? ['ophthalmic_knowledge', 'patient_analytics', 'inventory', 'sales', 'data_queries']
            : ['ophthalmic_knowledge'],
          isPlatformAdmin: false,
          isActive: true
        };
        return next();
      }
      
      return res.status(403).json({ 
        error: 'AI features are not enabled for your company',
        message: 'Please contact support to enable AI features'
      });
    }

    // Determine if subscription is active
    const isSubscriptionActive = 
      companyDetails.isSubscriptionExempt || // Master admin created companies
      companyDetails.stripeSubscriptionStatus === 'active' ||
      companyDetails.stripeSubscriptionStatus === 'trialing' ||
      companyDetails.subscriptionPlan === 'free_ecp'; // Free tier always "active"

    if (!isSubscriptionActive) {
      return res.status(402).json({ 
        error: 'Subscription required',
        message: 'Please upgrade your subscription to use AI features',
        upgradeUrl: '/billing'
      });
    }

    // Determine allowed features based on plan
    const allowedFeatures = getAllowedFeatures(
      companyDetails.subscriptionPlan,
      userDetails.subscriptionPlan
    );

    authReq.subscription = {
      userPlan: userDetails.subscriptionPlan || 'free_ecp',
      companyPlan: companyDetails.subscriptionPlan,
      allowedFeatures,
      isPlatformAdmin: false,
      isActive: isSubscriptionActive
    };

    next();
  } catch (error: any) {
    logger.error('Subscription check error:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: (req as any).user?.id,
      email: (req as any).user?.email
    });
    res.status(500).json({ 
      error: 'Subscription validation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Determine allowed AI features based on subscription plans
 */
function getAllowedFeatures(companyPlan: string, userPlan: string): string[] {
  // Full subscription gets all features
  if (companyPlan === 'full') {
    return [
      'ophthalmic_knowledge',    // Knowledge base queries
      'patient_analytics',       // Patient data analysis
      'inventory',              // Inventory queries
      'sales',                  // Sales analytics
      'data_queries',           // General database queries
      'advanced_analytics',     // Advanced AI analytics
      'examination_records'     // Eye examination history
    ];
  } 
  
  // Free ECP plan gets knowledge base only
  if (companyPlan === 'free_ecp') {
    return ['ophthalmic_knowledge'];
  }
  
  return [];
}

/**
 * Middleware to require specific features
 * Use after checkSubscription
 */
export const requireFeature = (features: string | string[]) => {
  const featureArray = Array.isArray(features) ? features : [features];
  
  return ((req: Request, res: Response, next: NextFunction) => {
    const subscription = (req as any).subscription as SubscriptionInfo;
    
    if (!subscription) {
      return res.status(500).json({ error: 'Subscription not checked' });
    }

    // Platform admin has all features
    if (subscription.isPlatformAdmin) {
      return next();
    }

    // Check if user has required features
    const hasAccess = featureArray.some(feature => 
      subscription.allowedFeatures.includes(feature) ||
      subscription.allowedFeatures.includes('all')
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Feature not available in your subscription plan',
        requiredFeatures: featureArray,
        currentPlan: subscription.companyPlan,
        upgradeRequired: true
      });
    }

    next();
  }) as RequestHandler;
};

/**
 * Check if query type is allowed for user's subscription
 */
export function isFeatureAllowed(
  queryType: string, 
  subscription: SubscriptionInfo
): boolean {
  if (subscription.isPlatformAdmin || subscription.allowedFeatures.includes('all')) {
    return true;
  }

  const featureMap: Record<string, string> = {
    'sales': 'sales',
    'inventory': 'inventory',
    'patient_analytics': 'patient_analytics',
    'ophthalmic_knowledge': 'ophthalmic_knowledge',
    'examination_records': 'examination_records'
  };

  const requiredFeature = featureMap[queryType] || 'ophthalmic_knowledge';
  return subscription.allowedFeatures.includes(requiredFeature);
}
