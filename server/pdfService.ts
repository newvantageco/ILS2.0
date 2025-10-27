import PDFDocument from "pdfkit";

interface POLineItem {
  itemName: string;
  description: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: string | null;
  notes: string | null;
  expectedDeliveryDate: Date | null;
  createdAt: Date;
  supplier: {
    organizationName: string | null;
    email: string | null;
    accountNumber: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  };
  createdBy: {
    firstName: string | null;
    lastName: string | null;
  };
  lineItems: POLineItem[];
}

export function generatePurchaseOrderPDF(po: PurchaseOrder): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });

  // Header
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("PURCHASE ORDER", 50, 50);

  // PO Number and Date
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`PO Number: ${po.poNumber}`, 50, 90)
    .text(`Date: ${new Date(po.createdAt).toLocaleDateString()}`, 50, 105)
    .text(`Status: ${po.status.toUpperCase()}`, 50, 120);

  // Supplier Information
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("SUPPLIER:", 50, 160);

  let supplierY = 180;
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(po.supplier.organizationName || "N/A", 50, supplierY);
  
  supplierY += 15;
  if (po.supplier.accountNumber) {
    doc.text(`Account: ${po.supplier.accountNumber}`, 50, supplierY);
    supplierY += 15;
  }
  
  if (po.supplier.contactEmail) {
    doc.text(po.supplier.contactEmail, 50, supplierY);
    supplierY += 15;
  }
  
  if (po.supplier.contactPhone) {
    doc.text(po.supplier.contactPhone, 50, supplierY);
  }

  // Lab Information
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("FROM:", 350, 160);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Integrated Lens System", 350, 180)
    .text(`Created by: ${po.createdBy.firstName || ""} ${po.createdBy.lastName || ""}`, 350, 195);

  // Line Items Table
  const tableTop = 260;
  const tableHeaders = ["Item", "Description", "Qty", "Unit Price", "Total"];
  const columnWidths = [150, 150, 60, 80, 80];
  const columnPositions = [50, 200, 350, 410, 490];

  // Table Header
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#000000");

  tableHeaders.forEach((header, i) => {
    doc.text(header, columnPositions[i], tableTop, {
      width: columnWidths[i],
      align: i >= 2 ? "right" : "left",
    });
  });

  // Table Header Line
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(570, tableTop + 15)
    .stroke();

  // Line Items
  let yPosition = tableTop + 25;
  doc.font("Helvetica").fontSize(9);

  po.lineItems.forEach((item, index) => {
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }

    doc.text(item.itemName, columnPositions[0], yPosition, {
      width: columnWidths[0],
    });

    doc.text(item.description || "-", columnPositions[1], yPosition, {
      width: columnWidths[1],
    });

    doc.text(String(item.quantity), columnPositions[2], yPosition, {
      width: columnWidths[2],
      align: "right",
    });

    doc.text(`$${parseFloat(item.unitPrice).toFixed(2)}`, columnPositions[3], yPosition, {
      width: columnWidths[3],
      align: "right",
    });

    doc.text(`$${parseFloat(item.totalPrice).toFixed(2)}`, columnPositions[4], yPosition, {
      width: columnWidths[4],
      align: "right",
    });

    yPosition += 20;
  });

  // Total
  yPosition += 10;
  doc
    .moveTo(350, yPosition)
    .lineTo(570, yPosition)
    .stroke();

  yPosition += 15;
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("TOTAL:", 350, yPosition)
    .text(`$${po.totalAmount ? parseFloat(po.totalAmount).toFixed(2) : "0.00"}`, 490, yPosition, {
      width: 80,
      align: "right",
    });

  // Notes
  if (po.notes) {
    yPosition += 40;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Notes:", 50, yPosition);

    yPosition += 15;
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(po.notes, 50, yPosition, {
        width: 520,
      });
  }

  // Expected Delivery Date
  if (po.expectedDeliveryDate) {
    yPosition += 30;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Expected Delivery:", 50, yPosition);

    doc
      .font("Helvetica")
      .text(new Date(po.expectedDeliveryDate).toLocaleDateString(), 170, yPosition);
  }

  // Footer
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#666666")
    .text(
      "Thank you for your business",
      50,
      750,
      { align: "center", width: 520 }
    );

  doc.end();
  return doc;
}

interface PrescriptionData {
  id: string;
  issueDate: Date;
  expiryDate: Date | null;
  odSphere: string | null;
  odCylinder: string | null;
  odAxis: string | null;
  odAdd: string | null;
  osSphere: string | null;
  osCylinder: string | null;
  osAxis: string | null;
  osAdd: string | null;
  pd: string | null;
  isSigned: boolean;
  signedAt: Date | null;
  patient: {
    name: string;
    dateOfBirth: string | null;
    nhsNumber: string | null;
  };
  ecp: {
    firstName: string | null;
    lastName: string | null;
  };
}

export async function generatePrescriptionPDF(prescription: PrescriptionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("OPTICAL PRESCRIPTION", 50, 50);

    // Issue Date and Expiry
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Issue Date: ${new Date(prescription.issueDate).toLocaleDateString()}`, 50, 90);
    
    if (prescription.expiryDate) {
      doc.text(`Expiry Date: ${new Date(prescription.expiryDate).toLocaleDateString()}`, 50, 105);
    }

    // Patient Information
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("PATIENT INFORMATION:", 50, 140);

    let patientY = 160;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Name: ${prescription.patient.name}`, 50, patientY);
    
    patientY += 15;
    if (prescription.patient.dateOfBirth) {
      doc.text(`Date of Birth: ${prescription.patient.dateOfBirth}`, 50, patientY);
      patientY += 15;
    }
    
    if (prescription.patient.nhsNumber) {
      doc.text(`NHS Number: ${prescription.patient.nhsNumber}`, 50, patientY);
      patientY += 15;
    }

    // Prescription Details
    const prescriptionTop = patientY + 20;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("PRESCRIPTION DETAILS:", 50, prescriptionTop);

    // Prescription Table
    const tableTop = prescriptionTop + 30;
    const headers = ["", "Sphere", "Cylinder", "Axis", "Add"];
    const columnWidths = [60, 90, 90, 90, 90];
    const columnPositions = [50, 110, 200, 290, 380];

    // Table Header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#000000");

    headers.forEach((header, i) => {
      doc.text(header, columnPositions[i], tableTop, {
        width: columnWidths[i],
        align: i === 0 ? "left" : "center",
      });
    });

    // Table Header Line
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(470, tableTop + 15)
      .stroke();

    // Right Eye (OD)
    let yPosition = tableTop + 25;
    doc
      .font("Helvetica-Bold")
      .text("OD (Right)", columnPositions[0], yPosition, { width: columnWidths[0] });

    doc
      .font("Helvetica")
      .text(prescription.odSphere || "-", columnPositions[1], yPosition, { width: columnWidths[1], align: "center" })
      .text(prescription.odCylinder || "-", columnPositions[2], yPosition, { width: columnWidths[2], align: "center" })
      .text(prescription.odAxis || "-", columnPositions[3], yPosition, { width: columnWidths[3], align: "center" })
      .text(prescription.odAdd || "-", columnPositions[4], yPosition, { width: columnWidths[4], align: "center" });

    // Left Eye (OS)
    yPosition += 25;
    doc
      .font("Helvetica-Bold")
      .text("OS (Left)", columnPositions[0], yPosition, { width: columnWidths[0] });

    doc
      .font("Helvetica")
      .text(prescription.osSphere || "-", columnPositions[1], yPosition, { width: columnWidths[1], align: "center" })
      .text(prescription.osCylinder || "-", columnPositions[2], yPosition, { width: columnWidths[2], align: "center" })
      .text(prescription.osAxis || "-", columnPositions[3], yPosition, { width: columnWidths[3], align: "center" })
      .text(prescription.osAdd || "-", columnPositions[4], yPosition, { width: columnWidths[4], align: "center" });

    // PD (Pupillary Distance)
    yPosition += 30;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("PD (Pupillary Distance):", 50, yPosition);

    doc
      .font("Helvetica")
      .text(prescription.pd || "Not specified", 200, yPosition);

    // Prescriber Information
    yPosition += 50;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("PRESCRIBER INFORMATION:", 50, yPosition);

    yPosition += 20;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Prescribed by: ${prescription.ecp.firstName || ""} ${prescription.ecp.lastName || ""}`, 50, yPosition);

    if (prescription.isSigned && prescription.signedAt) {
      yPosition += 15;
      doc.text(`Signed on: ${new Date(prescription.signedAt).toLocaleDateString()}`, 50, yPosition);
    }

    // Signature status
    yPosition += 30;
    if (prescription.isSigned) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#008000")
        .text("✓ Digitally Signed", 50, yPosition);
    } else {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#ff0000")
        .text("⚠ Not Signed", 50, yPosition);
    }

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#666666")
      .text(
        "This prescription is valid for the period specified above. Please consult your eye care professional if you have any questions.",
        50,
        750,
        { align: "center", width: 520 }
      );

    doc.end();
  });
}
