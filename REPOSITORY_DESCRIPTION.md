# ILS 2.0 - Repository Description

## Short Description (280 characters max for GitHub)
Enterprise optical lab management platform with multi-role workflows, AI-ready architecture, real-time order tracking, OMA file support, POS system, prescription management, and comprehensive BI analytics. Built with React, TypeScript, Express, PostgreSQL.

## Full Description

### 🏢 Integrated Lens System 2.0
**Enterprise-Grade Optical Laboratory Management Platform**

A comprehensive web application designed for optical labs, eye care professionals, and lens suppliers to streamline the entire lens order lifecycle—from patient prescription to lab production and delivery.

---

## ✨ Core Features

### 👁️ **Eye Care Professional (ECP) Portal**
- **Point of Sale System**: Full-featured POS with floating modal design, customer selection, frame/lens dispensing, prescription entry, and payment processing
- **Patient Management**: Complete CRUD operations with auto-generated customer numbers (PAT-XXXXXXXX format)
- **Prescription Tracking**: Digital prescription entry with OD/OS measurements, PD, add values
- **Test Room Management**: Schedule and conduct eye examinations
- **Order Creation**: Multi-step wizard with validation (Patient → Prescription → Lens/Frame → Review)
- **Inventory Management**: Track frames, lenses, and optical products
- **Invoice Generation**: Automated billing with PDF export

### 🔬 **Lab Production Portal**
- **Production Queue**: Real-time order tracking with drag-and-drop status updates
- **Quality Control**: Multi-stage QC checkpoints with pass/fail criteria
- **Engineering Dashboard**: Technical specifications and production parameters
- **Consult Logging**: Document technical decisions and modifications
- **Technical Library**: Centralized documentation and standard operating procedures

### 📦 **Supplier Management**
- **Supplier Portal**: Dedicated interface for material suppliers
- **Purchase Orders**: Automated PO generation with line item details
- **Contact Management**: Supplier details, account numbers, payment terms
- **Material Tracking**: Monitor stock levels and reorder points

### 🔐 **Multi-Role Authentication**
- **6 Role Types**: Platform Admin, Company Admin, ECP, Lab Tech, Engineer, Supplier
- **Account Approval Workflow**: Admin-controlled user activation
- **Role-Based Access Control**: Granular permissions per feature
- **Session Management**: Secure passport.js authentication
- **Master Admin Access**: Platform admins can test all role functionalities

### 📊 **Business Intelligence & Analytics**
- **Real-Time Dashboards**: Order metrics, revenue tracking, production KPIs
- **Analytics Portal**: Custom reports and data visualizations
- **BI Recommendations**: API-ready for AI-powered insights
- **Prescription Alerts**: Pattern detection and validation warnings
- **Forecasting**: Historical data analysis and trend predictions

### 📋 **Advanced Order Features**
- **OMA File Support**: Upload, parse, and visualize OMA files with frame tracing
- **Customer Reference Tracking**: Link orders to customer PO numbers
- **Status Workflow**: Pending → In Production → Quality Check → Completed → Shipped
- **PDF Generation**: Automated order confirmations and invoices
- **Email Notifications**: Transactional emails via Resend API

### 🎨 **Modern UI/UX**
- **Floating Modal Design**: Premium POS interface with React Portals
- **Command Palette**: Quick navigation with Cmd+K (⌘K)
- **Dark Mode**: System-aware theme switching
- **Responsive Design**: Mobile, tablet, and desktop optimized
- **Progressive Web App (PWA)**: Installable with offline capabilities
- **Accessibility**: WCAG compliant with keyboard navigation

---

## 🛠️ Technical Architecture

### **Frontend Stack**
- **React 18.3.1** with TypeScript 5.6.3
- **Vite** for lightning-fast dev experience and HMR
- **TanStack Query (React Query)** for server state management
- **Wouter** for lightweight client-side routing
- **shadcn/ui + Radix UI** for accessible component primitives
- **Tailwind CSS 3.4.18** for utility-first styling
- **Lucide React** for 1000+ icon library
- **Zod** for runtime type validation and form schemas

### **Backend Stack**
- **Node.js 20+** with Express 4.21.2
- **TypeScript** with ES Modules
- **PostgreSQL** (Neon serverless) for production-grade database
- **Drizzle ORM** for type-safe SQL queries
- **Passport.js** for authentication strategies
- **bcrypt** for password hashing (10 rounds)
- **PDFKit** for dynamic PDF generation
- **Resend** for transactional email delivery

### **DevOps & Infrastructure**
- **Git** version control with GitHub
- **ESLint** for code quality
- **TypeScript Strict Mode** for type safety
- **Environment Variables** for configuration management
- **Session-based Auth** with secure cookies
- **CORS** configured for cross-origin requests

---

## 🗄️ Database Schema

### **Key Tables**
- `users`: Multi-role user accounts with approval workflow
- `patients`: Customer demographics and contact information
- `orders`: Complete order lifecycle tracking
- `prescriptions`: Optical prescription data (OD/OS)
- `products`: Inventory items (frames, lenses, accessories)
- `suppliers`: Vendor management and PO tracking
- `pos_transactions`: Point of sale sales records
- `technical_documents`: Lab documentation library
- `consult_logs`: Engineering notes and decisions

### **AI-Ready Tables** (Backend services complete, API integration pending)
- `ai_sessions`: Conversation history and context
- `ai_insights`: Generated recommendations
- `bi_recommendations`: Business intelligence alerts
- `prescription_alerts`: Anomaly detection results

---

## 🚀 Completed Phases

### ✅ Phase 1-6: Core Platform (100%)
- Order management system with multi-step creation
- Patient and prescription tracking
- Lab dashboard with production workflow
- Supplier management and purchase orders
- User management with role-based access
- OMA file upload and parsing

### ✅ Phase 7: Point of Sale (100%)
- Full POS interface with floating modal design
- Customer selection and search
- Product/frame selection with color variants
- Lens customization (type, material, coatings)
- Prescription integration
- Transaction processing and payment
- React Portal rendering for full-screen overlay

### ✅ Phase 8: Advanced Features (85%)
- Business intelligence dashboard
- Analytics portal with custom reports
- Multi-tenant architecture (backend complete)
- Enhanced UI/UX with command palette
- PWA support and offline capabilities

### ⚠️ Phase 9: AI Integration (Frontend: 100%, Backend: 90%, API: 10%)
- AI assistant pages built
- Neural network services written (~2,500 lines)
- Database schema complete
- **Pending**: API endpoint exposure (in progress)

---

## 📈 Platform Statistics

- **Code Base**: ~50,000+ lines of TypeScript
- **API Endpoints**: 80+ RESTful routes
- **UI Components**: 100+ React components
- **Database Tables**: 25+ relational tables
- **Role Types**: 6 distinct user roles
- **Order Statuses**: 6 workflow stages
- **Documentation**: 50+ markdown files

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18.0.0 or higher
- PostgreSQL 14+ (or Neon serverless)
- npm or yarn package manager

### Quick Start
```bash
# Clone repository
git clone https://github.com/newvantageco/ILS2.0.git
cd ILS2.0

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, SESSION_SECRET, etc.

# Run database migrations
npm run db:push

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

### Environment Variables
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=your-secure-random-string
ADMIN_SETUP_KEY=admin-registration-key
RESEND_API_KEY=re_xxxxxxxxx (optional, for emails)
```

---

## 👥 User Roles & Access

| Role | Dashboard | Orders | Patients | Lab | Suppliers | Admin |
|------|-----------|--------|----------|-----|-----------|-------|
| **Platform Admin** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All | ✅ Full |
| **Company Admin** | ✅ Company | ✅ Company | ✅ Company | ✅ View | ✅ Manage | ✅ Users |
| **ECP** | ✅ ECP | ✅ Create/View | ✅ Full | ❌ | ❌ | ❌ |
| **Lab Tech** | ✅ Lab | ✅ View | ✅ View | ✅ Production | ❌ | ❌ |
| **Engineer** | ✅ Lab | ✅ View | ✅ View | ✅ QC/Consult | ❌ | ❌ |
| **Supplier** | ✅ Supplier | ✅ Assigned | ❌ | ❌ | ✅ View | ❌ |

---

## 🎯 Roadmap

### Q4 2025
- [ ] Complete AI Assistant API integration
- [ ] Real-time WebSocket notifications
- [ ] Mobile native apps (React Native)
- [ ] Advanced reporting with chart exports
- [ ] Batch order processing

### Q1 2026
- [ ] Equipment management and maintenance tracking
- [ ] Time tracking and labor cost analysis
- [ ] Barcode/QR code scanning for inventory
- [ ] Advanced ML forecasting and demand prediction
- [ ] Multi-language support (i18n)

---

## 📝 License

Proprietary - New Vantage Co.  
Copyright © 2025 All rights reserved.

---

## 🤝 Contributing

This is a private enterprise project. For feature requests or bug reports, please contact the development team at saban@newvantageco.com.

---

## 📞 Support

- **Email**: saban@newvantageco.com
- **Documentation**: See `/docs` folder
- **Status**: Active development
- **Version**: 2.0.0

---

**Built with ❤️ by New Vantage Co.**
