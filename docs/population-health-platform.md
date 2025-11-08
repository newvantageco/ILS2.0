# Population Health Management & Care Coordination Platform

## Overview

The Population Health Management & Care Coordination Platform provides comprehensive tools for managing population health, stratifying risk, coordinating care, and managing chronic diseases. This platform enables healthcare organizations to deliver proactive, coordinated, and evidence-based care to improve patient outcomes and reduce costs.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Risk Stratification](#risk-stratification)
3. [Care Coordination](#care-coordination)
4. [Chronic Disease Management](#chronic-disease-management)
5. [API Reference](#api-reference)
6. [Integration Guide](#integration-guide)
7. [Best Practices](#best-practices)

## Architecture Overview

The Population Health platform consists of three core services:

### 1. Risk Stratification Service
Identifies and stratifies patients by risk level to enable targeted interventions.

**Key Features:**
- Risk score calculation with multiple risk categories
- Health risk assessments with scoring
- Predictive analytics with ML models
- Social determinants of health tracking
- Risk stratification cohorts
- Comprehensive risk reporting

### 2. Care Coordination Service
Manages care coordination activities, teams, and workflows.

**Key Features:**
- Care plan management with goals and interventions
- Multi-disciplinary care teams
- Care gap identification and closure
- Transitions of care management
- Care coordination tasks and workflows
- Patient outreach tracking

### 3. Chronic Disease Management Service
Supports chronic disease management programs and patient engagement.

**Key Features:**
- Disease registry management
- Disease management programs
- Clinical metrics tracking
- Patient engagement monitoring
- Outcome tracking and reporting
- Preventive care recommendations

## Risk Stratification

### Risk Scoring

#### Risk Categories

- **clinical**: Clinical risk factors (diagnoses, labs, vitals)
- **financial**: Financial risk (high cost, frequent utilization)
- **utilization**: Healthcare utilization patterns
- **social**: Social determinants of health
- **behavioral**: Behavioral health risk factors
- **functional**: Functional status and independence

#### Risk Levels

- **low**: Score 0-24 - Routine monitoring
- **moderate**: Score 25-49 - Enhanced monitoring
- **high**: Score 50-74 - Active intervention
- **very_high**: Score 75-100 - Intensive management

#### Calculating Risk Scores

```typescript
const riskScore = RiskStratificationService.calculateRiskScore({
  patientId: 'patient-123',
  scoreType: 'composite_risk',
  category: 'clinical',
  factors: [
    {
      factor: 'age',
      category: 'demographic',
      weight: 0.2,
      value: 75,
      impact: 0.8,
      description: 'Patient age > 65'
    },
    {
      factor: 'comorbidities',
      category: 'clinical',
      weight: 0.3,
      value: 5,
      impact: 0.9,
      description: '5 chronic conditions'
    },
    {
      factor: 'hospitalizations',
      category: 'utilization',
      weight: 0.3,
      value: 3,
      impact: 0.7,
      description: '3 hospitalizations in past year'
    },
    {
      factor: 'medication_adherence',
      category: 'behavioral',
      weight: 0.2,
      value: 60,
      impact: 0.6,
      description: '60% medication adherence'
    }
  ],
  calculatedBy: 'user-123'
});

console.log(`Risk Score: ${riskScore.score}`);
console.log(`Risk Level: ${riskScore.riskLevel}`);
```

#### Getting Patients by Risk Level

```typescript
// Get all high-risk patients
const highRiskPatients = RiskStratificationService.getPatientsByRiskLevel('high');

// Get high-risk patients in specific category
const clinicalHighRisk = RiskStratificationService.getPatientsByRiskLevel('high', 'clinical');
```

### Health Risk Assessments (HRA)

#### Creating and Completing an HRA

```typescript
// Create assessment
const assessment = RiskStratificationService.createHealthRiskAssessment({
  patientId: 'patient-123',
  assessmentType: 'Annual Health Risk Assessment',
  expirationDate: new Date('2025-12-31')
});

// Record responses
RiskStratificationService.recordAssessmentResponse(assessment.id, {
  questionId: 'q1',
  question: 'Do you smoke?',
  response: 'yes',
  score: 20,
  category: 'behavioral'
});

RiskStratificationService.recordAssessmentResponse(assessment.id, {
  questionId: 'q2',
  question: 'Do you exercise regularly?',
  response: 'no',
  score: 15,
  category: 'lifestyle'
});

// Complete assessment
const completed = RiskStratificationService.completeHealthRiskAssessment(
  assessment.id,
  'user-123'
);

console.log(`Total Score: ${completed.totalScore}`);
console.log(`Risk Level: ${completed.riskLevel}`);
console.log(`Recommendations: ${completed.recommendations.join(', ')}`);
```

### Predictive Analytics

#### Default Predictive Models

The system includes four pre-configured predictive models:

1. **Hospital Readmission Risk** (82% accuracy)
   - Predicts 30-day readmission risk
   - Input features: age, comorbidities, previous admissions, length of stay, discharge disposition

2. **Diabetes Complication Risk** (78% accuracy)
   - Predicts risk of diabetes-related complications
   - Input features: HbA1c, blood pressure, cholesterol, BMI, smoking status, disease duration

3. **High Utilizer Prediction** (75% accuracy)
   - Predicts patients likely to become high utilizers
   - Input features: age, chronic conditions, ER visits, hospitalizations, medication adherence, social determinants

4. **Medication Non-Adherence Risk** (73% accuracy)
   - Predicts risk of medication non-adherence
   - Input features: age, number of medications, complexity, copay burden, previous adherence, cognitive status

#### Running Predictive Analysis

```typescript
// Get available models
const models = RiskStratificationService.getPredictiveModels();

// Run prediction
const analysis = RiskStratificationService.runPredictiveAnalysis({
  patientId: 'patient-123',
  modelId: models[0].id, // Hospital Readmission Risk
  inputData: {
    age: 72,
    comorbidities_count: 5,
    previous_admissions: 2,
    length_of_stay: 7,
    discharge_disposition: 'home_with_services'
  }
});

console.log(`Predicted Outcome: ${analysis.predictedOutcome}`);
console.log(`Probability: ${(analysis.probability * 100).toFixed(1)}%`);
console.log(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
console.log(`Risk Level: ${analysis.riskLevel}`);

// View contributing factors
analysis.contributingFactors.forEach(factor => {
  console.log(`${factor.factor}: ${factor.contribution}% contribution`);
});

// View recommendations
analysis.recommendations.forEach(rec => console.log(`- ${rec}`));
```

### Social Determinants of Health

#### SDOH Categories

- **economic_stability**: Employment, income, expenses, debt, medical bills, support
- **education**: Literacy, language, early childhood education, vocational training
- **social_community**: Social integration, support systems, community engagement
- **healthcare_access**: Coverage, providers, transportation, health literacy
- **neighborhood_environment**: Housing, transportation, safety, parks, walkability

#### Recording and Managing SDOH

```typescript
// Record social determinant
const determinant = RiskStratificationService.recordSocialDeterminant({
  patientId: 'patient-123',
  category: 'economic_stability',
  factor: 'food_insecurity',
  severity: 'high',
  description: 'Patient reports difficulty affording food',
  impact: 'Unable to purchase diabetic-friendly foods, affecting glucose control',
  identifiedBy: 'user-123'
});

// Update with intervention
RiskStratificationService.updateSocialDeterminant(determinant.id, {
  status: 'intervention_active',
  interventions: [
    'Referred to local food bank',
    'Connected with SNAP benefits enrollment',
    'Provided list of affordable healthy food resources'
  ]
});

// Mark as resolved
RiskStratificationService.updateSocialDeterminant(determinant.id, {
  status: 'resolved',
  resolvedDate: new Date()
});
```

### Risk Stratification Cohorts

Create population cohorts based on risk levels and other criteria:

```typescript
const cohort = RiskStratificationService.createRiskStratificationCohort({
  name: 'High-Risk Diabetics',
  description: 'Diabetic patients with high clinical risk scores requiring intensive management',
  criteria: [
    {
      type: 'diagnosis',
      field: 'icd10',
      operator: 'contains',
      value: 'E11'
    },
    {
      type: 'lab_value',
      field: 'hba1c',
      operator: 'greater_than',
      value: 9
    }
  ],
  riskLevels: ['high', 'very_high'],
  createdBy: 'user-123'
});
```

## Care Coordination

### Care Plans

#### Creating a Care Plan

```typescript
const carePlan = CareCoordinationService.createCarePlan({
  patientId: 'patient-123',
  name: 'Diabetes Management Plan',
  description: 'Comprehensive care plan for Type 2 Diabetes management',
  category: 'chronic_disease',
  startDate: new Date(),
  reviewFrequency: 'monthly',
  createdBy: 'user-123'
});
```

#### Adding Goals

```typescript
CareCoordinationService.addCareGoal(carePlan.id, {
  description: 'Achieve HbA1c < 7%',
  targetDate: new Date('2025-06-30'),
  status: 'in_progress',
  measurableOutcome: 'HbA1c level',
  currentValue: 8.5,
  targetValue: 7.0,
  unit: '%',
  progress: 30,
  barriers: ['Difficulty with diet compliance', 'Financial constraints'],
  notes: 'Patient motivated to improve control'
});

CareCoordinationService.addCareGoal(carePlan.id, {
  description: 'Achieve weight loss of 10 lbs',
  targetDate: new Date('2025-06-30'),
  status: 'in_progress',
  measurableOutcome: 'Weight',
  currentValue: 220,
  targetValue: 210,
  unit: 'lbs',
  progress: 20,
  barriers: ['Limited exercise tolerance'],
  notes: 'Working with nutritionist'
});
```

#### Adding Interventions

```typescript
CareCoordinationService.addCareIntervention(carePlan.id, {
  type: 'education',
  description: 'Diabetes self-management education',
  frequency: 'Weekly for 4 weeks',
  assignedTo: 'educator-456',
  status: 'active',
  startDate: new Date(),
  outcomes: []
});

CareCoordinationService.addCareIntervention(carePlan.id, {
  type: 'monitoring',
  description: 'Daily blood glucose monitoring',
  frequency: 'Daily',
  assignedTo: 'patient-123',
  status: 'active',
  startDate: new Date(),
  outcomes: []
});
```

#### Activating and Managing Care Plans

```typescript
// Activate care plan
CareCoordinationService.activateCarePlan(carePlan.id);

// Update goal progress
CareCoordinationService.updateCareGoal(carePlan.id, goalId, {
  currentValue: 7.8,
  progress: 60,
  notes: 'Good progress, continue current plan'
});

// Update care plan status
CareCoordinationService.updateCarePlanStatus(carePlan.id, 'completed');

// Get care plans due for review
const dueForReview = CareCoordinationService.getCarePlansDueForReview(7); // next 7 days
```

### Care Teams

#### Creating and Managing Care Teams

```typescript
// Create care team
const careTeam = CareCoordinationService.createCareTeam({
  name: 'Diabetes Care Team',
  patientId: 'patient-123',
  description: 'Multi-disciplinary team for diabetes management',
  createdBy: 'user-123'
});

// Add team members
CareCoordinationService.addCareTeamMember(careTeam.id, {
  userId: 'pcp-456',
  name: 'Dr. Smith',
  role: 'Primary Care Physician',
  specialty: 'Family Medicine',
  isPrimary: true,
  responsibilities: ['Overall care coordination', 'Medication management'],
  contactInfo: {
    phone: '555-0100',
    email: 'dr.smith@example.com'
  }
});

CareCoordinationService.addCareTeamMember(careTeam.id, {
  userId: 'endo-789',
  name: 'Dr. Johnson',
  role: 'Endocrinologist',
  specialty: 'Endocrinology',
  isPrimary: false,
  responsibilities: ['Diabetes medication optimization', 'Complication screening'],
  contactInfo: {
    phone: '555-0101',
    email: 'dr.johnson@example.com'
  }
});

CareCoordinationService.addCareTeamMember(careTeam.id, {
  userId: 'educator-101',
  name: 'Jane Doe',
  role: 'Diabetes Educator',
  specialty: 'Diabetes Education',
  isPrimary: false,
  responsibilities: ['Patient education', 'Self-management support'],
  contactInfo: {
    phone: '555-0102',
    email: 'jane.doe@example.com'
  }
});
```

### Care Gaps

#### Identifying and Closing Care Gaps

```typescript
// Identify care gap
const careGap = CareCoordinationService.identifyCareGap({
  patientId: 'patient-123',
  gapType: 'annual_diabetic_eye_exam',
  category: 'preventive',
  description: 'Annual diabetic retinopathy screening overdue',
  severity: 'high',
  dueDate: new Date('2024-12-31'),
  recommendations: [
    'Schedule ophthalmology appointment',
    'Patient education on importance of annual eye exams',
    'Follow up in 2 weeks if not scheduled'
  ],
  evidence: 'No eye exam in past 18 months, last exam: 2023-06-15',
  measure: 'HEDIS Diabetes Care - Eye Exam'
});

// Assign care gap
CareCoordinationService.updateCareGap(careGap.id, {
  assignedTo: 'care-coordinator-123'
});

// Close care gap
CareCoordinationService.updateCareGap(careGap.id, {
  status: 'closed',
  closedDate: new Date()
});

// Get open care gaps
const openGaps = CareCoordinationService.getOpenCareGaps();

// Get overdue care gaps
const overdueGaps = CareCoordinationService.getOverdueCareGaps();
```

### Transitions of Care

#### Managing Care Transitions

```typescript
// Create transition of care
const transition = CareCoordinationService.createTransitionOfCare({
  patientId: 'patient-123',
  transitionType: 'hospital_to_home',
  fromLocation: 'General Hospital',
  toLocation: 'Home',
  dischargeDate: new Date(),
  followUpRequired: true,
  followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  careInstructions: [
    'Monitor blood glucose twice daily',
    'Take all medications as prescribed',
    'Watch for signs of infection',
    'Call if fever > 100.4°F'
  ],
  riskFactors: [
    'Multiple comorbidities',
    'Lives alone',
    'Limited health literacy'
  ],
  responsibleProvider: 'pcp-456',
  coordinatedBy: 'coordinator-789'
});

// Add medication reconciliation
CareCoordinationService.addMedicationReconciliation(transition.id, {
  medicationId: 'med-1',
  medicationName: 'Metformin 1000mg',
  action: 'changed',
  previousDose: '500mg twice daily',
  newDose: '1000mg twice daily',
  reason: 'Dose increased for better glucose control',
  reconciledBy: 'pcp-456',
  reconciledDate: new Date()
});

// Update transition status
CareCoordinationService.updateTransitionStatus(transition.id, 'completed');

// Complete follow-up
CareCoordinationService.completeFollowUp(transition.id);

// Get pending follow-ups
const pendingFollowUps = CareCoordinationService.getPendingFollowUps();
```

### Care Coordination Tasks

#### Creating and Managing Tasks

```typescript
// Create task
const task = CareCoordinationService.createCareCoordinationTask({
  patientId: 'patient-123',
  gapId: careGap.id,
  title: 'Schedule diabetic eye exam',
  description: 'Contact patient to schedule overdue annual eye exam',
  type: 'outreach',
  priority: 'high',
  dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
  createdBy: 'user-123'
});

// Assign task
CareCoordinationService.assignTask(task.id, 'coordinator-456');

// Update task status
CareCoordinationService.updateTaskStatus(
  task.id,
  'completed',
  'coordinator-456',
  'Contacted patient, exam scheduled for 2024-02-15'
);

// Get my tasks
const myTasks = CareCoordinationService.getTasksByAssignee('coordinator-456');

// Get overdue tasks
const overdueTasks = CareCoordinationService.getOverdueTasks();
```

### Patient Outreach

#### Tracking Outreach Attempts

```typescript
// Create outreach
const outreach = CareCoordinationService.createPatientOutreach({
  patientId: 'patient-123',
  taskId: task.id,
  outreachType: 'phone',
  purpose: 'Schedule overdue diabetic eye exam',
  scheduledDate: new Date(),
  createdBy: 'coordinator-456'
});

// Record attempt
CareCoordinationService.recordOutreachAttempt(outreach.id, {
  contactResult: 'successful',
  notes: 'Spoke with patient, agreed to schedule exam',
  nextSteps: [
    'Patient will call ophthalmology to schedule',
    'Follow up in 1 week if not scheduled'
  ],
  performedBy: 'coordinator-456'
});

// Get scheduled outreach
const scheduled = CareCoordinationService.getScheduledOutreach(7); // next 7 days
```

## Chronic Disease Management

### Disease Registries

#### Default Registries

The system includes five pre-configured disease registries:

1. **Diabetes Registry** (ICD-10: E11) - Type 2 Diabetes
2. **Hypertension Registry** (ICD-10: I10) - Essential Hypertension
3. **COPD Registry** (ICD-10: J44) - Chronic Obstructive Pulmonary Disease
4. **Heart Failure Registry** (ICD-10: I50) - Heart Failure
5. **Chronic Kidney Disease Registry** (ICD-10: N18) - CKD

#### Creating Custom Registries

```typescript
const registry = ChronicDiseaseManagementService.createDiseaseRegistry({
  name: 'Asthma Registry',
  diseaseCode: 'J45',
  description: 'Registry for patients with asthma',
  criteria: [
    {
      type: 'diagnosis',
      field: 'icd10_code',
      operator: 'contains',
      value: 'J45'
    },
    {
      type: 'medication',
      field: 'medication_class',
      operator: 'contains',
      value: 'bronchodilator'
    }
  ],
  createdBy: 'user-123'
});
```

#### Enrolling Patients

```typescript
const enrollment = ChronicDiseaseManagementService.enrollInRegistry({
  registryId: registry.id,
  patientId: 'patient-123',
  enrollmentReason: 'New diagnosis of asthma, J45.20'
});

// Get registry patients
const patients = ChronicDiseaseManagementService.getRegistryPatients(registry.id);
```

### Disease Management Programs

#### Default Programs

The system includes three pre-configured programs:

1. **Diabetes Self-Management Education and Support** (180 days)
   - Objectives: HbA1c control, medication adherence, reduce complications
   - Interventions: Education, monitoring, lifestyle coaching
   - Quality measures: HbA1c control (target: 80% < 8%)

2. **Hypertension Control Program** (90 days)
   - Objectives: BP < 140/90, medication adherence, reduce cardiovascular risk
   - Interventions: Home BP monitoring, medication support, DASH diet education
   - Quality measures: BP control (target: 75% < 140/90)

3. **Heart Failure Care Management** (90 days)
   - Objectives: Reduce readmissions, improve functional status, optimize therapy
   - Interventions: Daily monitoring, nurse care management, self-care education
   - Quality measures: 30-day readmission rate (target: < 15%)

#### Creating Custom Programs

```typescript
const program = ChronicDiseaseManagementService.createDiseaseManagementProgram({
  name: 'COPD Management Program',
  diseaseType: 'COPD',
  description: 'Comprehensive program for COPD management and exacerbation prevention',
  objectives: [
    'Reduce COPD exacerbations',
    'Improve exercise tolerance',
    'Optimize inhaler technique',
    'Smoking cessation (if applicable)'
  ],
  eligibilityCriteria: [
    {
      type: 'clinical',
      description: 'Diagnosis of COPD',
      required: true
    },
    {
      type: 'clinical',
      description: 'Recent exacerbation or hospitalization',
      required: false
    }
  ],
  interventions: [
    {
      id: uuidv4(),
      type: 'education',
      name: 'COPD Self-Management Education',
      description: 'Education on COPD management, early warning signs, and action plan',
      frequency: 'One-time',
      duration: 7,
      deliveryMethod: 'video'
    },
    {
      id: uuidv4(),
      type: 'monitoring',
      name: 'Symptom Monitoring',
      description: 'Daily symptom and peak flow monitoring',
      frequency: 'Daily',
      duration: 90,
      deliveryMethod: 'app'
    },
    {
      id: uuidv4(),
      type: 'coaching',
      name: 'Pulmonary Rehabilitation',
      description: 'Supervised exercise and education program',
      frequency: '3 times per week',
      duration: 90,
      deliveryMethod: 'in_person'
    }
  ],
  qualityMeasures: [
    {
      id: uuidv4(),
      name: 'Exacerbation Rate',
      description: 'Number of exacerbations per patient per year',
      numerator: 'Total exacerbations',
      denominator: 'Patients in program',
      targetValue: 1.5,
      unit: 'exacerbations/patient/year',
      measurementFrequency: 'quarterly'
    }
  ],
  duration: 90,
  createdBy: 'user-123'
});
```

#### Enrolling in Programs

```typescript
// Enroll patient
const enrollment = ChronicDiseaseManagementService.enrollInProgram({
  programId: program.id,
  patientId: 'patient-123',
  assignedCoach: 'coach-456'
});

// Record intervention completion
ChronicDiseaseManagementService.recordInterventionCompletion(
  enrollment.id,
  interventionId,
  'Patient completed education module with 90% quiz score'
);

// Update enrollment
ChronicDiseaseManagementService.updateProgramEnrollment(enrollment.id, {
  status: 'completed'
});
```

### Clinical Metrics Tracking

#### Recording Metrics

```typescript
// Record HbA1c
ChronicDiseaseManagementService.recordClinicalMetric({
  patientId: 'patient-123',
  programId: diabetesProgramId,
  metricType: 'hba1c',
  metricName: 'Hemoglobin A1c',
  value: 7.2,
  unit: '%',
  targetValue: 7.0,
  measurementDate: new Date(),
  source: 'lab_result',
  notes: 'Improved from 8.5% three months ago'
});

// Record blood pressure
ChronicDiseaseManagementService.recordClinicalMetric({
  patientId: 'patient-123',
  metricType: 'blood_pressure_systolic',
  metricName: 'Systolic Blood Pressure',
  value: 135,
  unit: 'mmHg',
  targetValue: 130,
  measurementDate: new Date(),
  source: 'home_monitoring'
});

// Get patient metrics
const metrics = ChronicDiseaseManagementService.getClinicalMetricsByPatient(
  'patient-123',
  'hba1c'
);

// Get latest metric
const latestHbA1c = ChronicDiseaseManagementService.getLatestMetric(
  'patient-123',
  'hba1c'
);
```

### Patient Engagement

#### Recording Engagement

```typescript
// Record education completion
ChronicDiseaseManagementService.recordPatientEngagement({
  patientId: 'patient-123',
  programId: program.id,
  engagementType: 'education_completed',
  description: 'Completed "Understanding COPD" module',
  engagementDate: new Date(),
  score: 95,
  notes: 'Patient scored 95% on post-education quiz',
  recordedBy: 'educator-456'
});

// Record coaching session
ChronicDiseaseManagementService.recordPatientEngagement({
  patientId: 'patient-123',
  programId: program.id,
  engagementType: 'coaching_session',
  description: 'Pulmonary rehabilitation session',
  engagementDate: new Date(),
  notes: 'Patient completed 30 minutes of exercise, good tolerance',
  recordedBy: 'coach-789'
});

// Calculate engagement score
const score = ChronicDiseaseManagementService.calculateEngagementScore(
  'patient-123',
  30 // last 30 days
);

console.log(`Engagement Score: ${score}`);
```

### Outcome Tracking

#### Tracking Outcomes

```typescript
// Initialize outcome tracking
const outcome = ChronicDiseaseManagementService.initializeOutcomeTracking({
  patientId: 'patient-123',
  programId: program.id,
  outcomeType: 'clinical',
  measure: 'hba1c',
  baselineValue: 8.5,
  targetValue: 7.0,
  unit: '%',
  baselineDate: new Date('2024-01-01')
});

// Metrics recorded automatically update outcomes
ChronicDiseaseManagementService.recordClinicalMetric({
  patientId: 'patient-123',
  metricType: 'hba1c',
  metricName: 'Hemoglobin A1c',
  value: 7.2,
  unit: '%',
  measurementDate: new Date()
});

// Get outcomes
const outcomes = ChronicDiseaseManagementService.getOutcomesByPatient('patient-123');

outcomes.forEach(outcome => {
  console.log(`${outcome.measure}:`);
  console.log(`  Baseline: ${outcome.baselineValue}${outcome.unit}`);
  console.log(`  Current: ${outcome.currentValue}${outcome.unit}`);
  console.log(`  Improvement: ${outcome.improvement}${outcome.unit} (${outcome.improvementPercentage}%)`);
});
```

### Preventive Care

#### Managing Preventive Care Recommendations

```typescript
// Create recommendation
const recommendation = ChronicDiseaseManagementService.createPreventiveCareRecommendation({
  patientId: 'patient-123',
  recommendationType: 'screening',
  name: 'Annual Diabetic Retinopathy Screening',
  description: 'Dilated eye exam to screen for diabetic retinopathy',
  frequency: 'Annually',
  dueDate: new Date('2024-12-31'),
  evidence: 'ADA Standards of Care - Annual eye exam for all diabetics',
  importance: 'essential'
});

// Complete preventive care
ChronicDiseaseManagementService.completePreventiveCare(
  recommendation.id,
  new Date(),
  new Date('2025-12-31') // next due date
);

// Get due preventive care
const due = ChronicDiseaseManagementService.getDuePreventiveCare(30); // next 30 days
```

## API Reference

### Risk Stratification Endpoints

#### Risk Scores
```
POST   /api/population-health/risk-scores
GET    /api/population-health/risk-scores/:id
GET    /api/population-health/risk-scores/patient/:patientId
GET    /api/population-health/risk-scores/patient/:patientId/latest
GET    /api/population-health/patients/by-risk/:riskLevel
```

#### Health Risk Assessments
```
POST   /api/population-health/health-risk-assessments
POST   /api/population-health/health-risk-assessments/:id/responses
PUT    /api/population-health/health-risk-assessments/:id/complete
GET    /api/population-health/health-risk-assessments/patient/:patientId
```

#### Predictive Analytics
```
POST   /api/population-health/predictive-models
GET    /api/population-health/predictive-models
POST   /api/population-health/predictive-analyses
GET    /api/population-health/predictive-analyses/patient/:patientId
```

#### Social Determinants
```
POST   /api/population-health/social-determinants
PUT    /api/population-health/social-determinants/:id
GET    /api/population-health/social-determinants/patient/:patientId
```

#### Cohorts
```
POST   /api/population-health/cohorts
GET    /api/population-health/cohorts
```

#### Statistics
```
GET    /api/population-health/risk-stratification/statistics
```

### Care Coordination Endpoints

#### Care Plans
```
POST   /api/population-health/care-plans
GET    /api/population-health/care-plans/:id
GET    /api/population-health/care-plans/patient/:patientId
POST   /api/population-health/care-plans/:id/goals
PUT    /api/population-health/care-plans/:planId/goals/:goalId
POST   /api/population-health/care-plans/:id/interventions
PUT    /api/population-health/care-plans/:id/activate
PUT    /api/population-health/care-plans/:id/status
GET    /api/population-health/care-plans/due-for-review
```

#### Care Teams
```
POST   /api/population-health/care-teams
POST   /api/population-health/care-teams/:id/members
DELETE /api/population-health/care-teams/:teamId/members/:memberId
GET    /api/population-health/care-teams/patient/:patientId
```

#### Care Gaps
```
POST   /api/population-health/care-gaps
PUT    /api/population-health/care-gaps/:id
GET    /api/population-health/care-gaps/patient/:patientId
GET    /api/population-health/care-gaps/open
GET    /api/population-health/care-gaps/overdue
```

#### Transitions of Care
```
POST   /api/population-health/transitions
POST   /api/population-health/transitions/:id/medications
PUT    /api/population-health/transitions/:id/status
PUT    /api/population-health/transitions/:id/complete-followup
GET    /api/population-health/transitions/patient/:patientId
GET    /api/population-health/transitions/pending-followups
```

#### Tasks
```
POST   /api/population-health/tasks
PUT    /api/population-health/tasks/:id/status
PUT    /api/population-health/tasks/:id/assign
GET    /api/population-health/tasks/patient/:patientId
GET    /api/population-health/tasks/assignee/:userId
GET    /api/population-health/tasks/overdue
```

#### Outreach
```
POST   /api/population-health/outreach
POST   /api/population-health/outreach/:id/attempt
GET    /api/population-health/outreach/patient/:patientId
```

#### Statistics
```
GET    /api/population-health/care-coordination/statistics
```

### Chronic Disease Management Endpoints

#### Disease Registries
```
POST   /api/population-health/disease-registries
GET    /api/population-health/disease-registries
POST   /api/population-health/disease-registries/:id/enroll
GET    /api/population-health/disease-registries/:id/patients
```

#### Disease Programs
```
POST   /api/population-health/disease-programs
GET    /api/population-health/disease-programs
POST   /api/population-health/disease-programs/:id/enroll
POST   /api/population-health/program-enrollments/:id/interventions
PUT    /api/population-health/program-enrollments/:id
```

#### Clinical Metrics
```
POST   /api/population-health/clinical-metrics
GET    /api/population-health/clinical-metrics/patient/:patientId
```

#### Patient Engagement
```
POST   /api/population-health/patient-engagement
GET    /api/population-health/patient-engagement/patient/:patientId
GET    /api/population-health/patient-engagement/patient/:patientId/score
```

#### Outcome Tracking
```
POST   /api/population-health/outcome-tracking
GET    /api/population-health/outcome-tracking/patient/:patientId
```

#### Preventive Care
```
POST   /api/population-health/preventive-care
PUT    /api/population-health/preventive-care/:id/complete
GET    /api/population-health/preventive-care/patient/:patientId
GET    /api/population-health/preventive-care/due
```

#### Statistics
```
GET    /api/population-health/disease-management/statistics
```

## Integration Guide

### Integrating with EHR System

```typescript
// Daily risk stratification workflow
async function dailyRiskStratification() {
  // Get all patients
  const patients = await getPatients();

  for (const patient of patients) {
    // Calculate composite risk score
    const riskFactors = await calculateRiskFactors(patient);

    const riskScore = RiskStratificationService.calculateRiskScore({
      patientId: patient.id,
      scoreType: 'composite_risk',
      category: 'clinical',
      factors: riskFactors,
      calculatedBy: 'system'
    });

    // Run predictive models for high-risk patients
    if (riskScore.riskLevel === 'high' || riskScore.riskLevel === 'very_high') {
      const models = RiskStratificationService.getPredictiveModels();

      for (const model of models) {
        const inputData = await gatherModelInputs(patient, model);

        const analysis = RiskStratificationService.runPredictiveAnalysis({
          patientId: patient.id,
          modelId: model.id,
          inputData
        });

        // Create tasks for high-probability predictions
        if (analysis.probability > 0.7) {
          CareCoordinationService.createCareCoordinationTask({
            patientId: patient.id,
            title: `Address ${analysis.predictedOutcome} risk`,
            description: `Patient has ${(analysis.probability * 100).toFixed(0)}% probability of ${analysis.predictedOutcome}`,
            type: 'assessment',
            priority: 'high',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdBy: 'system'
          });
        }
      }
    }
  }
}
```

### Care Gap Identification Workflow

```typescript
// Automated care gap identification
async function identifyCareGaps() {
  const registries = ChronicDiseaseManagementService.getDiseaseRegistries();

  for (const registry of registries) {
    const enrollments = ChronicDiseaseManagementService.getRegistryPatients(registry.id);

    for (const enrollment of enrollments) {
      // Check for diabetic eye exam (if diabetes registry)
      if (registry.diseaseCode.startsWith('E11')) {
        const lastEyeExam = await getLastEyeExam(enrollment.patientId);
        const daysSince = lastEyeExam ? daysBetween(lastEyeExam, new Date()) : 999;

        if (daysSince > 365) {
          CareCoordinationService.identifyCareGap({
            patientId: enrollment.patientId,
            gapType: 'annual_diabetic_eye_exam',
            category: 'preventive',
            description: `Annual diabetic eye exam overdue (${daysSince} days since last exam)`,
            severity: daysSince > 730 ? 'high' : 'medium',
            dueDate: new Date(),
            recommendations: [
              'Schedule ophthalmology appointment',
              'Patient education on importance of screening'
            ],
            evidence: `Last exam: ${lastEyeExam?.toDateString() || 'Never'}`,
            measure: 'HEDIS Diabetes Care - Eye Exam'
          });
        }
      }
    }
  }
}
```

## Best Practices

### Risk Stratification

1. **Regular Re-stratification**: Re-calculate risk scores quarterly or when significant clinical changes occur
2. **Multi-dimensional Risk**: Use multiple risk categories (clinical, financial, social) for comprehensive assessment
3. **Actionable Risk Scores**: Ensure risk scores trigger specific interventions or workflows
4. **Validate Predictions**: Regularly validate predictive model performance and recalibrate as needed
5. **Address Social Determinants**: Screen for and address SDOH as they significantly impact health outcomes

### Care Coordination

1. **Patient-Centered Care Plans**: Involve patients in goal-setting and ensure goals are meaningful to them
2. **Multi-Disciplinary Teams**: Include all relevant care team members and clearly define roles
3. **Proactive Gap Closure**: Identify and address care gaps before they become critical
4. **Seamless Transitions**: Use structured transition processes to prevent readmissions
5. **Close the Loop**: Always follow up on tasks, outreach, and transitions

### Chronic Disease Management

1. **Evidence-Based Programs**: Design programs based on clinical guidelines and best practices
2. **Engage Patients**: Use multiple engagement strategies (education, coaching, self-monitoring)
3. **Track Outcomes**: Measure and report on clinical, functional, and quality of life outcomes
4. **Continuous Improvement**: Regularly review program effectiveness and make data-driven improvements
5. **Preventive Focus**: Emphasize prevention and early intervention over reactive care

### Data Quality

1. **Complete Documentation**: Ensure all required fields are captured for risk stratification
2. **Timely Updates**: Update care plans, metrics, and outcomes in real-time
3. **Structured Data**: Use standardized codes (ICD-10, LOINC, SNOMED) for consistency
4. **Audit Trails**: Maintain complete audit trails for all care coordination activities
5. **Patient Consent**: Obtain appropriate consents for care coordination and data sharing

## Performance Metrics

### Key Performance Indicators

| Metric | Target | Description |
|--------|--------|-------------|
| Risk Stratification Completion Rate | >95% | % of active patients with current risk score |
| High-Risk Patient Outreach Rate | >90% | % of high-risk patients contacted within 30 days |
| Care Plan Adherence | >80% | % of care plan interventions completed as planned |
| Care Gap Closure Rate | >75% | % of identified care gaps closed within target timeframe |
| Transition Follow-Up Rate | >90% | % of transitions with completed follow-up visit |
| Program Completion Rate | >70% | % of disease management program enrollees who complete |
| Patient Engagement Score | >60 | Average 30-day engagement score |
| Clinical Metric Goal Achievement | >60% | % of patients at goal for tracked clinical metrics |

### Monitoring Dashboard

```typescript
// Example comprehensive population health dashboard
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');

const riskStats = RiskStratificationService.getStatistics(startDate, endDate);
const coordStats = CareCoordinationService.getStatistics(startDate, endDate);
const diseaseStats = ChronicDiseaseManagementService.getStatistics(startDate, endDate);

const dashboard = {
  riskStratification: {
    totalPatients: riskStats.totalPatients,
    highRiskPatients: riskStats.highRiskPatients,
    riskDistribution: riskStats.riskDistribution,
    assessmentsCompleted: riskStats.assessmentsCompleted,
    sdohIdentified: riskStats.socialDeterminantsIdentified
  },
  careCoordination: {
    activeCarePlans: coordStats.carePlans.active,
    openCareGaps: coordStats.careGaps.open,
    overdueCareGaps: coordStats.careGaps.overdue,
    pendingFollowUps: coordStats.transitions.pendingFollowUps,
    overdueTasks: coordStats.tasks.overdue,
    outreachSuccessRate: coordStats.outreach.successRate
  },
  diseaseManagement: {
    registryPatients: diseaseStats.registries.totalPatients,
    programEnrollments: diseaseStats.programs.activeEnrollments,
    programCompletionRate: diseaseStats.programs.completionRate,
    patientsAtGoal: diseaseStats.clinicalMetrics.percentageAtGoal,
    outcomeImprovement: diseaseStats.outcomes.avgImprovement,
    preventiveCareCompletionRate: diseaseStats.preventiveCare.completionRate
  }
};
```

## Troubleshooting

### Common Issues

#### Risk Scores Not Updating

**Issue**: Risk scores appear stale or outdated
**Solution**: Implement automated re-stratification workflow and ensure clinical data is being updated

**Issue**: Risk scores don't match expected values
**Solution**: Review risk factor weights and impact calculations, validate input data

#### Care Plans Not Progressing

**Issue**: Care plans stuck in draft status
**Solution**: Ensure care plans have at least one goal before activation, train staff on activation workflow

**Issue**: Goals not updating
**Solution**: Implement regular care plan review process, assign clear ownership

#### Care Gaps Not Closing

**Issue**: High number of overdue care gaps
**Solution**: Review assignment and follow-up processes, increase outreach efforts

**Issue**: Care gaps being identified but not addressed
**Solution**: Ensure automated task creation for high-severity gaps, improve workflow integration

#### Low Program Engagement

**Issue**: Patients not engaging with disease management programs
**Solution**: Review program design, add patient-friendly delivery methods (app, video), increase coaching touchpoints

**Issue**: Low completion rates
**Solution**: Identify barriers (access, motivation, health literacy), adjust program duration and intensity

## Support and Resources

### Additional Documentation

- [API Reference](/docs/api-reference.md)
- [Integration Guide](/docs/integration.md)
- [Security Guide](/docs/security.md)
- [Compliance Guide](/docs/compliance.md)

### System Requirements

- Node.js 18+
- TypeScript 5+
- Express.js 4+
- PostgreSQL 14+ (for production deployment)

### Related Modules

- Patient Management
- Clinical Documentation
- Analytics & Business Intelligence
- AI & Machine Learning
- Revenue Cycle Management

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintained by**: ILS 2.0 Development Team
