/**
 * EHR System API Tests
 * 
 * Comprehensive testing for Electronic Health Records including:
 * - Medical records management
 * - Medication management with allergy checking
 * - Allergy documentation and alerts
 * - Clinical notes with SOAP structure
 * - Vital signs tracking and interpretation
 * - Immunization records
 * - Lab result management
 * - Patient health summary
 * - Validation and error handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';

describe('EHR System API', () => {
  let app: Application;
  let authToken: string;
  let testCompanyId: string;
  let testUserId: string;
  let testPatientId: string;
  let testMedicalRecordId: string;
  let testMedicationId: string;
  let testAllergyId: string;

  beforeAll(async () => {
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use('/api/ehr', (req, res, next) => {
      req.user = {
        id: testUserId || 'test-user-id',
        companyId: testCompanyId || 'test-company-id',
        email: 'test@example.com',
        role: 'ecp'
      };
      next();
    });

    // Import and use EHR routes
    const ehrRoutes = await import('../../server/routes/ehr');
    app.use('/api/ehr', ehrRoutes.default);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Medical Records Management', () => {
    it('should create a medical record successfully', async () => {
      const medicalRecordData = {
        patientId: testPatientId || 'test-patient-id',
        practitionerId: 'test-practitioner-id',
        primaryDiagnosis: 'Myopia',
        chiefComplaint: 'Blurry vision at distance',
        historyOfPresentIllness: 'Patient reports difficulty seeing distant objects for 6 months',
        pastMedicalHistory: {
          conditions: ['Hypertension'],
          surgeries: ['Appendectomy 2010']
        }
      };

      const response = await request(app)
        .post('/api/ehr/medical-records')
        .send(medicalRecordData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.medicalRecord).toBeDefined();
      expect(response.body.medicalRecord.patientId).toBe(medicalRecordData.patientId);
      expect(response.body.medicalRecord.primaryDiagnosis).toBe(medicalRecordData.primaryDiagnosis);
      expect(response.body.medicalRecord.recordNumber).toMatch(/^MR\d{8}$/); // MR20240001 format
      
      testMedicalRecordId = response.body.medicalRecord.id;
    });

    it('should get medical records with pagination', async () => {
      const response = await request(app)
        .get('/api/ehr/medical-records?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.medicalRecords).toBeDefined();
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBeDefined();
    });

    it('should get medical record by ID', async () => {
      const response = await request(app)
        .get(`/api/ehr/medical-records/${testMedicalRecordId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.medicalRecord).toBeDefined();
      expect(response.body.medicalRecord.id).toBe(testMedicalRecordId);
    });

    it('should update medical record successfully', async () => {
      const updateData = {
        primaryDiagnosis: 'Myopia with Astigmatism',
        secondaryDiagnoses: ['Presbyopia']
      };

      const response = await request(app)
        .put(`/api/ehr/medical-records/${testMedicalRecordId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.medicalRecord.primaryDiagnosis).toBe(updateData.primaryDiagnosis);
    });

    it('should return 404 for non-existent medical record', async () => {
      const response = await request(app)
        .get('/api/ehr/medical-records/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Medical record not found');
    });

    it('should validate medical record data', async () => {
      const invalidData = {
        // Missing patientId
        primaryDiagnosis: 'Myopia'
      };

      const response = await request(app)
        .post('/api/ehr/medical-records')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Medications Management', () => {
    it('should add medication successfully', async () => {
      const medicationData = {
        patientId: testPatientId || 'test-patient-id',
        practitionerId: 'test-practitioner-id',
        medicationName: 'Latanoprost',
        genericName: 'Latanoprost',
        ndcCode: '12345-678-90',
        dosage: '0.005%',
        route: 'ophthalmic',
        frequency: 'once daily at bedtime',
        instructions: 'Apply one drop in affected eye(s) at bedtime',
        reason: 'Glaucoma treatment',
        quantity: 2.5,
        refills: 3,
        pharmacy: 'Test Pharmacy'
      };

      const response = await request(app)
        .post('/api/ehr/medications')
        .send(medicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.medication).toBeDefined();
      expect(response.body.medication.medicationName).toBe(medicationData.medicationName);
      expect(response.body.medication.status).toBe('active');
      
      testMedicationId = response.body.medication.id;
    });

    it('should get patient medications', async () => {
      const response = await request(app)
        .get('/api/ehr/medications')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.medications)).toBe(true);
      expect(response.body.medications.length).toBeGreaterThan(0);
    });

    it('should update medication status', async () => {
      const updateData = {
        status: 'discontinued',
        endDate: new Date().toISOString()
      };

      const response = await request(app)
        .put(`/api/ehr/medications/${testMedicationId}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.medication.status).toBe('discontinued');
    });

    it('should validate medication data', async () => {
      const invalidData = {
        // Missing required fields
        medicationName: 'Test Medication'
      };

      const response = await request(app)
        .post('/api/ehr/medications')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Allergies Management', () => {
    it('should add allergy successfully', async () => {
      const allergyData = {
        patientId: testPatientId || 'test-patient-id',
        practitionerId: 'test-practitioner-id',
        allergen: 'Penicillin',
        allergenType: 'medication',
        severity: 'severe',
        reaction: 'Anaphylaxis, hives, difficulty breathing',
        onsetDate: '2020-05-15',
        notes: 'Patient reports severe reaction requiring emergency treatment'
      };

      const response = await request(app)
        .post('/api/ehr/allergies')
        .send(allergyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.allergy).toBeDefined();
      expect(response.body.allergy.allergen).toBe(allergyData.allergen);
      expect(response.body.allergy.severity).toBe(allergyData.severity);
      
      testAllergyId = response.body.allergy.id;
    });

    it('should get patient allergies', async () => {
      const response = await request(app)
        .get(`/api/ehr/allergies/${testPatientId || 'test-patient-id'}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.allergies)).toBe(true);
      expect(response.body.allergies.length).toBeGreaterThan(0);
    });

    it('should check medication allergies', async () => {
      const checkData = {
        patientId: testPatientId || 'test-patient-id',
        medicationName: 'Penicillin'
      };

      const response = await request(app)
        .post('/api/ehr/allergies/check-medication')
        .send(checkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasAllergies).toBe(true);
      expect(response.body.allergies.length).toBeGreaterThan(0);
    });

    it('should validate allergy data', async () => {
      const invalidData = {
        // Missing required fields
        allergen: 'Test Allergen'
      };

      const response = await request(app)
        .post('/api/ehr/allergies')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Clinical Notes Management', () => {
    it('should create clinical note successfully', async () => {
      const noteData = {
        patientId: testPatientId || 'test-patient-id',
        practitionerId: 'test-practitioner-id',
        noteType: 'examination',
        title: 'Comprehensive Eye Examination',
        content: 'Patient presents for routine eye examination',
        subjective: 'Patient reports occasional eye strain',
        objective: 'Visual acuity 20/20 OU, IOP 15 mmHg OU',
        assessment: 'Mild refractive error',
        plan: 'Prescribe corrective lenses, follow up in 1 year'
      };

      const response = await request(app)
        .post('/api/ehr/clinical-notes')
        .send(noteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.clinicalNote).toBeDefined();
      expect(response.body.clinicalNote.title).toBe(noteData.title);
      expect(response.body.clinicalNote.noteType).toBe(noteData.noteType);
      expect(response.body.clinicalNote.isSigned).toBe(false);
    });

    it('should get clinical notes', async () => {
      const response = await request(app)
        .get('/api/ehr/clinical-notes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.clinicalNotes)).toBe(true);
    });

    it('should sign clinical note', async () => {
      // First create a note to sign
      const noteResponse = await request(app)
        .post('/api/ehr/clinical-notes')
        .send({
          patientId: testPatientId || 'test-patient-id',
          noteType: 'progress_note',
          title: 'Test Note for Signing',
          content: 'This is a test note'
        })
        .expect(201);

      const noteId = noteResponse.body.clinicalNote.id;

      const response = await request(app)
        .post(`/api/ehr/clinical-notes/${noteId}/sign`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clinicalNote.isSigned).toBe(true);
      expect(response.body.clinicalNote.status).toBe('signed');
    });

    it('should validate clinical note data', async () => {
      const invalidData = {
        // Missing required fields
        title: 'Test Note'
      };

      const response = await request(app)
        .post('/api/ehr/clinical-notes')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Vital Signs Management', () => {
    it('should add vital sign successfully', async () => {
      const vitalSignData = {
        patientId: testPatientId || 'test-patient-id',
        practitionerId: 'test-practitioner-id',
        vitalType: 'blood_pressure',
        value: '120/80',
        unit: 'mmHg',
        measurementDate: new Date().toISOString(),
        method: 'Automated cuff',
        position: 'Sitting',
        notes: 'Patient resting for 5 minutes before measurement'
      };

      const response = await request(app)
        .post('/api/ehr/vital-signs')
        .send(vitalSignData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.vitalSign).toBeDefined();
      expect(response.body.vitalSign.vitalType).toBe(vitalSignData.vitalType);
      expect(response.body.vitalSign.value).toBe(vitalSignData.value);
      expect(response.body.vitalSign.interpretation).toBe('normal');
    });

    it('should get vital signs', async () => {
      const response = await request(app)
        .get('/api/ehr/vital-signs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.vitalSigns)).toBe(true);
    });

    it('should filter vital signs by type', async () => {
      const response = await request(app)
        .get('/api/ehr/vital-signs?vitalType=blood_pressure')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.vitalSigns.every((vs: any) => vs.vitalType === 'blood_pressure')).toBe(true);
    });

    it('should validate vital sign data', async () => {
      const invalidData = {
        // Missing required fields
        vitalType: 'blood_pressure',
        value: '120/80'
      };

      const response = await request(app)
        .post('/api/ehr/vital-signs')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Immunizations Management', () => {
    it('should add immunization successfully', async () => {
      const immunizationData = {
        patientId: testPatientId || 'test-patient-id',
        practitionerId: 'test-practitioner-id',
        vaccineName: 'Influenza Vaccine',
        vaccineType: 'Inactivated',
        manufacturer: 'Test Manufacturer',
        lotNumber: 'LOT123456',
        administrationDate: new Date().toISOString(),
        dose: '0.5 mL',
        route: 'Intramuscular',
        site: 'Left deltoid',
        nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        cvxCode: '88'
      };

      const response = await request(app)
        .post('/api/ehr/immunizations')
        .send(immunizationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.immunization).toBeDefined();
      expect(response.body.immunization.vaccineName).toBe(immunizationData.vaccineName);
      expect(response.body.immunization.status).toBe('administered');
    });

    it('should get immunizations', async () => {
      const response = await request(app)
        .get('/api/ehr/immunizations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.immunizations)).toBe(true);
    });

    it('should validate immunization data', async () => {
      const invalidData = {
        // Missing required fields
        vaccineName: 'Test Vaccine'
      };

      const response = await request(app)
        .post('/api/ehr/immunizations')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Lab Results Management', () => {
    it('should add lab result successfully', async () => {
      const labResultData = {
        patientId: testPatientId || 'test-patient-id',
        practitionerId: 'test-practitioner-id',
        testName: 'Complete Blood Count',
        testCategory: 'Hematology',
        loincCode: '58410-2',
        resultValue: 'Normal',
        resultUnit: 'N/A',
        referenceRange: 'All values within normal limits',
        abnormalFlag: 'N',
        interpretation: 'No abnormalities detected',
        resultDate: new Date().toISOString(),
        performingLab: 'Test Laboratory',
        orderingProvider: 'Dr. Test Provider',
        accessionNumber: 'ACC123456'
      };

      const response = await request(app)
        .post('/api/ehr/lab-results')
        .send(labResultData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.labResult).toBeDefined();
      expect(response.body.labResult.testName).toBe(labResultData.testName);
      expect(response.body.labResult.status).toBe('final');
    });

    it('should get lab results', async () => {
      const response = await request(app)
        .get('/api/ehr/lab-results')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.labResults)).toBe(true);
    });

    it('should filter abnormal lab results', async () => {
      const response = await request(app)
        .get('/api/ehr/lab-results?abnormalOnly=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.labResults)).toBe(true);
    });

    it('should validate lab result data', async () => {
      const invalidData = {
        // Missing required fields
        testName: 'Test Result'
      };

      const response = await request(app)
        .post('/api/ehr/lab-results')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Patient Health Summary', () => {
    it('should get comprehensive patient health summary', async () => {
      const response = await request(app)
        .get(`/api/ehr/patients/${testPatientId || 'test-patient-id'}/health-summary`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.healthSummary).toBeDefined();
      
      const summary = response.body.healthSummary;
      expect(summary).toHaveProperty('medicalRecord');
      expect(summary).toHaveProperty('medications');
      expect(summary).toHaveProperty('allergies');
      expect(summary).toHaveProperty('recentVitalSigns');
      expect(summary).toHaveProperty('immunizations');
      expect(summary).toHaveProperty('recentLabResults');
      expect(summary).toHaveProperty('clinicalNotes');
      
      expect(Array.isArray(summary.medications)).toBe(true);
      expect(Array.isArray(summary.allergies)).toBe(true);
      expect(Array.isArray(summary.recentVitalSigns)).toBe(true);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      // Create app without auth middleware
      const noAuthApp = express();
      noAuthApp.use(express.json());
      
      const ehrRoutes = await import('../../server/routes/ehr');
      noAuthApp.use('/api/ehr', ehrRoutes.default);

      const endpoints = [
        '/api/ehr/medical-records',
        '/api/ehr/medications',
        '/api/ehr/allergies',
        '/api/ehr/clinical-notes',
        '/api/ehr/vital-signs',
        '/api/ehr/immunizations',
        '/api/ehr/lab-results'
      ];

      for (const endpoint of endpoints) {
        const response = await request(noAuthApp)
          .get(endpoint)
          .expect(401);
        expect(response.body.error).toBe('Authentication required');
      }
    });

    it('should require company access', async () => {
      // Create app without company context
      const noCompanyApp = express();
      noCompanyApp.use(express.json());
      
      noCompanyApp.use('/api/ehr', (req, res, next) => {
        req.user = { id: 'test-user-id', email: 'test@example.com', role: 'ecp' }; // Missing companyId
        next();
      });
      
      const ehrRoutes = await import('../../server/routes/ehr');
      noCompanyApp.use('/api/ehr', ehrRoutes.default);

      const response = await request(noCompanyApp)
        .get('/api/ehr/medical-records')
        .expect(403);
      
      expect(response.body.error).toBe('Company context required');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid medication status update', async () => {
      const response = await request(app)
        .put(`/api/ehr/medications/${testMedicationId}/status`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.error).toBe('Invalid medication status');
    });

    it('should handle missing patient ID in allergy check', async () => {
      const response = await request(app)
        .post('/api/ehr/allergies/check-medication')
        .send({ medicationName: 'Test Medication' })
        .expect(400);

      expect(response.body.error).toBe('Patient ID and medication name are required');
    });

    it('should handle non-existent resource IDs', async () => {
      const response = await request(app)
        .put('/api/ehr/medical-records/non-existent-id')
        .send({ primaryDiagnosis: 'Updated diagnosis' })
        .expect(404);

      expect(response.body.error).toBe('Medical record not found');
    });
  });
});
