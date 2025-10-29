# 🚀 NEW VANTAGE CO LTD - Quick Start Guide

## 🔑 Login Credentials

```
URL:      http://localhost:3000/login
Email:    admin@newvantageco.com
Password: NewVantage2025!
```

⚠️ **CHANGE PASSWORD AFTER FIRST LOGIN!**

---

## 🏢 Company Information

- **Company Name**: NEW VANTAGE CO LTD
- **Company ID**: `new-vantage-co-ltd-001`
- **GOC Number**: GOC-PRACTICE-001
- **Type**: Hybrid (ECP + Lab)
- **Access**: ✅ Full ECP Features + ✅ Lab Features

---

## 👥 Admin User Details

- **User ID**: `new-vantage-admin-001`
- **Role**: Company Admin
- **GOC Number**: GOC-OPT-12345
- **Qualifications**: BSc(Hons) Optom, MCOptom
- **Permissions**:
  - ✅ Can Prescribe
  - ✅ Can Dispense
  - ✅ Company Administration
  - ✅ User Management
  - ✅ Full System Access

---

## 🏥 Test Rooms Available

1. **Test Room 1 (TR1)** - Main testing room with full equipment suite
2. **Test Room 2 (TR2)** - Routine examinations
3. **Consulting Room (CR1)** - Complex cases
4. **Contact Lens Room (CL1)** - Contact lens fitting

---

## 🔧 API Endpoints Available

### ECP Features
- `GET /api/ecp/test-rooms` - List test rooms
- `GET /api/ecp/goc-compliance` - Compliance checks
- `GET /api/ecp/goc-status` - Practitioner status
- `GET /api/ecp/prescription-templates` - Rx templates
- `GET /api/ecp/clinical-protocols` - Clinical guidelines

### Prescriptions (with GOC fields)
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions` - Create prescription
- `POST /api/prescriptions/:id/sign` - Digital signature
- `GET /api/prescriptions/:id/pdf` - Generate PDF

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `GET /api/patients/:id/examinations` - Patient history

### Orders (Lab Access)
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Order details
- `PATCH /api/orders/:id/status` - Update status

---

## 📋 New Prescription Fields

### GOC Compliance
- `testRoomName` - Which test room used
- `prescriberGocNumber` - GOC registration
- `prescriberName` - Full name
- `prescriberQualifications` - Professional qualifications
- `prescriberGocType` - optometrist/dispensing_optician

### Visual Acuity (British Standards)
- `odVisualAcuityAided` - Right eye aided VA (e.g., "6/6")
- `osVisualAcuityAided` - Left eye aided VA
- `binocularVisualAcuity` - Both eyes together
- `odNearVision` - Right eye near (e.g., "N5")
- `osNearVision` - Left eye near

### Pupillary Distance
- `pdRight` - Right monocular PD (mm)
- `pdLeft` - Left monocular PD (mm)
- `binocularPd` - Total PD
- `nearPd` - Near PD for reading

### Clinical
- `intraocularPressureOd` - IOP right (mmHg)
- `intraocularPressureOs` - IOP left (mmHg)
- `ocularHealthNotes` - Health observations
- `clinicalRecommendations` - Recommendations
- `followUpRequired` - Boolean
- `followUpDate` - Date for follow-up

### Usage & Compliance
- `usagePurpose` - driving/reading/computer/general
- `wearTime` - full-time/part-time
- `drivingSuitable` - Boolean (DVLA)
- `recordRetentionDate` - 7-year requirement
- `examinationType` - routine/emergency/follow_up

---

## 🎯 What You Can Do Now

### 1. **Create Patients**
```javascript
POST /api/patients
{
  "name": "John Smith",
  "dateOfBirth": "1980-05-15",
  "email": "john.smith@example.com",
  "nhsNumber": "1234567890",
  "occupation": "Software Developer",
  "vduUser": true
}
```

### 2. **Issue GOC-Compliant Prescriptions**
```javascript
POST /api/prescriptions
{
  "patientId": "<patient-id>",
  "testRoomName": "Test Room 1",
  "prescriberGocNumber": "GOC-OPT-12345",
  "odSphere": "-2.00",
  "osSphere": "-1.75",
  "pdRight": 32.5,
  "pdLeft": 31.5,
  "odVisualAcuityAided": "6/6",
  "gocCompliant": true
}
```

### 3. **Place Lab Orders**
```javascript
POST /api/orders
{
  "patientId": "<patient-id>",
  "lensType": "Single Vision",
  "lensMaterial": "1.6 Index",
  "coating": "Anti-Reflection"
}
```

### 4. **Manage Test Rooms**
```javascript
POST /api/ecp/test-rooms
{
  "roomName": "Test Room 5",
  "roomCode": "TR5",
  "equipmentList": "Phoropter, Slit Lamp"
}
```

### 5. **Monitor GOC Compliance**
```javascript
GET /api/ecp/goc-status
// Returns expiry warnings for all practitioners
```

---

## ⚡ Quick Tips

1. **All API calls require authentication** - Include Bearer token in Authorization header

2. **Test rooms auto-populate** - Select from dropdown in prescription forms

3. **GOC fields are validated** - System ensures compliance with British standards

4. **7-year retention automatic** - All prescriptions set retention date automatically

5. **Visual acuity uses Snellen** - Format: "6/6", "6/9", "6/12", etc.

6. **Near vision uses N notation** - Format: "N5", "N6", "N8", etc.

7. **PD in millimeters** - Decimal precision to 0.1mm

8. **IOP in mmHg** - Integer values (e.g., "15", "14")

---

## 🆘 Need Help?

### Check Documentation
- `ECP_MODERNIZATION_COMPLETE.md` - Full implementation details
- `migrations/modernize_ecp_goc_compliance.sql` - Database schema
- `server/routes/ecp.ts` - API implementation

### Common Issues

**Can't login?**
- Verify email: `admin@newvantageco.com`
- Verify password: `NewVantage2025!`
- Check database connection

**Can't see test rooms?**
- Verify company_id: `new-vantage-co-ltd-001`
- Check migration was run
- Query: `SELECT * FROM test_rooms WHERE company_id = 'new-vantage-co-ltd-001';`

**GOC fields not saving?**
- Check schema updated: `\d prescriptions`
- Verify all indexes created
- Check for TypeScript type errors

---

## 📊 Database Quick Queries

```sql
-- View admin user
SELECT id, email, role, company_id FROM users 
WHERE email = 'admin@newvantageco.com';

-- View company details
SELECT * FROM companies 
WHERE id = 'new-vantage-co-ltd-001';

-- View test rooms
SELECT * FROM test_rooms 
WHERE company_id = 'new-vantage-co-ltd-001';

-- Check GOC compliance
SELECT first_name, last_name, goc_registration_number, 
       goc_registration_expiry, cpd_completed 
FROM users 
WHERE company_id = 'new-vantage-co-ltd-001';

-- Recent prescriptions with GOC fields
SELECT id, test_room_name, prescriber_goc_number, 
       od_visual_acuity_aided, created_at
FROM prescriptions
WHERE company_id = 'new-vantage-co-ltd-001'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ System Status

- ✅ Database migrated
- ✅ Company registered  
- ✅ Admin user created
- ✅ Password set
- ✅ Test rooms created
- ✅ API routes active
- ✅ GOC compliance enabled
- ✅ British standards implemented

**Ready to use! Login and start prescribing.**

---

**Last Updated**: October 29, 2025
**System**: ILS v2.0 - British GOC Compliant
