# ILS 2.0 - Feature Access Matrix by User Role

**Last Updated:** December 1, 2025
**Document Version:** 1.0

---

## Overview

This document defines which features are accessible to each user role in the Integrated Lens System (ILS 2.0). The system implements role-based access control (RBAC) with company-level multi-tenant isolation.

---

## User Roles

### Platform Level
- **Platform Admin** - Master system administrator with access to all companies

### Company Level (Tenant Admins)
- **Company Admin** - Company owner/administrator with full company access
- **Admin** (Legacy) - Mapped to Company Admin for backward compatibility

### Clinical Staff
- **ECP** (Eye Care Professional) - Optometrists and ophthalmologists
- **Dispenser** - Optical dispensers and customer service staff

### Operational Staff
- **Lab Technician** - Lens production and quality control
- **Engineer** - Equipment management and technical support
- **Store Manager** - Branch/store operations manager

### Supply Chain
- **Supplier** - Supplier portal user (limited access)

---

## Feature Access Matrix

Legend:
- ✅ Full Access
- 👁️ View Only
- 🔒 No Access
- 📊 Limited/Filtered Access
- 💰 Subscription Required

### 1. DASHBOARD & ANALYTICS

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **Platform Dashboard** | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Company Dashboard** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Production Dashboard** | ✅ (All) | ✅ | 👁️ | ✅ | 👁️ | 🔒 | 👁️ | 🔒 |
| **Equipment Dashboard** | ✅ (All) | 👁️ | 🔒 | 👁️ | ✅ | 🔒 | 🔒 | 🔒 |
| **Supplier Dashboard** | ✅ (All) | 👁️ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| **Business Analytics** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 📊 |
| **Financial Reports** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 👁️ | 📊 |
| **Quality Reports** | ✅ (All) | ✅ | 👁️ | ✅ | ✅ | 🔒 | 👁️ | 🔒 |

### 2. COMPANY MANAGEMENT

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Companies** | ✅ (All) | ✅ (Own) | 👁️ (Own) | 👁️ (Own) | 👁️ (Own) | 👁️ (Own) | 👁️ (Own) | 👁️ (Own) |
| **Create Company** | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Edit Company** | ✅ (All) | ✅ (Own) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Delete Company** | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Company Settings** | ✅ (All) | ✅ (Own) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Subscription Management** | ✅ (All) | ✅ (Own) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Billing & Invoices** | ✅ (All) | ✅ (Own) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |

### 3. USER MANAGEMENT

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Users** | ✅ (All) | ✅ (Company) | 👁️ (Company) | 👁️ (Company) | 👁️ (Company) | 👁️ (Company) | ✅ (Store) | 👁️ (Company) |
| **Create Users** | ✅ (Any Role) | ✅ (Company Roles) | 🔒 | 🔒 | 🔒 | 🔒 | ✅ (Store Staff) | 🔒 |
| **Edit Users** | ✅ (All) | ✅ (Company) | 🔒 | 🔒 | 🔒 | 🔒 | ✅ (Store) | 🔒 |
| **Delete Users** | ✅ (All) | ✅ (Company) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Assign Roles** | ✅ (Any) | ✅ (Company Roles) | 🔒 | 🔒 | 🔒 | 🔒 | ✅ (Store Roles) | 🔒 |
| **Manage Permissions** | ✅ (All) | ✅ (Company) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |

**Company Admin Can Create:**
- ECP, Lab Technician, Engineer, Supplier, Company Admin, Dispenser, Store Manager

**Company Admin CANNOT Create:**
- Platform Admin

### 4. PATIENT MANAGEMENT

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Patients** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Add Patient** | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Edit Patient** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Delete Patient** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Patient History** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | 👁️ | ✅ | 🔒 |
| **Patient 360 View** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | 👁️ | ✅ | 🔒 |
| **Export Patient Data** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | 🔒 | ✅ | 🔒 |

**Patient Data Isolation:** ✅ All patient data is isolated by `companyId`. One company CANNOT see another company's patients (except Platform Admin).

### 5. EYE EXAMINATIONS

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Examinations** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | 👁️ | ✅ | 🔒 |
| **Create Examination** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Edit Examination** | ✅ (All) | ✅ | ✅ (Own) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Finalize Examination** | ✅ (All) | ✅ | ✅ (Own) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Delete Examination** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Add Outside Rx** | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Generate PDF Form** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | 👁️ | ✅ | 🔒 |

**Examination Sections (for ECP):**
- ✅ General History
- ✅ Pre-Screening (AVMS, Focimetry, Phorias)
- ✅ Current Rx
- ✅ Supplementary Tests
- ✅ New Rx
- ✅ Retinoscopy
- ✅ Ophthalmoscopy
- ✅ Slit Lamp (EFRON/CLRU grading)
- ✅ Tonometry
- ✅ Additional Tests
- ✅ Summary & Diagnosis

### 6. PRESCRIPTIONS

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Prescriptions** | ✅ (All) | ✅ | ✅ | 👁️ | 🔒 | ✅ | ✅ | 🔒 |
| **Create Prescription** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Edit Prescription** | ✅ (All) | ✅ | ✅ (Own) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Delete Prescription** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Upload Prescription** | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |

### 7. APPOINTMENTS & SCHEDULING

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Calendar** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Book Appointment (Existing Patient)** | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Book Appointment (New Patient)** | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Reschedule Appointment** | ✅ (All) | ✅ | ✅ (Own) | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Cancel Appointment** | ✅ (All) | ✅ | ✅ (Own) | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Manage Waitlist** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |

**Appointment Types:**
- Eye Examination (30 min)
- Contact Lens Fitting (45 min)
- Frame Selection (30 min)
- Follow Up (15 min)
- Emergency (30 min)
- Consultation (20 min)
- Dispensing (20 min)
- Collection (15 min)

### 8. ORDER MANAGEMENT

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Orders** | ✅ (All) | ✅ | ✅ | ✅ | 👁️ | ✅ | ✅ | 📊 (Own) |
| **Create Order** | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Edit Order** | ✅ (All) | ✅ | ✅ (Own) | ✅ | 🔒 | ✅ (Own) | ✅ | 🔒 |
| **Cancel Order** | ✅ (All) | ✅ | ✅ (Own) | 🔒 | 🔒 | 🔒 | ✅ | 🔒 |
| **Update Status** | ✅ (All) | ✅ | ✅ (Own) | ✅ | 🔒 | 🔒 | ✅ | 🔒 |
| **Dispatch Order** | ✅ (All) | ✅ | 🔒 | ✅ | 🔒 | 🔒 | ✅ | 🔒 |
| **Order History** | ✅ (All) | ✅ | ✅ | ✅ | 👁️ | ✅ | ✅ | 📊 (Own) |

### 9. PRODUCTION & LABORATORY

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **Production Queue** | ✅ (All) | ✅ | 👁️ | ✅ | 🔒 | 🔒 | 👁️ | 🔒 |
| **Update Production Status** | ✅ (All) | ✅ | 🔒 | ✅ | 🔒 | 🔒 | 🔒 | 🔒 |
| **Quality Control** | ✅ (All) | ✅ | 👁️ | ✅ | ✅ | 🔒 | 👁️ | 🔒 |
| **Report Quality Issues** | ✅ (All) | ✅ | 👁️ | ✅ | ✅ | 🔒 | ✅ | 🔒 |
| **View QC Reports** | ✅ (All) | ✅ | 👁️ | ✅ | ✅ | 🔒 | 👁️ | 🔒 |
| **Production Analytics** | ✅ (All) | ✅ | 🔒 | ✅ | 👁️ | 🔒 | 👁️ | 🔒 |

### 10. EQUIPMENT MANAGEMENT

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Equipment** | ✅ (All) | ✅ | 👁️ | 👁️ | ✅ | 🔒 | 👁️ | 🔒 |
| **Add Equipment** | ✅ (All) | ✅ | 🔒 | 🔒 | ✅ | 🔒 | 🔒 | 🔒 |
| **Edit Equipment** | ✅ (All) | ✅ | 🔒 | 🔒 | ✅ | 🔒 | 🔒 | 🔒 |
| **Maintenance Logs** | ✅ (All) | ✅ | 🔒 | 👁️ | ✅ | 🔒 | 👁️ | 🔒 |
| **Schedule Maintenance** | ✅ (All) | ✅ | 🔒 | 🔒 | ✅ | 🔒 | 🔒 | 🔒 |
| **Calibration Records** | ✅ (All) | ✅ | 🔒 | 👁️ | ✅ | 🔒 | 🔒 | 🔒 |

### 11. INVENTORY MANAGEMENT

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Inventory** | ✅ (All) | ✅ | 👁️ | ✅ | ✅ | 👁️ | ✅ | 👁️ |
| **Add Items** | ✅ (All) | ✅ | 🔒 | ✅ | 🔒 | 🔒 | ✅ | 🔒 |
| **Edit Items** | ✅ (All) | ✅ | 🔒 | ✅ | ✅ | 🔒 | ✅ | 🔒 |
| **Stock Adjustments** | ✅ (All) | ✅ | 🔒 | ✅ | 🔒 | 🔒 | ✅ | 🔒 |
| **Stock Transfers** | ✅ (All) | ✅ | 🔒 | ✅ | 🔒 | 🔒 | ✅ | 🔒 |
| **Low Stock Alerts** | ✅ (All) | ✅ | 👁️ | ✅ | 👁️ | 👁️ | ✅ | 👁️ |
| **Inventory Reports** | ✅ (All) | ✅ | 👁️ | ✅ | 👁️ | 👁️ | ✅ | 📊 |

### 12. AI FEATURES

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **AI Chat** | ✅ Unlimited | 💰 Full | 💰 Basic | 🔒 | 🔒 | 💰 Basic | 💰 Basic | 🔒 |
| **Product Recommendations** | ✅ | 💰 | 💰 | 🔒 | 🔒 | 💰 | 💰 | 🔒 |
| **Business Intelligence** | ✅ | 💰 | 💰 | 🔒 | 🔒 | 🔒 | 💰 | 🔒 |
| **Upload Knowledge** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Manage AI Settings** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **View Learning Progress** | ✅ (All) | ✅ | 👁️ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |

**AI Access by Subscription Tier:**
- **Free:** No AI access
- **Basic:** Basic AI chat, limited queries/month
- **Professional:** Full AI features, higher limits
- **Enterprise:** Unlimited AI, custom knowledge base, dedicated support

### 13. REPORTING & ANALYTICS

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **Sales Reports** | ✅ (All) | ✅ | 👁️ | 🔒 | 🔒 | 👁️ | ✅ | 📊 (Own) |
| **Patient Analytics** | ✅ (All) | ✅ | ✅ | 🔒 | 🔒 | 👁️ | ✅ | 🔒 |
| **Production Reports** | ✅ (All) | ✅ | 👁️ | ✅ | 👁️ | 🔒 | 👁️ | 🔒 |
| **Quality Reports** | ✅ (All) | ✅ | 👁️ | ✅ | ✅ | 🔒 | 👁️ | 🔒 |
| **Financial Reports** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 👁️ | 🔒 |
| **Inventory Reports** | ✅ (All) | ✅ | 👁️ | ✅ | 👁️ | 👁️ | ✅ | 📊 |
| **Staff Performance** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | ✅ (Store) | 🔒 |
| **Export Reports** | ✅ (All) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 📊 |

### 14. SYSTEM ADMINISTRATION

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **System Logs** | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Audit Logs** | ✅ (All) | ✅ (Company) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **System Settings** | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Feature Flags** | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Platform Analytics** | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Database Management** | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |

### 15. SUPPLIER PORTAL

| Feature | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Dispenser | Store Manager | Supplier |
|---------|---------------|---------------|-----|----------|----------|-----------|---------------|----------|
| **View Catalog** | ✅ (All) | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ |
| **Manage Catalog** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✅ (Own) |
| **View Orders** | ✅ (All) | ✅ | 👁️ | 👁️ | 🔒 | 👁️ | ✅ | ✅ (Own) |
| **Update Order Status** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✅ (Own) |
| **Supplier Reports** | ✅ (All) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✅ (Own) |

---

## Multi-Tenant Data Isolation

### Company-Level Isolation

**All data is isolated by `companyId`:**

✅ **Isolated Resources:**
- Patients
- Examinations
- Prescriptions
- Appointments
- Orders
- Inventory
- Equipment
- Users (except Platform Admin)
- AI Knowledge Base
- AI Learning Data
- AI Conversations

**Platform Admin Exception:**
- Platform Admins can access ALL companies' data (by design)
- This is intentional for system administration purposes

**Cross-Tenant Protection:**
- Database Row-Level Security (RLS)
- Application middleware filtering
- Tenant context session variables
- Foreign key constraints with CASCADE DELETE

**Result:**
- ❌ Company A **CANNOT** see Company B's patients
- ❌ Company A **CANNOT** see Company B's orders
- ❌ Company A **CANNOT** see Company B's examinations
- ✅ Platform Admin **CAN** see all companies (admin function)

---

## Subscription-Based Feature Access

### Free Tier
- ✅ Basic patient management
- ✅ Basic appointments
- ✅ Basic examinations
- ❌ No AI features
- ❌ No advanced analytics
- Limit: 100 patients

### Basic Tier ($49/month)
- ✅ All Free features
- ✅ Unlimited patients
- ✅ AI Chat (basic, 100 queries/month)
- ✅ Basic analytics
- ✅ Email support
- Limit: 5 users

### Professional Tier ($149/month)
- ✅ All Basic features
- ✅ AI Chat (full, 1000 queries/month)
- ✅ Product recommendations
- ✅ Advanced analytics
- ✅ Priority support
- Limit: 20 users

### Enterprise Tier ($499/month)
- ✅ All Professional features
- ✅ Unlimited AI access
- ✅ Custom AI knowledge base
- ✅ Business intelligence
- ✅ Patient analytics
- ✅ Custom roles & permissions
- ✅ Dedicated support
- ✅ SSO & Advanced security
- Unlimited users

---

## Feature Implementation Status

| Feature Category | Implementation Status |
|-----------------|----------------------|
| **Authentication** | ✅ Complete (JWT + Google OAuth) |
| **Multi-Tenant Isolation** | ✅ Complete (3-layer defense) |
| **RBAC** | ✅ Complete (8 roles + dynamic roles) |
| **Patient Management** | ✅ Complete (Add, Edit, View, History) |
| **Eye Examinations** | ✅ Complete (11 sections, EFRON/CLRU) |
| **Appointments** | ✅ Complete (8 types, calendar, reminders) |
| **Prescriptions** | ✅ Complete (Create, View, Upload) |
| **Orders** | ✅ Complete (Create, Track, Dispatch) |
| **Production** | ✅ Complete (Queue, Status, QC) |
| **Equipment** | ✅ Complete (Manage, Maintenance) |
| **Inventory** | ✅ Complete (Stock, Transfers, Alerts) |
| **AI Features** | ✅ Complete (Chat, RAG, Learning) |
| **Analytics** | ✅ Complete (Multiple dashboards) |
| **Supplier Portal** | ✅ Complete (Catalog, Orders) |

---

## Security & Compliance

### Access Control
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ Company-level data isolation
- ✅ Audit logging for all actions

### Data Privacy
- ✅ GDPR compliant
- ✅ HIPAA ready
- ✅ Data encryption at rest
- ✅ Data encryption in transit (TLS)
- ✅ Patient consent management

### Authentication Methods
- ✅ **Email/Password with JWT tokens** (Primary method)
  - JWT access tokens: 7-day expiration
  - JWT refresh tokens: 30-day expiration
  - Authorization header: `Bearer <token>`
- ✅ **Google OAuth 2.0 with JWT tokens**
  - OAuth flow issues JWT tokens
  - Same token format as email/password
- ✅ **Two-Factor Authentication (2FA)** - Optional enhancement
- ❌ **Replit SSO** (removed December 1, 2025)
- ❌ **Session-based authentication** (removed December 1, 2025)

**Current Implementation:** All authentication uses JWT tokens exclusively. The `auth-hybrid.ts` middleware validates JWT tokens from the Authorization header. Session-based authentication has been completely removed in favor of stateless JWT authentication.

---

## Recommended Feature Access for Normal Users

**Normal users provided by Company/Tenant Admin typically include:**

### Recommended Roles by Department

#### Clinical Department
- **ECP (Eye Care Professional)**
  - Full clinical access
  - Patient management
  - Examinations
  - Prescriptions
  - Appointments
  - Basic AI features

#### Front Desk / Reception
- **Dispenser**
  - Patient management
  - Appointment booking
  - Frame selection
  - Order creation
  - Basic customer service

#### Store/Branch Management
- **Store Manager**
  - All Dispenser features
  - Local staff management
  - Store-level reporting
  - Inventory management
  - Store analytics

#### Laboratory
- **Lab Technician**
  - Production queue
  - Quality control
  - Order status updates
  - Production reporting

#### Technical Support
- **Engineer**
  - Equipment management
  - Maintenance scheduling
  - Calibration records
  - Technical reporting

### Features NOT Accessible to Normal Users

❌ **Restricted to Company Admin or Platform Admin:**
- Company settings
- Billing & subscriptions
- User role management
- Permission management
- System logs
- Feature flags
- Cross-company data access

---

## Contact & Support

For questions about feature access or role permissions:
- **Documentation:** `/docs/rbac`
- **Support:** support@ils.com
- **Admin Guide:** `/docs/admin-guide`

---

**Document Maintained By:** ILS Development Team
**Last Review:** December 1, 2025
**Next Review:** March 1, 2026
