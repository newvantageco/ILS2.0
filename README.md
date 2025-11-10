# ILS 2.0 - Healthcare Operating System for Optical Excellence

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **The complete platform for modern optical practices** — From clinical examinations to e-commerce, from NHS compliance to AI-powered intelligence. One platform, infinite possibilities.

---

## 🎯 What Is ILS 2.0?

ILS 2.0 is the first **Healthcare Operating System** purpose-built for the optical industry. Think Salesforce + Epic + Shopify for eyecare—all in one platform.

### Not Just Another Practice Management System

While others focus on one piece of the puzzle, ILS 2.0 unifies your entire operation:

- **Clinical Operations** → Digital examinations, prescriptions, patient records
- **Laboratory Production** → Order tracking, quality control, equipment management
- **E-Commerce** → Shopify integration, POS, frame recommendations
- **Healthcare Compliance** → NHS integration, GDPR, audit trails
- **Business Intelligence** → Real-time analytics, forecasting, custom reports
- **AI-Powered** → Clinical assistant, automated workflows, predictive insights

### Built For

- **👓 Independent Practices** - Run your entire practice from your phone
- **🔬 Optical Laboratories** - Production intelligence that prevents bottlenecks
- **🏢 Healthcare Enterprises** - Complete RCM, population health, quality management
- **🛍️ Optical Retailers** - Integrated e-commerce with clinical workflows

---

## ✨ Feature Highlights

### 🚀 **Production-Ready Capabilities**

#### **Order Management & Production Workflow**
- ✅ Comprehensive order lifecycle management (draft → submitted → in-production → completed)
- ✅ Real-time production queue with drag-and-drop job prioritization
- ✅ Multi-stage quality control checkpoints with automated validation
- ✅ Patient record management with prescription tracking
- ✅ OMA file upload and parsing for digital frame tracing
- ✅ Consult logging system with technical documentation library

#### **AI & Analytics Platform**
- ✅ **AI Intelligence Dashboard**: Real-time insights, predictive analytics, anomaly detection
- ✅ **Business Intelligence (BI)**: Custom report builder, KPI tracking, trend analysis
- ✅ **Machine Learning Models**: Quality prediction, demand forecasting, process optimization
- ✅ **Natural Language Processing**: AI-powered search and recommendations
- ✅ **Autonomous AI Agents**: Automated decision-making for routine tasks

#### **Supplier & Purchase Order Management**
- ✅ Full CRUD operations for supplier/vendor management
- ✅ Automated purchase order generation with PDF export
- ✅ Inventory tracking and material requisition workflows
- ✅ Supplier performance analytics and vendor scorecards

#### **User & Access Management**
- ✅ Multi-role RBAC system (ECP, Lab Tech, Engineer, Supplier, Admin, AI Admin)
- ✅ Account approval workflow with pending/active/suspended states
- ✅ Team and organization management with hierarchy support
- ✅ Audit logging for compliance and security tracking
- ✅ Master user provisioning for operational control

#### **Payments & Subscriptions**
- ✅ Stripe integration for payment processing
- ✅ Tiered subscription plans (Free, Pro, Premium, Enterprise)
- ✅ Feature-based access control tied to subscription levels
- ✅ Usage tracking and billing automation

#### **Background Jobs & Event-Driven Architecture**
- ✅ BullMQ + Redis for reliable job queuing (email, PDF, notifications, AI tasks)
- ✅ Event bus with pub/sub pattern for domain events
- ✅ Graceful degradation when Redis unavailable
- ✅ Cron-based scheduled jobs (daily briefings, inventory monitoring, anomaly detection)

#### **Real-Time Features**
- ✅ WebSocket server for live updates and notifications
- ✅ Broadcast system for multi-user collaboration
- ✅ Real-time job status tracking on production dashboard

#### **Developer Experience**
- ✅ TypeScript monorepo with strict type safety
- ✅ Comprehensive test suite (Jest, Vitest, Playwright)
- ✅ 98.5% codebase health score with zero critical issues
- ✅ Hot module reloading for rapid development
- ✅ Automated database migrations with Drizzle ORM

---

## 🏗️ Tech Stack

### **Frontend** (`client/`)
| Technology | Purpose |
|------------|---------|
| **React 18.3** + **TypeScript 5.6** | Modern UI framework with strict type safety |
| **Vite** | Lightning-fast dev server and optimized production builds |
| **TanStack Query v5** | Server state management, caching, and synchronization |
| **Wouter** | Lightweight routing (~1.5KB) |
| **shadcn/ui** + **Radix UI** | Accessible, unstyled component primitives |
| **Tailwind CSS** | Utility-first styling with dark mode support |
| **Lucide React** | Beautiful, consistent icon library |
| **React Hook Form** + **Zod** | Type-safe form validation |
| **Recharts** | Data visualization for analytics dashboards |

### **Backend** (`server/`)
| Technology | Purpose |
|------------|---------|
| **Node.js 20+** + **Express** | High-performance REST API server |
| **TypeScript (ESM)** | Strict type safety with ES modules |
| **Neon Postgres** | Serverless PostgreSQL with connection pooling |
| **Drizzle ORM** + **Drizzle-Zod** | Type-safe queries with automatic validation schemas |
| **Passport.js** | Authentication middleware (OIDC + local strategies) |
| **BullMQ** + **Redis** | Reliable background job processing |
| **Socket.io** | WebSocket server for real-time features |
| **Helmet** + **CORS** | Security middleware |
| **Express Rate Limit** | DDoS protection and rate limiting |

### **Python Services** (`python-service/`, `ai-service/`)
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance async API framework |
| **TensorFlow.js** / **PyTorch** | Machine learning model training and inference |
| **Pandas** + **NumPy** | Data analysis and numerical computing |
| **scikit-learn** | Classical ML algorithms |
| **Anthropic Claude** / **OpenAI** | LLM integration for AI features |

### **Infrastructure & DevOps**
| Technology | Purpose |
|------------|---------|
| **npm workspaces** | Monorepo management |
| **Jest** + **Vitest** | Unit and integration testing |
| **Playwright** | End-to-end browser testing |
| **ESBuild** | Fast production bundling |
| **tsx** / **ts-node** | TypeScript execution in dev mode |
| **Prometheus** | Metrics collection and monitoring |
| **Node-cron** | Scheduled background tasks |

### **Shared Contract** (`shared/`)
- **Drizzle Schema** (90+ tables): Single source of truth for database structure
- **Zod Validation Schemas**: Runtime type validation for API payloads
- **TypeScript Types**: Shared interfaces across client/server boundaries

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js** 20+ and **npm** 9+
- **PostgreSQL** 15+ (or use Neon serverless)
- **Redis** 7+ (optional, for background jobs — graceful fallback if unavailable)
- **Python** 3.10+ (optional, for AI/analytics services)

### **Quick Start**

#### 1️⃣ Clone the repository
```bash
git clone https://github.com/newvantageco/ILS2.0.git
cd IntegratedLensSystem
```

#### 2️⃣ Install dependencies
```bash
npm install
```

#### 3️⃣ Configure environment variables
Create a `.env` file in the project root:

```bash
# Database (Neon Postgres recommended)
DATABASE_URL=postgresql://user:password@hostname/database

# Session & Security
SESSION_SECRET=your_secure_random_string_here
ADMIN_SETUP_KEY=your_admin_key_for_first_user

# Master User (Optional - auto-provisioned admin account)
MASTER_USER_EMAIL=admin@example.com
MASTER_USER_PASSWORD=secure_password_min_12_chars
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=Platform Control

# Redis (Optional - background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# AI Services (Optional)
OPENAI_API_KEY=sk-xxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

#### 4️⃣ Initialize database
```bash
npm run db:push
```

#### 5️⃣ Start development servers
```bash
# Start all services (client, server, Python services)
npm run dev

# OR start individually:
npm run dev:node     # Node.js server only (port 5000)
npm run dev:python   # Python analytics service only (port 8000)
```

#### 6️⃣ Access the application
- **Frontend**: [http://localhost:5000](http://localhost:5000)
- **API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Python Service**: [http://localhost:8000](http://localhost:8000) _(if running)_
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📁 Project Structure

```
IntegratedLensSystem/
├── client/                    # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui primitives
│   │   │   ├── landing/       # Marketing/landing page components
│   │   │   ├── dashboard/     # Dashboard-specific components
│   │   │   └── ...
│   │   ├── pages/             # Route-level page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── AIIntelligence.tsx
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks (useAuth, useOrders, etc.)
│   │   ├── lib/               # Utilities, API clients, helpers
│   │   └── App.tsx            # Root component with routing
│   ├── index.html
│   └── vite.config.ts
│
├── server/                    # Express backend (TypeScript ESM)
│   ├── index.ts               # Server entry point (middleware, cron, WebSocket)
│   ├── routes.ts              # Main route registry (calls registerXXXRoutes)
│   ├── storage.ts             # Data access layer (DbStorage singleton)
│   ├── db.ts                  # Database connection (Drizzle + Neon)
│   ├── routes/                # Modular route handlers
│   │   ├── aiIntelligence.ts  # AI features and analytics
│   │   ├── bi.ts              # Business intelligence reports
│   │   ├── payments.ts        # Stripe integration
│   │   ├── metrics.ts         # Prometheus metrics endpoint
│   │   └── ...
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts            # Authentication & RBAC
│   │   ├── security.ts        # Helmet, CORS, rate limiting
│   │   ├── errorHandler.ts    # Centralized error handling
│   │   ├── audit.ts           # Audit logging
│   │   └── validation.ts      # Zod validation helpers
│   ├── workers/               # BullMQ background workers
│   │   ├── emailWorker.ts
│   │   ├── pdfWorker.ts
│   │   ├── notificationWorker.ts
│   │   └── aiWorker.ts
│   ├── events/                # Event-driven architecture
│   │   ├── EventBus.ts        # Pub/sub event bus (EventEmitter)
│   │   └── handlers/          # Event listeners
│   ├── services/              # Business logic services
│   │   ├── EmailService.ts
│   │   ├── PDFService.ts
│   │   └── ...
│   ├── queue/                 # BullMQ queue configuration
│   │   └── config.ts          # Redis connection, queue init
│   ├── jobs/                  # Cron-scheduled tasks
│   │   ├── dailyBriefing.ts
│   │   └── inventoryMonitoring.ts
│   └── websocket/             # WebSocket server
│       └── WebSocketBroadcaster.ts
│
├── shared/                    # Shared types & schemas (client + server)
│   └── schema.ts              # Drizzle tables + Zod validation (3,589 lines, 90 tables)
│
├── python-service/            # FastAPI analytics service
│   ├── main.py                # FastAPI app entry
│   ├── requirements.txt
│   └── start-service.sh       # Startup script
│
├── ai-service/                # Machine learning & AI models
│   ├── models/
│   ├── api/
│   └── requirements.txt
│
├── scripts/                   # Utility scripts
│   ├── migrate-storage.ts     # Data migration helpers
│   └── ...
│
├── test/                      # Test suites
│   ├── integration/           # API integration tests (Jest)
│   ├── unit/                  # Unit tests (Jest)
│   ├── components/            # Component tests (Vitest)
│   └── e2e/                   # End-to-end tests (Playwright)
│
├── start-dev.mjs              # Dev orchestrator (spawns Python + Node)
├── package.json               # Monorepo root package
├── tsconfig.json              # TypeScript config (strict mode)
├── vite.config.ts             # Vite config (client build)
└── README.md                  # You are here! 👋
```

---

## 🔐 Authentication & Authorization

### **Authentication Methods**
- **Replit Auth (OIDC)**: Primary authentication provider
- **Local Email/Password**: Fallback authentication
- **Session-based**: Express sessions with Redis store (or memory store fallback)

### **Role-Based Access Control (RBAC)**

| Role | Permissions |
|------|-------------|
| **👓 ECP** (Eye Care Professional) | Create orders, view own patients, track order status |
| **🔬 Lab Tech** | View production queue, update job status, quality checks |
| **🛠️ Engineer** | Advanced production controls, technical documentation access |
| **📦 Supplier** | View assigned POs, update inventory, manage deliveries |
| **👔 Admin** | User management, platform settings, analytics access |
| **🤖 AI Admin** | Full AI platform access, model training, data insights |

### **Master User Provisioning**

For operational control, you can pre-configure a **master admin account** that automatically receives all roles. Set these environment variables:

```bash
MASTER_USER_EMAIL=master@example.com
MASTER_USER_PASSWORD=secure_password_min_12_chars  # Must be 12+ characters
MASTER_USER_FIRST_NAME=Master
MASTER_USER_LAST_NAME=Admin
MASTER_USER_ORGANIZATION=Platform Control
```

On startup, the server:
1. Hashes the password securely (bcrypt)
2. Creates the user if it doesn't exist
3. Marks the account as **active** and **verified**
4. Assigns **all available roles** (admin, ecp, lab_tech, engineer, supplier, ai_admin)

Leave these variables empty to skip master user creation.

### **Account Approval Workflow**

New user registrations require admin approval:
1. User registers → account status: **Pending**
2. Admin reviews in `/admin/users` dashboard
3. Admin approves → account status: **Active**
4. User can now log in and access assigned features

---

## 🧪 Testing

### **Test Suites**

```bash
# Run all tests with TypeScript check
npm run test:all

# Unit tests (Jest) - Fast feedback loop
npm run test:unit

# Integration tests (Jest) - API endpoints
npm run test:integration
npm test  # Alias for integration tests

# Component tests (Vitest + jsdom) - React components
npm run test:components

# End-to-end tests (Playwright) - Full browser automation
npm run test:e2e

# Coverage report
npm run test:coverage
```

### **Current Test Coverage**
- ✅ **Integration Tests**: 8/8 passing (100%)
- ✅ **Component Tests**: 19/19 passing (100%)
- ✅ **TypeScript Compilation**: 0 errors
- ✅ **Codebase Health**: 98.5% (production-ready)

---

## 🏭 Production Deployment

### **Build for Production**

```bash
# Build client (Vite) + server (ESBuild)
npm run build

# Output:
# - client/dist/        → Static frontend assets
# - dist/               → Bundled server code
```

### **Start Production Server**

```bash
NODE_ENV=production npm start
# OR
NODE_ENV=production node dist/index.js
```

### **Environment Checklist**

Before deploying to production, ensure:

- [ ] `DATABASE_URL` points to production Postgres instance
- [ ] `SESSION_SECRET` is a strong, random string (256-bit recommended)
- [ ] `REDIS_HOST` / `REDIS_PASSWORD` configured for production Redis
- [ ] `STRIPE_SECRET_KEY` uses live keys (not test keys)
- [ ] `RESEND_API_KEY` configured for production email domain
- [ ] SSL/TLS certificates configured (terminate at reverse proxy or load balancer)
- [ ] Rate limiting tuned for expected traffic
- [ ] Monitoring/alerting configured (Prometheus `/metrics` endpoint)
- [ ] Backup strategy implemented for database
- [ ] Log aggregation configured (stdout → log collection service)

### **Recommended Production Stack**
- **Hosting**: Railway, Render, AWS ECS, Google Cloud Run
- **Database**: Neon (serverless Postgres), AWS RDS, Supabase
- **Redis**: Upstash, Redis Cloud, AWS ElastiCache
- **Reverse Proxy**: Nginx, Caddy, Cloudflare
- **Monitoring**: Prometheus + Grafana, Datadog, New Relic

---

## 📊 Development Commands

```bash
# Development
npm run dev              # Start all services (client + server + Python)
npm run dev:node         # Node.js server only (tsx watch mode)
npm run dev:python       # Python analytics service only

# Database
npm run db:push          # Push schema changes to database (Drizzle Kit)
npm run migrate-storage  # Run data migration scripts

# Build & Production
npm run build            # Build client + server for production
npm run start            # Start production server

# Code Quality
npm run check            # TypeScript type checking (noEmit)
npm run lint             # ESLint (if configured)
npm run format           # Prettier (if configured)

# Testing
npm test                 # Integration tests
npm run test:unit        # Unit tests (fast)
npm run test:components  # Component tests (Vitest)
npm run test:e2e         # End-to-end tests (Playwright)
npm run test:all         # All tests + TypeScript check
npm run test:coverage    # Coverage report
```

---

## 🏗️ Architecture Overview

### **Event-Driven Architecture**

ILS uses a **pub/sub event bus** for domain events:

```typescript
// Publish event
EventBus.publish('order.created', { orderId: 123, companyId: 1 });

// Subscribe to event
EventBus.subscribe('order.created', async (data) => {
  await storage.logAnalytics({ event: 'order_created', ...data });
});
```

**Event Examples**:
- `order.created` → Triggers LIMS sync, PDF generation, analytics logging
- `order.completed` → Send notification, update billing, archive records
- `user.approved` → Send welcome email, provision resources

### **Background Job Processing**

BullMQ + Redis for reliable async tasks:

```typescript
// Enqueue job
await addEmailJob({
  to: 'user@example.com',
  subject: 'Order Confirmation',
  template: 'orderConfirmation',
  data: { orderId: 123 }
});

// Worker processes job (server/workers/emailWorker.ts)
```

**Job Types**:
- `email` → Send transactional emails (Resend API)
- `pdf` → Generate PDFs (invoices, reports)
- `notification` → Push notifications, WebSocket broadcasts
- `ai` → ML inference, data processing

**Graceful Degradation**: If Redis is unavailable, jobs fall back to immediate synchronous execution.

### **Multi-Tenancy**

All entities are scoped to `companyId` for tenant isolation:

```typescript
// Always filter by companyId
const orders = await storage.getOrdersByCompany(companyId);

// Storage layer enforces tenant isolation
```

**Legacy Note**: Some tables have `organizationId` field (deprecated) — use `companyId` for new code.

### **Data Access Layer**

All database queries go through the **`storage` singleton** (`server/storage.ts`):

```typescript
import { storage } from './storage.js';

// Type-safe queries via DbStorage class
const order = await storage.getOrderById(123);
await storage.updateOrderStatus(123, 'in-production');
```

**Benefits**:
- Centralized query logic
- Easy mocking in tests
- Tenant isolation enforcement
- Consistent error handling

---

## 🔧 Common Development Tasks

### **Adding a New API Endpoint**

1. **Update Zod schema** in `shared/schema.ts`:
```typescript
export const createWidgetSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['type_a', 'type_b']),
  companyId: z.number()
});
```

2. **Add storage method** in `server/storage.ts`:
```typescript
async createWidget(data: z.infer<typeof createWidgetSchema>) {
  const [widget] = await this.db.insert(widgets).values(data).returning();
  return widget;
}
```

3. **Add route handler** in `server/routes.ts` or modular route file:
```typescript
app.post('/api/widgets', authenticateUser, asyncHandler(async (req, res) => {
  const validated = createWidgetSchema.parse(req.body);
  const widget = await storage.createWidget(validated);
  res.json(widget);
}));
```

4. **Add client hook** in `client/src/hooks/useWidgets.ts`:
```typescript
export function useCreateWidget() {
  return useMutation({
    mutationFn: (data) => fetch('/api/widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json())
  });
}
```

### **Database Schema Changes**

1. Update `shared/schema.ts` (Drizzle schema)
2. Run `npm run db:push` to sync database
3. Update TypeScript types (auto-inferred from schema)
4. Update storage methods and route handlers

### **Adding Background Jobs**

```typescript
// 1. Define job processor (server/workers/myWorker.ts)
myQueue.process(async (job) => {
  const { data } = job;
  // Process job...
});

// 2. Enqueue jobs (server/queue/myQueue.ts)
export async function addMyJob(data: MyJobData) {
  await myQueue.add('process', data);
}

// 3. Import worker in server/index.ts
import './workers/myWorker.js';
```

---

## 🚨 Troubleshooting

### **Common Issues**

#### ❌ "Cannot connect to database"
**Solution**: Check `DATABASE_URL` in `.env`. Verify network access to Postgres instance.

#### ❌ "Redis connection failed"
**Solution**: Redis is **optional**. Jobs will fall back to immediate execution. To fix, verify `REDIS_HOST` and `REDIS_PORT`.

#### ❌ "TypeScript errors in client/"
**Solution**: Run `npm run check` to see all errors. Ensure path aliases (`@/*`, `@shared/*`) are configured in `tsconfig.json`.

#### ❌ "Tests failing"
**Solution**: 
1. Ensure test database is clean: `npm run db:push`
2. Check for port conflicts (5000, 8000, 6379)
3. Run tests individually: `npm run test:unit`, `npm run test:components`

#### ❌ "Python service won't start"
**Solution**:
1. Verify Python 3.10+ installed: `python3 --version`
2. Install dependencies: `pip install -r python-service/requirements.txt`
3. Check port 8000 availability

---

## 📚 Additional Documentation

- **[API Quick Reference](./API_QUICK_REFERENCE.md)**: Endpoint documentation
- **[Route Map](./ROUTE_MAP.md)**: Complete route registry
- **[AI Platform Guide](./AI_PLATFORM_SUBSCRIBER_GUIDE.md)**: AI feature documentation
- **[BI Platform Guide](./BI_PLATFORM_QUICK_START.md)**: Analytics and reporting
- **[Systematic Debug Report](./SYSTEMATIC_DEBUG_REPORT.md)**: Codebase health audit
- **[Copilot Instructions](./.github/copilot-instructions.md)**: AI agent guidance

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Write tests** for new features (aim for 80%+ coverage)
3. **Run quality checks**: `npm run check` + `npm run test:all`
4. **Keep changes focused**: One feature/fix per PR
5. **Follow existing patterns**: Match code style and architecture
6. **Update documentation**: README, JSDoc comments, etc.

### **Code Review Checklist**
- [ ] TypeScript compilation passes (`npm run check`)
- [ ] All tests pass (`npm run test:all`)
- [ ] No new ESLint/Prettier warnings
- [ ] Shared schema updated if API changed
- [ ] Storage layer methods added/updated
- [ ] Client hooks updated
- [ ] Documentation updated

---

## 📄 License

**Proprietary and Confidential**  
Copyright © 2025 New Vantage Co. All rights reserved.

This software and associated documentation are proprietary to New Vantage Co and protected by copyright law. Unauthorized reproduction or distribution is prohibited.

---

## 🆘 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/newvantageco/ILS2.0/issues)
- **Email**: support@newvantageco.com
- **Documentation**: See `/docs` folder for detailed guides

---

## 🎉 Acknowledgments

Built with ❤️ by the New Vantage Co engineering team.

**Special Thanks**:
- shadcn/ui for beautiful components
- Drizzle ORM team for type-safe database access
- TanStack Query for server state management
- Neon for serverless Postgres infrastructure

---

**Quick Links**:
- 📖 [Full Documentation](./docs/)
- 🔌 [API Reference](./API_QUICK_REFERENCE.md)
- 🧪 [Test Coverage Report](./coverage/)
- 📊 [Metrics Dashboard](http://localhost:5000/metrics) _(when running)_
- 🏥 [Health Check](http://localhost:5000/api/health) _(when running)_

---

**Last Updated**: November 2025  
**Version**: 2.0  
**Status**: ✅ Production Ready (98.5% health score)

## Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
npm run db:push
```

### Building for Production
```bash
npm run build
```

## License

Copyright © 2025. All rights reserved.

## Support

For support and questions, please contact the development team.
#
# Further Reading
- ROUTE_MAP: `./ROUTE_MAP.md`
- Schema ERD: `./SCHEMA_ERD.md`
- Development Guide: `./DEVELOPMENT.md`
- Contributing: `./CONTRIBUTING.md`
- Security: `./SECURITY.md`
# NVC-Internal-System-
# interneal-system-
# interneal-system-
