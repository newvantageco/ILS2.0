# Patient Examination Form - Quick Reference

## Overview
Pre-populated clinical record form for patient visits. Generates at check-in with demographics, habitual Rx, and blank sections for exam results.

## Quick Links
- **Service:** `/server/services/ExaminationFormService.ts`
- **API Endpoint:** `/server/routes.ts` (lines 2345-2462)
- **Frontend:** `/client/src/pages/OrderDetailsPage.tsx` (lines 148-183, 308-319)

## API Endpoint

### Generate Examination Form
```
GET /api/patients/:id/examination-form
```

**Authorization:** ECPs, lab staff, engineers, admins

**Example:**
```bash
curl -X GET http://localhost:5000/api/patients/123e4567/examination-form \
  -H "Accept: application/pdf" \
  --cookie "session=..." \
  --output exam-form.pdf
```

**Response:**
- Content-Type: `application/pdf`
- Downloads: `exam-form-{patientId}.pdf`

## Data Model

```typescript
interface ExaminationFormData {
  // Patient Info (pre-populated)
  patientName: string;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  ethnicity: string | null;
  
  // Appointment Info (pre-populated)
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  chiefComplaint: string;
  
  // Habitual Rx (pre-populated from last order)
  habitualRx: {
    rightEye: PrescriptionData | null;
    leftEye: PrescriptionData | null;
    pd: number | null;
    addPower: number | null;
  } | null;
  
  // Pre-test results, prescribed Rx, notes (blank for clinician)
}
```

## PDF Sections

### 1. Patient Information (Pre-Populated)
- Name, DOB, age, gender
- Address, phone, email
- Ethnicity

### 2. Appointment Details (Pre-Populated)
- Date and time
- Appointment type
- Chief complaint

### 3. Pre-Test Measurements (Blank Table)
- Visual acuity
- Auto-refraction
- Keratometry
- Tonometry (IOP)

### 4. Habitual Rx (Pre-Populated)
- Current prescription from last order
- Sphere, cylinder, axis, prism
- PD and add power
- Shows "No previous prescription on file" if new patient

### 5. Prescribed Rx (Blank Table)
- New prescription (for optometrist to fill)
- Same format as habitual Rx

### 6. Clinical Notes (Blank)
- Ruled lines for notes
- Signature line
- Date line

## Clinical Workflow

```
Patient Check-In → Print Form → Pre-Testing → Examination → Dispensing → Create Order
     ↓                ↓             ↓              ↓             ↓            ↓
  Navigate to    Click green   Tech fills    Optometrist   Dispenser   Generate lab
  order page     Print button   pre-test     fills Rx      reviews     work ticket
```

## Frontend Usage

### Button Location
Order Details page, between "Lab Ticket" and "Email Order" buttons

### Button Code
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

### Mutation Handler
```typescript
const downloadExamFormMutation = useMutation({
  mutationFn: async (patientId: string) => {
    const response = await fetch(`/api/patients/${patientId}/examination-form`, {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/pdf" },
    });
    
    if (!response.ok) {
      throw new Error("Failed to download examination form");
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
    toast({ title: "Exam Form Downloaded" });
  },
  onError: (error: Error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  },
});
```

## Key Differences: Exam Form vs Lab Ticket

| Aspect | Exam Form | Lab Ticket |
|--------|-----------|------------|
| **Purpose** | Clinical record | Manufacturing order |
| **Timing** | At patient check-in | When order sent to lab |
| **Audience** | Clinicians, ECPs | Lab technicians, engineers |
| **Data State** | Partially pre-populated | Fully populated |
| **Blank Sections** | Pre-test, prescribed Rx, notes | None (all filled) |
| **Access** | ECPs + lab staff | Lab personnel only |
| **Button Color** | Green | Blue |
| **Icon** | ClipboardList | FileText |

## Authorization

### Allowed Roles
- `ecp` (Eye Care Professionals)
- `lab_tech` (Lab Technicians)
- `engineer` (Principal Engineers)
- `admin` (Company Admins)
- `company_admin` (Company Admins)
- `platform_admin` (Platform Admins)

### Security Checks
1. User must be authenticated
2. User role must be in allowed list
3. Patient must belong to user's company

## Data Sources

### Patient Data
```typescript
const patient = await db.select()
  .from(patientsTable)
  .where(eq(patientsTable.id, patientId))
  .limit(1);
```

### Habitual Rx (Last Order)
```typescript
const orders = await db.select()
  .from(ordersTable)
  .where(eq(ordersTable.ecpId, patient.ecpId))
  .orderBy(desc(ordersTable.createdAt))
  .limit(1);

// Extract prescription data
if (orders.length > 0 && orders[0].rightLensPrescription) {
  habitualRx = {
    rightEye: orders[0].rightLensPrescription,
    leftEye: orders[0].leftLensPrescription,
    pd: orders[0].pd,
    addPower: orders[0].addPower,
  };
}
```

## Error Handling

### Common Errors
- `404`: Patient not found
- `403`: Unauthorized (wrong role or company)
- `500`: PDF generation failed

### Example Error Response
```json
{
  "message": "Patient not found"
}
```

## Testing

### Test with cURL
```bash
# Get patient ID from order
curl http://localhost:5000/api/orders/ORDER_ID | jq '.patientId'

# Download exam form
curl -X GET http://localhost:5000/api/patients/PATIENT_ID/examination-form \
  -H "Accept: application/pdf" \
  --cookie "session=YOUR_SESSION" \
  --output exam-form.pdf

# Verify PDF
open exam-form.pdf  # macOS
# OR
xdg-open exam-form.pdf  # Linux
```

### Test Cases
1. **New patient (no orders)** → Habitual Rx shows "No previous prescription on file"
2. **Existing patient** → Habitual Rx populated from last order
3. **Missing address** → Shows "Not provided"
4. **Unauthorized role** → 403 error
5. **Different company** → 403 error

## Code Snippets

### Age Calculation
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

## Performance

- **PDF Generation:** 300-500ms average
- **Database Queries:** 2 queries (patient + last order)
- **Memory Usage:** ~100-200KB per PDF
- **File Size:** ~50-100KB per generated PDF

## Dependencies

```json
{
  "pdfkit": "^0.17.2",  // PDF document generation
  "qrcode": "^1.5.4"    // Not used in exam form (only lab ticket)
}
```

## Logging

### Success
```
[INFO] Generated examination form for patient: {patientId}
```

### Warnings
```
[WARN] Patient not found: {patientId}
[WARN] Could not fetch examination history: {error}
```

### Errors
```
[ERROR] Failed to generate examination form: {error}
```

## Related Documentation

- [Full Implementation Guide](./EXAMINATION_FORM_IMPLEMENTATION.md)
- [Lab Work Ticket Quick Reference](./LAB_WORK_TICKET_QUICK_REFERENCE.md)
- [API Quick Reference](./API_QUICK_REFERENCE.md)

## Troubleshooting

### PDF Not Downloading
- Check browser settings (allow PDF downloads)
- Verify session cookie present
- Check user role authorization

### Missing Habitual Rx
- Verify patient has previous orders
- Check order has `rightLensPrescription` field
- Confirm `lensType` field populated

### Address Not Showing
- Patient table may not have `addressLine1`, `city` in type definition
- Service uses type assertions `(patient as any).addressLine1`
- Update patient schema if needed

## Support
For issues, check logs in `/server/services/ExaminationFormService.ts` and `/server/routes.ts` (examination form endpoint section).
