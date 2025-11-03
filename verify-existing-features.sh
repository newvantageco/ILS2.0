#!/bin/bash

echo "=== Verifying Which Features Already Exist ===" 
echo ""

echo "1. Checking OrderDetailsPage..."
if grep -q "downloadLabTicketMutation" client/src/pages/OrderDetailsPage.tsx; then
  echo "✓ Lab Ticket download exists"
else
  echo "✗ Lab Ticket download MISSING"
fi

if grep -q "emailMutation" client/src/pages/OrderDetailsPage.tsx; then
  echo "✓ Email order exists"
else
  echo "✗ Email order MISSING"
fi

if grep -q "OMA" client/src/pages/OrderDetailsPage.tsx; then
  echo "✓ OMA viewer exists"
else
  echo "✗ OMA MISSING"
fi

echo ""
echo "2. Checking PrescriptionsPage..."
if grep -q "emailMutation" client/src/pages/PrescriptionsPage.tsx; then
  echo "✓ Email prescription exists"
else
  echo "✗ Email prescription MISSING"
fi

if grep -q "downloadPdf" client/src/pages/PrescriptionsPage.tsx; then
  echo "✓ PDF download exists"
else
  echo "✗ PDF download MISSING"
fi

echo ""
echo "3. Checking InvoicesPage..."
if grep -q "emailMutation" client/src/pages/InvoicesPage.tsx; then
  echo "✓ Email invoice exists"
else
  echo "✗ Email invoice MISSING"
fi

if grep -q "downloadPdf" client/src/pages/InvoicesPage.tsx; then
  echo "✓ PDF download exists"
else
  echo "✗ PDF download MISSING"
fi

echo ""
echo "4. Checking for Equipment Detail Page..."
if [ -f "client/src/pages/EquipmentDetailPage.tsx" ]; then
  echo "✓ EquipmentDetailPage exists"
else
  echo "✗ EquipmentDetailPage MISSING"
fi

echo ""
echo "5. Checking Production/QC Dashboards..."
if grep -q "velocity\|metrics" client/src/pages/ProductionTrackingPage.tsx 2>/dev/null; then
  echo "✓ Production velocity might exist"
else
  echo "✗ Production velocity MISSING"
fi

if grep -q "defect\|trends" client/src/pages/QualityControlPage.tsx 2>/dev/null; then
  echo "✓ QC defect trends might exist"
else
  echo "✗ QC defect trends MISSING"
fi

echo ""
echo "6. Checking Clinical Protocols..."
if [ -f "client/src/pages/ClinicalProtocolsPage.tsx" ]; then
  echo "✓ ClinicalProtocolsPage exists"
else
  echo "✗ ClinicalProtocolsPage MISSING"
fi

echo ""
echo "7. Checking Analytics Dashboards..."
echo "Looking for analytics pages..."
ls -1 client/src/pages/*Analytics*.tsx 2>/dev/null | head -5
