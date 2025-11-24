/**
 * Excel File Security Utilities
 *
 * Security wrappers and validation for Excel file processing
 * Using exceljs library (no known vulnerabilities)
 */

import type { Workbook } from 'exceljs';
import { loggers } from './logger.js';

const logger = loggers.security;

/**
 * Security limits for Excel file processing
 */
export const EXCEL_SECURITY_LIMITS = {
  /**
   * Maximum file size in bytes (5MB - lower than multer's 10MB)
   */
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  /**
   * Maximum number of sheets
   */
  MAX_SHEETS: 10,

  /**
   * Maximum number of rows per sheet
   */
  MAX_ROWS: 10000,

  /**
   * Maximum number of columns per sheet
   */
  MAX_COLUMNS: 100,

  /**
   * Maximum total cells across all sheets
   */
  MAX_TOTAL_CELLS: 50000,

  /**
   * Maximum cell content length
   */
  MAX_CELL_LENGTH: 10000,

  /**
   * Timeout for parsing operations (ms)
   */
  PARSE_TIMEOUT: 10000,
} as const;

/**
 * Security validation error
 */
export class ExcelSecurityError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ExcelSecurityError';
  }
}

/**
 * Validate buffer before parsing
 */
export function validateExcelBuffer(buffer: Buffer): void {
  // Check file size
  if (buffer.length > EXCEL_SECURITY_LIMITS.MAX_FILE_SIZE) {
    throw new ExcelSecurityError(
      `Excel file too large: ${buffer.length} bytes (max: ${EXCEL_SECURITY_LIMITS.MAX_FILE_SIZE})`,
      'FILE_TOO_LARGE'
    );
  }

  // Check for Excel magic bytes
  const magic = buffer.slice(0, 4).toString('hex');

  // XLSX (ZIP format): 504b0304
  // XLS (OLE2 format): d0cf11e0
  if (!magic.startsWith('504b0304') && !magic.startsWith('d0cf11e0')) {
    throw new ExcelSecurityError(
      'Invalid Excel file format (magic bytes mismatch)',
      'INVALID_FORMAT'
    );
  }

  // Check for suspiciously small files (potential format confusion)
  if (buffer.length < 100) {
    throw new ExcelSecurityError(
      'Excel file too small to be valid',
      'FILE_TOO_SMALL'
    );
  }

  logger.info(
    { fileSize: buffer.length, magic },
    'Excel buffer validation passed'
  );
}

/**
 * Validate workbook structure after parsing
 */
export function validateWorkbookStructure(workbook: Workbook): void {
  // Check number of sheets
  const sheetCount = workbook.worksheets.length;
  if (sheetCount > EXCEL_SECURITY_LIMITS.MAX_SHEETS) {
    throw new ExcelSecurityError(
      `Too many sheets: ${sheetCount} (max: ${EXCEL_SECURITY_LIMITS.MAX_SHEETS})`,
      'TOO_MANY_SHEETS'
    );
  }

  let totalCells = 0;

  // Validate each sheet
  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;

    // Check for prototype pollution attempts in sheet names
    if (sheetName === '__proto__' || sheetName === 'constructor' || sheetName === 'prototype') {
      throw new ExcelSecurityError(
        `Suspicious sheet name detected: ${sheetName}`,
        'SUSPICIOUS_SHEET_NAME'
      );
    }

    const rows = worksheet.rowCount;
    const cols = worksheet.columnCount;
    const cells = rows * cols;

    // Validate dimensions
    if (rows > EXCEL_SECURITY_LIMITS.MAX_ROWS) {
      throw new ExcelSecurityError(
        `Sheet "${sheetName}" has too many rows: ${rows} (max: ${EXCEL_SECURITY_LIMITS.MAX_ROWS})`,
        'TOO_MANY_ROWS'
      );
    }

    if (cols > EXCEL_SECURITY_LIMITS.MAX_COLUMNS) {
      throw new ExcelSecurityError(
        `Sheet "${sheetName}" has too many columns: ${cols} (max: ${EXCEL_SECURITY_LIMITS.MAX_COLUMNS})`,
        'TOO_MANY_COLUMNS'
      );
    }

    totalCells += cells;

    logger.debug(
      { sheetName, rows, cols, cells },
      'Sheet dimensions validated'
    );

    // Validate cell contents
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        const value = cell.value;
        if (value && typeof value === 'string') {
          if (value.length > EXCEL_SECURITY_LIMITS.MAX_CELL_LENGTH) {
            throw new ExcelSecurityError(
              `Cell ${cell.address} content too large: ${value.length} chars (max: ${EXCEL_SECURITY_LIMITS.MAX_CELL_LENGTH})`,
              'CELL_TOO_LARGE'
            );
          }
        }
      });
    });
  }

  // Check total cell count
  if (totalCells > EXCEL_SECURITY_LIMITS.MAX_TOTAL_CELLS) {
    throw new ExcelSecurityError(
      `Total cell count too high: ${totalCells} (max: ${EXCEL_SECURITY_LIMITS.MAX_TOTAL_CELLS})`,
      'TOO_MANY_CELLS'
    );
  }

  logger.info(
    { sheetCount, totalCells },
    'Workbook structure validation passed'
  );
}

/**
 * Secure wrapper for xlsx parsing with timeout
 */
export async function parseWithTimeout<T>(
  parseFunction: () => Promise<T>,
  timeout: number = EXCEL_SECURITY_LIMITS.PARSE_TIMEOUT
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ExcelSecurityError(
          `Excel parsing timeout after ${timeout}ms (possible ReDoS attack)`,
          'PARSE_TIMEOUT'
        )
      );
    }, timeout);

    parseFunction()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Check if error is a security error
 */
export function isSecurityError(error: unknown): error is ExcelSecurityError {
  return error instanceof ExcelSecurityError;
}

/**
 * Get safe error message for client
 */
export function getSafeErrorMessage(error: unknown): string {
  if (isSecurityError(error)) {
    return error.message;
  }

  // Don't leak internal errors
  return 'Excel file processing failed due to security restrictions';
}
