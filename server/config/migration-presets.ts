/**
 * Migration Presets for Common Optical Practice Management Systems
 *
 * Pre-configured field mappings for:
 * - Optix
 * - Occuco
 * - Acuity
 * - Other common platforms
 */

import type { MigrationPreset } from '@shared/schema-migrations';

/**
 * Optix Patient Field Mappings
 */
export const optixPatientMappings = [
  { sourceField: 'patient_id', targetField: 'externalId', transform: 'trim', required: false },
  { sourceField: 'first_name', targetField: 'firstName', transform: 'trim', required: true },
  { sourceField: 'last_name', targetField: 'lastName', transform: 'trim', required: true },
  { sourceField: 'dob', targetField: 'dateOfBirth', transform: 'date_format', required: true },
  { sourceField: 'email', targetField: 'email', transform: 'lowercase', required: false },
  { sourceField: 'mobile', targetField: 'mobilePhone', transform: 'phone_format', required: false },
  { sourceField: 'phone', targetField: 'phone', transform: 'phone_format', required: false },
  { sourceField: 'address_1', targetField: 'addressLine1', transform: 'trim', required: false },
  { sourceField: 'address_2', targetField: 'addressLine2', transform: 'trim', required: false },
  { sourceField: 'city', targetField: 'city', transform: 'trim', required: false },
  { sourceField: 'postcode', targetField: 'postcode', transform: 'uppercase', required: false },
  { sourceField: 'nhs_number', targetField: 'nhsNumber', transform: 'trim', required: false },
  { sourceField: 'occupation', targetField: 'occupation', transform: 'trim', required: false },
  { sourceField: 'gp_name', targetField: 'gpName', transform: 'trim', required: false },
  { sourceField: 'medical_history', targetField: 'medicalHistory', transform: 'json_parse', required: false },
  { sourceField: 'allergies', targetField: 'allergies', transform: 'trim', required: false },
  { sourceField: 'contact_lens_wearer', targetField: 'contactLensWearer', transform: 'to_boolean', required: false },
];

/**
 * Optix Examination Field Mappings
 */
export const optixExaminationMappings = [
  { sourceField: 'exam_id', targetField: 'externalId', transform: 'trim', required: false },
  { sourceField: 'patient_id', targetField: 'patientExternalId', transform: 'trim', required: true },
  { sourceField: 'exam_date', targetField: 'examinationDate', transform: 'date_format', required: true },
  { sourceField: 'reason_for_visit', targetField: 'reasonForVisit', transform: 'trim', required: false },
  { sourceField: 'va_od_unaided', targetField: 'odVisualAcuityUnaided', transform: 'trim', required: false },
  { sourceField: 'va_os_unaided', targetField: 'osVisualAcuityUnaided', transform: 'trim', required: false },
  { sourceField: 'notes', targetField: 'notes', transform: 'trim', required: false },
  { sourceField: 'gos_form', targetField: 'gosFormType', transform: 'trim', required: false },
];

/**
 * Optix Prescription Field Mappings
 */
export const optixPrescriptionMappings = [
  { sourceField: 'rx_id', targetField: 'externalId', transform: 'trim', required: false },
  { sourceField: 'patient_id', targetField: 'patientExternalId', transform: 'trim', required: true },
  { sourceField: 'exam_id', targetField: 'examinationExternalId', transform: 'trim', required: false },
  { sourceField: 'issue_date', targetField: 'issueDate', transform: 'date_format', required: true },
  { sourceField: 'expiry_date', targetField: 'expiryDate', transform: 'date_format', required: false },
  { sourceField: 'od_sph', targetField: 'odSphere', transform: 'to_number', required: false },
  { sourceField: 'od_cyl', targetField: 'odCylinder', transform: 'to_number', required: false },
  { sourceField: 'od_axis', targetField: 'odAxis', transform: 'to_number', required: false },
  { sourceField: 'od_add', targetField: 'odAdd', transform: 'to_number', required: false },
  { sourceField: 'os_sph', targetField: 'osSphere', transform: 'to_number', required: false },
  { sourceField: 'os_cyl', targetField: 'osCylinder', transform: 'to_number', required: false },
  { sourceField: 'os_axis', targetField: 'osAxis', transform: 'to_number', required: false },
  { sourceField: 'os_add', targetField: 'osAdd', transform: 'to_number', required: false },
  { sourceField: 'pd', targetField: 'binocularPd', transform: 'to_number', required: false },
];

/**
 * Occuco Patient Field Mappings
 */
export const occucoPatientMappings = [
  { sourceField: 'PatientID', targetField: 'externalId', transform: 'trim', required: false },
  { sourceField: 'FirstName', targetField: 'firstName', transform: 'trim', required: true },
  { sourceField: 'Surname', targetField: 'lastName', transform: 'trim', required: true },
  { sourceField: 'DateOfBirth', targetField: 'dateOfBirth', transform: 'date_format', required: true },
  { sourceField: 'Email', targetField: 'email', transform: 'lowercase', required: false },
  { sourceField: 'MobileNumber', targetField: 'mobilePhone', transform: 'phone_format', required: false },
  { sourceField: 'HomeNumber', targetField: 'phone', transform: 'phone_format', required: false },
  { sourceField: 'AddressLine1', targetField: 'addressLine1', transform: 'trim', required: false },
  { sourceField: 'AddressLine2', targetField: 'addressLine2', transform: 'trim', required: false },
  { sourceField: 'Town', targetField: 'city', transform: 'trim', required: false },
  { sourceField: 'County', targetField: 'county', transform: 'trim', required: false },
  { sourceField: 'Postcode', targetField: 'postcode', transform: 'uppercase', required: false },
  { sourceField: 'NHSNumber', targetField: 'nhsNumber', transform: 'trim', required: false },
  { sourceField: 'Occupation', targetField: 'occupation', transform: 'trim', required: false },
  { sourceField: 'GPName', targetField: 'gpName', transform: 'trim', required: false },
  { sourceField: 'GPSurgery', targetField: 'gpPractice', transform: 'trim', required: false },
];

/**
 * Occuco Examination Field Mappings
 */
export const occucoExaminationMappings = [
  { sourceField: 'ExamID', targetField: 'externalId', transform: 'trim', required: false },
  { sourceField: 'PatientID', targetField: 'patientExternalId', transform: 'trim', required: true },
  { sourceField: 'ExamDate', targetField: 'examinationDate', transform: 'date_format', required: true },
  { sourceField: 'ReasonForVisit', targetField: 'reasonForVisit', transform: 'trim', required: false },
  { sourceField: 'VARight', targetField: 'odVisualAcuityUnaided', transform: 'trim', required: false },
  { sourceField: 'VALeft', targetField: 'osVisualAcuityUnaided', transform: 'trim', required: false },
  { sourceField: 'ClinicalNotes', targetField: 'notes', transform: 'trim', required: false },
  { sourceField: 'GOSFormType', targetField: 'gosFormType', transform: 'trim', required: false },
];

/**
 * Acuity Patient Field Mappings
 */
export const acuityPatientMappings = [
  { sourceField: 'id', targetField: 'externalId', transform: 'trim', required: false },
  { sourceField: 'firstName', targetField: 'firstName', transform: 'trim', required: true },
  { sourceField: 'lastName', targetField: 'lastName', transform: 'trim', required: true },
  { sourceField: 'birthDate', targetField: 'dateOfBirth', transform: 'date_format', required: true },
  { sourceField: 'email', targetField: 'email', transform: 'lowercase', required: false },
  { sourceField: 'phone', targetField: 'phone', transform: 'phone_format', required: false },
  { sourceField: 'cellPhone', targetField: 'mobilePhone', transform: 'phone_format', required: false },
  { sourceField: 'address', targetField: 'addressLine1', transform: 'trim', required: false },
  { sourceField: 'city', targetField: 'city', transform: 'trim', required: false },
  { sourceField: 'state', targetField: 'county', transform: 'trim', required: false },
  { sourceField: 'zip', targetField: 'postcode', transform: 'trim', required: false },
  { sourceField: 'medicalHistory', targetField: 'medicalHistory', transform: 'json_parse', required: false },
  { sourceField: 'allergies', targetField: 'allergies', transform: 'trim', required: false },
];

/**
 * Default migration presets
 */
export const defaultMigrationPresets: Partial<MigrationPreset>[] = [
  // ========== OPTIX PRESETS ==========
  {
    name: 'Optix Patient Import',
    description: 'Import patient records from Optix practice management system',
    sourceSystem: 'optix',
    version: '1.0',
    dataType: 'patients',
    fieldMappings: optixPatientMappings,
    transformations: {
      dateFormat: 'DD/MM/YYYY', // Optix uses UK date format
      phoneFormat: 'UK',
      nameCase: 'title', // Title case for names
    },
    validationRules: {
      requiredFields: ['firstName', 'lastName', 'dateOfBirth'],
      uniqueFields: ['nhsNumber'],
    },
    defaultOptions: {
      skipDuplicates: true,
      updateExisting: false,
      batchSize: 100,
      continueOnError: true,
    },
    isPlatformDefault: true,
    active: true,
  },
  {
    name: 'Optix Examination Import',
    description: 'Import eye examination records from Optix',
    sourceSystem: 'optix',
    version: '1.0',
    dataType: 'examinations',
    fieldMappings: optixExaminationMappings,
    transformations: {
      dateFormat: 'DD/MM/YYYY',
    },
    validationRules: {
      requiredFields: ['patientExternalId', 'examinationDate'],
    },
    defaultOptions: {
      skipDuplicates: true,
      updateExisting: false,
      batchSize: 100,
      continueOnError: true,
    },
    isPlatformDefault: true,
    active: true,
  },
  {
    name: 'Optix Prescription Import',
    description: 'Import prescription records from Optix',
    sourceSystem: 'optix',
    version: '1.0',
    dataType: 'prescriptions',
    fieldMappings: optixPrescriptionMappings,
    transformations: {
      dateFormat: 'DD/MM/YYYY',
      decimalPlaces: 2,
    },
    validationRules: {
      requiredFields: ['patientExternalId', 'issueDate'],
    },
    defaultOptions: {
      skipDuplicates: true,
      updateExisting: false,
      batchSize: 100,
      continueOnError: true,
    },
    isPlatformDefault: true,
    active: true,
  },

  // ========== OCCUCO PRESETS ==========
  {
    name: 'Occuco Patient Import',
    description: 'Import patient records from Occuco practice management system',
    sourceSystem: 'occuco',
    version: '1.0',
    dataType: 'patients',
    fieldMappings: occucoPatientMappings,
    transformations: {
      dateFormat: 'DD/MM/YYYY',
      phoneFormat: 'UK',
      nameCase: 'title',
    },
    validationRules: {
      requiredFields: ['FirstName', 'Surname', 'DateOfBirth'],
      uniqueFields: ['NHSNumber'],
    },
    defaultOptions: {
      skipDuplicates: true,
      updateExisting: false,
      batchSize: 100,
      continueOnError: true,
    },
    isPlatformDefault: true,
    active: true,
  },
  {
    name: 'Occuco Examination Import',
    description: 'Import eye examination records from Occuco',
    sourceSystem: 'occuco',
    version: '1.0',
    dataType: 'examinations',
    fieldMappings: occucoExaminationMappings,
    transformations: {
      dateFormat: 'DD/MM/YYYY',
    },
    validationRules: {
      requiredFields: ['PatientID', 'ExamDate'],
    },
    defaultOptions: {
      skipDuplicates: true,
      updateExisting: false,
      batchSize: 100,
      continueOnError: true,
    },
    isPlatformDefault: true,
    active: true,
  },

  // ========== ACUITY PRESETS ==========
  {
    name: 'Acuity Patient Import',
    description: 'Import patient records from Acuity (US-based system)',
    sourceSystem: 'acuity',
    version: '1.0',
    dataType: 'patients',
    fieldMappings: acuityPatientMappings,
    transformations: {
      dateFormat: 'MM/DD/YYYY', // Acuity uses US date format
      phoneFormat: 'US',
      nameCase: 'title',
    },
    validationRules: {
      requiredFields: ['firstName', 'lastName', 'birthDate'],
    },
    defaultOptions: {
      skipDuplicates: true,
      updateExisting: false,
      batchSize: 100,
      continueOnError: true,
    },
    isPlatformDefault: true,
    active: true,
  },

  // ========== GENERIC CSV PRESET ==========
  {
    name: 'Generic CSV Patient Import',
    description: 'Generic patient import for CSV files with auto-detection',
    sourceSystem: 'manual_csv',
    version: '1.0',
    dataType: 'patients',
    fieldMappings: [], // Will use auto-detection
    transformations: {
      autoDetect: true,
    },
    validationRules: {
      requiredFields: ['name', 'dateOfBirth'],
    },
    defaultOptions: {
      skipDuplicates: true,
      updateExisting: false,
      batchSize: 100,
      continueOnError: true,
    },
    isPlatformDefault: true,
    active: true,
  },
];

/**
 * Get preset by source system and data type
 */
export function getPreset(sourceSystem: string, dataType: string): Partial<MigrationPreset> | undefined {
  return defaultMigrationPresets.find(
    preset => preset.sourceSystem === sourceSystem && preset.dataType === dataType
  );
}

/**
 * Get all presets for a source system
 */
export function getPresetsBySource(sourceSystem: string): Partial<MigrationPreset>[] {
  return defaultMigrationPresets.filter(preset => preset.sourceSystem === sourceSystem);
}
