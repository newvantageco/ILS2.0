# Missing Frontend Features Analysis
## Features Available in Backend But Not Exposed in Frontend

**Generated:** November 3, 2025  
**Total Backend API Routes:** 242  
**Frontend API Calls:** 152  
**Missing/Unused Routes:** 90 (37%)

---

## 🤖 AI/ML Features (HIGH VALUE - Not Exposed)

### AI Model Management
**Backend Tables:** 10 AI-related tables with full infrastructure
- `ai_conversations` - Chat conversation history
- `ai_messages` - Individual chat messages
- `ai_feedback` - User feedback on AI responses
- `ai_knowledge_base` - AI training knowledge
- `ai_learning_data` - ML training datasets
- `ai_model_versions` - Model version tracking
- `ai_model_deployments` - Production model deployments
- `ai_deployment_queue` - Deployment pipeline
- `ai_training_jobs` - Model training job tracking
- `company_ai_settings` - Per-company AI configuration

**Missing Frontend:**
- AI Model Training Dashboard
- AI Deployment Pipeline UI
- Knowledge Base Management UI
- Training Job Monitoring
- Model Version Comparison
- AI Feedback Analysis Dashboard
- Company AI Settings Management

**Backend API Routes Available:**
- `/api/ai-assistant/conversations/:id` - Get conversation history
- `/api/ai-assistant/conversations/:id/feedback` - Submit feedback
- `/api/ai-intelligence/forecast` - Demand forecasting

---

## 📊 Analytics & Business Intelligence (PARTIALLY MISSING)

### Analytics Infrastructure
**Backend Tables:** 6 analytics tables
- `analytics_events` - Event tracking (not exposed)
- `bi_recommendations` - Business intelligence insights (not exposed)
- `ecp_product_sales_analytics` - Sales analytics (not exposed)
- `lims_clinical_analytics` - Clinical data analytics (not exposed)
- `rx_frame_lens_analytics` - Prescription analytics (not exposed)
- `training_data_analytics` - AI training metrics (not exposed)

**Missing Frontend:**
- Event Analytics Dashboard
- BI Recommendations Viewer
- ECP Sales Analytics Dashboard
- Clinical Analytics Reports
- Rx/Frame/Lens Trend Analysis
- ML Training Metrics Dashboard

**Backend API Routes Available:**
- `/api/production/velocity` - Production velocity metrics
- `/api/quality-control/defect-trends` - Quality trends
- `/api/orders/analyze-risk` - Risk analysis

---

## 🏥 Clinical Features (PARTIALLY EXPOSED)

### Clinical Protocols
**Backend Table:** `clinical_protocols` - Standardized clinical procedures
- No frontend management interface
- Only referenced in code, not accessible to users

**Missing Frontend:**
- Clinical Protocol Library
- Protocol Editor/Creator
- Protocol Search & Filter
- Protocol Assignment to Examinations

### Prescription Management (Enhanced Features)
**Backend Routes Not Exposed:**
- `/api/prescriptions/:id/email` - Email prescription to patient
- `/api/prescriptions/:id/pdf` - Generate PDF prescription
- `/api/prescriptions/:id/sign` - Digital signature
- `/api/alerts/prescriptions/:id/dismiss` - Dismiss alerts

**Missing Frontend:**
- One-click Email Prescription
- Digital Signature Modal
- Prescription Alert Management
- Prescription History Timeline

---

## 📋 Order Management (Enhanced Features Missing)

### Advanced Order Features
**Backend Routes Not Exposed:**
- `/api/orders/:id/email` - Email order confirmation
- `/api/orders/:id/send-confirmation` - Send custom confirmation
- `/api/orders/:id/ship` - Mark as shipped with tracking
- `/api/orders/:id/oma` - Export to OMA format
- `/api/orders/:id/lab-ticket` - Generate lab work ticket
- `/api/orders/:orderId/consult-logs` - View consultation history
- `/api/orders/analyze-risk` - Risk assessment

**Missing Frontend:**
- Email Order Confirmation Button
- Shipping Management UI
- OMA Export Feature
- Lab Ticket Generator Button
- Consult Log Viewer
- Order Risk Analysis Dashboard

---

## 🔧 Equipment Management (BASIC MISSING)

### Equipment Tracking
**Backend Table:** `equipment` - Equipment inventory tracking
**Backend Table:** `calibration_records` - Calibration history

**Backend Routes:**
- `/api/equipment/:id` - Get/Update equipment
- `/api/equipment/:id/calibration` - Calibration records
- `/api/equipment/:id/maintenance` - Maintenance logs

**Current Frontend:** Basic equipment page exists at `/ecp/equipment` and `/lab/equipment`

**Missing Features:**
- Equipment Detail View (only list view exists)
- Calibration History Timeline
- Maintenance Schedule Management
- Equipment QR Code Generation
- Equipment Usage Analytics
- Calibration Reminder System

---

## 📦 Production & Quality Control (PARTIALLY EXPOSED)

### Production Tracking
**Backend Routes:**
- `/api/production/orders/:id/status` - Update production status
- `/api/production/orders/:id/timeline` - Production timeline
- `/api/production/velocity` - Velocity metrics

**Pages Exist But May Be Incomplete:**
- `ProductionTrackingPage` - Exists
- `QualityControlPage` - Exists

**Potentially Missing:**
- Real-time Production Dashboard
- Velocity Metrics Widget
- Timeline Visualization

### Quality Control Enhanced
**Backend Routes:**
- `/api/quality-control/defect-trends` - Defect analysis
- `/api/quality-control/metrics` - QC metrics

**Missing:**
- Defect Trend Analysis Charts
- QC Metrics Dashboard
- Root Cause Analysis UI

---

## 📄 Invoice Management (Enhanced Features)

### Advanced Invoice Features
**Backend Routes Not Exposed:**
- `/api/invoices/:id/email` - Email invoice to customer
- `/api/invoices/:id/payment` - Record payment
- `/api/invoices/:id/pdf` - Generate PDF invoice
- `/api/invoices/:id/receipt` - Generate receipt
- `/api/invoices/:id/status` - Update status

**Missing Frontend:**
- Email Invoice Button
- Payment Recording Modal
- PDF Download Button
- Receipt Generation
- Invoice Status Workflow

---

## 🔍 Audit Logs & Compliance (ADMIN ONLY - PARTIALLY EXPOSED)

### HIPAA Compliance
**Backend Table:** `audit_logs` - Full audit trail (23 columns)
**Backend Table:** `goc_compliance_checks` - GOC regulatory compliance

**Backend Routes:**
- `/api/admin/audit-logs` - Full audit log access

**Current Frontend:** Basic `AuditLogsPage` exists

**Potentially Missing:**
- Advanced Audit Log Filtering
- PHI Access Tracking Dashboard
- GOC Compliance Dashboard
- Compliance Report Generation
- Retention Policy Management

---

## 📞 Consult Logs & Communication

### Consultation Tracking
**Backend Table:** `consult_logs` - Lab-ECP consultation history

**Backend Routes:**
- `/api/consult-logs/:id/respond` - Respond to consultation
- `/api/orders/:orderId/consult-logs` - View consultation logs

**Missing Frontend:**
- Consultation Log Viewer
- Consultation Response UI
- Consultation History per Order
- Real-time Consultation Chat

---

## 🏢 Company Management (Enhanced Admin Features)

### Company Administration
**Backend Table:** `company_supplier_relationships` - B2B relationships

**Backend Routes:**
- `/api/admin/companies/:id/resend-credentials` - Resend login info
- `/api/company-admin/users/:userId` - Manage company users
- `/api/platform-admin/users/:id/reset-password` - Reset passwords

**Missing Frontend:**
- Resend Credentials Button
- Company User Management UI (company admin)
- Password Reset Admin Tool
- Supplier Relationship Manager

---

## 🔬 Advanced Clinical (Research/Future)

### DICOM & NLP Analysis
**Backend Tables:**
- `dicom_readings` - Medical imaging integration
- `nlp_clinical_analysis` - Natural language processing of clinical notes
- `dispense_records` - Dispensing history tracking

**Status:** Infrastructure exists but no UI implementation
**Potential Use:** Future medical imaging integration, AI clinical note analysis

---

## 📦 Purchase Orders (Enhanced Features)

### PO Management
**Backend Routes:**
- `/api/purchase-orders/:id/email` - Email PO to supplier
- `/api/purchase-orders/:id/pdf` - Generate PDF PO
- `/api/purchase-orders/:id/status` - Update PO status

**Missing Frontend:**
- Email PO Button
- PDF PO Generation
- PO Status Workflow UI
- PO Approval System

---

## 🎯 Priority Recommendations

### High Priority (Immediate Value)
1. **Equipment Detail Pages** - Backend routes exist, just need UI
2. **Invoice Enhanced Features** - Email, PDF, Payment recording
3. **Order Enhanced Features** - Email confirmations, OMA export, shipping
4. **Prescription Enhanced Features** - Email, PDF, Digital signature
5. **Consult Logs UI** - Communication tracking between lab and ECP

### Medium Priority (Business Value)
6. **Analytics Dashboards** - All analytics tables have no UI
7. **Production Velocity Metrics** - API exists, need visualization
8. **QC Defect Trends** - API exists, need charts
9. **Clinical Protocols Management** - Library exists, needs UI
10. **Purchase Order Enhanced** - Email, PDF, status workflow

### Low Priority (Future/Advanced)
11. **AI Model Management** - Full infrastructure, needs admin UI
12. **AI Training Dashboard** - Model training job monitoring
13. **DICOM Integration** - Medical imaging (future feature)
14. **NLP Clinical Analysis** - AI note analysis (future feature)

---

## 🚀 Quick Wins (Easiest to Implement)

### Features with Full Backend Support
1. **Email Buttons** - Just add buttons that call existing APIs:
   - Email Invoice: `/api/invoices/:id/email`
   - Email Prescription: `/api/prescriptions/:id/email`
   - Email Order: `/api/orders/:id/email`
   - Email PO: `/api/purchase-orders/:id/pdf`

2. **PDF Download Buttons** - One-line implementations:
   - Download Prescription PDF
   - Download Invoice PDF
   - Download Receipt PDF
   - Download Lab Ticket PDF
   - Download PO PDF

3. **Equipment Details** - Create detail page using existing endpoints:
   - View equipment details
   - View calibration history
   - View maintenance logs

4. **Order Risk Analysis** - Add widget to order details page
5. **Production Velocity** - Add card to production dashboard

---

## 📊 Statistics

**Backend Capability:** 242 API routes  
**Frontend Usage:** 152 routes (63%)  
**Unused/Missing:** 90 routes (37%)  

**Database Tables:** 63 total  
**Tables with No Frontend:** 30 tables (48%)  

**High-Value Missing Features:** 15+  
**Quick Win Features:** 10+  
**Future/Advanced Features:** 5+  

---

## Next Steps

1. **Audit Current UI** - Verify which pages are actually incomplete
2. **Prioritize Features** - Based on business value and user needs
3. **Create Feature Tickets** - Break down into implementable tasks
4. **Quick Wins First** - Start with email/PDF buttons (highest ROI)
5. **Dashboard Enhancement** - Add analytics widgets to existing dashboards

---

**Note:** This analysis is based on code inspection. Some features may have partial implementations not detected by the automated scan.
