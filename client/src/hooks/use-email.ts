import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  emailType: string;
  patientId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

interface SendTemplateEmailOptions {
  templateId: string;
  to: string;
  toName?: string;
  variables: Record<string, any>;
  patientId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

export function useEmail() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const sendEmail = async (options: SendEmailOptions) => {
    setSending(true);
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      const result = await response.json();
      
      toast({
        title: "Email Sent",
        description: `Email sent successfully to ${options.to}`,
      });

      return result;
    } catch (error: unknown) {
      toast({
        title: "Email Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSending(false);
    }
  };

  const sendTemplateEmail = async (options: SendTemplateEmailOptions) => {
    setSending(true);
    try {
      const response = await fetch('/api/emails/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      const result = await response.json();
      
      toast({
        title: "Email Sent",
        description: `Email sent successfully to ${options.to}`,
      });

      return result;
    } catch (error: unknown) {
      toast({
        title: "Email Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSending(false);
    }
  };

  const generateInvoiceHtml = (transaction: any, customer: any, items: any[]) => {
    const total = items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0);
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${transaction.transactionNumber || transaction.id}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-box { background: #f8f9fa; padding: 15px; border-radius: 6px; }
    .info-box strong { display: block; margin-bottom: 5px; color: #667eea; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #667eea; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
    tr:last-child td { border-bottom: none; }
    .total-row { font-weight: bold; font-size: 18px; background: #f8f9fa; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #666; font-size: 14px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Invoice</h1>
    <p>Transaction #${transaction.transactionNumber || transaction.id}</p>
    <p>${date}</p>
  </div>

  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="info-grid">
      <div class="info-box">
        <strong>Name</strong>
        ${customer.name}
      </div>
      <div class="info-box">
        <strong>Email</strong>
        ${customer.email}
      </div>
      <div class="info-box">
        <strong>Phone</strong>
        ${customer.phone || 'N/A'}
      </div>
      <div class="info-box">
        <strong>Customer ID</strong>
        ${customer.customerNumber || customer.id}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.productName || 'Product'}</td>
            <td>${item.quantity}</td>
            <td>$${parseFloat(item.unitPrice).toFixed(2)}</td>
            <td>$${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">Total Amount</td>
          <td>$${total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${transaction.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <div class="info-box">
      ${transaction.notes}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>If you have any questions about this invoice, please contact us.</p>
  </div>
</body>
</html>
    `.trim();
  };

  return {
    sendEmail,
    sendTemplateEmail,
    generateInvoiceHtml,
    sending,
  };
}
