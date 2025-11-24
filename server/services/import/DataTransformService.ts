/**
 * Data Transformation Service
 *
 * Transforms legacy data formats to our schema
 * Handles field mapping, data type conversion, and custom transformations
 */

import type { FieldMapping, PatientImport, OrderImport } from '../../validation/import.js';
import { loggers } from '../../utils/logger.js';

const logger = loggers.database;

/**
 * Transformation Functions
 */
type TransformFunction = (value: any, record?: Record<string, any>) => any;

/**
 * Built-in transformation functions
 */
const TRANSFORMATIONS: Record<string, TransformFunction> = {
  /**
   * No transformation
   */
  none: (value) => value,

  /**
   * Convert to uppercase
   */
  uppercase: (value) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  },

  /**
   * Convert to lowercase
   */
  lowercase: (value) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  },

  /**
   * Trim whitespace
   */
  trim: (value) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  },

  /**
   * Format date to YYYY-MM-DD
   */
  date_format: (value) => {
    if (!value) return null;

    try {
      // Handle various date formats
      let date: Date;

      if (value instanceof Date) {
        date = value;
      } else if (typeof value === 'number') {
        // Excel serial date
        const utc_days = Math.floor(value - 25569);
        const utc_value = utc_days * 86400;
        date = new Date(utc_value * 1000);
      } else if (typeof value === 'string') {
        // Parse common date formats
        // MM/DD/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
          const [month, day, year] = value.split('/').map(Number);
          date = new Date(year, month - 1, day);
        }
        // DD-MM-YYYY
        else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) {
          const [day, month, year] = value.split('-').map(Number);
          date = new Date(year, month - 1, day);
        }
        // YYYY-MM-DD (ISO format)
        else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value; // Already in correct format
        }
        // Try generic parse
        else {
          date = new Date(value);
        }
      } else {
        return null;
      }

      if (isNaN(date.getTime())) {
        logger.warn({ value }, 'Invalid date value');
        return null;
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      logger.warn({ value, error }, 'Error formatting date');
      return null;
    }
  },

  /**
   * Format phone number
   */
  phone_format: (value) => {
    if (!value) return null;

    // Remove all non-numeric characters
    const digits = String(value).replace(/\D/g, '');

    // Format US phone numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    // Return as-is if not recognized format
    return value;
  },

  /**
   * Normalize gender values
   */
  gender_normalize: (value) => {
    if (!value) return 'unknown';

    const normalized = String(value).toLowerCase().trim();

    if (['m', 'male', 'man'].includes(normalized)) {
      return 'male';
    }
    if (['f', 'female', 'woman'].includes(normalized)) {
      return 'female';
    }
    if (['o', 'other', 'non-binary', 'nonbinary'].includes(normalized)) {
      return 'other';
    }

    return 'unknown';
  },

  /**
   * Convert boolean values
   */
  boolean_convert: (value) => {
    if (typeof value === 'boolean') return value;

    const normalized = String(value).toLowerCase().trim();

    if (['true', 'yes', 'y', '1', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', 'no', 'n', '0', 'off'].includes(normalized)) {
      return false;
    }

    return null;
  },

  /**
   * Convert to integer
   */
  to_integer: (value) => {
    if (value == null) return null;
    const num = parseInt(String(value), 10);
    return isNaN(num) ? null : num;
  },

  /**
   * Convert to float
   */
  to_float: (value) => {
    if (value == null) return null;
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
  },

  /**
   * Convert empty strings to null
   */
  empty_to_null: (value) => {
    if (value === '' || value === undefined) return null;
    return value;
  },

  /**
   * Extract first name from full name
   */
  extract_first_name: (value) => {
    if (!value) return null;
    const parts = String(value).trim().split(/\s+/);
    return parts[0] || null;
  },

  /**
   * Extract last name from full name
   */
  extract_last_name: (value) => {
    if (!value) return null;
    const parts = String(value).trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : null;
  },

  /**
   * Split full name into first and last
   */
  split_name: (value, record) => {
    if (!value) return record;

    const parts = String(value).trim().split(/\s+/);

    if (!record) {
      record = {};
    }

    record.firstName = parts[0] || null;
    record.lastName = parts.length > 1 ? parts[parts.length - 1] : null;

    return record;
  },
};

/**
 * Data Transformation Service
 */
export class DataTransformService {
  /**
   * Apply field mappings to a record
   */
  static applyFieldMappings(
    record: Record<string, any>,
    mappings: FieldMapping[]
  ): Record<string, any> {
    const transformed: Record<string, any> = {};

    mappings.forEach((mapping) => {
      let value = record[mapping.sourceField];

      // Apply default value if field is missing or empty
      if (
        (value === undefined || value === null || value === '') &&
        mapping.defaultValue !== undefined
      ) {
        value = mapping.defaultValue;
      }

      // Apply transformation
      if (mapping.transform && mapping.transform !== 'none') {
        if (mapping.transform === 'custom' && mapping.customTransform) {
          try {
            // Execute custom transformation
             
            const transformFn = new Function('value', 'record', mapping.customTransform);
            value = transformFn(value, record);
          } catch (error) {
            logger.warn(
              { mapping, error },
              'Error executing custom transformation'
            );
          }
        } else if (TRANSFORMATIONS[mapping.transform]) {
          value = TRANSFORMATIONS[mapping.transform](value, transformed);
        }
      }

      // Set the transformed value
      transformed[mapping.targetField] = value;
    });

    return transformed;
  }

  /**
   * Transform patient record
   */
  static transformPatient(
    record: Record<string, any>,
    mappings?: FieldMapping[]
  ): Partial<PatientImport> {
    let transformed = { ...record };

    // Apply field mappings if provided
    if (mappings) {
      transformed = this.applyFieldMappings(record, mappings);
    }

    // Apply standard transformations
    const patient: Partial<PatientImport> = {
      firstName: transformed.firstName?.trim(),
      lastName: transformed.lastName?.trim(),
      dateOfBirth: TRANSFORMATIONS.date_format(transformed.dateOfBirth),
      mrn: transformed.mrn?.trim() || null,
      email: transformed.email?.trim()?.toLowerCase() || null,
      phone: TRANSFORMATIONS.phone_format(transformed.phone),
      gender: TRANSFORMATIONS.gender_normalize(transformed.gender),
      address: transformed.address?.trim() || null,
      city: transformed.city?.trim() || null,
      state: transformed.state?.trim() || null,
      zipCode: transformed.zipCode?.trim() || null,
      country: transformed.country?.trim() || 'USA',
      externalId: transformed.externalId?.trim() || null,
      importSource: transformed.importSource?.trim() || null,
      notes: transformed.notes?.trim() || null,
    };

    // Remove undefined values
    Object.keys(patient).forEach((key) => {
      if (patient[key as keyof typeof patient] === undefined) {
        delete patient[key as keyof typeof patient];
      }
    });

    return patient;
  }

  /**
   * Transform order record
   */
  static transformOrder(
    record: Record<string, any>,
    mappings?: FieldMapping[]
  ): Partial<OrderImport> {
    let transformed = { ...record };

    // Apply field mappings if provided
    if (mappings) {
      transformed = this.applyFieldMappings(record, mappings);
    }

    // Apply standard transformations
    const order: Partial<OrderImport> = {
      patientIdentifier: transformed.patientIdentifier?.trim(),
      orderNumber: transformed.orderNumber?.trim(),
      orderDate: TRANSFORMATIONS.date_format(transformed.orderDate),
      testType: transformed.testType?.trim(),
      status: transformed.status?.toLowerCase() || 'pending',
      priority: transformed.priority?.toLowerCase() || 'routine',
      orderingProvider: transformed.orderingProvider?.trim() || null,
      facility: transformed.facility?.trim() || null,
      department: transformed.department?.trim() || null,
      resultDate: TRANSFORMATIONS.date_format(transformed.resultDate),
      resultValue: transformed.resultValue?.trim() || null,
      resultUnit: transformed.resultUnit?.trim() || null,
      interpretation: transformed.interpretation?.trim() || null,
      externalId: transformed.externalId?.trim() || null,
      importSource: transformed.importSource?.trim() || null,
      notes: transformed.notes?.trim() || null,
    };

    // Remove undefined values
    Object.keys(order).forEach((key) => {
      if (order[key as keyof typeof order] === undefined) {
        delete order[key as keyof typeof order];
      }
    });

    return order;
  }

  /**
   * Transform batch of records
   */
  static transformBatch<T>(
    records: Record<string, any>[],
    type: 'patients' | 'orders',
    mappings?: FieldMapping[]
  ): T[] {
    const transformer = type === 'patients' ? this.transformPatient : this.transformOrder;

    return records.map((record) => transformer(record, mappings) as T);
  }

  /**
   * Register custom transformation
   */
  static registerTransformation(name: string, fn: TransformFunction): void {
    TRANSFORMATIONS[name] = fn;
  }

  /**
   * Get available transformations
   */
  static getAvailableTransformations(): string[] {
    return Object.keys(TRANSFORMATIONS);
  }

  /**
   * Auto-detect field mappings based on common patterns
   */
  static autoDetectMappings(
    type: 'patients' | 'orders',
    headers: string[]
  ): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    if (type === 'patients') {
      // Patient field patterns
      const patterns: Record<string, string[]> = {
        firstName: ['first_name', 'firstname', 'first', 'given_name', 'fname'],
        lastName: ['last_name', 'lastname', 'last', 'surname', 'family_name', 'lname'],
        dateOfBirth: ['date_of_birth', 'dob', 'birth_date', 'birthdate', 'date_birth'],
        mrn: ['mrn', 'medical_record_number', 'patient_id', 'patientid', 'patient_number'],
        email: ['email', 'email_address', 'e_mail', 'mail'],
        phone: ['phone', 'telephone', 'phone_number', 'tel', 'mobile', 'cell'],
        gender: ['gender', 'sex'],
        address: ['address', 'street', 'street_address', 'addr'],
        city: ['city', 'town'],
        state: ['state', 'province', 'region'],
        zipCode: ['zip', 'zipcode', 'zip_code', 'postal_code', 'postalcode'],
        country: ['country'],
      };

      headers.forEach((header) => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        for (const [targetField, patterns] of Object.entries(patterns)) {
          if (patterns.includes(normalizedHeader)) {
            mappings.push({
              sourceField: header,
              targetField,
              transform: targetField === 'dateOfBirth' ? 'date_format' :
                         targetField === 'phone' ? 'phone_format' :
                         targetField === 'gender' ? 'gender_normalize' :
                         'trim',
              required: ['firstName', 'lastName', 'dateOfBirth'].includes(targetField),
            });
            break;
          }
        }
      });
    } else {
      // Order field patterns
      const patterns: Record<string, string[]> = {
        patientIdentifier: ['patient_id', 'patientid', 'mrn', 'patient_mrn', 'patient_email'],
        orderNumber: ['order_number', 'ordernumber', 'order_id', 'orderid', 'accession'],
        orderDate: ['order_date', 'orderdate', 'date_ordered', 'ordered_date'],
        testType: ['test_type', 'test', 'test_name', 'procedure', 'exam'],
        status: ['status', 'order_status'],
        priority: ['priority', 'urgency'],
        orderingProvider: ['provider', 'ordering_provider', 'physician', 'doctor', 'ordering_physician'],
        facility: ['facility', 'location', 'hospital', 'clinic'],
        department: ['department', 'dept', 'division'],
        resultDate: ['result_date', 'resultdate', 'completed_date', 'completion_date'],
        resultValue: ['result', 'result_value', 'value', 'finding'],
        resultUnit: ['unit', 'units', 'result_unit'],
        interpretation: ['interpretation', 'notes', 'comments', 'impression'],
      };

      headers.forEach((header) => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        for (const [targetField, patterns] of Object.entries(patterns)) {
          if (patterns.includes(normalizedHeader)) {
            mappings.push({
              sourceField: header,
              targetField,
              transform: ['orderDate', 'resultDate'].includes(targetField) ? 'date_format' : 'trim',
              required: ['patientIdentifier', 'orderNumber', 'orderDate', 'testType'].includes(targetField),
            });
            break;
          }
        }
      });
    }

    return mappings;
  }
}
