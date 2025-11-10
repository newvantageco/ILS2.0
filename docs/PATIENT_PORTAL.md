# Patient Portal & Self-Service Platform

## Overview

The Patient Portal is a comprehensive self-service platform that enables patients to:

- Register and manage their account
- Schedule, cancel, and reschedule appointments online
- View and download medical records
- Request prescription refills
- Communicate securely with healthcare providers
- View and pay bills online
- Request payment plans

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Patient Portal Frontend                   │
│  (React/Next.js - to be implemented)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Patient Portal API Routes                       │
│  /api/patient-portal/*                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        ↓            ↓            ↓             ↓
┌──────────────┐ ┌──────────┐ ┌────────────┐ ┌────────┐
│PatientAuth   │ │Appointment│ │PatientPortal│ │Database│
│Service       │ │Booking    │ │Service      │ │        │
│              │ │Service    │ │             │ │        │
└──────────────┘ └───────────┘ └─────────────┘ └────────┘
```

### Services

#### 1. PatientAuthService
- **Purpose**: Authentication and account management
- **Location**: `server/services/patient-portal/PatientAuthService.ts`
- **Features**:
  - Patient registration with email verification
  - Secure login with bcrypt password hashing
  - Password reset via email token
  - Account lockout after failed login attempts
  - Session token management
  - Account preferences

#### 2. AppointmentBookingService
- **Purpose**: Online appointment scheduling
- **Location**: `server/services/patient-portal/AppointmentBookingService.ts`
- **Features**:
  - 6 default appointment types
  - Provider availability management
  - Time slot generation
  - Appointment booking with confirmation codes
  - Cancellation (up to 24 hours before)
  - Rescheduling
  - Appointment reminders

#### 3. PatientPortalService
- **Purpose**: Medical records, prescriptions, messaging, and payments
- **Location**: `server/services/patient-portal/PatientPortalService.ts`
- **Features**:
  - Medical records viewing and download
  - Prescription management and refills
  - Secure provider messaging
  - Bill viewing and online payments
  - Dashboard summary

## API Reference

### Authentication

#### Register Account
```http
POST /api/patient-portal/auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "phone": "555-1234",
  "mrn": "MRN123456" // optional
}

Response:
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "accountId": "uuid"
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

#### Login
```http
POST /api/patient-portal/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecureP@ss123"
}

Response:
{
  "success": true,
  "token": "session-token",
  "patient": {
    "id": "patient-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "patient@example.com"
  }
}
```

**Security Features**:
- Account locks after 5 failed login attempts for 30 minutes
- Email must be verified before login
- Session tokens expire after 24 hours

#### Verify Email
```http
GET /api/patient-portal/auth/verify/:token

Response:
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

#### Forgot Password
```http
POST /api/patient-portal/auth/forgot-password
Content-Type: application/json

{
  "email": "patient@example.com"
}

Response:
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

#### Reset Password
```http
POST /api/patient-portal/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "newPassword": "NewSecureP@ss123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

#### Change Password (Authenticated)
```http
POST /api/patient-portal/auth/change-password
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Get Account Info
```http
GET /api/patient-portal/auth/account
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "account": {
    "id": "account-id",
    "patientId": "patient-id",
    "email": "patient@example.com",
    "isVerified": true,
    "preferences": {
      "emailNotifications": true,
      "smsNotifications": false,
      "appointmentReminders": true,
      "testResultNotifications": true
    }
  }
}
```

#### Update Preferences
```http
PUT /api/patient-portal/auth/preferences
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "emailNotifications": true,
  "smsNotifications": true,
  "appointmentReminders": true,
  "testResultNotifications": true
}

Response:
{
  "success": true,
  "preferences": { ... }
}
```

#### Logout
```http
POST /api/patient-portal/auth/logout
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Appointments

#### Get Appointment Types
```http
GET /api/patient-portal/appointments/types
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "appointmentTypes": [
    {
      "id": "comprehensive-eye-exam",
      "name": "Comprehensive Eye Exam",
      "duration": 60,
      "price": 150,
      "description": "Complete eye examination including vision testing and eye health assessment"
    },
    {
      "id": "contact-lens-fitting",
      "name": "Contact Lens Fitting",
      "duration": 45,
      "price": 100
    }
  ]
}
```

**Default Appointment Types**:
1. Comprehensive Eye Exam (60 min, $150)
2. Contact Lens Fitting (45 min, $100)
3. Follow-up Visit (30 min, $75)
4. Emergency Eye Care (30 min, $200)
5. Pediatric Eye Exam (45 min, $125)
6. Glasses Selection (30 min, free)

#### Get Available Providers
```http
GET /api/patient-portal/appointments/providers?appointmentTypeId={type-id}
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "providers": [
    {
      "id": "provider-id",
      "name": "Dr. Jane Smith",
      "specialty": "Optometrist",
      "acceptingNewPatients": true
    }
  ]
}
```

#### Get Available Time Slots
```http
GET /api/patient-portal/appointments/slots?providerId={provider-id}&appointmentTypeId={type-id}&startDate=2025-01-15&endDate=2025-01-22
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "slots": [
    {
      "date": "2025-01-15",
      "startTime": "09:00",
      "endTime": "10:00",
      "available": true
    },
    {
      "date": "2025-01-15",
      "startTime": "10:00",
      "endTime": "11:00",
      "available": true
    }
  ]
}
```

**Booking Rules**:
- Minimum advance booking: 2 hours
- Maximum advance booking: 90 days
- Maximum cancellation window: 24 hours before appointment

#### Book Appointment
```http
POST /api/patient-portal/appointments/book
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "providerId": "provider-id",
  "appointmentTypeId": "comprehensive-eye-exam",
  "date": "2025-01-15",
  "startTime": "09:00",
  "notes": "First visit, need new glasses prescription"
}

Response:
{
  "success": true,
  "booking": {
    "id": "booking-id",
    "confirmationCode": "ABC123",
    "date": "2025-01-15",
    "startTime": "09:00",
    "endTime": "10:00",
    "status": "confirmed"
  },
  "message": "Appointment booked successfully. Confirmation code: ABC123"
}
```

#### Get My Appointments
```http
GET /api/patient-portal/appointments?upcoming=true
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "appointments": [
    {
      "id": "booking-id",
      "confirmationCode": "ABC123",
      "appointmentType": "Comprehensive Eye Exam",
      "providerName": "Dr. Jane Smith",
      "date": "2025-01-15",
      "startTime": "09:00",
      "endTime": "10:00",
      "status": "confirmed"
    }
  ]
}
```

**Query Parameters**:
- `status`: Filter by status (pending, confirmed, cancelled, completed, no_show)
- `upcoming`: Set to `true` to show only upcoming appointments

#### Cancel Appointment
```http
POST /api/patient-portal/appointments/{bookingId}/cancel
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "reason": "Schedule conflict"
}

Response:
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

#### Reschedule Appointment
```http
POST /api/patient-portal/appointments/{bookingId}/reschedule
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "date": "2025-01-16",
  "startTime": "14:00"
}

Response:
{
  "success": true,
  "booking": {
    "id": "booking-id",
    "confirmationCode": "ABC123",
    "date": "2025-01-16",
    "startTime": "14:00",
    "endTime": "15:00",
    "status": "confirmed"
  },
  "message": "Appointment rescheduled successfully"
}
```

### Medical Records

#### Get Medical Records
```http
GET /api/patient-portal/records?type=exam&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "records": [
    {
      "id": "record-id",
      "type": "exam",
      "title": "Annual Eye Exam",
      "date": "2024-06-15",
      "provider": "Dr. Jane Smith",
      "summary": "Routine eye examination with vision testing",
      "viewable": true,
      "attachments": [
        {
          "id": "attachment-id",
          "filename": "exam-report.pdf",
          "fileType": "application/pdf",
          "url": "/api/patient-portal/records/download/..."
        }
      ]
    }
  ]
}
```

**Record Types**:
- `exam`: Eye examinations
- `prescription`: Eyewear prescriptions
- `lab_result`: Lab test results
- `document`: General documents
- `image`: Medical images

**Query Parameters**:
- `type`: Filter by record type
- `startDate`: Filter records from this date
- `endDate`: Filter records up to this date

#### Get Single Record
```http
GET /api/patient-portal/records/{recordId}
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "record": {
    "id": "record-id",
    "type": "exam",
    "title": "Annual Eye Exam",
    "date": "2024-06-15",
    "provider": "Dr. Jane Smith",
    "details": {
      "rightEyeVision": "20/20",
      "leftEyeVision": "20/25",
      "intraocularPressure": "Normal"
    },
    "attachments": [...]
  }
}
```

#### Request Records Download
```http
POST /api/patient-portal/records/download
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "recordIds": ["record-id-1", "record-id-2"]
}

Response:
{
  "success": true,
  "downloadUrl": "/api/patient-portal/records/download/abc123"
}
```

### Prescriptions

#### Get Prescriptions
```http
GET /api/patient-portal/prescriptions?activeOnly=true
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "prescriptions": [
    {
      "id": "prescription-id",
      "medication": "Latanoprost Eye Drops",
      "dosage": "0.005%",
      "frequency": "Once daily at bedtime",
      "quantity": "2.5 mL",
      "refills": 3,
      "refillsRemaining": 2,
      "prescribedBy": "Dr. Jane Smith",
      "prescribedDate": "2024-06-15",
      "expiresDate": "2025-06-15",
      "status": "active",
      "pharmacy": "Main Street Pharmacy",
      "instructions": "Apply one drop to affected eye(s)",
      "warnings": ["Do not use if allergic to latanoprost"]
    }
  ]
}
```

**Prescription Statuses**:
- `active`: Currently valid prescription
- `expired`: Past expiration date
- `cancelled`: Cancelled by provider
- `completed`: All refills used

#### Request Refill
```http
POST /api/patient-portal/prescriptions/{prescriptionId}/refill
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "pharmacy": "Main Street Pharmacy" // optional
}

Response:
{
  "success": true,
  "message": "Refill request submitted successfully"
}
```

**Refill Requirements**:
- Prescription must be active
- Refills remaining > 0
- Prescription not expired

### Messaging

#### Get Conversations
```http
GET /api/patient-portal/messages/conversations
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "conversations": [
    {
      "id": "conversation-id",
      "providerName": "Dr. Jane Smith",
      "subject": "Question about prescription",
      "status": "open",
      "lastMessageAt": "2024-06-15T10:30:00Z",
      "unreadCount": 1
    }
  ]
}
```

#### Start New Conversation
```http
POST /api/patient-portal/messages/conversations
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "providerId": "provider-id",
  "subject": "Question about my recent exam",
  "message": "I have a question about the results from my last visit..."
}

Response:
{
  "success": true,
  "conversation": {
    "id": "conversation-id",
    "subject": "Question about my recent exam",
    "status": "open"
  }
}
```

#### Get Messages
```http
GET /api/patient-portal/messages/conversations/{conversationId}
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "messages": [
    {
      "id": "message-id",
      "from": "patient",
      "senderName": "John Doe",
      "body": "I have a question about the results...",
      "sentAt": "2024-06-15T10:00:00Z",
      "read": true
    },
    {
      "id": "message-id-2",
      "from": "provider",
      "senderName": "Dr. Jane Smith",
      "body": "I'd be happy to help...",
      "sentAt": "2024-06-15T10:30:00Z",
      "read": false
    }
  ]
}
```

**Note**: Messages from providers are automatically marked as read when retrieved.

#### Send Message
```http
POST /api/patient-portal/messages/conversations/{conversationId}
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "body": "Thank you for the explanation!",
  "attachments": [
    {
      "filename": "photo.jpg",
      "url": "/uploads/photo.jpg"
    }
  ]
}

Response:
{
  "success": true,
  "message": {
    "id": "message-id",
    "from": "patient",
    "body": "Thank you for the explanation!",
    "sentAt": "2024-06-15T11:00:00Z"
  }
}
```

### Bills & Payments

#### Get Bills
```http
GET /api/patient-portal/bills?unpaidOnly=true
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "bills": [
    {
      "id": "bill-id",
      "invoiceNumber": "INV-2024-001",
      "date": "2024-06-15",
      "dueDate": "2024-07-15",
      "amount": 250.00,
      "amountPaid": 0,
      "amountDue": 250.00,
      "status": "unpaid",
      "description": "Eye Exam and Contact Lens Fitting",
      "items": [
        {
          "description": "Comprehensive Eye Exam",
          "amount": 150.00
        },
        {
          "description": "Contact Lens Fitting",
          "amount": 100.00
        }
      ],
      "insurance": {
        "company": "Vision Insurance Co.",
        "claimNumber": "CLM-123456",
        "covered": 100.00
      }
    }
  ]
}
```

**Bill Statuses**:
- `unpaid`: No payment received
- `partial`: Partial payment received
- `paid`: Fully paid
- `overdue`: Past due date

#### Get Single Bill
```http
GET /api/patient-portal/bills/{billId}
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "bill": { ... }
}
```

#### Make Payment
```http
POST /api/patient-portal/bills/{billId}/pay
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "amount": 250.00,
  "method": "card",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "cardholderName": "John Doe"
  }
}

Response:
{
  "success": true,
  "payment": {
    "id": "payment-id",
    "amount": 250.00,
    "method": "card",
    "status": "completed",
    "transactionId": "TXN-1234567890",
    "processedAt": "2024-06-15T12:00:00Z"
  },
  "message": "Payment processed successfully"
}
```

**Payment Methods**:
- `card`: Credit/debit card
- `ach`: ACH bank transfer
- `cash`: Cash payment (in-office)
- `check`: Check payment

**Note**: In production, this would integrate with a payment gateway like Stripe or Square.

#### Get Payment History
```http
GET /api/patient-portal/payments
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "payments": [
    {
      "id": "payment-id",
      "billId": "bill-id",
      "amount": 250.00,
      "method": "card",
      "status": "completed",
      "transactionId": "TXN-1234567890",
      "processedAt": "2024-06-15T12:00:00Z",
      "createdAt": "2024-06-15T12:00:00Z"
    }
  ]
}
```

#### Request Payment Plan
```http
POST /api/patient-portal/bills/{billId}/payment-plan
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "proposedMonthlyPayment": 50.00
}

Response:
{
  "success": true,
  "message": "Payment plan request submitted. You will be contacted shortly."
}
```

### Dashboard

#### Get Dashboard Summary
```http
GET /api/patient-portal/dashboard
Authorization: Bearer {session-token}

Response:
{
  "success": true,
  "dashboard": {
    "upcomingAppointments": 2,
    "unreadMessages": 1,
    "activePrescriptions": 3,
    "unpaidBills": 1,
    "totalAmountDue": 250.00,
    "recentRecords": 5
  }
}
```

## Security

### Authentication Flow

1. **Registration**:
   ```
   Patient → Register with email/password
   System → Create account (unverified)
   System → Send verification email
   Patient → Click verification link
   System → Mark account as verified
   ```

2. **Login**:
   ```
   Patient → Submit email/password
   System → Verify credentials
   System → Check email verified
   System → Generate session token (24h expiry)
   System → Return token to patient
   ```

3. **Authenticated Requests**:
   ```
   Patient → Send request with Bearer token
   System → Validate session token
   System → Check token expiration
   System → Attach patient account to request
   System → Process request
   ```

### Security Features

1. **Password Security**:
   - bcrypt hashing with salt rounds of 10
   - Password requirements enforced
   - Password history to prevent reuse (to be implemented)

2. **Account Protection**:
   - Account lockout after 5 failed login attempts
   - Lockout duration: 30 minutes
   - Email verification required before login
   - Session tokens expire after 24 hours

3. **Data Access Control**:
   - All endpoints verify patient ownership of data
   - Medical records have `viewable` flag
   - Prescriptions validated before refill
   - Bills validated before payment

4. **Token Management**:
   - Session tokens: 24 hours
   - Verification tokens: 7 days
   - Reset tokens: 1 hour
   - Automatic cleanup of expired tokens

5. **Rate Limiting** (to be implemented):
   - Login attempts: 5 per 15 minutes
   - Registration: 3 per hour
   - API requests: 100 per minute

## Integration Guide

### Frontend Integration

#### 1. Register and Login

```typescript
// Register
const response = await fetch('/api/patient-portal/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'patient@example.com',
    password: 'SecureP@ss123',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-15',
    phone: '555-1234'
  })
});

// Login
const loginResponse = await fetch('/api/patient-portal/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'patient@example.com',
    password: 'SecureP@ss123'
  })
});

const { token } = await loginResponse.json();
localStorage.setItem('patientToken', token);
```

#### 2. Authenticated Requests

```typescript
const token = localStorage.getItem('patientToken');

const response = await fetch('/api/patient-portal/appointments', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Handle 401 Unauthorized (expired token)
if (response.status === 401) {
  localStorage.removeItem('patientToken');
  window.location.href = '/login';
}
```

#### 3. Book Appointment Flow

```typescript
// Step 1: Get appointment types
const typesResponse = await fetch('/api/patient-portal/appointments/types', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { appointmentTypes } = await typesResponse.json();

// Step 2: Get available providers
const providersResponse = await fetch(
  `/api/patient-portal/appointments/providers?appointmentTypeId=${selectedType.id}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
const { providers } = await providersResponse.json();

// Step 3: Get available slots
const slotsResponse = await fetch(
  `/api/patient-portal/appointments/slots?providerId=${selectedProvider.id}&appointmentTypeId=${selectedType.id}&startDate=2025-01-15&endDate=2025-01-22`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
const { slots } = await slotsResponse.json();

// Step 4: Book appointment
const bookingResponse = await fetch('/api/patient-portal/appointments/book', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    providerId: selectedProvider.id,
    appointmentTypeId: selectedType.id,
    date: selectedSlot.date,
    startTime: selectedSlot.startTime,
    notes: 'First visit'
  })
});

const { booking } = await bookingResponse.json();
console.log('Confirmation code:', booking.confirmationCode);
```

### Email Integration

The system generates emails for:

1. **Account Verification**:
   - Subject: "Verify your email address"
   - Link: `https://portal.example.com/verify?token={verificationToken}`

2. **Password Reset**:
   - Subject: "Reset your password"
   - Link: `https://portal.example.com/reset-password?token={resetToken}`

3. **Appointment Confirmation**:
   - Subject: "Appointment confirmed"
   - Content: Appointment details and confirmation code

4. **Appointment Reminder**:
   - Subject: "Appointment reminder"
   - Sent: 24 hours before appointment

5. **Prescription Refill**:
   - Subject: "Prescription refill request received"
   - Content: Refill details and processing time

6. **Payment Confirmation**:
   - Subject: "Payment received"
   - Content: Payment details and receipt

### SMS Integration (Future)

For appointment reminders and 2FA:

```typescript
// Example SMS message
"Reminder: You have an appointment with Dr. Jane Smith tomorrow at 9:00 AM. Confirmation code: ABC123. To cancel or reschedule, visit https://portal.example.com"
```

## Implementation Notes

### Current Status

**Implemented**:
- ✅ Complete API routes for all features
- ✅ Patient authentication service
- ✅ Appointment booking service
- ✅ Medical records service
- ✅ Prescription management
- ✅ Secure messaging
- ✅ Bill payment processing

**Using In-Memory Storage** (migrate to database):
- Patient accounts (Map)
- Session tokens (Map)
- Appointments (Map)
- Medical records (Map)
- Prescriptions (Map)
- Messages (Array)
- Conversations (Map)
- Bills (Map)
- Payments (Array)

### Database Migration

When migrating to database, create the following tables:

```sql
-- Patient accounts
CREATE TABLE patient_accounts (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expiry TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  last_login_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Session tokens
CREATE TABLE patient_sessions (
  token VARCHAR(255) PRIMARY KEY,
  account_id UUID REFERENCES patient_accounts(id),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Appointment bookings
CREATE TABLE appointment_bookings (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  provider_id UUID REFERENCES users(id),
  appointment_type_id VARCHAR(100),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(50) NOT NULL,
  confirmation_code VARCHAR(20) UNIQUE,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Medical records
CREATE TABLE patient_medical_records (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  date TIMESTAMP NOT NULL,
  provider VARCHAR(255),
  summary TEXT,
  details JSONB,
  viewable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE patient_prescriptions (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  medication VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(255),
  quantity VARCHAR(100),
  refills INTEGER,
  refills_remaining INTEGER,
  prescribed_by VARCHAR(255),
  prescribed_date DATE,
  expires_date DATE,
  status VARCHAR(50),
  pharmacy VARCHAR(255),
  instructions TEXT,
  warnings JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE patient_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES patient_conversations(id),
  from_type VARCHAR(50) NOT NULL,
  sender_id UUID NOT NULL,
  sender_name VARCHAR(255),
  recipient_id UUID NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  attachments JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE patient_conversations (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  provider_id UUID REFERENCES users(id),
  provider_name VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bills
CREATE TABLE patient_bills (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  invoice_number VARCHAR(100) UNIQUE,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  description TEXT,
  items JSONB,
  insurance JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE patient_payments (
  id UUID PRIMARY KEY,
  bill_id UUID REFERENCES patient_bills(id),
  patient_id UUID REFERENCES patients(id),
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Next Steps

1. **Frontend Development**:
   - Build React/Next.js patient portal UI
   - Implement responsive design
   - Add mobile app support

2. **Payment Integration**:
   - Integrate Stripe or Square
   - Add PCI compliance measures
   - Implement refund handling

3. **Email Service**:
   - Set up SendGrid or AWS SES
   - Design email templates
   - Implement email queuing

4. **SMS Service**:
   - Integrate Twilio
   - Add appointment reminders
   - Implement 2FA via SMS

5. **File Storage**:
   - Set up AWS S3 or similar
   - Implement secure file upload
   - Add document viewing

6. **Additional Features**:
   - Two-factor authentication
   - Family account management
   - Insurance card upload
   - Telehealth integration
   - Health timeline view

## Testing

### Example Test Cases

```typescript
// Registration
describe('Patient Registration', () => {
  it('should register a new patient', async () => {
    const response = await request(app)
      .post('/api/patient-portal/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecureP@ss123',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it('should reject weak passwords', async () => {
    const response = await request(app)
      .post('/api/patient-portal/auth/register')
      .send({
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Password must be');
  });
});

// Appointments
describe('Appointment Booking', () => {
  it('should book an appointment', async () => {
    const response = await request(app)
      .post('/api/patient-portal/appointments/book')
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerId: 'provider-id',
        appointmentTypeId: 'comprehensive-eye-exam',
        date: '2025-01-15',
        startTime: '09:00'
      });

    expect(response.status).toBe(201);
    expect(response.body.booking.confirmationCode).toBeDefined();
  });

  it('should reject booking within 2 hours', async () => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 1);

    const response = await request(app)
      .post('/api/patient-portal/appointments/book')
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerId: 'provider-id',
        appointmentTypeId: 'comprehensive-eye-exam',
        date: tomorrow.toISOString().split('T')[0],
        startTime: '09:00'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('at least 2 hours');
  });
});
```

## Support

For technical support or questions:
- Email: support@ils2.com
- Phone: 1-800-ILS-HELP
- Portal: https://portal.ils2.com/help

## License

Copyright © 2024 ILS 2.0. All rights reserved.
