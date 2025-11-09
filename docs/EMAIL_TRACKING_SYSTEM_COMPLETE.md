# Email Tracking & Communication System - Complete Implementation

## Overview
A comprehensive email communication system with full tracking capabilities for all customer interactions including invoices, prescription reminders, recalls, and general communications. Every email interaction is measurable with detailed analytics on opens, clicks, devices, and engagement patterns.

## System Architecture

### Database Schema (3 Core Tables)

#### 1. `email_templates`
**Purpose:** Reusable email templates with variable substitution
- **Key Fields:**
  - `id`, `company_id`, `name`, `description`
  - `email_type` (invoice, receipt, prescription_reminder, recall_notification, etc.)
  - `subject`, `html_content`, `text_content`
  - `variables` (JSONB array of available variables like {{customerName}})
  - `is_active`, `is_default`, `created_by`
- **Indexes:** company_id, email_type, is_active
- **Use Case:** Store reusable templates that admins can customize

#### 2. `email_logs`
**Purpose:** Complete audit trail of all sent emails with engagement tracking
- **Key Fields:**
  - `id`, `company_id`, `recipient_email`, `recipient_name`, `patient_id`
  - `email_type`, `subject`, `html_content`, `text_content`
  - `status` (queued, sent, delivered, opened, clicked, bounced, failed, spam)
  - `tracking_id` (unique ID for tracking pixel and link clicks)
  - `template_id`, `related_entity_type`, `related_entity_id`
  - `sent_by`, `sent_at`, `delivered_at`
  - `open_count`, `first_opened_at`, `last_opened_at`
  - `click_count`, `first_clicked_at`, `last_clicked_at`
  - `error_message`, `retry_count`, `metadata`
- **Indexes:** company_id, recipient_email, patient_id, email_type, status, sent_at, tracking_id, related entities
- **Use Case:** Track every email sent with full engagement metrics

#### 3. `email_tracking_events`
**Purpose:** Detailed event log for every interaction (opens, clicks, bounces)
- **Key Fields:**
  - `id`, `email_log_id`
  - `event_type` (sent, delivered, opened, clicked, bounced, spam, unsubscribed)
  - `event_data` (JSONB - click URLs, bounce reasons, etc.)
  - `user_agent`, `ip_address`, `location` (JSONB), `device`
  - `timestamp`
- **Indexes:** email_log_id, event_type, timestamp
- **Use Case:** Granular tracking of every email interaction for analytics

## EmailTrackingService

### Core Capabilities

#### 1. **Send Email with Tracking**
```typescript
await emailTrackingService.sendEmail({
  to: "customer@example.com",
  toName: "John Doe",
  subject: "Invoice #12345",
  htmlContent: "<html>...</html>",
  textContent: "Plain text version",
  emailType: "invoice",
  companyId: "company123",
  sentBy: "user456",
  patientId: "patient789",
  relatedEntityType: "invoice",
  relatedEntityId: "inv12345",
  metadata: { invoiceTotal: 150.00 }
});
```

**Tracking Features:**
- Generates unique `tracking_id` for each email
- Injects 1x1 transparent tracking pixel at end of HTML
- Replaces all links with tracked redirect URLs
- Logs email in database with status "queued"
- Sends via SMTP (NodeMailer)
- Updates status to "sent" on success
- Records "failed" status with error message on failure

#### 2. **Send Template Email**
```typescript
await emailTrackingService.sendTemplateEmail(
  templateId,
  {
    customerName: "John Doe",
    invoiceNumber: "12345",
    amount: "$150.00",
    dueDate: "2025-11-10"
  },
  {
    to: "customer@example.com",
    companyId: "company123",
    sentBy: "user456",
    patientId: "patient789"
  }
);
```

**Template Features:**
- Fetches template from database
- Replaces all `{{variableName}}` placeholders
- Uses template's email_type automatically
- Stores template_id in email log for reference

#### 3. **Track Email Opens**
- **Endpoint:** `GET /api/emails/track/open/:trackingId`
- **Public** (no auth required)
- Updates `open_count`, `first_opened_at`, `last_opened_at`
- Changes status from "sent"/"delivered" to "opened"
- Logs tracking event with user-agent, IP, device type
- Returns 1x1 transparent GIF (always succeeds)

#### 4. **Track Email Clicks**
- **Endpoint:** `GET /api/emails/track/click/:trackingId?url=<original_url>`
- **Public** (no auth required)
- Updates `click_count`, `first_clicked_at`, `last_clicked_at`
- Changes status to "clicked"
- Logs tracking event with clicked URL, user-agent, IP, device
- Redirects to original URL (even if tracking fails)

#### 5. **Get Email Analytics**
```typescript
const analytics = await emailTrackingService.getAnalytics(
  companyId,
  {
    emailType: "invoice", // optional
    startDate: new Date("2025-11-01"),
    endDate: new Date("2025-11-30"),
    patientId: "patient789" // optional
  }
);
```

**Returns:**
```typescript
{
  totalSent: 150,
  totalDelivered: 148,
  totalOpened: 89,
  totalClicked: 34,
  totalBounced: 2,
  totalFailed: 0,
  openRate: 59.33, // percentage
  clickRate: 38.20, // percentage of opened
  bounceRate: 1.33, // percentage
  avgTimeToOpen: 45.2, // minutes
  deviceBreakdown: {
    desktop: 67,
    mobile: 20,
    tablet: 2,
    unknown: 0
  },
  topClickedLinks: [
    { url: "https://example.com/invoice/12345", clicks: 25 },
    { url: "https://example.com/pay", clicks: 9 }
  ]
}
```

#### 6. **Get Patient Email History**
```typescript
const history = await emailTrackingService.getPatientEmailHistory(
  patientId,
  companyId
);
```

Returns all emails sent to a specific patient, ordered by sent date descending.

#### 7. **Retry Failed Email**
```typescript
const retried = await emailTrackingService.retryEmail(emailLogId);
```

- Generates new tracking_id
- Resends email via SMTP
- Updates retry_count
- Clears error_message on success

## API Routes

### Email Sending

#### `POST /api/emails/send`
**Auth Required:** Yes
**Body:**
```json
{
  "to": "customer@example.com",
  "toName": "John Doe",
  "subject": "Invoice #12345",
  "htmlContent": "<html>...</html>",
  "textContent": "Plain text",
  "emailType": "invoice",
  "patientId": "patient789",
  "relatedEntityType": "invoice",
  "relatedEntityId": "inv12345",
  "metadata": {}
}
```

#### `POST /api/emails/send-template`
**Auth Required:** Yes
**Body:**
```json
{
  "templateId": "template123",
  "to": "customer@example.com",
  "toName": "John Doe",
  "variables": {
    "customerName": "John Doe",
    "invoiceNumber": "12345"
  },
  "patientId": "patient789"
}
```

#### `POST /api/emails/:id/retry`
**Auth Required:** Yes
**Params:** `id` (email_log_id)
**Returns:** Updated email log

### Email Tracking (Public)

#### `GET /api/emails/track/open/:trackingId`
**Auth Required:** No
**Returns:** 1x1 transparent GIF

#### `GET /api/emails/track/click/:trackingId?url=<url>`
**Auth Required:** No
**Returns:** HTTP 302 redirect to original URL

### Email Analytics

#### `GET /api/emails/analytics`
**Auth Required:** Yes
**Query Params:**
- `emailType` (optional)
- `startDate` (optional, ISO 8601)
- `endDate` (optional, ISO 8601)
- `patientId` (optional)
**Returns:** Analytics object (see above)

#### `GET /api/emails/logs`
**Auth Required:** Yes
**Query Params:**
- `emailType` (optional)
- `status` (optional)
- `patientId` (optional)
- `page` (default: 1)
- `limit` (default: 50)
**Returns:** Array of email logs with pagination

#### `GET /api/emails/logs/:id`
**Auth Required:** Yes
**Params:** `id` (email_log_id)
**Returns:** Email log with all tracking events

#### `GET /api/emails/patient/:patientId`
**Auth Required:** Yes
**Params:** `patientId`
**Returns:** All emails sent to the patient

### Email Templates

#### `GET /api/emails/templates`
**Auth Required:** Yes
**Query Params:**
- `emailType` (optional)
- `isActive` (optional, boolean)
**Returns:** Array of templates

#### `GET /api/emails/templates/:id`
**Auth Required:** Yes
**Params:** `id` (template_id)
**Returns:** Single template

#### `POST /api/emails/templates`
**Auth Required:** Yes
**Body:**
```json
{
  "name": "Invoice Template",
  "description": "Standard invoice email",
  "emailType": "invoice",
  "subject": "Invoice {{invoiceNumber}} from {{companyName}}",
  "htmlContent": "<html>...</html>",
  "textContent": "Plain text version",
  "variables": ["invoiceNumber", "companyName", "customerName", "amount"],
  "isActive": true,
  "isDefault": false
}
```

#### `PATCH /api/emails/templates/:id`
**Auth Required:** Yes
**Body:** Partial template object
**Returns:** Updated template

#### `DELETE /api/emails/templates/:id`
**Auth Required:** Yes
**Params:** `id` (template_id)
**Returns:** Success message

## SMTP Configuration

### Environment Variables Required
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false  # true for 465, false for other ports
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=ILS System
SMTP_FROM_EMAIL=noreply@yourcompany.com
BASE_URL=http://localhost:3000  # For tracking URLs
```

### Gmail Setup
1. Enable 2FA on Google account
2. Generate App Password (Google Account > Security > App Passwords)
3. Use app password as `SMTP_PASSWORD`

### Other Providers
- **SendGrid:** smtp.sendgrid.net:587
- **Mailgun:** smtp.mailgun.org:587
- **AWS SES:** email-smtp.us-east-1.amazonaws.com:587

## Integration Examples

### 1. Send Invoice After POS Transaction
```typescript
// In POS transaction completion
const transaction = await createPosTransaction(data);

// Send invoice via email
await emailTrackingService.sendTemplateEmail(
  invoiceTemplateId,
  {
    customerName: customer.name,
    invoiceNumber: transaction.invoiceNumber,
    date: new Date().toLocaleDateString(),
    items: transaction.items,
    total: transaction.total
  },
  {
    to: customer.email,
    toName: customer.name,
    companyId: user.companyId,
    sentBy: user.id,
    patientId: customer.id,
    relatedEntityType: "pos_transaction",
    relatedEntityId: transaction.id
  }
);
```

### 2. Prescription Renewal Reminder (Scheduled Job)
```typescript
// Run daily to find expiring prescriptions
const expiringPrescriptions = await db
  .select()
  .from(prescriptions)
  .where(
    and(
      eq(prescriptions.companyId, companyId),
      gte(prescriptions.expiryDate, new Date()),
      lte(prescriptions.expiryDate, addDays(new Date(), 30))
    )
  );

for (const prescription of expiringPrescriptions) {
  await emailTrackingService.sendTemplateEmail(
    prescriptionReminderTemplateId,
    {
      patientName: prescription.patientName,
      expiryDate: prescription.expiryDate.toLocaleDateString(),
      daysUntilExpiry: dateDiff(new Date(), prescription.expiryDate)
    },
    {
      to: prescription.patientEmail,
      toName: prescription.patientName,
      companyId,
      sentBy: "system",
      patientId: prescription.patientId,
      relatedEntityType: "prescription",
      relatedEntityId: prescription.id
    }
  );
}
```

### 3. Patient Recall Notification
```typescript
// Find patients due for recall
const patientsForRecall = await db
  .select()
  .from(patients)
  .where(
    and(
      eq(patients.companyId, companyId),
      lte(patients.nextRecallDate, new Date())
    )
  );

for (const patient of patientsForRecall) {
  await emailTrackingService.sendTemplateEmail(
    recallTemplateId,
    {
      patientName: patient.name,
      lastVisitDate: patient.lastVisitDate.toLocaleDateString(),
      recommendedDate: patient.nextRecallDate.toLocaleDateString()
    },
    {
      to: patient.email,
      toName: patient.name,
      companyId,
      sentBy: "system",
      patientId: patient.id,
      relatedEntityType: "recall",
      relatedEntityId: patient.id
    }
  );
}
```

## Analytics Dashboard Metrics

### Key Performance Indicators (KPIs)
1. **Overall Email Health**
   - Total emails sent (last 30 days)
   - Delivery rate (delivered / sent)
   - Open rate (opened / delivered)
   - Click-through rate (clicked / opened)
   - Bounce rate (bounced / sent)

2. **Email Type Performance**
   - Breakdown by type (invoice, recall, reminder, etc.)
   - Open rates by type
   - Click rates by type
   - Best performing type

3. **Engagement Patterns**
   - Average time to first open
   - Peak open times (hour of day)
   - Peak open days (day of week)
   - Device breakdown (desktop vs mobile vs tablet)

4. **Patient Communication**
   - Most engaged patients (highest open/click rates)
   - Patients who never open emails
   - Patients who need follow-up

5. **Template Performance**
   - Open rates by template
   - Click rates by template
   - Most used templates
   - Templates needing improvement

## Security & Privacy

### Data Protection
- All email content stored encrypted in database
- Tracking IDs are cryptographically secure (32-byte random hex)
- IP addresses and location data comply with GDPR/CCPA
- PII (email addresses) never exposed in tracking URLs

### Opt-Out Mechanism
```typescript
// Add unsubscribe link to all marketing emails
const unsubscribeUrl = `${baseUrl}/api/emails/unsubscribe/${trackingId}`;
```

### Rate Limiting
- Implement rate limiting on email sending endpoints
- Prevent abuse of tracking pixel endpoint
- Monitor for spam complaints

## Testing Checklist

### Email Sending
- [ ] Send custom email successfully
- [ ] Send template email with variable substitution
- [ ] Handle SMTP failures gracefully
- [ ] Retry failed emails
- [ ] Queue emails when SMTP unavailable

### Tracking
- [ ] Tracking pixel loads and updates open count
- [ ] Multiple opens increment count correctly
- [ ] Click tracking redirects to correct URL
- [ ] Multiple clicks tracked separately
- [ ] Device detection works correctly

### Analytics
- [ ] Analytics calculations are accurate
- [ ] Date filtering works
- [ ] Email type filtering works
- [ ] Patient filtering works
- [ ] Device breakdown is correct

### Templates
- [ ] Create template
- [ ] Update template
- [ ] Delete template
- [ ] Variable substitution works
- [ ] Default template selection

### API
- [ ] All endpoints require authentication (except tracking)
- [ ] Company isolation works (multi-tenant)
- [ ] Error handling returns proper status codes
- [ ] Pagination works correctly

## Performance Optimization

### Database Indexes
- All foreign keys indexed
- Compound indexes on frequently queried columns
- Partial indexes on status for active emails

### Caching Strategy
- Cache email templates in Redis
- Cache analytics for 5 minutes
- Invalidate cache on template update

### Batch Operations
- Send bulk emails in batches of 50
- Process tracking events asynchronously
- Generate analytics reports in background

## Monitoring & Alerting

### Metrics to Track
- Email send rate (emails/minute)
- Email failure rate
- Average delivery time
- Bounce rate threshold alerts
- Spam complaint alerts

### Logging
- Log all email sends with status
- Log SMTP errors with full stack trace
- Log tracking pixel requests
- Log click tracking redirects

## Future Enhancements

### Phase 2 Features
1. **A/B Testing:** Test different subject lines and content
2. **Email Scheduling:** Schedule emails for specific date/time
3. **Drip Campaigns:** Automated email sequences
4. **Segmentation:** Group patients for targeted campaigns
5. **Personalization Engine:** AI-powered content suggestions
6. **Email Builder:** Drag-and-drop template editor
7. **Webhooks:** Real-time notifications for email events
8. **SMS Integration:** Extend tracking to SMS messages

### Advanced Analytics
- Heatmaps of email engagement
- Cohort analysis of patient engagement
- Predictive analytics for optimal send times
- Email ROI tracking (revenue per email)

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in .env
2. Verify SMTP host/port are correct
3. Check firewall allows outbound SMTP
4. Test SMTP connection separately
5. Check email logs table for error messages

### Tracking Not Working
1. Verify BASE_URL is set correctly
2. Check tracking_id is unique
3. Ensure tracking pixel is at end of HTML
4. Verify link replacement is working
5. Check browser isn't blocking tracking pixel

### Poor Open Rates
1. Check email going to spam folder
2. Improve subject line
3. Send at optimal times
4. Verify email addresses are valid
5. Clean up bounced emails

### High Bounce Rate
1. Verify email addresses before sending
2. Use double opt-in for marketing emails
3. Remove bounced emails from list
4. Check SPF/DKIM/DMARC records
5. Monitor sender reputation

## Conclusion

This email tracking system provides complete visibility into all customer communications with measurable analytics. Every interaction is tracked, from initial send to every open and click, giving company admins full insight into engagement patterns and communication effectiveness.

**Key Benefits:**
- 100% email transparency
- Real-time engagement tracking
- Patient-level communication history
- Template-based efficiency
- Multi-tenant isolation
- HIPAA-compliant audit trail
- Scalable architecture
- Extensible for future features

**Implementation Status:** ✅ Core system complete (database, service, API routes)
**Next Steps:** Frontend integration (POS invoice button, analytics dashboard, template manager)
