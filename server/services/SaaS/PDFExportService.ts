/**
 * PDF Export Service
 * 
 * Generates branded PDF reports for SaaS metrics:
 * - Executive summary reports
 * - Board-level strategic reports
 * - Detailed customer analytics
 * - Revenue forecasts with charts
 */

import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

interface PDFReportOptions {
  title: string;
  subtitle?: string;
  companyName: string;
  generatedDate: string;
  logoUrl?: string;
}

interface MetricsData {
  mrr: number;
  arr: number;
  nrr: number;
  cac: number;
  ltv: number;
  churnRate: number;
  trends?: {
    mrrGrowth: number;
    arrGrowth: number;
  };
}

export class PDFExportService {
  /**
   * Generate executive report PDF
   */
  static async generateExecutiveReportPDF(
    metrics: MetricsData,
    health: any,
    churnRisks: any[],
    opportunities: string[],
    options: PDFReportOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        const stream = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
          },
        });

        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on('error', reject);
        doc.pipe(stream);

        // Header
        this.addHeader(doc, options);

        // Title & Date
        doc.fontSize(24).font('Helvetica-Bold').text(options.title, { align: 'center' });
        if (options.subtitle) {
          doc.fontSize(14).font('Helvetica').text(options.subtitle, {
            align: 'center',
          });
        }
        doc.moveDown(0.5);
        doc.fontSize(10).text('Generated: ' + options.generatedDate, { align: 'center' });
        doc.moveDown(2);

        // Key Metrics Section
        this.addKeyMetricsSection(doc, metrics);

        // Health Distribution Section
        this.addHealthSection(doc, health);

        // Churn Risks Section
        if (churnRisks.length > 0) {
          this.addChurnRisksSection(doc, churnRisks.slice(0, 5));
        }

        // Opportunities Section
        if (opportunities.length > 0) {
          this.addOpportunitiesSection(doc, opportunities);
        }

        // Footer
        this.addFooter(doc, options);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate board report PDF
   */
  static async generateBoardReportPDF(
    metrics: MetricsData,
    executiveSummary: string,
    outlook: any,
    risks: any[],
    opportunities: any[],
    options: PDFReportOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        const stream = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
          },
        });

        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on('error', reject);
        doc.pipe(stream);

        // Header
        this.addHeader(doc, options);

        // Title
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .text('BOARD REPORT', { align: 'center' });
        doc
          .fontSize(16)
          .font('Helvetica')
          .text(options.title, { align: 'center' });
        doc.moveDown(2);

        // Executive Summary
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('EXECUTIVE SUMMARY', { underline: true });
        doc.fontSize(11).font('Helvetica').text(executiveSummary);
        doc.moveDown(1.5);

        // Key Metrics
        this.addKeyMetricsSection(doc, metrics);

        // Outlook
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('FINANCIAL OUTLOOK', { underline: true });
        doc.fontSize(11).font('Helvetica');
        doc.text('Next Month Forecast: £' + (outlook.nextMonthForecast / 1000).toFixed(1) + 'k');
        doc.text('Next Quarter Forecast: £' + (outlook.nextQuarterForecast / 1000).toFixed(1) + 'k');
        doc.text('Annual Forecast: £' + (outlook.annualForecast / 1000).toFixed(1) + 'k');
        doc.moveDown(1.5);

        // Risks
        if (risks.length > 0) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('STRATEGIC RISKS', { underline: true });
          risks.slice(0, 3).forEach((risk: any) => {
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .text('• ' + risk.risk, { indent: 20 });
            doc.fontSize(9).font('Helvetica').text('Probability: ' + risk.probability, { indent: 40 });
            doc.text('Mitigation: ' + risk.mitigation, { indent: 40 });
          });
          doc.moveDown(1.5);
        }

        // Opportunities
        if (opportunities.length > 0) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('STRATEGIC OPPORTUNITIES', { underline: true });
          opportunities.slice(0, 3).forEach((opp: any) => {
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .text('• ' + opp.opportunity, { indent: 20 });
            doc.fontSize(9).font('Helvetica').text('Potential: ' + opp.potential, { indent: 40 });
            doc.text('Timeline: ' + opp.timeline, { indent: 40 });
          });
        }

        // Footer
        this.addFooter(doc, options);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate detailed analytics PDF
   */
  static async generateDetailedAnalyticsPDF(
    customerMetrics: any[],
    cohortPerformance: any[],
    revenueBreakdown: any,
    options: PDFReportOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        const stream = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
          },
        });

        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on('error', reject);
        doc.pipe(stream);

        // Header
        this.addHeader(doc, options);

        // Title
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('DETAILED ANALYTICS REPORT', { align: 'center' });
        doc.moveDown(1.5);

        // Revenue Breakdown
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('REVENUE BREAKDOWN', { underline: true });
        doc
          .fontSize(11)
          .font('Helvetica')
          .text('New Customer Revenue: £' + (revenueBreakdown.newCustomers / 1000).toFixed(1) + 'k');
        doc.text('Expansion Revenue: £' + (revenueBreakdown.expansion / 1000).toFixed(1) + 'k');
        doc.text('Churn Revenue: £' + (revenueBreakdown.churn / 1000).toFixed(1) + 'k');
        doc.text('Total Revenue: £' + (revenueBreakdown.total / 1000).toFixed(1) + 'k');
        doc.moveDown(1.5);

        // Top Customers Table
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('TOP CUSTOMERS BY MRR', { underline: true });

        const sortedCustomers = [...customerMetrics]
          .sort((a: any, b: any) => b.mrr - a.mrr)
          .slice(0, 10);

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Customer ID', 50, doc.y, { width: 120 });
        doc.text('MRR', 170, doc.y - 11, { width: 60 });
        doc.text('Health', 230, doc.y - 11, { width: 60 });
        doc.text('Churn Risk', 280, doc.y - 11, { width: 60 });

        doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(0.5);

        doc.fontSize(9).font('Helvetica');
        sortedCustomers.forEach((customer: any) => {
          doc.text(customer.customerId.substring(0, 20), 50, doc.y, { width: 120 });
          doc.text('£' + (customer.mrr / 1000).toFixed(1) + 'k', 170, doc.y - 11, { width: 60 });
          doc.text(Math.round(customer.healthScore).toString(), 230, doc.y - 11, { width: 60 });
          doc.text((customer.churnProbability * 100).toFixed(0) + '%', 280, doc.y - 11, {
            width: 60,
          });
          doc.moveDown(0.5);
        });

        // Cohort Performance
        doc.moveDown(1);
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('COHORT PERFORMANCE', { underline: true });

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Cohort', 50, doc.y, { width: 100 });
        doc.text('Retention', 150, doc.y - 11, { width: 80 });
        doc.text('Expansion', 230, doc.y - 11, { width: 80 });
        doc.text('Churn', 310, doc.y - 11, { width: 80 });

        doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(0.5);

        doc.fontSize(9).font('Helvetica');
        cohortPerformance.slice(0, 8).forEach((cohort: any) => {
          const cohortLabel = 'Month ' + (cohort.month || cohort.cohort);
          doc.text(cohortLabel, 50, doc.y, { width: 100 });
          doc.text(cohort.retention.toFixed(0) + '%', 150, doc.y - 11, { width: 80 });
          doc.text(cohort.expansion.toFixed(0) + '%', 230, doc.y - 11, { width: 80 });
          doc.text(cohort.churn.toFixed(0) + '%', 310, doc.y - 11, { width: 80 });
          doc.moveDown(0.5);
        });

        // Footer
        this.addFooter(doc, options);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header with branding
   */
  private static addHeader(doc: any, options: PDFReportOptions) {
    // Add border
    doc.rect(40, 40, 515, 30).stroke();

    // Company name and branding
    doc.fontSize(14).font('Helvetica-Bold').text(options.companyName, 50, 50);

    // Report type badge
    doc
      .fontSize(9)
      .font('Helvetica')
      .text('SaaS METRICS REPORT', 450, 50, { align: 'right' });

    doc.moveDown(2);
  }

  /**
   * Add key metrics section
   */
  private static addKeyMetricsSection(doc: any, metrics: MetricsData) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('KEY PERFORMANCE INDICATORS', { underline: true });
    doc.moveDown(0.5);

    // Metrics grid (2x3)
    const metricsArray = [
      { label: 'Monthly Recurring Revenue', value: '£' + (metrics.mrr / 1000).toFixed(1) + 'k' },
      { label: 'Annual Recurring Revenue', value: '£' + (metrics.arr / 1000).toFixed(1) + 'k' },
      { label: 'Net Revenue Retention', value: metrics.nrr.toFixed(1) + '%' },
      { label: 'Customer Acquisition Cost', value: '£' + metrics.cac.toFixed(0) },
      { label: 'Customer Lifetime Value', value: '£' + (metrics.ltv / 1000).toFixed(1) + 'k' },
      { label: 'Monthly Churn Rate', value: (metrics.churnRate * 100).toFixed(2) + '%' },
    ];

    doc.fontSize(10).font('Helvetica');
    metricsArray.forEach((metric, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? 50 : 300;
      const y = doc.y + row * 35;

      doc.text(metric.label, x, y, { width: 200 });
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(metric.value, x, y + 15);
      doc.fontSize(10).font('Helvetica');
    });

    if (metrics.trends) {
      doc.moveDown(2.5);
      doc.fontSize(9).text(`MoM Growth: ${metrics.trends.mrrGrowth.toFixed(1)}%`, 50);
    }

    doc.moveDown(2);
  }

  /**
   * Add health section
   */
  private static addHealthSection(doc: any, health: any) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('CUSTOMER HEALTH DISTRIBUTION', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    doc.text('Excellent: ' + (health.excellent || 0) + ' customers');
    doc.text('Good: ' + (health.good || 0) + ' customers');
    doc.text('At Risk: ' + (health.at_risk || 0) + ' customers');
    doc.text('Critical: ' + (health.critical || 0) + ' customers');

    const total = (health.excellent || 0) + (health.good || 0) + (health.at_risk || 0) + (health.critical || 0);
    if (total > 0) {
      doc.moveDown(0.5);
      const healthyPct = (((health.excellent || 0) + (health.good || 0)) / total) * 100;
      doc.fontSize(9).text('Healthy Customers: ' + healthyPct.toFixed(1) + '%');
    }

    doc.moveDown(1.5);
  }

  /**
   * Add churn risks section
   */
  private static addChurnRisksSection(doc: any, churnRisks: any[]) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('AT-RISK CUSTOMERS', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica');
    churnRisks.forEach((risk: any, index: number) => {
      const riskNum = index + 1;
      doc
        .font('Helvetica-Bold')
        .text(riskNum + '. ' + risk.companyId, 50, doc.y, { width: 300 });
      doc
        .font('Helvetica')
        .text('Churn Probability: ' + (risk.probability * 100).toFixed(0) + '%', 70, doc.y, { width: 300 });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  /**
   * Add opportunities section
   */
  private static addOpportunitiesSection(doc: any, opportunities: string[]) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('STRATEGIC OPPORTUNITIES', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    opportunities.forEach((opp: string) => {
      doc.text('• ' + opp, { indent: 20 });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  /**
   * Add footer
   */
  private static addFooter(doc: any, options: PDFReportOptions) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      const pageNum = i + 1;
      const text = 'Page ' + pageNum + ' of ' + pageCount;
      doc.fontSize(9).font('Helvetica').text(text, 50, doc.page.height - 50, { align: 'center' });
      doc.text('© ILS 2.0 - Confidential', 50, doc.page.height - 30, {
        align: 'center',
      });
    }
  }
}
