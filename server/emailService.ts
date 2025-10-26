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
  pdfBuffer: Buffer
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
