import PDFDocument from "pdfkit";
import { createLogger, type Logger } from "../utils/logger";

/**
 * Patient Examination Form Data Structure
 * Clinical record for patient visit - pre-populated from database
 */
export interface ExaminationFormData {
  // Patient Demographics (from database)
  patientDemographics: {
    customerId: string;
    title?: string; // Ms, Mr, Mrs, Dr, etc.
    firstName: string;
    surname: string;
    dateOfBirth: string;
    age: number;
    contact: string;
    address?: string;
    ethnicity?: string;
  };

  // Appointment Details (from database)
  appointmentDetails: {
    appointmentDate: string;
    appointmentTime: string;
    appointmentType?: string; // e.g., "GOS Form Signatory, Complex Lenses"
    appointmentReason?: string; // e.g., "G3ST & OCT"
    nhsOrPrivate: string; // "NHS" or "Private"
    lastSightTest?: string;
    lastContactLensCheck?: string;
  };

  // Habitual Rx (Current glasses - from last dispense)
  habitualRx?: {
    right: {
      sph?: string;
      cyl?: string;
      axis?: string;
      prism?: string;
      add?: string;
      type?: string; // "Near", "Distance", "Varifocal"
      pd?: string;
      oc?: string;
      va?: string; // Visual Acuity
    };
    left: {
      sph?: string;
      cyl?: string;
      axis?: string;
      prism?: string;
      add?: string;
      type?: string;
      pd?: string;
      oc?: string;
      va?: string;
    };
  };

  // Clinical Notes (from previous appointments)
  clinicalNotes?: {
    appointmentNotes?: string;
    previousNotes?: string;
  };

  // Practice Information
  practiceInfo?: {
    practiceName: string;
    practiceAddress?: string;
    practicePhone?: string;
  };
}

/**
 * Patient Examination Form PDF Service
 * Generates pre-populated clinical examination forms for optometrists
 * This is the CLINICAL RECORD (not the lab manufacturing ticket)
 */
export class ExaminationFormService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger("ExaminationFormService");
  }

  /**
   * Generate a pre-populated patient examination form PDF
   */
  async generateExaminationFormPDF(data: ExaminationFormData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 30,
          size: 'A4',
          info: {
            Title: `Examination Form - ${data.patientDemographics.firstName} ${data.patientDemographics.surname}`,
            Author: data.practiceInfo?.practiceName || 'Optical Practice',
          }
        });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // 1. Header
        this.addHeader(doc, data);

        // 2. Patient & Appointment Details
        this.addPatientAndAppointmentInfo(doc, data);

        // 3. Pre-Test Results Section (BLANK - for technician)
        this.addPreTestSection(doc);

        // 4. Habitual Rx (Current glasses)
        this.addHabitualRxSection(doc, data);

        // 5. Prescribed Rx (NEW prescription - BLANK for optometrist)
        this.addPrescribedRxSection(doc);

        // 6. Clinical & Dispensing Notes
        this.addNotesSection(doc, data);

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        this.logger.error("Error generating examination form PDF", error as Error);
        reject(error);
      }
    });
  }

  /**
   * Header with practice branding
   */
  private addHeader(doc: typeof PDFDocument.prototype, data: ExaminationFormData): void {
    // Header bar
    doc
      .rect(0, 0, 612, 70)
      .fillAndStroke("#1E3A8A", "#1E40AF");

    // Practice name
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text(data.practiceInfo?.practiceName || "OPTICAL PRACTICE", 40, 20);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#DBEAFE")
      .text("PATIENT EXAMINATION FORM", 40, 48);

    // Right side - Form type
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text("CLINICAL RECORD", 420, 25, { align: "right", width: 150 });

    doc.fillColor("#000000");
    doc.y = 85;
  }

  /**
   * 1. Patient Demographics & Appointment Details
   */
  private addPatientAndAppointmentInfo(
    doc: typeof PDFDocument.prototype,
    data: ExaminationFormData
  ): void {
    const startY = doc.y;

    // Section title
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#1E40AF")
      .text("PATIENT & APPOINTMENT DETAILS", 40, startY);

    doc.moveDown(0.5);

    // Draw border around entire section
    const sectionY = doc.y;
    doc
      .roundedRect(30, sectionY, 552, 160, 3)
      .strokeColor("#94A3B8")
      .lineWidth(1)
      .stroke();

    doc.fillColor("#000000");

    // Calculate age from DOB
    const age = data.patientDemographics.age;

    // Left Column - Patient Demographics
    let yPos = sectionY + 15;
    const leftX = 40;
    const labelWidth = 80;
    const valueX = leftX + labelWidth;

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    
    // Customer ID
    doc.text("Customer ID:", leftX, yPos);
    doc.font("Helvetica").fillColor("#111827").fontSize(10);
    doc.text(data.patientDemographics.customerId, valueX, yPos);
    yPos += 16;

    // Title & Name
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("Patient Name:", leftX, yPos);
    doc.font("Helvetica").fillColor("#111827").fontSize(10);
    const fullName = `${data.patientDemographics.title || ''} ${data.patientDemographics.firstName} ${data.patientDemographics.surname}`.trim();
    doc.text(fullName, valueX, yPos);
    yPos += 16;

    // DOB & Age
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("DOB:", leftX, yPos);
    doc.font("Helvetica").fillColor("#111827").fontSize(10);
    doc.text(`${data.patientDemographics.dateOfBirth} (Age ${age})`, valueX, yPos);
    yPos += 16;

    // Contact
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("Contact:", leftX, yPos);
    doc.font("Helvetica").fillColor("#111827").fontSize(10);
    doc.text(data.patientDemographics.contact, valueX, yPos);
    yPos += 16;

    // Address
    if (data.patientDemographics.address) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
      doc.text("Address:", leftX, yPos);
      doc.font("Helvetica").fillColor("#111827").fontSize(9);
      doc.text(data.patientDemographics.address, valueX, yPos, { width: 200 });
      yPos += 28;
    }

    // Ethnicity
    if (data.patientDemographics.ethnicity) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
      doc.text("Ethnicity:", leftX, yPos);
      doc.font("Helvetica").fillColor("#111827").fontSize(10);
      doc.text(data.patientDemographics.ethnicity, valueX, yPos);
    }

    // Right Column - Appointment Details
    yPos = sectionY + 15;
    const rightX = 320;
    const rightLabelWidth = 90;
    const rightValueX = rightX + rightLabelWidth;

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");

    // Appointment Date
    doc.text("Appt Date:", rightX, yPos);
    doc.font("Helvetica").fillColor("#111827").fontSize(10);
    doc.text(data.appointmentDetails.appointmentDate, rightValueX, yPos);
    yPos += 16;

    // Appointment Time
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("Appt Time:", rightX, yPos);
    doc.font("Helvetica").fillColor("#111827").fontSize(10);
    doc.text(data.appointmentDetails.appointmentTime, rightValueX, yPos);
    yPos += 16;

    // Appointment Type
    if (data.appointmentDetails.appointmentType) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
      doc.text("Appt Type:", rightX, yPos);
      doc.font("Helvetica").fillColor("#111827").fontSize(9);
      doc.text(data.appointmentDetails.appointmentType, rightValueX, yPos, { width: 140 });
      yPos += 24;
    }

    // Appointment Reason
    if (data.appointmentDetails.appointmentReason) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
      doc.text("Reason:", rightX, yPos);
      doc.font("Helvetica").fillColor("#111827").fontSize(10);
      doc.text(data.appointmentDetails.appointmentReason, rightValueX, yPos);
      yPos += 16;
    }

    // NHS/Private
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("NHS/Private:", rightX, yPos);
    doc.font("Helvetica").fillColor(data.appointmentDetails.nhsOrPrivate === "NHS" ? "#059669" : "#DC2626").fontSize(10);
    doc.text(data.appointmentDetails.nhsOrPrivate, rightValueX, yPos);
    yPos += 16;

    // Last Sight Test
    if (data.appointmentDetails.lastSightTest) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
      doc.text("Last Sight Test:", rightX, yPos);
      doc.font("Helvetica").fillColor("#111827").fontSize(10);
      doc.text(data.appointmentDetails.lastSightTest, rightValueX, yPos);
      yPos += 16;
    }

    // Last C/Lens Check
    if (data.appointmentDetails.lastContactLensCheck) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
      doc.text("Last C/Lens:", rightX, yPos);
      doc.font("Helvetica").fillColor("#111827").fontSize(10);
      doc.text(data.appointmentDetails.lastContactLensCheck, rightValueX, yPos);
    }

    doc.fillColor("#000000");
    doc.y = sectionY + 175;
  }

  /**
   * 2. Pre-Test Results Section (BLANK - for technician to fill)
   */
  private addPreTestSection(doc: typeof PDFDocument.prototype): void {
    doc.moveDown(0.5);

    // Section title
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#7C3AED")
      .text("PRE-TEST RESULTS", 40, doc.y);

    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .fillColor("#6B7280")
      .text("(To be completed by technician before optometrist examination)", 200, doc.y - 12);

    doc.moveDown(0.5);

    const tableTop = doc.y;
    const rowHeight = 25;
    const headerHeight = 22;

    // Column positions
    const eyeX = 40;
    const sphX = 85;
    const cylX = 135;
    const axisX = 185;
    const kReadX = 235;
    const iopX = 305;
    const fieldsX = 355;
    const fundusX = 425;
    const octX = 495;

    // Draw table border
    doc
      .rect(30, tableTop, 552, headerHeight + (rowHeight * 2))
      .strokeColor("#94A3B8")
      .lineWidth(1)
      .stroke();

    // Header background
    doc
      .rect(30, tableTop, 552, headerHeight)
      .fillAndStroke("#EDE9FE", "#C4B5FD");

    // Header text
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#5B21B6");
    doc.text("Eye", eyeX, tableTop + 7);
    doc.text("Sph", sphX, tableTop + 7);
    doc.text("Cyl", cylX, tableTop + 7);
    doc.text("Axis", axisX, tableTop + 7);
    doc.text("K Read", kReadX, tableTop + 7);
    doc.text("IOP", iopX, tableTop + 7);
    doc.text("Fields", fieldsX, tableTop + 7);
    doc.text("Fundus", fundusX, tableTop + 7);
    doc.text("OCT", octX, tableTop + 7);

    doc.fillColor("#000000");

    // Right Eye Row
    let currentY = tableTop + headerHeight;
    doc
      .rect(30, currentY, 552, rowHeight)
      .strokeColor("#94A3B8")
      .lineWidth(0.5)
      .stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("R", eyeX, currentY + 9);

    // Left Eye Row
    currentY += rowHeight;
    doc
      .rect(30, currentY, 552, rowHeight)
      .strokeColor("#94A3B8")
      .lineWidth(0.5)
      .stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("L", eyeX, currentY + 9);

    // Vertical lines for columns
    const columnXs = [eyeX + 40, sphX + 40, cylX + 40, axisX + 40, kReadX + 60, iopX + 40, fieldsX + 60, fundusX + 60];
    columnXs.forEach(x => {
      doc
        .moveTo(x, tableTop)
        .lineTo(x, tableTop + headerHeight + (rowHeight * 2))
        .strokeColor("#94A3B8")
        .lineWidth(0.5)
        .stroke();
    });

    doc.fillColor("#000000").strokeColor("#000000").lineWidth(1);
    doc.y = currentY + rowHeight + 10;
  }

  /**
   * 3. Habitual Rx Section (Current glasses - from database)
   */
  private addHabitualRxSection(
    doc: typeof PDFDocument.prototype,
    data: ExaminationFormData
  ): void {
    doc.moveDown(0.5);

    // Section title
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#059669")
      .text("HABITUAL Rx (CURRENT GLASSES)", 40, doc.y);

    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .fillColor("#6B7280")
      .text("(Patient's current prescription - from last dispense)", 280, doc.y - 12);

    doc.moveDown(0.5);

    const tableTop = doc.y;
    const rowHeight = 25;
    const headerHeight = 22;

    // Column positions
    const eyeX = 40;
    const sphX = 75;
    const cylX = 125;
    const axisX = 175;
    const prismX = 225;
    const addX = 285;
    const typeX = 335;
    const pdX = 415;
    const ocX = 465;
    const vaX = 515;

    // Draw table border
    doc
      .rect(30, tableTop, 552, headerHeight + (rowHeight * 2))
      .strokeColor("#94A3B8")
      .lineWidth(1)
      .stroke();

    // Header background
    doc
      .rect(30, tableTop, 552, headerHeight)
      .fillAndStroke("#D1FAE5", "#A7F3D0");

    // Header text
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#047857");
    doc.text("Eye", eyeX, tableTop + 7);
    doc.text("Sph", sphX, tableTop + 7);
    doc.text("Cyl", cylX, tableTop + 7);
    doc.text("Axis", axisX, tableTop + 7);
    doc.text("Prism", prismX, tableTop + 7);
    doc.text("Add", addX, tableTop + 7);
    doc.text("Type", typeX, tableTop + 7);
    doc.text("PD/OC", pdX, tableTop + 7);
    doc.text("OC", ocX, tableTop + 7);
    doc.text("VA", vaX, tableTop + 7);

    doc.fillColor("#000000");

    // Right Eye Row (with data if available)
    let currentY = tableTop + headerHeight;
    doc
      .rect(30, currentY, 552, rowHeight)
      .strokeColor("#94A3B8")
      .lineWidth(0.5)
      .stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("R", eyeX, currentY + 9);

    if (data.habitualRx?.right) {
      doc.font("Helvetica").fillColor("#111827").fontSize(9);
      doc.text(data.habitualRx.right.sph || "", sphX, currentY + 9);
      doc.text(data.habitualRx.right.cyl || "", cylX, currentY + 9);
      doc.text(data.habitualRx.right.axis || "", axisX, currentY + 9);
      doc.text(data.habitualRx.right.prism || "", prismX, currentY + 9);
      doc.text(data.habitualRx.right.add || "", addX, currentY + 9);
      doc.text(data.habitualRx.right.type || "", typeX, currentY + 9);
      doc.text(data.habitualRx.right.pd || "", pdX, currentY + 9);
      doc.text(data.habitualRx.right.oc || "", ocX, currentY + 9);
      doc.text(data.habitualRx.right.va || "", vaX, currentY + 9);
    }

    // Left Eye Row (with data if available)
    currentY += rowHeight;
    doc
      .rect(30, currentY, 552, rowHeight)
      .strokeColor("#94A3B8")
      .lineWidth(0.5)
      .stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("L", eyeX, currentY + 9);

    if (data.habitualRx?.left) {
      doc.font("Helvetica").fillColor("#111827").fontSize(9);
      doc.text(data.habitualRx.left.sph || "", sphX, currentY + 9);
      doc.text(data.habitualRx.left.cyl || "", cylX, currentY + 9);
      doc.text(data.habitualRx.left.axis || "", axisX, currentY + 9);
      doc.text(data.habitualRx.left.prism || "", prismX, currentY + 9);
      doc.text(data.habitualRx.left.add || "", addX, currentY + 9);
      doc.text(data.habitualRx.left.type || "", typeX, currentY + 9);
      doc.text(data.habitualRx.left.pd || "", pdX, currentY + 9);
      doc.text(data.habitualRx.left.oc || "", ocX, currentY + 9);
      doc.text(data.habitualRx.left.va || "", vaX, currentY + 9);
    }

    // Vertical lines for columns
    const columnXs = [eyeX + 30, sphX + 40, cylX + 40, axisX + 40, prismX + 50, addX + 40, typeX + 70, pdX + 40, ocX + 40];
    columnXs.forEach(x => {
      doc
        .moveTo(x, tableTop)
        .lineTo(x, tableTop + headerHeight + (rowHeight * 2))
        .strokeColor("#94A3B8")
        .lineWidth(0.5)
        .stroke();
    });

    doc.fillColor("#000000").strokeColor("#000000").lineWidth(1);
    doc.y = currentY + rowHeight + 10;
  }

  /**
   * 4. Prescribed Rx Section (NEW prescription - BLANK for optometrist)
   */
  private addPrescribedRxSection(doc: typeof PDFDocument.prototype): void {
    doc.moveDown(0.5);

    // Section title
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#DC2626")
      .text("PRESCRIBED Rx (NEW PRESCRIPTION)", 40, doc.y);

    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .fillColor("#6B7280")
      .text("(To be completed by optometrist)", 310, doc.y - 12);

    doc.moveDown(0.5);

    const tableTop = doc.y;
    const rowHeight = 25;
    const headerHeight = 22;

    // Column positions
    const eyeX = 40;
    const sphX = 75;
    const cylX = 125;
    const axisX = 175;
    const prismX = 225;
    const addX = 285;
    const typeX = 335;
    const pdX = 415;
    const ocX = 465;
    const vaX = 515;

    // Draw table border
    doc
      .rect(30, tableTop, 552, headerHeight + (rowHeight * 2))
      .strokeColor("#94A3B8")
      .lineWidth(1)
      .stroke();

    // Header background
    doc
      .rect(30, tableTop, 552, headerHeight)
      .fillAndStroke("#FEE2E2", "#FECACA");

    // Header text
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#991B1B");
    doc.text("Eye", eyeX, tableTop + 7);
    doc.text("Sph", sphX, tableTop + 7);
    doc.text("Cyl", cylX, tableTop + 7);
    doc.text("Axis", axisX, tableTop + 7);
    doc.text("Prism", prismX, tableTop + 7);
    doc.text("Add", addX, tableTop + 7);
    doc.text("Type", typeX, tableTop + 7);
    doc.text("PD/OC", pdX, tableTop + 7);
    doc.text("OC", ocX, tableTop + 7);
    doc.text("VA", vaX, tableTop + 7);

    doc.fillColor("#000000");

    // Right Eye Row (BLANK)
    let currentY = tableTop + headerHeight;
    doc
      .rect(30, currentY, 552, rowHeight)
      .strokeColor("#94A3B8")
      .lineWidth(0.5)
      .stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("R", eyeX, currentY + 9);

    // Left Eye Row (BLANK)
    currentY += rowHeight;
    doc
      .rect(30, currentY, 552, rowHeight)
      .strokeColor("#94A3B8")
      .lineWidth(0.5)
      .stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    doc.text("L", eyeX, currentY + 9);

    // Vertical lines for columns
    const columnXs = [eyeX + 30, sphX + 40, cylX + 40, axisX + 40, prismX + 50, addX + 40, typeX + 70, pdX + 40, ocX + 40];
    columnXs.forEach(x => {
      doc
        .moveTo(x, tableTop)
        .lineTo(x, tableTop + headerHeight + (rowHeight * 2))
        .strokeColor("#94A3B8")
        .lineWidth(0.5)
        .stroke();
    });

    doc.fillColor("#000000").strokeColor("#000000").lineWidth(1);
    doc.y = currentY + rowHeight + 10;
  }

  /**
   * 5. Clinical & Dispensing Notes Section
   */
  private addNotesSection(
    doc: typeof PDFDocument.prototype,
    data: ExaminationFormData
  ): void {
    doc.moveDown(0.5);

    // Section title
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#EA580C")
      .text("CLINICAL & DISPENSING NOTES", 40, doc.y);

    doc.moveDown(0.5);

    const notesY = doc.y;
    const notesHeight = 140;

    // Draw border
    doc
      .roundedRect(30, notesY, 552, notesHeight, 3)
      .strokeColor("#94A3B8")
      .lineWidth(1)
      .stroke();

    // Appointment Notes (if any)
    if (data.clinicalNotes?.appointmentNotes) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#374151")
        .text("Appointment Notes:", 40, notesY + 10);
      
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#111827")
        .text(data.clinicalNotes.appointmentNotes, 40, notesY + 25, { width: 532 });
    }

    // Clinician's Notes (BLANK section)
    const clinicianY = notesY + 50;
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("Clinician's Notes:", 40, clinicianY);

    // Draw lines for writing
    for (let i = 0; i < 3; i++) {
      const lineY = clinicianY + 20 + (i * 15);
      doc
        .moveTo(40, lineY)
        .lineTo(570, lineY)
        .strokeColor("#E5E7EB")
        .lineWidth(0.5)
        .stroke();
    }

    // Dispenser's Notes (BLANK section)
    const dispenserY = clinicianY + 70;
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("Dispenser's Notes:", 40, dispenserY);

    // Draw line for writing
    doc
      .moveTo(40, dispenserY + 15)
      .lineTo(570, dispenserY + 15)
      .strokeColor("#E5E7EB")
      .lineWidth(0.5)
      .stroke();

    doc.fillColor("#000000").strokeColor("#000000").lineWidth(1);
    doc.y = notesY + notesHeight + 10;
  }

  /**
   * Footer with signatures
   */
  private addFooter(doc: typeof PDFDocument.prototype): void {
    const footerY = 750;

    // Signature section
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#374151");

    // Optometrist signature
    doc.text("Optometrist Signature:", 40, footerY);
    doc
      .moveTo(40, footerY + 20)
      .lineTo(220, footerY + 20)
      .strokeColor("#94A3B8")
      .lineWidth(1)
      .stroke();

    // Dispenser signature
    doc.text("Dispenser Signature:", 320, footerY);
    doc
      .moveTo(320, footerY + 20)
      .lineTo(500, footerY + 20)
      .strokeColor("#94A3B8")
      .lineWidth(1)
      .stroke();

    // Footer bar
    doc
      .rect(0, 790, 612, 52)
      .fillAndStroke("#F8FAFC", "#E2E8F0");

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#64748B")
      .text("This is a clinical record. Please file securely after completion.", 0, 805, {
        align: "center",
        width: 612,
      });

    doc
      .fontSize(7)
      .text(`Form generated: ${new Date().toLocaleString()}`, 0, 820, {
        align: "center",
        width: 612,
      });

    doc.fillColor("#000000").strokeColor("#000000");
  }
}

// Export singleton instance
export const examinationFormService = new ExaminationFormService();
