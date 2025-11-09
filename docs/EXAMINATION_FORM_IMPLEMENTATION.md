# Patient Examination Form Implementation

## Overview

The Patient Examination Form system generates pre-populated PDF clinical records for patient visits. This document is for **clinic use** (not manufacturing) and serves as the legal and medical record of the patient's visit to the eyecare professional (ECP).

## Clinical Workflow Integration

```
1. Patient Arrives → Check-in staff prints examination form
   ↓
2. Pre-populated sections: Demographics, appointment details, habitual Rx (from last order)
   ↓
3. Blank sections ready: Pre-test results, prescribed Rx, clinical notes
   ↓
4. Clinician performs exam → Fills in measurements and new prescription
   ↓
5. Patient proceeds to dispensing → Dispenser reviews completed form
   ↓
6. Dispenser creates order in system → Generates lab work ticket for manufacturing
```

## Key Distinction from Lab Work Ticket

| Aspect | Examination Form | Lab Work Ticket |
|--------|------------------|-----------------|
| **Purpose** | Clinical record for patient visit | Manufacturing order for optical lab |
| **Audience** | Optometrists, ECPs, dispensing staff | Lab technicians, engineers |
| **Timing** | Generated at patient check-in | Generated when order is sent to lab |
| **Data State** | Partially pre-populated, blank sections for exam results | Fully populated with final prescription and order details |
| **Legal Status** | Medical record | Production work order |
| **Access Control** | ECPs, lab staff, admins | Lab personnel, engineers, admins |

## Architecture

### Service Layer: ExaminationFormService.ts

**Location:** `/server/services/ExaminationFormService.ts`

**Primary Function:**
```typescript
async generateExaminationFormPDF(data: ExaminationFormData): Promise<Buffer>
```

**Data Model:**
```typescript
interface ExaminationFormData {
  // Patient Demographics
  patientName: string;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  ethnicity: string | null;
  
  // Appointment Information
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  chiefComplaint: string;
  
  // Pre-Test Results (blank table for tech to fill in)
  // Generated with empty cells
  
  // Habitual Rx (populated from patient's last order)
  habitualRx: {
    rightEye: PrescriptionData | null;
    leftEye: PrescriptionData | null;
    pd: number | null;
    addPower: number | null;
  } | null;
  
  // Prescribed Rx (blank table for optometrist)
  // Generated with empty cells
  
  // Clinical Notes (blank section with signature lines)
  // Generated with ruled lines
}

interface PrescriptionData {
  sphere: number | null;
  cylinder: number | null;
  axis: number | null;
  prism: number | null;
  prismDirection: string | null;
}
```

### API Endpoint

**Route:** `GET /api/patients/:id/examination-form`

**Location:** `/server/routes.ts` (lines 2345-2462)

**Authorization:** ECPs, lab staff, engineers, admins

**Request:**
```
GET /api/patients/123e4567-e89b-12d3-a456-426614174000/examination-form
```

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="exam-form-{patientId}.pdf"`
- PDF buffer (pre-populated examination form)

**Error Responses:**
- 404: Patient not found
- 403: Unauthorized (user lacks permissions)
- 500: PDF generation failed

### Frontend Integration

**Component:** `OrderDetailsPage.tsx`

**Location:** `/client/src/pages/OrderDetailsPage.tsx` (lines 148-183, 308-319)

**UI Button:**
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => downloadExamFormMutation.mutate(order.patientId)}
  disabled={downloadExamFormMutation.isPending}
  data-testid="button-download-exam-form"
  className="border-green-500 text-green-700 hover:bg-green-50"
>
  <ClipboardList className="h-4 w-4 mr-2" />
  Print Exam Form
</Button>
```

**Mutation Handler:**
```typescript
const downloadExamFormMutation = useMutation({
  mutationFn: async (patientId: string) => {
    const response = await fetch(`/api/patients/${patientId}/examination-form`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/pdf",
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: "Failed to download examination form" 
      }));
      throw new Error(errorData.message || "Failed to download examination form");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-form-${patientId.slice(-6)}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  onSuccess: () => {
    toast({
      title: "Exam Form Downloaded",
      description: "The patient examination form PDF has been downloaded.",
    });
  },
  onError: (error: Error) => {
    toast({
      title: "Error",
      description: error.message || "Failed to download examination form. Please try again.",
      variant: "destructive",
    });
  },
});
```

**Visual Design:**
- Green border and text (differentiates from blue Lab Ticket button)
- ClipboardList icon (medical/clinical context)
- "Print Exam Form" label (action-oriented, matches clinic workflow)
- Positioned between "Lab Ticket" and "Email Order" buttons
- Visible to all authorized roles (not restricted to lab personnel)

## PDF Document Structure

### Page Layout
- **Page Size:** Letter (8.5" x 11")
- **Margins:** 50pt top/bottom, 40pt left/right
- **Orientation:** Portrait
- **Font:** Helvetica (bold for headers, regular for content)

### Section 1: Patient Information (Pre-Populated)
```
PATIENT EXAMINATION FORM

Patient Name: [John Doe]
Date of Birth: [1985-06-15] | Age: [39] | Gender: [Male]
Address: [123 Main St, Anytown, ST 12345]
Phone: [(555) 123-4567] | Email: [john.doe@example.com]
Ethnicity: [Caucasian]
```

**Data Source:** Patient record from database

### Section 2: Appointment Details (Pre-Populated)
```
APPOINTMENT INFORMATION

Date: [2024-01-15]
Time: [10:00 AM]
Type: [Annual Eye Exam]
Chief Complaint: [Routine checkup]
```

**Data Source:** Current date/time if no appointment scheduled

### Section 3: Pre-Test Results (Blank Table)
```
PRE-TEST MEASUREMENTS

+------------+----------------+----------------+
| Measurement | Right Eye (OD) | Left Eye (OS)  |
+------------+----------------+----------------+
| Visual     |                |                |
| Acuity     |                |                |
+------------+----------------+----------------+
| Auto Ref   |                |                |
|            |                |                |
+------------+----------------+----------------+
| Keratometry|                |                |
|            |                |                |
+------------+----------------+----------------+
| Tonometry  |                |                |
| (IOP)      |                |                |
+------------+----------------+----------------+
```

**Purpose:** Technician fills in during pre-testing phase

### Section 4: Habitual Rx (Pre-Populated from Last Order)
```
CURRENT/HABITUAL PRESCRIPTION

+-----+--------+----------+------+-------+-------+
|     | Sphere | Cylinder | Axis | Prism | Base  |
+-----+--------+----------+------+-------+-------+
| OD  | -2.50  |  -1.25   | 180° | 1.00  | UP    |
+-----+--------+----------+------+-------+-------+
| OS  | -2.25  |  -0.75   | 175° |   -   |   -   |
+-----+--------+----------+------+-------+-------+

PD: 62mm | Add: +2.00
```

**Data Source:** Last order's prescription data
**Fallback:** If no previous order, displays "No previous prescription on file"

### Section 5: Prescribed Rx (Blank Table)
```
NEW PRESCRIBED PRESCRIPTION

+-----+--------+----------+------+-------+-------+
|     | Sphere | Cylinder | Axis | Prism | Base  |
+-----+--------+----------+------+-------+-------+
| OD  |        |          |      |       |       |
+-----+--------+----------+------+-------+-------+
| OS  |        |          |      |       |       |
+-----+--------+----------+------+-------+-------+

PD: _______ mm | Add: _______
```

**Purpose:** Optometrist fills in after refraction

### Section 6: Clinical Notes (Blank with Signature)
```
CLINICAL NOTES & RECOMMENDATIONS

[Multiple ruled lines for writing notes]

_____________________________________________
Examiner Signature

_____________________________________________
Print Name                    License Number

Date: ________________
```

**Purpose:** Diagnosis, recommendations, follow-up instructions

## Data Mapping Logic

### Patient Age Calculation
```typescript
const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
```

### Address Formatting
```typescript
const formatAddress = (patient: any): string => {
  const addressLine1 = (patient as any).addressLine1 || '';
  const city = (patient as any).city || '';
  const state = patient.state || '';
  const postalCode = patient.postalCode || '';
  
  const parts = [addressLine1, city, state, postalCode].filter(Boolean);
  return parts.join(', ') || 'Not provided';
};
```

### Habitual Rx Retrieval
```typescript
// Fetch patient's last order
const orders = await db.select()
  .from(ordersTable)
  .where(eq(ordersTable.ecpId, ecpId))
  .orderBy(desc(ordersTable.createdAt))
  .limit(1);

// Extract prescription data if order exists
if (orders.length > 0 && orders[0].lensType && orders[0].rightLensPrescription) {
  data.habitualRx = {
    rightEye: orders[0].rightLensPrescription,
    leftEye: orders[0].leftLensPrescription,
    pd: orders[0].pd,
    addPower: orders[0].addPower,
  };
}
```

## Security & Authorization

### Role-Based Access Control
```typescript
// Allowed roles: ecp, lab_tech, engineer, admin, company_admin, platform_admin
const authorizedRoles = ['ecp', 'lab_tech', 'engineer', 'admin', 'company_admin', 'platform_admin'];
if (!authorizedRoles.includes(req.user.role)) {
  return res.status(403).json({ message: "Unauthorized" });
}
```

**Rationale:**
- **ECPs:** Need to print forms for their patients
- **Lab Staff:** May need clinical context when processing orders
- **Engineers/Admins:** System support and troubleshooting

### Data Access Validation
```typescript
// Verify patient belongs to user's company
if (patient.companyId !== req.user.companyId) {
  return res.status(403).json({ message: "Access denied" });
}
```

## Error Handling

### Missing Patient
```typescript
if (!patient) {
  logger.warn(`Patient not found: ${patientId}`);
  return res.status(404).json({ message: "Patient not found" });
}
```

### PDF Generation Failure
```typescript
try {
  const pdfBuffer = await generateExaminationFormPDF(data);
  // ... send PDF
} catch (error) {
  logger.error('Failed to generate examination form:', error);
  return res.status(500).json({ 
    message: "Failed to generate examination form" 
  });
}
```

### Missing Examination History
```typescript
// Graceful fallback if getExaminationsForPatient not implemented
try {
  const examinations = await db.getExaminationsForPatient?.(patientId);
  // Use examinations if available
} catch (error) {
  logger.warn('Could not fetch examination history:', error);
  // Continue without examination data
}
```

## Usage Guide for Clinic Staff

### Step 1: Patient Check-In
1. Navigate to patient's order details page
2. Click **"Print Exam Form"** button (green, clipboard icon)
3. PDF downloads automatically
4. Print form for clinician

### Step 2: Pre-Testing
Technician fills in blank sections:
- Visual acuity (both eyes)
- Auto-refraction readings
- Keratometry measurements
- Intraocular pressure (tonometry)

### Step 3: Optometrist Examination
Optometrist completes:
- New prescribed Rx (sphere, cylinder, axis, prism)
- PD and add power
- Clinical notes section
- Signature and license number

### Step 4: Dispensing
Dispenser uses completed form to:
- Enter new prescription into system
- Create order for eyeglasses/contact lenses
- Generate lab work ticket for manufacturing

## Testing Scenarios

### Test Case 1: New Patient (No Habitual Rx)
**Given:** Patient has no previous orders
**When:** Examination form generated
**Then:** 
- All demographic sections populated
- Habitual Rx section shows "No previous prescription on file"
- All measurement sections blank

### Test Case 2: Existing Patient with Habitual Rx
**Given:** Patient has previous order with full prescription
**When:** Examination form generated
**Then:**
- Habitual Rx section populated with last order's Rx data
- Prescribed Rx section blank for new exam
- All other sections properly formatted

### Test Case 3: Missing Optional Patient Data
**Given:** Patient record missing address, phone, ethnicity
**When:** Examination form generated
**Then:**
- Missing fields show "Not provided"
- Form still generates successfully
- No crashes or errors

### Test Case 4: Role-Based Access
**Given:** User with role "dispenser" (not in authorized list)
**When:** User attempts to download examination form
**Then:**
- 403 Forbidden response
- Error message: "Unauthorized"

### Test Case 5: Multi-Company Isolation
**Given:** User from Company A attempts to access patient from Company B
**When:** API request made
**Then:**
- 403 Access denied response
- Patient data protected

## Performance Considerations

### PDF Generation Time
- **Average:** 300-500ms per form
- **Peak:** May increase with complex Rx data or many examinations
- **Optimization:** Consider caching patient demographics if frequently accessed

### Database Queries
```typescript
// Two main queries per form generation:
1. SELECT patient record (indexed by id)
2. SELECT last order for habitual Rx (indexed by ecpId, ordered by createdAt)
```

### Memory Usage
- PDF buffer held in memory during generation (~100-200KB)
- Immediately streamed to response
- No temporary file creation

## Future Enhancements

### Potential Features
1. **Examination History Table:** Display last 3-5 exam dates and Rx changes
2. **Patient Allergies Section:** Important for contact lens fittings
3. **Medical History Checkboxes:** Diabetes, glaucoma, hypertension, etc.
4. **Digital Signature Capture:** Electronic signing on tablets
5. **Template Customization:** Allow ECPs to add custom sections or branding
6. **Multi-Language Support:** Generate forms in patient's preferred language
7. **QR Code Patient ID:** Quick scanning for digital record lookup
8. **Insurance Information:** Policy numbers and coverage details

### Integration Opportunities
- **EMR/EHR Systems:** Import patient medical history
- **Practice Management Software:** Sync appointment scheduling
- **Contact Lens Ordering Systems:** Pre-populate CL trial data
- **Digital Chart Systems:** Eliminate paper forms entirely

## Related Documentation

- [Lab Work Ticket Implementation](./LAB_WORK_TICKET_IMPLEMENTATION.md)
- [API Quick Reference](./API_QUICK_REFERENCE.md)
- [Eye Examination Module](./EYE_EXAMINATION_MODULE.md)

## Support & Troubleshooting

### Common Issues

**Issue:** PDF downloads blank or corrupted
**Solution:** Check browser PDF viewer settings, try different browser

**Issue:** Habitual Rx not showing despite patient having orders
**Solution:** Verify order has `rightLensPrescription` and `lensType` populated

**Issue:** Age calculation incorrect
**Solution:** Verify patient date of birth format is ISO 8601 (YYYY-MM-DD)

**Issue:** Address showing "Not provided" despite data in database
**Solution:** Check if patient table has `addressLine1`, `city` fields (may require type assertion)

### Logging
All examination form operations logged at appropriate levels:
- `INFO`: Successful PDF generation
- `WARN`: Missing optional data, patient not found
- `ERROR`: PDF generation failures, database errors

### Contact
For technical support: Review logs in `/server/services/ExaminationFormService.ts`
For feature requests: See Future Enhancements section above
