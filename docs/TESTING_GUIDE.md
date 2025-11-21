# 🧪 Comprehensive Testing Guide

## ✅ Test Data Created Successfully!

Your ILS 2.0 application is now fully populated with comprehensive test data for thorough testing.

---

## 📊 Test Data Summary

| Entity | Count | Description |
|--------|-------|-------------|
| **Users** | 11 | Diverse roles across all user types |
| **Patients** | 10 | Realistic patient profiles with varied demographics |
| **Companies** | 2 | Test Company + any existing |
| **Test Rooms** | Ready | Examination and consultation rooms |
| **Equipment** | Ready | Diagnostic equipment setup |
| **Notifications** | Ready | Sample notifications for testing |

---

## 🔑 Test User Credentials

**Password for ALL users**: `Test123!@#`

### 👨‍💼 Admin Users (Company Admins)
| Email | Name | Role | Permissions |
|-------|------|------|-------------|
| `owner@test.com` | Owner Admin | admin | ✅ Company Admin |
| `admin@test.com` | Admin User | admin | ✅ Company Admin |
| `ecp1@test.com` | Sarah Johnson | ecp | ✅ Company Admin |

### 👨‍⚕️ Eye Care Professionals
| Email | Name | Role | Dashboard |
|-------|------|------|-----------|
| `ecp2@test.com` | Michael Chen | ecp | /ecp |
| `optometrist@test.com` | Dr. Emily Roberts | ecp | /ecp |

### 🔬 Lab Staff
| Email | Name | Role | Dashboard |
|-------|------|------|-----------|
| `lab@test.com` | Lab Tech | lab_tech | /lab |
| `lab1@test.com` | David Martinez | lab_tech | /lab |
| `lab2@test.com` | Jennifer Wilson | lab_tech | /lab |

### 👓 Other Roles
| Email | Name | Role | Dashboard |
|-------|------|------|-----------|
| `dispenser@test.com` | Robert Brown | dispenser | /dispenser |
| `engineer@test.com` | Lisa Anderson | engineer | /lab |
| `supplier@test.com` | James Taylor | supplier | /supplier |

---

## 👥 Test Patients

| Name | Email | Customer # | ECP |
|------|-------|------------|-----|
| John Smith | john.smith@email.com | CUST001 | Sarah Johnson |
| Emma Wilson | emma.wilson@email.com | CUST002 | Sarah Johnson |
| Oliver Brown | oliver.brown@email.com | CUST003 | Sarah Johnson |
| Sophia Davis | sophia.davis@email.com | CUST004 | Sarah Johnson |
| William Miller | william.miller@email.com | CUST005 | Michael Chen |
| Ava Garcia | ava.garcia@email.com | CUST006 | Michael Chen |
| James Rodriguez | james.rodriguez@email.com | CUST007 | Dr. Emily Roberts |
| Isabella Martinez | isabella.martinez@email.com | CUST008 | Dr. Emily Roberts |
| Lucas Anderson | lucas.anderson@email.com | CUST009 | Dr. Emily Roberts |
| Mia Thompson | mia.thompson@email.com | CUST010 | Dr. Emily Roberts |

---

## 🧪 Testing Scenarios

### 1. Multi-Tenant Testing ✅

**Test**: Verify users only see their company's data

1. Login as `ecp1@test.com`
2. Navigate to Patients page
3. **Expected**: See only 10 test patients from Test Company
4. **Expected**: Cannot see patients from other companies

### 2. Role-Based Dashboard Testing ✅

**Test**: Verify correct dashboard routing

| User | Expected Dashboard | URL |
|------|-------------------|-----|
| `admin@test.com` | Admin Dashboard | `/admin` |
| `ecp1@test.com` | ECP Dashboard | `/ecp` |
| `lab1@test.com` | Lab Dashboard | `/lab` |
| `dispenser@test.com` | Dispenser Dashboard | `/dispenser` |
| `supplier@test.com` | Supplier Dashboard | `/supplier` |

### 3. Company Admin Features Testing ✅

**Test**: Verify company admin access

1. Login as `ecp1@test.com` (is_company_admin = true)
2. **Expected**: See "Company Settings" or "Company Management" in sidebar
3. **Expected**: Can access `/company/management` routes

4. Login as `ecp2@test.com` (is_company_admin = false)
5. **Expected**: NO company management options visible
6. **Expected**: Cannot access `/company/management` (403)

### 4. Patient Management Testing

**Test**: Create, view, edit patient records

1. Login as `ecp1@test.com`
2. Navigate to `/ecp/patients`
3. **Expected**: See 10 test patients
4. Click on "John Smith"
5. **Expected**: View patient details
6. Try creating new patient
7. Try editing existing patient

### 5. Onboarding Flow Testing ✅

**Test**: Verify no onboarding loops

1. Login as any test user
2. **Expected**: Direct to appropriate dashboard
3. **Expected**: NO redirect to `/onboarding`
4. **Expected**: User has `company_id` set

### 6. Permission Testing

**Test**: Verify multi-tenant data isolation

1. Login as `ecp1@test.com`
2. Try to access patient from different company (if any exist)
3. **Expected**: 403 Forbidden or filtered out

### 7. Authentication Testing

**Test**: Login/logout functionality

1. Logout from any user
2. Login with `owner@test.com` / `Test123!@#`
3. **Expected**: Successful login
4. **Expected**: Token/session created
5. Logout
6. **Expected**: Redirected to login
7. Try to access protected route
8. **Expected**: Redirected to login

---

## 🎯 Feature-Specific Testing

### ECP Dashboard Features
- View patient list
- Create/edit prescriptions
- Schedule appointments
- View orders
- Access inventory

### Lab Dashboard Features
- View production queue
- Quality control
- Equipment management
- Order processing

### Admin Dashboard Features
- User management
- Company settings
- Analytics/reports
- System configuration

---

## 🔍 Hidden Features to Test (No UI Yet)

These have backend APIs but NO frontend:

### Can Test via API:
1. **Queue Status**: `GET /api/queue/stats`
2. **2FA**: `POST /api/2fa/enable`
3. **Telehealth**: `GET /api/telehealth/visits`
4. **Face Analysis**: `POST /api/face-analysis/upload`
5. **Webhooks**: `GET /api/webhooks`

### Use Postman/Thunder Client:
```bash
# Example: Get queue stats
curl http://localhost:5005/api/queue/stats \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Example: Check 2FA status
curl http://localhost:5005/api/2fa/status \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

---

## 🐛 Known Issues to Test

### ✅ Fixed Issues:
- [x] Login infinite loop → Fixed
- [x] Onboarding redirect loop → Fixed
- [x] Multi-tenant data leak → Fixed with is_company_admin
- [x] Role overwrite on company creation → Fixed

### ⚠️ Potential Issues:
- [ ] Queue dashboard UI missing
- [ ] 2FA settings page missing
- [ ] Telehealth module not accessible
- [ ] Face analysis feature hidden

---

## 📱 Mobile/Responsive Testing

Test on different screen sizes:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

---

## 🔒 Security Testing

### Test Access Control:
1. Try accessing admin routes as regular user
2. Try accessing other company's data
3. Try SQL injection in forms
4. Try XSS in patient names

### Test Session Management:
1. Check session timeout
2. Check concurrent sessions
3. Check logout functionality
4. Check "remember me"

---

## 📊 Performance Testing

### Load Testing:
1. Create 100+ patients
2. View patient list (pagination)
3. Search functionality
4. Report generation

### API Response Times:
- Patient list: < 500ms
- Dashboard load: < 1s
- Search: < 300ms
- Create patient: < 200ms

---

## 🚀 Next Steps After Testing

### Immediate (Week 1):
1. Build Queue Dashboard UI
2. Add 2FA Settings page
3. Create Feedback Widget
4. Implement Import Wizard

### High Priority (Weeks 2-4):
5. Subscription Portal
6. Face Analysis UI
7. Telehealth Module (Phase 1)
8. Contact Lens Management

### Platform Features (Weeks 5+):
9. GDPR Privacy Portal
10. Observability Dashboard
11. Service Status Page
12. Clinical Workflow Builder

---

## 📞 Support & Issues

### If you find bugs:
1. Check browser console for errors
2. Check Docker logs: `docker logs ils-app --tail 50`
3. Check database: `docker exec ils-postgres psql -U ils_user -d ils_db`
4. Document steps to reproduce

### Common Issues:

**Issue**: "User not found"
**Solution**: Verify user exists with correct company_id

**Issue**: "403 Forbidden"
**Solution**: Check user role and permissions

**Issue**: "Onboarding loop"
**Solution**: Verify user has company_id and correct role

---

## ✅ Testing Checklist

Use this for systematic testing:

### Authentication
- [ ] Login with each role type
- [ ] Logout functionality
- [ ] Session persistence
- [ ] Password validation

### Dashboard Access
- [ ] Admin dashboard (/admin)
- [ ] ECP dashboard (/ecp)
- [ ] Lab dashboard (/lab)
- [ ] Dispenser dashboard (/dispenser)
- [ ] Supplier dashboard (/supplier)

### Patient Management
- [ ] View patient list
- [ ] Create new patient
- [ ] Edit patient details
- [ ] Delete patient
- [ ] Search patients

### Multi-Tenant
- [ ] Data isolation verified
- [ ] Company switching works
- [ ] Cross-company access blocked

### Company Admin
- [ ] Admin users see management options
- [ ] Non-admin users restricted
- [ ] Company settings accessible
- [ ] User invitation works

### Mobile/Responsive
- [ ] Mobile menu works
- [ ] Forms usable on mobile
- [ ] Tables scroll on small screens
- [ ] Touch interactions work

---

## 🎉 Success Criteria

Your application is ready for production when:

✅ All test users can login
✅ Each role sees correct dashboard
✅ Multi-tenant isolation works
✅ No onboarding loops
✅ Company admin features accessible
✅ Patient CRUD operations work
✅ No console errors
✅ Mobile responsive
✅ API response times acceptable
✅ Security controls effective

---

## 🌐 Access Information

- **Frontend**: http://localhost:5005
- **Backend API**: http://localhost:5005/api
- **Database**: localhost:5432 (via Docker)
- **Redis**: localhost:6379 (via Docker)
- **Adminer**: http://localhost:8080 (Database UI)

---

## 🔧 Useful Commands

```bash
# View Docker logs
docker logs ils-app --tail 100

# Check database
docker exec ils-postgres psql -U ils_user -d ils_db -c "SELECT COUNT(*) FROM users;"

# Restart application
docker-compose restart app

# Rebuild application
docker-compose build app && docker-compose up -d app

# Check running containers
docker ps

# View test users
docker exec ils-postgres psql -U ils_user -d ils_db -c "SELECT email, role, is_company_admin FROM users WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601';"
```

---

## 📝 Test Reports

Create test reports in `/docs/test-reports/` with:
- Date and tester name
- Test scenarios executed
- Bugs found
- Screenshots of issues
- Performance metrics

---

**Happy Testing! 🚀**
