import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export async function sendPurchaseOrderEmail(
  supplierEmail: string,
  supplierName: string,
  poNumber: string,
  pdfBuffer: Buffer,
  accountNumber?: string
): Promise<void> {
  const { client, fromEmail } = await getResendClient();

  await client.emails.send({
    from: fromEmail,
    to: supplierEmail,
    subject: `Purchase Order ${poNumber} - Integrated Lens System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #A76111;">New Purchase Order</h2>
        <p>Dear ${supplierName},</p>
        ${accountNumber ? `<p style="color: #666; font-size: 14px;">Account Number: <strong>${accountNumber}</strong></p>` : ''}
        <p>Please find attached Purchase Order <strong>${poNumber}</strong> from Integrated Lens System.</p>
        <p>Please review the attached PDF and confirm receipt at your earliest convenience.</p>
        <p>If you have any questions, please contact us.</p>
        <br/>
        <p>Best regards,<br/>
        <strong>Integrated Lens System</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: `PO-${poNumber}.pdf`,
        content: pdfBuffer,
      }
    ],
  });
}

export async function sendShipmentNotificationEmail(
  ecpEmail: string,
  ecpName: string,
  orderNumber: string,
  patientName: string,
  trackingNumber: string
): Promise<void> {
  const { client, fromEmail } = await getResendClient();

  await client.emails.send({
    from: fromEmail,
    to: ecpEmail,
    subject: `Order ${orderNumber} Shipped - Tracking Available`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #A76111;">Order Shipped</h2>
        <p>Dear ${ecpName},</p>
        <p>Great news! Order <strong>${orderNumber}</strong> for patient <strong>${patientName}</strong> has been shipped.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Tracking Number:</strong></p>
          <p style="font-size: 18px; color: #A76111; margin: 10px 0;"><strong>${trackingNumber}</strong></p>
        </div>
        <p>You can use this tracking number to monitor the shipment status with your carrier.</p>
        <p>The order should arrive within the estimated delivery timeframe.</p>
        <br/>
        <p>Best regards,<br/>
        <strong>Integrated Lens System</strong></p>
      </div>
    `,
  });
}

interface PrescriptionEmailData {
  id: string;
  patient: {
    name: string;
    email: string | null;
  };
  ecp: {
    firstName: string | null;
    lastName: string | null;
  };
}

export async function sendPrescriptionEmail(prescription: PrescriptionEmailData): Promise<void> {
  const { client, fromEmail } = await getResendClient();

  if (!prescription.patient.email) {
    throw new Error('Patient email is required');
  }

  const { generatePrescriptionPDF } = await import('./pdfService');
  const pdfBuffer = await generatePrescriptionPDF(prescription as any);

  const ecpName = `${prescription.ecp.firstName || ""} ${prescription.ecp.lastName || ""}`.trim() || "Your Eye Care Professional";

  await client.emails.send({
    from: fromEmail,
    to: prescription.patient.email,
    subject: `Your Optical Prescription - ${prescription.patient.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #A76111;">Your Optical Prescription</h2>
        <p>Dear ${prescription.patient.name},</p>
        <p>Please find attached your optical prescription from <strong>${ecpName}</strong>.</p>
        <p>This prescription has been prepared based on your recent eye examination.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Important Notes:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
            <li>This prescription is valid for the period specified in the document</li>
            <li>Keep this prescription for your records</li>
            <li>Contact us if you have any questions or concerns</li>
          </ul>
        </div>
        <p>If you need clarification or would like to discuss your prescription, please contact our practice.</p>
        <br/>
        <p>Best regards,<br/>
        <strong>${ecpName}</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: `prescription-${prescription.id}.pdf`,
        content: pdfBuffer,
      }
    ],
  });
}

// ============================================
// NHS CLAIMS EMAIL NOTIFICATIONS
// ============================================

/**
 * Send email notification when NHS claim is submitted
 */
export async function sendNhsClaimSubmittedEmail(
  practitionerEmail: string,
  practitionerName: string,
  claimNumber: string,
  claimType: string,
  claimAmount: string,
  patientName: string
): Promise<void> {
  const { client, fromEmail } = await getResendClient();

  await client.emails.send({
    from: fromEmail,
    to: practitionerEmail,
    subject: `NHS Claim ${claimNumber} Submitted`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #A76111;">NHS Claim Submitted Successfully</h2>
        <p>Dear ${practitionerName},</p>
        <p>Your NHS claim has been successfully submitted to PCSE (Primary Care Support England).</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Claim Number:</strong> ${claimNumber}</p>
          <p style="margin: 5px 0;"><strong>Claim Type:</strong> ${claimType}</p>
          <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> £${claimAmount}</p>
        </div>
        <p>You will receive updates as the claim is processed by PCSE. The typical processing time is 14-21 days.</p>
        <br/>
        <p>Best regards,<br/>
        <strong>Integrated Lens System</strong></p>
      </div>
    `,
  });
}

/**
 * Send email notification when NHS claim is accepted
 */
export async function sendNhsClaimAcceptedEmail(
  practitionerEmail: string,
  practitionerName: string,
  claimNumber: string,
  claimType: string,
  claimAmount: string,
  patientName: string,
  pcseReference: string
): Promise<void> {
  const { client, fromEmail } = await getResendClient();

  await client.emails.send({
    from: fromEmail,
    to: practitionerEmail,
    subject: `NHS Claim ${claimNumber} Accepted ✅`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #22c55e; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: white;">Claim Accepted</h2>
        </div>
        <p>Dear ${practitionerName},</p>
        <p>Great news! Your NHS claim has been accepted by PCSE.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Claim Number:</strong> ${claimNumber}</p>
          <p style="margin: 5px 0;"><strong>PCSE Reference:</strong> ${pcseReference}</p>
          <p style="margin: 5px 0;"><strong>Claim Type:</strong> ${claimType}</p>
          <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> £${claimAmount}</p>
        </div>
        <p>Payment is typically processed within 7-14 days of acceptance.</p>
        <br/>
        <p>Best regards,<br/>
        <strong>Integrated Lens System</strong></p>
      </div>
    `,
  });
}

/**
 * Send email notification when NHS claim is rejected
 */
export async function sendNhsClaimRejectedEmail(
  practitionerEmail: string,
  practitionerName: string,
  claimNumber: string,
  claimType: string,
  patientName: string,
  rejectionReason: string
): Promise<void> {
  const { client, fromEmail } = await getResendClient();

  await client.emails.send({
    from: fromEmail,
    to: practitionerEmail,
    subject: `NHS Claim ${claimNumber} Rejected - Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ef4444; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: white;">Claim Rejected</h2>
        </div>
        <p>Dear ${practitionerName},</p>
        <p>Unfortunately, your NHS claim has been rejected by PCSE.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Claim Number:</strong> ${claimNumber}</p>
          <p style="margin: 5px 0;"><strong>Claim Type:</strong> ${claimType}</p>
          <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
        </div>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Rejection Reason:</strong></p>
          <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
        </div>
        <p>Please review the rejection reason and take appropriate action. You may need to correct the claim information and resubmit.</p>
        <p>If you have questions about this rejection, please contact PCSE or review the NHS claims guidance.</p>
        <br/>
        <p>Best regards,<br/>
        <strong>Integrated Lens System</strong></p>
      </div>
    `,
  });
}

/**
 * Send email notification when NHS claim payment is received
 */
export async function sendNhsClaimPaidEmail(
  practitionerEmail: string,
  practitionerName: string,
  claimNumber: string,
  claimType: string,
  claimAmount: string,
  patientName: string,
  pcseReference: string,
  paidAmount: string,
  paymentDate: string
): Promise<void> {
  const { client, fromEmail } = await getResendClient();

  await client.emails.send({
    from: fromEmail,
    to: practitionerEmail,
    subject: `NHS Claim ${claimNumber} Paid - £${paidAmount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #22c55e; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: white;">Payment Received</h2>
        </div>
        <p>Dear ${practitionerName},</p>
        <p>Payment has been received for your NHS claim.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Claim Number:</strong> ${claimNumber}</p>
          <p style="margin: 5px 0;"><strong>PCSE Reference:</strong> ${pcseReference}</p>
          <p style="margin: 5px 0;"><strong>Claim Type:</strong> ${claimType}</p>
          <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
          <p style="margin: 5px 0;"><strong>Claim Amount:</strong> £${claimAmount}</p>
        </div>
        <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Payment Amount:</strong> £${paidAmount}</p>
          <p style="margin: 10px 0 0 0;"><strong>Payment Date:</strong> ${paymentDate}</p>
        </div>
        <p>The payment should appear in your designated bank account within 2-3 business days.</p>
        <br/>
        <p>Best regards,<br/>
        <strong>Integrated Lens System</strong></p>
      </div>
    `,
  });
}
