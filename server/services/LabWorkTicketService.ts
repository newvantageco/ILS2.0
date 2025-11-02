import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { createLogger, type Logger } from "../utils/logger";

/**
 * Comprehensive Lab Work Ticket Data Structure
 * Designed for optical lab technicians and "Principal Engineers"
 */
export interface LabWorkTicketData {
  // Order Information
  orderInfo: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    customerName: string;
    dispenser: string;
    phone?: string;
    dispenseDate: string;
    collectionDate?: string;
    jobStatus?: string;
  };

  // Frame & Lens Specifications
  frameInfo: {
    sku?: string;
    description: string;
    pairType?: string; // e.g., "R/L"
  };

  lensInfo: {
    rightLensDesc?: string;
    leftLensDesc?: string;
    material: string; // e.g., "1.67 High-Index", "Trivex"
    design: string; // e.g., "Free-form Progressive", "Digital Single Vision"
  };

  // Prescription (Rx) - The "Core Brain"
  prescription: {
    right: {
      sph?: string; // Sphere
      cyl?: string; // Cylinder
      axis?: string;
      hPrism?: string; // Horizontal Prism
      hBase?: string; // Base direction (In/Out)
      vPrism?: string; // Vertical Prism
      vBase?: string; // Base direction (Up/Down)
      add?: string; // Addition for progressives
    };
    left: {
      sph?: string;
      cyl?: string;
      axis?: string;
      hPrism?: string;
      hBase?: string;
      vPrism?: string;
      vBase?: string;
      add?: string;
    };
  };

  // Finishing & Layout Parameters (For the "Finishing Pro")
  finishing: {
    rightPD?: string; // Monocular PD
    leftPD?: string;
    totalPD?: string;
    rightHeight?: string; // Seg/Fit Height
    leftHeight?: string;
    rightOCHeight?: string; // Optical Center Height
    leftOCHeight?: string;
    rightInset?: string;
    leftInset?: string;
    bevelType?: string; // e.g., "Auto", "Step Bevel", "Groove", "Rimless"
    drillCoords?: string; // For rimless/specialty mounts
    frameWrapAngle?: string;
    polish?: string; // e.g., "Edge", "Bevel"
  };

  // Treatments & Coatings
  treatments: string[]; // e.g., ["AR - Premium", "Blue Light Filter", "UV"]

  // Lab Instructions (For R&D Integration & Process Innovation)
  labInstructions?: string;

  // Quality Control Checkpoints
  qualityControl?: {
    surfacingQC: boolean;
    coatingQC: boolean;
    finishingQC: boolean;
    finalInspection: boolean;
  };

  // Additional metadata
  metadata?: {
    ecpName?: string;
    patientDOB?: string;
    notes?: string;
  };
}

/**
 * Lab Work Ticket PDF Service
 * Generates professional lab work tickets with barcode tracking,
 * comprehensive prescription details, finishing parameters, and QC checkpoints
 */
export class LabWorkTicketService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger("LabWorkTicketService");
  }

  /**
   * Generate a comprehensive lab work ticket PDF
   */
  async generateLabWorkTicketPDF(data: LabWorkTicketData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 40,
          size: 'A4',
          info: {
            Title: `Lab Work Ticket - Order ${data.orderInfo.orderNumber}`,
            Author: 'Integrated Lens System',
          }
        });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Generate barcode for job tracking
        const barcodeDataUrl = await this.generateBarcode(data.orderInfo.orderNumber);

        // 1. Header & Order Information
        await this.addHeader(doc, data, barcodeDataUrl);

        // 2. Frame & Lens Specifications
        this.addFrameLensSpecs(doc, data);

        // 3. Prescription (Rx) Grid - The "Core Brain"
        this.addPrescriptionGrid(doc, data);

        // 4. Finishing & Layout Parameters
        this.addFinishingParameters(doc, data);

        // 5. Treatments & Coatings
        this.addTreatments(doc, data);

        // 6. Lab Instructions (For R&D & Process Innovation)
        this.addLabInstructions(doc, data);

        // 7. Quality Control Checkpoints
        this.addQualityControl(doc, data);

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        this.logger.error("Error generating lab work ticket PDF", error as Error);
        reject(error);
      }
    });
  }

  /**
   * Generate barcode for job tracking
   */
  private async generateBarcode(orderNumber: string): Promise<string> {
    try {
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(orderNumber, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return dataUrl;
    } catch (error) {
      this.logger.error("Error generating barcode", error as Error);
      // Return empty string if barcode generation fails
      return '';
    }
  }

  /**
   * 1. Header & Order Information
   */
  private async addHeader(
    doc: typeof PDFDocument.prototype,
    data: LabWorkTicketData,
    barcodeDataUrl: string
  ): Promise<void> {
    // Title bar with gradient effect
    doc
      .rect(0, 0, 612, 80)
      .fillAndStroke("#2563EB", "#1E40AF");

    // Main title
    doc
      .fontSize(26)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text("LAB WORK TICKET", 40, 20);

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#DBEAFE")
      .text(`Professional Optical Laboratory`, 40, 52);

    doc.fillColor("#000000");

    // Order Information Box
    const orderBoxY = 95;
    doc
      .roundedRect(40, orderBoxY, 340, 140, 5)
      .fillAndStroke("#F0F9FF", "#BFDBFE");

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#1E40AF")
      .text("ORDER INFORMATION", 50, orderBoxY + 10);

    doc.fontSize(10).font("Helvetica").fillColor("#374151");
    
    let yPos = orderBoxY + 35;
    const labelX = 50;
    const valueX = 150;

    // Customer Name
    doc.font("Helvetica-Bold").text("Customer:", labelX, yPos);
    doc.font("Helvetica").text(data.orderInfo.customerName, valueX, yPos);
    yPos += 18;

    // Customer ID
    if (data.orderInfo.customerId) {
      doc.font("Helvetica-Bold").text("Customer #:", labelX, yPos);
      doc.font("Helvetica").text(data.orderInfo.customerId, valueX, yPos);
      yPos += 18;
    }

    // Order Number
    doc.font("Helvetica-Bold").text("Order #:", labelX, yPos);
    doc.font("Helvetica").fillColor("#DC2626").text(data.orderInfo.orderNumber, valueX, yPos);
    doc.fillColor("#374151");
    yPos += 18;

    // Dispenser
    doc.font("Helvetica-Bold").text("Dispenser:", labelX, yPos);
    doc.font("Helvetica").text(data.orderInfo.dispenser, valueX, yPos);
    yPos += 18;

    // Phone
    if (data.orderInfo.phone) {
      doc.font("Helvetica-Bold").text("Phone:", labelX, yPos);
      doc.font("Helvetica").text(data.orderInfo.phone, valueX, yPos);
      yPos += 18;
    }

    // Dates Section (right column)
    yPos = orderBoxY + 35;
    const dateX = 250;
    
    doc.font("Helvetica-Bold").fillColor("#1E40AF").text("Dispense Date:", dateX, yPos);
    doc.font("Helvetica").fillColor("#374151").text(data.orderInfo.dispenseDate, dateX + 100, yPos);
    yPos += 18;

    if (data.orderInfo.collectionDate) {
      doc.font("Helvetica-Bold").fillColor("#1E40AF").text("Collection Date:", dateX, yPos);
      doc.font("Helvetica").fillColor("#374151").text(data.orderInfo.collectionDate, dateX + 100, yPos);
    }

    // Barcode Section (right side)
    if (barcodeDataUrl) {
      const barcodeX = 400;
      const barcodeY = orderBoxY + 10;
      
      doc
        .roundedRect(barcodeX, barcodeY, 170, 125, 5)
        .fillAndStroke("#FFFFFF", "#94A3B8");

      // Add barcode image
      try {
        const barcodeBuffer = Buffer.from(barcodeDataUrl.split(',')[1], 'base64');
        doc.image(barcodeBuffer, barcodeX + 10, barcodeY + 10, { width: 150, height: 150 });
      } catch (error) {
        this.logger.warn("Failed to embed barcode image", error as Error);
      }

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#64748B")
        .text("JOB TRACKING", barcodeX, barcodeY + 110, { width: 170, align: 'center' });
    }

    doc.fillColor("#000000");
    doc.y = orderBoxY + 155;
  }

  /**
   * 2. Frame & Lens Specifications
   */
  private addFrameLensSpecs(doc: typeof PDFDocument.prototype, data: LabWorkTicketData): void {
    doc.moveDown(0.5);

    // Section Title
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#4F46E5")
      .text("👓 FRAME & LENS SPECIFICATIONS", 40, doc.y);

    doc.moveDown(0.8);

    const specsY = doc.y;
    doc
      .roundedRect(40, specsY, 530, 110, 5)
      .fillAndStroke("#FAF5FF", "#E9D5FF");

    doc.fontSize(10).font("Helvetica").fillColor("#374151");

    let yPos = specsY + 15;
    const col1X = 50;
    const col2X = 300;

    // Frame Information
    doc.font("Helvetica-Bold").fillColor("#7C3AED").text("FRAME", col1X, yPos);
    yPos += 20;

    doc.font("Helvetica-Bold").fillColor("#374151").text("Description:", col1X, yPos);
    doc.font("Helvetica").text(data.frameInfo.description, col1X + 80, yPos, { width: 200 });
    yPos += 18;

    if (data.frameInfo.sku) {
      doc.font("Helvetica-Bold").text("Frame SKU:", col1X, yPos);
      doc.font("Helvetica").text(data.frameInfo.sku, col1X + 80, yPos);
      yPos += 18;
    }

    if (data.frameInfo.pairType) {
      doc.font("Helvetica-Bold").text("Pair Type:", col1X, yPos);
      doc.font("Helvetica").text(data.frameInfo.pairType, col1X + 80, yPos);
    }

    // Lens Information
    yPos = specsY + 15;
    doc.font("Helvetica-Bold").fillColor("#7C3AED").text("LENS", col2X, yPos);
    yPos += 20;

    doc.font("Helvetica-Bold").fillColor("#374151").text("Material:", col2X, yPos);
    doc.font("Helvetica").text(data.lensInfo.material, col2X + 60, yPos);
    yPos += 18;

    doc.font("Helvetica-Bold").text("Design:", col2X, yPos);
    doc.font("Helvetica").text(data.lensInfo.design, col2X + 60, yPos);
    yPos += 18;

    if (data.lensInfo.rightLensDesc) {
      doc.font("Helvetica-Bold").text("R:", col2X, yPos);
      doc.font("Helvetica").text(data.lensInfo.rightLensDesc, col2X + 20, yPos);
      yPos += 16;
    }

    if (data.lensInfo.leftLensDesc) {
      doc.font("Helvetica-Bold").text("L:", col2X, yPos);
      doc.font("Helvetica").text(data.lensInfo.leftLensDesc, col2X + 20, yPos);
    }

    doc.fillColor("#000000");
    doc.y = specsY + 125;
  }

  /**
   * 3. Prescription (Rx) Grid - The "Core Brain"
   */
  private addPrescriptionGrid(doc: typeof PDFDocument.prototype, data: LabWorkTicketData): void {
    doc.moveDown(0.8);

    // Section Title
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#DC2626")
      .text("👁 PRESCRIPTION (Rx) - CORE BRAIN", 40, doc.y);

    doc.moveDown(0.8);

    const tableTop = doc.y;
    const rowHeight = 28;
    const headerHeight = 30;

    // Column positions
    const eyeX = 50;
    const sphX = 110;
    const cylX = 170;
    const axisX = 230;
    const hPrismX = 280;
    const vPrismX = 350;
    const addX = 420;

    // Header background
    doc
      .rect(40, tableTop, 530, headerHeight)
      .fillAndStroke("#DC2626", "#B91C1C");

    // Header text
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#FFFFFF");
    doc.text("Eye", eyeX, tableTop + 10);
    doc.text("Sph", sphX, tableTop + 10);
    doc.text("Cyl", cylX, tableTop + 10);
    doc.text("Axis", axisX, tableTop + 10);
    doc.text("H.Prism", hPrismX, tableTop + 10);
    doc.text("V.Prism", vPrismX, tableTop + 10);
    doc.text("Add", addX, tableTop + 10);

    doc.fillColor("#000000");

    // Right Eye Row (OD)
    let currentY = tableTop + headerHeight;
    doc
      .rect(40, currentY, 530, rowHeight)
      .fillAndStroke("#FEF2F2", "#FECACA");

    doc.font("Helvetica-Bold").fillColor("#991B1B").fontSize(11);
    doc.text("R (OD)", eyeX, currentY + 10);

    doc.font("Helvetica").fillColor("#111827").fontSize(10);
    doc.text(data.prescription.right.sph || "—", sphX, currentY + 10);
    doc.text(data.prescription.right.cyl || "—", cylX, currentY + 10);
    doc.text(data.prescription.right.axis || "—", axisX, currentY + 10);
    
    const rightHPrism = data.prescription.right.hPrism 
      ? `${data.prescription.right.hPrism}${data.prescription.right.hBase ? ' ' + data.prescription.right.hBase : ''}`
      : "—";
    doc.text(rightHPrism, hPrismX, currentY + 10);
    
    const rightVPrism = data.prescription.right.vPrism 
      ? `${data.prescription.right.vPrism}${data.prescription.right.vBase ? ' ' + data.prescription.right.vBase : ''}`
      : "—";
    doc.text(rightVPrism, vPrismX, currentY + 10);
    
    doc.text(data.prescription.right.add || "—", addX, currentY + 10);

    // Left Eye Row (OS)
    currentY += rowHeight;
    doc
      .rect(40, currentY, 530, rowHeight)
      .fillAndStroke("#FFFFFF", "#FECACA");

    doc.font("Helvetica-Bold").fillColor("#991B1B").fontSize(11);
    doc.text("L (OS)", eyeX, currentY + 10);

    doc.font("Helvetica").fillColor("#111827").fontSize(10);
    doc.text(data.prescription.left.sph || "—", sphX, currentY + 10);
    doc.text(data.prescription.left.cyl || "—", cylX, currentY + 10);
    doc.text(data.prescription.left.axis || "—", axisX, currentY + 10);
    
    const leftHPrism = data.prescription.left.hPrism 
      ? `${data.prescription.left.hPrism}${data.prescription.left.hBase ? ' ' + data.prescription.left.hBase : ''}`
      : "—";
    doc.text(leftHPrism, hPrismX, currentY + 10);
    
    const leftVPrism = data.prescription.left.vPrism 
      ? `${data.prescription.left.vPrism}${data.prescription.left.vBase ? ' ' + data.prescription.left.vBase : ''}`
      : "—";
    doc.text(leftVPrism, vPrismX, currentY + 10);
    
    doc.text(data.prescription.left.add || "—", addX, currentY + 10);

    // Bottom border
    currentY += rowHeight;
    doc
      .moveTo(40, currentY)
      .lineTo(570, currentY)
      .strokeColor("#DC2626")
      .lineWidth(2)
      .stroke();

    doc.fillColor("#000000").strokeColor("#000000").lineWidth(1);
    doc.y = currentY + 15;
  }

  /**
   * 4. Finishing & Layout Parameters
   */
  private addFinishingParameters(doc: typeof PDFDocument.prototype, data: LabWorkTicketData): void {
    doc.moveDown(0.8);

    // Section Title
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#059669")
      .text("📐 FINISHING & LAYOUT PARAMETERS", 40, doc.y);

    doc.moveDown(0.8);

    const finishingY = doc.y;
    doc
      .roundedRect(40, finishingY, 530, 130, 5)
      .fillAndStroke("#ECFDF5", "#A7F3D0");

    doc.fontSize(10).font("Helvetica").fillColor("#374151");

    let yPos = finishingY + 15;
    const col1X = 50;
    const col2X = 200;
    const col3X = 350;
    const col4X = 480;

    // Row 1: PD and Heights
    doc.font("Helvetica-Bold").fillColor("#047857").text("PD (Pupillary Distance)", col1X, yPos);
    yPos += 18;

    doc.font("Helvetica-Bold").fillColor("#374151").text("R:", col1X, yPos);
    doc.font("Helvetica").text(data.finishing.rightPD || "—", col1X + 20, yPos);
    
    doc.font("Helvetica-Bold").text("L:", col1X + 70, yPos);
    doc.font("Helvetica").text(data.finishing.leftPD || "—", col1X + 90, yPos);
    
    if (data.finishing.totalPD) {
      doc.font("Helvetica-Bold").text("Total:", col2X - 50, yPos);
      doc.font("Helvetica").text(data.finishing.totalPD, col2X, yPos);
    }

    // Heights
    yPos = finishingY + 15;
    doc.font("Helvetica-Bold").fillColor("#047857").text("Heights (Seg/Fit)", col2X + 50, yPos);
    yPos += 18;

    doc.font("Helvetica-Bold").fillColor("#374151").text("R:", col2X + 50, yPos);
    doc.font("Helvetica").text(data.finishing.rightHeight || "—", col2X + 70, yPos);
    
    doc.font("Helvetica-Bold").text("L:", col2X + 120, yPos);
    doc.font("Helvetica").text(data.finishing.leftHeight || "—", col2X + 140, yPos);

    yPos += 22;

    // Row 2: OC Heights and Insets
    doc.font("Helvetica-Bold").fillColor("#047857").text("OC Heights", col1X, yPos);
    yPos += 18;

    doc.font("Helvetica-Bold").fillColor("#374151").text("R:", col1X, yPos);
    doc.font("Helvetica").text(data.finishing.rightOCHeight || "—", col1X + 20, yPos);
    
    doc.font("Helvetica-Bold").text("L:", col1X + 70, yPos);
    doc.font("Helvetica").text(data.finishing.leftOCHeight || "—", col1X + 90, yPos);

    // Insets
    yPos -= 18;
    doc.font("Helvetica-Bold").fillColor("#047857").text("Insets", col2X + 50, yPos);
    yPos += 18;

    doc.font("Helvetica-Bold").fillColor("#374151").text("R:", col2X + 50, yPos);
    doc.font("Helvetica").text(data.finishing.rightInset || "—", col2X + 70, yPos);
    
    doc.font("Helvetica-Bold").text("L:", col2X + 120, yPos);
    doc.font("Helvetica").text(data.finishing.leftInset || "—", col2X + 140, yPos);

    yPos += 22;

    // Row 3: Finishing Details
    doc.font("Helvetica-Bold").fillColor("#047857").text("Finishing Details", col1X, yPos);
    yPos += 18;

    doc.font("Helvetica-Bold").fillColor("#374151").text("Bevel Type:", col1X, yPos);
    doc.font("Helvetica").text(data.finishing.bevelType || "Auto", col1X + 80, yPos);

    if (data.finishing.polish) {
      doc.font("Helvetica-Bold").text("Polish:", col2X + 50, yPos);
      doc.font("Helvetica").text(data.finishing.polish, col2X + 100, yPos);
    }

    if (data.finishing.frameWrapAngle) {
      yPos += 18;
      doc.font("Helvetica-Bold").text("Frame Wrap Angle:", col1X, yPos);
      doc.font("Helvetica").text(data.finishing.frameWrapAngle, col1X + 120, yPos);
    }

    if (data.finishing.drillCoords) {
      yPos += 18;
      doc.font("Helvetica-Bold").text("Drill Coordinates:", col1X, yPos);
      doc.font("Helvetica").text(data.finishing.drillCoords, col1X + 120, yPos, { width: 380 });
    }

    doc.fillColor("#000000");
    doc.y = finishingY + 145;
  }

  /**
   * 5. Treatments & Coatings
   */
  private addTreatments(doc: typeof PDFDocument.prototype, data: LabWorkTicketData): void {
    if (!data.treatments || data.treatments.length === 0) {
      return;
    }

    doc.moveDown(0.8);

    // Section Title
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#7C3AED")
      .text("💎 TREATMENTS & COATINGS", 40, doc.y);

    doc.moveDown(0.5);

    const treatmentsY = doc.y;
    doc
      .roundedRect(40, treatmentsY, 530, 60, 5)
      .fillAndStroke("#FAF5FF", "#E9D5FF");

    doc.fontSize(10).font("Helvetica").fillColor("#374151");

    let yPos = treatmentsY + 15;
    let xPos = 50;
    const boxSize = 12;
    const spacing = 25;

    data.treatments.forEach((treatment, index) => {
      // Draw checkbox (checked)
      doc
        .rect(xPos, yPos, boxSize, boxSize)
        .fillAndStroke("#7C3AED", "#6D28D9");

      // Draw checkmark
      doc
        .moveTo(xPos + 3, yPos + 6)
        .lineTo(xPos + 5, yPos + 9)
        .lineTo(xPos + 9, yPos + 3)
        .strokeColor("#FFFFFF")
        .lineWidth(2)
        .stroke();

      doc.strokeColor("#000000").lineWidth(1);

      // Treatment text
      doc
        .fillColor("#374151")
        .text(treatment, xPos + boxSize + 5, yPos + 1);

      xPos += 180;
      
      // Wrap to next line after 3 items
      if ((index + 1) % 3 === 0) {
        xPos = 50;
        yPos += spacing;
      }
    });

    doc.fillColor("#000000");
    doc.y = treatmentsY + 75;
  }

  /**
   * 6. Lab Instructions (For R&D & Process Innovation)
   */
  private addLabInstructions(doc: typeof PDFDocument.prototype, data: LabWorkTicketData): void {
    doc.moveDown(0.8);

    // Section Title
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#EA580C")
      .text("🔬 LAB INSTRUCTIONS & R&D NOTES", 40, doc.y);

    doc.moveDown(0.5);

    const instructionsY = doc.y;
    const boxHeight = data.labInstructions && data.labInstructions.length > 100 ? 90 : 70;
    
    doc
      .roundedRect(40, instructionsY, 530, boxHeight, 5)
      .fillAndStroke("#FFF7ED", "#FED7AA");

    doc.fontSize(9).font("Helvetica-Oblique").fillColor("#9A3412");
    doc.text(
      "For Principal Engineers: Document R&D protocols, new material tests, process innovations, or non-standard procedures",
      50,
      instructionsY + 10,
      { width: 510, align: "left" }
    );

    doc.fontSize(10).font("Helvetica").fillColor("#78350F");
    const instructionsText = data.labInstructions || "No special instructions";
    doc.text(instructionsText, 50, instructionsY + 32, { width: 510, align: "left" });

    doc.fillColor("#000000");
    doc.y = instructionsY + boxHeight + 15;
  }

  /**
   * 7. Quality Control Checkpoints
   */
  private addQualityControl(doc: typeof PDFDocument.prototype, data: LabWorkTicketData): void {
    doc.moveDown(0.8);

    // Section Title
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#0891B2")
      .text("✓ QUALITY CONTROL CHECKPOINTS", 40, doc.y);

    doc.moveDown(0.5);

    const qcY = doc.y;
    doc
      .roundedRect(40, qcY, 530, 80, 5)
      .fillAndStroke("#ECFEFF", "#A5F3FC");

    doc.fontSize(11).font("Helvetica").fillColor("#374151");

    const checkpoints = [
      { label: "Surfacing QC", checked: data.qualityControl?.surfacingQC || false },
      { label: "Coating QC", checked: data.qualityControl?.coatingQC || false },
      { label: "Finishing QC", checked: data.qualityControl?.finishingQC || false },
      { label: "Final Inspection", checked: data.qualityControl?.finalInspection || false },
    ];

    let yPos = qcY + 15;
    const col1X = 60;
    const col2X = 320;
    const boxSize = 16;

    checkpoints.forEach((checkpoint, index) => {
      const xPos = index < 2 ? col1X : col2X;
      if (index === 2) yPos = qcY + 15;

      // Draw checkbox
      if (checkpoint.checked) {
        doc
          .rect(xPos, yPos, boxSize, boxSize)
          .fillAndStroke("#0891B2", "#0E7490");

        // Draw checkmark
        doc
          .moveTo(xPos + 3, yPos + 8)
          .lineTo(xPos + 6, yPos + 12)
          .lineTo(xPos + 13, yPos + 4)
          .strokeColor("#FFFFFF")
          .lineWidth(2)
          .stroke();
      } else {
        doc
          .rect(xPos, yPos, boxSize, boxSize)
          .stroke("#94A3B8");
      }

      doc.strokeColor("#000000").lineWidth(1);

      // Checkpoint label
      doc.fillColor("#374151").text(checkpoint.label, xPos + boxSize + 8, yPos + 2);

      yPos += 30;
    });

    // Signature lines
    yPos = qcY + 15;
    const sigX = 420;
    
    doc.fontSize(8).fillColor("#64748B");
    doc.text("Technician Signature:", sigX, yPos + 40);
    doc
      .moveTo(sigX, yPos + 55)
      .lineTo(sigX + 130, yPos + 55)
      .strokeColor("#94A3B8")
      .stroke();

    doc.strokeColor("#000000");
    doc.fillColor("#000000");
    doc.y = qcY + 95;
  }

  /**
   * Footer
   */
  private addFooter(doc: typeof PDFDocument.prototype): void {
    const pageHeight = 842; // A4 height in points
    const footerY = pageHeight - 60;

    // Footer bar
    doc
      .rect(0, footerY, 612, 60)
      .fillAndStroke("#F8FAFC", "#E2E8F0");

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#64748B")
      .text(
        "This lab work ticket was generated by Integrated Lens System",
        0,
        footerY + 15,
        { align: "center", width: 612 }
      );

    doc
      .fontSize(8)
      .text(`Generated: ${new Date().toLocaleString()}`, 0, footerY + 32, {
        align: "center",
        width: 612,
      });

    doc.fillColor("#000000");
  }
}

// Export singleton instance
export const labWorkTicketService = new LabWorkTicketService();
