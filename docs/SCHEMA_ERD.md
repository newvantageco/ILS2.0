## Schema ERD (Concise)

Source of truth: `shared/schema.ts` (Drizzle)

### Companies
`companies(id, name, type, status, email, phone, website, address, subscriptionPlan, stripe*, brandingSettings, settings, preferences, aiEnabled, ...)`
One-to-many with `users`, `orders`, `invoices`, etc.

### Users
`users(id, companyId, accountStatus, email, password, firstName, lastName, profileImageUrl, role, enhancedRole, subscriptionPlan, goc*, contact*, address, isActive, isVerified, lastLoginAt, ...)`
FK: `companyId → companies.id`. Holds RBAC, account lifecycle, practitioner fields.

### Patients
`patients(id, companyId, ecpId, name, dateOfBirth, customerReference*, address, contact*, ...)`
FKs: `companyId → companies.id`, `ecpId → users.id`.

### Orders
`orders(id, companyId, patientId, ecpId, orderNumber, status, frame/lens specs, OMA fields, shipping*, due/completed timestamps, customerReference*, ...)`
FKs: `companyId → companies.id`, `patientId → patients.id`, `ecpId → users.id`.

### Invoices / Line Items
`invoices(id, companyId, customerId/ecpId, status, totals, paymentMethod, stripe*, ...)`
`invoice_line_items(id, invoiceId, productId, description, qty, unitPrice, ...)`
FKs: `companyId → companies.id`, `invoiceId → invoices.id`.

### Purchase Orders / Line Items
`purchase_orders(id, companyId, supplierId, poNumber, status, totals, delivery*, tracking*, ...)`
`po_line_items(id, poId, sku, description, qty, unitPrice, ...)`
FKs: `companyId → companies.id`, `supplierId → companies.id?`, `poId → purchase_orders.id`.

### Consult Logs
`consult_logs(id, orderId, ecpId, priority, subject, description, status, labResponse, respondedAt, ...)`
FKs: `orderId → orders.id`, `ecpId → users.id`.

### AI Deployment Queue
`ai_deployment_queue(id, modelVersionId, companyId?, status, scheduledAt, startedAt, completedAt, error, ...)`
Supports multi-company deployments and scheduling.

### Tenancy & Security
All business tables include `companyId` and are queried with `company_id = session.companyId`.
Cross-tenant access is forbidden by route guards and storage patterns.

### Notes
Enums: `role`, `subscription_plan`, `account_status`, and others for statuses.
JSONB fields for settings/branding/addresses.
UUID PKs via `gen_random_uuid()`.

