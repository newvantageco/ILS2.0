## Security Overview

### Authentication & Sessions
- Primary: Passport sessions with Replit OIDC; optional local email/password
- Session cookies are httpOnly; set `secure` in production
- Use `isAuthenticated` middleware; never expose protected routes without it

### Authorization & Tenancy
- All business data is scoped by `companyId`
- Enforce role checks and subscription plan gates where applicable
- Return 403 on cross-tenant access

### Secrets
- Store secrets in environment variables or secret managers; never commit
- Rotate `SESSION_SECRET` and any API keys regularly

### Input Validation
- Validate all inputs with Zod schemas (shared where possible)
- Sanitize/normalize emails and user-provided identifiers

### Data Protection
- Prefer UUIDs and least-privilege queries via Drizzle
- Minimize PII exposure in logs and responses

### Reporting
- If you discover a vulnerability, contact the maintainers privately

