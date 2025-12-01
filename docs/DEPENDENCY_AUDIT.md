# Dependency Audit Report

## Overview

This document outlines the dependency audit results for ILS 2.0, identifying issues and recommendations for the 120+ packages in the project.

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Production Dependencies | 122 | Reviewed |
| Dev Dependencies | 38 | Reviewed |
| Optional Dependencies | 9 | Reviewed |
| Issues Found | 12 | See below |

## Issues Identified

### 1. @types/ Packages in Production Dependencies

**Issue**: Type definition packages should be in `devDependencies`, not `dependencies`.

**Affected Packages**:
```
@types/axios
@types/bcrypt
@types/bcryptjs
@types/cors
@types/dompurify
@types/jsonwebtoken
@types/memoizee
@types/morgan
@types/multer
@types/node-cron
@types/nodemailer
@types/passport-google-oauth20
@types/pdfkit
@types/qrcode
```

**Recommendation**: Move these to `devDependencies`. They are only needed during development for TypeScript compilation.

### 2. Redundant Type Package

**Issue**: `@types/axios` is unnecessary - axios includes its own TypeScript types since v0.21.0.

**Recommendation**: Remove `@types/axios`.

### 3. Unused Package

**Issue**: `web-vitals` appears to have no usage in the codebase.

**Recommendation**: Verify and remove if not needed, or document where it's used.

### 4. Dual UI Library Usage

**Issue**: Both MUI (`@mui/material`, `@mui/icons-material`) and Radix UI are being used.

**Usage**:
- MUI: Engineering dashboard components (7 files)
- Radix UI: Core application UI components (15+ components)

**Recommendation**: This is acceptable as they serve different purposes - MUI for data-heavy engineering views, Radix for general UI. Document this decision.

### 5. Dual AI SDK Usage

**Issue**: Both `@anthropic-ai/sdk` and `openai` SDK are present.

**Usage**:
- Anthropic: Primary AI service (UnifiedAIService)
- OpenAI: Embeddings, external AI fallback, prescription verification

**Recommendation**: Keep both - they serve different purposes. Consider consolidating if Anthropic adds embedding support.

## Dependency Categories

### AI & ML
| Package | Used | Purpose |
|---------|------|---------|
| `@anthropic-ai/sdk` | ✅ | Primary AI service |
| `openai` | ✅ | Embeddings, fallback AI |
| `@tensorflow/tfjs-node` | ✅ | Neural network predictions |

### Database
| Package | Used | Purpose |
|---------|------|---------|
| `drizzle-orm` | ✅ | ORM |
| `drizzle-zod` | ✅ | Schema validation |
| `pg` | ✅ | PostgreSQL driver |

### Authentication
| Package | Used | Purpose |
|---------|------|---------|
| `passport` | ✅ | Auth middleware |
| `passport-google-oauth20` | ✅ | Google OAuth |
| `passport-local` | ✅ | Local auth |
| `jsonwebtoken` | ✅ | JWT tokens |
| `otplib` | ✅ | 2FA/TOTP |
| `bcryptjs` | ✅ | Password hashing |

### Communications
| Package | Used | Purpose |
|---------|------|---------|
| `nodemailer` | ✅ | Email sending |
| `resend` | ✅ | Transactional emails |
| `twilio` | ✅ | SMS/WhatsApp |

### Cloud Services
| Package | Used | Purpose |
|---------|------|---------|
| `@aws-sdk/client-glacier` | ✅ | Cold storage backup |
| `@aws-sdk/client-s3` | ✅ | File storage |
| `stripe` | ✅ | Payment processing |

### Healthcare
| Package | Used | Purpose |
|---------|------|---------|
| `dicom-parser` | ✅ | Medical imaging |
| `pdfkit` | ✅ | PDF generation |

### Frontend UI
| Package | Used | Purpose |
|---------|------|---------|
| `@radix-ui/*` | ✅ | Core UI components |
| `@mui/material` | ✅ | Engineering dashboards |
| `recharts` | ✅ | Data visualization |
| `lucide-react` | ✅ | Icons |
| `framer-motion` | ✅ | Animations |

### Caching & Queues
| Package | Used | Purpose |
|---------|------|---------|
| `ioredis` | ✅ | Redis client (optional) |
| `bullmq` | ✅ | Job queues (optional) |

## Recommended Actions

### Immediate (Low Risk)

1. **Move @types packages to devDependencies**:
   ```bash
   npm install --save-dev @types/axios @types/bcrypt @types/bcryptjs \
     @types/cors @types/dompurify @types/jsonwebtoken @types/memoizee \
     @types/morgan @types/multer @types/node-cron @types/nodemailer \
     @types/passport-google-oauth20 @types/pdfkit @types/qrcode
   ```

2. **Remove @types/axios** (axios has built-in types):
   ```bash
   npm uninstall @types/axios
   ```

### Medium Priority

3. **Verify web-vitals usage** and remove if not needed
4. **Document dual UI library strategy** in architecture docs

### Future Considerations

5. **Evaluate TensorFlow alternatives** - lighter ML libraries may suffice
6. **Monitor bundle size** - consider code splitting for heavy packages
7. **Regular dependency updates** - set up Dependabot or similar

## Security Considerations

All dependencies should be regularly audited for vulnerabilities:

```bash
npm audit
npm audit fix
```

### Known Secure Packages
- All auth packages (passport, bcryptjs, jsonwebtoken) are well-maintained
- Stripe SDK is PCI-compliant
- Healthcare packages (dicom-parser) handle PHI appropriately

## Bundle Impact

Top 5 largest dependencies (approximate):
1. `@tensorflow/tfjs-node` - ~50MB (includes native bindings)
2. `@mui/material` - ~5MB
3. `recharts` - ~3MB
4. `pdfkit` - ~2MB
5. `socket.io` - ~1MB

**Note**: TensorFlow is used server-side only and doesn't affect client bundle.

## Maintenance Schedule

| Task | Frequency |
|------|-----------|
| `npm audit` | Weekly |
| Dependency updates | Monthly |
| Full audit review | Quarterly |
| Major version upgrades | As needed |
