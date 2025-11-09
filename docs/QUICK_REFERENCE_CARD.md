# 🎴 Quick Reference Card - New Features

## 🚀 One-Minute Setup

```bash
# 1. Create company and assign user (replace YOUR_EMAIL)
psql postgres://neon:npg@localhost:5432/ils_db << 'EOF'
BEGIN;
INSERT INTO companies (id, name, type, status, contact_email)
VALUES ('99999999-9999-9999-9999-999999999999', 'Test Company', 'dispenser', 'active', 'test@example.com')
ON CONFLICT DO NOTHING;
UPDATE users SET company_id = '99999999-9999-9999-9999-999999999999'
WHERE email = 'YOUR_EMAIL@EXAMPLE.COM';
COMMIT;
EOF

# 2. Restart browser session
# 3. Test at http://localhost:3000
```

---

## 🗺️ Navigation Quick Access

| Feature | Path | Icon |
|---------|------|------|
| AI Assistant | `/ecp/ai-assistant` | 🧠 |
| Company Management | `/ecp/company` | 🏢 |
| BI Dashboard | `/ecp/bi-dashboard` | 📊 |

*Replace `/ecp/` with your role: `/lab/`, `/supplier/`, `/admin/`*

---

## 🧠 AI Assistant - Key Actions

```
ASK QUESTION:
└─ Type in chat box → Enter → AI responds

UPLOAD DOCUMENT:
└─ Choose File → Select PDF/DOCX → Upload Document

CHECK LEARNING:
└─ View progress bar at top → Shows 0-100% autonomy

PROVIDE FEEDBACK:
└─ Click 👍 or 👎 below AI response

NEW CONVERSATION:
└─ Click "New Conversation" in sidebar
```

---

## 🏢 Company Management - Key Actions

```
EDIT PROFILE:
└─ Click Edit → Change fields → Click Save

ADD SUPPLIER (Dispenser):
└─ Click "Add Supplier" → Select supplier → Send Request

APPROVE REQUEST (Supplier):
└─ View pending requests → Click ✓ (approve) or ✗ (reject)
```

---

## 📊 BI Dashboard - What You See

```
TOP SECTION:
├─ KPI Cards (Orders, Revenue, Turnaround, Quality)
└─ Trend indicators (↑ up, ↓ down)

MIDDLE SECTION:
├─ Active Alerts (Critical, Warning, Info)
└─ Severity badges (Red, Yellow, Blue)

BOTTOM SECTION:
├─ AI Insights (with impact levels)
└─ Growth Opportunities (with action items)
```

---

## 🔥 Quick Commands

```bash
# Check server status
curl http://localhost:3000

# Test AI endpoint (after setup)
curl -b cookies.txt http://localhost:3000/api/ai-assistant/stats

# View companies
psql postgres://neon:npg@localhost:5432/ils_db -c "SELECT name, type FROM companies;"

# Check user company assignment
psql postgres://neon:npg@localhost:5432/ils_db -c "SELECT email, company_id FROM users;"
```

---

## 🐛 Troubleshooting Quick Fix

| Problem | Solution |
|---------|----------|
| 403 "Must belong to company" | Run setup SQL from above |
| AI page blank | Log out and back in |
| No navigation items | Clear cache, refresh |
| Can't upload files | Check file size < 10MB |
| Company page empty | Verify company_id set |

---

## 📱 Mobile Quick Test (5 mins)

```
1. ✅ Run setup SQL
2. ✅ Log out and back in
3. ✅ Click "AI Assistant"
4. ✅ Ask "What products do I have?"
5. ✅ Upload a PDF document
6. ✅ Click "Company" → Edit profile
7. ✅ Click "BI Dashboard" → View KPIs
```

---

## 🎯 Learning Progress Levels

| % | Status | Description |
|---|--------|-------------|
| 0-30% | Early Learning | Mostly uses external AI |
| 31-60% | Learning | Mix of local and external |
| 61-90% | Mostly Autonomous | Primarily local AI |
| 91-100% | Fully Autonomous | No external AI needed |

---

## 📊 API Quick Reference

```bash
# AI Assistant
POST   /api/ai-assistant/ask
GET    /api/ai-assistant/conversations
POST   /api/ai-assistant/knowledge/upload

# Company
GET    /api/companies/:id
PATCH  /api/companies/:id
POST   /api/companies/relationships

# Business Intelligence
GET    /api/ai-intelligence/dashboard
GET    /api/ai-intelligence/insights
GET    /api/ai-intelligence/opportunities
```

---

## 💾 File Upload Specs

```
Supported Formats:
├─ PDF   (application/pdf)
├─ DOCX  (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
├─ DOC   (application/msword)
├─ TXT   (text/plain)
├─ CSV   (text/csv)
└─ JSON  (application/json)

Max Size: 10MB
Processing: Automatic text extraction
Storage: Database + File metadata
```

---

## 🔐 Security Features

```
✅ Multi-tenant data isolation
✅ Company-level access control
✅ Session-based authentication
✅ Automatic company_id filtering
✅ Role-based permissions
✅ Secure file upload
```

---

## 🎓 User Roles & Access

| Role | AI | BI | Company | Suppliers |
|------|----|----|---------|-----------|
| ECP | ✅ | ✅ | ✅ | ✅ |
| Supplier | ✅ | ✅ | ✅ | ✅ |
| Lab Tech | ✅ | ✅ | ✅ | ❌ |
| Engineer | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ |

---

## 📚 Documentation Quick Links

```
🎯 START_HERE_INTEGRATION.md     - Main guide
🔧 INITIAL_SETUP_GUIDE.md        - Setup instructions
🧪 TEST_SCENARIOS.md             - Testing procedures
📖 FRONTEND_INTEGRATION_COMPLETE.md - Feature docs
🗺️  VISUAL_INTEGRATION_MAP.md    - Visual guide
📡 API_QUICK_REFERENCE.md        - API documentation
```

---

## ⚡ Performance Targets

```
Page Load:     < 2 seconds
AI Response:   < 5 seconds
File Upload:   < 10 seconds
API Call:      < 500ms
WebSocket:     < 100ms
```

---

## 🎉 Success Checklist

```
Setup Phase:
├─ [✓] Companies created
├─ [✓] Users assigned to companies
├─ [✓] Session refreshed
└─ [✓] No 403 errors

Testing Phase:
├─ [ ] AI chat working
├─ [ ] Documents uploaded
├─ [ ] Company profile edited
├─ [ ] Relationships managed
├─ [ ] BI dashboard viewing
├─ [ ] Learning progress increasing
└─ [ ] Data isolation verified
```

---

## 🆘 Quick Help

```
Server not running?
└─ npm run dev

Database error?
└─ Check PostgreSQL: pg_isready -h localhost

403 errors?
└─ Run setup SQL from top of this card

Still stuck?
└─ Check START_HERE_INTEGRATION.md
```

---

## 📞 Support Resources

| Resource | Location |
|----------|----------|
| Setup Guide | `INITIAL_SETUP_GUIDE.md` |
| User Manual | `FRONTEND_INTEGRATION_COMPLETE.md` |
| Test Cases | `TEST_SCENARIOS.md` |
| API Docs | `API_QUICK_REFERENCE.md` |
| Visual Map | `VISUAL_INTEGRATION_MAP.md` |
| Server Logs | Terminal running `npm run dev` |
| Browser Logs | F12 → Console |

---

**🎊 Ready to test! Start with setup SQL at the top of this card.**

**⏱️ Setup time: 2 minutes**
**📍 URL: http://localhost:3000**
**✅ Status: All systems operational**
