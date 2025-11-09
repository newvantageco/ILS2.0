# AI Access Control Analysis

## Current Implementation Status: ⚠️ PARTIALLY COMPLETE

### Summary
The AI system will **NOT** work as designed for paid users and master admins due to **missing subscription/role-based access control** in the unified AI routes.

---

## Issues Found

### 🔴 Issue 1: No Subscription Tier Checking
**Location**: `/server/routes/unified-ai.ts`

**Problem**: The API endpoint does NOT check:
- User's subscription plan (`subscriptionPlan` field in users table)
- Company's subscription plan (`subscriptionPlan` field in companies table)
- Whether features are allowed for the user's tier

**Current Code**:
```typescript
router.post("/chat", authenticateUser, async (req, res) => {
  // ❌ NO subscription checking
  // ❌ NO feature gating
  // ❌ NO rate limiting by tier
  
  const query = {
    message: message.trim(),
    companyId: user.companyId,  // ✅ Has company isolation
    userId: user.userId,
    // ... but NO subscription validation
  };
```

**What's Missing**:
1. Check if user's `subscriptionPlan` allows AI access
2. Check if company's `subscriptionPlan` is active (`free_ecp` vs `full`)
3. Validate query type against subscription tier features
4. Rate limiting based on subscription level

---

### 🔴 Issue 2: No Master Admin Special Access
**Location**: `/server/routes/unified-ai.ts`

**Problem**: Master admin (`platform_admin` role) is not granted special privileges:
- No bypass of subscription checks
- No access to all company data (for support)
- No enhanced AI features
- No usage analytics across all tenants

**Schema Shows**:
```typescript
// users table has:
role: roleEnum("role"), // includes "platform_admin"

// But unified-ai.ts doesn't check this!
```

---

### 🔴 Issue 3: Frontend Has Tier Logic, Backend Doesn't
**Location**: `/client/src/components/AIAssistant/AIAssistant.tsx`

**Frontend HAS subscription checking**:
```tsx
const availableFeatures = {
  basic: ['ophthalmic_knowledge'],
  professional: ['ophthalmic_knowledge', 'sales', 'inventory'],
  enterprise: ['ophthalmic_knowledge', 'sales', 'inventory', 'patient_analytics']
};
```

**Backend DOESN'T enforce this!**
- Frontend can be bypassed with curl/Postman
- No server-side validation of feature access
- Security vulnerability

---

### 🟡 Issue 4: Free ECP Plan Not Handled
**Schema Shows**:
```typescript
subscriptionPlanEnum = pgEnum("subscription_plan", ["full", "free_ecp"]);

// Routes.ts has logic:
const isFreeEcpPlan = (user?: User | null) => 
  user?.role === "ecp" && user.subscriptionPlan === FREE_ECP_PLAN;
```

**But unified-ai.ts doesn't use this!**
- Free ECP users might get full AI access
- No differentiation between paying and non-paying users

---

## What Works Currently

### ✅ Authentication
- `authenticateUser` middleware validates JWT token
- Checks user is active and verified
- Extracts `companyId` for data isolation

### ✅ Multi-Tenant Isolation
- UnifiedAIService uses `companyId` to filter data
- Database queries are tenant-isolated
- No data leakage between companies

### ✅ Database Tool Access
- AI can query patients, inventory, orders, exams
- All queries scoped to user's company
- Function calling works correctly

---

## Required Fixes

### Fix 1: Add Subscription Middleware
**Create**: `/server/middleware/subscription.ts`

```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../db';
import { users, companies } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export interface SubscriptionInfo {
  userPlan: 'free_ecp' | 'full';
  companyPlan: 'free_ecp' | 'full';
  allowedFeatures: string[];
  isPlatformAdmin: boolean;
}

export const checkSubscription: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as any;
    const user = authReq.user;

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Platform admin gets all access
    if (user.role === 'platform_admin') {
      authReq.subscription = {
        userPlan: 'full',
        companyPlan: 'full',
        allowedFeatures: ['all'],
        isPlatformAdmin: true
      };
      return next();
    }

    // Get user and company subscription details
    const [userDetails] = await db
      .select({
        subscriptionPlan: users.subscriptionPlan,
        companyId: users.companyId
      })
      .from(users)
      .where(eq(users.id, user.id));

    if (!userDetails.companyId) {
      return res.status(403).json({ error: 'No company associated' });
    }

    const [companyDetails] = await db
      .select({
        subscriptionPlan: companies.subscriptionPlan,
        aiEnabled: companies.aiEnabled,
        stripeSubscriptionStatus: companies.stripeSubscriptionStatus
      })
      .from(companies)
      .where(eq(companies.id, userDetails.companyId));

    // Check if AI is enabled
    if (!companyDetails.aiEnabled) {
      return res.status(403).json({ 
        error: 'AI features not enabled for your company' 
      });
    }

    // Check subscription status
    const isActive = companyDetails.stripeSubscriptionStatus === 'active' ||
                     companyDetails.subscriptionPlan === 'full';

    if (!isActive && companyDetails.subscriptionPlan !== 'free_ecp') {
      return res.status(402).json({ 
        error: 'Subscription required',
        message: 'Please upgrade your subscription to use AI features'
      });
    }

    // Determine allowed features
    const allowedFeatures = getAllowedFeatures(
      companyDetails.subscriptionPlan,
      userDetails.subscriptionPlan
    );

    authReq.subscription = {
      userPlan: userDetails.subscriptionPlan,
      companyPlan: companyDetails.subscriptionPlan,
      allowedFeatures,
      isPlatformAdmin: false
    };

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Subscription validation failed' });
  }
};

function getAllowedFeatures(companyPlan: string, userPlan: string) {
  if (companyPlan === 'full') {
    return [
      'ophthalmic_knowledge',
      'patient_analytics',
      'inventory',
      'sales',
      'data_queries',
      'advanced_analytics'
    ];
  } else if (companyPlan === 'free_ecp') {
    return ['ophthalmic_knowledge']; // Knowledge base only
  }
  return [];
}
```

---

### Fix 2: Update Unified AI Route
**Update**: `/server/routes/unified-ai.ts`

```typescript
import { checkSubscription } from "../middleware/subscription";

router.post("/chat", authenticateUser, checkSubscription, async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;
    const user = (req as any).user;
    const subscription = (req as any).subscription;

    // Validate feature access
    const queryType = context?.queryType || 'ophthalmic_knowledge';
    
    if (!subscription.isPlatformAdmin) {
      const featureMap: Record<string, string> = {
        'sales': 'sales',
        'inventory': 'inventory',
        'patient_analytics': 'patient_analytics',
        'ophthalmic_knowledge': 'ophthalmic_knowledge'
      };

      const requiredFeature = featureMap[queryType];
      
      if (requiredFeature && 
          !subscription.allowedFeatures.includes(requiredFeature) &&
          !subscription.allowedFeatures.includes('all')) {
        return res.status(403).json({
          success: false,
          error: 'Feature not available in your subscription plan',
          upgradeRequired: true,
          requiredFeature
        });
      }
    }

    // Build query with subscription context
    const query = {
      message: message.trim(),
      companyId: user.companyId,
      userId: user.userId,
      conversationId: conversationId || undefined,
      context: {
        ...context,
        subscriptionTier: subscription.companyPlan,
        isPlatformAdmin: subscription.isPlatformAdmin,
        allowedFeatures: subscription.allowedFeatures
      }
    };

    // Get AI response
    const response = await aiService.chat(query);

    // Return with subscription info
    return res.json({
      success: true,
      data: {
        answer: response.answer,
        confidence: response.confidence,
        conversationId: response.conversationId,
        sources: response.sources,
        toolsUsed: response.toolsUsed,
        metadata: {
          ...response.metadata,
          subscriptionPlan: subscription.companyPlan
        }
      }
    });

  } catch (error: any) {
    console.error("Unified AI chat error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred processing your request"
    });
  }
});
```

---

### Fix 3: Add Usage Limits
**Create**: `/server/middleware/rateLimiting.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

const usageCache = new Map<string, { count: number, resetAt: Date }>();

export const aiRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const subscription = (req as any).subscription;
  const companyId = (req as any).user.companyId;

  // Platform admin has no limits
  if (subscription.isPlatformAdmin) {
    return next();
  }

  const limits: Record<string, number> = {
    'free_ecp': 50,    // 50 requests/day
    'full': 1000       // 1000 requests/day
  };

  const limit = limits[subscription.companyPlan] || 0;

  // Check usage
  const key = `ai-usage:${companyId}`;
  const now = new Date();
  let usage = usageCache.get(key);

  if (!usage || usage.resetAt < now) {
    usage = { count: 0, resetAt: getNextMidnight() };
    usageCache.set(key, usage);
  }

  if (usage.count >= limit) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      limit,
      resetAt: usage.resetAt
    });
  }

  usage.count++;
  next();
};

function getNextMidnight() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}
```

---

## Implementation Checklist

### High Priority
- [ ] Create subscription middleware
- [ ] Add subscription check to AI route
- [ ] Implement platform admin bypass
- [ ] Add feature-level access control
- [ ] Test with different subscription tiers

### Medium Priority
- [ ] Add rate limiting by subscription
- [ ] Create usage tracking dashboard
- [ ] Add upgrade prompts in responses
- [ ] Log subscription violations

### Low Priority
- [ ] Add subscription expiry warnings
- [ ] Create admin override UI
- [ ] Add usage analytics
- [ ] Implement tiered pricing features

---

## Testing Scenarios

### Test 1: Free ECP User
**Setup**: User with `subscriptionPlan: 'free_ecp'`

**Expected**:
- ✅ Can ask knowledge questions
- ❌ Cannot query database (patients, inventory)
- ❌ Cannot use advanced analytics
- Gets "upgrade required" message

### Test 2: Full Subscription User
**Setup**: User with `subscriptionPlan: 'full'`

**Expected**:
- ✅ Can ask knowledge questions
- ✅ Can query all database tools
- ✅ Can use advanced analytics
- ✅ Has higher rate limits

### Test 3: Platform Admin
**Setup**: User with `role: 'platform_admin'`

**Expected**:
- ✅ Can access all features
- ✅ No rate limits
- ✅ Can query any company (for support)
- ✅ Has enhanced debugging tools

### Test 4: Expired Subscription
**Setup**: Company with expired Stripe subscription

**Expected**:
- ❌ AI access blocked
- Gets "subscription expired" message
- Redirect to billing page

---

## Current Risk Assessment

### 🔴 Critical Risks
1. **Anyone authenticated can use AI features** - No payment required!
2. **Free users get paid features** - Revenue loss
3. **No platform admin tools** - Support issues
4. **Bypass-able frontend checks** - Security vulnerability

### 🟡 Medium Risks
1. No rate limiting - Abuse potential
2. No usage tracking - Can't bill properly
3. No upgrade prompts - Lost upsell opportunities

### 🟢 What's Working
1. Authentication works
2. Multi-tenant isolation works
3. Database tools work
4. Core AI functionality works

---

## Recommendation

**Status**: 🔴 NOT PRODUCTION READY FOR PAID SERVICE

**Must Fix Before Launch**:
1. ✅ Create subscription middleware (30 min)
2. ✅ Update AI routes with checks (15 min)
3. ✅ Add platform admin bypass (10 min)
4. ✅ Test all subscription tiers (1 hour)

**Estimated Time**: 2 hours

**After fixes, status will be**: 🟢 PRODUCTION READY

---

## Quick Fix Commands

```bash
# 1. Create subscription middleware
cat > server/middleware/subscription.ts << 'EOF'
# [paste Fix 1 code above]
EOF

# 2. Update unified-ai route
# [manually apply Fix 2 changes]

# 3. Create rate limiter
cat > server/middleware/rateLimiting.ts << 'EOF'
# [paste Fix 3 code above]
EOF

# 4. Test
./test-ai-endpoint.sh
```

---

## Summary

**Question**: Will this work as designed for paid users and master admin?

**Answer**: **NO** - Critical subscription/role checks are missing.

**What needs to be done**: Implement subscription middleware and feature gating (2 hours work).

**Priority**: 🔴 HIGH - Must fix before accepting payments for AI features.
