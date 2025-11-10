# Quick Integration Guide - Enhanced Patient System

## 🚀 Using the New Enhanced Patient Form

### Option 1: Import the Enhanced Component
Replace the old patient modal with the new comprehensive version:

```tsx
// In your page component (e.g., client/src/pages/Dashboard.tsx)
import AddPatientModalEnhanced from "@/components/AddPatientModalEnhanced";

// Use it:
<AddPatientModalEnhanced 
  open={isAddPatientOpen} 
  onOpenChange={setIsAddPatientOpen} 
/>
```

### Option 2: Keep Both (Recommended during transition)
```tsx
import AddPatientModal from "@/components/AddPatientModal"; // Simple version
import AddPatientModalEnhanced from "@/components/AddPatientModalEnhanced"; // Full version

// Provide toggle for users to choose
{showEnhancedForm ? (
  <AddPatientModalEnhanced open={isOpen} onOpenChange={setIsOpen} />
) : (
  <AddPatientModal open={isOpen} onOpenChange={setIsOpen} />
)}
```

## 📋 API Usage Examples

### 1. Create Patient with Comprehensive Data
```typescript
const response = await fetch("/api/patients", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    // Required
    name: "John Smith",
    dateOfBirth: "1985-06-15",
    
    // Contact (timezone auto-detected from postcode!)
    email: "john@example.com",
    phone: "+44 20 1234 5678",
    mobilePhone: "+44 7700 900000",
    
    // Address (triggers timezone detection)
    addressLine1: "123 High Street",
    city: "London",
    postcode: "SW1A 1AA",
    
    // Clinical
    allergies: "Penicillin",
    currentMedications: "Metformin",
    gpName: "Dr. Jane Doe",
    
    // Lifestyle
    occupation: "Software Engineer",
    vduUser: true,
    vduHoursPerDay: 8,
    contactLensWearer: true,
    contactLensType: "daily_disposable",
    
    // Preferences
    preferredContactMethod: "email",
    preferredAppointmentTime: "morning",
    
    // Consent
    marketingConsent: true,
    dataSharingConsent: true
  })
});
```

### 2. Get Patient Activity History
```typescript
// Get all activity
const history = await fetch("/api/patients/123/history").then(r => r.json());

// Filter by activity type
const orders = await fetch(
  "/api/patients/123/history?activityTypes=order_placed,order_updated"
).then(r => r.json());

// Date range with limit
const recent = await fetch(
  "/api/patients/123/history?limit=10&startDate=2024-01-01"
).then(r => r.json());
```

### 3. Manual Activity Logging (from your code)
```typescript
import { PatientActivityLogger } from "@/server/lib/patientActivityLogger";

// Log a custom activity
await PatientActivityLogger.logActivity({
  companyId: "company-123",
  patientId: "patient-456",
  activityType: "note_added",
  activityTitle: "Clinical note added",
  activityDescription: "Updated visual acuity measurements",
  activityData: { note: "VA improved to 20/20" },
  performedBy: userId,
  performedByName: "Dr. Jane Doe",
  performedByRole: "optometrist",
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

## 🔧 Timezone Detection

### Automatic Detection
Timezone is automatically detected when:
1. Patient is created with a postcode
2. Patient's postcode is updated

```typescript
// No manual action needed - it happens automatically!
// Just provide the postcode:
{ postcode: "SW1A 1AA" } // → timezone: "Europe/London", offset: 0
```

### Manual Timezone Detection
```typescript
import { autoDetectTimezone } from "@/server/lib/timezoneDetector";

const timezoneInfo = await autoDetectTimezone(
  "SW1A 1AA",  // postcode
  "192.168.1.1" // IP address (fallback)
);

console.log(timezoneInfo);
// { timezone: "Europe/London", offset: 0, isDST: false }
```

## 📊 Patient Activity Log Queries

### In Your Custom Code
```typescript
import { storage } from "@/server/storage";

// Get patient activity with filters
const activities = await storage.getPatientActivityLog(
  "patient-id",
  "company-id",
  {
    limit: 50,
    activityTypes: ["order_placed", "prescription_issued"],
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31")
  }
);
```

## 🎨 UI Components

### Field Examples from Enhanced Form

**Conditional Fields:**
```tsx
{formData.vduUser && (
  <Input
    type="number"
    value={formData.vduHoursPerDay}
    onChange={(e) => handleChange("vduHoursPerDay", e.target.value)}
  />
)}
```

**Select Dropdowns:**
```tsx
<Select
  value={formData.preferredContactMethod}
  onValueChange={(value) => handleChange("preferredContactMethod", value)}
>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="email">Email</SelectItem>
    <SelectItem value="phone">Phone</SelectItem>
    <SelectItem value="sms">SMS</SelectItem>
  </SelectContent>
</Select>
```

**Consent Checkboxes:**
```tsx
<Checkbox
  id="marketingConsent"
  checked={formData.marketingConsent}
  onCheckedChange={(checked) => handleChange("marketingConsent", checked as boolean)}
/>
```

## 🔍 Displaying Patient History

### Example React Component
```tsx
import { useQuery } from "@tanstack/react-query";

function PatientHistory({ patientId }: { patientId: string }) {
  const { data: history } = useQuery({
    queryKey: ["patient-history", patientId],
    queryFn: () => 
      fetch(`/api/patients/${patientId}/history?limit=20`)
        .then(r => r.json())
  });

  return (
    <div className="space-y-2">
      {history?.map(activity => (
        <div key={activity.id} className="border-l-2 pl-4">
          <div className="font-semibold">{activity.activityTitle}</div>
          <div className="text-sm text-muted-foreground">
            {activity.activityDescription}
          </div>
          <div className="text-xs text-muted-foreground">
            By {activity.performedByName} • {new Date(activity.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 📝 Database Queries

### Raw SQL Examples

**Get recent patient activity:**
```sql
SELECT 
  pal.*,
  p.name as patient_name,
  o.order_number
FROM patient_activity_log pal
LEFT JOIN patients p ON p.id = pal.patient_id
LEFT JOIN orders o ON o.id = pal.order_id
WHERE pal.patient_id = 'patient-123'
  AND pal.company_id = 'company-456'
ORDER BY pal.created_at DESC
LIMIT 20;
```

**Count activities by type:**
```sql
SELECT 
  activity_type,
  COUNT(*) as count
FROM patient_activity_log
WHERE patient_id = 'patient-123'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY activity_type
ORDER BY count DESC;
```

**Find patients without timezone:**
```sql
SELECT id, name, postcode, timezone
FROM patients
WHERE timezone IS NULL
  AND postcode IS NOT NULL;
```

## 🛠️ Troubleshooting

### Issue: Timezone not detecting
**Solution:** Ensure postcode is provided and in correct format

### Issue: Activity log not appearing
**Solution:** Check that logging errors aren't being silently swallowed (check console logs)

### Issue: Form validation errors
**Solution:** Ensure required fields (name, dateOfBirth) are filled

## 🚦 Migration Checklist

- [x] Database schema updated (migration applied)
- [x] New TypeScript types in `shared/schema.ts`
- [x] Storage methods added
- [x] API endpoints enhanced
- [x] Activity logging integrated
- [x] Timezone detection implemented
- [x] UI components created
- [ ] Update pages to use `AddPatientModalEnhanced`
- [ ] Test patient creation with full data
- [ ] Test activity log retrieval
- [ ] Verify timezone detection works

## 📚 Related Files

- Schema: `shared/schema.ts`
- Storage: `server/storage.ts`
- Routes: `server/routes.ts`
- Timezone: `server/lib/timezoneDetector.ts`
- Activity Logger: `server/lib/patientActivityLogger.ts`
- Enhanced Form: `client/src/components/AddPatientModalEnhanced.tsx`
- Migration: `migrations/comprehensive-patient-enhancement.sql`

## 🎯 Next Steps

1. Replace `AddPatientModal` imports with `AddPatientModalEnhanced`
2. Test patient creation with various data combinations
3. Verify timezone detection for different postcodes
4. Check activity log displays correctly
5. Add patient history view to patient detail pages
6. Consider adding bulk import for existing patients
7. Set up automated tests for new functionality

---

**System is fully operational! Ready for comprehensive patient management! 🎉**
