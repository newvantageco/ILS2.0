# ILS 2.0 Platform Data Fields Reference

## Complete Field Mapping: Migration Sources → Platform

**All fields available for BOTH new and migrated customers**

This document shows ALL data fields available in the ILS 2.0 platform. These same fields are used for:
- ✅ **New customers** creating records directly in ILS 2.0
- ✅ **Migrated customers** from Optix, Occuco, Acuity, and other platforms

---

## Patient Records

### Basic Information
| ILS 2.0 Field | Type | Optix Field | Occuco Field | Acuity Field | Notes |
|---------------|------|-------------|--------------|--------------|-------|
| `id` | UUID | - | - | - | Auto-generated |
| `customerNumber` | VARCHAR(20) | patient_number | PatientNumber | id | Unique identifier |
| `companyId` | UUID | - | - | - | Multi-tenant isolation |
| `name` | TEXT | first_name + last_name | FirstName + Surname | firstName + lastName | Full name |
| `dateOfBirth` | DATE | dob | DateOfBirth | birthDate | YYYY-MM-DD |
| `email` | VARCHAR | email | Email | email | |
| `phone` | VARCHAR(50) | phone | HomeNumber | phone | |
| `mobilePhone` | VARCHAR(50) | mobile | MobileNumber | cellPhone | |
| `workPhone` | VARCHAR(50) | work_phone | WorkNumber | workPhone | |

### Address Information
| ILS 2.0 Field | Type | Optix Field | Occuco Field | Acuity Field |
|---------------|------|-------------|--------------|--------------|
| `addressLine1` | VARCHAR(255) | address_1 | AddressLine1 | address |
| `addressLine2` | VARCHAR(255) | address_2 | AddressLine2 | address2 |
| `city` | VARCHAR(100) | city | Town | city |
| `county` | VARCHAR(100) | county | County | state |
| `postcode` | VARCHAR(20) | postcode | Postcode | zip |
| `country` | VARCHAR(100) | country | Country | country |
| `fullAddress` | JSONB | - | - | - | Structured address |

### NHS & Reference
| ILS 2.0 Field | Type | Optix Field | Occuco Field | Acuity Field |
|---------------|------|-------------|--------------|--------------|
| `nhsNumber` | VARCHAR | nhs_number | NHSNumber | - |
| `customerReferenceLabel` | TEXT | ref_label | ReferenceLabel | - |
| `customerReferenceNumber` | TEXT | ref_number | ReferenceNumber | refNumber |

### GP & Medical Professional Information
| ILS 2.0 Field | Type | Optix Field | Occuco Field | Acuity Field |
|---------------|------|-------------|--------------|--------------|
| `gpName` | VARCHAR(255) | gp_name | GPName | primaryCareProvider |
| `gpPractice` | VARCHAR(255) | gp_practice | GPSurgery | - |
| `gpAddress` | TEXT | gp_address | GPAddress | - |
| `gpPhone` | VARCHAR(50) | gp_phone | GPPhone | - |
| `previousOptician` | VARCHAR(255) | previous_optician | PreviousOptician | - |

### Emergency Contact
| ILS 2.0 Field | Type | Optix Field | Occuco Field | Acuity Field |
|---------------|------|-------------|--------------|--------------|
| `emergencyContactName` | VARCHAR(255) | emergency_name | EmergencyContactName | emergencyContact |
| `emergencyContactPhone` | VARCHAR(50) | emergency_phone | EmergencyContactPhone | emergencyPhone |
| `emergencyContactRelationship` | VARCHAR(100) | emergency_relationship | EmergencyRelationship | - |
| `emergencyContactEmail` | VARCHAR(255) | - | - | emergencyEmail |

### Medical History & Health
| ILS 2.0 Field | Type | Optix Field | Occuco Field | Acuity Field |
|---------------|------|-------------|--------------|--------------|
| `medicalHistory` | JSONB | medical_history | MedicalHistory | medicalHistory |
| `currentMedications` | TEXT | medications | CurrentMedications | medications |
| `allergies` | TEXT | allergies | Allergies | allergies |
| `familyOcularHistory` | TEXT | family_eye_history | FamilyOcularHistory | - |
| `systemicConditions` | JSONB | conditions | SystemicConditions | conditions |

### Lifestyle & Visual Requirements
| ILS 2.0 Field | Type | Optix Field | Occuco Field | Acuity Field |
|---------------|------|-------------|--------------|--------------|
| `occupation` | VARCHAR(255) | occupation | Occupation | occupation |
| `hobbies` | TEXT | hobbies | Hobbies | - |
| `vduUser` | BOOLEAN | computer_user | VDUUser | - |
| `vduHoursPerDay` | DECIMAL(4,1) | screen_hours | VDUHours | - |
| `drivingRequirement` | BOOLEAN | drives | DrivingRequirement | drives |
| `sportActivities` | TEXT | sports | SportActivities | - |
| `readingHabits` | TEXT | reading_habits | ReadingHabits | - |

### Contact Lens Information
| ILS 2.0 Field | Type | Optix Field | Occuco Field | Acuity Field |
|---------------|------|-------------|--------------|--------------|
| `contactLensWearer` | BOOLEAN | wears_contacts | ContactLensWearer | contactLenses |
| `contactLensType` | VARCHAR(100) | lens_type | ContactLensType | lensType |
| `contactLensBrand` | VARCHAR(100) | lens_brand | Brand | brand |
| `contactLensCompliance` | VARCHAR(50) | compliance | Compliance | - |

### Communication Preferences
| ILS 2.0 Field | Type | Available for New Customers | Migrated From |
|---------------|------|---------------------------|---------------|
| `preferredContactMethod` | VARCHAR(50) | ✅ Yes | Optix, Occuco |
| `preferredAppointmentTime` | VARCHAR(50) | ✅ Yes | Optix |
| `reminderPreference` | VARCHAR(50) | ✅ Yes | All platforms |

### Consent & Privacy
| ILS 2.0 Field | Type | Available for New Customers | Migrated From |
|---------------|------|---------------------------|---------------|
| `marketingConsent` | BOOLEAN | ✅ Yes | All platforms |
| `dataSharingConsent` | BOOLEAN | ✅ Yes | All platforms |
| `thirdPartyConsent` | BOOLEAN | ✅ Yes | Optix, Occuco |
| `researchConsent` | BOOLEAN | ✅ Yes | Occuco |

### Examination Schedule
| ILS 2.0 Field | Type | Available for New Customers | Migrated From |
|---------------|------|---------------------------|---------------|
| `lastExaminationDate` | TIMESTAMP | ✅ Yes | All platforms |
| `nextExaminationDue` | TIMESTAMP | ✅ Yes | All platforms |
| `recallSchedule` | VARCHAR(50) | ✅ Yes | Optix, Occuco |

### Financial & Insurance
| ILS 2.0 Field | Type | Available for New Customers | Migrated From |
|---------------|------|---------------------------|---------------|
| `insuranceProvider` | VARCHAR(255) | ✅ Yes | All platforms |
| `insurancePolicyNumber` | VARCHAR(100) | ✅ Yes | All platforms |
| `nhsExemption` | BOOLEAN | ✅ Yes | Optix, Occuco |
| `nhsExemptionType` | VARCHAR(100) | ✅ Yes | Optix, Occuco |

### Patient Status & Notes
| ILS 2.0 Field | Type | Available for New Customers | Migrated From |
|---------------|------|---------------------------|---------------|
| `status` | VARCHAR(50) | ✅ Yes | All platforms |
| `vipPatient` | BOOLEAN | ✅ Yes | Optix, Occuco |
| `patientNotes` | TEXT | ✅ Yes | All platforms |
| `internalNotes` | TEXT | ✅ Yes | All platforms |

### Import Tracking (Migrated Records Only)
| ILS 2.0 Field | Type | Purpose | Value for New Records |
|---------------|------|---------|----------------------|
| `externalId` | VARCHAR(255) | Original patient ID from legacy system | NULL |
| `importSource` | VARCHAR(100) | Source platform (optix, occuco, acuity) | NULL |
| `importJobId` | UUID | Reference to migration job | NULL |
| `importedAt` | TIMESTAMP | When record was imported | NULL |

---

## Eye Examination Records

### Basic Information
| ILS 2.0 Field | Type | Available for All | Notes |
|---------------|------|-------------------|-------|
| `id` | UUID | ✅ | Auto-generated |
| `companyId` | UUID | ✅ | Multi-tenant isolation |
| `patientId` | UUID | ✅ | Links to patient |
| `ecpId` | UUID | ✅ | Eye Care Professional |
| `examinationDate` | TIMESTAMP | ✅ | Date/time of exam |
| `status` | ENUM | ✅ | in_progress, completed, cancelled |
| `reasonForVisit` | TEXT | ✅ | Chief complaint |

### Clinical Findings (All JSONB for flexibility)
| ILS 2.0 Field | Type | Contains | Available for All |
|---------------|------|----------|-------------------|
| `visualAcuity` | JSONB | Unaided, aided, pinhole VA for both eyes | ✅ |
| `refraction` | JSONB | Objective and subjective refraction | ✅ |
| `binocularVision` | JSONB | Cover test, motility, vergences | ✅ |
| `eyeHealth` | JSONB | Anterior and posterior segment findings | ✅ |
| `equipmentReadings` | JSONB | IOP, keratometry, etc. | ✅ |
| `ophthalmoscopy` | JSONB | Fundus examination findings | ✅ |
| `slitLamp` | JSONB | Anterior segment examination | ✅ |
| `tonometry` | JSONB | IOP measurements | ✅ |
| `additionalTests` | JSONB | Visual fields, OCT, etc. | ✅ |

### NHS & Compliance
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `gosFormType` | TEXT | ✅ |
| `nhsVoucherCode` | TEXT | ✅ |
| `finalized` | BOOLEAN | ✅ |

### Notes
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `notes` | TEXT | ✅ |

### Import Tracking
| ILS 2.0 Field | Type | Purpose | Value for New Records |
|---------------|------|---------|----------------------|
| `externalId` | VARCHAR(255) | Original exam ID | NULL |
| `importSource` | VARCHAR(100) | Source platform | NULL |
| `importJobId` | UUID | Migration job reference | NULL |
| `importedAt` | TIMESTAMP | Import timestamp | NULL |

---

## Prescription Records

### Basic Information
| ILS 2.0 Field | Type | Available for All | Notes |
|---------------|------|-------------------|-------|
| `id` | UUID | ✅ | Auto-generated |
| `companyId` | UUID | ✅ | Multi-tenant isolation |
| `patientId` | UUID | ✅ | Links to patient |
| `ecpId` | UUID | ✅ | Prescriber |
| `examinationId` | UUID | ✅ | Links to examination |
| `issueDate` | TIMESTAMP | ✅ | |
| `expiryDate` | TIMESTAMP | ✅ | |

### Right Eye (OD) Prescription Values
| ILS 2.0 Field | Type | Range | Available for All |
|---------------|------|-------|-------------------|
| `odSphere` | DECIMAL(6,3) | -20.00 to +20.00 | ✅ |
| `odCylinder` | DECIMAL(6,3) | -6.00 to +6.00 | ✅ |
| `odAxis` | INTEGER | 0 to 180 | ✅ |
| `odAdd` | DECIMAL(4,2) | +0.50 to +4.00 | ✅ |

### Left Eye (OS) Prescription Values
| ILS 2.0 Field | Type | Range | Available for All |
|---------------|------|-------|-------------------|
| `osSphere` | DECIMAL(6,3) | -20.00 to +20.00 | ✅ |
| `osCylinder` | DECIMAL(6,3) | -6.00 to +6.00 | ✅ |
| `osAxis` | INTEGER | 0 to 180 | ✅ |
| `osAdd` | DECIMAL(4,2) | +0.50 to +4.00 | ✅ |

### Pupillary Distance (PD)
| ILS 2.0 Field | Type | Range | Available for All |
|---------------|------|-------|-------------------|
| `pd` | DECIMAL(4,1) | 50.0 to 75.0 | ✅ (legacy) |
| `pdRight` | DECIMAL(4,1) | 25.0 to 40.0 | ✅ |
| `pdLeft` | DECIMAL(4,1) | 25.0 to 40.0 | ✅ |
| `binocularPd` | DECIMAL(4,1) | 50.0 to 75.0 | ✅ |
| `nearPd` | DECIMAL(4,1) | 48.0 to 70.0 | ✅ |

### Prism Prescription (British Standards)
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `odPrismHorizontal` | DECIMAL(4,2) | ✅ |
| `odPrismVertical` | DECIMAL(4,2) | ✅ |
| `odPrismBase` | VARCHAR(20) | ✅ (IN, OUT, UP, DOWN) |
| `osPrismHorizontal` | DECIMAL(4,2) | ✅ |
| `osPrismVertical` | DECIMAL(4,2) | ✅ |
| `osPrismBase` | VARCHAR(20) | ✅ (IN, OUT, UP, DOWN) |

### Visual Acuity (British Standards)
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `odVisualAcuityUnaided` | VARCHAR(20) | ✅ |
| `odVisualAcuityAided` | VARCHAR(20) | ✅ |
| `odVisualAcuityPinhole` | VARCHAR(20) | ✅ |
| `osVisualAcuityUnaided` | VARCHAR(20) | ✅ |
| `osVisualAcuityAided` | VARCHAR(20) | ✅ |
| `osVisualAcuityPinhole` | VARCHAR(20) | ✅ |
| `binocularVisualAcuity` | VARCHAR(20) | ✅ |

### Near Vision
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `odNearVision` | VARCHAR(20) | ✅ |
| `osNearVision` | VARCHAR(20) | ✅ |
| `binocularNearVision` | VARCHAR(20) | ✅ |

### GOC Compliance & Prescriber
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `gocCompliant` | BOOLEAN | ✅ |
| `prescriberGocNumber` | VARCHAR(50) | ✅ |
| `prescriberName` | VARCHAR(255) | ✅ |
| `prescriberQualifications` | VARCHAR(255) | ✅ |
| `prescriberGocType` | VARCHAR(50) | ✅ |
| `testRoomName` | VARCHAR(100) | ✅ |

### Additional Details
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `backVertexDistance` | DECIMAL(4,1) | ✅ |
| `prescriptionType` | VARCHAR(50) | ✅ (distance, reading, bifocal, varifocal) |
| `dispensingNotes` | TEXT | ✅ |

### Import Tracking
| ILS 2.0 Field | Type | Purpose | Value for New Records |
|---------------|------|---------|----------------------|
| `externalId` | VARCHAR(255) | Original Rx ID | NULL |
| `importSource` | VARCHAR(100) | Source platform | NULL |
| `importJobId` | UUID | Migration job reference | NULL |
| `importedAt` | TIMESTAMP | Import timestamp | NULL |

---

## Dispense Records

### Basic Information
| ILS 2.0 Field | Type | Available for All | Notes |
|---------------|------|-------------------|-------|
| `id` | UUID | ✅ | Auto-generated |
| `companyId` | UUID | ✅ | Multi-tenant isolation |
| `patientId` | UUID | ✅ | Links to patient |
| `orderId` | UUID | ✅ | Links to order |
| `prescriptionId` | UUID | ✅ | Links to prescription |
| `dispensedByUserId` | UUID | ✅ | Dispenser user ID |
| `dispenserName` | VARCHAR(255) | ✅ | Full name |
| `dispenserGocNumber` | VARCHAR(50) | ✅ | GOC registration |
| `dispenseDate` | TIMESTAMP | ✅ | When dispensed |
| `printedAt` | TIMESTAMP | ✅ | When printed |

### Signatures & Documentation
| ILS 2.0 Field | Type | Available for All | Notes |
|---------------|------|-------------------|-------|
| `patientSignature` | TEXT | ✅ | Base64 encoded |
| `dispenserSignature` | TEXT | ✅ | Base64 encoded |
| `specialInstructions` | TEXT | ✅ | |
| `aftercareProvided` | BOOLEAN | ✅ | Default: true |

### Metadata
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `metadata` | JSONB | ✅ |

### Import Tracking
| ILS 2.0 Field | Type | Purpose | Value for New Records |
|---------------|------|---------|----------------------|
| `externalId` | VARCHAR(255) | Original dispense ID | NULL |
| `importSource` | VARCHAR(100) | Source platform | NULL |
| `importJobId` | UUID | Migration job reference | NULL |
| `importedAt` | TIMESTAMP | Import timestamp | NULL |

---

## Lab Orders

### Basic Information
| ILS 2.0 Field | Type | Available for All | Notes |
|---------------|------|-------------------|-------|
| `id` | UUID | ✅ | Auto-generated |
| `companyId` | UUID | ✅ | Multi-tenant isolation |
| `patientId` | UUID | ✅ | Links to patient |
| `ecpId` | UUID | ✅ | Ordering ECP |
| `orderNumber` | TEXT | ✅ | Unique order number |
| `status` | ENUM | ✅ | pending, in_production, shipped, completed |
| `orderDate` | TIMESTAMP | ✅ | When ordered |
| `dueDate` | TIMESTAMP | ✅ | Expected completion |
| `completedAt` | TIMESTAMP | ✅ | Actual completion |

### Lens Specifications
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `lensType` | TEXT | ✅ |
| `lensMaterial` | TEXT | ✅ |
| `coating` | TEXT | ✅ |
| `frameType` | TEXT | ✅ |

### Tracking & Files
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `trackingNumber` | TEXT | ✅ |
| `traceFileUrl` | TEXT | ✅ |
| `shippedAt` | TIMESTAMP | ✅ |
| `notes` | TEXT | ✅ |

### Import Tracking
| ILS 2.0 Field | Type | Purpose | Value for New Records |
|---------------|------|---------|----------------------|
| `externalId` | VARCHAR(255) | Original order ID | NULL |
| `importSource` | VARCHAR(100) | Source platform | NULL |
| `importJobId` | UUID | Migration job reference | NULL |
| `importedAt` | TIMESTAMP | Import timestamp | NULL |

---

## Appointments

### Basic Information
| ILS 2.0 Field | Type | Available for All | Notes |
|---------------|------|-------------------|-------|
| `id` | UUID | ✅ | Auto-generated |
| `companyId` | UUID | ✅ | Multi-tenant isolation |
| `patientId` | UUID | ✅ | Links to patient |
| `practitionerId` | UUID | ✅ | Assigned practitioner |
| `title` | VARCHAR(255) | ✅ | Appointment title |
| `description` | TEXT | ✅ | Details |
| `type` | ENUM | ✅ | eye_examination, contact_lens_fitting, etc. |
| `status` | ENUM | ✅ | scheduled, confirmed, completed, cancelled, no_show |

### Timing
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `startTime` | TIMESTAMP | ✅ |
| `endTime` | TIMESTAMP | ✅ |
| `duration` | INTEGER | ✅ (minutes) |

### Location
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `location` | VARCHAR(255) | ✅ |
| `isVirtual` | BOOLEAN | ✅ |
| `virtualMeetingLink` | TEXT | ✅ |

### Reminders
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `reminderSent` | BOOLEAN | ✅ |
| `reminderType` | ENUM | ✅ (email, sms, phone, push) |
| `reminderTime` | TIMESTAMP | ✅ |

### Cancellation & Rescheduling
| ILS 2.0 Field | Type | Available for All |
|---------------|------|-------------------|
| `cancelledAt` | TIMESTAMP | ✅ |
| `cancelledBy` | UUID | ✅ |
| `cancellationReason` | TEXT | ✅ |
| `rescheduledFrom` | UUID | ✅ |
| `rescheduledTo` | UUID | ✅ |

### Import Tracking
| ILS 2.0 Field | Type | Purpose | Value for New Records |
|---------------|------|---------|----------------------|
| `externalId` | VARCHAR(255) | Original appointment ID | NULL |
| `importSource` | VARCHAR(100) | Source platform | NULL |
| `importJobId` | UUID | Migration job reference | NULL |
| `importedAt` | TIMESTAMP | Import timestamp | NULL |

---

## Summary

### ✅ ALL Fields Available for Both New and Migrated Customers

**Patient Records:** 60+ fields covering demographics, medical history, lifestyle, consent
**Eye Examinations:** 15+ fields plus flexible JSONB for clinical findings
**Prescriptions:** 40+ fields including British GOC compliance
**Dispense Records:** 12+ fields for dispensing documentation
**Lab Orders:** 20+ fields for order management
**Appointments:** 20+ fields for scheduling and tracking

### 🔄 Import Tracking Fields (Migrated Only)

Every table includes 4 optional import tracking fields:
- `externalId` - Original ID from legacy system (Optix, Occuco, Acuity)
- `importSource` - Which platform (optix, occuco, acuity, manual_csv)
- `importJobId` - Links to migration_jobs table
- `importedAt` - Timestamp of import

**For new records created directly in ILS 2.0:** These fields are NULL

### 💡 Platform Parity

**Result:** A practice migrating from Optix with 10 years of history will have access to the EXACT same fields as a brand new practice starting fresh on ILS 2.0.

**No limitations.** **No compromises.** **Full feature parity.**

---

**Document Version:** 1.0
**Last Updated:** November 2025
**Platform:** ILS 2.0
