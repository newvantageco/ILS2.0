# Lab Work Ticket - Quick Reference Guide

## 🚀 Quick Start

### For Lab Technicians

1. **View an Order**: Navigate to any order in the system
2. **Click "Lab Ticket"**: Blue button in the top-right of order details
3. **Print**: PDF downloads automatically - print and attach to job
4. **Track Progress**: Use barcode at each station and check off QC boxes
5. **Sign Off**: Sign signature line when complete

### For Developers

**Generate Lab Ticket PDF**:
```bash
# API Call
GET /api/orders/{orderId}/lab-ticket

# Response
Content-Type: application/pdf
File: lab-ticket-{orderNumber}.pdf
```

**Frontend Usage**:
```tsx
import { FileText } from "lucide-react";

<Button onClick={() => downloadLabTicket(orderId)}>
  <FileText className="h-4 w-4 mr-2" />
  Lab Ticket
</Button>
```

## 📋 Lab Ticket Sections

### 1. Header & Order Info
- **Order Number**: Unique identifier with barcode
- **Customer**: Name, ID, dispenser, phone
- **Dates**: Dispense and collection dates
- **Status**: Current job status

### 2. Frame & Lens Specs
- **Frame**: Description, SKU, pair type
- **Lens**: Material, design type
- **Examples**: 
  - Material: "1.67 High-Index", "Trivex", "Polycarbonate"
  - Design: "Digital Single Vision", "Free-form Progressive"

### 3. Prescription (Rx) Grid - MOST IMPORTANT ⚠️
```
Eye | Sph    | Cyl    | Axis | H.Prism | V.Prism | Add
----|--------|--------|------|---------|---------|-----
R   | +2.00  | -0.75  | 180  | 2Δ In   | 1Δ Up   | +2.50
L   | +2.25  | -0.50  | 175  | —       | —       | +2.50
```

**Key Fields**:
- **Sph** (Sphere): Main lens power (+ for farsighted, - for nearsighted)
- **Cyl** (Cylinder): Astigmatism correction
- **Axis**: Cylinder orientation (0-180°)
- **H.Prism**: Horizontal prism (with In/Out base)
- **V.Prism**: Vertical prism (with Up/Down base)
- **Add**: Addition for progressives/bifocals

### 4. Finishing Parameters
- **PD** (Pupillary Distance): R + L = Total
- **Heights**: Segment/Fit heights
- **OC Heights**: Optical center heights
- **Insets**: Positioning adjustments
- **Bevel Type**: Auto, Step, Groove, Rimless
- **Drill Coords**: For rimless mounts
- **Polish**: Edge or bevel

### 5. Treatments & Coatings
☑ Common treatments:
- AR (Anti-Reflective) - Premium/Standard
- Blue Light Filter
- UV Protection
- Mirror coatings
- Tints (Solid/Gradient)
- Photochromic

### 6. Lab Instructions
**Use for**:
- R&D protocols ("Test new SRT-Plus coating per protocol #22-B")
- Special handling ("Patient has narrow PD - extra care needed")
- Process notes ("First run with new 1.74 material")
- Quality issues ("Re-do - previous had edge defects")

### 7. Quality Control
☑ **Checkpoints**:
1. Surfacing QC
2. Coating QC
3. Finishing QC
4. Final Inspection

**Technician Signature**: ___________________

## 🎯 Use Cases

### Standard Single Vision Lens
```json
{
  "prescription": {
    "right": { "sph": "-2.00", "cyl": null, "axis": null },
    "left": { "sph": "-2.25", "cyl": null, "axis": null }
  },
  "finishing": {
    "totalPD": "62.0",
    "bevelType": "Auto"
  },
  "treatments": ["AR - Premium", "UV Protection"]
}
```

### Progressive Lens with Astigmatism
```json
{
  "prescription": {
    "right": {
      "sph": "+1.50",
      "cyl": "-0.75",
      "axis": "180",
      "add": "+2.50"
    },
    "left": {
      "sph": "+1.75",
      "cyl": "-0.50",
      "axis": "175",
      "add": "+2.50"
    }
  },
  "finishing": {
    "rightPD": "31.0",
    "leftPD": "31.0",
    "rightHeight": "18.0",
    "leftHeight": "18.0"
  },
  "treatments": ["AR - Premium", "Blue Light Filter"]
}
```

### Prism Prescription
```json
{
  "prescription": {
    "right": {
      "sph": "-1.00",
      "hPrism": "2.0",
      "hBase": "In",
      "vPrism": "1.0",
      "vBase": "Up"
    }
  },
  "labInstructions": "Complex prism - verify alignment before edging"
}
```

## 🔧 Troubleshooting

### Lab Ticket Button Not Visible
**Problem**: Can't see "Lab Ticket" button
**Solution**: Only visible to lab personnel. Check user role:
- ✅ lab_tech
- ✅ engineer
- ✅ admin
- ❌ ecp (not authorized)

### PDF Generation Fails
**Problem**: Error downloading PDF
**Solutions**:
1. Check server logs for errors
2. Verify order exists: `GET /api/orders/{id}`
3. Ensure user is authenticated
4. Check role permissions

### Barcode Not Scanning
**Problem**: QR code won't scan
**Solutions**:
1. Ensure printer has sufficient resolution (300 DPI+)
2. Print at 100% scale (no shrinking)
3. Use high-quality paper
4. Test with multiple scanner apps

### Missing Data on Ticket
**Problem**: Some fields show "—" or are empty
**Explanation**: This is normal - not all orders have complete data
**To Fix**: Update order with missing information before generating ticket

## 📊 Workflow Integration

### Production Flow
```
1. Order Received
   ↓
2. Generate Lab Ticket ← Click "Lab Ticket" button
   ↓
3. Print & Attach to Job
   ↓
4. Surfacing Station → Scan barcode → Check ☑ Surfacing QC
   ↓
5. Coating Station → Scan barcode → Check ☑ Coating QC
   ↓
6. Finishing Station → Scan barcode → Check ☑ Finishing QC
   ↓
7. Final Inspection → Scan barcode → Check ☑ Final Inspection
   ↓
8. Sign & Complete
   ↓
9. Ship to Customer
```

## 💡 Pro Tips

### For Maximum Efficiency
1. **Print in batches**: Generate tickets for all morning orders at once
2. **Color code**: Use colored paper for rush orders
3. **Laminate**: Protect tickets in harsh environments (coating area)
4. **Double-check Rx**: Always verify prescription before starting work

### For Quality Control
1. **Use checkboxes**: Don't skip QC steps - check each one
2. **Sign your work**: Accountability improves quality
3. **Document issues**: Write detailed lab instructions for problems
4. **Keep copies**: Archive completed tickets for traceability

### For Process Innovation
1. **Track experiments**: Use lab instructions to document R&D
2. **Note outcomes**: Record success/failure of new processes
3. **Share knowledge**: Team reviews of lab instruction notes
4. **Build standards**: Successful experiments become standard procedures

## 🔗 Related Documentation

- **Full Implementation Guide**: `LAB_WORK_TICKET_IMPLEMENTATION.md`
- **API Documentation**: `API_QUICK_REFERENCE.md`
- **Order Management**: `DEVELOPER_QUICK_START.md`

## 📞 Quick Support

**Technical Issues**:
```typescript
// Service file
/server/services/LabWorkTicketService.ts

// API endpoint
/server/routes.ts (search: '/lab-ticket')

// Frontend component
/client/src/pages/OrderDetailsPage.tsx
```

**Common Questions**:

**Q: Can I customize the PDF layout?**
A: Yes, edit `LabWorkTicketService.ts` - each section has its own method

**Q: Can I add more fields?**
A: Yes, update `LabWorkTicketData` interface and corresponding PDF sections

**Q: How do I integrate barcode scanning?**
A: Use the QR code data (order number) with any standard barcode scanner

**Q: Can I email lab tickets?**
A: Not yet - add similar endpoint to `/api/orders/:id/email` for this feature

---

**Version**: 1.0  
**Last Updated**: 2025-11-02  
**System**: Integrated Lens System (ILS 2.0)
