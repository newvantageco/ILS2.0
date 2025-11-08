/**
 * Healthcare Interoperability Service
 *
 * Support for healthcare data standards including HL7 FHIR, HL7 v2,
 * and other healthcare-specific data formats for EHR integration
 */

import { loggers } from '../../utils/logger.js';

const logger = loggers.api;

/**
 * FHIR Resource Types
 */
export type FHIRResourceType =
  | 'Patient'
  | 'Practitioner'
  | 'Observation'
  | 'Condition'
  | 'Medication'
  | 'MedicationRequest'
  | 'Appointment'
  | 'Encounter'
  | 'DiagnosticReport'
  | 'DocumentReference';

/**
 * HL7 Message Types
 */
export type HL7MessageType =
  | 'ADT' // Admission, Discharge, Transfer
  | 'ORM' // Order Message
  | 'ORU' // Observation Result
  | 'SIU' // Scheduling Information Unsolicited
  | 'MDM'; // Medical Document Management

/**
 * FHIR Resource Base
 */
export interface FHIRResource {
  resourceType: FHIRResourceType;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    source?: string;
  };
  text?: {
    status: 'generated' | 'extensions' | 'additional' | 'empty';
    div: string;
  };
}

/**
 * FHIR Patient Resource
 */
export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: Array<{
    use?: 'usual' | 'official' | 'temp' | 'secondary';
    system?: string;
    value?: string;
  }>;
  name?: Array<{
    use?: 'usual' | 'official' | 'temp' | 'nickname' | 'maiden';
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
  }>;
  telecom?: Array<{
    system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    value?: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string; // YYYY-MM-DD
  address?: Array<{
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
}

/**
 * FHIR Observation Resource (for eye exam results)
 */
export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled';
  category?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string; // e.g., "Patient/123"
  };
  effectiveDateTime?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  valueCodeableConcept?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
}

/**
 * Healthcare Interoperability Service
 */
export class HealthcareInterop {
  /**
   * Convert local patient to FHIR Patient resource
   */
  static toFHIRPatient(patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    mrn?: string;
  }): FHIRPatient {
    const fhirPatient: FHIRPatient = {
      resourceType: 'Patient',
      id: patient.id,
      meta: {
        lastUpdated: new Date().toISOString(),
      },
      identifier: [],
      name: [
        {
          use: 'official',
          family: patient.lastName,
          given: [patient.firstName],
        },
      ],
      gender: this.normalizeFHIRGender(patient.gender),
      birthDate: patient.dateOfBirth,
      telecom: [],
      address: [],
    };

    // Add MRN if available
    if (patient.mrn) {
      fhirPatient.identifier!.push({
        use: 'usual',
        system: 'urn:oid:2.16.840.1.113883.4.1', // Example OID for MRN
        value: patient.mrn,
      });
    }

    // Add contact information
    if (patient.email) {
      fhirPatient.telecom!.push({
        system: 'email',
        value: patient.email,
        use: 'home',
      });
    }

    if (patient.phone) {
      fhirPatient.telecom!.push({
        system: 'phone',
        value: patient.phone,
        use: 'home',
      });
    }

    // Add address if available
    if (patient.address || patient.city || patient.state || patient.zipCode) {
      fhirPatient.address!.push({
        use: 'home',
        line: patient.address ? [patient.address] : undefined,
        city: patient.city,
        state: patient.state,
        postalCode: patient.zipCode,
        country: 'US',
      });
    }

    return fhirPatient;
  }

  /**
   * Convert FHIR Patient to local patient format
   */
  static fromFHIRPatient(fhirPatient: FHIRPatient): {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    mrn?: string;
  } {
    const name = fhirPatient.name?.[0];
    const email = fhirPatient.telecom?.find((t) => t.system === 'email')?.value;
    const phone = fhirPatient.telecom?.find((t) => t.system === 'phone')?.value;
    const address = fhirPatient.address?.[0];
    const mrn = fhirPatient.identifier?.find((i) => i.use === 'usual')?.value;

    return {
      firstName: name?.given?.[0] || '',
      lastName: name?.family || '',
      dateOfBirth: fhirPatient.birthDate || '',
      gender: fhirPatient.gender,
      email,
      phone,
      address: address?.line?.[0],
      city: address?.city,
      state: address?.state,
      zipCode: address?.postalCode,
      mrn,
    };
  }

  /**
   * Create FHIR Observation for eye exam measurement
   */
  static createEyeExamObservation(
    patientId: string,
    measurement: {
      type: 'visual_acuity' | 'iop' | 'refraction' | 'fundus_exam';
      value: string | number;
      eye: 'left' | 'right' | 'both';
      date: Date;
      notes?: string;
    }
  ): FHIRObservation {
    const loincCodes: Record<string, { code: string; display: string }> = {
      visual_acuity: { code: '70936-0', display: 'Visual acuity' },
      iop: { code: '56844-4', display: 'Intraocular pressure' },
      refraction: { code: '70934-5', display: 'Refraction' },
      fundus_exam: { code: '70929-5', display: 'Fundus examination' },
    };

    const measurementCode = loincCodes[measurement.type];

    const observation: FHIRObservation = {
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'exam',
              display: 'Exam',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: measurementCode.code,
            display: measurementCode.display,
          },
        ],
        text: `${measurementCode.display} - ${measurement.eye}`,
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      effectiveDateTime: measurement.date.toISOString(),
    };

    // Add value based on type
    if (typeof measurement.value === 'number') {
      observation.valueQuantity = {
        value: measurement.value,
        unit: measurement.type === 'iop' ? 'mmHg' : '',
        system: 'http://unitsofmeasure.org',
      };
    } else {
      observation.valueString = measurement.value;
    }

    return observation;
  }

  /**
   * Parse HL7 v2 message
   */
  static parseHL7Message(message: string): {
    messageType: string;
    segments: Map<string, string[][]>;
  } {
    const lines = message.split('\r');
    const segments = new Map<string, string[][]>();

    lines.forEach((line) => {
      if (!line) return;

      const fields = line.split('|');
      const segmentType = fields[0];

      if (!segments.has(segmentType)) {
        segments.set(segmentType, []);
      }

      segments.get(segmentType)!.push(fields);
    });

    // Get message type from MSH segment
    const mshSegment = segments.get('MSH')?.[0];
    const messageType = mshSegment?.[8] || 'UNKNOWN';

    return {
      messageType,
      segments,
    };
  }

  /**
   * Create HL7 v2 ADT message for patient registration
   */
  static createHL7ADTMessage(
    patient: {
      id: string;
      mrn: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      gender?: string;
      phone?: string;
      address?: string;
    },
    eventType: 'A01' | 'A04' | 'A08' = 'A04' // A01=Admit, A04=Register, A08=Update
  ): string {
    const timestamp = this.formatHL7DateTime(new Date());
    const messageControlId = crypto.randomUUID();

    // MSH - Message Header
    const msh = [
      'MSH',
      '^~\\&', // Encoding characters
      'ILS', // Sending application
      'FACILITY', // Sending facility
      'EHR', // Receiving application
      'HOSPITAL', // Receiving facility
      timestamp,
      '',
      `ADT^${eventType}`, // Message type
      messageControlId,
      'P', // Processing ID (P=Production)
      '2.5', // HL7 version
    ].join('|');

    // EVN - Event Type
    const evn = [
      'EVN',
      eventType,
      timestamp,
    ].join('|');

    // PID - Patient Identification
    const pid = [
      'PID',
      '1', // Set ID
      patient.id, // Patient ID (external)
      patient.mrn, // Patient ID (internal)
      '', // Alternate patient ID
      `${patient.lastName}^${patient.firstName}`, // Patient name
      '', // Mother's maiden name
      patient.dateOfBirth.replace(/-/g, ''), // DOB (YYYYMMDD)
      patient.gender?.charAt(0).toUpperCase() || 'U', // Gender
      '', // Patient alias
      '', // Race
      patient.address || '', // Address
      '', // County code
      patient.phone || '', // Phone
    ].join('|');

    // PV1 - Patient Visit (minimal)
    const pv1 = [
      'PV1',
      '1', // Set ID
      'O', // Patient class (O=Outpatient)
    ].join('|');

    return [msh, evn, pid, pv1].join('\r') + '\r';
  }

  /**
   * Format date/time for HL7
   */
  private static formatHL7DateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * Normalize gender for FHIR
   */
  private static normalizeFHIRGender(
    gender?: string
  ): 'male' | 'female' | 'other' | 'unknown' {
    if (!gender) return 'unknown';

    const normalized = gender.toLowerCase();
    if (['m', 'male', '1'].includes(normalized)) return 'male';
    if (['f', 'female', '2'].includes(normalized)) return 'female';
    if (['o', 'other', '3'].includes(normalized)) return 'other';
    return 'unknown';
  }

  /**
   * Validate FHIR resource
   */
  static validateFHIRResource(resource: FHIRResource): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!resource.resourceType) {
      errors.push('resourceType is required');
    }

    // Resource-specific validation
    if (resource.resourceType === 'Patient') {
      const patient = resource as FHIRPatient;

      if (!patient.name || patient.name.length === 0) {
        errors.push('Patient must have at least one name');
      }

      if (patient.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(patient.birthDate)) {
        errors.push('birthDate must be in YYYY-MM-DD format');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create FHIR Bundle for batch operations
   */
  static createFHIRBundle(
    resources: FHIRResource[],
    type: 'transaction' | 'batch' | 'collection' = 'batch'
  ): {
    resourceType: 'Bundle';
    type: string;
    entry: Array<{
      resource: FHIRResource;
      request?: {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        url: string;
      };
    }>;
  } {
    return {
      resourceType: 'Bundle',
      type,
      entry: resources.map((resource) => ({
        resource,
        request:
          type !== 'collection'
            ? {
                method: resource.id ? 'PUT' : 'POST',
                url: resource.id
                  ? `${resource.resourceType}/${resource.id}`
                  : resource.resourceType,
              }
            : undefined,
      })),
    };
  }

  /**
   * Extract patient demographics from HL7 message
   */
  static extractPatientFromHL7(message: string): {
    mrn?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
    address?: string;
  } | null {
    const parsed = this.parseHL7Message(message);
    const pidSegment = parsed.segments.get('PID')?.[0];

    if (!pidSegment) {
      logger.warn('No PID segment found in HL7 message');
      return null;
    }

    // PID segment field positions (HL7 v2.5)
    const mrn = pidSegment[3]; // Patient ID
    const patientName = pidSegment[5]; // Patient name (LastName^FirstName)
    const dob = pidSegment[7]; // Date of birth (YYYYMMDD)
    const gender = pidSegment[8]; // Gender
    const address = pidSegment[11]; // Address
    const phone = pidSegment[13]; // Phone

    // Parse name
    const [lastName, firstName] = patientName?.split('^') || [];

    // Format DOB
    let formattedDOB: string | undefined;
    if (dob && dob.length === 8) {
      formattedDOB = `${dob.slice(0, 4)}-${dob.slice(4, 6)}-${dob.slice(6, 8)}`;
    }

    return {
      mrn,
      firstName,
      lastName,
      dateOfBirth: formattedDOB,
      gender: gender === 'M' ? 'male' : gender === 'F' ? 'female' : 'unknown',
      phone,
      address,
    };
  }
}
