# PDF Templates Quick Reference

## 🚀 Quick Start

### Generate a Prescription PDF
```bash
curl -X POST http://localhost:5000/api/pdf/prescription/{prescriptionId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output prescription.pdf
```

### Generate an Order Slip PDF
```bash
curl -X POST http://localhost:5000/api/pdf/order-slip/{orderId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output order_slip.pdf
```

### Generate a Patient Info PDF
```bash
curl -X POST http://localhost:5000/api/pdf/customer-info/{patientId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output patient_info.pdf
```

---

## 📍 API Routes

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/pdf/prescription/:id` | POST | Download prescription PDF | PDF file |
| `/api/pdf/order-slip/:id` | POST | Download order slip PDF | PDF file |
| `/api/pdf/customer-info/:id` | POST | Download patient info PDF | PDF file |
| `/api/pdf/preview/prescription/:id` | GET | Preview prescription | PDF inline |
| `/api/pdf/preview/order-slip/:id` | GET | Preview order slip | PDF inline |
| `/api/pdf/preview/customer-info/:id` | GET | Preview patient info | PDF inline |

---

## 🎨 Design Specifications

### Colors
```css
Primary Blue:   #1e40af
Light Blue:     #3b82f6
Success Green:  #16a34a
Warning Amber:  #f59e0b
Error Red:      #dc2626
Neutral Gray:   #6b7280
```

### Fonts
- **Headings:** Helvetica-Bold (14-32pt)
- **Body:** Helvetica (9-11pt)
- **Labels:** Helvetica (8pt)

### QR Code Specs
- **Size:** 150x150px
- **Error Correction:** Level H (High)
- **Format:** PNG data URL

---

## 💻 React Components

### Download Button
```typescript
const DownloadButton = ({ type, id }) => {
  const download = async () => {
    const res = await fetch(`/api/pdf/${type}/${id}`, { method: 'POST' });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return <Button onClick={download}>Download PDF</Button>;
};
```

### Preview Modal
```typescript
const PreviewModal = ({ type, id }) => (
  <Dialog>
    <DialogContent className="max-w-4xl h-[80vh]">
      <iframe 
        src={`/api/pdf/preview/${type}/${id}`} 
        className="w-full h-full"
      />
    </DialogContent>
  </Dialog>
);
```

---

## 🔧 Service Methods

```typescript
import ProfessionalPDFService from '@/server/services/ProfessionalPDFService';

const service = ProfessionalPDFService.getInstance();

// Generate prescription PDF
const prescriptionPDF = await service.generatePrescriptionPDF(prescriptionId);

// Generate order slip PDF
const orderSlipPDF = await service.generateOrderSlipPDF(orderId);

// Generate patient info PDF
const patientInfoPDF = await service.generateCustomerInfoPDF(patientId);
```

---

## ✅ GOC Compliance

### Prescription PDF Includes:
- ✅ Prescriber GOC number
- ✅ Patient details (Name, DOB)
- ✅ Issue & expiry dates
- ✅ Complete Rx values
- ✅ PD measurements
- ✅ Digital signature status
- ✅ Record retention info

### Order Slip PDF Includes:
- ✅ Order number & status
- ✅ Patient identification
- ✅ Complete Rx details
- ✅ Lens specifications
- ✅ Special instructions
- ✅ QR code traceability

### Patient Info PDF Includes:
- ✅ GDPR compliance notices
- ✅ Consent tracking
- ✅ Emergency contact info
- ✅ Medical history
- ✅ Prescription history

---

## 🐛 Common Issues

### Issue: PDF not downloading
**Fix:** Check authorization token and verify ID exists

### Issue: QR code missing
**Fix:** Ensure `qrcode` package is installed

### Issue: Fonts not rendering
**Fix:** pdfkit includes standard fonts automatically

### Issue: Data not found
**Fix:** Verify database records exist for given ID

---

## 📊 Performance Tips

1. **Cache PDFs** - Store generated PDFs in S3/storage
2. **Async generation** - Use background jobs for bulk
3. **Batch operations** - Process 10-20 at a time
4. **Compress** - Use PDF compression for archives

---

## 🎯 Use Cases

| Use Case | Template | When to Use |
|----------|----------|-------------|
| Post-examination | Prescription | After completing eye exam |
| Lab submission | Order Slip | When sending job to lab |
| New patient | Patient Info | During patient onboarding |
| Record export | Patient Info | GDPR data requests |
| Compliance audit | Prescription | GOC inspection |
| Lab tracking | Order Slip | Following job through production |

---

## 📱 Frontend Examples

### Download Action Menu
```typescript
<DropdownMenu>
  <DropdownMenuTrigger>Download</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => download('prescription', id)}>
      Prescription PDF
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => download('order-slip', id)}>
      Order Slip PDF
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Bulk Download
```typescript
const bulkDownload = async (ids: string[]) => {
  for (const id of ids) {
    await downloadPDF('prescription', id);
    await sleep(500); // Prevent overwhelming server
  }
};
```

---

## 🔐 Security Checklist

- [ ] Verify user has permission to access data
- [ ] Log PDF generation events
- [ ] Validate IDs before querying database
- [ ] Sanitize user input in special instructions
- [ ] Add watermarks for copies
- [ ] Implement rate limiting

---

## 📚 Additional Resources

- Full Documentation: `PROFESSIONAL_PDF_TEMPLATES.md`
- Service Code: `server/services/ProfessionalPDFService.ts`
- Routes: `server/routes/pdfGeneration.ts`
- Database Schema: `shared/schema.ts`

---

**Last Updated:** November 2025  
**Version:** 1.0.0
