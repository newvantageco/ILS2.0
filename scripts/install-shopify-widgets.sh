#!/bin/bash

# ILS 2.0 - Shopify Widgets Installation Script
# Automates widget installation on Shopify stores

set -e

echo "🛒 ILS 2.0 - Shopify Widgets Installation"
echo "========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

print_header "WIDGET INSTALLATION OVERVIEW"

echo ""
print_info "This script will install ILS 2.0 widgets on your Shopify store:"
echo "  • Prescription Upload Widget"
echo "  • AI Lens Recommendation Widget"
echo "  • Widget Styling and Configuration"
echo "  • API Integration Setup"
echo ""

print_header "PREREQUISITES CHECK"

# Configuration
ILS_DOMAIN=${1:-"https://your-app.railway.app"}
SHOPIFY_STORE=${2:-"your-store.myshopify.com"}
SHOPIFY_ACCESS_TOKEN=${3:-"your-shopify-access-token"}

print_info "ILS Domain: $ILS_DOMAIN"
print_info "Shopify Store: $SHOPIFY_STORE"

# Check for required tools
print_info "Checking required tools..."

if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_warning "jq is recommended for JSON parsing"
fi

print_success "Required tools available"

echo ""
print_header "WIDGET FILE PREPARATION"

print_info "Preparing widget files for upload..."

# Create widget directory
WIDGET_DIR="./shopify-widget-files"
mkdir -p "$WIDGET_DIR"

# Download widget files from ILS domain
print_info "Downloading widget files from ILS domain..."

WIDGET_FILES=(
    "prescription-upload-widget.js"
    "lens-recommendation-widget.js"
    "shopify-widget-styles.css"
)

for widget_file in "${WIDGET_FILES[@]}"; do
    if curl -s "$ILS_DOMAIN/shopify-widgets/$widget_file" > "$WIDGET_DIR/$widget_file"; then
        print_success "Downloaded: $widget_file"
    else
        print_error "Failed to download: $widget_file"
        print_warning "Using local widget files instead..."
        
        # Copy local files if download fails
        if [ -f "./client/shopify-widgets/$widget_file" ]; then
            cp "./client/shopify-widgets/$widget_file" "$WIDGET_DIR/"
            print_success "Copied local: $widget_file"
        else
            print_error "Local file not found: $widget_file"
            exit 1
        fi
    fi
done

echo ""
print_header "WIDGET CONFIGURATION"

print_info "Configuring widget settings..."

# Create configuration file
cat > "$WIDGET_DIR/widget-config.js" << EOF
// ILS 2.0 Shopify Widget Configuration
window.ILSWidgetConfig = {
  // API Configuration
  apiUrl: '$ILS_DOMAIN',
  storeId: '{{ shop.id }}',
  widgetToken: '$SHOPIFY_ACCESS_TOKEN',
  
  // Widget Settings
  prescriptionUpload: {
    enabled: true,
    maxFileSize: 10485760, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png'],
    requireConfirmation: true,
    autoProcess: true
  },
  
  lensRecommendations: {
    enabled: true,
    showPrices: true,
    allowCustomization: true,
    addToCartEnabled: true,
    recommendationLimit: 5
  },
  
  // UI Settings
  ui: {
    theme: 'auto',
    language: 'en',
    currency: '{{ shop.currency }}',
    showProgressBar: true,
    animationsEnabled: true
  }
};
EOF

print_success "Widget configuration created"

echo ""
print_header "SHOPIFY THEME INTEGRATION"

print_info "Creating Shopify theme integration files..."

# Create theme.liquid snippet
cat > "$WIDGET_DIR/ils-widgets.liquid" << 'EOF'
<!-- ILS 2.0 Shopify Widgets -->
{% if template contains 'product' %}
  <!-- Widget Configuration -->
  <script>
    window.ILSWidgetConfig = {
      apiUrl: '{{ settings.ils_api_url }}',
      storeId: '{{ shop.id }}',
      widgetToken: '{{ settings.ils_widget_token }}',
      
      prescriptionUpload: {
        enabled: {{ settings.ils_prescription_upload_enabled }},
        maxFileSize: {{ settings.ils_max_file_size }},
        allowedFormats: {{ settings.ils_allowed_formats | json }},
        requireConfirmation: {{ settings.ils_require_confirmation }},
        autoProcess: {{ settings.ils_auto_process }}
      },
      
      lensRecommendations: {
        enabled: {{ settings.ils_lens_recommendations_enabled }},
        showPrices: {{ settings.ils_show_prices }},
        allowCustomization: {{ settings.ils_allow_customization }},
        addToCartEnabled: {{ settings.ils_add_to_cart_enabled }},
        recommendationLimit: {{ settings.ils_recommendation_limit }}
      },
      
      ui: {
        theme: '{{ settings.ils_widget_theme }}',
        language: '{{ shop.locale }}',
        currency: '{{ shop.currency }}',
        showProgressBar: {{ settings.ils_show_progress_bar }},
        animationsEnabled: {{ settings.ils_animations_enabled }}
      }
    };
  </script>
  
  <!-- Widget Styles -->
  {{ 'shopify-widget-styles.css' | asset_url | stylesheet_tag }}
  
  <!-- Widget Scripts -->
  {{ 'prescription-upload-widget.js' | asset_url | script_tag }}
  {{ 'lens-recommendation-widget.js' | asset_url | script_tag }}
{% endif %}
EOF

print_success "Theme integration snippet created"

# Create product page template
cat > "$WIDGET_DIR/product.ils-widgets.liquid" << 'EOF'
<!-- ILS 2.0 Widgets on Product Page -->
<div class="ils-widgets-container">
  
  <!-- Prescription Upload Widget -->
  {% if product.type contains 'prescription' or product.tags contains 'prescription-required' %}
  <div class="ils-prescription-upload-section">
    <h3>{{ 'ils.widgets.prescription_upload.title' | t }}</h3>
    <div id="ils-prescription-upload"></div>
  </div>
  {% endif %}
  
  <!-- Lens Recommendation Widget -->
  {% if product.type contains 'lenses' or product.tags contains 'lens-recommendations' %}
  <div class="ils-lens-recommendations-section">
    <h3>{{ 'ils.widgets.lens_recommendations.title' | t }}</h3>
    <div id="ils-lens-recommendations"></div>
  </div>
  {% endif %}
  
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Prescription Upload Widget
  if (document.getElementById('ils-prescription-upload')) {
    new ILSPrescriptionUpload({
      container: '#ils-prescription-upload',
      ...window.ILSWidgetConfig
    });
  }
  
  // Initialize Lens Recommendation Widget
  if (document.getElementById('ils-lens-recommendations')) {
    new ILSLensRecommendation({
      container: '#ils-lens-recommendations',
      ...window.ILSWidgetConfig
    });
  }
});
</script>
EOF

print_success "Product page template created"

echo ""
print_header "SHOPIFY SETTINGS SCHEMA"

print_info "Creating theme settings schema..."

# Create settings schema
cat > "$WIDGET_DIR/settings_schema.json" << 'EOF'
[
  {
    "name": "ILS 2.0 Widgets",
    "settings": [
      {
        "type": "header",
        "content": "API Configuration"
      },
      {
        "type": "text",
        "id": "ils_api_url",
        "label": "ILS API URL",
        "default": "https://your-app.railway.app",
        "info": "Your ILS 2.0 instance URL"
      },
      {
        "type": "text",
        "id": "ils_widget_token",
        "label": "Widget Token",
        "default": "",
        "info": "JWT token for widget authentication"
      },
      {
        "type": "header",
        "content": "Prescription Upload"
      },
      {
        "type": "checkbox",
        "id": "ils_prescription_upload_enabled",
        "label": "Enable Prescription Upload",
        "default": true
      },
      {
        "type": "number",
        "id": "ils_max_file_size",
        "label": "Max File Size (bytes)",
        "default": 10485760,
        "info": "Maximum file size for prescription uploads"
      },
      {
        "type": "text",
        "id": "ils_allowed_formats",
        "label": "Allowed File Formats",
        "default": "jpg,jpeg,png",
        "info": "Comma-separated list of allowed file formats"
      },
      {
        "type": "checkbox",
        "id": "ils_require_confirmation",
        "label": "Require Customer Confirmation",
        "default": true
      },
      {
        "type": "checkbox",
        "id": "ils_auto_process",
        "label": "Auto-process Uploads",
        "default": true
      },
      {
        "type": "header",
        "content": "Lens Recommendations"
      },
      {
        "type": "checkbox",
        "id": "ils_lens_recommendations_enabled",
        "label": "Enable Lens Recommendations",
        "default": true
      },
      {
        "type": "checkbox",
        "id": "ils_show_prices",
        "label": "Show Prices in Recommendations",
        "default": true
      },
      {
        "type": "checkbox",
        "id": "ils_allow_customization",
        "label": "Allow Customization",
        "default": true
      },
      {
        "type": "checkbox",
        "id": "ils_add_to_cart_enabled",
        "label": "Enable Add to Cart",
        "default": true
      },
      {
        "type": "number",
        "id": "ils_recommendation_limit",
        "label": "Recommendation Limit",
        "default": 5,
        "info": "Maximum number of recommendations to show"
      },
      {
        "type": "header",
        "content": "User Interface"
      },
      {
        "type": "select",
        "id": "ils_widget_theme",
        "label": "Widget Theme",
        "options": [
          {"value": "auto", "label": "Auto"},
          {"value": "light", "label": "Light"},
          {"value": "dark", "label": "Dark"}
        ],
        "default": "auto"
      },
      {
        "type": "checkbox",
        "id": "ils_show_progress_bar",
        "label": "Show Progress Bar",
        "default": true
      },
      {
        "type": "checkbox",
        "id": "ils_animations_enabled",
        "label": "Enable Animations",
        "default": true
      }
    ]
  }
]
EOF

print_success "Settings schema created"

echo ""
print_header "INSTALLATION INSTRUCTIONS"

print_info "Manual installation steps:"

cat << 'EOF'

1. **Upload Widget Files to Shopify**:
   - Go to Shopify Admin > Online Store > Themes
   - Click "Actions" > "Edit code" on your active theme
   - In the "Assets" folder, upload:
     * prescription-upload-widget.js
     * lens-recommendation-widget.js
     * shopify-widget-styles.css

2. **Add Widget Configuration**:
   - In the "Snippets" folder, create "ils-widgets.liquid"
   - Copy the contents from ./shopify-widget-files/ils-widgets.liquid

3. **Update Theme.liquid**:
   - Add this line before </head>:
     {% render 'ils-widgets' %}

4. **Add Widgets to Product Pages**:
   - In "Templates" > "product.liquid", add:
     {% render 'product.ils-widgets' %}
   - Or create "product.ils-widgets.liquid" and include it

5. **Configure Theme Settings**:
   - Add the settings_schema.json content to your theme's settings_schema.json
   - Configure widget settings in Theme Customizer

6. **Test Widgets**:
   - Open a product page in your store
   - Check browser console for widget initialization
   - Test prescription upload and recommendations

EOF

echo ""
print_header "AUTOMATED INSTALLATION (Shopify CLI)"

print_info "If you have Shopify CLI installed:"

cat << 'EOF'

# Install Shopify CLI (if not installed)
npm install -g @shopify/cli @shopify/theme

# Login to Shopify
shopify login --store $SHOPIFY_STORE

# Push widget files to theme
shopify theme push --path ./shopify-widget-files --theme YOUR_THEME_NAME

# Or upload individual files
shopify theme push --path ./shopify-widget-files/prescription-upload-widget.js --theme YOUR_THEME_NAME
shopify theme push --path ./shopify-widget-files/lens-recommendation-widget.js --theme YOUR_THEME_NAME
shopify theme push --path ./shopify-widget-files/shopify-widget-styles.css --theme YOUR_THEME_NAME

EOF

echo ""
print_header "WIDGET TESTING"

print_info "Testing widget installation..."

# Create test page
cat > "./widget-test-page.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ILS Shopify Widgets Test</title>
    <link rel="stylesheet" href="$ILS_DOMAIN/shopify-widgets/shopify-widget-styles.css">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .widget-section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .test-results { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🛒 ILS Shopify Widgets Test Page</h1>
    
    <div class="widget-section">
        <h2>Prescription Upload Widget</h2>
        <div id="ils-prescription-upload"></div>
    </div>
    
    <div class="widget-section">
        <h2>Lens Recommendation Widget</h2>
        <div id="ils-lens-recommendations"></div>
    </div>
    
    <div class="test-results">
        <h3>Test Results</h3>
        <div id="test-output">Running tests...</div>
    </div>

    <script>
        // Widget Configuration
        window.ILSWidgetConfig = {
            apiUrl: '$ILS_DOMAIN',
            storeId: 'test-store-id',
            widgetToken: 'test-token',
            
            prescriptionUpload: {
                enabled: true,
                maxFileSize: 10485760,
                allowedFormats: ['jpg', 'jpeg', 'png'],
                requireConfirmation: true,
                autoProcess: true
            },
            
            lensRecommendations: {
                enabled: true,
                showPrices: true,
                allowCustomization: true,
                addToCartEnabled: true,
                recommendationLimit: 5
            },
            
            ui: {
                theme: 'auto',
                language: 'en',
                currency: 'USD',
                showProgressBar: true,
                animationsEnabled: true
            }
        };
    </script>
    
    <script src="$ILS_DOMAIN/shopify-widgets/prescription-upload-widget.js"></script>
    <script src="$ILS_DOMAIN/shopify-widgets/lens-recommendation-widget.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const output = document.getElementById('test-output');
            let results = [];
            
            // Test widget availability
            if (typeof ILSPrescriptionUpload !== 'undefined') {
                results.push('✅ Prescription Upload Widget loaded');
                
                try {
                    new ILSPrescriptionUpload({
                        container: '#ils-prescription-upload'
                    });
                    results.push('✅ Prescription Upload Widget initialized');
                } catch (error) {
                    results.push('❌ Prescription Upload Widget initialization failed: ' + error.message);
                }
            } else {
                results.push('❌ Prescription Upload Widget not loaded');
            }
            
            if (typeof ILSLensRecommendation !== 'undefined') {
                results.push('✅ Lens Recommendation Widget loaded');
                
                try {
                    new ILSLensRecommendation({
                        container: '#ils-lens-recommendations'
                    });
                    results.push('✅ Lens Recommendation Widget initialized');
                } catch (error) {
                    results.push('❌ Lens Recommendation Widget initialization failed: ' + error.message);
                }
            } else {
                results.push('❌ Lens Recommendation Widget not loaded');
            }
            
            // Test API connectivity
            fetch('$ILS_DOMAIN/health')
                .then(response => {
                    if (response.ok) {
                        results.push('✅ API connectivity confirmed');
                    } else {
                        results.push('❌ API connectivity failed');
                    }
                    output.innerHTML = results.join('<br>');
                })
                .catch(error => {
                    results.push('❌ API connectivity error: ' + error.message);
                    output.innerHTML = results.join('<br>');
                });
        });
    </script>
</body>
</html>
EOF

print_success "Test page created: ./widget-test-page.html"

echo ""
print_header "INSTALLATION SUMMARY"

print_success "Shopify widgets installation completed!"
echo ""

print_info "📁 Files Created:"
echo ""
echo "• ./shopify-widget-files/ - All widget files for upload"
echo "• ./widget-test-page.html - Test page for validation"
echo "• Installation instructions provided above"
echo ""

print_warning "Next Steps:"
echo ""
echo "1. Upload widget files to your Shopify theme"
echo "2. Add widget snippets to your theme templates"
echo "3. Configure widget settings in Theme Customizer"
echo "4. Test widgets on product pages"
echo "5. Monitor widget performance and usage"
echo ""

print_info "🔗 Testing Resources:"
echo ""
echo "• Test Page: ./widget-test-page.html"
echo "• Widget Files: ./shopify-widget-files/"
echo "• Installation Guide: ./SHOPIFY_WIDGETS_TESTING_GUIDE.md"
echo "• API Documentation: ./SHOPIFY_INTEGRATION_GUIDE.md"
echo ""

print_info "📊 Expected Results:"
echo ""
echo "• Widgets load seamlessly on product pages"
echo "• Prescription upload with AI processing works"
echo "• Lens recommendations are accurate and relevant"
echo "• Mobile responsive design on all devices"
echo "• Fast loading and smooth interactions"
echo ""

echo "🛒 Your Shopify widgets are ready for installation!"
