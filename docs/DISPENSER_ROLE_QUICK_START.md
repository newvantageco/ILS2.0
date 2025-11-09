# 🚀 Dispenser Role - Quick Start Guide

## What is the Dispenser Role?

The **Dispenser** is your platform's **revenue-generating superhero**. They turn clinical examinations into sales by:

1. 💰 Operating the Point-of-Sale (POS) system
2. 👓 Helping patients select frames and lenses
3. 📋 Processing invoices and payments
4. 🔬 Creating lab orders from prescriptions

This role is **pre-configured** with the exact permissions needed to excel at their job—no guesswork, no over-permissions, no security risks.

---

## 🎯 Quick Setup (5 Minutes)

### Step 1: Run the Setup Script

```bash
chmod +x scripts/setup_dispenser_role.sh
export DATABASE_URL='your-postgresql-connection-string'
./scripts/setup_dispenser_role.sh
```

This will:
- ✅ Add all POS, Patient, Clinical, and Order permissions
- ✅ Create the "Dispenser" role for all your companies
- ✅ Assign the default permission set
- ✅ Verify everything is working

### Step 2: Assign Dispenser Role to a User

**Option A: Via API**
```bash
curl -X POST http://localhost:5000/api/roles/users/USER_ID/assign \
  -H "Content-Type: application/json" \
  -d '{
    "roleIds": ["DISPENSER_ROLE_ID"],
    "setPrimaryRoleId": "DISPENSER_ROLE_ID"
  }'
```

**Option B: Via SQL**
```sql
-- Get the Dispenser role ID for your company
SELECT id, name FROM dynamic_roles 
WHERE company_id = 'your-company-id' AND name = 'Dispenser';

-- Assign to a user
INSERT INTO user_dynamic_roles (user_id, role_id, is_primary)
VALUES ('user-id', 'dispenser-role-id', true);
```

**Option C: Via UI (Coming Soon)**
- Settings > Users > Select User > Assign Roles

### Step 3: Test the Workflow

1. **Login as an Optometrist**
   - Complete an eye examination
   - Add diagnosis: "Presbyopia"
   - Add management plan: "Progressive Lenses"
   - Set status to "Completed"

2. **Login as the Dispenser**
   - Go to POS page
   - Watch for the real-time notification to appear
   - Click "Begin Dispensing"
   - Complete the sale

---

## 🎭 Creating Custom Role Variants

### Example 1: Trainee Dispenser (Cannot Complete Sales)

```bash
# Step 1: Clone the Dispenser role
curl -X POST http://localhost:5000/api/roles/DISPENSER_ROLE_ID/clone \
  -H "Content-Type: application/json" \
  -d '{
    "newName": "Trainee Dispenser",
    "newDescription": "Limited access for new employees in training"
  }'

# Step 2: Remove permissions they shouldn't have
curl -X POST http://localhost:5000/api/roles/NEW_ROLE_ID/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "removePermissions": [
      "pos:invoices:create",
      "orders:create"
    ]
  }'
```

**Result:** Trainees can help customers but must get a senior Dispenser to complete the sale.

### Example 2: Dispensing Manager (Can Void & Discount)

```bash
# Clone and add extra permissions
curl -X POST http://localhost:5000/api/roles/DISPENSER_ROLE_ID/clone \
  -H "Content-Type: application/json" \
  -d '{
    "newName": "Dispensing Manager",
    "newDescription": "Senior staff with discount and refund authority"
  }'

curl -X POST http://localhost:5000/api/roles/NEW_ROLE_ID/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "addPermissions": [
      "pos:invoices:void",
      "pos:invoices:apply_discount",
      "pos:products:update",
      "pos:products:manage_stock",
      "analytics:read_pos"
    ]
  }'
```

**Result:** Managers can do everything a Dispenser can, plus void sales, apply discounts, and view analytics.

---

## ✅ What the Default Dispenser CAN Do

| Action | Permission | Description |
|--------|-----------|-------------|
| ✅ View patients | `patients:read` | Search and view all patient records |
| ✅ Create patients | `patients:create` | Add walk-in customers |
| ✅ Update patients | `patients:update` | Edit contact info, address |
| ✅ Access POS | `pos:access` | Open the Point-of-Sale interface |
| ✅ Create invoices | `pos:invoices:create` | Process sales and payments |
| ✅ View invoices | `pos:invoices:read` | See past sales history |
| ✅ Edit invoices | `pos:invoices:update` | Modify draft invoices |
| ✅ View products | `pos:products:read` | Browse catalog, check stock |
| ✅ View exams | `examinations:read` | See completed examination reports |
| ✅ View prescriptions | `prescriptions:read` | Access patient Rx history |
| ✅ View orders | `orders:read` | Check lab order status |
| ✅ Create orders | `orders:create` | Submit new lab orders |
| ✅ View reports | `pos:reports:read` | See their sales performance |

---

## ❌ What the Default Dispenser CANNOT Do

| Action | Permission | Why Not? |
|--------|-----------|----------|
| ❌ Delete patients | `patients:delete` | Admin-only for compliance |
| ❌ Void invoices | `pos:invoices:void` | Requires manager approval |
| ❌ Apply discounts | `pos:invoices:apply_discount` | Manager-level authority |
| ❌ Add products | `pos:products:create` | Inventory management task |
| ❌ Edit prices | `pos:products:update` | Admin/manager function |
| ❌ Adjust stock | `pos:products:manage_stock` | Inventory control |
| ❌ Perform exams | `examinations:create` | Optometrist-only |
| ❌ Create prescriptions | `prescriptions:create` | Licensed professional only |

---

## 🎨 Frontend Integration

### Show/Hide UI Based on Permissions

```tsx
import { usePermissions, RequirePermission } from '@/hooks/usePermissions';

function POSCheckout() {
  const { hasPermission } = usePermissions();

  return (
    <div>
      {/* Always visible to Dispensers */}
      <Button onClick={createInvoice}>Complete Sale</Button>

      {/* Only visible if they have the permission */}
      <RequirePermission permission="pos:invoices:apply_discount">
        <Button onClick={applyDiscount}>Apply Discount</Button>
      </RequirePermission>

      {/* Only managers see this */}
      <RequirePermission permission="pos:invoices:void">
        <Button onClick={voidInvoice} variant="destructive">
          Void Sale
        </Button>
      </RequirePermission>

      {/* Conditional rendering */}
      {hasPermission('pos:products:manage_stock') && (
        <StockManagementPanel />
      )}
    </div>
  );
}
```

### Patient Handoff Notification

```tsx
import { PatientHandoffNotification } from '@/components/pos/PatientHandoffNotification';

function OpticalPOSPage() {
  const handlePatientSelect = (patientId, examination) => {
    // Load patient data
    // Filter products based on examination.managementPlan
    // Pre-populate prescription
  };

  return (
    <>
      {/* Floating notification appears automatically */}
      <PatientHandoffNotification 
        onSelectPatient={handlePatientSelect}
        onDismiss={() => {}}
      />
      
      {/* Rest of POS UI */}
    </>
  );
}
```

---

## 🧪 Testing Checklist

### ✅ Test 1: Default Dispenser Permissions
- [ ] Can search for patients
- [ ] Can view product catalog
- [ ] Can create invoices
- [ ] Can view prescriptions
- [ ] Can create lab orders
- [ ] Cannot delete patients
- [ ] Cannot void invoices
- [ ] Cannot edit product prices

### ✅ Test 2: Role Cloning
- [ ] Clone "Dispenser" to "Trainee Dispenser"
- [ ] Remove `pos:invoices:create` permission
- [ ] Assign to test user
- [ ] Verify they cannot complete sales
- [ ] Verify they can view everything else

### ✅ Test 3: Patient Handoff
- [ ] Complete exam as Optometrist
- [ ] Set diagnosis and management plan
- [ ] Login as Dispenser
- [ ] Notification appears within 30 seconds
- [ ] Click "Begin Dispensing"
- [ ] Patient data loads correctly
- [ ] Products filtered by recommendation

### ✅ Test 4: Permission Enforcement
- [ ] Try to void invoice without permission (should fail)
- [ ] Try to delete patient without permission (should fail)
- [ ] Try to adjust stock without permission (should fail)
- [ ] Verify 403 Forbidden responses in network tab

---

## 📊 Monitoring & Analytics

### Audit Trail
Every permission change is logged:

```sql
SELECT * FROM role_change_audit
WHERE action_type IN ('permission_assigned', 'permission_revoked')
ORDER BY timestamp DESC;
```

### User Activity
Track what Dispensers are doing:

```sql
-- Sales by Dispenser
SELECT 
  u.full_name,
  COUNT(i.id) as total_sales,
  SUM(i.total_amount) as revenue
FROM invoices i
JOIN users u ON u.id = i.created_by
JOIN user_dynamic_roles udr ON udr.user_id = u.id
JOIN dynamic_roles dr ON dr.id = udr.role_id
WHERE dr.name = 'Dispenser'
AND i.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.full_name
ORDER BY revenue DESC;
```

---

## 🆘 Troubleshooting

### Problem: Dispenser role not created

**Solution:**
```bash
# Manually create for a company
node -e "
  const { createDefaultRoles } = require('./server/services/DefaultRolesService');
  createDefaultRoles('your-company-id').then(() => process.exit(0));
"
```

### Problem: User cannot access POS

**Check:**
1. User has Dispenser role assigned
2. Role has `pos:access` permission
3. Session has been refreshed

```sql
-- Verify user's roles and permissions
SELECT 
  u.email,
  dr.name as role_name,
  p.permission_key
FROM users u
JOIN user_dynamic_roles udr ON udr.user_id = u.id
JOIN dynamic_roles dr ON dr.id = udr.role_id
JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
JOIN permissions p ON p.id = drp.permission_id
WHERE u.id = 'your-user-id';
```

### Problem: Notifications not appearing

**Check:**
1. Examinations have `status = 'completed'`
2. Examinations have `diagnosis` and `managementPlan` in JSONB
3. Browser console for API errors

```bash
# Test the endpoint manually
curl http://localhost:5000/api/examinations/recent?hours=2&status=completed
```

---

## 📚 Additional Resources

- **Full Documentation:** [DISPENSER_ROLE_IMPLEMENTATION.md](./DISPENSER_ROLE_IMPLEMENTATION.md)
- **Dynamic RBAC Guide:** [DYNAMIC_RBAC_IMPLEMENTATION_GUIDE.md](./DYNAMIC_RBAC_IMPLEMENTATION_GUIDE.md)
- **API Reference:** See `/server/routes/dynamicRoles.ts`
- **Permission List:** See `/migrations/add_dispenser_permissions.sql`

---

## 🎉 You're Ready!

Your Dispenser role system is now:
- ✅ **Secure** - Granular permissions, audit logging
- ✅ **Flexible** - Clone and customize for any variant
- ✅ **Easy-to-use** - Intelligent patient handoffs
- ✅ **World-class** - Industry-leading clinical-to-commercial workflow

Welcome to the future of optical retail! 🚀👓
