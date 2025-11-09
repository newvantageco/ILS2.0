# Integrated Lens System (ILS) - Comprehensive Codebase Overview

## Executive Summary

The **Integrated Lens System (ILS)** is an enterprise-grade, multi-tenant SaaS platform for managing optical/ophthalmic laboratory operations, lens manufacturing workflows, quality control, and Eye Care Professional (ECP) practice management. The system targets the UK optical industry with GOC (General Optical Council) compliance, NHS integration support, and comprehensive clinical examination workflows.

**Key Characteristics:**
- **Domain**: Healthcare/Ophthalmic/Optical retail and manufacturing
- **Type**: Full-stack SaaS platform with AI/ML capabilities
- **Architecture**: Monolithic Express.js + React with microservice-ready design
- **Scale**: Multi-tenant with role-based access control (RBAC)
- **Status**: Advanced implementation with 6 phases completed

---

## 1. Project Structure & Architecture

### 1.1 Directory Organization

```
/home/user/ILS2.0/
├── client/                    # React SPA frontend (TypeScript)
│   ├── src/
│   │   ├── pages/            # 50+ page components (dashboards, forms, workflows)
│   │   ├── components/       # 200+ reusable UI components
│   │   │   ├── eye-exam/     # 9+ clinical exam components
│   │   │   ├── bi/           # Business Intelligence dashboards
│   │   │   ├── ai/           # AI assistant components
│   │   │   ├── pos/          # Point of Sale components
│   │   │   ├── dashboard/    # Dashboard widgets
│   │   │   ├── ui/           # 86+ base UI components (Radix UI)
│   │   │   └── landing/      # Landing page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client services
│   │   ├── lib/              # Utilities and helpers
│   │   └── stores/           # State management
│   └── public/               # Static assets
│
├── server/                    # Express.js backend (TypeScript)
│   ├── routes/               # 50+ API route files
│   │   ├── api/              # Core API endpoints
│   │   ├── clinical/         # Clinical workflows
│   │   └── webhooks/         # Third-party integrations
│   ├── services/             # 60+ business logic services
│   │   ├── ai/               # AI-powered services
│   │   ├── aiEngine/         # AI engine implementations
│   │   └── __tests__/        # Service tests
│   ├── middleware/           # Authentication, auth, error handling
│   ├── workers/              # Background job processors (email, PDF, AI, notifications)
│   ├── queue/                # Redis-backed job queue configuration
│   ├── jobs/                 # Scheduled cron jobs
│   ├── events/               # Event system with webhooks & WebSocket
│   ├── utils/                # Logger, helpers
│   ├── storage/              # Database access layer
│   ├── types/                # TypeScript type definitions
│   └── index.ts              # Server entry point
│
├── shared/                    # Shared code (types, schemas)
│   ├── schema.ts             # 140+ database tables & enums
│   ├── engineeringSchema.ts  # Engineering-specific schemas
│   ├── bi-schema.ts          # BI schemas
│   ├── omaParser.ts          # OMA file parsing
│   └── types/                # Shared type definitions
│
├── db/                        # Database configuration
│   └── migrations/           # Database schema migrations
│
├── test/                      # Comprehensive test suite
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── components/           # React component tests
│   ├── e2e/                  # End-to-end tests (Playwright)
│   └── fixtures/             # Test data
│
├── docs/                      # Technical documentation
│   ├── architecture.md       # System architecture
│   ├── compliance.md         # Compliance requirements
│   └── testing.md            # Testing strategies
│
├── infrastructure/           # Deployment configurations
│   ├── k8s/                  # Kubernetes manifests
│   ├── helm/                 # Helm charts
│   └── terraform/            # Infrastructure-as-code (AWS)
│
├── ai-service/               # AI/ML services (Python)
│   ├── api/                  # AI service API
│   ├── rag/                  # Retrieval-Augmented Generation
│   ├── training/             # ML model training
│   └── data/                 # Training datasets
│
├── python-service/           # Python integration service
├── python/                    # Python utilities
├── scripts/                   # Build and development scripts
├── public/                    # Static files
└── migrations/                # Database migrations
```

### 1.2 Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript 5.6
- **Build Tool**: Vite 5.4 (fast dev server, optimized builds)
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query (server state), custom hooks
- **UI Components**: shadcn/ui + Radix UI (accessible, composable)
- **Styling**: Tailwind CSS 3.4 with custom animations
- **Charts**: Recharts 2.15 (BI dashboards)
- **Icons**: Lucide React (460+ icons), Ant Design Icons
- **Forms**: React Hook Form + Zod validation
- **PDF**: PDFKit for client-side PDF generation
- **Drag & Drop**: React Resizable Panels
- **Tables**: TanStack React Table (advanced data tables)

#### Backend
- **Runtime**: Node.js 18+ with ES modules
- **Web Framework**: Express.js 4.21
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM (type-safe, zero-runtime)
- **Validation**: Zod schemas with TypeScript inference
- **Authentication**: Passport.js + OpenID Connect + Local auth
- **Session Storage**: connect-redis (Redis-backed)
- **Job Queue**: BullMQ with Redis
- **Email**: Nodemailer + Resend
- **PDF Generation**: PDFKit (server-side)
- **File Upload**: Multer with S3/Azure Blob/Local storage
- **AI/ML**: Claude SDK (Anthropic), TensorFlow.js, Python integration
- **Payment**: Stripe SDK
- **DICOM**: dicom-parser (medical imaging)
- **Rate Limiting**: express-rate-limit, helmet (security)

#### Infrastructure & DevOps
- **Container Orchestration**: Kubernetes (AWS EKS recommended)
- **Infrastructure-as-Code**: Terraform for AWS provisioning
- **Package Managers**: Helm for Kubernetes deployments
- **Development Environment**: Replit-based with local fallbacks
- **CI/CD**: GitHub Actions (configured in .github/)
- **Testing Framework**: Jest, Vitest, Playwright
- **Code Quality**: TypeScript strict mode, ESLint

---

## 2. Application Type & Domain

### 2.1 Healthcare/Optical Domain Focus

This is a **specialized healthcare application** for the ophthalmic/optical sector, specifically targeting:

#### Primary Users
1. **Eye Care Professionals (ECPs)** - Optometrists, opticians running practices
2. **Lab Technicians & Engineers** - Manufacturing lens production
3. **Dispensers** - Retail optical dispensing staff
4. **Suppliers** - Frame and material suppliers
5. **Platform Admins** - System operators

#### Key Domain-Specific Features
- **Eye Examination Module**: 10+ comprehensive exam components
  - Visual acuity testing
  - Refraction (new prescription)
  - Slit lamp examination
  - Tonometry (eye pressure)
  - Ophthalmoscopy
  - General health history
  - Additional clinical tests
  
- **Prescription Management**
  - Rx tracking with OD (right eye) / OS (left eye)
  - Contact lens wearer support
  - Historical prescription comparison
  - Prescription alerts and reminders
  
- **Dispensing Workflow**
  - Patient-to-dispenser handoff system
  - Smart product recommendations based on diagnosis
  - Frame and lens selection matching prescriptions
  - Dispense slip generation
  
- **Lens Manufacturing**
  - OMA file parsing (optical manufacturing format)
  - Production workflow tracking
  - Quality control checks
  - Equipment management and calibration
  
- **NHS Integration**
  - GOC (General Optical Council) compliance
  - Sight test form management
  - NHS/Private appointment tracking
  - Regulatory compliance checks
  
- **Clinical Protocols**
  - Template-based clinical pathways
  - Evidence-based recommendations
  - Patient history tracking
  - Appointment scheduling with test rooms

### 2.2 Database Schema (140+ Tables)

**Core Clinical Tables:**
- `patients` - Patient demographics, emergency contacts
- `eyeExaminations` - Clinical exam records with detailed eye health data
- `prescriptions` - Prescription records with refraction data
- `dicomReadings` - DICOM imaging data for eye exams
- `dispenseRecords` - Dispensing transaction records
- `testRooms` - Physical exam room management
- `testRoomBookings` - Appointment scheduling
- `gocComplianceChecks` - Regulatory compliance tracking

**Order & Manufacturing:**
- `orders` - Lens orders from ECPs
- `products` - Lens and frame inventory
- `equipment` - Lab equipment (lathes, coating machines, etc.)
- `calibrationRecords` - Equipment maintenance tracking
- `qualityIssues` - Manufacturing defects and resolutions
- `returns` - Customer returns and non-adapts
- `nonAdapts` - Patient feedback on unsuccessful lenses

**Business & Operations:**
- `companies` - Multi-tenant company data
- `users` - User accounts with roles
- `subscriptionPlans` - SaaS subscription tiers
- `invoices` & `invoiceLineItems` - Billing
- `posTransactions` - Point of sale transactions
- `purchaseOrders` - Supplier orders
- `inventoryMovements` - Stock tracking

**AI & Analytics:**
- `aiConversations` & `aiMessages` - Chat history
- `demandForecasts` - ML demand predictions
- `analyticsEvents` - Event tracking
- `aiKnowledgeBase` - RAG training data
- `aiLearningData` - Model training datasets

**Communication & Compliance:**
- `emails` & `emailTemplates` - Email management
- `emailTrackingEvents` - Email open/click tracking
- `notifications` - In-app notifications
- `auditLogs` - Compliance audit trails
- `webhookSubscriptions` & `webhookDeliveries` - Third-party integrations

---

## 3. UI/UX Framework & Components

### 3.1 Design System

**Component Library:**
- **86 base UI components** in `/client/src/components/ui/`
- Built on Radix UI primitives with Tailwind CSS
- Fully accessible (WCAG compliant)
- Dark/light theme support via next-themes
- Motion via Framer Motion (11.18)
- Icons via Lucide React + Ant Design

**Component Categories:**
- **Form Components**: Input, Select, Checkbox, Radio, Toggle, DatePicker, ComboBox
- **Data Display**: Table (advanced), Badge, Avatar, ProgressBar, Skeleton
- **Feedback**: Toast notifications, Dialog, Alert dialog, Tooltip, Popover
- **Navigation**: Sidebar, Breadcrumbs, CommandPalette, Tabs, Menubar
- **Layout**: Card, Separator, ScrollArea, ResizablePanels
- **Enhancement**: AdvancedCharts, ImageUpload, FileUpload, ChangeHistoryDialog
- **Specialized**: CommandPalette (Cmd+K), FloatingAiChat, NotificationCenter

### 3.2 Page Architecture (50+ Pages)

**Authentication & Onboarding:**
- Landing.tsx, LandingNew.tsx
- Login.tsx, EmailLoginPage.tsx
- SignupPage.tsx, EmailSignupPage.tsx
- WelcomePage.tsx, OnboardingFlow.tsx
- PendingApprovalPage.tsx, AccountSuspendedPage.tsx

**Role-Specific Dashboards:**
- ECPDashboard.tsx - Eye care practice operations
- LabDashboard.tsx - Manufacturing lab operations
- SupplierDashboard.tsx - Supplier management
- AdminDashboard.tsx - User and system management
- PlatformAdminPage.tsx - Platform-wide analytics
- CompanyAdminPage.tsx - Company-level settings

**Clinical Features:**
- EyeTestPage.tsx - Eye examination workflow
- EyeExaminationComprehensive.tsx - Full exam form (45KB component)
- ExaminationList.tsx - Exam history
- AddOutsideRx.tsx - External prescription import
- PrescriptionTemplatesPage.tsx - Template management
- ClinicalProtocolsPage.tsx - Clinical pathways

**Practice Management:**
- PatientsPage.tsx - Patient directory
- PrescriptionsPage.tsx - Prescription management
- InventoryManagement.tsx - Stock management
- OpticalPOSPage.tsx - Point of sale
- TestRoomsPage.tsx - Exam room booking
- TestRoomBookingsPage.tsx - Appointment calendar

**Lab Operations:**
- ProductionTrackingPage.tsx - Order manufacturing status
- QualityControlPage.tsx - Quality checks
- EquipmentPage.tsx - Equipment management
- EngineeringDashboardPage.tsx - Engineering metrics
- ReturnsManagementPage.tsx - Return processing
- NonAdaptsPage.tsx - Patient complaints

**Analytics & Intelligence:**
- AnalyticsDashboard.tsx - Real-time metrics
- BusinessAnalyticsPage.tsx - Financial analytics
- BIDashboardPage.tsx - Business Intelligence suite
- AIForecastingDashboardPage.tsx - Demand forecasting
- AuditLogsPage.tsx - Compliance audit trails
- PlatformInsightsDashboard.tsx - Platform-wide insights

**AI & Integration:**
- AIAssistantPage.tsx - Chat interface with AI
- AIPurchaseOrdersPage.tsx - AI-generated POs
- AIModelManagementPage.tsx - Model training/deployment
- ShopifyIntegrationPage.tsx - Shopify sync
- EmailAnalyticsPage.tsx - Email campaign tracking
- APIDocumentationPage.tsx - Developer docs

### 3.3 Advanced UI Features

- **Responsive Design**: Mobile-first, works on all screen sizes
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **PWA Features**: Install prompt, offline indicator, background sync
- **Performance**: Code splitting with Suspense, lazy loading, query caching
- **Dark Mode**: Full dark/light theme support with persistence
- **Loading States**: Global loading bar, skeleton loaders, suspense fallbacks
- **Error Handling**: Error boundaries, toast notifications, comprehensive logging
- **Animations**: Page transitions, card animations, hover effects

---

## 4. Key Features & Functionality

### 4.1 Core Features (Phases 1-6 Complete)

**Phase 1: Core Order Management ✅**
- Order creation and status tracking
- Patient management interface
- Lab dashboard with production workflow
- Consult logging system
- Technical documentation library

**Phase 2: Supplier Management ✅**
- Supplier CRUD operations
- Contact management
- Purchase order generation
- Supplier relationships

**Phase 3: Customer Reference & PO Enhancement ✅**
- Customer reference tracking
- Enhanced PO with supplier details
- PDF generation and email notifications

**Phase 4: Settings Management ✅**
- Organization settings
- User preferences
- Theme and language options
- Role-based settings access

**Phase 5: User Management ✅**
- Multi-role system (7+ roles)
- Account approval workflow (pending/active/suspended)
- Comprehensive admin dashboard
- Role-based access control (RBAC)

**Phase 6: OMA File Support ✅**
- OMA file upload and parsing
- Frame tracing visualization
- Integrated file viewer

### 4.2 Advanced Features

**Dynamic RBAC System**
- 140+ permissions organized in 14 categories
- 7+ default roles (Owner, Admin, Optometrist, Dispenser, Lab Tech, Engineer, Supplier)
- Company-specific role customization
- Permission caching for performance
- Multi-tenant isolation
- Subscription-based feature gating (free vs. paid plans)

**AI/ML Capabilities**
- **Master AI Service**: Unified chat interface with:
  - Natural language understanding (Claude SDK)
  - Topic validation (optometry/eyecare only)
  - Database tool execution
  - RAG (Retrieval-Augmented Generation)
  - Document learning and knowledge extraction
  
- **Demand Forecasting**: Statistical ML predictions for inventory
  
- **Anomaly Detection**: Clinical anomaly detection for quality control
  
- **Predictive Non-Adapt Service**: ML models predict patient adaptation failure
  
- **Autonomous Purchasing**: AI-driven purchase order generation
  
- **Clinical Workflow Intelligence**: Recommendation engine for patient care

**Email & Communication**
- **Scheduled Email Service**: Cron-based email dispatch
- **Email Tracking**: Open/click tracking with analytics
- **Email Templates**: Customizable templates for all workflows
- **Multiple Email Types**: invoices, receipts, reminders, order updates, marketing

**Marketplace & POS**
- **Optical POS System**: Complete point-of-sale interface
- **Inventory Management**: Real-time stock tracking with low-stock alerts
- **Marketplace Integration**: Multi-vendor product catalog
- **Company Relationships**: Connection requests and supplier management

**Business Intelligence**
- **Practice Pulse Dashboard**: Real-time practice metrics
- **Financial Dashboard**: Revenue, costs, margins, currency support
- **Operational Dashboard**: Efficiency and throughput metrics
- **Patient Dashboard**: Demographics and health trends
- **Platform AI Dashboard**: AI system usage and performance

**Quality & Compliance**
- **Quality Control Module**: Issue tracking and resolution
- **Returns Management**: Return processing and tracking
- **Non-Adapts Tracking**: Patient feedback on unsatisfactory lenses
- **GOC Compliance**: UK General Optical Council requirements
- **Audit Logging**: Full compliance audit trail
- **NHS Integration**: Sight test form support

**Production & Manufacturing**
- **Lab Work Tickets**: Manufacturing job management
- **Equipment Discovery**: Automatic equipment detection
- **Calibration Records**: Equipment maintenance tracking
- **Production Tracking**: Real-time status updates
- **Bottleneck Prevention**: Proactive production issue detection

**Data & Analytics**
- **Platform Analytics**: Cross-tenant metrics
- **Event Bus System**: Real-time event propagation
- **WebSocket Support**: Live updates to clients
- **Query Optimization**: ML-based query deduplication
- **Usage Reporting**: Cron-based usage analysis

### 4.3 Integration Points

**Third-Party Integrations:**
- **Stripe**: Payment processing and subscription billing
- **Resend**: Email delivery service
- **Shopify**: E-commerce integration for retail
- **AWS S3**: Cloud file storage
- **Azure Blob Storage**: Alternative cloud storage
- **Cloudflare R2**: R2 object storage
- **GitHub**: Code repository integration
- **OpenID Connect**: Replit Auth integration
- **OAuth2**: External identity providers

**Internal Integrations:**
- **DICOM Parser**: Medical imaging file support
- **PDF Generation**: Multi-format PDF creation (invoices, prescriptions, reports)
- **Redis Queue**: Background job processing
- **Event Webhooks**: Third-party event subscriptions
- **WebSocket**: Real-time client updates

---

## 5. API Architecture

### 5.1 Route Organization (50+ Endpoints Files)

**Core API Routes** (`/server/routes/`):
- `admin.ts` - User/company management, subscriptions
- `ecp.ts` - Eye Care Professional features (test rooms, GOC compliance, protocols)
- `pos.ts` - Point of sale transactions
- `inventory.ts` - Stock management
- `marketplace.ts` - Marketplace features and catalogs
- `analytics.ts` - BI and analytics
- `aiAssistant.ts` - AI chat interface
- `aiIntelligence.ts` - Intelligent features (forecasting, recommendations)
- `dynamicRoles.ts` - RBAC management
- `payments.ts` - Stripe integration
- `emails.ts` - Email management and tracking
- `demand-forecasting.ts` - ML demand predictions
- `returns.ts` - Return processing
- `quality-control.ts` - Quality assurance

**Clinical Routes** (`/server/routes/clinical/`):
- `oma-validation.ts` - OMA file validation
- `workflow.ts` - Clinical workflows

**Authentication:**
- Local email/password authentication
- OpenID Connect via Replit Auth
- Passport.js integration
- Session-based with Redis storage

### 5.2 API Conventions

- **Authentication**: Bearer tokens + session cookies
- **Rate Limiting**: Global (100 req/15min), Auth (5 attempts/15min)
- **Validation**: Zod schemas on all inputs
- **Error Handling**: Consistent error response format
- **CORS**: Configured for development and production
- **Security**: Helmet.js, CSRF protection, secure headers

### 5.3 Key API Features

- **Multi-tenant**: Company-scoped data access
- **Permission-based**: Endpoints check user permissions
- **Audit logging**: All actions logged
- **Webhook support**: Event subscriptions and delivery
- **Soft deletes**: Preserve data for compliance
- **Event streaming**: Real-time updates via WebSocket

---

## 6. Testing Infrastructure

### 6.1 Test Types

**Unit Tests**
- `test/unit/` - Service and utility tests
- Framework: Jest with ts-jest
- Coverage target: 80%+

**Integration Tests**
- `test/integration/` - API endpoint tests
- Database: Test database with migrations
- Framework: Supertest + Jest

**Component Tests**
- `test/components/` - React component tests
- Framework: Vitest + React Testing Library
- Accessibility testing: axe-core

**E2E Tests**
- `test/e2e/` - User workflow tests
- Framework: Playwright
- Multiple browser support (Chromium, Firefox, WebKit)

### 6.2 Test Configuration

- **Jest Config** (`jest.config.mjs`): Unit/integration tests
- **Vitest Config** (`vitest.config.ts`): Component tests
- **Playwright Config** (`playwright.config.ts`): E2E tests
- **Test Setup** (`test/setup.ts`, `test/setup.vitest.ts`): Shared configuration

### 6.3 Test Coverage

- 196+ test files in recent execution
- Comprehensive API testing scripts
- Advanced feature test suites
- Data integrity verification
- Production readiness checks

---

## 7. Deployment & Infrastructure

### 7.1 Current Deployment

- **Development**: Replit (cloud IDE)
- **Database**: Neon (serverless PostgreSQL)
- **Storage**: Local filesystem (dev), S3/Azure/Cloudflare (prod)
- **Session Store**: Redis (optional, with fallback)
- **Job Queue**: Redis with BullMQ

### 7.2 Production Architecture (Target)

**Infrastructure-as-Code:**
- **Terraform** (`infrastructure/terraform/main.tf`) - AWS infrastructure
- **Kubernetes** (`infrastructure/k8s/deployment.yaml`) - Container orchestration
- **Helm** (`infrastructure/helm/values-prod.yaml`) - Kubernetes package management

**Planned AWS Services:**
- **EKS**: Managed Kubernetes cluster
- **RDS**: PostgreSQL database
- **ElastiCache**: Redis for queues/sessions
- **S3**: File storage
- **ELB/ALB**: Load balancing
- **CloudFront**: CDN
- **IAM**: Identity and access management

### 7.3 Build & Release

**Build Process:**
```bash
npm run build
# Output: dist/public (frontend) + dist/index.js (backend)
```

**Development:**
```bash
npm run dev           # Full stack
npm run dev:bash      # via bash script
npm run dev:python    # Python service
```

**Production:**
```bash
npm run build
npm start             # NODE_ENV=production
```

---

## 8. Documentation Structure

### 8.1 Internal Documentation (160+ files)

**Architecture Docs:**
- `docs/architecture.md` - System architecture and philosophy
- `IMPLEMENTATION_GUIDE.md` - Phase-by-phase implementation roadmap
- `DYNAMIC_RBAC_ARCHITECTURE.txt` - RBAC system design (27KB)
- `DISPENSER_ROLE_ARCHITECTURE.md` - Dispenser workflow (35KB)
- `EYE_EXAM_10_TAB_IMPLEMENTATION.md` - Exam form architecture

**Feature Documentation:**
- `LAB_WORK_TICKET_VISUAL_ARCHITECTURE.md` - Manufacturing tickets
- `EXAMINATION_FORM_VISUAL_ARCHITECTURE.md` - Clinical forms
- `AI_SYSTEM_ARCHITECTURE.md` - AI/ML capabilities
- `MARKETPLACE_TESTING_GUIDE.md` - Marketplace features

**Deployment & Operations:**
- `KUBERNETES_DEPLOYMENT_GUIDE.md` - K8s deployment
- `PRODUCTION_READINESS_REPORT.md` - Go-live checklist
- `docs/compliance.md` - Regulatory requirements
- `docs/testing.md` - Testing strategies

**Quick References:**
- `QUICK_REFERENCE.md` - Common tasks
- `API_QUICK_REFERENCE.md` - API endpoints
- `DYNAMIC_RBAC_CHEAT_SHEET.md` - RBAC quick reference
- `README.md` - Project overview

### 8.2 README & Contributing

- **README.md**: Project overview, tech stack, getting started
- **CONTRIBUTING.md**: Contribution guidelines
- **SECURITY.md**: Security best practices
- **LICENSE**: MIT license

---

## 9. Development Workflow

### 9.1 Environment Setup

**Environment Variables** (`.env.example`):
```
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=production
SESSION_SECRET=...
ADMIN_SETUP_KEY=...
REDIS_HOST=localhost
REDIS_PORT=6379
STORAGE_PROVIDER=local|s3|cloudflare-r2|azure-blob
AWS_S3_BUCKET=ils-files
```

**Optional Configurations:**
- `.env.queues.example` - Job queue settings
- `.env.scalability.example` - Performance tuning
- `.env.storage.example` - Storage provider setup

### 9.2 Development Commands

```bash
# Installation
npm install                    # Install dependencies
npm run db:push               # Database migrations

# Development
npm run dev                   # Full stack dev server
npm run dev:bash              # Via bash script
npm run check                 # TypeScript compilation check

# Testing
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests
npm run test:components       # Component tests
npm run test:e2e              # End-to-end tests
npm run test:all              # Comprehensive test suite

# Building
npm run build                 # Production build
npm run lint                  # Code linting

# Database
npm run db:push               # Apply migrations
npm run migrate-storage       # Storage migration
npm run migrate-storage:verify # Verify migration
```

### 9.3 Code Organization & Standards

- **TypeScript**: Strict mode enabled throughout
- **Path Aliases**: `@` (client), `@shared` (shared), `@assets` (assets)
- **Module System**: ES modules (import/export)
- **Code Splitting**: Lazy-loaded routes with React.lazy()
- **Error Handling**: Comprehensive error boundaries and middleware
- **Logging**: Structured logging with logger utility

---

## 10. Key Statistics & Metrics

**Codebase Size:**
- `server/index.ts`: 302 lines (entry point)
- `client/src/App.tsx`: 639 lines (main router)
- `shared/schema.ts`: 3,467 lines (database definitions)
- Total: 4,408 lines in core files alone

**Scale:**
- 140+ database tables
- 50+ API route files
- 60+ service classes
- 50+ page components
- 86+ base UI components
- 200+ total UI components
- 7+ default roles
- 140+ permissions

**Services Count:**
- AI/ML Services: 12+
- Business Logic: 48+
- Integration: 10+
- Utility: 5+

**Documentation:**
- 160+ markdown/text documentation files
- Comprehensive architecture diagrams
- Quick reference guides
- Implementation checklists

---

## 11. Notable Technologies & Patterns

### 11.1 Advanced Patterns

- **Multi-tenant Architecture**: Company-scoped data isolation
- **Dynamic RBAC**: Database-driven permission system
- **Event-Driven**: Event bus for inter-service communication
- **Job Queue**: Redis-backed background processing
- **RAG (Retrieval-Augmented Generation)**: AI knowledge system
- **Soft Deletes**: Preserve data for compliance
- **Audit Logging**: Complete action history
- **Feature Flags**: Progressive feature rollout

### 11.2 Performance Optimizations

- **Code Splitting**: Route-level chunking with Vite
- **Query Caching**: TanStack Query with deduplication
- **Permission Caching**: In-session cache for RBAC
- **Lazy Loading**: Images, components, routes
- **Database Indexing**: Strategic indices in schema
- **Connection Pooling**: Redis + PostgreSQL optimization

### 11.3 Security Features

- **Authentication**: Multi-method (local, OpenID Connect)
- **Authorization**: Permission-based (RBAC + subscription gating)
- **Rate Limiting**: DDoS protection
- **CSRF Protection**: CSRF tokens
- **Helmet.js**: Security headers (HSTS, CSP, etc.)
- **Session Security**: Secure cookie settings
- **Audit Trail**: Compliance logging
- **Data Encryption**: SSL/TLS transport

---

## 12. Healthcare/NHS-Specific Features

### 12.1 Clinical Features

- **Comprehensive Eye Examination**
  - Visual acuity recording
  - Refraction (sphere, cylinder, axis)
  - Intraocular pressure (tonometry)
  - Anterior segment (slit lamp)
  - Posterior segment (ophthalmoscopy)
  - Patient history collection

- **GOC Compliance** 
  - General Optical Council requirements
  - Compliance check tracking
  - Regulatory audit logs

- **NHS Integration**
  - Sight test form support
  - NHS vs. Private appointment tracking
  - NHS-specific workflows

- **Prescription Management**
  - OD/OS (right/left eye) tracking
  - Contact lens prescriptions
  - Prescription alerts and recalls
  - Historical comparison

- **Dispensing Workflow**
  - Patient → Optometrist → Dispenser handoff
  - Diagnosis-driven recommendations
  - Frame/lens pairing validation
  - Dispense slip generation

### 12.2 Clinical Data

- **DICOM Support**: Medical imaging (OCT, visual fields, etc.)
- **OMA Files**: Optical manufacturing format for frame data
- **Test Rooms**: Exam room management with booking
- **Equipment**: Calibration and maintenance tracking
- **Clinical Protocols**: Evidence-based workflow templates

### 12.3 Patient Privacy & Security

- **Emergency Contacts**: Critical patient information
- **Consent Management**: Patient consent tracking
- **Data Privacy**: Company-scoped isolation
- **Audit Trails**: All access logged
- **Soft Deletes**: Data preserved for compliance

---

## 13. Current Status & Known Issues

### 13.1 Completed Work

✅ **Implemented & Tested:**
- Core order management system
- Multi-role RBAC with 140+ permissions
- Eye examination comprehensive forms
- AI chat assistant with RAG
- Demand forecasting (ML)
- Business intelligence dashboards
- Email tracking system
- POS system
- Marketplace integration
- Dispenser role with patient handoff
- Quality control & returns management
- Audit logging
- OMA file support
- Kubernetes deployment configuration
- Comprehensive test suite (196+ tests)

### 13.2 Architecture Evolution

- **Current**: Monolithic Express + React
- **Target**: Microservices on AWS EKS
- **LIMS Integration**: Planned for Phase 0-1
- **Principal Engineer**: Hiring for governance

### 13.3 Recent Commits

- feat: Implement world-class Dispenser role with dynamic RBAC and patient handoff
- docs: Comprehensive Dynamic RBAC deployment documentation
- fix: Resolve IPv6 keyGenerator validation error
- feat: Mount Dynamic RBAC API routes
- fix: Resolve 20 TypeScript compilation errors

---

## 14. Integration & Extensibility

### 14.1 Webhook System

- Incoming webhooks (third-party → system)
- Outgoing webhooks (system → third-party)
- Webhook subscriptions by event type
- Delivery tracking and retry logic

### 14.2 API Extensibility

- Public API service for partners
- Query optimizer for performance
- Data aggregation service
- Custom metric collection

### 14.3 ML/AI Extensibility

- Model versioning system
- Training job management
- Deployment queue system
- Custom model training pipelines

---

## 15. Summary: Key Takeaways

### What This System Does

The **Integrated Lens System** is a comprehensive, enterprise-grade optical healthcare platform that:

1. **Manages Clinical Workflows**: From patient examination to prescription generation
2. **Handles Manufacturing**: Order tracking, quality control, equipment management
3. **Enables Retail Operations**: POS system, inventory management, supplier coordination
4. **Provides Intelligence**: BI dashboards, demand forecasting, anomaly detection
5. **Ensures Compliance**: NHS regulations, GOC standards, audit trails
6. **Scales Operations**: Multi-tenant architecture supporting hundreds of practices

### Why It's Complex

- **Healthcare Domain**: Requires compliance with UK medical standards
- **Multi-Role**: 7+ roles with fine-grained 140+ permissions
- **Manufacturing Focus**: Lab workflow optimization with quality checks
- **AI-Powered**: ML models for forecasting and anomaly detection
- **Enterprise Features**: Multi-tenancy, audit logging, event streaming
- **Production Ready**: Kubernetes deployment, comprehensive testing

### Development Maturity

- **Codebase Size**: 4,400+ core lines, 60+ services
- **Test Coverage**: Unit, integration, component, E2E
- **Documentation**: 160+ documentation files
- **Code Quality**: TypeScript strict, ESLint, error handling
- **Infrastructure**: Terraform, Kubernetes, Helm ready
- **Scalability**: Built for 1000+ concurrent users

---

## File Locations Reference

- **Main Server**: `/home/user/ILS2.0/server/index.ts`
- **Main Client**: `/home/user/ILS2.0/client/src/App.tsx`
- **Database Schema**: `/home/user/ILS2.0/shared/schema.ts`
- **Services**: `/home/user/ILS2.0/server/services/` (60+ files)
- **Routes**: `/home/user/ILS2.0/server/routes/` (50+ files)
- **Components**: `/home/user/ILS2.0/client/src/components/` (200+)
- **Pages**: `/home/user/ILS2.0/client/src/pages/` (50+)
- **Tests**: `/home/user/ILS2.0/test/`
- **Infrastructure**: `/home/user/ILS2.0/infrastructure/`
- **Documentation**: `/home/user/ILS2.0/docs/` + root MD files

