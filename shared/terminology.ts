/**
 * Clinical Terminology Standards
 * 
 * UK College of Optometrists compliant terminology for eye prescriptions
 * BS EN ISO 21987:2017 compliance
 */

export const EYE_TERMINOLOGY = {
  // Eye designation - UK Standard (College of Optometrists)
  RIGHT: 'R',
  LEFT: 'L',
  RIGHT_FULL: 'Right',
  LEFT_FULL: 'Left',
  RIGHT_EYE: 'Right Eye',
  LEFT_EYE: 'Left Eye',
  BOTH_EYES: 'Both Eyes',
  
  // Prescription fields
  SPHERE: 'Sphere',
  CYLINDER: 'Cylinder',
  AXIS: 'Axis',
  ADD: 'Add',
  PRISM: 'Prism',
  BASE: 'Base',
  
  // Visual acuity
  DISTANCE_VA: 'Distance VA',
  NEAR_VA: 'Near VA',
  
  // Common labels with eye designation
  RIGHT_SPHERE: 'R Sphere',
  LEFT_SPHERE: 'L Sphere',
  RIGHT_CYLINDER: 'R Cylinder',
  LEFT_CYLINDER: 'L Cylinder',
  RIGHT_AXIS: 'R Axis',
  LEFT_AXIS: 'L Axis',
  RIGHT_ADD: 'R Add',
  LEFT_ADD: 'L Add',
  RIGHT_PRISM: 'R Prism',
  LEFT_PRISM: 'L Prism',
  RIGHT_VA: 'R VA',
  LEFT_VA: 'L VA',
} as const;

/**
 * US Terminology (Legacy reference - not used in UK deployment)
 */
export const US_TERMINOLOGY = {
  RIGHT: 'OD',
  LEFT: 'OS',
  BOTH: 'OU',
  RIGHT_FULL: 'Oculus Dexter',
  LEFT_FULL: 'Oculus Sinister',
  BOTH_FULL: 'Oculus Uterque',
} as const;

/**
 * Helper function to format eye designation consistently
 */
export function formatEyeLabel(eye: 'right' | 'left' | 'both', format: 'short' | 'full' = 'short'): string {
  if (format === 'short') {
    return eye === 'right' ? EYE_TERMINOLOGY.RIGHT : 
           eye === 'left' ? EYE_TERMINOLOGY.LEFT : 
           EYE_TERMINOLOGY.BOTH_EYES;
  }
  
  return eye === 'right' ? EYE_TERMINOLOGY.RIGHT_EYE : 
         eye === 'left' ? EYE_TERMINOLOGY.LEFT_EYE : 
         EYE_TERMINOLOGY.BOTH_EYES;
}

/**
 * Format prescription field with eye designation
 */
export function formatPrescriptionField(eye: 'right' | 'left', field: keyof typeof EYE_TERMINOLOGY): string {
  const eyePrefix = eye === 'right' ? EYE_TERMINOLOGY.RIGHT : EYE_TERMINOLOGY.LEFT;
  const fieldName = EYE_TERMINOLOGY[field] || field;
  return `${eyePrefix} ${fieldName}`;
}

/**
 * Prescription format helper (BS EN ISO 21987:2017 compliant)
 */
export interface PrescriptionDisplay {
  eye: 'R' | 'L';
  sphere?: number | null;
  cylinder?: number | null;
  axis?: number | null;
  add?: number | null;
  prism?: number | null;
  base?: string | null;
}

/**
 * Format prescription for display (UK standard)
 */
export function formatPrescriptionDisplay(prescription: PrescriptionDisplay): string {
  const parts: string[] = [`${prescription.eye}:`];
  
  if (prescription.sphere !== null && prescription.sphere !== undefined) {
    parts.push(`Sph ${prescription.sphere >= 0 ? '+' : ''}${prescription.sphere.toFixed(2)}`);
  }
  
  if (prescription.cylinder !== null && prescription.cylinder !== undefined) {
    parts.push(`Cyl ${prescription.cylinder >= 0 ? '+' : ''}${prescription.cylinder.toFixed(2)}`);
  }
  
  if (prescription.axis !== null && prescription.axis !== undefined) {
    parts.push(`Axis ${prescription.axis}°`);
  }
  
  if (prescription.add !== null && prescription.add !== undefined) {
    parts.push(`Add ${prescription.add >= 0 ? '+' : ''}${prescription.add.toFixed(2)}`);
  }
  
  if (prescription.prism !== null && prescription.prism !== undefined && prescription.base) {
    parts.push(`Prism ${prescription.prism.toFixed(2)}Δ ${prescription.base}`);
  }
  
  return parts.join(' ');
}

/**
 * GOC (General Optical Council) Prescription Requirements
 */
export const GOC_REQUIREMENTS = {
  EXPIRY_YEARS: 2,
  REQUIRED_FIELDS: ['practitionerGocNumber', 'dateOfExamination', 'prescriptionDate'],
  TERMINOLOGY_STANDARD: 'UK (R/L notation)',
} as const;

/**
 * College of Optometrists Standards
 */
export const COLLEGE_STANDARDS = {
  TERMINOLOGY: 'R/L (Right/Left)',
  FORMAT_STANDARD: 'BS EN ISO 21987:2017',
  DOCUMENTATION: 'https://www.college-optometrists.org/guidance',
} as const;
