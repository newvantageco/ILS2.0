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

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(po.supplier.organizationName || "N/A", 50, 180)
    .text(po.supplier.email || "", 50, 195);

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
