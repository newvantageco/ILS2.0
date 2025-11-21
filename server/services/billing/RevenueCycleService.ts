/**
 * Revenue Cycle Management Service
 * Automated billing, claims, and denial management
 * 
 * Research: 35% reduction in claim denials with automated RCM
 */

import logger from '../../utils/logger';

export interface InsuranceEligibility {
  patientId: string;
  insuranceProvider: string;
  policyNumber: string;
  isActive: boolean;
  coverageType: 'vision' | 'medical' | 'both';
  copay: number;
  deductible: number;
  deductibleMet: number;
  outOfPocketMax: number;
  outOfPocketMet: number;
  visionBenefits: {
    examCovered: boolean;
    examFrequency: string; // e.g., "12 months"
    frameAllowance: number;
    lensAllowance: number;
    contactsAllowance: number;
  };
  lastVerified: Date;
}

export interface ClaimSubmission {
  id: string;
  patientId: string;
  providerId: string;
  serviceDate: Date;
  diagnosisCodes: string[]; // ICD-10
  procedureCodes: Array<{
    code: string; // CPT code
    description: string;
    quantity: number;
    charge: number;
  }>;
  totalCharge: number;
  insurancePortion: number;
  patientPortion: number;
  status: 'draft' | 'ready' | 'submitted' | 'accepted' | 'rejected' | 'paid' | 'partial_paid';
  submittedDate?: Date;
  paidDate?: Date;
  denialReason?: string;
  errors: string[];
}

export interface DenialManagement {
  claimId: string;
  denialCode: string;
  denialReason: string;
  denialCategory: 'coding_error' | 'eligibility' | 'authorization' | 'timely_filing' | 'other';
  appealDeadline: Date;
  appealStatus: 'pending' | 'in_progress' | 'submitted' | 'won' | 'lost';
  appealNotes?: string;
  resolution?: string;
}

export class RevenueCycleService {
  /**
   * Verify insurance eligibility in real-time
   * Integrates with insurance providers' APIs
   */
  async verifyEligibility(
    patientId: string,
    insuranceProvider: string,
    policyNumber: string
  ): Promise<InsuranceEligibility> {
    try {
      // In production: Call insurance provider API (e.g., Change Healthcare, Availity)
      // For now, return mock data
      
      logger.info('Verifying insurance eligibility', { patientId, insuranceProvider });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock eligibility response
      const eligibility: InsuranceEligibility = {
        patientId,
        insuranceProvider,
        policyNumber,
        isActive: true,
        coverageType: 'both',
        copay: 25,
        deductible: 1000,
        deductibleMet: 300,
        outOfPocketMax: 5000,
        outOfPocketMet: 800,
        visionBenefits: {
          examCovered: true,
          examFrequency: '12 months',
          frameAllowance: 150,
          lensAllowance: 100,
          contactsAllowance: 120,
        },
        lastVerified: new Date(),
      };

      logger.info('Insurance eligibility verified', { patientId, isActive: eligibility.isActive });

      return eligibility;
    } catch (error) {
      logger.error('Error verifying eligibility', { error, patientId });
      throw new Error('Failed to verify insurance eligibility');
    }
  }

  /**
   * Auto-code procedures from clinical documentation
   * Uses AI/NLP to extract billable services
   */
  async autoCodeProcedures(clinicalNote: string): Promise<Array<{
    code: string;
    description: string;
    confidence: number;
  }>> {
    try {
      logger.info('Auto-coding procedures from clinical note');

      // In production: Use NLP/AI to extract codes from notes
      // For now, use simple keyword matching

      const codes: Array<{ code: string; description: string; confidence: number }> = [];

      // Comprehensive eye exam
      if (clinicalNote.toLowerCase().includes('comprehensive') || 
          clinicalNote.toLowerCase().includes('complete exam')) {
        codes.push({
          code: '92004', // Comprehensive eye exam, new patient
          description: 'Ophthalmological services: comprehensive, new patient',
          confidence: 0.9,
        });
      }

      // Refraction
      if (clinicalNote.toLowerCase().includes('refraction') ||
          clinicalNote.toLowerCase().includes('prescription')) {
        codes.push({
          code: '92015',
          description: 'Refraction',
          confidence: 0.85,
        });
      }

      // Visual field testing
      if (clinicalNote.toLowerCase().includes('visual field') ||
          clinicalNote.toLowerCase().includes('perimetry')) {
        codes.push({
          code: '92083',
          description: 'Visual field examination',
          confidence: 0.8,
        });
      }

      // Tonometry
      if (clinicalNote.toLowerCase().includes('iop') ||
          clinicalNote.toLowerCase().includes('tonometry')) {
        codes.push({
          code: '92100',
          description: 'Tonometry',
          confidence: 0.85,
        });
      }

      // OCT
      if (clinicalNote.toLowerCase().includes('oct') ||
          clinicalNote.toLowerCase().includes('optical coherence')) {
        codes.push({
          code: '92134',
          description: 'OCT imaging',
          confidence: 0.9,
        });
      }

      logger.info('Auto-coding complete', { codesFound: codes.length });

      return codes;
    } catch (error) {
      logger.error('Error auto-coding procedures', { error });
      throw new Error('Failed to auto-code procedures');
    }
  }

  /**
   * Scrub claim before submission
   * Validates coding accuracy and completeness
   */
  async scrubClaim(claim: Partial<ClaimSubmission>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    confidence: number;
  }> {
    try {
      logger.info('Scrubbing claim', { claimId: claim.id });

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate required fields
      if (!claim.patientId) errors.push('Patient ID is required');
      if (!claim.providerId) errors.push('Provider ID is required');
      if (!claim.serviceDate) errors.push('Service date is required');
      if (!claim.diagnosisCodes || claim.diagnosisCodes.length === 0) {
        errors.push('At least one diagnosis code is required');
      }
      if (!claim.procedureCodes || claim.procedureCodes.length === 0) {
        errors.push('At least one procedure code is required');
      }

      // Validate diagnosis codes format (ICD-10)
      if (claim.diagnosisCodes) {
        for (const code of claim.diagnosisCodes) {
          if (!/^[A-Z]\d{2}(\.\d{1,2})?$/.test(code)) {
            errors.push(`Invalid ICD-10 code format: ${code}`);
          }
        }
      }

      // Validate procedure codes format (CPT)
      if (claim.procedureCodes) {
        for (const proc of claim.procedureCodes) {
          if (!/^\d{5}$/.test(proc.code)) {
            errors.push(`Invalid CPT code format: ${proc.code}`);
          }
          if (proc.charge <= 0) {
            errors.push(`Invalid charge for ${proc.code}`);
          }
        }
      }

      // Check for common denial reasons
      if (claim.serviceDate) {
        const serviceDate = new Date(claim.serviceDate);
        const daysSinceService = (Date.now() - serviceDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Timely filing warning (usually 90 days)
        if (daysSinceService > 60) {
          warnings.push('Service date is more than 60 days old - check timely filing limits');
        }
      }

      // Check for modifiers that might be needed
      if (claim.procedureCodes) {
        const hasMultipleProcedures = claim.procedureCodes.length > 1;
        if (hasMultipleProcedures) {
          warnings.push('Multiple procedures - consider adding modifier 59 for distinct procedures');
        }
      }

      // Calculate confidence score
      const totalChecks = 10;
      const failedChecks = errors.length;
      const warningCount = warnings.length;
      const confidence = Math.max(0, (totalChecks - failedChecks - (warningCount * 0.5)) / totalChecks);

      logger.info('Claim scrubbing complete', {
        claimId: claim.id,
        isValid: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length,
        confidence,
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        confidence,
      };
    } catch (error) {
      logger.error('Error scrubbing claim', { error });
      throw new Error('Failed to scrub claim');
    }
  }

  /**
   * Submit claim electronically
   * Integrates with clearinghouses (e.g., Change Healthcare)
   */
  async submitClaim(claim: ClaimSubmission): Promise<{
    success: boolean;
    claimId: string;
    confirmationNumber?: string;
    error?: string;
  }> {
    try {
      logger.info('Submitting claim', { claimId: claim.id });

      // Scrub claim first
      const scrubResult = await this.scrubClaim(claim);
      
      if (!scrubResult.isValid) {
        return {
          success: false,
          claimId: claim.id,
          error: `Claim validation failed: ${scrubResult.errors.join(', ')}`,
        };
      }

      // In production: Submit to clearinghouse API
      // For now, simulate submission

      await new Promise(resolve => setTimeout(resolve, 1000));

      const confirmationNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      logger.info('Claim submitted successfully', {
        claimId: claim.id,
        confirmationNumber,
      });

      return {
        success: true,
        claimId: claim.id,
        confirmationNumber,
      };
    } catch (error) {
      logger.error('Error submitting claim', { error, claimId: claim.id });
      return {
        success: false,
        claimId: claim.id,
        error: 'Failed to submit claim',
      };
    }
  }

  /**
   * Track claim status
   * Polls clearinghouse for claim updates
   */
  async trackClaimStatus(claimId: string): Promise<{
    status: ClaimSubmission['status'];
    lastUpdate: Date;
    paymentAmount?: number;
    paymentDate?: Date;
    denialReason?: string;
  }> {
    try {
      logger.info('Tracking claim status', { claimId });

      // In production: Query clearinghouse API
      // For now, return mock status

      await new Promise(resolve => setTimeout(resolve, 300));

      // Simulate various statuses
      const statuses: ClaimSubmission['status'][] = ['submitted', 'accepted', 'paid'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        status: randomStatus,
        lastUpdate: new Date(),
        paymentAmount: randomStatus === 'paid' ? 150 : undefined,
        paymentDate: randomStatus === 'paid' ? new Date() : undefined,
      };
    } catch (error) {
      logger.error('Error tracking claim status', { error, claimId });
      throw new Error('Failed to track claim status');
    }
  }

  /**
   * Process ERA (Electronic Remittance Advice)
   * Auto-post payments from insurance
   */
  async processERA(eraFile: string): Promise<{
    claimsProcessed: number;
    totalPayment: number;
    denials: number;
    adjustments: number;
  }> {
    try {
      logger.info('Processing ERA file');

      // In production: Parse 835 EDI file
      // Extract payment information
      // Match to claims
      // Post payments

      // Mock processing
      const result = {
        claimsProcessed: 15,
        totalPayment: 3450.00,
        denials: 2,
        adjustments: 3,
      };

      logger.info('ERA processing complete', result);

      return result;
    } catch (error) {
      logger.error('Error processing ERA', { error });
      throw new Error('Failed to process ERA');
    }
  }

  /**
   * Analyze denial and suggest appeal strategy
   * AI-powered denial management
   */
  async analyzeDenial(
    claimId: string,
    denialCode: string,
    denialReason: string
  ): Promise<{
    category: DenialManagement['denialCategory'];
    appealWorthiness: 'high' | 'medium' | 'low';
    suggestedActions: string[];
    appealTemplate?: string;
  }> {
    try {
      logger.info('Analyzing denial', { claimId, denialCode });

      // Categorize denial
      let category: DenialManagement['denialCategory'] = 'other';
      let appealWorthiness: 'high' | 'medium' | 'low' = 'medium';
      const suggestedActions: string[] = [];

      // Common denial codes and responses
      if (denialCode === 'CO-16' || denialReason.includes('authorization')) {
        category = 'authorization';
        appealWorthiness = 'high';
        suggestedActions.push('Obtain retroactive authorization');
        suggestedActions.push('Submit authorization documentation');
      } else if (denialCode === 'CO-18' || denialReason.includes('duplicate')) {
        category = 'coding_error';
        appealWorthiness = 'low';
        suggestedActions.push('Verify claim is not a duplicate');
        suggestedActions.push('Add modifier if distinct service');
      } else if (denialReason.includes('eligibility') || denialReason.includes('not covered')) {
        category = 'eligibility';
        appealWorthiness = 'medium';
        suggestedActions.push('Verify patient eligibility on date of service');
        suggestedActions.push('Check for secondary insurance');
      } else if (denialReason.includes('timely filing')) {
        category = 'timely_filing';
        appealWorthiness = 'low';
        suggestedActions.push('Document reason for late filing');
        suggestedActions.push('Request waiver if applicable');
      } else if (denialReason.includes('code') || denialReason.includes('invalid')) {
        category = 'coding_error';
        appealWorthiness = 'high';
        suggestedActions.push('Review and correct procedure codes');
        suggestedActions.push('Ensure diagnosis supports procedure');
      }

      // Generate appeal template if worthwhile
      let appealTemplate: string | undefined;
      if (appealWorthiness === 'high' || appealWorthiness === 'medium') {
        appealTemplate = this.generateAppealTemplate(category, denialReason);
      }

      logger.info('Denial analysis complete', {
        claimId,
        category,
        appealWorthiness,
        actionCount: suggestedActions.length,
      });

      return {
        category,
        appealWorthiness,
        suggestedActions,
        appealTemplate,
      };
    } catch (error) {
      logger.error('Error analyzing denial', { error, claimId });
      throw new Error('Failed to analyze denial');
    }
  }

  /**
   * Generate appeal letter template
   */
  private generateAppealTemplate(
    category: DenialManagement['denialCategory'],
    denialReason: string
  ): string {
    const date = new Date().toLocaleDateString('en-GB');
    
    return `
[Practice Letterhead]

${date}

[Insurance Company Name]
Appeals Department
[Address]

RE: Appeal of Claim Denial
Patient: [Patient Name]
Policy Number: [Policy Number]
Claim Number: [Claim Number]
Date of Service: [DOS]

Dear Appeals Department:

I am writing to appeal the denial of the above-referenced claim, which was denied for the following reason: "${denialReason}"

[Category-specific argument based on ${category}]

${category === 'coding_error' ? `
The procedure codes submitted accurately reflect the services provided. Supporting documentation is enclosed demonstrating medical necessity and appropriate coding.
` : ''}

${category === 'authorization' ? `
The service was medically necessary and authorization was obtained [or should be granted retroactively due to emergent nature]. Documentation is enclosed.
` : ''}

${category === 'eligibility' ? `
The patient was eligible for coverage on the date of service. Please review the enclosed eligibility verification documentation.
` : ''}

We respectfully request that you review this claim and reverse the denial. All supporting documentation is enclosed for your review.

Please contact our office if you require any additional information.

Sincerely,

[Provider Name]
[Practice Name]
[Phone Number]

Enclosures: [List of enclosed documents]
    `.trim();
  }

  /**
   * Calculate revenue cycle metrics
   */
  async calculateMetrics(companyId: string, startDate: Date, endDate: Date): Promise<{
    totalClaims: number;
    acceptedClaims: number;
    deniedClaims: number;
    denialRate: number;
    averageDaysToPayment: number;
    collectionRate: number;
    outstandingAR: number;
    over90DaysAR: number;
  }> {
    try {
      logger.info('Calculating RCM metrics', { companyId, startDate, endDate });

      // In production: Query database for actual metrics
      // For now, return mock metrics

      const metrics = {
        totalClaims: 450,
        acceptedClaims: 398,
        deniedClaims: 52,
        denialRate: 11.6, // percentage
        averageDaysToPayment: 28,
        collectionRate: 94.5, // percentage
        outstandingAR: 45000,
        over90DaysAR: 3500,
      };

      logger.info('RCM metrics calculated', metrics);

      return metrics;
    } catch (error) {
      logger.error('Error calculating RCM metrics', { error });
      throw new Error('Failed to calculate metrics');
    }
  }
}

export const revenueCycleService = new RevenueCycleService();
