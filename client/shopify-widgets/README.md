# ILS 2.0 Shopify Widgets

Embeddable widgets for Shopify storefronts to enable prescription verification and AI-powered lens recommendations.

## Available Widgets

### 1. Prescription Upload Widget
Allows customers to upload prescription images with AI-powered data extraction.

### 2. AI Lens Recommendation Widget
Provides personalized lens and coating recommendations based on customer lifestyle.

## Installation

### Step 1: Connect Your Shopify Store

First, connect your Shopify store to ILS 2.0 through the ILS admin dashboard.

1. Log in to your ILS 2.0 account
2. Navigate to Settings > Integrations > Shopify
3. Click "Connect Shopify Store"
4. Follow the OAuth flow to authorize the connection
5. Note your Store ID (you'll need this for widget installation)

### Step 2: Add Widget Files to Your Shopify Theme

#### Option A: Self-Hosted Widgets (Recommended for Production)

1. Download the widget files:
   - `prescription-upload-widget.js`
   - `lens-recommendation-widget.js`
   - `shopify-widget-styles.css`

2. Upload to your Shopify theme:
   - Go to Shopify Admin > Online Store > Themes
   - Click "Actions" > "Edit code"
   - In the "Assets" folder, upload the widget files
   - The files will be available at: `{{ 'filename.js' | asset_url }}`

#### Option B: CDN-Hosted Widgets (Quick Start)

Use our hosted widget files (replace `YOUR_ILS_DOMAIN` with your ILS instance URL):

```html
<link rel="stylesheet" href="https://YOUR_ILS_DOMAIN/shopify-widgets/shopify-widget-styles.css">
<script src="https://YOUR_ILS_DOMAIN/shopify-widgets/prescription-upload-widget.js"></script>
<script src="https://YOUR_ILS_DOMAIN/shopify-widgets/lens-recommendation-widget.js"></script>
```

### Step 3: Configure API URL

Add this to your theme's `theme.liquid` file before the closing `</head>` tag:

```html
<script>
  window.ILS_API_URL = 'https://YOUR_ILS_DOMAIN';
</script>
```

Replace `YOUR_ILS_DOMAIN` with your ILS 2.0 instance URL.

## Widget Usage

### Prescription Upload Widget

Add this widget to product pages or a dedicated prescription upload page.

#### Basic Implementation

```html
<!-- Add to your product template (e.g., product.liquid) -->
<link rel="stylesheet" href="{{ 'shopify-widget-styles.css' | asset_url }}">
<div id="ils-prescription-upload" data-store-id="YOUR_STORE_ID"></div>
<script src="{{ 'prescription-upload-widget.js' | asset_url }}"></script>
```

#### Advanced Implementation (Link to Order)

```html
<!-- Link prescription to specific order -->
<div
  id="ils-prescription-upload"
  data-store-id="YOUR_STORE_ID"
  data-order-id="{{ order.id }}"
  data-customer-email="{{ customer.email }}">
</div>
<script src="{{ 'prescription-upload-widget.js' | asset_url }}"></script>
```

#### Configuration Options

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-store-id` | Yes | Your ILS Shopify store ID |
| `data-order-id` | No | Link upload to specific order |
| `data-patient-id` | No | Link upload to specific patient |
| `data-customer-email` | No | Pre-fill customer email |

#### Custom Events

Listen for widget events in your theme:

```javascript
// Prescription uploaded successfully
document.addEventListener('ils:prescriptionUploaded', (e) => {
  const upload = e.detail;
  console.log('Prescription uploaded:', upload);

  // Show success message
  // Enable checkout button
  // etc.
});

// Upload failed
document.addEventListener('ils:prescriptionUploadFailed', (e) => {
  console.error('Upload failed:', e.detail.error);
});
```

### AI Lens Recommendation Widget

Add this widget to product pages for glasses/lenses.

#### Basic Implementation

```html
<!-- Add to your product template for glasses/lenses -->
<link rel="stylesheet" href="{{ 'shopify-widget-styles.css' | asset_url }}">
<div
  id="ils-lens-recommendations"
  data-store-id="YOUR_STORE_ID"
  data-product-id="{{ product.id }}">
</div>
<script src="{{ 'lens-recommendation-widget.js' | asset_url }}"></script>
```

#### Configuration Options

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-store-id` | Yes | Your ILS Shopify store ID |
| `data-product-id` | Yes | Shopify product ID |
| `data-customer-email` | No | For personalized recommendations |

#### Custom Events

```javascript
// Recommendations received
document.addEventListener('ils:recommendationsReceived', (e) => {
  const recommendations = e.detail;
  console.log('Recommendations:', recommendations);
});

// Customer wants to add recommendations to cart
document.addEventListener('ils:addRecommendationsToCart', (e) => {
  const recommendations = e.detail;

  // Example: Add lens coating variants to cart
  if (recommendations.coatings) {
    recommendations.coatings.forEach(coating => {
      // Find matching variant in your product
      const variantId = findVariantByName(coating.name);
      if (variantId) {
        addToCart(variantId);
      }
    });
  }
});

// Helper function to add to cart
function addToCart(variantId) {
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: variantId,
      quantity: 1
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Added to cart:', data);
    // Update cart UI
  });
}
```

## Styling Customization

### Using Theme Variables

You can override widget styles by adding CSS variables to your theme:

```css
/* Add to your theme's custom CSS */
:root {
  --ils-primary-color: #3b82f6;
  --ils-border-radius: 8px;
  --ils-font-family: 'Your Theme Font', sans-serif;
}
```

### Custom Styles

Override specific widget styles:

```css
/* Custom styles for prescription widget */
.ils-prescription-widget {
  border: 2px solid var(--ils-primary-color);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.ils-btn-primary {
  background: var(--ils-primary-color);
  text-transform: uppercase;
}

/* Match your theme's button style */
.ils-btn {
  font-family: var(--ils-font-family);
  letter-spacing: 0.05em;
}
```

## Advanced Integration

### Conditional Display Based on Product Type

Only show prescription widget for prescription products:

```liquid
{% if product.type == 'Prescription Glasses' or product.tags contains 'prescription' %}
  <div id="ils-prescription-upload" data-store-id="YOUR_STORE_ID"></div>
  <script src="{{ 'prescription-upload-widget.js' | asset_url }}"></script>
{% endif %}
```

### Require Prescription Before Checkout

Add validation to your cart/checkout:

```javascript
// In your theme's cart.js
document.querySelector('.checkout-button').addEventListener('click', (e) => {
  const hasPrescriptionProduct = checkCartForPrescriptionItems();

  if (hasPrescriptionProduct) {
    const prescriptionUploaded = checkPrescriptionUploaded();

    if (!prescriptionUploaded) {
      e.preventDefault();
      alert('Please upload your prescription before checking out.');
      // Redirect to prescription upload page
      window.location.href = '/pages/upload-prescription';
    }
  }
});

function checkPrescriptionUploaded() {
  // Check if customer has uploaded prescription
  // This info can be stored in localStorage or fetched from API
  return localStorage.getItem('prescriptionUploaded') === 'true';
}
```

### Auto-Populate from Customer Account

If customer has a prescription on file, pre-populate the form:

```javascript
// Fetch customer's latest prescription
fetch(`${window.ILS_API_URL}/api/shopify/prescriptions/customer/${customer.email}`)
  .then(response => response.json())
  .then(prescription => {
    if (prescription) {
      // Display prescription data
      // Offer to use existing prescription
    }
  });
```

## Webhook Configuration

To receive real-time updates when prescriptions are verified or orders are synced, configure webhooks:

1. Go to ILS Admin > Settings > Shopify Integration > Webhooks
2. Enable the following webhooks:
   - `prescription.verified` - Fired when prescription is verified
   - `prescription.rejected` - Fired when prescription is rejected
   - `order.synced` - Fired when order is synced to ILS

3. Set webhook URL to your Shopify webhook handler:
   ```
   https://YOUR_STORE.myshopify.com/apps/ils/webhooks
   ```

## Troubleshooting

### Widget Not Displaying

1. **Check console for errors**
   - Open browser DevTools (F12)
   - Look for JavaScript errors

2. **Verify Store ID**
   - Ensure `data-store-id` matches your ILS Shopify store ID
   - Check ILS Admin > Settings > Shopify to confirm

3. **Check API URL**
   - Verify `window.ILS_API_URL` is set correctly
   - Test API connection: `fetch(window.ILS_API_URL + '/health')`

### Upload Failing

1. **Check file size**
   - Max file size is 10MB
   - Compress images if needed

2. **Verify CORS settings**
   - Ensure your ILS instance allows requests from your Shopify domain
   - Check ILS Admin > Settings > CORS

3. **Check file upload endpoint**
   - Verify `/upload/prescription` endpoint is configured
   - Test with curl or Postman

### Recommendations Not Loading

1. **Enable AI recommendations**
   - Go to ILS Admin > Settings > Shopify > Store Settings
   - Enable "AI Recommendations"

2. **Check product configuration**
   - Ensure `data-product-id` is correct
   - Verify product exists in Shopify

## Support

For technical support:
- Email: support@ils2.com
- Documentation: https://docs.ils2.com/shopify
- GitHub Issues: https://github.com/ils2/shopify-integration

## License

Copyright © 2025 ILS 2.0. All rights reserved.
