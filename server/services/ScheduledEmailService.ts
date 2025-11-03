import cron, { type ScheduledTask } from 'node-cron';
import { db } from '../db';
import { prescriptions, patients, companies, users } from '../../shared/schema';
import { EmailTrackingService } from './EmailTrackingService';
import { eq, and, lte, gte, isNull, sql } from 'drizzle-orm';

export class ScheduledEmailService {
  private prescriptionReminderJob: ScheduledTask | null = null;
  private recallNotificationJob: ScheduledTask | null = null;
  private emailService: EmailTrackingService;

  constructor() {
    this.emailService = new EmailTrackingService();
  }

  /**
   * Start all scheduled email jobs
   */
  startAllJobs() {
    this.startPrescriptionReminderJob();
    this.startRecallNotificationJob();
    console.log('✅ All scheduled email jobs started');
  }

  /**
   * Stop all scheduled email jobs
   */
  stopAllJobs() {
    if (this.prescriptionReminderJob) {
      this.prescriptionReminderJob.stop();
      console.log('🛑 Prescription reminder job stopped');
    }
    if (this.recallNotificationJob) {
      this.recallNotificationJob.stop();
      console.log('🛑 Recall notification job stopped');
    }
  }

  /**
   * Start prescription reminder job
   * Runs daily at 9:00 AM to check for expiring prescriptions
   */
  startPrescriptionReminderJob() {
    // Run daily at 9:00 AM
    this.prescriptionReminderJob = cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Running prescription reminder job...');
      try {
        await this.sendPrescriptionReminders();
      } catch (error) {
        console.error('Error in prescription reminder job:', error);
      }
    });

    console.log('✅ Prescription reminder job scheduled (daily at 9:00 AM)');
  }

  /**
   * Start recall notification job
   * Runs daily at 10:00 AM to check for patients due for recall
   */
  startRecallNotificationJob() {
    // Run daily at 10:00 AM
    this.recallNotificationJob = cron.schedule('0 10 * * *', async () => {
      console.log('⏰ Running recall notification job...');
      try {
        await this.sendRecallNotifications();
      } catch (error) {
        console.error('Error in recall notification job:', error);
      }
    });

    console.log('✅ Recall notification job scheduled (daily at 10:00 AM)');
  }

  /**
   * Send prescription reminder emails
   * Finds prescriptions expiring in 30 days and sends reminders
   */
  async sendPrescriptionReminders() {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Find prescriptions expiring in approximately 30 days (28-32 day window)
    const expiringPrescriptions = await db
      .select({
        prescription: prescriptions,
        patient: patients,
        company: companies,
        prescriber: users,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(companies, eq(prescriptions.companyId, companies.id))
      .leftJoin(users, eq(prescriptions.ecpId, users.id))
      .where(
        and(
          // Expiry date between 28 and 32 days from now
          gte(prescriptions.expiryDate, sql`CURRENT_DATE + INTERVAL '28 days'`),
          lte(prescriptions.expiryDate, sql`CURRENT_DATE + INTERVAL '32 days'`),
          // Patient has email
          sql`${patients.email} IS NOT NULL AND ${patients.email} != ''`
        )
      );

    console.log(`Found ${expiringPrescriptions.length} prescriptions expiring in ~30 days`);

    let successCount = 0;
    let failureCount = 0;

    for (const record of expiringPrescriptions) {
      try {
        const { prescription, patient, company, prescriber } = record;

        if (!patient.email) continue;

        const expiryDate = prescription.expiryDate
          ? new Date(prescription.expiryDate).toLocaleDateString('en-GB')
          : 'N/A';

        const prescriberName = prescriber
          ? `${prescriber.firstName || ''} ${prescriber.lastName || ''}`.trim()
          : 'Your optometrist';

        // Generate email content
        const htmlContent = this.generatePrescriptionReminderHtml({
          patientName: patient.name,
          expiryDate,
          prescriberName,
          companyName: company.name,
          companyPhone: company.phone || '',
          prescriptionType: prescription.prescriptionType || 'prescription',
        });

        // Send email with tracking
        await this.emailService.sendEmail({
          to: patient.email,
          toName: patient.name,
          subject: `Prescription Expiry Reminder - ${expiryDate}`,
          htmlContent,
          textContent: `Your ${prescription.prescriptionType || 'prescription'} will expire on ${expiryDate}. Please contact us to schedule an eye examination.`,
          emailType: 'prescription_reminder',
          companyId: company.id,
          sentBy: 'system',
          patientId: patient.id,
          relatedEntityType: 'prescription',
          relatedEntityId: prescription.id,
          metadata: {
            prescriptionId: prescription.id,
            patientId: patient.id,
            expiryDate: prescription.expiryDate,
          },
        });

        successCount++;
        console.log(`✅ Sent prescription reminder to ${patient.email}`);
      } catch (error) {
        failureCount++;
        console.error(`❌ Failed to send reminder for prescription ${record.prescription.id}:`, error);
      }
    }

    console.log(`📧 Prescription reminders sent: ${successCount} success, ${failureCount} failed`);
    return { successCount, failureCount, totalFound: expiringPrescriptions.length };
  }

  /**
   * Send recall notification emails
   * Finds patients due for annual eye examination (6-12 months since last exam)
   */
  async sendRecallNotifications() {
    // Find patients whose last prescription was issued 11-13 months ago (targeting 12-month recall)
    const patientsForRecall = await db
      .select({
        patient: patients,
        company: companies,
        lastPrescription: {
          id: prescriptions.id,
          issueDate: prescriptions.issueDate,
          ecpId: prescriptions.ecpId,
        },
      })
      .from(patients)
      .innerJoin(companies, eq(patients.companyId, companies.id))
      .innerJoin(
        prescriptions,
        and(
          eq(prescriptions.patientId, patients.id),
          // Get most recent prescription per patient
          sql`${prescriptions.issueDate} = (
            SELECT MAX(issue_date) 
            FROM ${prescriptions} p2 
            WHERE p2.patient_id = ${patients.id}
          )`
        )
      )
      .where(
        and(
          // Last prescription issued 11-13 months ago
          gte(prescriptions.issueDate, sql`CURRENT_DATE - INTERVAL '13 months'`),
          lte(prescriptions.issueDate, sql`CURRENT_DATE - INTERVAL '11 months'`),
          // Patient has email
          sql`${patients.email} IS NOT NULL AND ${patients.email} != ''`
        )
      );

    console.log(`Found ${patientsForRecall.length} patients due for recall`);

    let successCount = 0;
    let failureCount = 0;

    for (const record of patientsForRecall) {
      try {
        const { patient, company, lastPrescription } = record;

        if (!patient.email) continue;

        const lastVisitDate = lastPrescription.issueDate
          ? new Date(lastPrescription.issueDate).toLocaleDateString('en-GB')
          : 'N/A';

        // Generate email content
        const htmlContent = this.generateRecallNotificationHtml({
          patientName: patient.name,
          lastVisitDate,
          companyName: company.name,
          companyPhone: company.phone || '',
          companyEmail: company.email || '',
        });

        // Send email with tracking
        await this.emailService.sendEmail({
          to: patient.email,
          toName: patient.name,
          subject: `Time for Your Annual Eye Examination - ${company.name}`,
          htmlContent,
          textContent: `It's been a year since your last eye examination. Regular eye tests are important for maintaining good eye health. Please contact us to schedule an appointment.`,
          emailType: 'recall_notification',
          companyId: company.id,
          sentBy: 'system',
          patientId: patient.id,
          relatedEntityType: 'patient',
          relatedEntityId: patient.id,
          metadata: {
            patientId: patient.id,
            lastPrescriptionId: lastPrescription.id,
            lastVisitDate: lastPrescription.issueDate,
          },
        });

        successCount++;
        console.log(`✅ Sent recall notification to ${patient.email}`);
      } catch (error) {
        failureCount++;
        console.error(`❌ Failed to send recall for patient ${record.patient.id}:`, error);
      }
    }

    console.log(`📧 Recall notifications sent: ${successCount} success, ${failureCount} failed`);
    return { successCount, failureCount, totalFound: patientsForRecall.length };
  }

  /**
   * Generate HTML for prescription reminder email
   */
  private generatePrescriptionReminderHtml(data: {
    patientName: string;
    expiryDate: string;
    prescriberName: string;
    companyName: string;
    companyPhone: string;
    prescriptionType: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription Expiry Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">Prescription Expiry Reminder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Dear ${data.patientName},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                This is a friendly reminder that your <strong>${data.prescriptionType}</strong> will expire on <strong>${data.expiryDate}</strong>.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">
                  <strong>Why is this important?</strong><br>
                  Regular eye examinations are essential for maintaining good eye health and ensuring your prescription is up to date. Early detection of eye conditions can help preserve your vision.
                </p>
              </div>
              
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                We recommend scheduling an appointment before your prescription expires to ensure uninterrupted care.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="tel:${data.companyPhone}" style="display: inline-block; background-color: #667eea; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Call to Book: ${data.companyPhone}
                </a>
              </div>
              
              <p style="margin: 30px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                Best regards,<br>
                <strong>${data.prescriberName}</strong><br>
                ${data.companyName}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.4;">
                This is an automated reminder from ${data.companyName}<br>
                Please do not reply to this email. Contact us at ${data.companyPhone}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Generate HTML for recall notification email
   */
  private generateRecallNotificationHtml(data: {
    patientName: string;
    lastVisitDate: string;
    companyName: string;
    companyPhone: string;
    companyEmail: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eye Examination Recall</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">Time for Your Eye Examination</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Dear ${data.patientName},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                It's been about a year since your last eye examination on <strong>${data.lastVisitDate}</strong>. We'd love to see you again!
              </p>
              
              <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 18px;">Why Annual Eye Tests Matter</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Detect changes in your vision early</li>
                  <li>Monitor eye health and prevent problems</li>
                  <li>Update your prescription if needed</li>
                  <li>Screen for eye diseases like glaucoma and cataracts</li>
                  <li>Check for signs of health conditions like diabetes</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Book your next eye examination with us today. Our friendly team is ready to help maintain your eye health.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="tel:${data.companyPhone}" style="display: inline-block; background-color: #667eea; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: 600; margin: 0 5px 10px 5px;">
                  📞 Call: ${data.companyPhone}
                </a>
                ${data.companyEmail ? `
                <a href="mailto:${data.companyEmail}" style="display: inline-block; background-color: #4caf50; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: 600; margin: 0 5px 10px 5px;">
                  ✉️ Email Us
                </a>
                ` : ''}
              </div>
              
              <p style="margin: 30px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                We look forward to seeing you soon!<br>
                <strong>${data.companyName}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.4;">
                This is an automated recall reminder from ${data.companyName}<br>
                Phone: ${data.companyPhone}${data.companyEmail ? ` | Email: ${data.companyEmail}` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Manual trigger for testing - send prescription reminders now
   */
  async triggerPrescriptionRemindersNow() {
    console.log('🔧 Manual trigger: Prescription reminders');
    return await this.sendPrescriptionReminders();
  }

  /**
   * Manual trigger for testing - send recall notifications now
   */
  async triggerRecallNotificationsNow() {
    console.log('🔧 Manual trigger: Recall notifications');
    return await this.sendRecallNotifications();
  }
}

// Export singleton instance
export const scheduledEmailService = new ScheduledEmailService();
