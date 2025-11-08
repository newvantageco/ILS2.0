# Telehealth & Virtual Care Platform

## Overview

The Telehealth & Virtual Care Platform enables healthcare providers to conduct secure, HIPAA-compliant virtual consultations with patients. The platform includes complete visit management, video conferencing, digital waiting room, and clinical documentation capabilities.

## Features

### Virtual Visit Management
- Schedule virtual appointments with any supported visit type
- Pre-visit consent and questionnaire workflow
- Automatic insurance and payment verification
- Visit documentation with diagnoses, prescriptions, and orders
- Follow-up care coordination

### Video Conferencing
- Provider-agnostic video sessions (Twilio, Zoom, Agora, Daily.co, Vonage)
- HD video quality with adaptive bitrate
- Screen sharing for reviewing test results and images
- In-session text chat (public and private messages)
- Session recording with patient consent
- Real-time connection quality monitoring

### Digital Waiting Room
- Virtual check-in 15 minutes before appointment
- Real-time queue position and wait time estimates
- System compatibility check (camera, microphone, browser)
- Pre-visit questionnaire completion
- Automated patient notifications

### Clinical Features
- Structured visit notes
- ICD-10 diagnosis codes
- E-prescribing integration
- Lab and imaging orders
- Follow-up scheduling

## Architecture

```
┌──────────────────────────────────────────────────────┐
│             Patient & Provider Clients                │
│  (Web, Mobile) - WebRTC Video + REST API             │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│              Telehealth API Routes                    │
│  /api/telehealth/*                                   │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        ↓            ↓            ↓              ↓
┌─────────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐
│Telehealth   │ │Video     │ │Waiting  │ │External   │
│Service      │ │Session   │ │Room     │ │Video      │
│             │ │Service   │ │Service  │ │Provider   │
└─────────────┘ └──────────┘ └─────────┘ └───────────┘
```

### Services

#### 1. TelehealthService
- **Location**: `server/services/telehealth/TelehealthService.ts`
- **Purpose**: Virtual visit lifecycle management
- **Key Features**:
  - Visit scheduling and cancellation
  - Provider availability management
  - Consent management
  - Visit workflow (check-in, start, complete)
  - Pre-visit questionnaires
  - Clinical documentation
  - Statistics and reporting

#### 2. VideoSessionService
- **Location**: `server/services/telehealth/VideoSessionService.ts`
- **Purpose**: Video conferencing session management
- **Key Features**:
  - Multi-provider video support
  - Access token generation
  - Participant management
  - Recording controls
  - Screen sharing
  - In-session chat
  - Connection quality monitoring

#### 3. VirtualWaitingRoomService
- **Location**: `server/services/telehealth/VirtualWaitingRoomService.ts`
- **Purpose**: Digital waiting room experience
- **Key Features**:
  - Queue management
  - System compatibility checks
  - Pre-visit task tracking
  - Position and wait time updates
  - Automated notifications
  - Timeout handling

## Visit Types

The system supports 7 visit types with predefined costs:

| Visit Type | Duration | Cost | Description |
|------------|----------|------|-------------|
| `initial_consultation` | 30 min | $75 | First-time virtual consultation |
| `follow_up` | 30 min | $50 | Follow-up after previous visit |
| `urgent_care` | 30 min | $100 | Urgent medical issues |
| `prescription_refill` | 30 min | $35 | Medication refill requests |
| `second_opinion` | 30 min | $125 | Second opinion consultation |
| `post_op_checkup` | 30 min | $50 | Post-operative check-up |
| `chronic_care_management` | 30 min | $60 | Chronic condition management |

## Complete Patient Journey

### 1. Consent & Scheduling

**Patient provides telehealth consent:**
```http
POST /api/telehealth/consent
{
  "patientId": "patient-123"
}
```

**Schedule virtual visit:**
```http
POST /api/telehealth/visits/schedule
{
  "patientId": "patient-123",
  "patientName": "John Doe",
  "providerId": "provider-456",
  "visitType": "follow_up",
  "visitReason": "vision_changes",
  "reasonDetails": "Experiencing blurry vision in left eye",
  "scheduledDate": "2025-01-20",
  "scheduledTime": "14:00",
  "recordingConsent": true,
  "platform": "web"
}

Response:
{
  "success": true,
  "visit": {
    "id": "visit-789",
    "confirmationCode": "ABC123",
    "scheduledDate": "2025-01-20",
    "scheduledTime": "14:00",
    "cost": 5000,  // $50.00 in cents
    "status": "scheduled"
  }
}
```

### 2. Pre-Visit Preparation

**Submit pre-visit questionnaire (optional):**
```http
POST /api/telehealth/visits/visit-789/questionnaire
{
  "patientId": "patient-123",
  "responses": [
    {
      "question": "What is your chief complaint?",
      "answer": "Blurry vision in left eye",
      "questionType": "text"
    },
    {
      "question": "When did symptoms start?",
      "answer": "3 days ago",
      "questionType": "text"
    },
    {
      "question": "Current medications",
      "answer": ["Latanoprost Eye Drops"],
      "questionType": "multiple_choice"
    }
  ]
}
```

### 3. Check-In & Waiting Room

**Check in to waiting room (15 minutes before appointment):**
```http
POST /api/telehealth/visits/visit-789/check-in
{
  "patientId": "patient-123"
}

Response:
{
  "success": true,
  "waitingRoomPosition": 2,
  "estimatedWaitMinutes": 15
}
```

**Enter waiting room:**
```http
POST /api/telehealth/waiting-room/enter
{
  "visitId": "visit-789",
  "patientId": "patient-123",
  "patientName": "John Doe",
  "providerId": "provider-456",
  "providerName": "Dr. Jane Smith"
}

Response:
{
  "success": true,
  "entry": {
    "id": "entry-101",
    "position": 2,
    "estimatedWaitMinutes": 15,
    "systemCheckCompleted": false,
    "questionnaireCompleted": true,
    "consentSigned": true,
    "paymentVerified": false
  }
}
```

**Complete system check:**
```http
POST /api/telehealth/waiting-room/visit-789/system-check
{
  "results": {
    "overall": "passed",
    "camera": {
      "available": true,
      "permissions": "granted",
      "quality": "good"
    },
    "microphone": {
      "available": true,
      "permissions": "granted",
      "quality": "good"
    },
    "speakers": {
      "available": true,
      "working": true
    },
    "connection": {
      "speed": 25.5,  // Mbps
      "latency": 45,  // ms
      "quality": "excellent"
    },
    "browser": {
      "name": "Chrome",
      "version": "120",
      "compatible": true
    }
  }
}

Response:
{
  "success": true,
  "warnings": []  // Empty if all checks passed
}
```

**Check readiness:**
```http
GET /api/telehealth/waiting-room/visit-789/ready

Response:
{
  "success": true,
  "ready": true,
  "missing": []  // Empty if ready
}
```

### 4. Provider Calls Patient

**Provider calls next patient from queue:**
```http
POST /api/telehealth/waiting-room/provider/provider-456/call-next

Response:
{
  "success": true,
  "entry": {
    "visitId": "visit-789",
    "patientName": "John Doe",
    "status": "called"
  }
}
```

### 5. Video Session

**Create video session:**
```http
POST /api/telehealth/sessions/create
{
  "visitId": "visit-789",
  "provider": "twilio",
  "recordingEnabled": true,
  "screenSharingEnabled": true,
  "chatEnabled": true
}

Response:
{
  "success": true,
  "session": {
    "id": "session-999",
    "roomId": "TWI-abc123def456",
    "status": "created"
  }
}
```

**Generate access tokens for patient and provider:**
```http
POST /api/telehealth/sessions/session-999/token
{
  "userId": "patient-123",
  "userName": "John Doe",
  "role": "patient"
}

Response:
{
  "success": true,
  "token": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2025-01-21T14:00:00Z",
    "participantId": "part-001"
  }
}
```

**Join session:**
```http
POST /api/telehealth/sessions/session-999/join
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "patient-123",
  "userName": "John Doe",
  "browser": "Chrome",
  "os": "Windows 10",
  "deviceType": "desktop",
  "networkType": "wifi"
}

Response:
{
  "success": true,
  "participant": {
    "id": "part-001",
    "role": "patient",
    "joinedAt": "2025-01-20T14:02:00Z",
    "audioEnabled": true,
    "videoEnabled": true
  }
}
```

**Start recording (if consented):**
```http
POST /api/telehealth/sessions/session-999/recording/start
```

**Provider shares screen to show test results:**
```http
POST /api/telehealth/sessions/session-999/screen-share/start
{
  "participantId": "part-002",
  "participantName": "Dr. Jane Smith"
}
```

**Send chat message:**
```http
POST /api/telehealth/sessions/session-999/chat
{
  "senderId": "part-002",
  "senderName": "Dr. Jane Smith",
  "message": "I'm sharing your recent eye exam results"
}
```

### 6. Complete Visit

**Provider starts visit (admits patient):**
```http
POST /api/telehealth/visits/visit-789/start
{
  "providerId": "provider-456"
}
```

**Provider completes visit with documentation:**
```http
POST /api/telehealth/visits/visit-789/complete
{
  "providerId": "provider-456",
  "visitNotes": "Patient reports blurry vision in left eye for 3 days. Examination via video showed normal pupil response. Discussed medication compliance. Patient reports using latanoprost as prescribed. Recommended in-office visit for comprehensive exam.",
  "diagnoses": [
    {
      "code": "H53.8",
      "description": "Other visual disturbances"
    }
  ],
  "prescriptions": [
    {
      "medication": "Latanoprost 0.005% Eye Drops",
      "dosage": "One drop",
      "instructions": "Apply to affected eye once daily at bedtime"
    }
  ],
  "orders": [
    {
      "type": "appointment",
      "description": "Comprehensive in-office eye examination within 1 week"
    }
  ],
  "followUpRequired": true,
  "followUpInstructions": "Schedule in-office comprehensive eye exam within 1 week. Call immediately if symptoms worsen or new symptoms develop."
}

Response:
{
  "success": true,
  "message": "Visit completed successfully"
}
```

**End video session:**
```http
POST /api/telehealth/sessions/session-999/end
```

## Provider Workflow

### Enable Telehealth for Provider

```http
POST /api/telehealth/providers/enable
{
  "providerId": "provider-456",
  "providerName": "Dr. Jane Smith",
  "config": {
    "maxDailyVirtualVisits": 20,
    "virtualVisitDuration": 30,
    "availableHours": [
      { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00" },
      { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00" },
      { "dayOfWeek": 3, "startTime": "09:00", "endTime": "17:00" },
      { "dayOfWeek": 4, "startTime": "09:00", "endTime": "17:00" },
      { "dayOfWeek": 5, "startTime": "09:00", "endTime": "17:00" }
    ],
    "breakTimes": [
      { "dayOfWeek": 1, "startTime": "12:00", "endTime": "13:00" },
      { "dayOfWeek": 2, "startTime": "12:00", "endTime": "13:00" },
      { "dayOfWeek": 3, "startTime": "12:00", "endTime": "13:00" },
      { "dayOfWeek": 4, "startTime": "12:00", "endTime": "13:00" },
      { "dayOfWeek": 5, "startTime": "12:00", "endTime": "13:00" }
    ],
    "supportedVisitTypes": [
      "initial_consultation",
      "follow_up",
      "urgent_care",
      "prescription_refill"
    ],
    "acceptsInsurance": true,
    "acceptsCash": true,
    "videoProvider": "twilio"
  }
}
```

### View Daily Schedule

```http
GET /api/telehealth/visits/provider/provider-456?date=2025-01-20&status=scheduled

Response:
{
  "success": true,
  "visits": [
    {
      "id": "visit-789",
      "patientName": "John Doe",
      "visitType": "follow_up",
      "scheduledTime": "14:00",
      "duration": 30,
      "status": "scheduled"
    },
    {
      "id": "visit-790",
      "patientName": "Jane Smith",
      "visitType": "initial_consultation",
      "scheduledTime": "15:00",
      "duration": 30,
      "status": "scheduled"
    }
  ]
}
```

### Monitor Waiting Room Queue

```http
GET /api/telehealth/waiting-room/provider/provider-456/queue

Response:
{
  "success": true,
  "queue": {
    "providerId": "provider-456",
    "providerName": "Dr. Jane Smith",
    "isActive": true,
    "currentPatient": "visit-788",
    "waitingPatients": ["visit-789", "visit-790"],
    "averageVisitDuration": 30
  },
  "patients": [
    {
      "visitId": "visit-789",
      "patientName": "John Doe",
      "position": 1,
      "estimatedWaitMinutes": 10,
      "systemCheckCompleted": true,
      "questionnaireCompleted": true,
      "status": "waiting"
    },
    {
      "visitId": "visit-790",
      "patientName": "Jane Smith",
      "position": 2,
      "estimatedWaitMinutes": 40,
      "systemCheckCompleted": true,
      "questionnaireCompleted": false,
      "status": "waiting"
    }
  ]
}
```

## Video Provider Integration

The platform is designed to work with multiple video providers. Here's how to integrate each:

### Twilio Video

1. **Setup**:
```bash
npm install twilio
```

2. **Generate Access Token**:
```typescript
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

function generateTwilioToken(roomName: string, identity: string): string {
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity }
  );

  const videoGrant = new VideoGrant({
    room: roomName
  });

  token.addGrant(videoGrant);
  return token.toJwt();
}
```

### Zoom SDK

1. **Setup**:
```bash
npm install @zoom/videosdk
```

2. **Generate SDK JWT**:
```typescript
import KJUR from 'jsrsasign';

function generateZoomToken(sessionName: string, role: number): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 2; // 2 hours

  const oHeader = { alg: 'HS256', typ: 'JWT' };
  const oPayload = {
    app_key: process.env.ZOOM_SDK_KEY!,
    iat,
    exp,
    tpc: sessionName,
    role_type: role  // 0 = attendee, 1 = host
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  return KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_SDK_SECRET!);
}
```

### Agora

1. **Setup**:
```bash
npm install agora-access-token
```

2. **Generate RTC Token**:
```typescript
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

function generateAgoraToken(channelName: string, uid: number, role: 'publisher' | 'subscriber'): string {
  const appId = process.env.AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    agoraRole,
    privilegeExpiredTs
  );
}
```

## Statistics & Reporting

```http
GET /api/telehealth/statistics?providerId=provider-456&startDate=2025-01-01&endDate=2025-01-31

Response:
{
  "success": true,
  "statistics": {
    "totalVisits": 150,
    "completedVisits": 135,
    "cancelledVisits": 10,
    "noShowRate": 3.33,  // percentage
    "averageDuration": 28.5,  // minutes
    "totalRevenue": 750000,  // cents ($7,500)
    "visitsByType": {
      "initial_consultation": 45,
      "follow_up": 60,
      "urgent_care": 15,
      "prescription_refill": 20,
      "second_opinion": 5,
      "post_op_checkup": 5,
      "chronic_care_management": 0
    },
    "visitsByStatus": {
      "scheduled": 5,
      "waiting_room": 0,
      "in_progress": 0,
      "completed": 135,
      "cancelled": 10,
      "no_show": 5,
      "technical_issue": 0
    },
    "averageWaitTime": 8.2,  // minutes
    "technicalIssueRate": 2.0  // percentage
  }
}
```

## Security & Compliance

### HIPAA Compliance

1. **End-to-End Encryption**: All video streams are encrypted using WebRTC with DTLS-SRTP
2. **Access Controls**: Token-based authentication with expiration
3. **Audit Logging**: All visit actions are logged with timestamps
4. **Recording Consent**: Explicit patient consent required for recording
5. **Data Retention**: Configurable retention policies for visit data

### Access Control

```typescript
// Middleware to verify provider access
async function verifyProviderAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { providerId } = req.params;
  const user = req.user;  // from isAuthenticated middleware

  if (user.role !== 'provider' || user.id !== providerId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  next();
}
```

### Browser Requirements

**Supported Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Permissions**:
- Camera access
- Microphone access
- Speaker/audio output access

**Minimum Connection Speed**:
- 2 Mbps for standard definition
- 5 Mbps for high definition
- 10 Mbps for screen sharing

## Implementation Notes

### Current Status

**Implemented**:
- ✅ Complete virtual visit lifecycle
- ✅ Video session management (provider-agnostic)
- ✅ Digital waiting room with queue management
- ✅ System compatibility checks
- ✅ Pre-visit questionnaires
- ✅ Clinical documentation
- ✅ Recording controls
- ✅ Screen sharing
- ✅ In-session chat
- ✅ Statistics and reporting

**Using In-Memory Storage** (migrate to database):
- Virtual visits
- Video sessions
- Waiting room entries
- Consent records
- Questionnaires
- Chat messages

### Database Schema

```sql
-- Virtual visits
CREATE TABLE telehealth_visits (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  patient_name VARCHAR(255),
  provider_id UUID REFERENCES users(id),
  provider_name VARCHAR(255),
  visit_type VARCHAR(50),
  visit_reason VARCHAR(50),
  reason_details TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  duration INTEGER,
  status VARCHAR(50),
  session_id UUID,
  checked_in_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  actual_duration INTEGER,
  visit_notes TEXT,
  diagnoses JSONB,
  prescriptions JSONB,
  orders JSONB,
  follow_up_required BOOLEAN,
  follow_up_instructions TEXT,
  recording_enabled BOOLEAN,
  recording_consent BOOLEAN,
  recording_url VARCHAR(500),
  cost INTEGER,
  payment_status VARCHAR(50),
  platform VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Video sessions
CREATE TABLE video_sessions (
  id UUID PRIMARY KEY,
  visit_id UUID REFERENCES telehealth_visits(id),
  provider VARCHAR(50),
  room_id VARCHAR(255) UNIQUE,
  room_name VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration INTEGER,
  participants JSONB,
  recording_enabled BOOLEAN,
  recording_started_at TIMESTAMP,
  recording_stopped_at TIMESTAMP,
  recording_url VARCHAR(500),
  recording_duration INTEGER,
  errors JSONB
);

-- Waiting room entries
CREATE TABLE waiting_room_entries (
  id UUID PRIMARY KEY,
  visit_id UUID REFERENCES telehealth_visits(id),
  patient_id UUID REFERENCES patients(id),
  patient_name VARCHAR(255),
  provider_id UUID REFERENCES users(id),
  provider_name VARCHAR(255),
  position INTEGER,
  estimated_wait_minutes INTEGER,
  checked_in_at TIMESTAMP,
  status VARCHAR(50),
  called_at TIMESTAMP,
  admitted_at TIMESTAMP,
  left_at TIMESTAMP,
  actual_wait_minutes INTEGER,
  system_check_completed BOOLEAN,
  camera_working BOOLEAN,
  microphone_working BOOLEAN,
  speakers_working BOOLEAN,
  connection_speed DECIMAL(10,2),
  browser_compatible BOOLEAN,
  questionnaire_completed BOOLEAN,
  consent_signed BOOLEAN,
  payment_verified BOOLEAN,
  timeout_at TIMESTAMP
);

-- Telehealth consents
CREATE TABLE telehealth_consents (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  consented_at TIMESTAMP,
  consent_version VARCHAR(10),
  ip_address VARCHAR(45),
  user_agent TEXT,
  consent_text TEXT,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP
);

-- Pre-visit questionnaires
CREATE TABLE pre_visit_questionnaires (
  id UUID PRIMARY KEY,
  visit_id UUID REFERENCES telehealth_visits(id),
  patient_id UUID REFERENCES patients(id),
  submitted_at TIMESTAMP,
  responses JSONB
);
```

## Next Steps

1. **Video Provider Integration**:
   - Implement actual Twilio Video integration
   - Add Zoom SDK support
   - Implement Agora RTC

2. **Frontend Development**:
   - Build React/Next.js patient portal
   - Create provider dashboard
   - Implement WebRTC video components
   - Build waiting room UI

3. **Enhanced Features**:
   - Automated appointment reminders (email/SMS)
   - Virtual background support
   - Noise cancellation
   - Language translation
   - Closed captioning
   - Multi-party consultations (specialists)

4. **Clinical Integration**:
   - EHR integration for visit notes
   - E-prescribing system connection
   - Lab order integration
   - Insurance eligibility verification

5. **Analytics & Quality**:
   - Patient satisfaction surveys
   - Provider performance metrics
   - Video quality analytics
   - Outcome tracking

## Support

For technical support or questions:
- Email: telehealth-support@ils2.com
- Phone: 1-800-ILS-TELE
- Documentation: https://docs.ils2.com/telehealth

## License

Copyright © 2024 ILS 2.0. All rights reserved.
