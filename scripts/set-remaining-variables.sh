#!/bin/bash
#
# Set Remaining Railway Variables
# Quick script to set any missing environment variables
#

set -e

echo "🔧 Setting remaining Railway environment variables..."
echo ""

# Database encryption (from P0 fixes)
echo "Setting database encryption key..."
railway variables --set "DB_ENCRYPTION_KEY=B+ymN2yUDNgSV9th3MXnLlaB/cWt1iXpJ27uswNJxW8="
railway variables --set "DB_ENCRYPTION_KEY_VERSION=v1"

# NHS API (optional - sandbox mode for testing)
echo "Setting NHS API configuration (sandbox mode)..."
railway variables --set "NHS_API_ENVIRONMENT=sandbox"
railway variables --set "NHS_KEY_ID=ils-key-1"

echo ""
echo "✅ Environment variables set!"
echo ""
echo "⚠️  Note: NHS_PRIVATE_KEY and NHS_API_KEY must be set in Railway dashboard"
echo "   (multi-line values can't be set via CLI)"
echo ""
echo "Optional variables to set manually:"
echo "  - ODS_CODE (your NHS organisation code)"
echo "  - ANTHROPIC_API_KEY (for Claude AI)"
echo "  - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (for Secrets Manager)"
echo ""
