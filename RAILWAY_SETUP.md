# Railway Deployment Guide - Google OAuth & Stripe Integration

This guide will help you configure Google Sign-In and Stripe subscription payments for your ILS 2.0 application on Railway.

## Prerequisites

- Railway account with project deployed
- Google Cloud Console account
- Stripe account

---

## Part 1: Google Sign-In Setup

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: `ILS 2.0 - Railway Production`

4. **Configure Authorized Redirect URIs**
   Add the following redirect URI (replace with your Railway URL):
   ```
   https://your-app.up.railway.app/api/auth/google/callback
   ```

5. **Save Your Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**
   - Keep these safe - you'll need them for Railway

### Step 2: Configure Railway Environment Variables

1. **Open Railway Dashboard**
   - Go to your project
   - Click on your service
   - Navigate to "Variables" tab

2. **Add Google OAuth Variables**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

3. **Update APP_URL** (if not already set)
   ```bash
   APP_URL=https://your-app.up.railway.app
   ```

4. **Deploy**
   - Railway will automatically redeploy with the new variables
   - Wait for deployment to complete

### Step 3: Test Google Sign-In

1. Visit your application: `https://your-app.up.railway.app/login`
2. Click "Sign In with Google"
3. You should be redirected to Google's consent screen
4. After authorization, you'll be redirected back to your app
5. A new free-tier account will be created automatically

---

## Part 2: Stripe Subscription Setup

### Step 1: Create Stripe Account & Get API Keys

1. **Sign Up / Log In to Stripe**
   - Visit: https://dashboard.stripe.com/
   - Complete account verification (required for live mode)

2. **Get API Keys**
   - Navigate to: https://dashboard.stripe.com/apikeys
   - For testing: Use **Test Mode** keys (starts with `sk_test_`)
   - For production: Use **Live Mode** keys (starts with `sk_live_`)

3. **Copy Your Keys**
   - Publishable key: `pk_test_...` or `pk_live_...`
   - Secret key: `sk_test_...` or `sk_live_...`

### Step 2: Create Subscription Products

1. **Navigate to Products**
   - Go to: https://dashboard.stripe.com/products
   - Click "Add product"

2. **Create Product 1: Professional Plan**
   - **Product name**: Professional Plan
   - **Description**: For growing practices - 3 locations, 10 users, unlimited patients

   **Add Monthly Price:**
   - Price: `£149.00` GBP
   - Billing period: Monthly
   - Click "Save product"
   - Copy the **Price ID** (starts with `price_`)

   **Add Yearly Price:**
   - Click "Add another price"
   - Price: `£1,490.00` GBP (save 17%)
   - Billing period: Yearly
   - Click "Save"
   - Copy the **Price ID**

3. **Create Product 2: Enterprise Plan**
   - **Product name**: Enterprise Plan
   - **Description**: Unlimited locations, users, patients - Full AI suite

   **Add Monthly Price:**
   - Price: `£349.00` GBP
   - Billing period: Monthly
   - Copy the **Price ID**

   **Add Yearly Price:**
   - Price: `£3,490.00` GBP
   - Billing period: Yearly
   - Copy the **Price ID**

4. **(Optional) Create Product 3: Starter Plan**
   - Only if you want a paid starter tier
   - The app defaults to a free tier (`free_ecp`) for new users

### Step 3: Configure Stripe Webhook

1. **Navigate to Webhooks**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"

2. **Configure Endpoint**
   - **Endpoint URL**: `https://your-app.up.railway.app/api/payments/webhook`
   - **Description**: ILS 2.0 Subscription Events

3. **Select Events to Listen To**
   Add the following events:
   ```
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ invoice.paid
   ✓ invoice.payment_failed
   ```

4. **Save and Get Signing Secret**
   - Click "Add endpoint"
   - Copy the **Webhook signing secret** (starts with `whsec_`)

### Step 4: Add Stripe Variables to Railway

1. **Open Railway Dashboard**
   - Navigate to your service → Variables tab

2. **Add All Stripe Environment Variables**

   ```bash
   # Stripe API Keys
   STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
   STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Professional Plan Price IDs
   STRIPE_PRICE_PRO_MONTHLY=price_... (from Step 2)
   STRIPE_PRICE_PRO_YEARLY=price_... (from Step 2)

   # Enterprise Plan Price IDs
   STRIPE_PRICE_ENTERPRISE_MONTHLY=price_... (from Step 2)
   STRIPE_PRICE_ENTERPRISE_YEARLY=price_... (from Step 2)

   # Optional: Starter Plan (if created)
   STRIPE_PRICE_STARTER_MONTHLY=price_...
   STRIPE_PRICE_STARTER_YEARLY=price_...
   ```

3. **Save Variables**
   - Railway will automatically redeploy
   - Wait for deployment to complete

### Step 5: Test Stripe Integration

1. **Navigate to Subscription Page**
   - Visit: `https://your-app.up.railway.app/subscription`

2. **Test Checkout Flow**
   - Click "Upgrade" on Professional or Enterprise plan
   - You'll be redirected to Stripe Checkout
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete the test payment

3. **Verify Subscription**
   - Check Stripe Dashboard → Customers
   - You should see a new customer with an active subscription
   - Your app should now show the upgraded plan

4. **Test Customer Portal**
   - Click "Manage Billing" button
   - You'll be redirected to Stripe Customer Portal
   - You can update payment methods, cancel subscription, etc.

---

## Part 3: Going to Production

### Switch from Test to Live Mode

1. **Complete Stripe Onboarding**
   - Verify your business information
   - Add bank account details
   - Complete identity verification

2. **Get Live API Keys**
   - Switch Stripe Dashboard to "Live mode"
   - Copy live API keys (starts with `sk_live_` and `pk_live_`)

3. **Recreate Products in Live Mode**
   - Products created in test mode don't transfer
   - Recreate Professional and Enterprise products
   - Get new live Price IDs

4. **Update Webhook**
   - Create a new webhook endpoint in live mode
   - Use the same URL: `https://your-app.up.railway.app/api/payments/webhook`
   - Select the same events
   - Get new live webhook secret

5. **Update Railway Variables**
   - Replace all test keys with live keys
   - Update all price IDs with live price IDs
   - Railway will redeploy automatically

### Security Checklist

- ✅ All secrets are in Railway environment variables (not in code)
- ✅ HTTPS is enabled on Railway (automatic)
- ✅ CORS is configured correctly
- ✅ SESSION_SECRET is set to a strong random value
- ✅ Webhook signature verification is enabled
- ✅ Google OAuth redirect URIs are correctly configured

---

## Part 4: Features Overview

### What's Already Implemented

#### Google Sign-In (OAuth 2.0)
- ✅ Backend: `/server/routes/google-auth.ts`
- ✅ Frontend: Login page with Google button
- ✅ Auto-creates free-tier accounts for new users
- ✅ Profile image sync from Google
- ✅ Secure session management

#### Stripe Subscriptions
- ✅ Backend: `/server/routes/payments.ts`
- ✅ Frontend: Subscription management page
- ✅ Stripe Checkout integration
- ✅ Customer Portal for self-service billing
- ✅ Webhook event handling:
  - Subscription created/updated
  - Subscription cancelled
  - Payment succeeded
  - Payment failed
- ✅ Subscription history tracking
- ✅ Automatic plan enforcement

#### Available Routes
- `GET /login` - Login page with Google Sign-In button
- `GET /api/auth/google` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - OAuth callback
- `GET /subscription` - Subscription management page
- `GET /api/payments/subscription-plans` - Get available plans
- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/create-portal-session` - Open billing portal
- `GET /api/payments/subscription-status` - Get current subscription
- `POST /api/payments/webhook` - Stripe webhook handler

---

## Troubleshooting

### Google Sign-In Issues

**Error: "Google Sign-In is not configured"**
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Railway
- Verify the values are correct (no extra spaces)
- Redeploy the application

**Error: "Redirect URI mismatch"**
- Ensure the redirect URI in Google Console exactly matches:
  ```
  https://your-actual-railway-url.up.railway.app/api/auth/google/callback
  ```
- No trailing slash
- Must use HTTPS
- Must match your APP_URL

**Users can't sign in**
- Check Railway logs: `railway logs`
- Verify Google+ API is enabled
- Check that redirect URI is whitelisted

### Stripe Issues

**Error: "No such price"**
- Price IDs must match exactly (case-sensitive)
- Ensure you're using the correct mode (test vs live)
- Price must be active in Stripe Dashboard

**Webhook events not received**
- Verify webhook URL is correct
- Check webhook signing secret matches
- View webhook delivery logs in Stripe Dashboard
- Ensure Railway app is running

**Checkout session creation fails**
- Check STRIPE_SECRET_KEY is valid
- Verify user has a companyId
- Check Railway logs for detailed error

**Payment succeeds but subscription doesn't update**
- Check webhook is configured correctly
- View webhook events in Stripe Dashboard
- Verify webhook secret matches
- Check Railway logs for webhook processing errors

### General Issues

**Environment variables not updating**
- Railway redeploys automatically
- Wait 1-2 minutes for deployment
- Check deployment logs
- Clear browser cache

**CORS errors**
- Set `CORS_ORIGIN` to your frontend URL
- Include protocol: `https://your-app.up.railway.app`

---

## Support & Resources

### Documentation
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Stripe Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Railway Docs: https://docs.railway.app/

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Monitoring
- Railway Logs: `railway logs` or Railway Dashboard
- Stripe Dashboard: Monitor payments and subscriptions
- Google Cloud Console: Monitor OAuth usage

---

## Quick Reference

### Railway Environment Variables Needed

```bash
# Core
APP_URL=https://your-app.up.railway.app
SESSION_SECRET=<generate-with-openssl-rand-hex-32>

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_ENTERPRISE_MONTHLY=
STRIPE_PRICE_ENTERPRISE_YEARLY=

# Database (Auto-injected by Railway if using Railway Postgres)
DATABASE_URL=

# Redis (Auto-injected by Railway if using Railway Redis)
REDIS_URL=
```

### Important URLs to Configure

- **Google OAuth Redirect**: `https://your-app.up.railway.app/api/auth/google/callback`
- **Stripe Webhook**: `https://your-app.up.railway.app/api/payments/webhook`

---

## Next Steps

After completing this setup:

1. ✅ Test Google Sign-In with a real Google account
2. ✅ Test Stripe checkout with test cards
3. ✅ Verify webhooks are being received
4. ✅ Test the customer billing portal
5. ✅ Complete Stripe onboarding for live mode
6. ✅ Switch to live credentials
7. ✅ Monitor the first real subscription

**Your ILS 2.0 application is now ready for production with Google OAuth and Stripe! 🚀**
