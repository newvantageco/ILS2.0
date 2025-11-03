# Professional PDF Templates Documentation

## Overview

The Integrated Lens System now includes **top-notch, professionally designed PDF templates** for optical practices. These templates follow British optical standards, GOC compliance requirements, and industry best practices for document generation.

## 📄 Available PDF Templates

### 1. **Prescription PDF** - GOC Compliant Optical Prescription
A comprehensive, professional prescription document that meets all General Optical Council (GOC) requirements.

**Features:**
- ✅ GOC compliance with all required fields
- ✅ Professional gradient header with company branding
- ✅ Comprehensive prescription table (OD/OS with Sphere, Cylinder, Axis, Add, Prism)
- ✅ British Standards compliance (Monocular PD, Binocular PD, Near PD)
- ✅ Visual acuity records (unaided, aided, pinhole)
- ✅ Clinical recommendations and dispensing notes
- ✅ Prescriber information with GOC number and qualifications
- ✅ Digital signature status verification
- ✅ QR code for instant verification
- ✅ Record retention compliance notices

**API Endpoints:**
```typescript
// Download prescription PDF
POST /api/pdf/prescription/:prescriptionId
// Returns: PDF file download

// Preview prescription PDF in browser
GET /api/pdf/preview/prescription/:prescriptionId
// Returns: PDF inline display
```

**Example Usage:**
```bash
# Download prescription
curl -X POST http://localhost:5000/api/pdf/prescription/abc123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output prescription.pdf

# Preview in browser
# Navigate to: http://localhost:5000/api/pdf/preview/prescription/abc123
```

---

### 2. **Order Slip PDF** - Professional Lab Order Form
A comprehensive laboratory order form designed for seamless communication between practices and labs.

**Features:**
- ✅ Large, scannable order number with status indicator
- ✅ Patient information section with customer references
- ✅ Complete prescription details table
- ✅ Lens specifications (Type, Material, Coating)
- ✅ Frame type and special requirements
- ✅ Highlighted special instructions area
- ✅ Lab processing tracking (Job ID, Status, Tracking Number)
- ✅ Ordering practice and ECP details
- ✅ Large QR code for lab scanning systems
- ✅ Barcode-style order number display

**API Endpoints:**
```typescript
// Download order slip PDF
POST /api/pdf/order-slip/:orderId
// Returns: PDF file download

// Preview order slip PDF in browser
GET /api/pdf/preview/order-slip/:orderId
// Returns: PDF inline display
```

**Example Usage:**
```bash
# Download order slip
curl -X POST http://localhost:5000/api/pdf/order-slip/order123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output order_slip.pdf
```

---

### 3. **Customer Info PDF** - Comprehensive Patient Information Sheet
A detailed patient information document that consolidates all clinical, demographic, and contact information.

**Features:**
- ✅ Complete demographics (Name, DOB, NHS Number, Address)
- ✅ Clinical information (Contact lens wearer, VDU user, Driving requirements)
- ✅ Examination history (Last exam, Next due date)
- ✅ Medical history and current medications
- ✅ Family ocular history
- ✅ Healthcare providers (GP details, Previous optician)
- ✅ Emergency contact information (Highlighted in red)
- ✅ Consent preferences (Marketing, Data sharing)
- ✅ Recent prescription history summary
- ✅ QR code for quick patient lookup
- ✅ GDPR compliance notices

**API Endpoints:**
```typescript
// Download customer info PDF
POST /api/pdf/customer-info/:patientId
// Returns: PDF file download

// Preview customer info PDF in browser
GET /api/pdf/preview/customer-info/:patientId
// Returns: PDF inline display
```

**Example Usage:**
```bash
# Download patient information sheet
curl -X POST http://localhost:5000/api/pdf/customer-info/patient123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output patient_info.pdf
```

---

## 🎨 Design Features

### Professional Color Scheme
- **Primary Blue:** `#1e40af` - Headers and section titles
- **Light Blue:** `#3b82f6` - Gradient headers
- **Success Green:** `#16a34a` - Positive indicators (signed, active)
- **Warning Amber:** `#f59e0b` - Order status and alerts
- **Error Red:** `#dc2626` - Critical information (emergency contacts, not signed)
- **Neutral Gray:** `#6b7280` - Secondary text and metadata

### Layout Components

#### 1. **Gradient Headers**
All PDFs feature professional gradient headers with:
- Large, bold document titles
- Subtitle for context
- Company name and contact information
- Logo placeholder (80x80px)

#### 2. **Info Boxes**
Styled information containers with:
- Light gray backgrounds
- Border styling
- Label (small, gray text)
- Value (larger, bold text)
- Color-coded for different information types

#### 3. **Data Tables**
Professional tables with:
- Colored headers
- Alternating row colors
- Center-aligned numerical data
- Left-aligned text data
- Clear borders and spacing

#### 4. **QR Codes**
High-quality QR codes with:
- Error correction level H (High)
- 150x150px standard size
- JSON-encoded data for verification
- Positioned in corners or near relevant sections

### Typography
- **Headings:** Helvetica-Bold (14-32pt)
- **Body Text:** Helvetica (9-11pt)
- **Labels:** Helvetica (8pt, gray)
- **Barcodes:** Courier (monospaced)

---

## 🔧 Technical Implementation

### ProfessionalPDFService Class

Located at: `/server/services/ProfessionalPDFService.ts`

**Key Methods:**

```typescript
class ProfessionalPDFService {
  // Generate GOC-compliant prescription PDF
  async generatePrescriptionPDF(prescriptionId: string): Promise<Buffer>

  // Generate lab order slip PDF
  async generateOrderSlipPDF(orderId: string): Promise<Buffer>

  // Generate patient information sheet PDF
  async generateCustomerInfoPDF(patientId: string): Promise<Buffer>

  // Private helper methods
  private async generateQRCode(data: string): Promise<string>
  private drawProfessionalHeader(doc, company, title, subtitle?)
  private drawInfoBox(doc, x, y, width, label, value, options?)
  private drawPrescriptionTable(doc, startY, prescriptionData)
}
```

### Dependencies
- **pdfkit** - PDF generation engine
- **qrcode** - QR code generation
- **drizzle-orm** - Database queries

### Database Queries
All PDFs use efficient database queries with proper joins:
```typescript
// Example: Prescription query
const [prescription] = await db
  .select({
    prescription: prescriptions,
    patient: patients,
    prescriber: users,
    company: companies,
  })
  .from(prescriptions)
  .innerJoin(patients, eq(prescriptions.patientId, patients.id))
  .innerJoin(users, eq(prescriptions.ecpId, users.id))
  .innerJoin(companies, eq(prescriptions.companyId, companies.id))
  .where(eq(prescriptions.id, prescriptionId));
```

---

## 🚀 Integration Guide

### Frontend Integration (React/TypeScript)

#### Download PDF Button
```typescript
import { Button } from '@/components/ui/button';

const DownloadPrescriptionButton = ({ prescriptionId }: { prescriptionId: string }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/pdf/prescription/${prescriptionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription_${prescriptionId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Button onClick={handleDownload}>
      Download Prescription PDF
    </Button>
  );
};
```

#### Preview PDF in Modal
```typescript
import { Dialog, DialogContent } from '@/components/ui/dialog';

const PreviewPrescriptionModal = ({ prescriptionId, open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <iframe
          src={`/api/pdf/preview/prescription/${prescriptionId}`}
          className="w-full h-full border-0"
          title="Prescription Preview"
        />
      </DialogContent>
    </Dialog>
  );
};
```

#### Bulk Actions
```typescript
const downloadMultiplePrescriptions = async (prescriptionIds: string[]) => {
  for (const id of prescriptionIds) {
    const response = await fetch(`/api/pdf/prescription/${id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription_${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Add delay between downloads
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
```

---

## 📋 Use Cases

### 1. **Clinical Workflow**
- **Generate prescription after examination** → Professional document for patient records
- **Print prescription for patient** → GOC-compliant takeaway document
- **Email prescription to patient** → Attach PDF to email notification

### 2. **Lab Order Processing**
- **Create order slip when submitting to lab** → Clear instructions for lab technicians
- **Print order slip for physical filing** → Accompanies job through production
- **Scan QR code in lab** → Quick order lookup and status tracking

### 3. **Patient Management**
- **Generate patient info sheet for new patients** → Complete onboarding document
- **Print for home visits** → Portable patient information
- **Share with other healthcare providers** → Comprehensive patient summary

### 4. **Compliance & Auditing**
- **Generate prescription for GOC audit** → Proof of compliance
- **Export patient records** → GDPR data export requests
- **Archive order documentation** → Legal record keeping

---

## 🎯 Best Practices

### Performance
1. **Generate PDFs asynchronously** - Use background jobs for bulk operations
2. **Cache generated PDFs** - Store in S3/CloudStorage for repeat access
3. **Compress PDFs** - Consider compression for large batches

### Security
1. **Validate user permissions** - Check if user has access to patient/order data
2. **Audit PDF generation** - Log who generated which PDFs and when
3. **Watermark sensitive documents** - Add "COPY" watermark for duplicates

### User Experience
1. **Show loading indicators** - PDF generation can take 1-3 seconds
2. **Provide preview option** - Let users verify before downloading
3. **Enable batch downloads** - ZIP multiple PDFs together

### Customization
1. **Company logos** - Upload logo and reference in company settings
2. **Custom colors** - Allow practices to customize brand colors
3. **Footer text** - Customizable compliance notices and contact info

---

## 🔐 GOC Compliance Checklist

### Prescription PDF ✅
- [x] Prescriber name and GOC registration number
- [x] Patient name and date of birth
- [x] Date of issue and expiry
- [x] Complete prescription values (Sphere, Cylinder, Axis, Add)
- [x] Pupillary distance measurements
- [x] Digital signature capability
- [x] Record retention information
- [x] Test room identification

### Order Slip PDF ✅
- [x] Patient identification
- [x] Complete prescription details
- [x] Lens specifications
- [x] Special instructions section
- [x] Traceability (Order number, QR code)
- [x] Ordering practice details

### Customer Info PDF ✅
- [x] GDPR compliance notices
- [x] Consent tracking
- [x] Secure data handling
- [x] Patient confidentiality warnings

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. PDF Generation Fails
```
Error: Prescription not found
```
**Solution:** Verify prescriptionId/orderId/patientId exists in database

#### 2. QR Code Not Displaying
```
Warning: QR code generation error
```
**Solution:** Check qrcode package installation and data string length

#### 3. Font Not Found
```
Error: Font 'Helvetica-Bold' not found
```
**Solution:** pdfkit includes standard fonts, ensure pdfkit is properly installed

#### 4. Memory Issues with Bulk Generation
**Solution:** Process PDFs in batches of 10-20, use streaming for large files

### Debug Mode
Enable debug logging:
```typescript
// In ProfessionalPDFService.ts
console.log('Generating PDF for:', prescriptionId);
console.log('Prescription data:', prescription);
```

---

## 📈 Future Enhancements

### Planned Features
1. **Multi-language support** - Generate PDFs in different languages
2. **Custom templates** - Allow practices to create custom layouts
3. **Digital signatures** - Integrate with e-signature providers
4. **Batch printing** - Print multiple documents at once
5. **Email integration** - Auto-send PDFs via email
6. **SMS integration** - Send PDF links via SMS
7. **Cloud storage** - Auto-upload to Dropbox, Google Drive
8. **OCR integration** - Make PDFs searchable

### Template Variations
- **Compact prescription** - Single-page version
- **Multi-lingual prescription** - For international patients
- **Pediatric prescription** - Specialized format for children
- **Contact lens prescription** - Different layout for CL specs

---

## 📞 Support

For questions or issues with PDF templates:
1. Check this documentation
2. Review `/server/services/ProfessionalPDFService.ts`
3. Test with sample data using API endpoints
4. Contact development team for custom requirements

---

## 📝 License & Usage

These PDF templates are part of the Integrated Lens System and follow the same license. 

**Copyright © 2025 Integrated Lens System**

Designed with ❤️ for optical practices worldwide.
