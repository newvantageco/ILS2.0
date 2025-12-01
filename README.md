# ILS 2.0 - Healthcare Operating System for Optical Excellence

**The complete platform for modern optical practices** — From clinical examinations to e-commerce, from NHS compliance to AI-powered intelligence. One platform, infinite possibilities.

---

## Table of Contents

- [What Is ILS 2.0?](#what-is-ils-20)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Authentication & Authorization](#authentication--authorization)
- [API Routes & Endpoints](#api-routes--endpoints)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Development Guide](#development-guide)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## What Is ILS 2.0?

ILS 2.0 is the first **Healthcare Operating System** purpose-built for the optical industry. Think Salesforce + Epic + Shopify for eyecare—all in one platform.

### Not Just Another Practice Management System

While others focus on one piece of the puzzle, ILS 2.0 unifies your entire operation:

- **Clinical Operations** - Digital examinations, prescriptions, patient records, appointments
- **Laboratory Production** - Order tracking, quality control, equipment management, production workflows
- **E-Commerce** - Shopify integration, POS, frame recommendations, inventory management
- **Healthcare Compliance** - NHS integration, GDPR compliance, audit trails, data retention
- **Business Intelligence** - Real-time analytics, forecasting, custom reports, KPI tracking
- **AI-Powered Intelligence** - Clinical assistant, automated workflows, predictive insights, anomaly detection

### Built For

- **Independent Optical Practices** - Run your entire practice from a unified platform
- **Optical Laboratories** - Production intelligence that prevents bottlenecks and optimizes workflows
- **Healthcare Enterprises** - Complete revenue cycle management, population health, quality management
- **Optical Retailers** - Integrated e-commerce with clinical workflows and inventory management

---

## Core Features

### Order Management & Production Workflow

- Complete order lifecycle management (pending → in_production → quality_check → shipped → completed)
- Real-time production queue with job prioritization
- Quality issue tracking and resolution workflows
- Patient record management with prescription tracking
- Order timeline tracking with complete status history
- Lab ticket generation and management
- Automated email notifications on order status updates
- PDF generation for orders and documentation

### Clinical Operations

- **Examinations** - Comprehensive eye examination forms with digital record keeping
- **Prescriptions** - Prescription management with verification and validation workflows
- **Patients** - Complete patient profiles with medical history and clinical data
- **Appointments** - Appointment scheduling system with automated reminders (email, SMS, calls)
- **Test Rooms** - Test room booking and resource allocation
- **Dispensing** - Frame recommendations, contact lens fitting, point-of-sale operations
- **Electronic Health Records (EHR)** - Complete clinical documentation system

### AI & Analytics Platform

- **AI Intelligence Dashboard** - Real-time insights and predictive analytics
- **Business Intelligence (BI)** - Custom report builder with KPI tracking and trend analysis
- **Machine Learning Models** - Quality prediction, demand forecasting, process optimization
- **Anomaly Detection** - Clinical and operational anomaly detection systems
- **Python Real Data Integration** - All AI services use live database instead of mock data
- **Multi-tenant RAG Queries** - Secure, isolated database queries for AI services
- **Master AI Service** - Unified AI orchestration layer
- **Clinical AI Assistant** - Real-time clinical decision support

### Laboratory & Equipment Management

- Equipment inventory tracking and status monitoring
- Bottleneck prevention and optimization analytics
- Equipment discovery service for automatic device detection
- Production bottleneck analytics and reporting
- Material requisition and inventory tracking workflows
- Maintenance scheduling and equipment lifecycle management

### Supplier & Purchase Order Management

- Complete CRUD operations for supplier and vendor management
- Automated purchase order generation with PDF export
- Inventory tracking and material requisition workflows
- Supplier performance analytics and vendor scorecards
- Autonomous purchasing system with AI-powered recommendations
- Purchase approval workflows and budget management

### User & Access Management

- **Multi-role RBAC System** - Role-based access control for ECP, Lab Tech, Engineer, Supplier, Admin, Platform Admin, Company Admin, Dispenser
- **Account Approval Workflow** - Pending/Active/Suspended user states with admin approval
- **Team Management** - Organization hierarchy with team and department structures
- **Dynamic Permission Service** - Fine-grained permission controls per role
- **Master User Provisioning** - Bootstrap admin account creation on startup
- **Two-Factor Authentication** - Optional 2FA for enhanced security
- **Audit Logging** - Complete user activity tracking for compliance

### Audit & Compliance

- **Comprehensive Audit Trail** - Complete history of all CRUD operations
- **Data Retention Policies** - Configurable retention rules (7-year retention for financial/clinical records)
- **GDPR Support** - Data export capabilities and privacy controls
- **NHS Integration** - NHS voucher validation and claims management
- **Soft Delete Support** - Data retention without permanent deletion
- **Compliance Reporting** - Automated compliance report generation

### Billing & Payments

- **Stripe Integration** - Complete payment processing system
- **Subscription Management** - Tiered plans (Free, Pro, Premium, Enterprise)
- **Feature-based Access Control** - Features tied to subscription levels
- **Metered Billing** - Usage tracking and automated billing
- **Invoice Management** - Invoice generation, tracking, and payment reconciliation
- **Revenue Cycle Management (RCM)** - Complete billing workflow automation
- **Subscription Lifecycle** - Full history and management of subscription changes

### Real-Time Features

- **WebSocket Server** - Live updates and notifications
- **Broadcast System** - Multi-user collaboration support
- **Real-time Production Dashboard** - Live job status tracking
- **Socket.IO Integration** - Scalable real-time communication
- **Live Notifications** - Instant push notifications for critical events

### Background Jobs & Event-Driven Architecture

- **BullMQ + Redis** - Reliable job queuing system
- **8 Worker Processes**:
  - Email Worker - Scheduled emails and transactional notifications
  - PDF Worker - Report generation and order documentation
  - AI Worker - Machine learning model inference and predictions
  - Notification Worker - Push notifications and alerts
  - Order Created Workers - LIMS synchronization, PDF generation, analytics
  - Analytics Worker - Data aggregation and reporting
- **Event Bus** - Publish/subscribe pattern for domain events
- **Graceful Degradation** - Falls back to in-memory processing when Redis unavailable
- **Cron Jobs**:
  - Daily briefing email generation
  - Inventory monitoring and alerts
  - Clinical anomaly detection
  - Usage reporting and metrics
  - Storage calculation and optimization

### E-Commerce & Marketplace

- **Shopify Integration** - Seamless catalog synchronization
- **POS System** - In-store selling interface with inventory management
- **Frame Recommendations** - AI-powered product suggestions
- **Marketplace** - Product discovery and ordering platform
- **Shopify Order Sync** - Bidirectional order synchronization
- **Webhook Handling** - Real-time Shopify event processing
- **Inventory Management** - Multi-location inventory tracking

### Data & Reporting

- **Healthcare Analytics** - Population health metrics and clinical insights
- **Production Analytics** - Quality metrics and production trending
- **Business Analytics** - Sales, revenue, and forecasting dashboards
- **Custom Report Builder** - Business intelligence report designer
- **Metrics Dashboard** - KPI tracking and visualization
- **Email Tracking** - Open rates and click tracking analytics
- **Export Capabilities** - Excel, CSV, PDF export for all reports

### Storage & File Management

- **Multi-provider Support** - Local filesystem, AWS S3, Cloudflare R2, Azure Blob Storage
- **Automatic File Organization** - Categorized storage with intelligent routing
- **Presigned URLs** - Secure temporary file access
- **Backup Service** - Automated data backup with retention policies
- **Archive Service** - Long-term data archival with compliance support
- **Migration Service** - Storage backend migration utilities

---

## Technology Stack

### Frontend (`client/`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.0.0 | Modern UI framework with concurrent features |
| **TypeScript** | 5.8 | Strict type safety and enhanced developer experience |
| **Vite** | 7.2.2 | Lightning-fast dev server and optimized production builds |
| **TanStack Query** | 5.60 | Server state management, caching, and synchronization |
| **Wouter** | 3.3 | Lightweight routing library (~1.5KB) |
| **shadcn/ui + Radix UI** | Latest | Accessible, unstyled component primitives |
| **Tailwind CSS** | 3.4 | Utility-first styling with dark mode support |
| **Lucide React** | 0.453 | Beautiful, consistent icon library |
| **React Hook Form** | 7.55 | Performant form management |
| **Zod** | 3.24 | Type-safe runtime validation |
| **Recharts** | 2.15 | Data visualization for analytics dashboards |
| **Framer Motion** | 11.18 | Animation library for smooth interactions |

### Backend (`server/`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 22+ | High-performance JavaScript runtime |
| **Express** | 5.0 | Web application framework |
| **TypeScript** | 5.8 | Type safety with ES modules |
| **Neon Postgres** | Latest | Serverless PostgreSQL with connection pooling |
| **Drizzle ORM** | 0.44 | Type-safe database queries with migrations |
| **Passport.js** | 0.7 | Authentication middleware (Local + Google OAuth) |
| **BullMQ** | 5.63 | Reliable background job processing |
| **Redis** | 7+ | Caching and session storage (optional) |
| **Socket.IO** | 4.8 | Real-time bidirectional communication |
| **Helmet** | 8.1 | Security middleware with best practices |
| **Express Rate Limit** | 8.2 | DDoS protection and rate limiting |
| **Pino** | 10.1 | High-performance logging |
| **Stripe** | 19.3 | Payment processing integration |
| **Resend** | 6.2 | Transactional email service |

### Python Services (`python-service/`, `ai-service/`)

| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance async API framework |
| **Pandas + NumPy** | Data analysis and numerical computing |
| **scikit-learn** | Classical ML algorithms for analytics |
| **PostgreSQL (psycopg2)** | Direct database access for real-time data |

### AI/ML Services (Node.js)

| Technology | Purpose |
|------------|---------|
| **TensorFlow.js** | Machine learning model inference in Node.js |
| **Anthropic Claude** | LLM integration for AI chat and insights |
| **OpenAI GPT-4** | Alternative LLM for AI features |

### Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| **Jest** | Backend unit and integration testing |
| **Vitest** | Frontend component testing |
| **Playwright** | End-to-end browser testing |
| **ESBuild** | Fast production bundling |
| **tsx** | TypeScript execution in development |
| **Prometheus** | Metrics collection and monitoring |
| **Node-cron** | Scheduled background tasks |
| **Docker** | Containerization for deployment |
| **Kubernetes** | Container orchestration |
| **Terraform** | Infrastructure as code |

### Native Module (`native/`)

| Technology | Purpose |
|------------|---------|
| **Rust** | Performance-critical native module |
| **Cargo** | Rust build system and package manager |

### Database Schema

- **201 Database Tables** - Comprehensive data model (9,542 lines of schema)
- **Drizzle ORM** - Type-safe queries with automatic TypeScript types
- **Migration System** - SQL migration files with version control
- **Read Replicas** - Optional read replica configuration for scaling

---

## Getting Started

### Prerequisites

- **Node.js** 22+ and **npm** 9+
- **PostgreSQL** 15+ (or use Neon serverless)
- **Redis** 7+ (optional, for background jobs — graceful fallback if unavailable)
- **Python** 3.10+ (optional, for AI/analytics services)

### Quick Start

#### Option 1: Docker Compose (Recommended for Local Development)

The easiest way to run ILS 2.0 locally with all services:

```bash
# 1. Clone the repository
git clone https://github.com/newvantageco/ILS2.0.git
cd ILS2.0

# 2. Start all services with Docker Compose
docker-compose up

# OR rebuild and start fresh
./rebuild-all-services.sh
```

**What gets started:**
- **Main App** (Node.js + React) - Port 5005
- **Python Analytics Service** - Port 8000
- **AI Service** - Port 8082
- **PostgreSQL** - Port 5432
- **Redis** - Port 6379
- **Adminer** (Database UI) - Port 8080
- **Redis Commander** - Port 8081
- **MailHog** (Email testing) - Port 8025

**Access the application:**
- **Frontend**: [http://localhost:5005](http://localhost:5005)
- **API Health**: [http://localhost:5005/api/health](http://localhost:5005/api/health)
- **Python Service**: [http://localhost:8000/health](http://localhost:8000/health)
- **AI Service**: [http://localhost:8082/health](http://localhost:8082/health)
- **Adminer**: [http://localhost:8080](http://localhost:8080)
- **Redis Commander**: [http://localhost:8081](http://localhost:8081)
- **MailHog**: [http://localhost:8025](http://localhost:8025)

#### Option 2: Manual Setup (Development without Docker)

#### 1. Clone the repository

```bash
git clone https://github.com/newvantageco/ILS2.0.git
cd ILS2.0
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure environment variables

Create a `.env` file in the project root. See `.env.example` for all available options.

**Minimum Required Configuration:**

```bash
# Database (Neon Postgres recommended)
DATABASE_URL=postgresql://user:password@hostname/database

# Session & Security (generate with: openssl rand -hex 32)
SESSION_SECRET=your_secure_random_string_here

# Application URLs
NODE_ENV=development
PORT=5005
APP_URL=http://localhost:5005
CORS_ORIGIN=http://localhost:5005

# Email (Resend recommended)
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=hello@yourdomain.com

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Master User (Optional - auto-provisioned admin account)
MASTER_USER_EMAIL=admin@example.com
MASTER_USER_PASSWORD=secure_password_min_12_chars
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=Platform Control

# Redis (Optional - background jobs)
REDIS_URL=redis://localhost:6379

# Python Services (for local development without Docker)
PYTHON_SERVICE_URL=http://localhost:8000
AI_SERVICE_URL=http://localhost:8082

# AI API Keys (Required for AI features)
OPENAI_API_KEY=sk-xxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Workers (enable background job processing)
WORKERS_ENABLED=true
```

#### 4. Initialize database

```bash
# Run migrations and push schema
npm run db:setup

# Or run individually:
npm run db:migrate  # Run SQL migrations
npm run db:push     # Push Drizzle schema
```

#### 5. Start development servers

```bash
# Start all services (client, server, Python services)
npm run dev

# OR start individually:
npm run dev:node     # Node.js server only (port 5005)
npm run dev:python   # Python analytics service only (port 8000)
```

#### 6. Access the application

- **Frontend**: [http://localhost:5005](http://localhost:5005)
- **API**: [http://localhost:5005/api](http://localhost:5005/api)
- **Health Check**: [http://localhost:5005/api/health](http://localhost:5005/api/health)
- **Metrics**: [http://localhost:5005/metrics](http://localhost:5005/metrics)
- **Python Service**: [http://localhost:8000](http://localhost:8000) (if running)

---

## Project Structure

```
ILS2.0/
├── client/                          # React Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/              # 213+ reusable UI components
│   │   │   ├── ui/                  # shadcn/ui primitives
│   │   │   ├── landing/             # Marketing page components
│   │   │   ├── dashboard/           # Dashboard widgets
│   │   │   └── ...
│   │   ├── pages/                   # 101+ page components (lazy-loaded)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── AIIntelligence.tsx
│   │   │   └── ...
│   │   ├── hooks/                   # 16 custom React hooks
│   │   ├── lib/                     # Utilities, API clients, helpers
│   │   ├── services/                # API client services
│   │   ├── stores/                  # State management
│   │   └── App.tsx                  # Main routing (210 routes, 99 lazy components)
│   ├── index.html
│   └── vite.config.ts
│
├── server/                          # Express Backend (TypeScript ESM)
│   ├── index.ts                     # Main server (400+ lines, core setup)
│   ├── app.ts                       # Express app configuration
│   ├── routes.ts                    # Main routes file (6,014 lines)
│   ├── routes/                      # 93 modular route files
│   │   ├── admin.ts, analytics.ts, appointments.ts
│   │   ├── ai-ml.ts, bi.ts, clinical/
│   │   ├── laboratory.ts, orders.ts, payments.ts
│   │   └── ... (85 more route modules)
│   ├── services/                    # 161+ service classes
│   │   ├── AIAssistantService.ts
│   │   ├── LaboratoryService.ts
│   │   ├── BillingService.ts
│   │   ├── EHRService.ts
│   │   └── ... (specialized services per domain)
│   ├── controllers/                 # 3 main controllers
│   ├── middleware/                  # 21 middleware files
│   │   ├── security.ts              # CSRF, rate limiting, security headers
│   │   ├── errorHandler.ts          # Error handling & timeouts
│   │   ├── audit.ts                 # Audit logging
│   │   ├── auth.ts                  # Authentication & RBAC
│   │   └── ...
│   ├── workers/                     # 8 background job workers
│   │   ├── emailWorker.ts
│   │   ├── pdfWorker.ts
│   │   ├── aiWorker.ts
│   │   └── ... (notification, order workers)
│   ├── jobs/                        # Cron job definitions
│   ├── websocket/                   # WebSocket server & service
│   ├── lib/                         # Core utilities
│   ├── storage.ts                   # DbStorage class (7,454 lines, 458 methods)
│   ├── storage/                     # Storage providers
│   ├── validation/                  # Input validation schemas
│   ├── utils/                       # Helper functions
│   └── scripts/                     # Utility scripts
│
├── shared/                          # Shared Code (Monorepo)
│   ├── schema.ts                    # 201 database tables (9,542 lines, Drizzle)
│   ├── types/                       # TypeScript type definitions
│   ├── schema/                      # Schema subdomains
│   └── roles.ts, terminology.ts     # Domain constants
│
├── db/                              # Database Configuration
│   ├── index.ts                     # Database connection & pooling
│   ├── queryOptimizer.ts            # Query optimization layer
│   └── replicas.ts                  # Read replica configuration
│
├── migrations/                      # SQL Migrations (10+ migration files)
│   ├── 0001_bitter_diamondback.sql
│   ├── add_shopify_integration.sql
│   ├── add_multi_tenant_architecture.sql
│   └── ... (data migration scripts)
│
├── test/                            # Test Suite (220+ test files)
│   ├── unit/                        # Unit tests (Jest)
│   ├── integration/                 # Integration tests
│   ├── components/                  # Component tests (Vitest, 81/81 passing)
│   ├── e2e/                         # End-to-end tests (Playwright)
│   ├── services/                    # Service tests
│   ├── fixtures/                    # Test data fixtures
│   └── helpers/                     # Test utilities
│
├── infrastructure/                  # Cloud & DevOps
│   ├── helm/                        # Helm charts for Kubernetes
│   ├── k8s/                         # Raw Kubernetes manifests
│   ├── terraform/                   # Terraform IaC configurations
│   └── KUBERNETES_DEPLOYMENT_GUIDE.md
│
├── kubernetes/                      # K8s Manifests
│   ├── app-deployment.yaml          # ILS app deployment
│   ├── postgres-statefulset.yaml    # Database
│   ├── redis-deployment.yaml        # Cache layer
│   ├── ingress.yaml                 # Load balancer
│   ├── hpa.yaml                     # Auto-scaling
│   └── ... (ConfigMaps, Secrets, Namespace)
│
├── native/                          # Rust Native Module
│   ├── Cargo.toml
│   └── ils-core/                    # Rust performance core
│
├── ai-service/                      # AI Service (Python)
│   ├── Multi-tenant RAG implementation
│   └── Real database integration
│
├── python-service/                  # Python Analytics Service
│   ├── FastAPI application
│   └── ML/Analytics models
│
├── packages/lims-client/            # LIMS Integration Package
│
├── docker-compose.yml               # Local dev stack (Postgres, Redis, App)
├── Dockerfile                       # Multi-stage production build
├── docker-compose.dev.yml           # Development compose
├── docker-start.sh                  # Container entrypoint
│
└── Configuration Files:
    ├── package.json                 # 180+ dependencies
    ├── tsconfig.json                # TypeScript configuration
    ├── drizzle.config.ts            # ORM configuration
    ├── vite.config.ts               # Frontend build config
    ├── jest.config.mjs              # Test configuration
    ├── tailwind.config.ts           # Styling configuration
    ├── railway.json                 # Railway deployment config
    ├── .env.example                 # 200+ environment variables template
    ├── eslint.config.js             # Linting rules
    └── components.json              # Component configuration
```

---

## Architecture Overview

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  React 19 + TypeScript 5.8 + Vite 7 + TanStack Query        │
│  359 Files | 101 Pages | 213+ Components | Wouter Routing   │
└──────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   Express API Gateway                        │
│  Express 5 + Passport Auth + Session + Rate Limiting        │
│  server/routes.ts (6,014 lines) + 93 modular route files    │
└──────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              Business Logic & Services Layer                 │
│  161 Service Classes | 21 Middleware Functions | 8 Workers  │
│  Server-side Storage: 458 async methods across 201 tables   │
└──────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Data Layer (ORM)                          │
│  PostgreSQL (Neon) | Drizzle ORM | 201 Tables               │
│  Shared schema.ts (9,542 lines) | 10+ migration files      │
└──────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              Background Processing & Events                  │
│  BullMQ Job Queue | Redis Cache | WebSocket Service         │
│  8 Workers (email, PDF, AI, notifications, orders)          │
└──────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│           External Services & Integrations                   │
│  OpenAI/Claude AI | Stripe Payments | Shopify E-commerce   │
│  Python Analytics | Resend Email | AWS S3 Storage           │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

#### Monorepo Structure
Single repository with client, server, and shared code for streamlined development and type safety across boundaries.

#### Separation of Concerns
Modular routes → Services → Storage layer architecture provides clear boundaries and testability.

#### Event-Driven Architecture
BullMQ workers process async jobs, Event bus for domain events:

```typescript
// Publish event
EventBus.publish('order.created', { orderId: 123, companyId: 1 });

// Subscribe to event
EventBus.subscribe('order.created', async (data) => {
  await storage.logAnalytics({ event: 'order_created', ...data });
});
```

**Event Examples:**
- `order.created` → Triggers LIMS sync, PDF generation, analytics logging
- `order.completed` → Send notification, update billing, archive records
- `user.approved` → Send welcome email, provision resources

#### Service-Oriented
161 specialized service classes per domain provide encapsulated business logic.

#### Repository Pattern
DbStorage class for data access (planned refactor: domain repositories).

#### Multi-Tenancy
All entities are scoped to `companyId` for tenant isolation:

```typescript
// Always filter by companyId
const orders = await storage.getOrdersByCompany(companyId);
```

#### Code Splitting
React lazy loading for frontend performance optimization.

#### Type Safety
Full TypeScript with Zod validation for runtime type checking.

### Background Job Processing

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

**Job Types:**
- `email` → Send transactional emails (Resend API)
- `pdf` → Generate PDFs (invoices, reports)
- `notification` → Push notifications, WebSocket broadcasts
- `ai` → ML inference, data processing

**Graceful Degradation**: If Redis is unavailable, jobs fall back to immediate synchronous execution.

### Data Access Layer

All database queries go through the `storage` singleton (`server/storage.ts`):

```typescript
import { storage } from './storage.js';

// Type-safe queries via DbStorage class
const order = await storage.getOrderById(123);
await storage.updateOrderStatus(123, 'in-production');
```

**Benefits:**
- Centralized query logic
- Easy mocking in tests
- Tenant isolation enforcement
- Consistent error handling

---

## Authentication & Authorization

### Authentication Methods

- **Local Email/Password** - Standard authentication with bcrypt hashing
- **Google OAuth 2.0** - Sign in with Google integration
- **Session-based** - Express sessions with Redis store (or memory store fallback)
- **Two-Factor Authentication** - Optional 2FA support with TOTP

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **ECP** (Eye Care Professional) | Create orders, view own patients, track order status |
| **Lab Tech** | View production queue, update job status, quality checks |
| **Engineer** | Advanced production controls, technical documentation access |
| **Supplier** | View assigned POs, update inventory, manage deliveries |
| **Company Admin** | Company-level user management and settings |
| **Platform Admin** | Platform-wide administration and configuration |
| **Admin** | General administrative access |
| **Dispenser** | POS and dispensing operations |

### Master User Provisioning

For operational control, you can pre-configure a master admin account that automatically receives all roles. Set these environment variables:

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
4. Assigns **all available roles**

Leave these variables empty to skip master user creation.

### Account Approval Workflow

New user registrations require admin approval:
1. User registers → account status: **Pending**
2. Admin reviews in `/admin/users` dashboard
3. Admin approves → account status: **Active**
4. User can now log in and access assigned features

### Security Features

- **Password Hashing** - bcrypt with salt rounds
- **Session Management** - httpOnly cookies, sameSite=strict
- **Rate Limiting** - Global (100 req/15min), auth (5 attempts/15min)
- **Security Headers** - HSTS, CSP, X-Frame-Options via Helmet.js
- **CORS Protection** - Strict origin validation in production
- **CSRF Protection** - Token-based CSRF protection (optional)
- **Audit Logging** - All API requests logged with middleware

---

## API Routes & Endpoints

### Total: 90+ route modules with 300+ endpoints

#### Authentication & User Management
- `auth.ts`, `google-auth.ts` - Login, signup, OAuth
- `userManagement.ts`, `users.ts` - User CRUD operations
- `twoFactor.ts` - 2FA authentication

#### Core Operations
- `orders.ts` - Order CRUD, status updates, PDF generation
- `suppliers.ts` - Supplier management
- `laboratory.ts` - Lab workflows and production
- `appointments.ts` - Appointment scheduling
- `patients.ts` - Patient records (in clinical/)
- `equipment.ts` - Equipment management
- `quality.ts` - Quality control workflows

#### Clinical Operations
- `clinical/examinations.ts` - Eye examinations
- `clinical/prescriptions.ts` - Prescription management
- `clinical/ehr.ts` - Electronic health records

#### Analytics & Reporting
- `analytics.ts` - Real-time analytics
- `bi-analytics.ts` - Business intelligence
- `reporting.ts` - Report generation

#### AI & ML
- `ai-ml.ts` - AI operations and model management
- `ai-purchase-orders.ts` - AI-powered purchasing

#### Business Operations
- `billing.ts` - Billing operations
- `payments.ts` - Payment processing
- `invoices.ts` - Invoice management
- `rcm.ts` - Revenue cycle management
- `inventory.ts` - Inventory tracking

#### Admin & Management
- `admin.ts` - Platform administration
- `system-admin.ts` - System-level admin
- `permissions.ts` - Permission management
- `audit.ts` - Audit log queries

#### Integration & External
- `shopify.ts` - Shopify sync and management
- `webhooks.ts` - Webhook handlers
- `integrations.ts` - Third-party integrations
- `nhs.ts` - NHS claim and voucher integration

#### Specialized
- `telehealth.ts` - Remote consultations
- `mhealth.ts` - Mobile health
- `population-health.ts` - Population health management
- `research.ts` - Clinical research
- `backup.ts` - Backup operations

---

## Testing

### Test Suites

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
npm run test:components:watch  # Watch mode

# End-to-end tests (Playwright) - Full browser automation
npm run test:e2e
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # Headed browser mode

# Accessibility tests
npm run test:accessibility

# Coverage report
npm run test:coverage

# CI pipeline
npm run test:ci  # TypeScript check + coverage + integration + components
```

### Current Test Coverage

- **Component Tests**: 81/81 test cases passing (100%)
- **Test Files**: 220+ test files across unit, integration, component, and E2E suites
- **Production-Ready**: Core features tested and functional

---

## Production Deployment

### Build for Production

```bash
# Build client (Vite) + server (ESBuild)
npm run build

# Optional: Build native Rust module for performance
npm run build:native

# Output:
# - client/dist/        → Static frontend assets
# - dist/               → Bundled server code
```

### Start Production Server

```bash
NODE_ENV=production npm start
# OR
NODE_ENV=production node dist/index.js
```

### Environment Checklist

Before deploying to production, ensure:

- [ ] `DATABASE_URL` points to production Postgres instance
- [ ] `SESSION_SECRET` is a strong, random string (generate with: `openssl rand -hex 32`)
- [ ] `REDIS_URL` or `REDIS_HOST`/`REDIS_PASSWORD` configured for production Redis
- [ ] `STRIPE_SECRET_KEY` uses live keys (not test keys: `sk_live_xxx`)
- [ ] `STRIPE_PUBLISHABLE_KEY` uses live keys (`pk_live_xxx`)
- [ ] `STRIPE_WEBHOOK_SECRET` configured for production webhooks
- [ ] `RESEND_API_KEY` configured for production email domain
- [ ] `MAIL_FROM` set to verified domain email
- [ ] `APP_URL` set to production domain
- [ ] `CORS_ORIGIN` set to production frontend domain
- [ ] `NODE_ENV=production` set
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting tuned for expected traffic
- [ ] Monitoring/alerting configured (Prometheus `/metrics` endpoint)
- [ ] Backup strategy implemented for database
- [ ] Log aggregation configured
- [ ] Master user environment variables removed or secured

### Recommended Production Stack

- **Hosting**: Railway (recommended), Render, AWS ECS, Google Cloud Run, Azure App Service
- **Database**: Neon (serverless Postgres), Railway Postgres, AWS RDS, Supabase
- **Redis**: Railway Redis, Upstash, Redis Cloud, AWS ElastiCache
- **Reverse Proxy**: Nginx, Caddy, Cloudflare
- **Monitoring**: Prometheus + Grafana, Datadog, New Relic, Sentry
- **Email**: Resend (recommended), SendGrid, AWS SES
- **Storage**: AWS S3, Cloudflare R2, Azure Blob Storage

### Railway Deployment (Recommended)

Railway is the recommended platform for deploying ILS 2.0 as a SaaS application.

#### Quick Start:

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   ```

2. **Deploy Services**
   - Create PostgreSQL database (enable Production Mode)
   - Create Redis service
   - Deploy web application
   - Configure environment variables

3. **Configure Domain**
   - Add custom domain in Railway dashboard
   - Update DNS: `CNAME app.yourdomain.com → your-app.up.railway.app`
   - SSL automatically provisioned

4. **Validate Deployment**
   ```bash
   npm run validate:railway  # Validate Railway environment
   npm run railway:deploy    # Deploy to Railway
   npm run railway:logs      # View deployment logs
   ```

### Docker Deployment

#### Using Docker Compose (Local Development)

The docker-compose.yml includes all services needed for local development:

```bash
# Start all services
docker-compose up

# OR use the rebuild script for fresh start
./rebuild-all-services.sh

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f python-service
docker-compose logs -f ai-service
```

**Services started by docker-compose:**
- **ILS App** - Main Node.js application (port 5005)
- **Python Service** - Analytics service (port 8000)
- **AI Service** - RAG and AI features (port 8082)
- **PostgreSQL 16** - Primary database (port 5432)
- **Redis 7** - Caching and job queue (port 6379)
- **Adminer** - Database management UI (port 8080)
- **Redis Commander** - Redis management UI (port 8081)
- **MailHog** - Email testing (port 8025)

**Important Environment Files:**
- `.env.docker` - Used by Docker Compose services
- `.env` - Used for local non-Docker development

#### Building Production Image

```bash
docker build -t ils2.0:latest .
docker run -p 5005:5005 --env-file .env ils2.0:latest
```

### Kubernetes Deployment

Pre-configured Kubernetes manifests available in `/kubernetes` directory:

```bash
# Deploy to Kubernetes cluster
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secrets.yaml
kubectl apply -f kubernetes/postgres-statefulset.yaml
kubectl apply -f kubernetes/redis-deployment.yaml
kubectl apply -f kubernetes/app-deployment.yaml
kubectl apply -f kubernetes/ingress.yaml
kubectl apply -f kubernetes/hpa.yaml
```

See `/infrastructure/KUBERNETES_DEPLOYMENT_GUIDE.md` for complete instructions.

---

## Development Guide

### Common Development Tasks

#### Adding a New API Endpoint

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

3. **Add route handler** in `server/routes/` or `server/routes.ts`:
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

#### Database Schema Changes

1. Update `shared/schema.ts` (Drizzle schema)
2. Run `npm run db:push` to sync database
3. Update TypeScript types (auto-inferred from schema)
4. Update storage methods and route handlers

#### Adding Background Jobs

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

### Development Commands

```bash
# Development
npm run dev              # Start all services (client + server + Python)
npm run dev:node         # Node.js server only (tsx watch mode)
npm run dev:python       # Python analytics service only
npm run dev:bash         # Alternative shell script

# Database
npm run db:push          # Push schema changes to database (Drizzle Kit)
npm run db:migrate       # Run SQL migrations
npm run db:setup         # Combined migrate + push
npm run migrate-storage  # Run data migration scripts
npm run migrate-storage:dry-run  # Preview migration
npm run migrate-storage:verify   # Verify migration

# Build & Production
npm run build            # Build client + server for production
npm run build:native     # Build Rust native module
npm run start            # Start production server

# Code Quality
npm run check            # TypeScript type checking (noEmit)
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix ESLint issues

# Testing
npm test                 # Integration tests
npm run test:unit        # Unit tests (fast)
npm run test:integration # Integration tests
npm run test:components  # Component tests (Vitest)
npm run test:e2e         # End-to-end tests (Playwright)
npm run test:all         # All tests + TypeScript check
npm run test:coverage    # Coverage report
npm run test:watch       # Watch mode for tests

# Environment Validation
npm run validate:env     # Validate environment variables
npm run validate:railway # Validate Railway environment

# Utilities
npm run create-master-user  # Create master admin user
```

---

## Configuration

### Environment Variables

See `.env.example` for complete list of 200+ environment variables.

#### Core Configuration

```bash
NODE_ENV=development|production
PORT=5000
HOST=0.0.0.0
APP_URL=http://localhost:5000
```

#### Database

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_POOL_MAX=20
DB_POOL_MIN=5
DATABASE_READ_REPLICAS=  # Comma-separated URLs for read replicas
```

#### Security

```bash
SESSION_SECRET=  # Generate with: openssl rand -hex 32
CSRF_SECRET=     # Generate with: openssl rand -hex 32
CSRF_ENABLED=true
CORS_ORIGIN=http://localhost:5000
```

#### Redis (Optional)

```bash
REDIS_URL=redis://localhost:6379
# OR
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

#### Email

```bash
RESEND_API_KEY=
MAIL_FROM=hello@yourdomain.com

# SMTP Alternative
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_SECURE=true
```

#### Payments (Stripe)

```bash
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Subscription Price IDs
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_STARTER_YEARLY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_ENTERPRISE_MONTHLY=
STRIPE_PRICE_ENTERPRISE_YEARLY=
```

#### AI Services

```bash
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# For Docker Compose (container names)
PYTHON_SERVICE_URL=http://python-service:8000
AI_SERVICE_URL=http://ai-service:8082

# For local development (localhost)
# PYTHON_SERVICE_URL=http://localhost:8000
# AI_SERVICE_URL=http://localhost:8082
```

#### Storage

```bash
STORAGE_PROVIDER=local|s3|cloudflare-r2|azure-blob
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=ils-files
CDN_BASE_URL=
```

#### Monitoring

```bash
LOG_LEVEL=info|debug|warn|error
OTEL_ENABLED=false
METRICS_ENABLED=true
SENTRY_DSN=
POSTHOG_API_KEY=
```

---

## Troubleshooting

### Common Issues

#### Docker Compose Issues

##### Services won't start

**Solution**:
```bash
# Stop all containers
docker-compose down

# Remove old volumes
docker-compose down -v

# Rebuild and start fresh
./rebuild-all-services.sh

# OR manually rebuild
docker-compose build --no-cache
docker-compose up
```

##### Port conflicts

**Error**: `Bind for 0.0.0.0:5005 failed: port is already allocated`

**Solution**: Check which process is using the port and stop it:
```bash
# Check what's using port 5005
lsof -i :5005

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

**Common port conflicts:**
- 5005 → Main app
- 8000 → Python service
- 8082 → AI service
- 5432 → PostgreSQL
- 6379 → Redis
- 8080 → Adminer
- 8081 → Redis Commander

##### AI Service Unhealthy (Known Issue)

**Error**: `sqlalchemy.exc.InvalidRequestError: Attribute name 'metadata' is reserved`

**Status**: Known issue in ai-service/services/database.py - AIMessage model uses reserved attribute name

**Workaround**: The main app and Python service work without AI service. AI features will be degraded until this is fixed.

**Fix Required**: Rename the `metadata` column in AIMessage model to `message_metadata` or similar.

##### Container logs show errors

**Solution**: Check specific service logs:
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f app
docker-compose logs -f python-service
docker-compose logs -f ai-service
docker-compose logs -f postgres

# Check health status
docker ps
```

#### Cannot connect to database

**Solution**: Check `DATABASE_URL` in `.env` or `.env.docker`. Verify network access to Postgres instance.

```bash
# Test database connection (Docker)
docker exec -it ils-postgres psql -U ils_user -d ils_db

# Test database connection (direct)
psql $DATABASE_URL
```

#### Redis connection failed

**Solution**: Redis is **optional**. Jobs will fall back to immediate execution. To fix, verify `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`.

```bash
# Test Redis connection (Docker)
docker exec -it ils-redis redis-cli ping

# Test Redis connection (direct)
redis-cli -u $REDIS_URL ping
```

#### Service URL misconfiguration

**Problem**: App can't reach Python/AI services

**Solution**: Check environment variables match your setup:

**For Docker Compose** (in `.env.docker`):
```bash
PYTHON_SERVICE_URL=http://python-service:8000
AI_SERVICE_URL=http://ai-service:8082
```

**For local development** (in `.env`):
```bash
PYTHON_SERVICE_URL=http://localhost:8000
AI_SERVICE_URL=http://localhost:8082
```

#### TypeScript errors

**Solution**: Run `npm run check` to see all errors. Ensure dependencies are installed.

```bash
npm install
npm run check
```

#### Tests failing

**Solution**:
1. Ensure test database is clean: `npm run db:setup`
2. Check for port conflicts (5005, 8000, 8082, 6379)
3. Run tests individually: `npm run test:unit`, `npm run test:components`

#### Python service won't start

**Solution**:
1. Verify Python 3.10+ installed: `python3 --version`
2. Install dependencies: `pip install -r python-service/requirements.txt`
3. Check port 8000 availability
4. Check Docker logs: `docker-compose logs -f python-service`

#### Build failures

**Solution**:
1. Clear build cache: `rm -rf dist client/dist`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (requires 22+)
4. For Docker: `docker-compose build --no-cache`

#### Session issues / Can't stay logged in

**Solution**:
1. Verify `SESSION_SECRET` is set in `.env` or `.env.docker`
2. Check Redis connection if using Redis sessions
3. Clear browser cookies and try again

#### Database migration errors

**Error**: Conflicting enum types

**Solution**: Use the migration fix script:
```bash
./fix-migrations.sh
```

This script drops conflicting enum types and reruns the schema push.

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Write tests** for new features (aim for 80%+ coverage)
3. **Run quality checks**: `npm run check` + `npm run test:all`
4. **Keep changes focused**: One feature/fix per PR
5. **Follow existing patterns**: Match code style and architecture
6. **Update documentation**: README, JSDoc comments, etc.

### Code Review Checklist

- [ ] TypeScript compilation passes (`npm run check`)
- [ ] All tests pass (`npm run test:all`)
- [ ] No new ESLint warnings (`npm run lint`)
- [ ] Shared schema updated if API changed
- [ ] Storage layer methods added/updated
- [ ] Client hooks updated
- [ ] Documentation updated
- [ ] No sensitive data in commits

### Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: add my feature"`
3. Push to fork: `git push origin feature/my-feature`
4. Open Pull Request with description

---

## License

**Proprietary and Confidential**
Copyright (c) 2025 New Vantage Co. All rights reserved.

This software and associated documentation are proprietary to New Vantage Co and protected by copyright law. Unauthorized reproduction or distribution is prohibited.

---

## Support & Contact

- **Issues**: [GitHub Issues](https://github.com/newvantageco/ILS2.0/issues)
- **Email**: support@newvantageco.com
- **Documentation**: See `/docs` folder for detailed guides

---

## Additional Documentation

- **API Quick Reference**: `./docs/API_QUICK_REFERENCE.md`
- **Route Map**: `./docs/ROUTE_MAP.md`
- **AI Platform Guide**: `./docs/AI_PLATFORM_SUBSCRIBER_GUIDE.md`
- **BI Platform Guide**: `./docs/BI_PLATFORM_QUICK_START.md`
- **Kubernetes Deployment**: `./infrastructure/KUBERNETES_DEPLOYMENT_GUIDE.md`
- **Railway Deployment**: `./docs/deployment/README_DEPLOYMENT.md`
- **Production Readiness**: `./scripts/production-readiness/README.md`

---

## Key Integration Points

1. **Shopify E-Commerce** - Full product sync, order creation, webhook handling
2. **Stripe Payments** - Subscription management, metered billing, webhook processing
3. **Email Services** - Resend (primary), SMTP (fallback), Ethereal (testing)
4. **AI Services** - OpenAI GPT-4, Anthropic Claude, Python FastAPI service
5. **NHS Integration** - Voucher validation, claims processing
6. **File Storage** - Local, AWS S3, Cloudflare R2, Azure Blob Storage
7. **OAuth** - Google Sign-In for user authentication
8. **WebSocket** - Real-time updates and live dashboards
9. **LIMS** - Laboratory Information Management System integration
10. **Analytics** - PostHog for product analytics, Sentry for error tracking

---

## Acknowledgments

Built with care by the New Vantage Co engineering team.

**Special Thanks:**
- shadcn/ui for beautiful components
- Drizzle ORM team for type-safe database access
- TanStack Query for server state management
- Neon for serverless Postgres infrastructure

---

**Last Updated**: December 2025
**Version**: 2.0
**Status**: Production Ready

---

## Quick Links (Local Development)

**Main Application:**
- **Frontend**: [http://localhost:5005](http://localhost:5005)
- **Health Check**: [http://localhost:5005/api/health](http://localhost:5005/api/health)
- **Metrics Dashboard**: [http://localhost:5005/metrics](http://localhost:5005/metrics)

**Python Services:**
- **Python Analytics**: [http://localhost:8000/health](http://localhost:8000/health)
- **AI Service**: [http://localhost:8082/health](http://localhost:8082/health)

**Development Tools:**
- **Adminer** (Database UI): [http://localhost:8080](http://localhost:8080)
- **Redis Commander**: [http://localhost:8081](http://localhost:8081)
- **MailHog** (Email Testing): [http://localhost:8025](http://localhost:8025)

**Documentation:**
- **Full Documentation**: `/docs` folder
- **Test Coverage**: Run `npm run test:coverage`
- **Fixes Applied**: See [FIXES_APPLIED.md](./FIXES_APPLIED.md)
