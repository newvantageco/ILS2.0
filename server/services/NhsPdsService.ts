/**
 * NHS Personal Demographics Service (PDS) Integration
 * 
 * PDS is the national electronic database of NHS patient demographic information.
 * Reference: https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir
 * 
 * Features:
 * - Patient lookup by NHS number
 * - Patient search by demographics (name, DOB, postcode)
 * - NHS number verification
 * - FHIR R4 compliant responses
 * 
 * Security: Application-restricted (signed JWT authentication)
 * Status: In Production
 */

import { nhsApiAuthService, NhsEnvironment, NHS_API_ENVIRONMENTS } from './NhsApiAuthService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('nhs-pds');

// PDS FHIR Resource Types
interface FhirHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: {
    start?: string;
    end?: string;
  };
}

interface FhirAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  line?: string[];
  city?: string;
  district?: string;
  postalCode?: string;
  country?: string;
  period?: {
    start?: string;
    end?: string;
  };
}

interface FhirTelecom {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

interface FhirIdentifier {
  system?: string;
  value?: string;
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
}

interface FhirGeneralPractitioner {
  id?: string;
  type?: string;
  identifier?: FhirIdentifier;
}

export interface PdsPatient {
  resourceType: 'Patient';
  id: string;
  meta?: {
    versionId?: string;
    security?: Array<{ code: string; display: string }>;
  };
  identifier?: FhirIdentifier[];
  name?: FhirHumanName[];
  telecom?: FhirTelecom[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedDateTime?: string;
  deceasedBoolean?: boolean;
  address?: FhirAddress[];
  generalPractitioner?: FhirGeneralPractitioner[];
  extension?: Array<{
    url: string;
    valueCodeableConcept?: {
      coding?: Array<{ system: string; code: string; display: string }>;
    };
    extension?: Array<{ url: string; valueString?: string; valueCode?: string }>;
  }>;
}

interface PdsSearchBundle {
  resourceType: 'Bundle';
  type: 'searchset';
  total: number;
  entry?: Array<{
    fullUrl: string;
    resource: PdsPatient;
    search?: {
      score: number;
    };
  }>;
}

export interface SimplifiedPatientDetails {
  nhsNumber: string;
  verified: boolean;
  title?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postcode?: string;
  };
  phone?: string;
  mobile?: string;
  email?: string;
  gpPractice?: string;
  isDeceased: boolean;
  deceasedDate?: string;
  sensitiveRecord: boolean;
}

/**
 * NHS Personal Demographics Service
 */
export class NhsPdsService {
  private readonly pdsBasePath = '/personal-demographics/FHIR/R4';

  /**
   * Get PDS API URL for current environment
   */
  private getPdsUrl(path: string): string {
    const env = nhsApiAuthService.getCurrentEnvironment();
    const config = NHS_API_ENVIRONMENTS[env];
    return `${config.baseUrl}${this.pdsBasePath}${path}`;
  }

  /**
   * Lookup patient by NHS number
   * 
   * @param nhsNumber - 10-digit NHS number
   * @returns Patient details or null if not found
   */
  async getPatientByNhsNumber(nhsNumber: string): Promise<SimplifiedPatientDetails | null> {
    // Validate NHS number format
    if (!this.validateNhsNumber(nhsNumber)) {
      throw new Error('Invalid NHS number format');
    }

    try {
      const patient = await nhsApiAuthService.makeAuthenticatedRequest<PdsPatient>(
        this.getPdsUrl(`/Patient/${nhsNumber}`)
      );

      return this.simplifyPatient(patient);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      // 404 means patient not found
      if (message.includes('404')) {
        logger.info({ nhsNumber: nhsNumber.slice(-4) }, 'Patient not found in PDS');
        return null;
      }

      logger.error({ error: message }, 'PDS patient lookup failed');
      throw error;
    }
  }

  /**
   * Search for patients by demographics
   * 
   * @param params - Search parameters
   * @returns Array of matching patients
   */
  async searchPatients(params: {
    family?: string;       // Family name (surname)
    given?: string;        // Given names
    birthdate?: string;    // Date of birth (YYYY-MM-DD)
    gender?: 'male' | 'female' | 'other' | 'unknown';
    postcode?: string;     // UK postcode
    email?: string;
    phone?: string;
  }): Promise<SimplifiedPatientDetails[]> {
    const searchParams = new URLSearchParams();

    // Add search parameters (PDS uses specific parameter names)
    if (params.family) {
      searchParams.append('family', params.family);
    }
    if (params.given) {
      searchParams.append('given', params.given);
    }
    if (params.birthdate) {
      searchParams.append('birthdate', `eq${params.birthdate}`);
    }
    if (params.gender) {
      searchParams.append('gender', params.gender);
    }
    if (params.postcode) {
      // PDS uses address-postalcode
      searchParams.append('address-postalcode', params.postcode);
    }
    if (params.email) {
      searchParams.append('email', params.email);
    }
    if (params.phone) {
      searchParams.append('phone', params.phone);
    }

    // PDS requires at least family + birthdate or family + gender for a search
    const paramCount = Object.values(params).filter(v => v).length;
    if (paramCount < 2) {
      throw new Error('PDS search requires at least 2 parameters');
    }

    try {
      const bundle = await nhsApiAuthService.makeAuthenticatedRequest<PdsSearchBundle>(
        this.getPdsUrl(`/Patient?${searchParams.toString()}`)
      );

      if (!bundle.entry || bundle.total === 0) {
        return [];
      }

      return bundle.entry
        .map(entry => this.simplifyPatient(entry.resource))
        .filter((p): p is SimplifiedPatientDetails => p !== null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, params }, 'PDS patient search failed');
      throw error;
    }
  }

  /**
   * Verify an NHS number exists and get basic details
   * 
   * @param nhsNumber - NHS number to verify
   * @returns Verification result
   */
  async verifyNhsNumber(nhsNumber: string): Promise<{
    valid: boolean;
    exists: boolean;
    patient?: SimplifiedPatientDetails;
    message: string;
  }> {
    // First, validate the format
    if (!this.validateNhsNumber(nhsNumber)) {
      return {
        valid: false,
        exists: false,
        message: 'Invalid NHS number format (must be 10 digits with valid checksum)',
      };
    }

    try {
      const patient = await this.getPatientByNhsNumber(nhsNumber);
      
      if (patient) {
        return {
          valid: true,
          exists: true,
          patient,
          message: 'NHS number verified successfully',
        };
      } else {
        return {
          valid: true,
          exists: false,
          message: 'NHS number format is valid but not found in PDS',
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: true,
        exists: false,
        message: `Verification failed: ${message}`,
      };
    }
  }

  /**
   * Validate NHS number format and checksum
   * 
   * NHS numbers are 10 digits with a Modulus 11 check digit
   */
  validateNhsNumber(nhsNumber: string): boolean {
    // Remove any spaces or dashes
    const cleaned = nhsNumber.replace(/[\s-]/g, '');

    // Must be exactly 10 digits
    if (!/^\d{10}$/.test(cleaned)) {
      return false;
    }

    // Modulus 11 check digit validation
    const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    const digits = cleaned.split('').map(d => parseInt(d, 10));
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * weights[i];
    }

    const remainder = sum % 11;
    const checkDigit = 11 - remainder;

    // If check digit is 11, it should be 0
    // If check digit is 10, the number is invalid
    if (checkDigit === 11) {
      return digits[9] === 0;
    }
    if (checkDigit === 10) {
      return false;
    }

    return digits[9] === checkDigit;
  }

  /**
   * Format NHS number with spaces (XXX XXX XXXX)
   */
  formatNhsNumber(nhsNumber: string): string {
    const cleaned = nhsNumber.replace(/[\s-]/g, '');
    if (cleaned.length !== 10) {
      return nhsNumber;
    }
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  /**
   * Convert FHIR Patient resource to simplified format
   */
  private simplifyPatient(patient: PdsPatient): SimplifiedPatientDetails | null {
    try {
      // Get NHS number from identifiers
      const nhsNumberIdentifier = patient.identifier?.find(
        id => id.system === 'https://fhir.nhs.uk/Id/nhs-number'
      );
      const nhsNumber = nhsNumberIdentifier?.value || patient.id;

      // Get official name
      const officialName = patient.name?.find(n => n.use === 'official') || patient.name?.[0];
      
      // Get current home address
      const homeAddress = patient.address?.find(a => a.use === 'home' && !a.period?.end) 
        || patient.address?.[0];

      // Get telecom contacts
      const homePhone = patient.telecom?.find(t => t.system === 'phone' && t.use === 'home');
      const mobilePhone = patient.telecom?.find(t => t.system === 'phone' && t.use === 'mobile');
      const email = patient.telecom?.find(t => t.system === 'email');

      // Check for sensitive/restricted record
      const sensitiveRecord = patient.meta?.security?.some(
        s => s.code === 'R' || s.code === 'V' || s.code === 'S'
      ) ?? false;

      // Get GP practice
      const gpPractice = patient.generalPractitioner?.[0]?.identifier?.value;

      return {
        nhsNumber,
        verified: true,
        title: officialName?.prefix?.[0],
        firstName: officialName?.given?.join(' ') || '',
        lastName: officialName?.family || '',
        dateOfBirth: patient.birthDate || '',
        gender: patient.gender || 'unknown',
        address: homeAddress ? {
          line1: homeAddress.line?.[0],
          line2: homeAddress.line?.[1],
          city: homeAddress.city,
          postcode: homeAddress.postalCode,
        } : undefined,
        phone: homePhone?.value,
        mobile: mobilePhone?.value,
        email: email?.value,
        gpPractice,
        isDeceased: patient.deceasedBoolean === true || !!patient.deceasedDateTime,
        deceasedDate: patient.deceasedDateTime,
        sensitiveRecord,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to simplify PDS patient');
      return null;
    }
  }

  /**
   * Check if PDS service is available
   */
  async healthCheck(): Promise<{
    available: boolean;
    environment: NhsEnvironment;
    message: string;
  }> {
    try {
      const connectionTest = await nhsApiAuthService.testConnection();
      
      return {
        available: connectionTest.success,
        environment: connectionTest.environment,
        message: connectionTest.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        available: false,
        environment: nhsApiAuthService.getCurrentEnvironment(),
        message,
      };
    }
  }
}

// Singleton instance
export const nhsPdsService = new NhsPdsService();
