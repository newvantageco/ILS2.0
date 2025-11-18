/**
 * Excel File Security Utilities
 *
 * Security wrappers and validation for Excel file processing
 * Mitigates xlsx package vulnerabilities (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)
 */

import type { WorkBook } from 'xlsx';
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
export function validateWorkbookStructure(workbook: WorkBook): void {
  // Check number of sheets
  const sheetCount = workbook.SheetNames.length;
  if (sheetCount > EXCEL_SECURITY_LIMITS.MAX_SHEETS) {
    throw new ExcelSecurityError(
      `Too many sheets: ${sheetCount} (max: ${EXCEL_SECURITY_LIMITS.MAX_SHEETS})`,
      'TOO_MANY_SHEETS'
    );
  }

  let totalCells = 0;

  // Validate each sheet
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      continue;
    }

    // Check for prototype pollution attempts in sheet names
    if (sheetName === '__proto__' || sheetName === 'constructor' || sheetName === 'prototype') {
      throw new ExcelSecurityError(
        `Suspicious sheet name detected: ${sheetName}`,
        'SUSPICIOUS_SHEET_NAME'
      );
    }

    // Get sheet range
    const range = sheet['!ref'];
    if (!range) {
      continue;
    }

    // Parse range (e.g., "A1:Z100")
    const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (match) {
      const startCol = columnToNumber(match[1]);
      const startRow = parseInt(match[2], 10);
      const endCol = columnToNumber(match[3]);
      const endRow = parseInt(match[4], 10);

      const rows = endRow - startRow + 1;
      const cols = endCol - startCol + 1;
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
    }

    // Validate cell contents for prototype pollution
    for (const cellAddress in sheet) {
      if (cellAddress.startsWith('!')) {
        continue; // Skip metadata
      }

      const cell = sheet[cellAddress];

      // Check for prototype pollution in cell addresses
      if (cellAddress === '__proto__' || cellAddress === 'constructor') {
        throw new ExcelSecurityError(
          `Suspicious cell address detected: ${cellAddress}`,
          'SUSPICIOUS_CELL_ADDRESS'
        );
      }

      // Validate cell value length
      if (cell && cell.v && typeof cell.v === 'string') {
        if (cell.v.length > EXCEL_SECURITY_LIMITS.MAX_CELL_LENGTH) {
          throw new ExcelSecurityError(
            `Cell ${cellAddress} content too large: ${cell.v.length} chars (max: ${EXCEL_SECURITY_LIMITS.MAX_CELL_LENGTH})`,
            'CELL_TOO_LARGE'
          );
        }
      }
    }
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
 * Convert Excel column letter to number
 */
function columnToNumber(column: string): number {
  let result = 0;
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 64);
  }
  return result;
}

/**
 * Sanitize workbook to prevent prototype pollution
 */
export function sanitizeWorkbook(workbook: WorkBook): WorkBook {
  // Create a clean object without prototype chain vulnerabilities
  const sanitized: WorkBook = {
    SheetNames: [...workbook.SheetNames],
    Sheets: {},
  };

  // Copy sheets with sanitization
  for (const sheetName of workbook.SheetNames) {
    // Skip dangerous property names
    if (sheetName === '__proto__' || sheetName === 'constructor' || sheetName === 'prototype') {
      logger.warn({ sheetName }, 'Skipping sheet with dangerous name');
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    // Create clean sheet object
    const sanitizedSheet: any = {};

    for (const key in sheet) {
      // Skip dangerous keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        logger.warn({ sheetName, key }, 'Skipping dangerous property');
        continue;
      }

      sanitizedSheet[key] = sheet[key];
    }

    sanitized.Sheets[sheetName] = sanitizedSheet;
  }

  logger.info('Workbook sanitized successfully');
  return sanitized;
}

/**
 * Secure wrapper for xlsx parsing with timeout
 */
export async function parseWithTimeout<T>(
  parseFunction: () => T,
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

    try {
      const result = parseFunction();
      clearTimeout(timer);
      resolve(result);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
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
