/**
 * Data Import Parsers
 *
 * Utilities for parsing CSV and Excel files for data import
 */

import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import { Readable } from 'stream';
import type { ValidationResult } from '../validation/import.js';
import {
  validateExcelBuffer,
  validateWorkbookStructure,
  parseWithTimeout,
  isSecurityError,
  getSafeErrorMessage,
} from './excel-security.js';
import { loggers } from './logger.js';

const logger = loggers.api;

/**
 * Parser Options
 */
export interface ParserOptions {
  /**
   * Delimiter for CSV files (default: ',')
   */
  delimiter?: string;

  /**
   * Skip first N rows (default: 0)
   */
  skipRows?: number;

  /**
   * Header row index (default: 0, set to -1 if no header)
   */
  headerRow?: number;

  /**
   * Column mapping: { 'File Column Name': 'Target Field Name' }
   */
  columnMapping?: Record<string, string>;

  /**
   * Sheet name for Excel files (default: first sheet)
   */
  sheetName?: string;

  /**
   * Max rows to parse (default: unlimited)
   */
  maxRows?: number;

  /**
   * Trim whitespace from values (default: true)
   */
  trim?: boolean;

  /**
   * Convert empty strings to null (default: true)
   */
  emptyToNull?: boolean;
}

/**
 * Parse Result
 */
export interface ParseResult<T = Record<string, any>> {
  /**
   * Parsed records
   */
  records: T[];

  /**
   * Headers found in the file
   */
  headers: string[];

  /**
   * Total rows in file (including header)
   */
  totalRows: number;

  /**
   * Parse errors
   */
  errors: Array<{
    row: number;
    message: string;
    data?: any;
  }>;

  /**
   * Parse warnings
   */
  warnings: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
}

/**
 * CSV Parser
 */
export class CSVParser {
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = {
      delimiter: ',',
      skipRows: 0,
      headerRow: 0,
      trim: true,
      emptyToNull: true,
      ...options,
    };
  }

  /**
   * Parse CSV from file path
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    const stream = createReadStream(filePath);
    return this.parseStream(stream);
  }

  /**
   * Parse CSV from buffer
   */
  parseBuffer(buffer: Buffer): ParseResult {
    const content = buffer.toString('utf-8');
    return this.parseString(content);
  }

  /**
   * Parse CSV from string
   */
  parseString(content: string): ParseResult {
    const errors: ParseResult['errors'] = [];
    const warnings: ParseResult['warnings'] = [];

    try {
      const rawRecords = parse(content, {
        delimiter: this.options.delimiter,
        skip_empty_lines: true,
        trim: this.options.trim,
        from_line: (this.options.skipRows || 0) + 1,
        relax_column_count: true,
        on_record: (record, context) => {
          // Validate record length
          // Note: CastingContext doesn't have columns property, skipping validation
          return record;
        },
      });

      if (rawRecords.length === 0) {
        return {
          records: [],
          headers: [],
          totalRows: 0,
          errors: [],
          warnings: [],
        };
      }

      // Extract headers
      let headers: string[];
      let dataRows: any[];

      if (this.options.headerRow !== -1) {
        headers = rawRecords[0];
        dataRows = rawRecords.slice(1);
      } else {
        // Generate column headers: Column1, Column2, etc.
        headers = rawRecords[0].map((_: any, i: number) => `Column${i + 1}`);
        dataRows = rawRecords;
      }

      // Apply column mapping if provided
      if (this.options.columnMapping) {
        headers = headers.map(
          (h) => this.options.columnMapping?.[h] || h
        );
      }

      // Convert rows to objects
      const records = dataRows
        .slice(0, this.options.maxRows)
        .map((row, index) => {
          const record: Record<string, any> = {};

          headers.forEach((header, colIndex) => {
            let value = row[colIndex];

            // Apply transformations
            if (this.options.trim && typeof value === 'string') {
              value = value.trim();
            }

            if (this.options.emptyToNull && value === '') {
              value = null;
            }

            record[header] = value;
          });

          return record;
        });

      return {
        records,
        headers,
        totalRows: rawRecords.length,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push({
        row: 0,
        message: error instanceof Error ? error.message : 'Unknown parse error',
      });

      return {
        records: [],
        headers: [],
        totalRows: 0,
        errors,
        warnings,
      };
    }
  }

  /**
   * Parse CSV from stream
   */
  async parseStream(stream: Readable): Promise<ParseResult> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(this.parseBuffer(buffer));
      });
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }
}

/**
 * Excel Parser (using exceljs - no known vulnerabilities)
 */
export class ExcelParser {
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = {
      skipRows: 0,
      headerRow: 0,
      trim: true,
      emptyToNull: true,
      ...options,
    };
  }

  /**
   * Parse Excel from file path
   * @throws {ExcelSecurityError} If file fails security validation
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    try {
      // Read file to buffer for security validation
      const buffer = await readFile(filePath);

      // Validate buffer before parsing
      validateExcelBuffer(buffer);

      // Parse with timeout protection
      const workbook = await parseWithTimeout(async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        return wb;
      });

      // Validate workbook structure
      validateWorkbookStructure(workbook);

      return this.parseWorkbook(workbook);
    } catch (error) {
      logger.error(
        { error, filePath },
        'Excel file parsing failed with security error'
      );

      if (isSecurityError(error)) {
        return {
          records: [],
          headers: [],
          totalRows: 0,
          errors: [
            {
              row: 0,
              message: getSafeErrorMessage(error),
            },
          ],
          warnings: [],
        };
      }

      throw error;
    }
  }

  /**
   * Parse Excel from buffer
   * @throws {ExcelSecurityError} If buffer fails security validation
   */
  async parseBuffer(buffer: Buffer): Promise<ParseResult> {
    try {
      // Validate buffer before parsing
      validateExcelBuffer(buffer);

      // Parse with timeout protection
      const workbook = await parseWithTimeout(async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        return wb;
      });

      // Validate workbook structure
      validateWorkbookStructure(workbook);

      return this.parseWorkbook(workbook);
    } catch (error) {
      logger.error({ error }, 'Excel buffer parsing failed with security error');

      if (isSecurityError(error)) {
        return {
          records: [],
          headers: [],
          totalRows: 0,
          errors: [
            {
              row: 0,
              message: getSafeErrorMessage(error),
            },
          ],
          warnings: [],
        };
      }

      throw error;
    }
  }

  /**
   * Parse Excel workbook
   */
  private parseWorkbook(workbook: ExcelJS.Workbook): ParseResult {
    const errors: ParseResult['errors'] = [];
    const warnings: ParseResult['warnings'] = [];

    // Get sheet
    let worksheet: ExcelJS.Worksheet | undefined;

    if (this.options.sheetName) {
      worksheet = workbook.getWorksheet(this.options.sheetName);
    } else {
      worksheet = workbook.worksheets[0];
    }

    if (!worksheet) {
      const sheetName = this.options.sheetName || 'first sheet';
      errors.push({
        row: 0,
        message: `Sheet '${sheetName}' not found`,
      });

      return {
        records: [],
        headers: [],
        totalRows: 0,
        errors,
        warnings,
      };
    }

    // Convert worksheet to raw data array
    const rawData: any[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowValues: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // Pad with nulls if needed
        while (rowValues.length < colNumber - 1) {
          rowValues.push(null);
        }
        rowValues.push(this.getCellValue(cell));
      });
      rawData.push(rowValues);
    });

    if (rawData.length === 0) {
      return {
        records: [],
        headers: [],
        totalRows: 0,
        errors: [],
        warnings: [],
      };
    }

    // Skip rows
    const dataAfterSkip = rawData.slice(this.options.skipRows || 0);

    // Extract headers
    let headers: string[];
    let dataRows: any[][];

    if (this.options.headerRow !== -1) {
      headers = dataAfterSkip[0].map((h: any) =>
        h != null ? String(h) : ''
      );
      dataRows = dataAfterSkip.slice(1);
    } else {
      headers = dataAfterSkip[0].map(
        (_: any, i: number) => `Column${i + 1}`
      );
      dataRows = dataAfterSkip;
    }

    // Apply column mapping if provided
    if (this.options.columnMapping) {
      headers = headers.map(
        (h) => this.options.columnMapping?.[h] || h
      );
    }

    // Validate headers
    const emptyHeaders = headers
      .map((h, i) => ({ header: h, index: i }))
      .filter((h) => !h.header);

    if (emptyHeaders.length > 0) {
      emptyHeaders.forEach((h) => {
        warnings.push({
          row: (this.options.skipRows || 0) + 1,
          message: `Empty header at column ${h.index + 1}`,
        });
      });
    }

    // Convert rows to objects
    const records = dataRows
      .slice(0, this.options.maxRows)
      .map((row, rowIndex) => {
        const record: Record<string, any> = {};

        headers.forEach((header, colIndex) => {
          let value = row[colIndex];

          // Apply transformations
          if (this.options.trim && typeof value === 'string') {
            value = value.trim();
          }

          if (this.options.emptyToNull && value === '') {
            value = null;
          }

          // Convert dates to ISO strings
          if (value instanceof Date && header.toLowerCase().includes('date')) {
            value = value.toISOString().split('T')[0];
          }

          record[header] = value;
        });

        return record;
      });

    return {
      records,
      headers,
      totalRows: rawData.length,
      errors,
      warnings,
    };
  }

  /**
   * Get cell value, handling different cell types
   */
  private getCellValue(cell: ExcelJS.Cell): any {
    const value = cell.value;

    if (value === null || value === undefined) {
      return null;
    }

    // Handle rich text
    if (typeof value === 'object' && 'richText' in value) {
      return value.richText.map((rt: any) => rt.text).join('');
    }

    // Handle formulas (return result)
    if (typeof value === 'object' && 'result' in value) {
      return value.result;
    }

    // Handle hyperlinks
    if (typeof value === 'object' && 'hyperlink' in value) {
      return (value as any).text || (value as any).hyperlink;
    }

    // Handle dates
    if (value instanceof Date) {
      return value;
    }

    return value;
  }

  /**
   * Get sheet names from file
   * @throws {ExcelSecurityError} If file fails security validation
   */
  static async getSheetNames(filePath: string): Promise<string[]> {
    try {
      const buffer = await readFile(filePath);
      validateExcelBuffer(buffer);

      const workbook = await parseWithTimeout(async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        return wb;
      });

      validateWorkbookStructure(workbook);

      return workbook.worksheets.map(ws => ws.name);
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to get sheet names');
      throw error;
    }
  }

  /**
   * Get sheet names from buffer
   * @throws {ExcelSecurityError} If buffer fails security validation
   */
  static async getSheetNamesFromBuffer(buffer: Buffer): Promise<string[]> {
    try {
      validateExcelBuffer(buffer);

      const workbook = await parseWithTimeout(async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        return wb;
      });

      validateWorkbookStructure(workbook);

      return workbook.worksheets.map(ws => ws.name);
    } catch (error) {
      logger.error({ error }, 'Failed to get sheet names from buffer');
      throw error;
    }
  }
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseImportFile(
  filePathOrBuffer: string | Buffer,
  options: ParserOptions = {}
): Promise<ParseResult> {
  let fileExtension: string;
  let parser: CSVParser | ExcelParser;

  if (typeof filePathOrBuffer === 'string') {
    fileExtension = filePathOrBuffer.split('.').pop()?.toLowerCase() || '';

    if (fileExtension === 'csv') {
      parser = new CSVParser(options);
      return parser.parseFile(filePathOrBuffer);
    } else if (['xlsx', 'xls', 'xlsm'].includes(fileExtension)) {
      parser = new ExcelParser(options);
      return parser.parseFile(filePathOrBuffer);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  } else {
    // Try to detect from buffer magic bytes
    const magic = filePathOrBuffer.slice(0, 4).toString('hex');

    // Excel magic bytes
    if (magic.startsWith('504b0304') || magic.startsWith('d0cf11e0')) {
      parser = new ExcelParser(options);
      return parser.parseBuffer(filePathOrBuffer);
    }

    // Assume CSV for everything else
    parser = new CSVParser(options);
    return parser.parseBuffer(filePathOrBuffer);
  }
}

/**
 * Validate parsed data
 */
export function validateParsedData<T>(
  parseResult: ParseResult<T>,
  validator: (record: T) => ValidationResult
): ValidationResult {
  const allErrors: ValidationResult['errors'] = [];
  const allWarnings: ValidationResult['warnings'] = [];

  // Add parse errors
  parseResult.errors.forEach((error) => {
    allErrors.push({
      row: error.row,
      field: 'parse',
      message: error.message,
    });
  });

  // Add parse warnings
  parseResult.warnings.forEach((warning) => {
    allWarnings.push({
      row: warning.row,
      field: 'parse',
      message: warning.message,
    });
  });

  // Validate each record
  parseResult.records.forEach((record, index) => {
    const result = validator(record as T);

    result.errors.forEach((error) => {
      allErrors.push({
        ...error,
        row: index + 1, // +1 for header row
      });
    });

    result.warnings?.forEach((warning) => {
      allWarnings.push({
        ...warning,
        row: index + 1,
      });
    });
  });

  const validRows = parseResult.records.length - new Set(allErrors.map((e) => e.row)).size;

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    summary: {
      totalRows: parseResult.totalRows,
      validRows,
      invalidRows: parseResult.records.length - validRows,
      warningRows: new Set(allWarnings.map((w) => w.row)).size,
    },
  };
}

/**
 * Sample rows from parsed data for preview
 */
export function sampleParsedData<T>(
  parseResult: ParseResult<T>,
  sampleSize: number = 10
): ParseResult<T> {
  return {
    ...parseResult,
    records: parseResult.records.slice(0, sampleSize),
  };
}
