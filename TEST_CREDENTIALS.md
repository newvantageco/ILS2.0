# 🔑 Quick Test Credentials Reference

## Password for ALL Users
```
Test123!@#
```

## 🌐 Access URL
```
http://localhost:5005
```

---

## Test Users by Role

### 👨‍💼 Admins (with Company Admin privileges)
```
owner@test.com          → /admin dashboard
admin@test.com          → /admin dashboard
ecp1@test.com           → /ecp dashboard (Sarah Johnson)
```

### 👨‍⚕️ ECPs (Eye Care Professionals)
```
ecp2@test.com           → /ecp dashboard (Michael Chen)
optometrist@test.com    → /ecp dashboard (Dr. Emily Roberts)
```

### 🔬 Lab Staff
```
lab@test.com            → /lab dashboard
lab1@test.com           → /lab dashboard (David Martinez)
lab2@test.com           → /lab dashboard (Jennifer Wilson)
```

### 👓 Other Roles
```
dispenser@test.com      → /dispenser dashboard (Robert Brown)
engineer@test.com       → /lab dashboard (Lisa Anderson)
supplier@test.com       → /supplier dashboard (James Taylor)
```

---

## Quick Test Scenarios

### Test Multi-Tenant
1. Login: `ecp1@test.com` / `Test123!@#`
2. Go to: Patients page
3. Should see: 10 test patients only

### Test Company Admin
1. Login: `ecp1@test.com` (has admin flag)
2. Should see: Company management options
3. Login: `ecp2@test.com` (no admin flag)
4. Should NOT see: Company management options

### Test Role Routing
1. Login: `admin@test.com` → `/admin`
2. Login: `ecp1@test.com` → `/ecp`
3. Login: `lab1@test.com` → `/lab`
4. Login: `dispenser@test.com` → `/dispenser`

---

## Test Patients
- John Smith (CUST001)
- Emma Wilson (CUST002)
- Oliver Brown (CUST003)
- Sophia Davis (CUST004)
- William Miller (CUST005)
- Ava Garcia (CUST006)
- James Rodriguez (CUST007)
- Isabella Martinez (CUST008)
- Lucas Anderson (CUST009)
- Mia Thompson (CUST010)

All patients assigned to Test Company (ID: e635e4d5-0a44-4acf-a798-5ca3a450f601)

---

## Useful Commands

```bash
# Check all test users
docker exec ils-postgres psql -U ils_user -d ils_db -c \
  "SELECT email, role, is_company_admin FROM users WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601';"

# Check test patients
docker exec ils-postgres psql -U ils_user -d ils_db -c \
  "SELECT name, customer_number, email FROM patients LIMIT 10;"

# View app logs
docker logs ils-app --tail 50

# Restart app
docker-compose restart app
```

---

## 📚 Full Documentation
- `/docs/TESTING_GUIDE.md` - Comprehensive testing guide
- `/docs/MULTI_TENANT_FIXES_APPLIED.md` - Architecture changes
- `/docs/BACKEND_FRONTEND_GAP_ANALYSIS.md` - Missing features
- `/docs/HIDDEN_FEATURES_SUMMARY.md` - Available but hidden features
