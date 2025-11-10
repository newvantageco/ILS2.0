# Shopify Integration Guide - ILS 2.0

Complete guide for integrating ILS 2.0 with Shopify stores to provide prescription management, AI-powered recommendations, and seamless order synchronization.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Setup & Installation](#setup--installation)
5. [API Reference](#api-reference)
6. [Webhook Events](#webhook-events)
7. [Widget Integration](#widget-integration)
8. [Workflow Examples](#workflow-examples)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [Security & Compliance](#security--compliance)

---

## Overview

The ILS 2.0 Shopify integration enables optical practices to:

- **Sell prescription eyewear online** through Shopify
- **Automatically extract prescription data** from customer-uploaded images using GPT-4 Vision
- **Provide AI-powered lens recommendations** based on customer lifestyle
- **Sync orders bidirectionally** between Shopify and ILS
- **Verify prescriptions** before fulfilling orders
- **Manage inventory** across both platforms
- **Track customer prescriptions** linked to their patient records

### Key Features

✅ OAuth 2.0 Shopify connection
✅ Real-time webhook synchronization
✅ AI prescription OCR with 85%+ accuracy
✅ Multi-tenant architecture (unlimited stores per company)
✅ Encrypted credential storage (AES-256-CBC)
✅ HMAC-SHA256 webhook signature verification
✅ Automatic patient record creation
✅ Prescription verification workflow
✅ Product catalog synchronization
✅ Order fulfillment automation

---

## Prerequisites

### Technical Requirements

- ILS 2.0 instance (v2.0.0+)
- Shopify store (any plan with API access)
- OpenAI API key (for prescription OCR)
- File storage service (S3, Cloudinary, etc.)
- SSL certificate (HTTPS required for webhooks)

### Required Environment Variables

```bash
# ILS 2.0 Configuration
APP_URL=https://your-ils-domain.com
ENCRYPTION_KEY=your-32-byte-encryption-key

# Shopify Configuration
SHOPIFY_WEBHOOK_URL=https://your-ils-domain.com/api/shopify/webhooks

# OpenAI Configuration (for prescription OCR)
OPENAI_API_KEY=sk-...

# File Upload Configuration
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Shopify API Scopes Required

When creating your Shopify app, request the following scopes:

- `read_products` - Read product catalog
- `write_products` - Update product inventory
- `read_orders` - Read order data
- `write_orders` - Update order fulfillment
- `read_customers` - Read customer data
- `write_webhooks` - Register webhooks

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Shopify Store                         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Products  │  │    Orders    │  │  Customers       │    │
│  └─────┬──────┘  └──────┬───────┘  └────────┬─────────┘    │
│        │                 │                    │              │
│        │                 ▼                    │              │
│        │          ┌────────────┐              │              │
│        └─────────►│  Webhooks  │◄─────────────┘              │
│                   └──────┬─────┘                             │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTPS
                           │ HMAC-SHA256 Signature
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        ILS 2.0 API                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │          Shopify Integration Layer                  │     │
│  │  ┌──────────────┐  ┌──────────────────────────┐   │     │
│  │  │ Webhook      │  │ Order Sync Service        │   │     │
│  │  │ Handler      ├─►│ - Create/Update Orders    │   │     │
│  │  │              │  │ - Link Patients           │   │     │
│  │  └──────────────┘  │ - Detect Lens Products    │   │     │
│  │                    │ - Generate AI Recs        │   │     │
│  │  ┌──────────────┐  └──────────────────────────┘   │     │
│  │  │ Prescription │                                  │     │
│  │  │ Verification │  ┌──────────────────────────┐   │     │
│  │  │ Service      ├─►│ GPT-4 Vision OCR         │   │     │
│  │  │              │  │ - Extract Rx Data        │   │     │
│  │  │              │  │ - Confidence Scoring     │   │     │
│  │  │              │  │ - Validation             │   │     │
│  │  └──────────────┘  └──────────────────────────┘   │     │
│  │                                                     │     │
│  │  ┌──────────────┐  ┌──────────────────────────┐   │     │
│  │  │ Shopify      │  │ Product Sync             │   │     │
│  │  │ Service      ├─►│ Inventory Management     │   │     │
│  │  │              │  │ Order Fulfillment        │   │     │
│  │  └──────────────┘  └──────────────────────────┘   │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Database (PostgreSQL)                  │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │     │
│  │  │ shopify_     │  │ shopify_     │  │ shopify_│  │     │
│  │  │ stores       │  │ orders       │  │ webhooks│  │     │
│  │  └──────────────┘  └──────────────┘  └─────────┘  │     │
│  │  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │ shopify_     │  │ prescription_│               │     │
│  │  │ products     │  │ uploads      │               │     │
│  │  └──────────────┘  └──────────────┘               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ REST API
                           │
┌─────────────────────────────────────────────────────────────┐
│                  Shopify Storefront                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │          Embedded Widgets (JavaScript)              │     │
│  │  ┌──────────────────┐  ┌──────────────────────┐   │     │
│  │  │ Prescription     │  │ AI Lens              │   │     │
│  │  │ Upload Widget    │  │ Recommendation       │   │     │
│  │  │                  │  │ Widget               │   │     │
│  │  └──────────────────┘  └──────────────────────┘   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Customer places order on Shopify** → Webhook sent to ILS
2. **ILS receives webhook** → Verifies signature → Processes order
3. **Order contains lens products** → Requires prescription upload
4. **Customer uploads prescription** → GPT-4 Vision extracts data
5. **Prescription verified** → ILS order created → Shopify order fulfilled

---

## Setup & Installation

### Step 1: Create Shopify App

1. **Go to Shopify Partners Dashboard**
   - https://partners.shopify.com/
   - Create a new app

2. **Configure App Settings**
   - App URL: `https://your-ils-domain.com/shopify/install`
   - Allowed redirection URL(s): `https://your-ils-domain.com/shopify/callback`
   - Request scopes: `read_products,write_products,read_orders,write_orders,read_customers`

3. **Note API Credentials**
   - API Key
   - API Secret Key
   - Keep these secure!

### Step 2: Connect Store via ILS Admin

**Using ILS Admin Dashboard:**

1. Navigate to **Settings > Integrations > Shopify**
2. Click **"Connect Shopify Store"**
3. Fill in connection details:
   ```
   Shopify Domain: your-store.myshopify.com
   Store Name: Your Store Name
   API Key: [from Step 1]
   API Secret: [from Step 1]
   ```
4. Click **"Authorize"**
5. Complete OAuth flow
6. Store is now connected!

**Using API:**

```bash
curl -X POST https://your-ils-domain.com/api/shopify/stores/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ILS_TOKEN" \
  -d '{
    "shopifyDomain": "your-store.myshopify.com",
    "shopifyStoreId": "12345678",
    "storeName": "Your Optical Store",
    "storeEmail": "contact@yourstore.com",
    "storeUrl": "https://your-store.myshopify.com",
    "accessToken": "shpat_xxxxx",
    "apiKey": "xxxxx",
    "apiSecretKey": "xxxxx",
    "companyId": "your-company-id"
  }'
```

### Step 3: Configure Store Settings

```bash
curl -X PUT https://your-ils-domain.com/api/shopify/stores/{storeId}/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ILS_TOKEN" \
  -d '{
    "enablePrescriptionVerification": true,
    "enableAIRecommendations": true,
    "enableAutoOrderSync": true,
    "requirePrescriptionUpload": true
  }'
```

### Step 4: Sync Products

Sync your Shopify product catalog to ILS:

```bash
curl -X POST https://your-ils-domain.com/api/shopify/stores/{storeId}/sync-products \
  -H "Authorization: Bearer YOUR_ILS_TOKEN"
```

This will:
- Fetch all products from Shopify
- Create records in ILS database
- Track inventory quantities
- Enable automatic inventory sync

### Step 5: Install Widgets on Shopify

See [Widget Integration](#widget-integration) section below.

---

## API Reference

### Base URL

```
https://your-ils-domain.com/api/shopify
```

### Authentication

All API endpoints (except webhooks) require Bearer token authentication:

```
Authorization: Bearer YOUR_ILS_TOKEN
```

### Endpoints

#### Store Management

##### List All Stores

```http
GET /stores
```

**Response:**
```json
[
  {
    "id": "store_123",
    "companyId": "company_456",
    "shopifyDomain": "yourstore.myshopify.com",
    "storeName": "Your Optical Store",
    "status": "active",
    "enablePrescriptionVerification": true,
    "enableAIRecommendations": true,
    "lastSyncAt": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

##### Get Store Details

```http
GET /stores/:storeId
```

##### Connect Store

```http
POST /stores/connect
```

**Request Body:**
```json
{
  "shopifyDomain": "yourstore.myshopify.com",
  "shopifyStoreId": "12345678",
  "storeName": "Your Optical Store",
  "storeEmail": "contact@yourstore.com",
  "storeUrl": "https://yourstore.myshopify.com",
  "accessToken": "shpat_xxxxx",
  "apiKey": "xxxxx",
  "apiSecretKey": "xxxxx",
  "companyId": "company_456"
}
```

##### Update Store Settings

```http
PUT /stores/:storeId/settings
```

**Request Body:**
```json
{
  "enablePrescriptionVerification": true,
  "enableAIRecommendations": true,
  "enableAutoOrderSync": true,
  "requirePrescriptionUpload": true
}
```

##### Disconnect Store

```http
POST /stores/:storeId/disconnect
```

##### Sync Products

```http
POST /stores/:storeId/sync-products
```

**Response:**
```json
{
  "syncedCount": 45,
  "products": [...]
}
```

##### Get Products

```http
GET /stores/:storeId/products
```

#### Prescription Management

##### Upload Prescription

```http
POST /prescriptions/upload
```

**Request Body:**
```json
{
  "shopifyOrderId": "order_123",
  "patientId": "patient_456",
  "fileUrl": "https://storage.com/prescriptions/rx_123.jpg",
  "fileName": "prescription.jpg",
  "fileType": "image/jpeg",
  "fileSize": 2048000
}
```

**Response:**
```json
{
  "id": "upload_123",
  "companyId": "company_456",
  "shopifyOrderId": "order_123",
  "fileUrl": "https://storage.com/prescriptions/rx_123.jpg",
  "verificationStatus": "pending",
  "aiExtractedData": {
    "sphereOD": -2.50,
    "cylinderOD": -0.75,
    "axisOD": 180,
    "sphereOS": -2.25,
    "cylinderOS": -0.50,
    "axisOS": 175,
    "pd": 63,
    "prescriptionDate": "2024-06-15",
    "practitionerName": "Dr. Smith"
  },
  "aiExtractionConfidence": "0.92",
  "requiresReview": false,
  "uploadedAt": "2025-01-15T10:30:00Z"
}
```

##### Get Prescription Upload

```http
GET /prescriptions/:uploadId
```

##### Get Prescriptions Requiring Review

```http
GET /prescriptions/review/pending
```

##### Verify Prescription

```http
POST /prescriptions/:uploadId/verify
```

**Request Body:**
```json
{
  "verifiedBy": "user_789",
  "prescriptionData": {
    "sphereOD": -2.50,
    "cylinderOD": -0.75,
    "axisOD": 180,
    "sphereOS": -2.25,
    "cylinderOS": -0.50,
    "axisOS": 175,
    "pd": 63,
    "prescriptionDate": "2024-06-15",
    "expiryDate": "2026-06-15",
    "practitionerName": "Dr. Smith",
    "practitionerGocNumber": "123456"
  }
}
```

##### Reject Prescription

```http
POST /prescriptions/:uploadId/reject
```

**Request Body:**
```json
{
  "verifiedBy": "user_789",
  "rejectionReason": "Image quality too low, unable to read values"
}
```

#### Order Management

##### Get All Orders

```http
GET /orders?status=synced&storeId=store_123
```

**Query Parameters:**
- `status` - Filter by sync status: `pending`, `synced`, `processing`, `completed`, `failed`
- `storeId` - Filter by store

##### Get Orders Requiring Prescription

```http
GET /orders/requiring-prescription
```

##### Create ILS Order from Shopify Order

```http
POST /orders/:orderId/create-ils-order
```

Creates an ILS order from a synced Shopify order (after prescription verification).

##### Fulfill Order

```http
POST /orders/:orderId/fulfill
```

**Request Body:**
```json
{
  "trackingNumber": "1Z999AA10123456784",
  "trackingUrl": "https://tracking.com/track/1Z999AA10123456784"
}
```

Updates fulfillment in both ILS and Shopify.

##### Retry Failed Order Sync

```http
POST /orders/:orderId/retry-sync
```

##### Get Order Statistics

```http
GET /orders/statistics?storeId=store_123
```

**Response:**
```json
{
  "total": 150,
  "pending": 5,
  "synced": 120,
  "processing": 15,
  "completed": 8,
  "failed": 2,
  "requiresPrescription": 12,
  "totalRevenue": "15420.50"
}
```

#### Webhooks

##### Receive Webhook (Public Endpoint)

```http
POST /webhooks
```

**Headers:**
- `X-Shopify-Topic`: `orders/create` | `orders/updated` | `products/create` | etc.
- `X-Shopify-Hmac-Sha256`: Signature for verification
- `X-Shopify-Shop-Domain`: `yourstore.myshopify.com`

**Body:** Shopify webhook payload (varies by topic)

##### Process Unprocessed Webhooks (Background Job)

```http
POST /webhooks/process-unprocessed
```

#### Analytics

##### Get Dashboard Statistics

```http
GET /analytics/dashboard?storeId=store_123
```

**Response:**
```json
{
  "storeStats": {...},
  "orderStats": {...},
  "prescriptionStats": {
    "totalUploads": 45,
    "pending": 8,
    "verified": 35,
    "rejected": 2,
    "averageConfidence": 0.88,
    "requiresReview": 10
  },
  "recentOrders": [...],
  "recentPrescriptions": [...]
}
```

---

## Webhook Events

### Registered Webhooks

When you connect a store, ILS automatically registers these webhooks with Shopify:

| Topic | Description |
|-------|-------------|
| `orders/create` | New order created |
| `orders/updated` | Order updated |
| `orders/fulfilled` | Order fulfilled |
| `orders/cancelled` | Order cancelled |
| `products/create` | New product created |
| `products/update` | Product updated |
| `products/delete` | Product deleted |

### Webhook Processing

1. **Receive webhook** at `/api/shopify/webhooks`
2. **Verify HMAC signature** using webhook secret
3. **Log webhook** to database
4. **Queue for processing** (async)
5. **Process webhook** based on topic
6. **Update local records** in ILS
7. **Mark as processed** or retry on failure

### Webhook Retry Logic

- Failed webhooks are automatically retried
- Retry count increments after each failure
- After 3 failed attempts, webhook is marked as failed
- Manual retry available via API

---

## Widget Integration

See [client/shopify-widgets/README.md](../client/shopify-widgets/README.md) for detailed widget installation and usage.

### Quick Start

**Prescription Upload Widget:**

```html
<link rel="stylesheet" href="{{ 'shopify-widget-styles.css' | asset_url }}">
<div id="ils-prescription-upload" data-store-id="YOUR_STORE_ID"></div>
<script src="{{ 'prescription-upload-widget.js' | asset_url }}"></script>
```

**AI Lens Recommendation Widget:**

```html
<div id="ils-lens-recommendations" data-store-id="YOUR_STORE_ID" data-product-id="{{ product.id }}"></div>
<script src="{{ 'lens-recommendation-widget.js' | asset_url }}"></script>
```

---

## Workflow Examples

### Example 1: Customer Orders Prescription Glasses

1. **Customer browses products** on Shopify store
2. **Selects prescription glasses** and adds to cart
3. **Proceeds to checkout** and completes payment
4. **Shopify creates order** → Webhook sent to ILS
5. **ILS receives webhook:**
   - Creates patient record (if new customer)
   - Creates Shopify order record
   - Detects lens products
   - Marks as requiring prescription
6. **Customer receives email** to upload prescription
7. **Customer uploads prescription** via widget
8. **GPT-4 Vision extracts data** automatically
9. **If confidence > 85%:** Auto-approved
10. **If confidence < 85%:** Queued for manual review
11. **Optician reviews** and verifies prescription
12. **ILS creates internal order** for production
13. **Order produced** and ready to ship
14. **Staff marks as fulfilled** with tracking number
15. **ILS updates Shopify** order status
16. **Customer receives** shipping notification

### Example 2: Manual Prescription Entry

1. **Optician receives phone order** with known prescription
2. **Creates order in ILS** manually
3. **Optician pushes order to Shopify** (optional)
4. **Order syncs to Shopify** storefront
5. **Customer sees order** in their account

### Example 3: Product Inventory Sync

1. **Store receives new stock** of frames
2. **Updates inventory in Shopify**
3. **Shopify sends webhook** to ILS
4. **ILS updates local inventory** count
5. **ILS can also push updates** back to Shopify

---

## Testing

### Test Prescription Upload

Use these test prescription images:

```bash
curl -X POST https://your-ils-domain.com/api/shopify/prescriptions/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fileUrl": "https://example.com/test-prescription.jpg",
    "fileName": "test.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000
  }'
```

Expected response:
- AI confidence score
- Extracted prescription values
- Requires review flag

### Test Order Sync

Trigger test webhook:

```bash
curl -X POST https://your-ils-domain.com/api/shopify/webhooks \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/create" \
  -H "X-Shopify-Shop-Domain: yourstore.myshopify.com" \
  -H "X-Shopify-Hmac-Sha256: HMAC_SIGNATURE" \
  -d @test-order-payload.json
```

### Test Widget Integration

1. Create test Shopify development store
2. Install widgets in theme
3. Upload test prescription
4. Verify data extraction
5. Test recommendation flow

---

## Troubleshooting

### Common Issues

#### Webhooks Not Received

**Symptoms:**
- Orders not syncing to ILS
- No webhook logs in database

**Solutions:**
1. Check webhook URL is publicly accessible
2. Verify SSL certificate is valid
3. Check firewall rules
4. Test webhook endpoint:
   ```bash
   curl https://your-ils-domain.com/api/shopify/webhooks
   ```
5. Check Shopify webhook delivery history in Shopify Admin

#### Prescription Upload Failing

**Symptoms:**
- Upload returns error
- AI extraction fails

**Solutions:**
1. Check OpenAI API key is valid
2. Verify file size < 10MB
3. Check file format (JPG, PNG, WebP, PDF only)
4. Test OpenAI API:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

#### Orders Stuck in "Pending"

**Symptoms:**
- Orders show syncStatus: "pending"
- Not creating ILS orders

**Solutions:**
1. Check if prescription is required but not uploaded
2. Verify patient record was created
3. Check sync error message in database
4. Retry sync manually:
   ```bash
   POST /api/shopify/orders/:orderId/retry-sync
   ```

#### Widget Not Displaying

**Symptoms:**
- Widget container is empty
- JavaScript errors in console

**Solutions:**
1. Verify widget files are uploaded to Shopify theme
2. Check `data-store-id` attribute is correct
3. Verify `window.ILS_API_URL` is set
4. Check browser console for errors
5. Test API connectivity from browser:
   ```javascript
   fetch(window.ILS_API_URL + '/health')
   ```

---

## Security & Compliance

### Data Encryption

- **Credentials:** All Shopify API credentials encrypted with AES-256-CBC
- **Prescriptions:** Patient data encrypted at rest
- **Communication:** All API communication over HTTPS/TLS 1.3

### Webhook Security

- **HMAC Verification:** All webhooks verified using HMAC-SHA256
- **Signature Validation:** Invalid signatures rejected with 401
- **Replay Protection:** Webhook IDs tracked to prevent replays

### HIPAA Compliance

- Patient prescriptions are PHI (Protected Health Information)
- Access controls enforced via role-based permissions
- Audit logs for all prescription access
- Data retention policies configurable
- BAA (Business Associate Agreement) available on request

### GDPR Compliance

- Customer data processed with consent
- Right to access: Customers can request their data
- Right to erasure: Customers can request deletion
- Data portability: Export functionality available

### PCI Compliance

- No credit card data stored in ILS
- All payment processing handled by Shopify
- ILS only receives order totals (no card details)

---

## Support

### Documentation

- API Reference: https://docs.ils2.com/api
- Widget Guide: [client/shopify-widgets/README.md](../client/shopify-widgets/README.md)
- Knowledge Base: https://help.ils2.com

### Contact

- **Technical Support:** support@ils2.com
- **Sales:** sales@ils2.com
- **Emergency:** +44 (0) 20 XXXX XXXX

---

## Changelog

### Version 2.0.0 (2025-01-15)

**Phase 1: Schema & Core Service**
- ✅ Database schema with 5 new tables
- ✅ Encrypted credential storage
- ✅ Shopify API integration
- ✅ Webhook registration

**Phase 2A: Services**
- ✅ Prescription verification service
- ✅ GPT-4 Vision OCR integration
- ✅ Order synchronization service
- ✅ Webhook handler

**Phase 2B: API Routes**
- ✅ 25+ RESTful API endpoints
- ✅ Zod validation schemas
- ✅ Comprehensive error handling

**Phase 2C: Widgets**
- ✅ Prescription upload widget
- ✅ AI lens recommendation widget
- ✅ Responsive styles
- ✅ Custom events

---

## License

Copyright © 2025 ILS 2.0. All rights reserved.

This integration is licensed under the ILS 2.0 Commercial License.
For licensing inquiries, contact: legal@ils2.com
