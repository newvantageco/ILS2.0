# 📚 ILS 2.0 API Documentation

**Complete API Reference for UK NHS-Integrated Optical Practice Management System**

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Face Analysis API](#face-analysis-api)
3. [NHS Integration API](#nhs-integration-api)
4. [Contact Lens API](#contact-lens-api)
5. [Ophthalmic AI API](#ophthalmic-ai-api)
6. [Core APIs](#core-apis)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints require authentication via session cookies or Bearer tokens.

### Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Login successful"
}
```

### Logout
```http
POST /api/logout
```

### Check Auth Status
```http
GET /api/user
```

**Response:**
```json
{
  "id": "user-123",
  "username": "user@example.com",
  "role": "ecp",
  "companyId": "company-456"
}
```

---

## Face Analysis API

### 1. Analyze Face Photo

Analyzes a patient's face using GPT-4 Vision to determine face shape and recommend frames.

```http
POST /api/face-analysis/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "photoDataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "id": "analysis-789",
  "patientId": "patient-123",
  "faceShape": "oval",
  "faceShapeConfidence": 0.92,
  "photoUrl": "https://...",
  "analysis": {
    "faceWidth": "medium",
    "faceLength": "balanced",
    "jawline": "softly_rounded",
    "cheekbones": "moderate",
    "forehead": "balanced"
  },
  "aiModel": "gpt-4-vision",
  "analyzedAt": "2024-01-15T10:30:00Z"
}
```

### 2. Get Patient Face Analysis

```http
GET /api/face-analysis/patient/:patientId
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "analysis-789",
    "faceShape": "oval",
    "faceShapeConfidence": 0.92,
    "analyzedAt": "2024-01-15T10:30:00Z"
  }
]
```

### 3. Get Latest Analysis

```http
GET /api/face-analysis/patient/:patientId/latest
Authorization: Bearer <token>
```

### 4. Generate Frame Recommendations

```http
POST /api/face-analysis/recommend-frames
Authorization: Bearer <token>
Content-Type: application/json

{
  "analysisId": "analysis-789",
  "preferences": {
    "style": ["professional", "modern"],
    "material": ["metal", "acetate"],
    "budget": "medium"
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": "rec-001",
      "frameShape": "rectangle",
      "frameStyle": "wayfarer",
      "frameMaterial": "acetate",
      "frameColor": "tortoise",
      "compatibilityScore": 0.95,
      "reasoning": "Rectangle frames complement your oval face shape by adding structure...",
      "confidence": 0.92,
      "benefits": [
        "Adds definition to soft features",
        "Balances face proportions",
        "Professional and modern look"
      ]
    }
  ]
}
```

### 5. Get Patient Recommendations

```http
GET /api/face-analysis/recommendations/patient/:patientId
Authorization: Bearer <token>
```

### 6. Get Recommendation by ID

```http
GET /api/face-analysis/recommendations/:recommendationId
Authorization: Bearer <token>
```

### 7. Record Recommendation Outcome

```http
POST /api/face-analysis/recommendations/:recommendationId/outcome
Authorization: Bearer <token>
Content-Type: application/json

{
  "outcome": "purchased",
  "framesPurchased": ["frame-123", "frame-456"],
  "feedback": "Customer loved the recommendations!"
}
```

### 8. Get Recommendation Analytics

```http
GET /api/face-analysis/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalAnalyses": 1250,
  "totalRecommendations": 3750,
  "conversionRate": 0.68,
  "averageConfidence": 0.89,
  "topFaceShapes": [
    { "shape": "oval", "count": 450 },
    { "shape": "round", "count": 320 }
  ],
  "topRecommendedFrames": [
    { "shape": "rectangle", "count": 890 },
    { "shape": "cat_eye", "count": 670 }
  ]
}
```

---

## NHS Integration API

### NHS Practitioners

#### 1. Get All Practitioners

```http
GET /api/nhs/practitioners
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "prac-123",
    "companyId": "company-456",
    "gocNumber": "12345",
    "gocExpiryDate": "2025-12-31",
    "fullName": "Dr. Jane Smith",
    "qualifications": ["BSc (Hons) Optometry", "IP Therapeutics"],
    "specializations": ["Contact Lenses", "Low Vision"],
    "isActive": true
  }
]
```

#### 2. Create Practitioner

```http
POST /api/nhs/practitioners/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-789",
  "gocNumber": "12345",
  "gocExpiryDate": "2025-12-31",
  "fullName": "Dr. Jane Smith",
  "qualifications": ["BSc (Hons) Optometry"],
  "specializations": ["Contact Lenses"]
}
```

#### 3. Update Practitioner

```http
PUT /api/nhs/practitioners/:practitionerId
Authorization: Bearer <token>
Content-Type: application/json

{
  "gocExpiryDate": "2026-12-31",
  "qualifications": ["BSc (Hons) Optometry", "IP Therapeutics"]
}
```

#### 4. Deactivate Practitioner

```http
POST /api/nhs/practitioners/:practitionerId/deactivate
Authorization: Bearer <token>
```

### NHS Contract Details

#### 5. Get Contract Details

```http
GET /api/nhs/contract-details
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "contract-123",
  "companyId": "company-456",
  "contractorName": "Smith Opticians Ltd",
  "contractorNumber": "NHS-12345",
  "contractStartDate": "2024-01-01",
  "contractEndDate": "2026-12-31",
  "practiceAddress": "123 High Street, London, UK",
  "primaryContactEmail": "admin@smithopticians.co.uk",
  "isActive": true
}
```

#### 6. Create Contract Details

```http
POST /api/nhs/contract-details/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "contractorName": "Smith Opticians Ltd",
  "contractorNumber": "NHS-12345",
  "contractStartDate": "2024-01-01",
  "practiceAddress": "123 High Street, London, UK"
}
```

### NHS Claims

#### 7. Create Claim

```http
POST /api/nhs/claims/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "practitionerId": "prac-456",
  "claimType": "GOS1",
  "claimDate": "2024-01-15",
  "serviceDate": "2024-01-15",
  "claimAmount": 23.35,
  "patientNhsNumber": "123 456 7890",
  "exemptionCategory": "age_under_16"
}
```

**Response:**
```json
{
  "id": "claim-789",
  "claimNumber": "GOS1-2024-0001",
  "claimType": "GOS1",
  "claimAmount": 23.35,
  "status": "draft",
  "validationResult": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

#### 8. Get All Claims

```http
GET /api/nhs/claims?status=submitted&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by claim status (draft, submitted, processing, approved, rejected, paid)
- `startDate`: Filter claims from date (YYYY-MM-DD)
- `endDate`: Filter claims to date (YYYY-MM-DD)

#### 9. Get Claim by ID

```http
GET /api/nhs/claims/:claimId
Authorization: Bearer <token>
```

#### 10. Update Claim

```http
PUT /api/nhs/claims/:claimId
Authorization: Bearer <token>
Content-Type: application/json

{
  "claimAmount": 24.50,
  "notes": "Updated claim amount"
}
```

#### 11. Submit Claim

```http
POST /api/nhs/claims/:claimId/submit
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "claim-789",
  "status": "submitted",
  "submittedDate": "2024-01-15T14:30:00Z",
  "pcseReference": "PCSE-2024-123456"
}
```

#### 12. Validate Claim

```http
POST /api/nhs/claims/:claimId/validate
Authorization: Bearer <token>
```

**Response:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    "Patient exemption expires in 30 days"
  ]
}
```

#### 13. Get Claims Statistics

```http
GET /api/nhs/claims/statistics?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalClaims": 450,
  "totalAmount": 10507.50,
  "claimsByType": {
    "GOS1": { "count": 320, "amount": 7472.00 },
    "GOS2": { "count": 80, "amount": 1868.00 },
    "GOS3": { "count": 40, "amount": 934.00 },
    "GOS4": { "count": 10, "amount": 233.50 }
  },
  "claimsByStatus": {
    "draft": 5,
    "submitted": 120,
    "approved": 300,
    "paid": 25
  },
  "averageProcessingTime": 14.5,
  "approvalRate": 0.96
}
```

### NHS Vouchers

#### 14. Calculate Voucher Type

```http
POST /api/nhs/vouchers/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prescriptionId": "rx-123",
  "patientId": "patient-456",
  "exemptionReason": "age_under_16"
}
```

**Response:**
```json
{
  "voucherType": "B",
  "voucherValue": 64.25,
  "reasoning": "High power prescription detected (sphere +11.00D OD exceeds +10.00D threshold)",
  "eligibility": {
    "isEligible": true,
    "exemptionReason": "age_under_16",
    "validUntil": "2025-01-15"
  },
  "prescriptionAnalysis": {
    "isHighPower": true,
    "requiresPrism": false,
    "isBifocal": false,
    "maxSphere": 11.00,
    "maxCylinder": -2.00
  }
}
```

#### 15. Issue Voucher

```http
POST /api/nhs/vouchers/issue
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "prescriptionId": "rx-456",
  "voucherType": "B",
  "voucherValue": 64.25,
  "exemptionCategory": "age_under_16",
  "issueDate": "2024-01-15"
}
```

#### 16. Get Patient Vouchers

```http
GET /api/nhs/vouchers/patient/:patientId
Authorization: Bearer <token>
```

#### 17. Redeem Voucher

```http
POST /api/nhs/vouchers/:voucherId/redeem
Authorization: Bearer <token>
Content-Type: application/json

{
  "redemptionDate": "2024-01-20",
  "orderId": "order-789",
  "amountUsed": 64.25
}
```

### NHS Patient Exemptions

#### 18. Check Exemption

```http
POST /api/nhs/exemptions/check
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "exemptionCategory": "income_support",
  "evidenceProvided": true,
  "evidenceType": "certificate"
}
```

**Response:**
```json
{
  "isEligible": true,
  "exemptionCategory": "income_support",
  "validFrom": "2024-01-15",
  "validUntil": "2025-01-15",
  "requiresRenewal": false
}
```

#### 19. Create Exemption Record

```http
POST /api/nhs/exemptions/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "exemptionCategory": "age_under_16",
  "validFrom": "2024-01-15",
  "validUntil": "2026-08-15",
  "evidenceProvided": false
}
```

#### 20. Get Patient Exemptions

```http
GET /api/nhs/exemptions/patient/:patientId
Authorization: Bearer <token>
```

#### 21. Verify Exemption

```http
POST /api/nhs/exemptions/:exemptionId/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "verificationDate": "2024-01-15",
  "verificationMethod": "online_check",
  "verifiedBy": "user-456"
}
```

### NHS Payments

#### 22. Record Payment

```http
POST /api/nhs/payments/record
Authorization: Bearer <token>
Content-Type: application/json

{
  "claimIds": ["claim-123", "claim-456"],
  "paymentAmount": 456.70,
  "paymentDate": "2024-01-31",
  "paymentReference": "PCSE-PAY-2024-001",
  "paymentMethod": "bacs"
}
```

#### 23. Get All Payments

```http
GET /api/nhs/payments?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### 24. Get Payment by ID

```http
GET /api/nhs/payments/:paymentId
Authorization: Bearer <token>
```

#### 25. Reconcile Payment

```http
POST /api/nhs/payments/:paymentId/reconcile
Authorization: Bearer <token>
Content-Type: application/json

{
  "reconciledDate": "2024-02-01",
  "reconciledBy": "user-456",
  "notes": "All claims matched"
}
```

---

## Contact Lens API

### Assessments

#### 1. Create Assessment

```http
POST /api/contact-lens/assessments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "assessmentDate": "2024-01-15",
  "reason": "new_wearer",
  "motivation": "sports_activities",
  "lifestyleFactors": {
    "occupation": "office_worker",
    "hobbies": ["swimming", "running"],
    "screenTime": "8_hours_plus"
  },
  "ocularHealth": {
    "dryEye": false,
    "allergies": false,
    "previousCLWear": false
  },
  "suitability": "suitable",
  "recommendations": "Recommend daily disposable soft lenses for sports activities"
}
```

**Response:**
```json
{
  "id": "assessment-789",
  "patientId": "patient-123",
  "assessmentDate": "2024-01-15",
  "suitability": "suitable",
  "recommendations": "Recommend daily disposable soft lenses for sports activities"
}
```

#### 2. Get Patient Assessments

```http
GET /api/contact-lens/assessments/patient/:patientId
Authorization: Bearer <token>
```

#### 3. Get Latest Assessment

```http
GET /api/contact-lens/assessments/patient/:patientId/latest
Authorization: Bearer <token>
```

### Fittings

#### 4. Create Fitting

```http
POST /api/contact-lens/fittings
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "assessmentId": "assessment-789",
  "fittingDate": "2024-01-15",
  "lensType": "soft",
  "trialLenses": {
    "od": {
      "brand": "Acuvue",
      "productName": "Acuvue Oasys",
      "baseCurve": 8.4,
      "diameter": 14.0,
      "power": -2.00
    },
    "os": {
      "brand": "Acuvue",
      "productName": "Acuvue Oasys",
      "baseCurve": 8.4,
      "diameter": 14.0,
      "power": -2.25
    }
  },
  "fittingAssessment": {
    "odCentration": "good",
    "osCentration": "good",
    "odMovement": "optimal",
    "osMovement": "optimal",
    "odComfort": "excellent",
    "osComfort": "excellent"
  },
  "outcome": "successful"
}
```

#### 5. Get Patient Fittings

```http
GET /api/contact-lens/fittings/patient/:patientId
Authorization: Bearer <token>
```

### Prescriptions

#### 6. Create Prescription

```http
POST /api/contact-lens/prescriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "fittingId": "fitting-456",
  "prescriptionDate": "2024-01-15",
  "odBrand": "Acuvue",
  "odProductName": "Acuvue Oasys",
  "odBaseCurve": 8.4,
  "odDiameter": 14.0,
  "odPower": -2.00,
  "osBrand": "Acuvue",
  "osProductName": "Acuvue Oasys",
  "osBaseCurve": 8.4,
  "osDiameter": 14.0,
  "osPower": -2.25,
  "wearingSchedule": "daily_wear",
  "replacementSchedule": "two_weekly",
  "careSystem": "multipurpose_solution",
  "nhsFunded": false
}
```

**Response:**
```json
{
  "id": "clrx-789",
  "patientId": "patient-123",
  "prescriptionDate": "2024-01-15",
  "expiryDate": "2025-01-15",
  "firstFollowUpDate": "2024-01-16",
  "weekFollowUpDate": "2024-01-22",
  "monthFollowUpDate": "2024-02-14",
  "isActive": true
}
```

#### 7. Get Patient Prescriptions

```http
GET /api/contact-lens/prescriptions/patient/:patientId
Authorization: Bearer <token>
```

#### 8. Get Active Prescription

```http
GET /api/contact-lens/prescriptions/patient/:patientId/active
Authorization: Bearer <token>
```

#### 9. Deactivate Prescription

```http
POST /api/contact-lens/prescriptions/:prescriptionId/deactivate
Authorization: Bearer <token>
```

### Aftercare

#### 10. Create Aftercare Appointment

```http
POST /api/contact-lens/aftercare
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "prescriptionId": "clrx-456",
  "appointmentDate": "2024-01-16",
  "appointmentType": "first_followup",
  "status": "scheduled"
}
```

#### 11. Update Aftercare

```http
PUT /api/contact-lens/aftercare/:aftercareId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "completedDate": "2024-01-16",
  "findings": "Patient adapting well, comfort excellent",
  "visualAcuity": {
    "odVa": "6/6",
    "osVa": "6/6",
    "binocularVa": "6/6"
  },
  "outcome": "continue",
  "nextAppointmentDate": "2024-01-22"
}
```

#### 12. Get Patient Aftercare

```http
GET /api/contact-lens/aftercare/patient/:patientId
Authorization: Bearer <token>
```

#### 13. Get Upcoming Aftercare

```http
GET /api/contact-lens/aftercare/upcoming?days=30
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "aftercare-123",
    "patientId": "patient-456",
    "patientName": "John Smith",
    "appointmentDate": "2024-01-20",
    "appointmentType": "week_followup",
    "status": "scheduled",
    "prescriptionDate": "2024-01-13"
  }
]
```

### Inventory

#### 14. Find Inventory Item

```http
POST /api/contact-lens/inventory/find
Authorization: Bearer <token>
Content-Type: application/json

{
  "brand": "Acuvue",
  "baseCurve": 8.4,
  "diameter": 14.0,
  "power": -2.00
}
```

**Response:**
```json
{
  "id": "inv-123",
  "brand": "Acuvue",
  "productName": "Acuvue Oasys",
  "baseCurve": 8.4,
  "diameter": 14.0,
  "power": -2.00,
  "quantityInStock": 15,
  "reorderLevel": 5,
  "isTrialLens": true
}
```

#### 15. Get Low Stock Items

```http
GET /api/contact-lens/inventory/low-stock
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "inv-456",
    "brand": "Biofinity",
    "productName": "Biofinity Toric",
    "power": -3.00,
    "cylinder": -1.25,
    "axis": 180,
    "quantityInStock": 2,
    "reorderLevel": 5,
    "stockStatus": "low"
  }
]
```

#### 16. Update Inventory Stock

```http
POST /api/contact-lens/inventory/:inventoryId/update-stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantityChange": -2
}
```

**Response:**
```json
{
  "id": "inv-123",
  "quantityInStock": 13,
  "lastRestocked": "2024-01-15T10:30:00Z"
}
```

### Statistics

#### 17. Get CL Statistics

```http
GET /api/contact-lens/statistics?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalAssessments": 150,
  "totalFittings": 130,
  "totalPrescriptions": 120,
  "successRate": 0.92,
  "topLensTypes": [
    { "type": "soft", "count": 110 },
    { "type": "rigid_gas_permeable", "count": 10 }
  ],
  "topBrands": [
    { "brand": "Acuvue", "count": 45 },
    { "brand": "Biofinity", "count": 38 }
  ],
  "nhsFundedPercentage": 0.15,
  "averageWearTime": 14.5
}
```

### NHS Eligibility

#### 18. Check NHS Eligibility

```http
GET /api/contact-lens/nhs-eligibility/:patientId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "isEligible": true,
  "eligibilityReason": "high_hyperopia",
  "criteria": {
    "hasHighHyperopia": true,
    "hasAstigmatism": false,
    "hasKeratoconus": false,
    "hasAphakia": false
  },
  "prescription": {
    "sphereOD": 11.50,
    "sphereOS": 11.25
  }
}
```

---

## Ophthalmic AI API

### 1. General AI Query

Ask the AI assistant any ophthalmic or dispensing question.

```http
POST /api/ophthalmic-ai/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "What are the benefits of progressive lenses for a 45-year-old office worker?",
  "patientId": "patient-123",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "answer": "Progressive lenses are an excellent choice for a 45-year-old office worker for several reasons:\n\n1. **Seamless Vision**: Progressive lenses provide smooth transition between distance, intermediate (computer), and near vision without visible lines.\n\n2. **Computer Work**: The intermediate zone is optimized for screen distance (60-80cm), reducing neck strain from bifocals.\n\n3. **Age-Appropriate**: At 45, presbyopia typically requires +1.00 to +1.50 add power, which progressives handle elegantly.\n\n4. **Aesthetics**: No visible lines give a more youthful appearance compared to bifocals.\n\nRecommendations:\n- Consider office/occupational progressives with wider intermediate zones\n- Anti-reflective coating for screen glare reduction\n- Blue light filtering for extended computer use",
  "recommendations": [
    {
      "type": "lens_type",
      "value": "office_progressive",
      "reasoning": "Optimized for computer work with extended intermediate zone"
    },
    {
      "type": "coating",
      "value": "anti_reflective_blue_light",
      "reasoning": "Reduces screen glare and blue light exposure"
    }
  ],
  "relatedTopics": [
    "Occupational progressives",
    "Computer Vision Syndrome",
    "Anti-reflective coatings"
  ],
  "confidence": 0.92
}
```

### 2. Get Lens Recommendations

AI-powered lens recommendations based on prescription and lifestyle.

```http
POST /api/ophthalmic-ai/lens-recommendations
Authorization: Bearer <token>
Content-Type: application/json

{
  "prescriptionId": "rx-123",
  "lifestyle": {
    "occupation": "graphic_designer",
    "screenTime": "8_hours_plus",
    "hobbies": ["photography", "cycling"],
    "drivingFrequency": "daily"
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "lensType": "office_progressive",
      "priority": "primary",
      "suitabilityScore": 0.95,
      "reasoning": "Graphic design requires extended near and intermediate vision. Office progressives provide wider intermediate zones (60-80cm) ideal for multiple monitors.",
      "materials": ["high_index_1.67", "polycarbonate"],
      "coatings": ["anti_reflective", "blue_light_filter", "scratch_resistant"],
      "estimatedCost": {
        "min": 250,
        "max": 450,
        "currency": "GBP"
      }
    },
    {
      "lensType": "single_vision_computer",
      "priority": "secondary",
      "suitabilityScore": 0.78,
      "reasoning": "Dedicated computer glasses for extended screen work. Can be paired with separate driving/distance glasses.",
      "materials": ["standard_plastic"],
      "coatings": ["anti_reflective", "blue_light_filter"],
      "estimatedCost": {
        "min": 120,
        "max": 200,
        "currency": "GBP"
      }
    }
  ],
  "lifestyle_analysis": {
    "primary_use": "near_intermediate_vision",
    "secondary_use": "distance_vision",
    "special_requirements": ["blue_light_protection", "anti_glare"]
  }
}
```

### 3. Get Contact Lens Recommendations

AI-powered contact lens recommendations.

```http
POST /api/ophthalmic-ai/contact-lens-recommendations
Authorization: Bearer <token>
Content-Type: application/json

{
  "prescriptionId": "rx-123",
  "lifestyle": {
    "occupation": "athlete",
    "sports": ["football", "swimming"],
    "wearPreference": "daily_disposable"
  },
  "ocularHealth": {
    "dryEye": false,
    "allergies": false,
    "previousCLWear": true
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "brand": "Acuvue",
      "productName": "1-Day Acuvue Moist",
      "lensType": "soft",
      "material": "etafilcon_a",
      "waterContent": "58%",
      "oxygenPermeability": "28 Dk/t",
      "replacementSchedule": "daily_disposable",
      "suitabilityScore": 0.94,
      "reasoning": "Daily disposables ideal for athletes - no cleaning required, fresh lens daily reduces infection risk, especially important for swimming. High water content provides comfort during physical activity.",
      "benefits": [
        "No cleaning or storage needed",
        "Lowest infection risk",
        "Fresh lens daily",
        "Ideal for sports and swimming"
      ],
      "estimatedCostPerMonth": {
        "amount": 35,
        "currency": "GBP"
      }
    }
  ]
}
```

### 4. Explain Prescription

AI explains a prescription in patient-friendly language.

```http
POST /api/ophthalmic-ai/explain-prescription
Authorization: Bearer <token>
Content-Type: application/json

{
  "prescriptionId": "rx-123"
}
```

**Response:**
```json
{
  "explanation": "Let me explain your prescription in simple terms:\n\n**Right Eye (OD):**\n- Sphere: -2.00 means you have mild short-sightedness (myopia)\n- You can see things up close clearly, but distant objects appear blurry\n\n**Left Eye (OS):**\n- Sphere: -2.25 means slightly more short-sightedness than your right eye\n- Cylinder: -0.75 indicates you have mild astigmatism\n- Axis: 180° shows the direction we need to correct the astigmatism\n\n**What this means for you:**\n- You need glasses for distance vision (driving, watching TV, sports)\n- Your prescription is mild - many people have similar prescriptions\n- The astigmatism in your left eye may cause slight blurring without glasses\n\n**Recommendations:**\n- Wear your glasses for driving and distance activities\n- Consider anti-reflective coating for night driving\n- Your prescription is stable - typical review in 2 years unless vision changes",
  "severity": "mild",
  "keyPoints": [
    "Mild short-sightedness in both eyes",
    "Small amount of astigmatism in left eye",
    "Glasses recommended for distance vision"
  ],
  "patientFriendlyTerms": {
    "myopia": "short-sightedness",
    "astigmatism": "slightly irregular cornea shape causing blur"
  }
}
```

### 5. Get NHS Guidance

AI provides NHS-specific guidance.

```http
POST /api/ophthalmic-ai/nhs-guidance
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "gos1_eligibility",
  "patientAge": 45,
  "patientCircumstances": {
    "diabetic": true,
    "glaucomaRisk": false
  }
}
```

**Response:**
```json
{
  "guidance": "Based on the patient being diabetic and age 45, here's the NHS GOS eligibility:\n\n**GOS 1 (NHS Sight Test) - ELIGIBLE**\n\nReason: Diabetes (both Type 1 and Type 2) qualifies for NHS-funded sight tests regardless of age.\n\n**Frequency:**\n- Annual sight tests recommended\n- More frequent if diabetic retinopathy detected\n\n**What to Check:**\n1. Confirm diabetes diagnosis (Type 1 or Type 2)\n2. No evidence required - patient declaration acceptable\n3. Record diabetes in patient notes\n4. Photograph retina (diabetic retinopathy screening)\n\n**Claiming:**\n- Submit GOS 1 claim with diabetes exemption\n- Current fee: £23.35 (2024 rates)\n- Include retinal photography in examination\n\n**Patient Advice:**\n- Regular eye tests crucial for diabetes management\n- Early detection of diabetic retinopathy prevents sight loss\n- Inform patient about diabetic eye screening programme",
  "eligibility": {
    "gos1": true,
    "gos2": false,
    "vouchers": false
  },
  "claimAmount": 23.35,
  "requiredEvidence": "patient_declaration",
  "additionalNotes": [
    "Coordinate with NHS Diabetic Eye Screening Programme",
    "Document fundus findings carefully",
    "Refer immediately if retinopathy detected"
  ]
}
```

### 6. Get Business Insights

AI provides business insights and recommendations.

```http
POST /api/ophthalmic-ai/business-insights
Authorization: Bearer <token>
Content-Type: application/json

{
  "timeframe": "last_quarter",
  "focusArea": "revenue_optimization"
}
```

**Response:**
```json
{
  "insights": [
    {
      "category": "revenue",
      "insight": "NHS claims represent 35% of revenue but take 45 days average to process. Improving claim submission speed could improve cash flow.",
      "actionable": true,
      "priority": "high",
      "recommendations": [
        "Submit claims weekly instead of monthly",
        "Implement automated claim validation",
        "Review rejected claims within 48 hours"
      ]
    },
    {
      "category": "inventory",
      "insight": "Contact lens trial inventory has 15% wastage due to expiry. Optimizing stock levels could save £1,200 annually.",
      "actionable": true,
      "priority": "medium",
      "recommendations": [
        "Implement FIFO inventory management",
        "Reduce trial lens stock by 20%",
        "Set up expiry alerts 3 months in advance"
      ]
    },
    {
      "category": "appointments",
      "insight": "Contact lens aftercare no-show rate is 18%. Implementing SMS reminders could improve compliance and revenue.",
      "actionable": true,
      "priority": "high",
      "recommendations": [
        "Send SMS reminders 48 hours before appointment",
        "Follow up with patients who miss appointments",
        "Offer online rebooking for convenience"
      ]
    }
  ],
  "summary": "Key opportunities: Improve NHS claim cash flow (£2,500/month potential), reduce CL trial wastage (£100/month savings), decrease aftercare no-shows (£800/month revenue recovery)",
  "estimatedImpact": {
    "monthlyRevenue": 3300,
    "monthlySavings": 100,
    "currency": "GBP"
  }
}
```

---

## Core APIs

### Dashboard Statistics

```http
GET /api/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 450,
  "pending": 23,
  "inProduction": 67,
  "completed": 360
}
```

### Orders

```http
GET /api/orders
Authorization: Bearer <token>
```

```http
GET /api/orders/:orderId
Authorization: Bearer <token>
```

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "lensType": "progressive",
  "coating": "anti_reflective",
  "frameName": "Ray-Ban Wayfarer"
}
```

### Patients

```http
GET /api/patients
Authorization: Bearer <token>
```

```http
GET /api/patients/:patientId
Authorization: Bearer <token>
```

```http
POST /api/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "dateOfBirth": "1980-05-15",
  "email": "john.smith@example.com",
  "phone": "07700900123",
  "nhsNumber": "123 456 7890"
}
```

### Prescriptions

```http
GET /api/prescriptions/patient/:patientId
Authorization: Bearer <token>
```

```http
POST /api/prescriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-123",
  "prescriptionDate": "2024-01-15",
  "sphereOD": -2.00,
  "cylinderOD": -0.50,
  "axisOD": 180,
  "sphereOS": -2.25,
  "cylinderOS": -0.75,
  "axisOS": 180,
  "addPower": 0.00
}
```

---

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- **401 Unauthorized**: Not logged in or session expired
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **400 Bad Request**: Invalid request data (check validation errors)
- **500 Internal Server Error**: Server error (check logs)

### Example Error Response

```json
{
  "error": "Prescription not found for patient",
  "code": "PRESCRIPTION_NOT_FOUND",
  "details": {
    "patientId": "patient-123",
    "prescriptionId": "rx-invalid"
  }
}
```

---

## Rate Limiting

### AI Endpoints

AI endpoints have usage limits based on subscription tier:

- **Free Tier**: 50 queries/month
- **Basic Tier**: 200 queries/month
- **Professional Tier**: 1000 queries/month
- **Enterprise Tier**: Unlimited

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 157
X-RateLimit-Reset: 1704067200
```

When limit is exceeded:

```json
{
  "error": "AI query limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 200,
    "used": 200,
    "resetDate": "2024-02-01T00:00:00Z"
  }
}
```

### General API Endpoints

- 100 requests per minute per user
- 1000 requests per hour per company

---

## Best Practices

### 1. Authentication

Always include authentication in requests:

```javascript
fetch('/api/nhs/claims', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});
```

### 2. Error Handling

Always handle errors gracefully:

```javascript
try {
  const response = await fetch('/api/ophthalmic-ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What is astigmatism?' })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error);
    return;
  }

  const data = await response.json();
  console.log(data.answer);
} catch (error) {
  console.error('Network Error:', error);
}
```

### 3. Pagination

For large datasets, use pagination:

```http
GET /api/nhs/claims?page=1&limit=50
```

### 4. Date Formats

Always use ISO 8601 format for dates:

```json
{
  "claimDate": "2024-01-15",
  "submittedDate": "2024-01-15T14:30:00Z"
}
```

### 5. Validation

Validate data before sending to API:

```javascript
import { z } from 'zod';

const createClaimSchema = z.object({
  patientId: z.string().min(1),
  claimType: z.enum(['GOS1', 'GOS2', 'GOS3', 'GOS4']),
  claimAmount: z.number().positive(),
  claimDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

try {
  createClaimSchema.parse(requestData);
} catch (error) {
  console.error('Validation Error:', error);
}
```

---

## Support

For API support or questions:

- **Documentation**: This file
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Feature Summary**: `FEATURES_SUMMARY.md`
- **Master Plan**: `UK_NHS_TRANSFORMATION_MASTER_PLAN.md`

---

**ILS 2.0 - World-Class Optical Practice Management System with UK NHS Integration**
