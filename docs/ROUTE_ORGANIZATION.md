# Route Organization Guide

## Overview

ILS 2.0 routes are organized into logical domains for better maintainability and discoverability.

## Domain Structure

```
server/routes/
├── domains/               # Domain-organized routes
│   ├── index.ts          # Route registry
│   ├── ai/               # AI services
│   ├── admin/            # Administration
│   ├── analytics/        # Analytics & BI
│   ├── auth/             # Authentication
│   ├── billing/          # Billing & payments
│   ├── clinical/         # Clinical practice
│   ├── healthcare/       # Healthcare platform
│   ├── integrations/     # External integrations
│   ├── orders/           # Order management
│   ├── patients/         # Patient management
│   └── system/           # System operations
├── webhooks/             # Webhook handlers
├── api/                  # Public API versions
└── *.ts                  # Legacy route files
```

## Domain Descriptions

### AI (`/api/ai`)
Unified AI services including:
- `/chat` - Conversational AI
- `/conversations` - Conversation management
- `/briefing` - Daily insights
- `/predictions/:type` - Forecasting
- `/actions` - Autonomous actions

### Admin (`/api/admin`)
Administration services:
- `/platform` - Platform admin operations
- `/system` - System admin operations
- `/users` - User management
- `/audit-logs` - Audit log access
- `/roles` - Dynamic role management

### Analytics (`/api/analytics`)
Reporting and business intelligence:
- `/` - General analytics
- `/bi` - Business intelligence
- `/saas` - SaaS metrics
- `/healthcare` - Healthcare analytics

### Auth (`/api/auth`)
Authentication services:
- `/jwt` - JWT-based auth
- `/2fa` - Two-factor authentication
- `/verify` - Email verification

### Billing (`/api/billing`)
Financial operations:
- `/` - General billing
- `/medical` - Medical billing
- `/rcm` - Revenue cycle management
- `/pos` - Point of sale
- `/subscriptions` - Subscription management

### Clinical (`/api/clinical`)
Clinical practice management:
- `/examinations` - Eye examinations
- `/workflows` - Clinical workflows
- `/oma` - OMA file validation
- `/protocols` - Clinical protocols
- `/reporting` - Clinical reports
- `/lens-recommendations` - Lens suggestions
- `/contact-lens` - Contact lens management

### Healthcare (`/api/healthcare`)
Healthcare platform features:
- `/population` - Population health
- `/quality` - Quality measures
- `/mhealth` - Mobile health
- `/research` - Clinical research
- `/telehealth` - Virtual care
- `/ehr` - EHR integration
- `/laboratory` - Lab management

### Integrations (`/api/integrations`)
External system integrations:
- `/nhs` - NHS (UK healthcare)
- `/shopify` - E-commerce
- `/connections` - General integrations
- `/api-management` - API keys and management

### System (`/api/system`)
System administration:
- `/feature-flags` - Feature toggles
- `/monitoring` - Health checks
- `/observability` - Traces and metrics
- `/backup` - Backup management
- `/archival` - Data archival
- `/gdpr` - GDPR compliance
- `/events` - System events

## Usage

### Registering Domain Routes

```typescript
import { registerDomainRoutes, registerLegacyAIRoutes } from './routes/domains';

// Register all domain routes
registerDomainRoutes(app);

// Optionally register legacy routes with deprecation warnings
registerLegacyAIRoutes(app);
```

### Adding New Routes

1. Identify the appropriate domain
2. Add your route file to the domain folder
3. Update the domain's `index.ts` to include your route
4. The route will automatically be registered

### Creating a New Domain

```typescript
// server/routes/domains/my-domain/index.ts
import { Router } from 'express';
import { secureRoute } from '../../../middleware/secureRoute';

const router = Router();

// Apply middleware
router.use(...secureRoute());

// Add routes
router.use('/feature', featureRoutes);

export default router;

export const routeConfig = {
  basePath: '/api/my-domain',
  description: 'My domain description',
  requiresAuth: true,
};
```

## Migration Notes

### Deprecated Routes

The following legacy routes are deprecated and will be removed:

| Old Route | New Route | Sunset Date |
|-----------|-----------|-------------|
| `/api/master-ai` | `/api/ai` | TBD |
| `/api/platform-ai` | `/api/ai` | TBD |
| `/api/ai-notifications` | `/api/ai/briefing` | TBD |
| `/api/ai-purchase-orders` | `/api/ai/actions` | TBD |
| `/api/demand-forecasting` | `/api/ai/predictions/demand` | TBD |
| `/api/ai-ml` | `/api/ai/clinical` | TBD |
| `/api/ophthalmic-ai` | `/api/ai/chat` | TBD |

### Backward Compatibility

Legacy routes return deprecation headers:
- `Deprecation: true`
- `Sunset: <date>`
- `Link: <new-url>; rel="successor-version"`
- `Warning: 299 - "This endpoint is deprecated..."`

Clients should migrate to new endpoints before the sunset date.
