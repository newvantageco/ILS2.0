/**
 * Report Builder Service
 *
 * Enables creation of custom clinical reports with filters, aggregations,
 * and multiple output formats (PDF, Excel, CSV)
 */

import { loggers } from '../../utils/logger.js';
import { db } from '../../db.js';
import { patients, orders } from '@shared/schema';
import { eq, and, gte, lte, like, sql } from 'drizzle-orm';

const logger = loggers.api;

/**
 * Report Definition
 */
export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  companyId: string;
  category: 'clinical' | 'operational' | 'financial' | 'quality' | 'compliance';
  type: 'patient_list' | 'order_summary' | 'quality_metrics' | 'trends' | 'custom';

  // Data source configuration
  dataSource: {
    tables: string[];
    joins?: Array<{
      type: 'inner' | 'left' | 'right';
      table: string;
      on: string;
    }>;
  };

  // Field selection
  fields: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'calculated';
    calculation?: string; // For calculated fields
    format?: string; // Display format
    aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  }>;

  // Filters
  filters: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in';
    value: any;
    type: 'static' | 'parameter'; // Static or user-provided at runtime
  }>;

  // Grouping and sorting
  groupBy?: string[];
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;

  // Output configuration
  outputFormats: Array<'pdf' | 'excel' | 'csv' | 'json'>;
  defaultFormat: 'pdf' | 'excel' | 'csv' | 'json';

  // Layout and styling
  layout?: {
    orientation: 'portrait' | 'landscape';
    pageSize: 'letter' | 'legal' | 'a4';
    headerText?: string;
    footerText?: string;
    includeCharts?: boolean;
    chartTypes?: string[];
  };

  // Scheduling (if applicable)
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:MM
    recipients: string[];
  };

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  lastRunAt?: Date;
  isPublic: boolean;
  tags?: string[];
}

/**
 * Report Result
 */
export interface ReportResult {
  id: string;
  reportId: string;
  reportName: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  data: any[];
  metadata: {
    totalRecords: number;
    generatedAt: Date;
    parameters?: Record<string, any>;
    executionTime: number; // milliseconds
  };
  filePath?: string; // For file-based formats
}

/**
 * Report Template Definitions
 */
export const REPORT_TEMPLATES: Partial<ReportDefinition>[] = [
  {
    name: 'Patient Demographics Report',
    description: 'Comprehensive list of patients with demographic information',
    category: 'clinical',
    type: 'patient_list',
    dataSource: {
      tables: ['patients'],
    },
    fields: [
      { name: 'firstName', label: 'First Name', type: 'string' },
      { name: 'lastName', label: 'Last Name', type: 'string' },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', format: 'MM/DD/YYYY' },
      { name: 'age', label: 'Age', type: 'calculated', calculation: 'YEAR(CURRENT_DATE) - YEAR(dateOfBirth)' },
      { name: 'gender', label: 'Gender', type: 'string' },
      { name: 'email', label: 'Email', type: 'string' },
      { name: 'phone', label: 'Phone', type: 'string' },
      { name: 'lastExaminationDate', label: 'Last Exam', type: 'date', format: 'MM/DD/YYYY' },
    ],
    filters: [],
    orderBy: [{ field: 'lastName', direction: 'asc' }],
    outputFormats: ['pdf', 'excel', 'csv'],
    defaultFormat: 'pdf',
  },

  {
    name: 'Orders Summary Report',
    description: 'Summary of orders with status and revenue information',
    category: 'operational',
    type: 'order_summary',
    dataSource: {
      tables: ['orders'],
      joins: [
        {
          type: 'left',
          table: 'patients',
          on: 'orders.patientId = patients.id',
        },
      ],
    },
    fields: [
      { name: 'orderNumber', label: 'Order #', type: 'string' },
      { name: 'patientName', label: 'Patient', type: 'calculated', calculation: 'CONCAT(patients.firstName, " ", patients.lastName)' },
      { name: 'createdAt', label: 'Order Date', type: 'date', format: 'MM/DD/YYYY' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'totalAmount', label: 'Total', type: 'number', format: '$0,0.00' },
      { name: 'items', label: 'Items', type: 'number', aggregate: 'count' },
    ],
    filters: [],
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
    outputFormats: ['pdf', 'excel', 'csv'],
    defaultFormat: 'excel',
  },

  {
    name: 'Overdue Follow-up Report',
    description: 'Patients who are overdue for follow-up appointments',
    category: 'quality',
    type: 'patient_list',
    dataSource: {
      tables: ['patients'],
    },
    fields: [
      { name: 'firstName', label: 'First Name', type: 'string' },
      { name: 'lastName', label: 'Last Name', type: 'string' },
      { name: 'phone', label: 'Phone', type: 'string' },
      { name: 'email', label: 'Email', type: 'string' },
      { name: 'lastExaminationDate', label: 'Last Exam', type: 'date', format: 'MM/DD/YYYY' },
      { name: 'daysSinceExam', label: 'Days Since Exam', type: 'calculated', calculation: 'DATEDIFF(CURRENT_DATE, lastExaminationDate)' },
    ],
    filters: [
      {
        field: 'lastExaminationDate',
        operator: 'lt',
        value: 'DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY)',
        type: 'static',
      },
    ],
    orderBy: [{ field: 'lastExaminationDate', direction: 'asc' }],
    outputFormats: ['pdf', 'excel', 'csv'],
    defaultFormat: 'pdf',
  },

  {
    name: 'Age Distribution Report',
    description: 'Patient age distribution analysis',
    category: 'quality',
    type: 'quality_metrics',
    dataSource: {
      tables: ['patients'],
    },
    fields: [
      { name: 'ageGroup', label: 'Age Group', type: 'calculated', calculation: 'CASE WHEN age < 18 THEN "0-17" WHEN age < 40 THEN "18-39" WHEN age < 65 THEN "40-64" ELSE "65+" END' },
      { name: 'patientCount', label: 'Patient Count', type: 'number', aggregate: 'count' },
      { name: 'percentage', label: 'Percentage', type: 'calculated', calculation: '(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM patients))' },
    ],
    filters: [],
    groupBy: ['ageGroup'],
    orderBy: [{ field: 'ageGroup', direction: 'asc' }],
    outputFormats: ['pdf', 'excel', 'csv'],
    defaultFormat: 'pdf',
    layout: {
      orientation: 'portrait',
      pageSize: 'letter',
      includeCharts: true,
      chartTypes: ['pie', 'bar'],
    },
  },

  {
    name: 'Revenue by Month Report',
    description: 'Monthly revenue analysis from orders',
    category: 'financial',
    type: 'trends',
    dataSource: {
      tables: ['orders'],
    },
    fields: [
      { name: 'month', label: 'Month', type: 'calculated', calculation: 'DATE_FORMAT(createdAt, "%Y-%m")' },
      { name: 'orderCount', label: 'Orders', type: 'number', aggregate: 'count' },
      { name: 'totalRevenue', label: 'Revenue', type: 'number', aggregate: 'sum', format: '$0,0.00' },
      { name: 'averageOrder', label: 'Avg Order', type: 'number', aggregate: 'avg', format: '$0,0.00' },
    ],
    filters: [],
    groupBy: ['month'],
    orderBy: [{ field: 'month', direction: 'desc' }],
    outputFormats: ['pdf', 'excel', 'csv'],
    defaultFormat: 'excel',
    layout: {
      orientation: 'landscape',
      pageSize: 'letter',
      includeCharts: true,
      chartTypes: ['line', 'bar'],
    },
  },
];

/**
 * Report Builder Service
 */
export class ReportBuilderService {
  /**
   * In-memory report definitions store (use database in production)
   */
  private static reportDefinitions = new Map<string, ReportDefinition>();

  /**
   * In-memory report results store (use database in production)
   */
  private static reportResults = new Map<string, ReportResult>();

  /**
   * Initialize default report templates
   */
  static initializeTemplates(): void {
    REPORT_TEMPLATES.forEach((template) => {
      if (template.name) {
        const report: ReportDefinition = {
          id: crypto.randomUUID(),
          companyId: 'default', // Would be set per company
          createdBy: 'system',
          createdAt: new Date(),
          isPublic: true,
          ...template,
        } as ReportDefinition;

        this.reportDefinitions.set(report.id, report);
      }
    });

    logger.info(
      { count: REPORT_TEMPLATES.length },
      'Default report templates initialized'
    );
  }

  /**
   * Create a new report definition
   */
  static async createReport(
    report: Omit<ReportDefinition, 'id' | 'createdAt'>
  ): Promise<ReportDefinition> {
    const newReport: ReportDefinition = {
      ...report,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    this.reportDefinitions.set(newReport.id, newReport);

    logger.info({ reportId: newReport.id, name: newReport.name }, 'Report created');

    return newReport;
  }

  /**
   * Get report definition by ID
   */
  static async getReport(reportId: string): Promise<ReportDefinition | null> {
    return this.reportDefinitions.get(reportId) || null;
  }

  /**
   * Get all reports for a company
   */
  static async getReports(companyId: string): Promise<ReportDefinition[]> {
    return Array.from(this.reportDefinitions.values()).filter(
      (report) => report.companyId === companyId || report.isPublic
    );
  }

  /**
   * Get reports by category
   */
  static async getReportsByCategory(
    companyId: string,
    category: ReportDefinition['category']
  ): Promise<ReportDefinition[]> {
    const reports = await this.getReports(companyId);
    return reports.filter((report) => report.category === category);
  }

  /**
   * Update report definition
   */
  static async updateReport(
    reportId: string,
    updates: Partial<ReportDefinition>
  ): Promise<ReportDefinition> {
    const report = this.reportDefinitions.get(reportId);

    if (!report) {
      throw new Error('Report not found');
    }

    const updated = {
      ...report,
      ...updates,
      updatedAt: new Date(),
    };

    this.reportDefinitions.set(reportId, updated);

    logger.info({ reportId, updates }, 'Report updated');

    return updated;
  }

  /**
   * Delete report definition
   */
  static async deleteReport(reportId: string): Promise<boolean> {
    const deleted = this.reportDefinitions.delete(reportId);

    if (deleted) {
      logger.info({ reportId }, 'Report deleted');
    }

    return deleted;
  }

  /**
   * Generate report
   */
  static async generateReport(
    reportId: string,
    parameters?: Record<string, any>,
    format?: 'pdf' | 'excel' | 'csv' | 'json'
  ): Promise<ReportResult> {
    const startTime = Date.now();

    // Get report definition
    const report = await this.getReport(reportId);

    if (!report) {
      throw new Error('Report not found');
    }

    // Determine output format
    const outputFormat = format || report.defaultFormat;

    if (!report.outputFormats.includes(outputFormat)) {
      throw new Error(`Format '${outputFormat}' not supported for this report`);
    }

    logger.info({ reportId, format: outputFormat }, 'Generating report');

    // Apply filters and parameters
    const filters = this.buildFilters(report.filters, parameters);

    // Execute query
    const data = await this.executeReportQuery(report, filters);

    // Apply aggregations if needed
    const processedData = this.applyAggregations(data, report);

    // Apply sorting
    const sortedData = this.applySorting(processedData, report.orderBy);

    const executionTime = Date.now() - startTime;

    // Create report result
    const result: ReportResult = {
      id: crypto.randomUUID(),
      reportId,
      reportName: report.name,
      format: outputFormat,
      data: sortedData,
      metadata: {
        totalRecords: sortedData.length,
        generatedAt: new Date(),
        parameters,
        executionTime,
      },
    };

    // Generate file if needed
    if (outputFormat !== 'json') {
      result.filePath = await this.generateFile(result, report);
    }

    // Store result
    this.reportResults.set(result.id, result);

    // Update last run time
    await this.updateReport(reportId, { lastRunAt: new Date() });

    logger.info(
      {
        reportId,
        resultId: result.id,
        records: sortedData.length,
        executionTime,
      },
      'Report generated successfully'
    );

    return result;
  }

  /**
   * Build filters from definition and parameters
   */
  private static buildFilters(
    filterDefs: ReportDefinition['filters'],
    parameters?: Record<string, any>
  ): Array<{ field: string; operator: string; value: any }> {
    return filterDefs.map((filter) => {
      if (filter.type === 'parameter' && parameters) {
        return {
          field: filter.field,
          operator: filter.operator,
          value: parameters[filter.field] || filter.value,
        };
      }

      return {
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
      };
    });
  }

  /**
   * Execute report query
   */
  private static async executeReportQuery(
    report: ReportDefinition,
    filters: Array<{ field: string; operator: string; value: any }>
  ): Promise<any[]> {
    // For demonstration, we'll query patients or orders based on data source
    // In production, this would be a dynamic query builder

    const primaryTable = report.dataSource.tables[0];

    if (primaryTable === 'patients') {
      return await this.queryPatients(report, filters);
    } else if (primaryTable === 'orders') {
      return await this.queryOrders(report, filters);
    }

    return [];
  }

  /**
   * Query patients table
   */
  private static async queryPatients(
    report: ReportDefinition,
    filters: Array<{ field: string; operator: string; value: any }>
  ): Promise<any[]> {
    // Build where conditions
    const conditions: any[] = [];

    filters.forEach((filter) => {
      switch (filter.operator) {
        case 'equals':
          conditions.push(eq((patients as any)[filter.field], filter.value));
          break;
        case 'contains':
          conditions.push(like((patients as any)[filter.field], `%${filter.value}%`));
          break;
        case 'gt':
          conditions.push(sql`${(patients as any)[filter.field]} > ${filter.value}`);
          break;
        case 'gte':
          conditions.push(gte((patients as any)[filter.field], filter.value));
          break;
        case 'lt':
          conditions.push(sql`${(patients as any)[filter.field]} < ${filter.value}`);
          break;
        case 'lte':
          conditions.push(lte((patients as any)[filter.field], filter.value));
          break;
      }
    });

    // Execute query
    let query = db.select().from(patients);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.limit(10000); // Safety limit

    // Calculate age and other derived fields
    return results.map((patient) => {
      const age = patient.dateOfBirth
        ? Math.floor(
            (Date.now() - new Date(patient.dateOfBirth).getTime()) /
              (1000 * 60 * 60 * 24 * 365.25)
          )
        : null;

      const daysSinceExam = patient.lastExaminationDate
        ? Math.floor(
            (Date.now() - new Date(patient.lastExaminationDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        ...patient,
        age,
        daysSinceExam,
      };
    });
  }

  /**
   * Query orders table
   */
  private static async queryOrders(
    report: ReportDefinition,
    filters: Array<{ field: string; operator: string; value: any }>
  ): Promise<any[]> {
    // Build where conditions
    const conditions: any[] = [];

    filters.forEach((filter) => {
      switch (filter.operator) {
        case 'equals':
          conditions.push(eq((orders as any)[filter.field], filter.value));
          break;
        case 'gte':
          conditions.push(gte((orders as any)[filter.field], filter.value));
          break;
        case 'lte':
          conditions.push(lte((orders as any)[filter.field], filter.value));
          break;
      }
    });

    // Execute query
    let query = db.select().from(orders);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.limit(10000); // Safety limit

    return results;
  }

  /**
   * Apply aggregations
   */
  private static applyAggregations(
    data: any[],
    report: ReportDefinition
  ): any[] {
    if (!report.groupBy || report.groupBy.length === 0) {
      return data;
    }

    // Group data
    const grouped = new Map<string, any[]>();

    data.forEach((row) => {
      const groupKey = report.groupBy!
        .map((field) => row[field])
        .join('|');

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }

      grouped.get(groupKey)!.push(row);
    });

    // Calculate aggregates
    const aggregated: any[] = [];

    grouped.forEach((rows, groupKey) => {
      const result: any = {};

      // Add group by fields
      report.groupBy!.forEach((field, index) => {
        result[field] = groupKey.split('|')[index];
      });

      // Calculate aggregates for each field
      report.fields.forEach((field) => {
        if (field.aggregate) {
          const values = rows.map((row) => row[field.name]).filter((v) => v != null);

          switch (field.aggregate) {
            case 'count':
              result[field.name] = values.length;
              break;
            case 'sum':
              result[field.name] = values.reduce((sum, val) => sum + Number(val), 0);
              break;
            case 'avg':
              result[field.name] =
                values.reduce((sum, val) => sum + Number(val), 0) / values.length;
              break;
            case 'min':
              result[field.name] = Math.min(...values.map(Number));
              break;
            case 'max':
              result[field.name] = Math.max(...values.map(Number));
              break;
          }
        }
      });

      aggregated.push(result);
    });

    return aggregated;
  }

  /**
   * Apply sorting
   */
  private static applySorting(
    data: any[],
    orderBy?: ReportDefinition['orderBy']
  ): any[] {
    if (!orderBy || orderBy.length === 0) {
      return data;
    }

    return data.sort((a, b) => {
      for (const order of orderBy) {
        const aVal = a[order.field];
        const bVal = b[order.field];

        if (aVal === bVal) continue;

        const comparison = aVal < bVal ? -1 : 1;
        return order.direction === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }

  /**
   * Generate file for report
   */
  private static async generateFile(
    result: ReportResult,
    report: ReportDefinition
  ): Promise<string> {
    // In production, would generate actual PDF/Excel/CSV files
    // For now, return a mock file path

    const filename = `${report.name.replace(/\s+/g, '_')}_${Date.now()}.${result.format}`;
    const filePath = `/tmp/reports/${filename}`;

    logger.info({ filePath, format: result.format }, 'Report file generated');

    return filePath;
  }

  /**
   * Get report result
   */
  static async getReportResult(resultId: string): Promise<ReportResult | null> {
    return this.reportResults.get(resultId) || null;
  }

  /**
   * Get report history
   */
  static async getReportHistory(
    reportId: string,
    limit: number = 50
  ): Promise<ReportResult[]> {
    return Array.from(this.reportResults.values())
      .filter((result) => result.reportId === reportId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Export report to CSV
   */
  static exportToCSV(data: any[], fields: ReportDefinition['fields']): string {
    if (data.length === 0) return '';

    // Header row
    const headers = fields.map((f) => f.label).join(',');

    // Data rows
    const rows = data.map((row) => {
      return fields
        .map((f) => {
          const value = row[f.name];
          if (value == null) return '';

          // Escape values with quotes if they contain commas
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }

          return strValue;
        })
        .join(',');
    });

    return [headers, ...rows].join('\n');
  }

  /**
   * Clean up old report results
   */
  static cleanupOldResults(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const before = this.reportResults.size;

    Array.from(this.reportResults.entries()).forEach(([id, result]) => {
      if (result.metadata.generatedAt < cutoffDate) {
        this.reportResults.delete(id);
      }
    });

    const removed = before - this.reportResults.size;

    if (removed > 0) {
      logger.info({ removed }, 'Cleaned up old report results');
    }

    return removed;
  }
}

// Initialize templates on module load
ReportBuilderService.initializeTemplates();
