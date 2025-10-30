## Smoke Test Checklist (Local)

Prereqs: `.env` with `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_SETUP_KEY`. Run `npm install && npm run db:push`.

### 1) Start Dev
```bash
npm run dev
# Server should bind to http://localhost:3000
```

### 2) Health Check
```bash
curl http://localhost:3000/health
```

### 3) Basic Auth Flow (local email/password)
- Visit `http://localhost:3000`
- Use Email Signup/Login pages (`/email-signup`, `/email-login`) if configured
- Expect session cookie and redirect to role dashboard when approved/active

### 4) AI Assistant (requires auth)
```bash
# Save cookies from browser session to cookies.txt or test via UI
curl -X POST http://localhost:3000/api/ai-assistant/ask \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"question": "What are my sales trends?"}'
```

### 5) Companies APIs (tenancy)
```bash
curl http://localhost:3000/api/companies/YOUR_COMPANY_ID -b cookies.txt
```

### 6) BI Dashboard
```bash
curl http://localhost:3000/api/ai-intelligence/dashboard -b cookies.txt
```

### 7) Frontend Gate Checks
- Pending: as a pending user, expect redirect to `/pending-approval`
- Suspended: as suspended, expect `/account-suspended`
- No role: expect `/signup`/`/onboarding`
- No company (non-platform): expect `/onboarding`

### 8) WebSocket
- Navigate to dashboards that stream updates; confirm no console errors

### 9) PDF
- Trigger a PDF route via UI or curl under `/api/pdf` (auth required)

### 10) Tests (optional)
```bash
npm run test:all
```

