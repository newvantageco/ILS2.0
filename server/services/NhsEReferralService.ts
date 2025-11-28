/**
 * NHS e-Referral Service (e-RS) Integration
 * 
 * Creates and manages electronic referrals to hospital eye clinics.
 * Reference: https://digital.nhs.uk/developer/api-catalogue/e-referral-service-fhir
 * 
 * Features:
 * - Create referrals to ophthalmology services
 * - Search for available services (Directory of Services)
 * - Book appointments at specialist clinics
 * - Cancel or modify referrals
 * - Advice and Guidance requests
 * - Track referral status
 * 
 * Security: User-restricted (CIS2 authentication required)
 * Status: In Production
 */

import { nhsApiAuthService, NHS_API_ENVIRONMENTS } from './NhsApiAuthService.js';
import { createLogger } from '../utils/logger.js';
import crypto from 'crypto';

const logger = createLogger('nhs-ers');

// e-RS API base paths
const ERS_API_PATHS = {
  sandbox: '/e-referrals/FHIR/R4',
  integration: '/e-referrals/FHIR/R4',
  production: '/e-referrals/FHIR/R4',
};

// Referral priority levels
export type ReferralPriority = 'routine' | 'urgent' | 'two-week-wait';

// Referral status
export type ReferralStatus = 
  | 'draft'
  | 'ready_to_send'
  | 'sent'
  | 'booked'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed';

// Ophthalmology specialties relevant to optical practices
export const OPHTHALMOLOGY_SPECIALTIES = {
  OPHTHALMOLOGY: '130', // General Ophthalmology
  OPHTHALMOLOGY_MEDICAL: '460', // Medical Ophthalmology  
  OPHTHALMOLOGY_SURGICAL: '461', // Surgical Ophthalmology
  OPTOMETRY: '653', // Optometry
  ORTHOPTICS: '655', // Orthoptics
} as const;

// Common referral reasons for eye care
export const EYE_REFERRAL_REASONS = {
  CATARACT: 'Cataract assessment and treatment',
  GLAUCOMA: 'Glaucoma assessment and management',
  DIABETIC_RETINOPATHY: 'Diabetic retinopathy screening/management',
  MACULAR_DEGENERATION: 'Age-related macular degeneration (AMD)',
  RETINAL_DETACHMENT: 'Suspected retinal detachment',
  SQUINT: 'Squint/strabismus assessment',
  VISUAL_FIELD_DEFECT: 'Visual field defect investigation',
  SUDDEN_VISION_LOSS: 'Sudden vision loss - urgent',
  RED_EYE: 'Red eye - acute',
  DOUBLE_VISION: 'Double vision (diplopia)',
  FLASHES_FLOATERS: 'Flashes and floaters',
  EYELID_ABNORMALITY: 'Eyelid abnormality',
  PAEDIATRIC: 'Paediatric eye assessment',
  LOW_VISION: 'Low vision assessment',
  OTHER: 'Other ophthalmology referral',
} as const;

// FHIR ServiceRequest resource structure
interface FhirServiceRequest {
  resourceType: 'ServiceRequest';
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error';
  intent: 'proposal' | 'plan' | 'directive' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  code?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
    identifier?: {
      system: string;
      value: string;
    };
    display?: string;
  };
  authoredOn?: string;
  requester?: {
    reference: string;
    display?: string;
  };
  performer?: Array<{
    reference: string;
    display?: string;
  }>;
  reasonCode?: Array<{
    coding?: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  }>;
  note?: Array<{
    text: string;
    time?: string;
    authorString?: string;
  }>;
  supportingInfo?: Array<{
    reference: string;
    display?: string;
  }>;
}

// Service search result
interface ServiceSearchResult {
  id: string;
  name: string;
  specialty: string;
  provider: string;
  location: string;
  distance?: number;
  waitTime?: string;
  bookable: boolean;
  acceptingReferrals: boolean;
}

// Referral creation input
export interface CreateReferralInput {
  patientNhsNumber: string;
  patientName: string;
  patientDateOfBirth: string;
  referringPractitionerId: string;
  referringPractitionerName: string;
  referringOrganisationOds: string;
  referringOrganisationName: string;
  specialty: keyof typeof OPHTHALMOLOGY_SPECIALTIES;
  priority: ReferralPriority;
  referralReason: keyof typeof EYE_REFERRAL_REASONS;
  clinicalDetails: string;
  urgencyJustification?: string;
  attachments?: Array<{
    type: 'clinical_letter' | 'test_result' | 'image' | 'other';
    title: string;
    base64Content: string;
    mimeType: string;
  }>;
  preferredServices?: string[];
}

// Referral response
export interface ReferralResponse {
  id: string;
  ubrn: string; // Unique Booking Reference Number
  status: ReferralStatus;
  createdAt: string;
  specialty: string;
  priority: ReferralPriority;
  patientNhsNumber: string;
  referringOrganisation: string;
  clinicalDetails: string;
  appointmentDetails?: {
    date: string;
    time: string;
    location: string;
    provider: string;
  };
}

/**
 * NHS e-Referral Service
 */
export class NhsEReferralService {
  /**
   * Get e-RS API URL for current environment
   */
  private getErsUrl(path: string): string {
    const env = nhsApiAuthService.getCurrentEnvironment();
    const config = NHS_API_ENVIRONMENTS[env];
    return `${config.baseUrl}${ERS_API_PATHS[env]}${path}`;
  }

  /**
   * Search for available ophthalmology services
   */
  async searchServices(params: {
    specialty: keyof typeof OPHTHALMOLOGY_SPECIALTIES;
    patientPostcode?: string;
    priority?: ReferralPriority;
    maxDistance?: number;
  }): Promise<ServiceSearchResult[]> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('specialty', OPHTHALMOLOGY_SPECIALTIES[params.specialty]);
      
      if (params.patientPostcode) {
        searchParams.append('patient-postcode', params.patientPostcode);
      }
      if (params.priority) {
        searchParams.append('priority', params.priority);
      }
      if (params.maxDistance) {
        searchParams.append('distance', params.maxDistance.toString());
      }

      const response = await nhsApiAuthService.makeAuthenticatedRequest<{
        entry?: Array<{
          resource: {
            id: string;
            name: string;
            specialty: { coding: Array<{ display: string }> };
            providedBy: { display: string };
            location: Array<{ display: string }>;
            extension?: Array<{
              url: string;
              valueQuantity?: { value: number };
              valueString?: string;
              valueBoolean?: boolean;
            }>;
          };
        }>;
      }>(this.getErsUrl(`/HealthcareService?${searchParams.toString()}`));

      if (!response.entry) {
        return [];
      }

      return response.entry.map(entry => {
        const resource = entry.resource;
        const distanceExt = resource.extension?.find(e => e.url.includes('distance'));
        const waitTimeExt = resource.extension?.find(e => e.url.includes('wait-time'));
        const bookableExt = resource.extension?.find(e => e.url.includes('bookable'));
        const acceptingExt = resource.extension?.find(e => e.url.includes('accepting'));

        return {
          id: resource.id,
          name: resource.name,
          specialty: resource.specialty?.coding?.[0]?.display || '',
          provider: resource.providedBy?.display || '',
          location: resource.location?.[0]?.display || '',
          distance: distanceExt?.valueQuantity?.value,
          waitTime: waitTimeExt?.valueString,
          bookable: bookableExt?.valueBoolean ?? true,
          acceptingReferrals: acceptingExt?.valueBoolean ?? true,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, params }, 'Service search failed');
      throw error;
    }
  }

  /**
   * Create a new e-Referral
   */
  async createReferral(input: CreateReferralInput): Promise<ReferralResponse> {
    try {
      // Build FHIR ServiceRequest
      const serviceRequest: FhirServiceRequest = {
        resourceType: 'ServiceRequest',
        status: 'draft',
        intent: 'order',
        priority: this.mapPriorityToFhir(input.priority),
        category: [{
          coding: [{
            system: 'https://fhir.nhs.uk/CodeSystem/ers-referral-category',
            code: 'referral',
            display: 'Referral'
          }]
        }],
        code: {
          coding: [{
            system: 'https://fhir.nhs.uk/CodeSystem/ers-specialty',
            code: OPHTHALMOLOGY_SPECIALTIES[input.specialty],
            display: input.specialty
          }],
          text: EYE_REFERRAL_REASONS[input.referralReason]
        },
        subject: {
          identifier: {
            system: 'https://fhir.nhs.uk/Id/nhs-number',
            value: input.patientNhsNumber
          },
          display: input.patientName
        },
        authoredOn: new Date().toISOString(),
        requester: {
          reference: `Practitioner/${input.referringPractitionerId}`,
          display: input.referringPractitionerName
        },
        reasonCode: [{
          coding: [{
            system: 'https://fhir.nhs.uk/CodeSystem/ers-referral-reason',
            code: input.referralReason,
            display: EYE_REFERRAL_REASONS[input.referralReason]
          }],
          text: input.clinicalDetails
        }],
        note: [{
          text: input.clinicalDetails,
          time: new Date().toISOString(),
          authorString: input.referringPractitionerName
        }]
      };

      // Add urgency justification if urgent/2WW
      if (input.priority !== 'routine' && input.urgencyJustification) {
        serviceRequest.note?.push({
          text: `Urgency justification: ${input.urgencyJustification}`,
          time: new Date().toISOString(),
          authorString: input.referringPractitionerId
        });
      }

      // Create the referral
      const response = await nhsApiAuthService.makeAuthenticatedRequest<{
        id: string;
        identifier: Array<{ value: string }>;
        status: string;
        meta: { lastUpdated: string };
      }>(this.getErsUrl('/ServiceRequest'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(serviceRequest),
      });

      // Extract UBRN from response
      const ubrn = response.identifier?.find(
        id => id.value?.startsWith('UBRN')
      )?.value || response.id;

      const referralResponse: ReferralResponse = {
        id: response.id,
        ubrn,
        status: this.mapFhirStatusToReferral(response.status),
        createdAt: response.meta?.lastUpdated || new Date().toISOString(),
        specialty: input.specialty,
        priority: input.priority,
        patientNhsNumber: input.patientNhsNumber,
        referringOrganisation: input.referringOrganisationName,
        clinicalDetails: input.clinicalDetails,
      };

      logger.info({ 
        referralId: referralResponse.id, 
        ubrn: referralResponse.ubrn,
        priority: input.priority 
      }, 'e-Referral created');

      return referralResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, patientNhs: input.patientNhsNumber.slice(-4) }, 'Create referral failed');
      throw error;
    }
  }

  /**
   * Get referral by ID
   */
  async getReferral(referralId: string): Promise<ReferralResponse | null> {
    try {
      const response = await nhsApiAuthService.makeAuthenticatedRequest<{
        id: string;
        identifier: Array<{ value: string }>;
        status: string;
        priority: string;
        subject: { identifier: { value: string } };
        requester: { display: string };
        code: { text: string };
        meta: { lastUpdated: string };
      }>(this.getErsUrl(`/ServiceRequest/${referralId}`));

      const ubrn = response.identifier?.find(
        id => id.value?.startsWith('UBRN')
      )?.value || response.id;

      return {
        id: response.id,
        ubrn,
        status: this.mapFhirStatusToReferral(response.status),
        createdAt: response.meta?.lastUpdated || '',
        specialty: '', // Would need to parse from code
        priority: this.mapFhirPriorityToReferral(response.priority),
        patientNhsNumber: response.subject?.identifier?.value || '',
        referringOrganisation: response.requester?.display || '',
        clinicalDetails: response.code?.text || '',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('404')) {
        return null;
      }
      logger.error({ error: message, referralId }, 'Get referral failed');
      throw error;
    }
  }

  /**
   * Get referrals for a patient
   */
  async getPatientReferrals(nhsNumber: string): Promise<ReferralResponse[]> {
    try {
      const response = await nhsApiAuthService.makeAuthenticatedRequest<{
        entry?: Array<{ resource: any }>;
      }>(this.getErsUrl(`/ServiceRequest?patient:identifier=https://fhir.nhs.uk/Id/nhs-number|${nhsNumber}`));

      if (!response.entry) {
        return [];
      }

      return response.entry.map(entry => {
        const resource = entry.resource;
        const ubrn = resource.identifier?.find(
          (id: any) => id.value?.startsWith('UBRN')
        )?.value || resource.id;

        return {
          id: resource.id,
          ubrn,
          status: this.mapFhirStatusToReferral(resource.status),
          createdAt: resource.meta?.lastUpdated || '',
          specialty: resource.code?.coding?.[0]?.display || '',
          priority: this.mapFhirPriorityToReferral(resource.priority),
          patientNhsNumber: nhsNumber,
          referringOrganisation: resource.requester?.display || '',
          clinicalDetails: resource.code?.text || '',
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, nhsNumber: nhsNumber.slice(-4) }, 'Get patient referrals failed');
      throw error;
    }
  }

  /**
   * Cancel a referral
   */
  async cancelReferral(referralId: string, reason: string): Promise<boolean> {
    try {
      await nhsApiAuthService.makeAuthenticatedRequest(
        this.getErsUrl(`/ServiceRequest/${referralId}`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json-patch+json',
          },
          body: JSON.stringify([
            { op: 'replace', path: '/status', value: 'revoked' },
            { op: 'add', path: '/note/-', value: { text: `Cancelled: ${reason}` } }
          ]),
        }
      );

      logger.info({ referralId, reason }, 'Referral cancelled');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, referralId }, 'Cancel referral failed');
      return false;
    }
  }

  /**
   * Submit a referral for processing
   */
  async submitReferral(referralId: string, selectedServiceId?: string): Promise<ReferralResponse> {
    try {
      const patches: any[] = [
        { op: 'replace', path: '/status', value: 'active' }
      ];

      if (selectedServiceId) {
        patches.push({
          op: 'add',
          path: '/performer/-',
          value: { reference: `HealthcareService/${selectedServiceId}` }
        });
      }

      const response = await nhsApiAuthService.makeAuthenticatedRequest<any>(
        this.getErsUrl(`/ServiceRequest/${referralId}`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json-patch+json',
          },
          body: JSON.stringify(patches),
        }
      );

      logger.info({ referralId, serviceId: selectedServiceId }, 'Referral submitted');

      return {
        id: response.id,
        ubrn: response.identifier?.find((id: any) => id.value?.startsWith('UBRN'))?.value || response.id,
        status: 'sent',
        createdAt: response.meta?.lastUpdated || '',
        specialty: '',
        priority: this.mapFhirPriorityToReferral(response.priority),
        patientNhsNumber: response.subject?.identifier?.value || '',
        referringOrganisation: response.requester?.display || '',
        clinicalDetails: response.code?.text || '',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, referralId }, 'Submit referral failed');
      throw error;
    }
  }

  /**
   * Check e-RS service availability
   */
  async healthCheck(): Promise<{
    available: boolean;
    message: string;
  }> {
    try {
      const connectionTest = await nhsApiAuthService.testConnection();
      
      return {
        available: connectionTest.success,
        message: connectionTest.success 
          ? 'e-Referral Service is available'
          : connectionTest.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        available: false,
        message,
      };
    }
  }

  // Helper methods
  private mapPriorityToFhir(priority: ReferralPriority): 'routine' | 'urgent' | 'asap' | 'stat' {
    switch (priority) {
      case 'routine': return 'routine';
      case 'urgent': return 'urgent';
      case 'two-week-wait': return 'asap';
      default: return 'routine';
    }
  }

  private mapFhirPriorityToReferral(priority: string): ReferralPriority {
    switch (priority) {
      case 'routine': return 'routine';
      case 'urgent': return 'urgent';
      case 'asap':
      case 'stat': return 'two-week-wait';
      default: return 'routine';
    }
  }

  private mapFhirStatusToReferral(status: string): ReferralStatus {
    switch (status) {
      case 'draft': return 'draft';
      case 'active': return 'sent';
      case 'on-hold': return 'sent';
      case 'revoked': return 'cancelled';
      case 'completed': return 'completed';
      case 'entered-in-error': return 'cancelled';
      default: return 'draft';
    }
  }
}

// Singleton instance
export const nhsEReferralService = new NhsEReferralService();
