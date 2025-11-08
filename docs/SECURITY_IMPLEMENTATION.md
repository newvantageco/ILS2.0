# Security Enhancements Implementation Guide

This document outlines the security enhancements implemented and the steps required to activate them in production.

## 🔐 Features Implemented

### 1. Two-Factor Authentication (2FA)
- **Service**: `server/services/TwoFactorAuthService.ts`
- **Routes**: `server/routes/twoFactor.ts`
- **Technology**: TOTP (Time-based One-Time Password)
- **Features**:
  - QR code generation for authenticator apps
  - Backup codes (10 per user, one-time use)
  - Token verification (30-second time step)
  - Enable/disable 2FA
  - Backup code regeneration

### 2. GDPR Compliance
- **Service**: `server/services/GDPRService.ts`
- **Routes**: `server/routes/gdpr.ts`
- **Features**:
  - Complete data export (Article 20 - Right to Data Portability)
  - Data deletion with GOC compliance (Article 17 - Right to Erasure)
  - Consent management (Article 7)
  - Privacy compliance reports (Article 15)
  - 7-year data retention for clinical records

---

## 📦 Required Package Installations

Install the following npm packages:

```bash
npm install otplib
npm install @types/otplib --save-dev
```

**Note**: `qrcode` and `@types/qrcode` are already installed.

---

## 🗄️ Database Schema Changes

Add the following fields to the `users` table in `shared/schema.ts`:

```typescript
export const users = pgTable('users', {
  // ... existing fields ...

  // Two-Factor Authentication
  twoFactorSecret: text('two_factor_secret'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorBackupCodes: text('two_factor_backup_codes'), // JSON array of hashed codes

  // GDPR Consent Management
  marketingConsent: boolean('marketing_consent').default(false),
  analyticsConsent: boolean('analytics_consent').default(false),
  thirdPartyConsent: boolean('third_party_consent').default(false),
  consentUpdatedAt: timestamp('consent_updated_at'),
});
```

### Migration Steps

**Option 1: Development (db:push)**
```bash
# Update shared/schema.ts with new fields above
npm run db:push
```

**Option 2: Production (generate migration)**
```bash
# Update shared/schema.ts first
npm run db:generate
# Review the migration file in drizzle/migrations/
npm run db:migrate
```

---

## 🔌 Route Registration

Add the new routes to `server/routes.ts`:

```typescript
// Add imports
import twoFactorRoutes from './routes/twoFactor';
import gdprRoutes from './routes/gdpr';

// Register routes (add after existing route registrations)
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/gdpr', gdprRoutes);
```

---

## 🧪 Testing the Implementation

### Test 2FA Setup

```bash
# 1. Setup 2FA
curl -X POST http://localhost:5000/api/2fa/setup \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json"

# Response includes:
# - secret (save for next step)
# - qrCodeUrl (scan with authenticator app)
# - backupCodes (save securely)

# 2. Enable 2FA (use token from authenticator app)
curl -X POST http://localhost:5000/api/2fa/enable \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "SECRET_FROM_SETUP",
    "token": "123456",
    "backupCodes": ["CODE1", "CODE2", ...]
  }'

# 3. Check 2FA status
curl http://localhost:5000/api/2fa/status \
  -H "Cookie: session=..."
```

### Test GDPR Functionality

```bash
# 1. Export all user data
curl http://localhost:5000/api/gdpr/export \
  -H "Cookie: session=..." \
  > my-data-export.json

# 2. Get consent status
curl http://localhost:5000/api/gdpr/consent \
  -H "Cookie: session=..."

# 3. Update consent
curl -X POST http://localhost:5000/api/gdpr/consent \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "marketing": true,
    "analytics": false,
    "thirdParty": false
  }'

# 4. Generate compliance report
curl http://localhost:5000/api/gdpr/compliance-report \
  -H "Cookie: session=..."

# 5. Request data deletion (WARNING: irreversible)
curl -X POST http://localhost:5000/api/gdpr/delete \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "retainClinicalData": true,
    "confirmation": "DELETE_MY_DATA"
  }'
```

---

## 🔒 Security Best Practices

### Password Policy
Already implemented in `server/middleware/security.ts`:
- Minimum 12 characters
- Must contain: uppercase, lowercase, number, special character
- Pattern: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$`

### Rate Limiting
Already configured:
- **Global API**: 100 requests / 15 min
- **Authentication**: 5 attempts / 15 min
- **Write operations**: 30 requests / 15 min
- **File uploads**: 10 uploads / hour
- **AI endpoints**: 20 requests / hour

### TLS/HTTPS
- TLS 1.3 enforced in production
- HSTS with 1-year max-age
- Automatic HTTPS redirect

### Security Headers
Via Helmet.js:
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer
- Permissions-Policy

---

## 📋 Integration with Authentication Flow

### Enhanced Login Flow with 2FA

Update your login endpoint to check for 2FA:

```typescript
// After password verification
if (user.twoFactorEnabled) {
  // Require 2FA verification
  return res.json({
    requiresTwoFactor: true,
    userId: user.id, // Temporary, for 2FA verification
    message: 'Please provide your 2FA code',
  });
}

// Regular login continues...
```

### 2FA Verification Endpoint

```typescript
// Add to auth routes
router.post('/verify-2fa', async (req, res) => {
  const { userId, token } = req.body;

  const isValid = await twoFactorAuthService.verify(userId, token);

  if (!isValid) {
    // Try backup code
    const backupValid = await twoFactorAuthService.verifyBackupCode(userId, token);
    if (!backupValid) {
      return res.status(401).json({ error: 'Invalid code' });
    }
  }

  // Complete login, create session
  req.session.userId = userId;
  res.json({ success: true });
});
```

---

## 🎯 Frontend Integration

### 2FA Setup Component

```typescript
// client/src/components/TwoFactorSetup.tsx
import { useState } from 'react';

export function TwoFactorSetup() {
  const [setup, setSetup] = useState(null);
  const [token, setToken] = useState('');

  const handleSetup = async () => {
    const response = await fetch('/api/2fa/setup', {
      credentials: 'include',
    });
    const data = await response.json();
    setSetup(data);
  };

  const handleEnable = async () => {
    const response = await fetch('/api/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        secret: setup.secret,
        token,
        backupCodes: setup.backupCodes,
      }),
    });

    if (response.ok) {
      alert('2FA enabled successfully!');
    }
  };

  return (
    <div>
      {!setup ? (
        <button onClick={handleSetup}>Setup 2FA</button>
      ) : (
        <div>
          <img src={setup.qrCodeUrl} alt="2FA QR Code" />
          <p>Backup codes (save these!):</p>
          <ul>
            {setup.backupCodes.map(code => <li key={code}>{code}</li>)}
          </ul>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
          <button onClick={handleEnable}>Enable 2FA</button>
        </div>
      )}
    </div>
  );
}
```

### GDPR Data Export Component

```typescript
// client/src/components/DataExport.tsx
export function DataExport() {
  const handleExport = async () => {
    const response = await fetch('/api/gdpr/export', {
      credentials: 'include',
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-data-export-${Date.now()}.json`;
    a.click();
  };

  return (
    <button onClick={handleExport}>
      Download My Data
    </button>
  );
}
```

---

## 🚨 Important Notes

### GOC Compliance
- Clinical records MUST be retained for 7 years
- Data deletion requests honor this requirement
- Users are informed about retention during deletion

### GDPR Requirements
- Data export must be provided within 30 days
- Data deletion must be completed within reasonable timeframe
- Consent can be withdrawn at any time
- Users must be informed of data breaches within 72 hours

### Production Checklist
- [ ] Install `otplib` package
- [ ] Add database schema fields
- [ ] Run database migration
- [ ] Register routes in routes.ts
- [ ] Test 2FA flow end-to-end
- [ ] Test GDPR export/deletion
- [ ] Update privacy policy
- [ ] Train staff on GDPR procedures
- [ ] Set up data breach notification process
- [ ] Configure backup and disaster recovery
- [ ] Enable monitoring for security events

---

## 📞 Support

For questions or issues:
- Technical: dev@ils.com
- Privacy/GDPR: privacy@ils.com
- Security: security@ils.com

---

**Last Updated**: November 8, 2024
**Version**: 1.0.0
