# 🚀 Platform Admin Quick Reference

## 📧 Assign Paid Subscription to Any User

### Method 1: By Email (Recommended) ⭐

```bash
curl -X POST "https://yourapp.com/api/admin/users/subscription/by-email" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "plan": "full",
    "reason": "Partner account"
  }'
```

### Method 2: Bulk Assignment 🚀

```bash
curl -X POST "https://yourapp.com/api/admin/users/subscription/bulk" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["user1@example.com", "user2@example.com", "user3@example.com"],
    "plan": "full",
    "reason": "Team onboarding"
  }'
```

### Method 3: By User ID

```bash
curl -X PUT "https://yourapp.com/api/admin/users/USER_ID/subscription" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "full",
    "reason": "Demo account"
  }'
```

---

## 🔍 Search Users

```bash
curl -X GET "https://yourapp.com/api/admin/users/search?q=hospital" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🏢 Manage Company Subscriptions

### Update Company Subscription

```bash
curl -X PUT "https://yourapp.com/api/admin/companies/COMPANY_ID/subscription" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "full",
    "reason": "Partner agreement"
  }'
```

### Grant Subscription Exemption

```bash
curl -X PUT "https://yourapp.com/api/admin/companies/COMPANY_ID/subscription-exemption" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exempt": true,
    "reason": "NHS partner - complimentary access"
  }'
```

---

## 📊 View Statistics

```bash
curl -X GET "https://yourapp.com/api/admin/subscription-stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## ✅ Subscription Plans

- **`free_ecp`** - Basic knowledge base only
- **`full`** - Complete platform access with all AI features

---

## 🔐 Authorization

All endpoints require `platform_admin` role.

Use your session cookie or JWT token for authentication.

---

## 📝 Common Use Cases

### 1. Demo Account
```json
{
  "email": "demo@potential-client.com",
  "plan": "full",
  "reason": "Sales demo for Q4 presentation"
}
```

### 2. Partner Access
```json
{
  "emails": ["partner1@lab.com", "partner2@lab.com"],
  "plan": "full",
  "reason": "Partner onboarding - 6 month trial"
}
```

### 3. Support Ticket
```json
{
  "email": "customer@practice.com",
  "plan": "full",
  "reason": "Temporary upgrade for support ticket #12345"
}
```

### 4. Beta Tester
```json
{
  "email": "tester@beta-group.com",
  "plan": "full",
  "reason": "Beta testing program - AI features"
}
```

---

## 🎯 Response Codes

- **200** - Success
- **400** - Invalid request (bad plan or missing data)
- **401** - Not authenticated
- **403** - Not platform admin
- **404** - User/company not found
- **500** - Server error

---

For full documentation, see `MASTER_ADMIN_SUBSCRIPTION_ASSIGNMENT.md`
