/**
 * UK-Specific Validation Utilities
 *
 * Validation schemas and functions for UK-specific data formats:
 * - NHS numbers (with Modulus 11 checksum)
 * - UK postcodes
 * - UK phone numbers
 * - GOC registration numbers
 * - UK date formats
 *
 * @module server/utils/ukValidation
 */

import { z } from 'zod';

// ============================================
// NHS NUMBER VALIDATION
// ============================================

/**
 * Validate NHS number using Modulus 11 checksum
 *
 * NHS numbers are 10 digits where:
 * - Digits 1-9 are the identifier
 * - Digit 10 is the check digit calculated using Modulus 11
 *
 * @param nhsNumber - The NHS number to validate (with or without spaces)
 * @returns true if valid, false otherwise
 */
export function validateNHSNumber(nhsNumber: string): boolean {
  // Remove spaces and check length
  const cleaned = nhsNumber.replace(/\s/g, '');

  if (!/^\d{10}$/.test(cleaned)) {
    return false;
  }

  // Calculate Modulus 11 checksum
  const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i], 10) * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = 11 - remainder;

  // Check digit can't be 10 (invalid NHS number)
  if (checkDigit === 10) {
    return false;
  }

  // Check digit of 11 becomes 0
  const expectedCheckDigit = checkDigit === 11 ? 0 : checkDigit;

  return parseInt(cleaned[9], 10) === expectedCheckDigit;
}

/**
 * Format NHS number with spaces (XXX XXX XXXX)
 */
export function formatNHSNumber(nhsNumber: string): string {
  const cleaned = nhsNumber.replace(/\s/g, '');
  if (cleaned.length !== 10) return nhsNumber;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

// ============================================
// UK POSTCODE VALIDATION
// ============================================

/**
 * UK Postcode regex pattern
 * Matches all valid UK postcode formats including:
 * - Standard: SW1A 1AA, M1 1AA, B33 8TH
 * - Crown dependencies: GY1 1AA, JE2 3XP, IM1 2AB
 * - British Forces: BFPO 1
 */
const UK_POSTCODE_REGEX = /^([Gg][Ii][Rr] ?0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})$/;

/**
 * Validate UK postcode
 */
export function validateUKPostcode(postcode: string): boolean {
  return UK_POSTCODE_REGEX.test(postcode.trim());
}

/**
 * Format UK postcode with space
 */
export function formatUKPostcode(postcode: string): string {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  if (cleaned.length < 5 || cleaned.length > 7) return postcode;

  // Insert space before last 3 characters
  return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
}

// ============================================
// UK PHONE NUMBER VALIDATION
// ============================================

/**
 * UK phone number patterns
 * - Mobile: 07XXX XXXXXX
 * - Geographic: 01XXX XXXXXX, 02X XXXX XXXX
 * - Non-geographic: 03XX XXX XXXX
 * - Freephone: 0800 XXX XXXX, 0808 XXX XXXX
 */
const UK_PHONE_REGEX = /^(?:(?:\+44\s?|0)(?:7[0-9]{3}\s?[0-9]{6}|1[0-9]{3}\s?[0-9]{6}|1[0-9]{4}\s?[0-9]{5}|2[0-9]{1}\s?[0-9]{4}\s?[0-9]{4}|3[0-9]{2}\s?[0-9]{3}\s?[0-9]{4}|800\s?[0-9]{3}\s?[0-9]{4}|808\s?[0-9]{3}\s?[0-9]{4}))$/;

/**
 * Validate UK phone number
 */
export function validateUKPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return UK_PHONE_REGEX.test(cleaned);
}

/**
 * Format UK phone number to E.164 format
 */
export function formatUKPhoneE164(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Replace leading 0 with +44
  if (cleaned.startsWith('0')) {
    cleaned = '+44' + cleaned.slice(1);
  } else if (!cleaned.startsWith('+44')) {
    cleaned = '+44' + cleaned;
  }

  return cleaned;
}

// ============================================
// GOC REGISTRATION NUMBER VALIDATION
// ============================================

/**
 * General Optical Council (GOC) registration number
 * Format: 01-XXXXX (Optometrists), 02-XXXXX (Dispensing Opticians)
 */
const GOC_NUMBER_REGEX = /^0[12]-\d{5}$/;

/**
 * Validate GOC registration number
 */
export function validateGOCNumber(gocNumber: string): boolean {
  return GOC_NUMBER_REGEX.test(gocNumber);
}

/**
 * Get practitioner type from GOC number
 */
export function getGOCPractitionerType(gocNumber: string): 'optometrist' | 'dispensing_optician' | null {
  if (!validateGOCNumber(gocNumber)) return null;
  return gocNumber.startsWith('01-') ? 'optometrist' : 'dispensing_optician';
}

// ============================================
// NATIONAL INSURANCE NUMBER VALIDATION
// ============================================

/**
 * UK National Insurance Number
 * Format: AB 12 34 56 C
 * - First two letters (not D, F, I, Q, U, V, O or BG, GB, NK, KN, TN, NT, ZZ)
 * - Six digits
 * - Final letter A, B, C or D
 */
const NINO_REGEX = /^(?!BG|GB|NK|KN|TN|NT|ZZ)[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]$/i;

/**
 * Validate National Insurance Number
 */
export function validateNINO(nino: string): boolean {
  return NINO_REGEX.test(nino.toUpperCase());
}

/**
 * Format NINO with spaces
 */
export function formatNINO(nino: string): string {
  const cleaned = nino.replace(/\s/g, '').toUpperCase();
  if (cleaned.length !== 9) return nino;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
}

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * NHS Number Zod schema with validation
 */
export const nhsNumberSchema = z
  .string()
  .transform(val => val.replace(/\s/g, ''))
  .refine(val => /^\d{10}$/.test(val), {
    message: 'NHS number must be 10 digits',
  })
  .refine(validateNHSNumber, {
    message: 'Invalid NHS number checksum',
  });

/**
 * UK Postcode Zod schema
 */
export const ukPostcodeSchema = z
  .string()
  .trim()
  .refine(validateUKPostcode, {
    message: 'Invalid UK postcode format',
  })
  .transform(formatUKPostcode);

/**
 * UK Phone Number Zod schema
 */
export const ukPhoneSchema = z
  .string()
  .refine(validateUKPhoneNumber, {
    message: 'Invalid UK phone number format',
  })
  .transform(formatUKPhoneE164);

/**
 * GOC Registration Number Zod schema
 */
export const gocNumberSchema = z
  .string()
  .regex(GOC_NUMBER_REGEX, {
    message: 'Invalid GOC number format (expected 01-XXXXX or 02-XXXXX)',
  });

/**
 * National Insurance Number Zod schema
 */
export const ninoSchema = z
  .string()
  .refine(validateNINO, {
    message: 'Invalid National Insurance number format',
  })
  .transform(formatNINO);

/**
 * UK Date (DD/MM/YYYY) to ISO schema
 */
export const ukDateSchema = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'Date must be in DD/MM/YYYY format',
  })
  .transform(val => {
    const [day, month, year] = val.split('/');
    return `${year}-${month}-${day}`;
  })
  .refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  });

// ============================================
// UK-SPECIFIC VALIDATION SCHEMAS
// ============================================

/**
 * UK Address schema
 */
export const ukAddressSchema = z.object({
  addressLine1: z.string().min(1, 'Address line 1 is required').max(100),
  addressLine2: z.string().max(100).optional(),
  addressLine3: z.string().max(100).optional(),
  city: z.string().min(1, 'City/Town is required').max(50),
  county: z.string().max(50).optional(),
  postcode: ukPostcodeSchema,
  country: z.literal('GB').or(z.literal('UK')).default('GB'),
});

/**
 * UK Patient schema (NHS-compliant)
 */
export const ukPatientSchema = z.object({
  title: z.enum(['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof', 'Rev']).optional(),
  firstName: z.string().min(1).max(50),
  middleNames: z.string().max(100).optional(),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.string().datetime().or(ukDateSchema),
  nhsNumber: nhsNumberSchema.optional(),
  phone: ukPhoneSchema.optional(),
  email: z.string().email().optional(),
  address: ukAddressSchema.optional(),
});

/**
 * GOC Practitioner schema
 */
export const gocPractitionerSchema = z.object({
  gocNumber: gocNumberSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  qualifications: z.array(z.string()).optional(),
  practitionerType: z.enum(['optometrist', 'dispensing_optician']),
  registrationDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

/**
 * NHS GOS Form schema (common fields)
 */
export const nhsGOSFormSchema = z.object({
  patientNhsNumber: nhsNumberSchema,
  patientDateOfBirth: z.string().datetime(),
  practitionerGocNumber: gocNumberSchema,
  practiceCode: z.string().min(1).max(20),
  testDate: z.string().datetime(),
  exemptionCategory: z.enum([
    'HC2', // Full help
    'HC3', // Limited help
    'A', // Under 16
    'B', // 16-18 in full-time education
    'C', // Aged 60 or over
    'D', // Receiving qualifying benefits
    'E', // Named on a valid HC2 certificate
    'F', // Named on a valid HC3 certificate
    'G', // Pregnant or had baby in last 12 months (NHS prescription exemption)
    'H', // War pensioner
    'L', // Diagnosed glaucoma/diabetes/risk of glaucoma
    'M', // Registered blind or partially sighted
    'N', // Needs complex lenses
  ]).optional(),
  exemptionCertificateNumber: z.string().max(50).optional(),
});

// ============================================
// EXPORT ALL
// ============================================

export default {
  // NHS
  validateNHSNumber,
  formatNHSNumber,
  nhsNumberSchema,

  // Postcode
  validateUKPostcode,
  formatUKPostcode,
  ukPostcodeSchema,

  // Phone
  validateUKPhoneNumber,
  formatUKPhoneE164,
  ukPhoneSchema,

  // GOC
  validateGOCNumber,
  getGOCPractitionerType,
  gocNumberSchema,

  // NINO
  validateNINO,
  formatNINO,
  ninoSchema,

  // Dates
  ukDateSchema,

  // Complex schemas
  ukAddressSchema,
  ukPatientSchema,
  gocPractitionerSchema,
  nhsGOSFormSchema,
};
