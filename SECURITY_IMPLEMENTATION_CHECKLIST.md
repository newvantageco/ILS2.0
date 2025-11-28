# Security Implementation Checklist - ILS 2.0

**Execution Date:** TBD  
**Estimated Total Effort:** 482 hours (~3 months with 1 FTE)  
**Priority Order:** P0 → P1 → P2 → P3

---

## P0 - Critical (Week 1) - 48 Hours

### ☐ 1. Fix Auth Rate Limiter (5 minutes)
**File:** `server/middleware/rateLimiter.ts:58`

```diff
-  max: 50, // Limit each IP to 50 login attempts per windowMs (increased for testing)
+  max: 5, // CRITICAL: Brute force protection - maximum 5 attempts per 15 minutes
```

**Validation:**
```bash
# Test that 6th login attempt fails
for i in {1..6}; do 
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
done
# Expected: 6th request returns 429 Too Many Requests
```

---

### ☐ 2. Enable Database Encryption at Rest (16 hours)

**Step 1: Install pgcrypto extension**
```sql
-- Run in production database
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

**Step 2: Create encryption key management**
```typescript
// server/utils/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.DB_ENCRYPTION_KEY!, 'hex'); // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encryptField(data: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptField(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**Step 3: Create migration for sensitive fields**
```sql
-- migrations/0XXX_encrypt_phi_fields.sql

-- Add encrypted columns
ALTER TABLE patients ADD COLUMN nhs_number_encrypted TEXT;
ALTER TABLE patients ADD COLUMN date_of_birth_encrypted TEXT;
ALTER TABLE patients ADD COLUMN email_encrypted TEXT;
ALTER TABLE patients ADD COLUMN phone_encrypted TEXT;
ALTER TABLE patients ADD COLUMN address_encrypted TEXT;

-- Note: Encryption will be done in application layer via TypeScript functions above
```

**Step 4: Update Drizzle schema**
```typescript
// shared/schema.ts
export const patients = pgTable('patients', {
  // ... existing fields
  nhsNumberEncrypted: text('nhs_number_encrypted'),
  dateOfBirthEncrypted: text('date_of_birth_encrypted'),
  emailEncrypted: text('email_encrypted'),
  phoneEncrypted: text('phone_encrypted'),
  addressEncrypted: text('address_encrypted'),
});
```

**Step 5: Generate and set encryption key**
```bash
# Generate 256-bit encryption key
openssl rand -hex 32

# Add to AWS Secrets Manager (or .env for dev)
aws secretsmanager create-secret \
  --name ils-api/db-encryption-key \
  --secret-string "$(openssl rand -hex 32)"
```

**Validation:**
```bash
# Verify encryption works
npm run test -- --grep "encryption"
```

---

### ☐ 3. Implement AWS Secrets Manager (24 hours)

**Step 1: Install AWS SDK**
```bash
npm install @aws-sdk/client-secrets-manager
```

**Step 2: Create secrets manager service**
```typescript
// server/utils/secrets.ts
import { 
  SecretsManagerClient, 
  GetSecretValueCommand,
  CreateSecretCommand,
  RotateSecretCommand
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

export async function getSecret(secretName: string): Promise<string> {
  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );
    return response.SecretString || '';
  } catch (error) {
    console.error(`Failed to retrieve secret: ${secretName}`, error);
    throw error;
  }
}

export async function createSecret(name: string, value: string): Promise<void> {
  await client.send(
    new CreateSecretCommand({
      Name: name,
      SecretString: value,
      Description: `ILS API - ${name}`,
    })
  );
}

export async function rotateSecret(secretName: string): Promise<void> {
  await client.send(
    new RotateSecretCommand({
      SecretId: secretName,
      RotationRules: {
        AutomaticallyAfterDays: 90,
      },
    })
  );
}
```

**Step 3: Update server initialization**
```typescript
// server/index.ts
import { getSecret } from './utils/secrets';

async function initializeSecrets() {
  if (process.env.NODE_ENV === 'production') {
    process.env.JWT_SECRET = await getSecret('ils-api/jwt-secret');
    process.env.SESSION_SECRET = await getSecret('ils-api/session-secret');
    process.env.STRIPE_SECRET_KEY = await getSecret('ils-api/stripe-secret');
    process.env.OPENAI_API_KEY = await getSecret('ils-api/openai-key');
    // ... other secrets
  }
}

// Call before starting server
await initializeSecrets();
```

**Step 4: Create secrets in AWS**
```bash
# Create all required secrets
aws secretsmanager create-secret --name ils-api/jwt-secret --secret-string "$(openssl rand -hex 32)"
aws secretsmanager create-secret --name ils-api/session-secret --secret-string "$(openssl rand -hex 32)"
aws secretsmanager create-secret --name ils-api/stripe-secret --secret-string "$STRIPE_SECRET_KEY"
aws secretsmanager create-secret --name ils-api/openai-key --secret-string "$OPENAI_API_KEY"
```

**Step 5: Update Railway configuration**
```bash
# Set AWS credentials in Railway
railway variables set AWS_ACCESS_KEY_ID=<key>
railway variables set AWS_SECRET_ACCESS_KEY=<secret>
railway variables set AWS_REGION=us-east-1

# Remove old secret env vars
railway variables delete JWT_SECRET
railway variables delete SESSION_SECRET
# ... etc
```

**Validation:**
```bash
# Test secret retrieval
npm run test -- server/utils/secrets.test.ts
```

---

### ☐ 4. Enforce MFA for Admin Accounts (8 hours)

**Step 1: Create MFA enforcement middleware**
```typescript
// server/middleware/mfa-enforcement.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function requireMFA(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  // Enforce MFA for privileged roles
  const privilegedRoles = ['admin', 'platform_admin'];
  
  if (privilegedRoles.includes(user.role)) {
    // Check if MFA is enabled for user
    const [dbUser] = await db
      .select({ mfaEnabled: users.mfaEnabled })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    if (!dbUser?.mfaEnabled) {
      res.status(403).json({
        error: 'MFA required for this account',
        message: 'Please enable MFA in account settings',
        setupUrl: '/settings/security',
      });
      return;
    }
    
    // Check if MFA was verified in this session
    const mfaVerified = (req.session as any)?.mfaVerified;
    
    if (!mfaVerified) {
      res.status(403).json({
        error: 'MFA verification required',
        message: 'Please complete MFA challenge',
        challengeUrl: '/api/auth/mfa/challenge',
      });
      return;
    }
  }
  
  next();
}
```

**Step 2: Add MFA check to admin routes**
```typescript
// server/routes.ts
import { requireMFA } from './middleware/mfa-enforcement';

// Protect all admin routes
app.use('/api/admin/*', requireAuth, requireMFA);
app.use('/api/system-admin/*', requireAuth, requireMFA);
```

**Step 3: Create MFA setup enforcement**
```typescript
// server/middleware/mfa-setup-check.ts
export async function checkMFASetup(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (['admin', 'platform_admin'].includes(user.role)) {
    const [dbUser] = await db
      .select({ mfaEnabled: users.mfaEnabled })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    // Force MFA setup on first login
    if (!dbUser?.mfaEnabled) {
      return res.redirect('/setup/mfa');
    }
  }
  
  next();
}
```

**Validation:**
```bash
# Test MFA enforcement
npm run test -- --grep "MFA enforcement"

# Manual test
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Should return 403 if MFA not verified
```

---

## P1 - High Priority (Month 1) - 66 Hours

### ☐ 5. Add DAST to CI Pipeline (16 hours)

**Step 1: Create ZAP configuration**
```yaml
# .zap/rules.tsv
10110	IGNORE	(Clickjacking - X-Frame-Options already handled by Helmet)
```

**Step 2: Update CI workflow**
```yaml
# .github/workflows/security.yml
dast:
  name: OWASP ZAP DAST
  runs-on: ubuntu-latest
  needs: [build-and-test]
  steps:
    - uses: actions/checkout@v4
    
    - name: Build Docker image
      run: docker build -t ils-api:test .
    
    - name: Start services
      run: |
        docker-compose -f docker-compose.test.yml up -d
        sleep 30
    
    - name: Wait for health check
      run: |
        for i in {1..30}; do
          if curl -f http://localhost:5000/api/health; then
            echo "✅ Server is healthy"
            break
          fi
          echo "⏳ Waiting for server... ($i/30)"
          sleep 2
        done
    
    - name: OWASP ZAP Full Scan
      uses: zaproxy/action-full-scan@v0.4.0
      with:
        target: 'http://localhost:5000'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a -j -T 60'
        fail_action: true
        allow_issue_writing: false
    
    - name: Upload ZAP Results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: zap-scan-results
        path: |
          report_html.html
          report_json.json
    
    - name: Stop services
      if: always()
      run: docker-compose -f docker-compose.test.yml down
```

**Step 3: Create test docker-compose**
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test:test@db:5432/ils_test
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: ils_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
```

**Validation:**
```bash
# Run DAST locally
docker-compose -f docker-compose.test.yml up -d
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://host.docker.internal:5000
```

---

### ☐ 6. Enable Dependabot (2 hours)

**Step 1: Create Dependabot config**
```yaml
# .github/dependabot.yml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "09:00"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    assignees:
      - "tech-lead"
    labels:
      - "dependencies"
      - "security"
    commit-message:
      prefix: "deps"
      include: "scope"
    versioning-strategy: increase
    
  # Python dependencies
  - package-ecosystem: pip
    directory: /python-service
    schedule:
      interval: weekly
    
  # Docker
  - package-ecosystem: docker
    directory: /
    schedule:
      interval: weekly

  # GitHub Actions
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

**Step 2: Configure security alerts**
```yaml
# .github/workflows/dependabot-auto-merge.yml
name: Dependabot Auto-Merge
on: pull_request

permissions:
  pull-requests: write
  contents: write

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v1
      
      - name: Auto-merge patch updates
        if: steps.metadata.outputs.update-type == 'version-update:semver-patch'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{github.event.pull_request.html_url}}
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

**Validation:**
```bash
# Verify Dependabot is active
gh api /repos/:owner/:repo/vulnerability-alerts
```

---

### ☐ 7. Implement Centralized Logging (24 hours)

**Step 1: Install Datadog agent**
```bash
npm install dd-trace pino-datadog
```

**Step 2: Update logger configuration**
```typescript
// server/utils/logger.ts
import { datadog } from 'pino-datadog';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const targets = [];

// Console logger for development
if (isDevelopment) {
  targets.push({
    target: 'pino-pretty',
    level: 'debug',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
    }
  });
}

// Datadog logger for production
if (isProduction && process.env.DATADOG_API_KEY) {
  targets.push({
    target: 'pino-datadog',
    level: 'info',
    options: {
      apiKey: process.env.DATADOG_API_KEY,
      ddsource: 'nodejs',
      ddtags: `env:${process.env.NODE_ENV},service:ils-api`,
      service: 'ils-api',
      hostname: process.env.HOSTNAME || 'unknown',
    }
  });
}

export const logger = pino({
  ...baseConfig,
  transport: {
    targets
  }
});
```

**Step 3: Configure Datadog APM**
```typescript
// server/index.ts (MUST BE FIRST IMPORT)
if (process.env.NODE_ENV === 'production') {
  require('dd-trace').init({
    service: 'ils-api',
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    profiling: true,
    runtimeMetrics: true,
  });
}

// ... rest of imports
```

**Step 4: Set up alerting rules in Datadog**
```json
{
  "name": "High Auth Failure Rate",
  "query": "sum(last_5m):rate(ils.auth.failed{*}) > 10",
  "message": "Authentication failures exceeded threshold. Possible brute force attack.\n@security-team",
  "priority": "high"
}
```

**Validation:**
```bash
# Verify logs are flowing to Datadog
curl -X POST https://api.datadoghq.com/api/v1/validate \
  -H "DD-API-KEY: $DATADOG_API_KEY"
```

---

### ☐ 8. Contract Third-Party Penetration Test (0 hours setup, $10K-$15K cost)

**Step 1: Select vendor**
- **Recommended firms:**
  - Bishop Fox ($12K-$15K)
  - NCC Group ($10K-$12K)
  - Trail of Bits ($15K-$20K)

**Step 2: Scope definition**
```
In-Scope:
✅ API endpoints (300+ routes)
✅ Authentication/authorization flows
✅ Patient data access controls
✅ Payment processing (Stripe integration)
✅ File upload functionality
✅ NHS API integration

Out-of-Scope:
❌ Third-party services (Stripe, AWS, NHS)
❌ DDoS testing (use controlled load testing)
❌ Social engineering

Methodology:
- OWASP Testing Guide v4.2
- PTES (Penetration Testing Execution Standard)
```

**Step 3: Pre-test preparation**
```bash
# Create test accounts
npm run test:create-accounts

# Document test endpoints
npm run docs:generate

# Prepare test environment
railway deploy --environment staging
```

**Deliverables:**
- Executive summary
- Technical findings (HIGH/MEDIUM/LOW)
- Remediation recommendations
- Re-test after fixes (included)

---

## P2 - Medium Priority (Month 2-3) - 168 Hours

### ☐ 9. Remove CSP unsafe-inline/unsafe-eval (40 hours)

**Current issue:**
```typescript
// server/middleware/security.ts
scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]  // ❌ XSS risk
```

**Solution: Nonce-based CSP**

**Step 1: Generate nonces per request**
```typescript
// server/middleware/csp-nonce.ts
import crypto from 'crypto';

export function generateCSPNonce(req: Request, res: Response, next: NextFunction) {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  next();
}
```

**Step 2: Update CSP configuration**
```typescript
// server/middleware/security.ts
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  const nonce = res.locals.cspNonce;
  
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", `'nonce-${nonce}'`],  // ✅ Nonce-based
        styleSrc: ["'self'", `'nonce-${nonce}'`],
        objectSrc: ["'none'"],
      },
    },
  })(req, res, next);
};

// Apply nonce generator before security headers
app.use(generateCSPNonce);
app.use(securityHeaders);
```

**Step 3: Update HTML templates**
```html
<!-- server/templates/index.html -->
<!DOCTYPE html>
<html>
<head>
  <script nonce="<%= cspNonce %>">
    // Inline scripts now allowed with nonce
  </script>
</head>
</html>
```

**Validation:**
```bash
# Test CSP headers
curl -I https://localhost:5000 | grep -i content-security-policy
# Should NOT contain 'unsafe-inline'
```

---

### ☐ 10. Implement ABAC Authorization (80 hours)

**Current limitation:** Only role-based (RBAC)

**Solution:** Attribute-based access control (ABAC)

**Step 1: Define policy structure**
```typescript
// server/authorization/policies.ts
export interface Policy {
  resource: string;
  action: string;
  conditions: Condition[];
}

export interface Condition {
  attribute: string;
  operator: 'eq' | 'ne' | 'in' | 'gt' | 'lt' | 'contains';
  value: any;
}

export interface AuthorizationContext {
  user: {
    id: string;
    role: string;
    companyId: string;
    mfaVerified: boolean;
  };
  resource: {
    id: string;
    type: string;
    ownerId: string;
  };
  environment: {
    ipAddress: string;
    time: Date;
    method: string;
  };
}
```

**Step 2: Implement policy engine**
```typescript
// server/authorization/policy-engine.ts
export class PolicyEngine {
  private policies: Map<string, Policy[]> = new Map();
  
  addPolicy(policy: Policy): void {
    const key = `${policy.resource}:${policy.action}`;
    const existing = this.policies.get(key) || [];
    this.policies.set(key, [...existing, policy]);
  }
  
  async evaluate(
    resource: string,
    action: string,
    context: AuthorizationContext
  ): Promise<boolean> {
    const key = `${resource}:${action}`;
    const policies = this.policies.get(key) || [];
    
    for (const policy of policies) {
      const allowed = this.evaluateConditions(policy.conditions, context);
      if (allowed) return true;
    }
    
    return false;
  }
  
  private evaluateConditions(
    conditions: Condition[],
    context: AuthorizationContext
  ): boolean {
    return conditions.every(condition => {
      const value = this.getAttributeValue(condition.attribute, context);
      return this.evaluateCondition(condition, value);
    });
  }
}
```

**Step 3: Define policies**
```typescript
// server/authorization/policies.ts
const policyEngine = new PolicyEngine();

// Policy: Admins can delete users only during business hours with MFA
policyEngine.addPolicy({
  resource: 'user',
  action: 'delete',
  conditions: [
    { attribute: 'user.role', operator: 'eq', value: 'admin' },
    { attribute: 'environment.time.hour', operator: 'gt', value: 9 },
    { attribute: 'environment.time.hour', operator: 'lt', value: 17 },
    { attribute: 'user.mfaVerified', operator: 'eq', value: true },
  ],
});

// Policy: Users can only view their own patient records
policyEngine.addPolicy({
  resource: 'patient',
  action: 'view',
  conditions: [
    { attribute: 'user.companyId', operator: 'eq', value: 'resource.companyId' },
  ],
});
```

**Step 4: Create authorization middleware**
```typescript
// server/middleware/abac.ts
export function authorize(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context: AuthorizationContext = {
      user: req.user,
      resource: req.params,
      environment: {
        ipAddress: req.ip,
        time: new Date(),
        method: req.method,
      },
    };
    
    const allowed = await policyEngine.evaluate(resource, action, context);
    
    if (!allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Not authorized to ${action} ${resource}`,
      });
    }
    
    next();
  };
}

// Usage
app.delete('/api/users/:id', authorize('user', 'delete'), async (req, res) => {
  // Only executes if ABAC policy allows
});
```

**Validation:**
```bash
npm run test -- --grep "ABAC authorization"
```

---

### ☐ 11. Sign CI/CD Artifacts (8 hours)

**Step 1: Install Cosign**
```bash
# Generate signing key
cosign generate-key-pair

# Upload to GitHub Secrets
gh secret set COSIGN_PRIVATE_KEY < cosign.key
gh secret set COSIGN_PUBLIC_KEY < cosign.pub
```

**Step 2: Update deployment workflow**
```yaml
# .github/workflows/deploy-production.yml
deploy:
  runs-on: ubuntu-latest
  steps:
    - name: Build Docker image
      run: docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .
    
    - name: Push image
      run: docker push ghcr.io/${{ github.repository }}:${{ github.sha }}
    
    - name: Install Cosign
      uses: sigstore/cosign-installer@v2
    
    - name: Sign container image
      env:
        COSIGN_KEY: ${{ secrets.COSIGN_PRIVATE_KEY }}
      run: |
        echo "$COSIGN_KEY" > cosign.key
        cosign sign --key cosign.key \
          ghcr.io/${{ github.repository }}:${{ github.sha }}
    
    - name: Verify signature
      run: |
        cosign verify --key cosign.pub \
          ghcr.io/${{ github.repository }}:${{ github.sha }}
```

**Validation:**
```bash
# Verify signature
cosign verify --key cosign.pub ghcr.io/your-org/ils-api:latest
```

---

### ☐ 12. Data Masking for Non-Production (40 hours)

**Step 1: Create masking functions**
```typescript
// scripts/data-masking/mask-pii.ts
import { db } from '../server/db';
import { patients, users } from '@shared/schema';

async function maskPII() {
  // Mask patient data
  await db.update(patients).set({
    nhsNumber: sql`CASE 
      WHEN ${patients.nhsNumber} IS NOT NULL 
      THEN 'NHS' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0')
      ELSE NULL 
    END`,
    email: sql`CONCAT('user', id, '@example.com')`,
    phone: sql`CONCAT('+44', LPAD(FLOOR(RANDOM() * 9999999999)::TEXT, 10, '0'))`,
    firstName: sql`CONCAT('Patient', id)`,
    lastName: sql`'Anonymized'`,
    address: sql`'123 Test Street'`,
    postcode: sql`'SW1A 1AA'`,
  });
  
  // Mask user data
  await db.update(users).set({
    email: sql`CONCAT('user', id, '@example.com')`,
    phone: sql`CONCAT('+44', LPAD(FLOOR(RANDOM() * 9999999999)::TEXT, 10, '0'))`,
  });
}
```

**Step 2: Create staging database sync**
```bash
#!/bin/bash
# scripts/sync-staging-db.sh

# Dump production database
pg_dump $PROD_DATABASE_URL > prod_dump.sql

# Restore to staging
psql $STAGING_DATABASE_URL < prod_dump.sql

# Apply data masking
npm run data:mask-pii

# Verify
psql $STAGING_DATABASE_URL -c "SELECT email, nhs_number FROM patients LIMIT 5;"
```

**Validation:**
```bash
# Run masking script
npm run data:mask-pii

# Verify no real PII
psql $STAGING_DATABASE_URL -c "
  SELECT COUNT(*) as real_emails 
  FROM users 
  WHERE email NOT LIKE '%@example.com'
"
# Should return 0
```

---

## P3 - Low Priority (Month 4-6) - 200 Hours

### ☐ 13. SLSA Compliance (80 hours)
**Estimated Effort:** 80 hours  
**Priority:** Low  
**Defer to:** Q2 2026

### ☐ 14. RASP Implementation (120 hours)
**Estimated Effort:** 120 hours  
**Priority:** Low  
**Defer to:** Q3 2026

---

## Verification & Sign-Off

### Pre-Production Checklist:
- [ ] All P0 issues resolved
- [ ] All P1 issues resolved (or accepted risk documented)
- [ ] Third-party pentest completed with no HIGH/CRITICAL findings
- [ ] DPIA completed
- [ ] BAAs signed with all third-party vendors
- [ ] Incident response plan tested
- [ ] Security headers validated (A+ rating on securityheaders.com)
- [ ] OWASP ZAP scan passed (no HIGH/CRITICAL)
- [ ] Database encryption verified
- [ ] Secrets migrated to AWS Secrets Manager
- [ ] MFA enabled for all admin accounts

### Sign-Off:
- [ ] **Security Lead:** _________________ Date: _______
- [ ] **Engineering Lead:** ______________ Date: _______
- [ ] **Compliance Officer:** ____________ Date: _______
- [ ] **CTO/CISO:** _____________________ Date: _______

---

## Rollback Plan

### If Critical Issues Discovered:

**Immediate Actions:**
1. Stop deployment
2. Rollback to previous version
3. Document issue in incident log
4. Notify security team

**Rollback Commands:**
```bash
# Railway rollback
railway rollback

# Docker rollback
docker pull ghcr.io/your-org/ils-api:previous-sha
docker-compose up -d

# Verify health
curl https://yourdomain.com/api/health
```

---

**Version:** 1.0  
**Last Updated:** November 28, 2025  
**Next Review:** After P0 completion
