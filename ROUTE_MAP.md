## API Route Map (High-Level)

Base URL: `http://localhost:3000/api`

- Authentication: Session-based via Passport. Most routes require `isAuthenticated` and enforce company scoping.
- Tenancy: Requests are scoped by `companyId` from session; cross-tenant access returns 403.

### Core Registrations
- Health: `GET /health` (no auth)
- AI Engine: registered via `server/routes/aiEngine.ts`
- AI Intelligence: registered via `server/routes/aiIntelligence.ts`
- AI Assistant: registered via `server/routes/aiAssistant.ts`
- Metrics: registered via `server/routes/metrics.ts`
- Permissions: registered via `server/routes/permissions.ts`
- Master AI: registered via `server/routes/masterAi.ts` (admin/platform)
- ECP Features: `USE /api/ecp` → `server/routes/ecp.ts`
- POS: `USE /api/pos` (auth) → `server/routes/pos.ts`
- Analytics: `USE /api/analytics` (auth) → `server/routes/analytics.ts`
- PDF: `USE /api/pdf` (auth) → `server/routes/pdfGeneration.ts`
- Companies: `USE /api/companies` (auth) → `server/routes/companies.ts`

### AI Assistant (examples)
- `POST /ai-assistant/ask`
- `GET /ai-assistant/conversations`
- `GET /ai-assistant/conversations/:id`
- `POST /ai-assistant/knowledge/upload`
- `GET /ai-assistant/knowledge`
- `GET /ai-assistant/learning-progress`
- `GET /ai-assistant/stats`
- `POST /ai-assistant/conversations/:conversationId/feedback`

### Companies (multi-tenant)
- `GET /companies/:id`
- `PATCH /companies/:id`
- `GET /companies/relationships/suppliers`
- `GET /companies/relationships/dispensers`
- `POST /companies/relationships`
- `PATCH /companies/relationships/:id`

### AI Intelligence (analytics)
- `GET /ai-intelligence/dashboard`
- `GET /ai-intelligence/insights`
- `GET /ai-intelligence/opportunities`
- `GET /ai-intelligence/alerts`
- `POST /ai-intelligence/forecast`
- `POST /ai-intelligence/anomalies`

### Notes
- Additional endpoints exist across `server/routes/*` for ECP, POS, analytics, PDF, and permissions. All follow the same auth and tenancy patterns.

