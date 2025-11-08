# ILS 2.0 - Integrated Laboratory System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-450%2B-brightgreen)](./docs/TESTING.md)

> Comprehensive SaaS platform for the UK optical industry, providing AI-powered assistance, prescription management, NHS compliance, and complete business intelligence.

## 🌟 Features

### Core Functionality
- 👁️ **Clinical Eye Examination Management** - Complete eye exam workflow with NHS compliance
- 📋 **Prescription & Order Management** - Digital prescription tracking and order processing
- 🤖 **AI-Powered Assistance** - GPT-4 and Claude integration for intelligent support
- 🛍️ **Shopify Integration** - Seamless e-commerce order synchronization
- 📊 **Business Intelligence** - Real-time analytics and insights
- 🏥 **NHS Compliance** - Vouchers, exemptions, GOC registration
- 📄 **Professional PDF Generation** - Invoices, prescriptions, lab tickets
- 🔐 **Multi-Tenant SaaS** - Complete data isolation per company

### Advanced Features
- 🎯 **Smart Lens Recommendations** - AI-powered Good/Better/Best tier suggestions
- 📱 **Face Analysis** - GPT-4 Vision for frame fitting recommendations
- 🔍 **OMA File Processing** - Frame tracing and visualization
- 📈 **Demand Forecasting** - ML-powered inventory predictions
- 🎨 **Smart Frame Finder** - AI-assisted frame selection
- 💳 **Payment Processing** - Integrated billing and subscriptions
- 📧 **Email Automation** - Templates, tracking, and campaigns
- ⚡ **Real-time Updates** - Live order status and notifications
- 📊 **Performance Monitoring** - Real-time API and database performance tracking

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.x
- **PostgreSQL** >= 15.x
- **npm** or **pnpm**
- **Python** 3.11+ (for ML services, optional)
- **Redis** (optional, for caching and sessions)

### Installation

```bash
# Clone the repository
git clone https://github.com/newvantageco/ILS2.0.git
cd ILS2.0

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up the database
npm run db:push

# Start development server
npm run dev
```

### First Run

1. **Access the application**: http://localhost:5000
2. **Default credentials** (dev only):
   - Email: `admin@ils.com`
   - Password: `admin_password`
3. **API Documentation**: http://localhost:5000/api-docs

---

## 📁 Project Structure

```
ILS2.0/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities and helpers
├── server/                  # Express backend
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── middleware/          # Express middleware
│   ├── workers/             # Background jobs
│   └── db.ts                # Database connection
├── test/                    # Test suites
│   ├── components/          # Component tests (Vitest)
│   ├── e2e/                 # End-to-end tests (Playwright)
│   ├── integration/         # API integration tests
│   └── services/            # Service unit tests
├── shared/                  # Shared code (types, schemas)
├── docs/                    # Documentation
├── python-service/          # Python ML/RAG service
└── uploads/                 # File uploads
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **TanStack Query** | Data fetching & caching |
| **Wouter** | Routing |
| **shadcn/ui** | UI component library |
| **Tailwind CSS** | Styling |
| **Recharts** | Data visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 20** | Runtime |
| **Express.js** | Web framework |
| **TypeScript** | Type safety |
| **Drizzle ORM** | Database ORM |
| **PostgreSQL** | Primary database |
| **Passport.js** | Authentication |
| **Zod** | Schema validation |

### AI/ML
| Service | Purpose |
|---------|---------|
| **OpenAI GPT-4** | General AI intelligence |
| **GPT-4 Vision** | Image analysis |
| **Anthropic Claude** | Alternative AI provider |
| **Python RAG Service** | Knowledge base & embeddings |

### Testing
| Tool | Purpose |
|------|---------|
| **Vitest** | Component & unit testing |
| **Playwright** | E2E browser testing |
| **Jest** | Backend testing |
| **React Testing Library** | Component testing utilities |

### DevOps
| Tool | Purpose |
|------|---------|
| **GitHub Actions** | CI/CD |
| **Docker** | Containerization |
| **Redis** | Caching & sessions |

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server (frontend + backend)
npm run build            # Build for production
npm run preview          # Preview production build

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)
npm run db:migrate       # Run database migrations

# Testing
npm test                 # Run all tests
npm run test:components  # Run component tests (Vitest)
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:integration # Run API integration tests

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler check
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ils2"

# Session
SESSION_SECRET="your-secret-key-here"

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Shopify (optional)
SHOPIFY_API_KEY="..."
SHOPIFY_API_SECRET="..."

# Email (optional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Payment (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Python Service (optional)
PYTHON_SERVICE_URL="http://localhost:8000"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Development Guide](./docs/DEVELOPMENT.md) | Local development and debugging |
| [Testing Guide](./docs/TESTING.md) | Comprehensive testing documentation |
| [Architecture](./docs/ARCHITECTURE.md) | System architecture and design |
| [API Documentation](http://localhost:5000/api-docs) | Interactive Swagger/OpenAPI docs |

---

## 🧪 Testing

ILS 2.0 has comprehensive test coverage with **450+ tests**:

```bash
# Run all tests
npm test

# Component tests (72 tests)
npm run test:components

# E2E tests (65 tests × 5 browsers = 325 executions)
npm run test:e2e

# Integration tests (200+ tests)
npm run test:integration

# Service tests (100+ tests)
npm run test:services
```

### Test Coverage

- **Component Tests**: 72 tests (StatCard, StatusBadge, SearchBar, etc.)
- **E2E Tests**: 65 tests across 5 browsers (Chromium, Firefox, WebKit, Mobile)
- **API Integration Tests**: 200+ tests (Patients, Orders, Analytics)
- **Service Tests**: 100+ tests (EmailService, OrderService, AI services)

See [Testing Guide](./docs/TESTING.md) for detailed information.

---

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────┐
│  React App  │ ─────────────┐
└─────────────┘              │
                             ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Shopify   │ ───▶ │  Express API │ ───▶ │ PostgreSQL  │
└─────────────┘      └──────────────┘      └─────────────┘
                             │
                             ├───▶ OpenAI GPT-4
                             ├───▶ Anthropic Claude
                             └───▶ Python RAG Service
```

### Key Concepts

**Multi-Tenancy**: Complete data isolation per company using `companyId` filtering

**Role-Based Access**: 7+ role types with granular permissions
- Platform Admin, Company Admin, ECP, Optometrist, Lab Tech, Customer Service, Accountant

**AI Integration**: Hybrid intelligence combining:
- Python RAG service for knowledge base
- GPT-4 for general intelligence
- Claude for alternative AI provider
- GPT-4 Vision for image analysis

See [Architecture Guide](./docs/ARCHITECTURE.md) for detailed information.

---

## 🔐 Security

### Security Features

- ✅ **HTTPS Enforcement** - TLS 1.3 required in production
- ✅ **Helmet.js** - Secure HTTP headers (CSP, HSTS, X-Frame-Options)
- ✅ **Rate Limiting** - DDoS protection on all endpoints
- ✅ **CORS Protection** - Configurable cross-origin policies
- ✅ **SQL Injection Prevention** - Parameterized queries with Drizzle ORM
- ✅ **XSS Protection** - Content Security Policy and input sanitization
- ✅ **CSRF Protection** - Token-based validation
- ✅ **Session Security** - Secure, httpOnly, sameSite cookies
- ✅ **Password Policy** - 12+ characters, complexity requirements
- ✅ **Audit Logging** - Complete request/response logging
- ✅ **Data Encryption** - Sensitive data encrypted at rest

### Rate Limiting

```typescript
// Global API rate limit
100 requests per 15 minutes per IP

// Authentication endpoints
5 attempts per 15 minutes per IP

// AI endpoints
20 requests per hour per IP

// File uploads
10 uploads per hour per IP
```

---

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Start production server
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure `SESSION_SECRET`
4. Enable HTTPS
5. Configure email provider
6. Set up AI API keys
7. Configure Redis for sessions (recommended)

### Health Check & Monitoring

```bash
# Check application health
curl http://localhost:5000/api/monitoring/health

Response:
{
  "status": "healthy",
  "timestamp": "2024-11-08T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "heapUsed": "45.2 MB",
    "heapTotal": "67.8 MB"
  }
}

# Get performance metrics (admin only)
curl http://localhost:5000/api/monitoring/metrics

# Prometheus metrics for monitoring systems
curl http://localhost:5000/api/monitoring/prometheus
```

See [Development Guide - Performance Monitoring](./docs/DEVELOPMENT.md#performance-monitoring) for detailed monitoring documentation.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Write tests** for new functionality
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Code Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting (if configured)
- **Tests required** for new features
- **Documentation** for public APIs

---

## 📊 API Endpoints

### Core Endpoints

```
Authentication
POST   /api/auth/login          # User login
POST   /api/auth/signup         # User registration
GET    /api/auth/logout         # User logout

Patients
GET    /api/patients            # List patients
POST   /api/patients            # Create patient
GET    /api/patients/:id        # Get patient
PATCH  /api/patients/:id        # Update patient
DELETE /api/patients/:id        # Delete patient

Orders
GET    /api/orders              # List orders
POST   /api/orders              # Create order
GET    /api/orders/:id          # Get order
PATCH  /api/orders/:id/status   # Update status
DELETE /api/orders/:id          # Cancel order

AI Services
POST   /api/master-ai/chat      # Chat with Master AI
POST   /api/ophthalmic-ai/lens-recommendations
POST   /api/ophthalmic-ai/frame-analysis

Analytics
GET    /api/analytics/overview  # Dashboard metrics
GET    /api/analytics/orders    # Order analytics
GET    /api/analytics/revenue   # Revenue tracking

Monitoring
GET    /api/monitoring/health   # System health check
GET    /api/monitoring/metrics  # Performance metrics (admin)
GET    /api/monitoring/metrics/recent  # Recent metrics
GET    /api/monitoring/prometheus      # Prometheus format
```

### Full API Documentation

Visit http://localhost:5000/api-docs for interactive Swagger documentation.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/newvantageco/ILS2.0/issues)
- **Email**: support@ils.com

---

## 🎯 Roadmap

### Completed ✅
- Core prescription and order management
- AI integration (GPT-4, Claude)
- Shopify integration
- NHS compliance
- Business intelligence dashboards
- Comprehensive testing (450+ tests)
- Complete documentation

### In Progress 🚧
- Mobile application (React Native)
- Advanced ML predictions
- Real-time collaboration
- Enhanced reporting

### Planned 📋
- Microservices architecture
- Event-driven system
- Advanced analytics
- International expansion

---

## 🏆 Acknowledgments

- OpenAI for GPT-4 and GPT-4 Vision
- Anthropic for Claude
- The React and Node.js communities
- All contributors and testers

---

**Made with ❤️ for the optical industry**

**Version**: 2.0.0
**Last Updated**: November 2024
