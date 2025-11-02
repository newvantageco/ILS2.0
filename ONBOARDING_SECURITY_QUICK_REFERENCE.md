# Quick Reference: New Onboarding & Security Features

## Automated Multi-Tenant Onboarding

### Create New Company + User (Self-Service)
```bash
POST /api/onboarding/signup
Content-Type: application/json

{
  "email": "admin@acmeoptical.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "company_admin",
  "companyName": "Acme Optical",
  "companyType": "ecp",
  "companyEmail": "contact@acmeoptical.com",
  "companyPhone": "+1-555-0123"
}

✅ Response: User + Company created, user auto-logged in
```

### Join Existing Company
```bash
POST /api/onboarding/join
Content-Type: application/json

{
  "email": "tech@acmeoptical.com",
  "password": "SecurePass456!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "lab_tech",
  "companyId": "550e8400-e29b-41d4-a716-446655440000"
}

✅ Response: User created with "pending" status (needs admin approval)
```

### Company Search
```bash
GET /api/onboarding/companies/search?query=Optical

✅ Response: List of active companies matching "Optical"
```

### Check Company Name Availability
```bash
GET /api/onboarding/company-check?name=Acme%20Optical

✅ Response: { exists: boolean, company?: {...} }
```

---

## Security Features

### Rate Limits (Per IP Address)

| Endpoint Pattern | Limit | Window | Purpose |
|---|---|---|---|
| `/api/*` (global) | 100 req | 15 min | General DDoS protection |
| `/api/auth/login*` | 5 req | 15 min | Brute force prevention |
| `/api/auth/signup*` | 5 req | 15 min | Signup abuse prevention |
| `/api/onboarding/*` | 5 req | 15 min | Onboarding abuse prevention |
| `/api/orders`, `/api/patients` | 30 req | 15 min | Write operation limiting |
| `/api/upload/*` | 10 req | 60 min | Storage abuse prevention |
| `/api/ai-assistant/*` | 20 req | 60 min | API cost protection |

### Security Headers (Helmet.js)

All responses include:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: ...` (strict CSP with Stripe/fonts allowlist)

### Session Cookies

Production cookies automatically set:
- `httpOnly: true` (prevents XSS)
- `secure: true` (HTTPS only)
- `sameSite: 'strict'` (prevents CSRF)

---

## Testing Rate Limits

### Test Auth Rate Limit:
```bash
# Make 6 rapid requests (should fail on 6th)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Expected: 429 Too Many Requests after 5 attempts
```

### Test Global Rate Limit:
```bash
# Make 101 rapid requests
for i in {1..101}; do
  curl http://localhost:3000/api/health
done

# Expected: 429 Too Many Requests after 100 requests
```

---

## Frontend Integration Examples

### React: Onboarding Form

```tsx
import { useState } from 'react';

export function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    companyType: 'ecp' as const,
    role: 'company_admin' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/onboarding/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include', // Important for session cookie
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Signup successful:', result);
        // User is now logged in automatically
        window.location.href = '/dashboard';
      } else {
        const error = await response.json();
        console.error('Signup failed:', error);
        alert(error.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      {/* ... other fields ... */}
      <button type="submit">Create Company & Account</button>
    </form>
  );
}
```

### Real-Time Company Name Validation

```tsx
const [companyName, setCompanyName] = useState('');
const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

useEffect(() => {
  const checkName = async () => {
    if (companyName.length < 2) {
      setNameAvailable(null);
      return;
    }

    const response = await fetch(
      `/api/onboarding/company-check?name=${encodeURIComponent(companyName)}`
    );
    const result = await response.json();
    setNameAvailable(!result.exists);
  };

  const timeoutId = setTimeout(checkName, 500); // Debounce
  return () => clearTimeout(timeoutId);
}, [companyName]);

// Display indicator:
{nameAvailable === false && (
  <span className="text-red-500">Company name already taken</span>
)}
{nameAvailable === true && (
  <span className="text-green-500">Company name available ✓</span>
)}
```

---

## Environment Variables

### Required for Production:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/ils_production
SESSION_SECRET=<generate-with-openssl-rand-hex-32>
RESEND_API_KEY=re_your_api_key
STRIPE_SECRET_KEY=sk_live_your_key
NODE_ENV=production
```

### Generate Secure Session Secret:
```bash
openssl rand -hex 32
```

---

## Troubleshooting

### "Too many requests" Error (429)
**Cause**: Rate limit exceeded  
**Solution**: Wait for the window to reset (see table above)  
**Dev Workaround**: Restart server to reset in-memory rate limits

### "Company already exists" Error
**Cause**: Company name is not unique  
**Solution**: Choose a different name or join the existing company  
**Check**: Use `/api/onboarding/company-check` endpoint

### "Email already registered" Error
**Cause**: User with this email already exists  
**Solution**: Login instead of signing up  
**Alternative**: Use password reset flow (if implemented)

### "Password must be at least 12 characters" Error
**Cause**: Password too short (security requirement)  
**Solution**: Use a password with 12+ characters

### Session Not Persisting
**Cause**: Missing `credentials: 'include'` in fetch  
**Solution**: Add `credentials: 'include'` to all API requests  
**Check**: Browser cookie settings (should allow)

---

## Security Best Practices

### Password Requirements:
- Minimum 12 characters
- Recommended: Mix of uppercase, lowercase, numbers, symbols
- Never store in plaintext (auto-hashed with bcrypt)

### API Keys:
- Never commit to git
- Use environment variables
- Rotate regularly
- Restrict permissions to minimum required

### Rate Limiting:
- Applies per IP address
- Consider proxy/CDN setup for production
- Monitor logs for abuse patterns
- Whitelist internal IPs if needed

---

## API Response Formats

### Success Response:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "company_admin",
    "companyId": "uuid",
    "accountStatus": "active"
  },
  "company": {
    "id": "uuid",
    "name": "Acme Optical",
    "type": "ecp",
    "status": "active"
  }
}
```

### Error Response:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must be at least 12 characters"
    }
  ]
}
```

### Rate Limit Headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1699000000
```

---

## Deployment Checklist

- [ ] `NODE_ENV=production` set
- [ ] `SESSION_SECRET` generated securely
- [ ] HTTPS configured and enforced
- [ ] Database connection pooling enabled
- [ ] Rate limits tested in production
- [ ] Monitoring/alerting configured
- [ ] Backup strategy in place
- [ ] BAAs signed with vendors (HIPAA compliance)

---

**Last Updated**: November 2, 2025  
**See Also**: MISSING_ELEMENTS_IMPLEMENTATION_SUMMARY.md
