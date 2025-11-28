# NHS Digital API Integration Guide

This document describes how to integrate ILS 2.0 with NHS Digital APIs for UK healthcare compliance.

## Overview

ILS 2.0 integrates with NHS Digital APIs to provide:

- **PDS (Personal Demographics Service)** - Patient lookup and NHS number verification
- **PCSE Claims** - GOS sight test claims submission
- **NHS Vouchers** - Optical voucher management
- **Exemption Checking** - Patient exemption verification

## NHS Digital API Statuses

NHS Digital APIs follow a standard lifecycle:

| Status | Description |
|--------|-------------|
| In development | Early prototyping, expect breaking changes |
| Beta | Available in production, may have breaking changes |
| In production | Stable, breaking changes only via new versions |
| Under review for deprecation | Being considered for deprecation |
| Deprecated | Still available but planned for retirement |
| Retired | No longer available |

## Prerequisites

Before you can use NHS Digital APIs in production, you must complete the NHS onboarding process.

### 1. Create a Developer Account

Register at [NHS API Platform](https://onboarding.prod.api.platform.nhs.uk/Index)

### 2. Obtain an ODS Code

Every healthcare organisation needs an ODS (Organisation Data Service) code:
- Search: [ODS Data Search](https://www.odsdatasearchandexport.nhs.uk/)
- Apply: [ODS Registration](https://digital.nhs.uk/services/organisation-data-service)

### 3. Complete DSPT

Complete the [Data Security and Protection Toolkit](https://digital.nhs.uk/services/data-security-and-protection-toolkit):
- Select organisation type: "NHS business partner" or "Company"
- Achieve "Standards Met" status

### 4. Clinical Safety (DCB0129)

Implement clinical risk management per [DCB0129](https://digital.nhs.uk/data-and-information/information-standards/information-standards-and-data-collections-including-extractions/publications-and-notifications/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems):
- Appoint a Clinical Safety Officer
- Maintain a hazard log
- Regular risk assessments

### 5. Penetration Testing

Complete penetration testing before production deployment.

### 6. Register with Service Desk

Register at [NHS National Service Desk](https://www.support.digitalservices.nhs.uk/csm) for incident management.

## Environment Configuration

### Required Environment Variables

```bash
# NHS API Platform Credentials
NHS_API_KEY=your-api-key-from-nhs-platform
NHS_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
NHS_KEY_ID=ils-key-1

# Environment: sandbox | integration | production
NHS_API_ENVIRONMENT=sandbox

# Optional: PCSE API for claims (if not using NHS API Platform)
PCSE_API_URL=https://api.pcse.nhs.uk/v1
PCSE_API_KEY=your-pcse-api-key
```

### Environment URLs

| Environment | Base URL | Usage |
|-------------|----------|-------|
| Sandbox | `https://sandbox.api.service.nhs.uk` | Development/testing |
| Integration | `https://int.api.service.nhs.uk` | Integration testing |
| Production | `https://api.service.nhs.uk` | Live production |

## Authentication

ILS 2.0 uses NHS Digital's **signed JWT authentication** pattern:

### Flow

1. Generate a JWT signed with your private key (RS512)
2. Exchange JWT for access token at `/oauth2/token`
3. Use access token for API calls (valid for 10 minutes)
4. Token is automatically cached and refreshed

### JWT Structure

```json
// Header
{
  "alg": "RS512",
  "typ": "JWT",
  "kid": "ils-key-1"
}

// Payload
{
  "iss": "<API_KEY>",
  "sub": "<API_KEY>",
  "aud": "https://api.service.nhs.uk/oauth2/token",
  "jti": "<unique-uuid>",
  "exp": <current-time-plus-5-mins>
}
```

## API Endpoints

### PDS (Personal Demographics Service)

#### Lookup Patient by NHS Number

```http
GET /api/nhs/pds/patient/:nhsNumber
```

Response:
```json
{
  "nhsNumber": "943 476 5919",
  "verified": true,
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1990-01-15",
  "gender": "female",
  "address": {
    "line1": "1 Trevelyan Square",
    "city": "Leeds",
    "postcode": "LS1 6AE"
  },
  "gpPractice": "Y12345",
  "isDeceased": false,
  "sensitiveRecord": false
}
```

#### Search Patients

```http
POST /api/nhs/pds/search
Content-Type: application/json

{
  "family": "Smith",
  "birthdate": "1990-01-15",
  "gender": "female",
  "postcode": "LS1"
}
```

#### Verify NHS Number

```http
POST /api/nhs/pds/verify
Content-Type: application/json

{
  "nhsNumber": "9434765919"
}
```

#### Validate NHS Number Format (Offline)

```http
GET /api/nhs/pds/validate/:nhsNumber
```

### System Status

#### Get Integration Status

```http
GET /api/nhs/system/status
```

Response:
```json
{
  "configured": true,
  "environment": "sandbox",
  "claims_service": true,
  "voucher_service": true,
  "exemption_service": true,
  "pds_service": true,
  "api_status": "connected",
  "last_sync": "2025-11-28T12:00:00.000Z"
}
```

#### Test Connection

```http
POST /api/nhs/system/test-connection
```

### Onboarding Status

```http
GET /api/nhs/onboarding/status
```

Returns the 10-step onboarding checklist with current progress.

## NHS Number Validation

ILS 2.0 validates NHS numbers using the Modulus 11 algorithm:

```typescript
// NHS numbers are 10 digits
// The 10th digit is a check digit calculated using weights 10,9,8,7,6,5,4,3,2

const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
let sum = 0;
for (let i = 0; i < 9; i++) {
  sum += digits[i] * weights[i];
}
const checkDigit = 11 - (sum % 11);
// If checkDigit is 11, use 0
// If checkDigit is 10, the number is invalid
```

## GOS Claims

### Claim Types

| Type | Description | Amount (2024) |
|------|-------------|---------------|
| GOS1 | Standard NHS sight test | £23.19 |
| GOS2 | Under 16 / full-time education | £23.19 |
| GOS3 | Complex NHS sight test | £43.80 |
| GOS4 | Domiciliary NHS sight test | £59.05 |

### Claim Workflow

1. **Draft** - Created but not submitted
2. **Submitted** - Sent to PCSE
3. **Accepted** - PCSE accepted claim
4. **Paid** - Payment received
5. **Rejected** - PCSE rejected (with reason)
6. **Queried** - PCSE has questions

## NHS Voucher Types

| Code | Description |
|------|-------------|
| A | Single vision - low power |
| B | Single vision - high power or prism |
| C | Bifocal - low power |
| D | Bifocal - high power or prism |
| E | Varifocal - low power |
| F | Varifocal - high power or prism |
| G | Tinted lenses |

## Exemption Reasons

| Code | Description |
|------|-------------|
| age_under_16 | Under 16 years old |
| age_16_18_education | 16-18 in full-time education |
| age_60_plus | 60 years or over |
| income_support | On income support |
| jobseekers_allowance | On income-based JSA |
| pension_credit | On pension credit guarantee |
| tax_credits | On tax credits (meets criteria) |
| pregnancy_maternity | Pregnant or had baby in last 12 months |
| hc2_certificate | HC2 certificate holder |
| hc3_certificate | HC3 certificate holder |
| war_pensioner | War pensioner |
| nhs_prescription | On NHS prescription |
| complex_lens | Needs complex lenses |
| partial_sight | Registered blind/partially sighted |
| diabetes | Has diabetes |
| glaucoma | Has glaucoma or is 40+ with family history |

## Audit Requirements

NHS requires an 8-year audit trail for all API interactions:

- All PDS lookups are logged
- All claim submissions are tracked
- Patient data access is auditable
- Retention policy: 8 years from interaction date

## Security Considerations

1. **Private Key Storage** - Store RSA private keys securely (encrypted at rest)
2. **Token Caching** - Access tokens are cached for 10 minutes
3. **HTTPS Only** - All NHS API calls use TLS 1.2+
4. **Audit Logging** - All patient data access is logged
5. **RBAC** - Role-based access control for NHS features

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid NHS number format` | NHS number fails checksum | Verify the 10-digit number |
| `NHS API credentials not configured` | Missing env vars | Set `NHS_API_KEY` and `NHS_PRIVATE_KEY` |
| `Token exchange failed` | Invalid credentials | Verify API key and private key match |
| `Patient not found` | NHS number not in PDS | Verify number or use search |

### Testing

1. Use `sandbox` environment for development
2. Use the NHS number validation endpoint for format checks
3. Test connection with `/api/nhs/system/test-connection`

## e-Referral Service (e-RS)

The e-Referral Service enables electronic referrals to hospital eye clinics.

### Ophthalmology Specialties

| Code | NHS Code | Description |
|------|----------|-------------|
| OPHTHALMOLOGY | 130 | General Ophthalmology |
| OPHTHALMOLOGY_MEDICAL | 460 | Medical Ophthalmology |
| OPHTHALMOLOGY_SURGICAL | 461 | Surgical Ophthalmology |
| OPTOMETRY | 653 | Optometry |
| ORTHOPTICS | 655 | Orthoptics |

### Referral Reasons

| Code | Description |
|------|-------------|
| CATARACT | Cataract assessment and treatment |
| GLAUCOMA | Glaucoma assessment and management |
| DIABETIC_RETINOPATHY | Diabetic retinopathy screening/management |
| MACULAR_DEGENERATION | Age-related macular degeneration (AMD) |
| RETINAL_DETACHMENT | Suspected retinal detachment |
| SQUINT | Squint/strabismus assessment |
| VISUAL_FIELD_DEFECT | Visual field defect investigation |
| SUDDEN_VISION_LOSS | Sudden vision loss - urgent |
| RED_EYE | Red eye - acute |
| DOUBLE_VISION | Double vision (diplopia) |
| FLASHES_FLOATERS | Flashes and floaters |
| EYELID_ABNORMALITY | Eyelid abnormality |
| PAEDIATRIC | Paediatric eye assessment |
| LOW_VISION | Low vision assessment |

### Priority Levels

| Priority | Description | Typical Use |
|----------|-------------|-------------|
| routine | Standard referral | Non-urgent conditions |
| urgent | Urgent referral | Conditions requiring prompt attention |
| two-week-wait | 2WW Cancer pathway | Suspected cancer referrals |

### API Endpoints

#### Get Available Specialties and Reasons

```http
GET /api/nhs/referrals/specialties
```

#### Search for Services

```http
GET /api/nhs/referrals/services?specialty=OPHTHALMOLOGY&postcode=LS1&priority=routine
```

#### Create a Referral

```http
POST /api/nhs/referrals/create
Content-Type: application/json

{
  "patientNhsNumber": "9434765919",
  "patientName": "Jane Smith",
  "patientDateOfBirth": "1990-01-15",
  "specialty": "OPHTHALMOLOGY",
  "priority": "routine",
  "referralReason": "CATARACT",
  "clinicalDetails": "Patient presenting with reduced visual acuity OD. Fundus examination reveals nuclear sclerotic cataract. VA: 6/18 OD, 6/6 OS."
}
```

Response:
```json
{
  "id": "ref-123",
  "ubrn": "UBRN-000012345",
  "status": "draft",
  "createdAt": "2025-11-28T12:00:00Z",
  "specialty": "OPHTHALMOLOGY",
  "priority": "routine",
  "patientNhsNumber": "9434765919"
}
```

#### Submit a Referral

```http
POST /api/nhs/referrals/:id/submit
Content-Type: application/json

{
  "selectedServiceId": "service-456"
}
```

#### Cancel a Referral

```http
POST /api/nhs/referrals/:id/cancel
Content-Type: application/json

{
  "reason": "Patient declined referral"
}
```

#### Get Patient Referrals

```http
GET /api/nhs/referrals/patient/:nhsNumber
```

### Referral Workflow

1. **Draft** - Referral created but not submitted
2. **Sent** - Referral submitted to e-RS
3. **Booked** - Appointment booked by patient or provider
4. **Accepted** - Provider accepted the referral
5. **Completed** - Referral completed
6. **Cancelled** - Referral cancelled

## References

- [NHS Digital Developer Portal](https://digital.nhs.uk/developer)
- [PDS FHIR API](https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir)
- [e-Referral Service FHIR API](https://digital.nhs.uk/developer/api-catalogue/e-referral-service-fhir)
- [e-Referral Service Documentation](https://digital.nhs.uk/services/e-referral-service)
- [Security and Authorisation](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation)
- [Onboarding Process](https://digital.nhs.uk/developer/guides-and-documentation/onboarding-process)
- [Reference Guide - Statuses](https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#statuses)
