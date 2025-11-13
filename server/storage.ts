import { db } from "../db";
import crypto from 'crypto';
import { 
  users, 
  userRoles,
  patients, 
  orders,
  consultLogs,
  purchaseOrders,
  poLineItems,
  technicalDocuments,
  organizationSettings,
  userPreferences,
  eyeExaminations,
  prescriptions,
  products,
  invoices,
  invoiceLineItems,
  companies,
  companySupplierRelationships,
  aiConversations,
  aiMessages,
  aiKnowledgeBase,
  aiLearningData,
  aiFeedback,
  aiModelVersions,
  aiModelDeployments,
  masterTrainingDatasets,
  trainingDataAnalytics,
  companyAiSettings,
  aiTrainingJobs,
  aiDeploymentQueue,
  subscriptionPlans,
  stripePaymentIntents,
  subscriptionHistory,
  dispenseRecords,
  testRooms,
  gocComplianceChecks,
  prescriptionTemplates,
  clinicalProtocols,
  insurancePayers,
  insuranceClaims,
  claimLineItems,
  claimBatches,
  claimAppeals,
  claimERAs,
  qualityMeasures,
  measureCalculations,
  starRatings,
  qualityGapAnalyses,
  qualityDashboards,
  riskScores,
  healthRiskAssessments,
  predictiveModels,
  predictiveAnalyses,
  socialDeterminants,
  riskStratificationCohorts,
  messageTemplates,
  messages,
  unsubscribes,
  audienceSegments,
  campaigns,
  campaignRecipients,
  drugs,
  drugInteractions,
  clinicalGuidelines,
  clinicalAlerts,
  treatmentRecommendations,
  diagnosticSuggestions,
  workflows,
  workflowInstances,
  workflowRunCounts,
  type UpsertUser, 
  type User, 
  type UserWithRoles,
  type InsertPatient, 
  type Patient, 
  type InsertOrder, 
  type Order, 
  type OrderWithDetails,
  type InsertConsultLog,
  type ConsultLog,
  type InsertPurchaseOrder,
  type PurchaseOrder,
  type InsertPOLineItem,
  type POLineItem,
  type PurchaseOrderWithDetails,
  type InsertTechnicalDocument,
  type TechnicalDocument,
  type TechnicalDocumentWithSupplier,
  type UpdateOrganizationSettings,
  type OrganizationSettings,
  type UpdateUserPreferences,
  type UserPreferences,
  type InsertEyeExamination,
  type EyeExamination,
  type EyeExaminationWithDetails,
  type InsertPrescription,
  type Prescription,
  type PrescriptionWithDetails,
  type InsertProduct,
  type Product,
  type InsertInvoice,
  type Invoice,
  type InvoiceWithDetails,
  type InsertInvoiceLineItem,
  type InvoiceLineItem,
  type Company,
  type InsertCompany,
  type CompanySupplierRelationship,
  type InsertCompanySupplierRelationship,
  type AiConversation,
  type InsertAiConversation,
  type AiMessage,
  type InsertAiMessage,
  type AiKnowledgeBase,
  type InsertAiKnowledgeBase,
  type AiLearningData,
  type InsertAiLearningData,
  type AiFeedback,
  type InsertAiFeedback,
  type InsurancePayer,
  type InsertInsurancePayer,
  type InsuranceClaim,
  type InsertInsuranceClaim,
  type ClaimLineItem,
  type InsertClaimLineItem,
  type ClaimBatch,
  type InsertClaimBatch,
  type ClaimAppeal,
  type InsertClaimAppeal,
  type ClaimERA,
  type InsertClaimERA,
  type QualityMeasure,
  type InsertQualityMeasure,
  type MeasureCalculation,
  type InsertMeasureCalculation,
  type StarRating,
  type InsertStarRating,
  type QualityGapAnalysis,
  type InsertQualityGapAnalysis,
  type QualityDashboard,
  type InsertQualityDashboard,
  type RiskScore,
  type InsertRiskScore,
  type HealthRiskAssessment,
  type InsertHealthRiskAssessment,
  type PredictiveModel,
  type InsertPredictiveModel,
  type PredictiveAnalysis,
  type InsertPredictiveAnalysis,
  type SocialDeterminant,
  type InsertSocialDeterminant,
  type RiskStratificationCohort,
  type InsertRiskStratificationCohort,
  type MessageTemplate,
  type InsertMessageTemplate,
  type Message,
  type InsertMessage,
  type Unsubscribe,
  type InsertUnsubscribe,
  type AudienceSegment,
  type InsertAudienceSegment,
  type Campaign,
  type InsertCampaign,
  type CampaignRecipient,
  type InsertCampaignRecipient,
  type Drug,
  type InsertDrug,
  type DrugInteraction,
  type InsertDrugInteraction,
  type ClinicalGuideline,
  type InsertClinicalGuideline,
  type ClinicalAlert,
  type InsertClinicalAlert,
  type TreatmentRecommendation,
  type InsertTreatmentRecommendation,
  type DiagnosticSuggestion,
  type InsertDiagnosticSuggestion,
  type Workflow,
  type InsertWorkflow,
  type WorkflowInstance,
  type InsertWorkflowInstance,
  type WorkflowRunCount,
  type InsertWorkflowRunCount,
  mlModels,
  riskStratifications,
  readmissionPredictions,
  noShowPredictions,
  diseaseProgressionPredictions,
  treatmentOutcomePredictions,
  type MlModel,
  type InsertMlModel,
  type RiskStratification,
  type InsertRiskStratification,
  type ReadmissionPrediction,
  type InsertReadmissionPrediction,
  type NoShowPrediction,
  type InsertNoShowPrediction,
  type DiseaseProgressionPrediction,
  type InsertDiseaseProgressionPrediction,
  type TreatmentOutcomePrediction,
  type InsertTreatmentOutcomePrediction,
  appointmentTypes,
  providerAvailability,
  appointmentBookings,
  type AppointmentType,
  type InsertAppointmentType,
  type ProviderAvailability,
  type InsertProviderAvailability,
  type AppointmentBooking,
  type InsertAppointmentBooking,
  medicalRecords,
  portalConversations,
  portalMessages,
  portalPayments,
  type MedicalRecord,
  type InsertMedicalRecord,
  type PortalConversation,
  type InsertPortalConversation,
  type PortalMessage,
  type InsertPortalMessage,
  type PortalPayment,
  type InsertPortalPayment,
  carePlans,
  careTeams,
  careGaps,
  transitionsOfCare,
  careCoordinationTasks,
  patientOutreach,
  type CarePlan,
  type InsertCarePlan,
  type CareTeam,
  type InsertCareTeam,
  type CareGap,
  type InsertCareGap,
  type TransitionOfCare,
  type InsertTransitionOfCare,
  type CareCoordinationTask,
  type InsertCareCoordinationTask,
  type PatientOutreach,
  type InsertPatientOutreach,
  diseaseRegistries,
  registryEnrollments,
  diseaseManagementPrograms,
  programEnrollments,
  clinicalMetrics,
  patientEngagement,
  outcomeTracking,
  preventiveCareRecommendations,
  type DiseaseRegistry,
  type InsertDiseaseRegistry,
  type RegistryEnrollment,
  type InsertRegistryEnrollment,
  type DiseaseManagementProgram,
  type InsertDiseaseManagementProgram,
  type ProgramEnrollment,
  type InsertProgramEnrollment,
  type ClinicalMetric,
  type InsertClinicalMetric,
  type PatientEngagement,
  type InsertPatientEngagement,
  type OutcomeTracking,
  type InsertOutcomeTracking,
  type PreventiveCareRecommendation,
  type InsertPreventiveCareRecommendation,
  qualityImprovementProjects,
  pdsaCycles,
  careBundles,
  bundleCompliance,
  performanceImprovements,
  bestPractices,
  type QualityImprovementProject,
  type InsertQualityImprovementProject,
  type PDSACycle,
  type InsertPDSACycle,
  type CareBundle,
  type InsertCareBundle,
  type BundleCompliance,
  type InsertBundleCompliance,
  type PerformanceImprovement,
  type InsertPerformanceImprovement,
  type BestPractice,
  type InsertBestPractice
} from "@shared/schema";
import { eq, desc, and, or, like, sql, gt, lt, gte, lte, ne, asc } from "drizzle-orm";
import { normalizeEmail } from "./utils/normalizeEmail";

export interface IStorage {
  getUser(id: string, companyId: string): Promise<User | undefined>;
  getUserWithRoles(id: string, companyId: string): Promise<UserWithRoles | undefined>;
  // Internal methods for authentication - bypass tenant isolation
  getUserById_Internal(id: string): Promise<User | undefined>;
  getUserWithRoles_Internal(id: string): Promise<UserWithRoles | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUserStats(): Promise<{ total: number; pending: number; active: number; suspended: number }>;
  getSuppliers(): Promise<User[]>;
  createSupplier(supplier: any): Promise<User>;
  updateSupplier(id: string, updates: any): Promise<User | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  getUserAvailableRoles(userId: string): Promise<string[]>;
  addUserRole(userId: string, role: string): Promise<void>;
  removeUserRole(userId: string, role: string): Promise<void>;
  switchUserRole(userId: string, newRole: string): Promise<User | undefined>;

  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string, companyId: string): Promise<Patient | undefined>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string, companyId: string): Promise<OrderWithDetails | undefined>;
  // Internal method for workers - bypasses tenant isolation
  getOrderById_Internal(id: string): Promise<OrderWithDetails | undefined>;
  getOrders(filters?: {
    ecpId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<OrderWithDetails[]>;
  updateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined>;
  updateOrderWithLimsJob(id: string, limsData: {
    jobId: string;
    jobStatus: string;
    sentToLabAt: Date;
    jobErrorMessage?: string | null;
  }): Promise<Order | undefined>;
  // Generic order update helper (used by workers to set PDF URL, error messages, etc.)
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  markOrderAsShipped(id: string, trackingNumber: string): Promise<OrderWithDetails | undefined>;
  getOrderStats(ecpId?: string): Promise<{
    total: number;
    pending: number;
    inProduction: number;
    completed: number;
  }>;

  createConsultLog(log: Omit<InsertConsultLog, 'ecpId'> & { ecpId: string }): Promise<ConsultLog>;
  getConsultLogs(orderId: string): Promise<ConsultLog[]>;
  getAllConsultLogs(ecpId?: string): Promise<ConsultLog[]>;
  respondToConsultLog(id: string, response: string): Promise<ConsultLog | undefined>;

  createPurchaseOrder(po: InsertPurchaseOrder & { lineItems: InsertPOLineItem[] }, createdById: string): Promise<PurchaseOrderWithDetails>;
  getPurchaseOrder(id: string): Promise<PurchaseOrderWithDetails | undefined>;
  getPurchaseOrderById(id: string): Promise<PurchaseOrderWithDetails | undefined>;
  getPurchaseOrders(filters?: {
    supplierId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrderWithDetails[]>;
  updatePOStatus(id: string, status: PurchaseOrder["status"], trackingNumber?: string, actualDeliveryDate?: Date): Promise<PurchaseOrder | undefined>;

  createTechnicalDocument(doc: InsertTechnicalDocument, supplierId: string): Promise<TechnicalDocument>;
  getTechnicalDocuments(supplierId?: string): Promise<TechnicalDocumentWithSupplier[]>;
  deleteTechnicalDocument(id: string, supplierId: string): Promise<boolean>;

  getOrganizationSettings(): Promise<OrganizationSettings | undefined>;
  updateOrganizationSettings(settings: UpdateOrganizationSettings, updatedById: string): Promise<OrganizationSettings>;
  
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: string, preferences: UpdateUserPreferences): Promise<UserPreferences>;

  getPatients(ecpId: string): Promise<Patient[]>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined>;

  createEyeExamination(examination: InsertEyeExamination, ecpId: string): Promise<EyeExamination>;
  getEyeExamination(id: string, companyId?: string): Promise<EyeExaminationWithDetails | undefined>;
  getEyeExaminations(ecpId: string, companyId?: string): Promise<EyeExaminationWithDetails[]>;
  getPatientExaminations(patientId: string, companyId?: string): Promise<EyeExaminationWithDetails[]>;
  updateEyeExamination(id: string, updates: Partial<EyeExamination>): Promise<EyeExamination | undefined>;
  finalizeExamination(id: string, ecpId: string): Promise<EyeExamination | undefined>;

  createPrescription(prescription: InsertPrescription, ecpId: string): Promise<Prescription>;
  getPrescription(id: string): Promise<PrescriptionWithDetails | undefined>;
  getPrescriptions(ecpId: string): Promise<PrescriptionWithDetails[]>;
  signPrescription(id: string, ecpId: string, signature: string): Promise<Prescription | undefined>;

  createProduct(product: InsertProduct, ecpId: string): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  getProducts(ecpId: string): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  createInvoice(invoice: InsertInvoice & { lineItems: InsertInvoiceLineItem[] }, ecpId: string): Promise<InvoiceWithDetails>;
  getInvoice(id: string, companyId: string): Promise<InvoiceWithDetails | undefined>;
  getInvoices(ecpId: string): Promise<InvoiceWithDetails[]>;
  updateInvoiceStatus(id: string, status: Invoice["status"]): Promise<Invoice | undefined>;
  recordPayment(id: string, amount: string, companyId: string): Promise<Invoice | undefined>;

  // ============== COMPANY & MULTI-TENANT METHODS ==============
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanies(filters?: { type?: string; status?: string }): Promise<Company[]>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined>;
  updateCompanyAiProgress(id: string, progress: number): Promise<void>;
  
  createCompanySupplierRelationship(relationship: InsertCompanySupplierRelationship): Promise<CompanySupplierRelationship>;
  getCompanySupplierRelationships(companyId: string): Promise<CompanySupplierRelationship[]>;
  updateSupplierRelationshipStatus(id: string, status: string, approvedBy?: string): Promise<CompanySupplierRelationship | undefined>;

  // ============== AI ASSISTANT METHODS ==============
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  getAiConversation(id: string): Promise<AiConversation | undefined>;
  getAiConversations(companyId: string, userId?: string): Promise<AiConversation[]>;
  updateAiConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation | undefined>;

  createAiMessage(message: InsertAiMessage): Promise<AiMessage>;
  getAiMessages(conversationId: string): Promise<AiMessage[]>;

  createAiKnowledgeBase(knowledge: InsertAiKnowledgeBase): Promise<AiKnowledgeBase>;
  getAiKnowledgeBase(id: string): Promise<AiKnowledgeBase | undefined>;
  getAiKnowledgeBaseByCompany(companyId: string): Promise<AiKnowledgeBase[]>;
  updateAiKnowledgeBase(id: string, updates: Partial<AiKnowledgeBase>): Promise<AiKnowledgeBase | undefined>;
  deleteAiKnowledgeBase(id: string): Promise<boolean>;

  createAiLearningData(learning: InsertAiLearningData): Promise<AiLearningData>;
  getAiLearningDataByCompany(companyId: string): Promise<AiLearningData[]>;
  updateAiLearningData(id: string, updates: Partial<AiLearningData>): Promise<AiLearningData | undefined>;
  incrementAiLearningUseCount(id: string): Promise<void>;

  createAiFeedback(feedback: InsertAiFeedback): Promise<AiFeedback>;
  getAiFeedbackByMessage(messageId: string): Promise<AiFeedback[]>;
  getAiFeedbackByCompany(companyId: string): Promise<AiFeedback[]>;

  // ============== RCM (REVENUE CYCLE MANAGEMENT) METHODS ==============
  // Insurance Payers
  createInsurancePayer(payer: InsertInsurancePayer): Promise<InsurancePayer>;
  getInsurancePayer(id: string, companyId: string): Promise<InsurancePayer | undefined>;
  getInsurancePayers(companyId: string, filters?: { active?: boolean; type?: string }): Promise<InsurancePayer[]>;
  updateInsurancePayer(id: string, companyId: string, updates: Partial<InsurancePayer>): Promise<InsurancePayer | undefined>;
  deleteInsurancePayer(id: string, companyId: string): Promise<boolean>;

  // Insurance Claims
  createInsuranceClaim(claim: InsertInsuranceClaim): Promise<InsuranceClaim>;
  getInsuranceClaim(id: string, companyId: string): Promise<InsuranceClaim | undefined>;
  getInsuranceClaims(companyId: string, filters?: { status?: string; patientId?: string; payerId?: string }): Promise<InsuranceClaim[]>;
  updateInsuranceClaim(id: string, companyId: string, updates: Partial<InsuranceClaim>): Promise<InsuranceClaim | undefined>;
  deleteInsuranceClaim(id: string, companyId: string): Promise<boolean>;

  // Claim Line Items
  createClaimLineItem(lineItem: InsertClaimLineItem): Promise<ClaimLineItem>;
  getClaimLineItem(id: string): Promise<ClaimLineItem | undefined>;
  getClaimLineItems(claimId: string): Promise<ClaimLineItem[]>;
  updateClaimLineItem(id: string, updates: Partial<ClaimLineItem>): Promise<ClaimLineItem | undefined>;
  deleteClaimLineItem(id: string): Promise<boolean>;

  // Claim Batches
  createClaimBatch(batch: InsertClaimBatch): Promise<ClaimBatch>;
  getClaimBatch(id: string, companyId: string): Promise<ClaimBatch | undefined>;
  getClaimBatches(companyId: string, filters?: { payerId?: string; status?: string }): Promise<ClaimBatch[]>;
  updateClaimBatch(id: string, companyId: string, updates: Partial<ClaimBatch>): Promise<ClaimBatch | undefined>;

  // Claim Appeals
  createClaimAppeal(appeal: InsertClaimAppeal): Promise<ClaimAppeal>;
  getClaimAppeal(id: string): Promise<ClaimAppeal | undefined>;
  getClaimAppeals(claimId: string): Promise<ClaimAppeal[]>;
  updateClaimAppeal(id: string, updates: Partial<ClaimAppeal>): Promise<ClaimAppeal | undefined>;

  // Claim ERAs (Electronic Remittance Advice)
  createClaimERA(era: InsertClaimERA): Promise<ClaimERA>;
  getClaimERA(id: string): Promise<ClaimERA | undefined>;
  getClaimERAs(payerId: string): Promise<ClaimERA[]>;
  updateClaimERA(id: string, updates: Partial<ClaimERA>): Promise<ClaimERA | undefined>;

  // ============== QUALITY MEASURES METHODS ==============
  // Quality Measures
  createQualityMeasure(measure: InsertQualityMeasure): Promise<QualityMeasure>;
  getQualityMeasure(id: string, companyId: string): Promise<QualityMeasure | undefined>;
  getQualityMeasures(companyId: string, filters?: { type?: string; active?: boolean }): Promise<QualityMeasure[]>;
  updateQualityMeasure(id: string, companyId: string, updates: Partial<QualityMeasure>): Promise<QualityMeasure | undefined>;

  // Measure Calculations
  createMeasureCalculation(calculation: InsertMeasureCalculation): Promise<MeasureCalculation>;
  getMeasureCalculation(id: string): Promise<MeasureCalculation | undefined>;
  getMeasureCalculations(measureId: string): Promise<MeasureCalculation[]>;
  updateMeasureCalculation(id: string, updates: Partial<MeasureCalculation>): Promise<MeasureCalculation | undefined>;

  // Star Ratings
  createStarRating(rating: InsertStarRating): Promise<StarRating>;
  getStarRating(id: string, companyId: string): Promise<StarRating | undefined>;
  getStarRatings(companyId: string, filters?: { year?: number }): Promise<StarRating[]>;
  updateStarRating(id: string, companyId: string, updates: Partial<StarRating>): Promise<StarRating | undefined>;

  // Quality Gap Analyses
  createQualityGapAnalysis(analysis: InsertQualityGapAnalysis): Promise<QualityGapAnalysis>;
  getQualityGapAnalysis(id: string): Promise<QualityGapAnalysis | undefined>;
  getQualityGapAnalyses(measureId: string): Promise<QualityGapAnalysis[]>;

  // Quality Dashboards
  createQualityDashboard(dashboard: InsertQualityDashboard): Promise<QualityDashboard>;
  getQualityDashboard(id: string, companyId: string): Promise<QualityDashboard | undefined>;
  getQualityDashboards(companyId: string): Promise<QualityDashboard[]>;
  updateQualityDashboard(id: string, companyId: string, updates: Partial<QualityDashboard>): Promise<QualityDashboard | undefined>;

  // ============== CARE COORDINATION METHODS ==============
  // Care Plans
  createCarePlan(plan: InsertCarePlan): Promise<CarePlan>;
  getCarePlan(id: string, companyId: string): Promise<CarePlan | null>;
  getCarePlans(companyId: string, filters?: { patientId?: string; status?: string }): Promise<CarePlan[]>;
  updateCarePlan(id: string, companyId: string, updates: Partial<CarePlan>): Promise<CarePlan | null>;

  // Care Teams
  createCareTeam(team: InsertCareTeam): Promise<CareTeam>;
  getCareTeam(id: string, companyId: string): Promise<CareTeam | null>;
  getCareTeams(companyId: string, filters?: { patientId?: string }): Promise<CareTeam[]>;
  updateCareTeam(id: string, companyId: string, updates: Partial<CareTeam>): Promise<CareTeam | null>;

  // Care Gaps
  createCareGap(gap: InsertCareGap): Promise<CareGap>;
  getCareGap(id: string, companyId: string): Promise<CareGap | null>;
  getCareGaps(companyId: string, filters?: { patientId?: string; status?: string }): Promise<CareGap[]>;
  updateCareGap(id: string, companyId: string, updates: Partial<CareGap>): Promise<CareGap | null>;

  // Care Coordination Tasks
  createCareCoordinationTask(task: InsertCareCoordinationTask): Promise<CareCoordinationTask>;
  getCareCoordinationTask(id: string, companyId: string): Promise<CareCoordinationTask | null>;
  getCareCoordinationTasks(companyId: string, filters?: { patientId?: string; status?: string }): Promise<CareCoordinationTask[]>;
  updateCareCoordinationTask(id: string, companyId: string, updates: Partial<CareCoordinationTask>): Promise<CareCoordinationTask | null>;

  // Transitions of Care
  createTransitionOfCare(transition: InsertTransitionOfCare): Promise<TransitionOfCare>;
  getTransitionOfCare(id: string, companyId: string): Promise<TransitionOfCare | null>;
  getTransitionsOfCare(companyId: string, filters?: { patientId?: string; status?: string }): Promise<TransitionOfCare[]>;
  updateTransitionOfCare(id: string, companyId: string, updates: Partial<TransitionOfCare>): Promise<TransitionOfCare | null>;

  // Patient Outreach
  createPatientOutreach(outreach: InsertPatientOutreach): Promise<PatientOutreach>;
  getPatientOutreach(id: string, companyId: string): Promise<PatientOutreach | null>;
  getPatientOutreaches(companyId: string, filters?: { patientId?: string; status?: string }): Promise<PatientOutreach[]>;
  updatePatientOutreach(id: string, companyId: string, updates: Partial<PatientOutreach>): Promise<PatientOutreach | null>;

  // ============== QUALITY IMPROVEMENT METHODS ==============
  // QI Projects
  createQIProject(project: InsertQualityImprovementProject): Promise<QualityImprovementProject>;
  getQIProject(id: string, companyId: string): Promise<QualityImprovementProject | null>;
  getQIProjects(companyId: string, filters?: { status?: string }): Promise<QualityImprovementProject[]>;
  updateQIProject(id: string, companyId: string, updates: Partial<QualityImprovementProject>): Promise<QualityImprovementProject | null>;
}

export class DbStorage implements IStorage {
  async getUser(id: string, companyId: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(and(
        eq(users.id, id),
        eq(users.companyId, companyId)
      ));
    return user;
  }

  // Internal method for authentication - bypasses tenant isolation
  // ONLY use this for authentication flows where we need to get the user's companyId
  async getUserById_Internal(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = normalizeEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const payload: UpsertUser = {
      ...userData,
      email: userData.email ? normalizeEmail(userData.email) : userData.email,
    };

    const [user] = await db
      .insert(users)
      .values(payload)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...payload,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return allUsers;
  }

  async getUserStats(): Promise<{ total: number; pending: number; active: number; suspended: number }> {
    const allUsers = await this.getAllUsers();
    
    const stats = {
      total: allUsers.length,
      pending: allUsers.filter(u => u.accountStatus === 'pending').length,
      active: allUsers.filter(u => u.accountStatus === 'active').length,
      suspended: allUsers.filter(u => u.accountStatus === 'suspended').length,
    };
    
    return stats;
  }

  async getSuppliers(): Promise<User[]> {
    const suppliers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'supplier'))
      .orderBy(users.organizationName, users.lastName);
    return suppliers;
  }

  async createSupplier(supplier: any): Promise<User> {
    const [newSupplier] = await db
      .insert(users)
      .values({
        ...supplier,
        role: 'supplier',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();
    return newSupplier;
  }

  async updateSupplier(id: string, updates: any): Promise<User | undefined> {
    const [updatedSupplier] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.role, 'supplier')))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.role, 'supplier')))
      .returning();
    return result.length > 0;
  }

  async deleteUser(id: string): Promise<boolean> {
    // First delete user roles
    await db
      .delete(userRoles)
      .where(eq(userRoles.userId, id));
    
    // Then delete the user
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0;
  }

  async getUserWithRoles(id: string, companyId: string): Promise<UserWithRoles | undefined> {
    const user = await this.getUser(id, companyId);
    if (!user) return undefined;

    const roles = await this.getUserAvailableRoles(id);
    return {
      ...user,
      availableRoles: roles
    };
  }

  // Internal method for authentication - bypasses tenant isolation
  async getUserWithRoles_Internal(id: string): Promise<UserWithRoles | undefined> {
    const user = await this.getUserById_Internal(id);
    if (!user) return undefined;

    const roles = await this.getUserAvailableRoles(id);
    return {
      ...user,
      availableRoles: roles
    };
  }

  async getUserAvailableRoles(userId: string): Promise<string[]> {
    const roles = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    // Return unique roles, including the current active role if not already in the list
    // Note: We query user directly here without companyId filter since this is an internal helper
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const roleSet = new Set(roles.map(r => r.role));
    if (user?.role) {
      roleSet.add(user.role);
    }

    return Array.from(roleSet);
  }

  async addUserRole(userId: string, role: string): Promise<void> {
    // Check if role already exists
    const existing = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)));
    
    if (existing.length === 0) {
      await db.insert(userRoles).values({
        userId,
        role: role as any,
      });
    }
  }

  async removeUserRole(userId: string, role: string): Promise<void> {
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)));
  }

  async switchUserRole(userId: string, newRole: string): Promise<User | undefined> {
    // Verify the user has access to this role
    const availableRoles = await this.getUserAvailableRoles(userId);
    
    if (!availableRoles.includes(newRole)) {
      throw new Error(`User does not have access to role: ${newRole}`);
    }

    // Update the user's active role
    return await this.updateUser(userId, { role: newRole as any });
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    // Generate customer number using database function
    const result = await db.execute(sql`SELECT generate_customer_number() as customer_number`);
    const customerNumber = (result.rows[0] as any).customer_number;

    const [patient] = await db.insert(patients).values({
      ...insertPatient,
      customerNumber,
    }).returning();
    return patient;
  }

  async getPatient(id: string, companyId: string): Promise<Patient | undefined> {
    const [patient] = await db.select()
      .from(patients)
      .where(and(
        eq(patients.id, id),
        eq(patients.companyId, companyId)
      ));
    return patient;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const [order] = await db.insert(orders).values({
      ...insertOrder,
      orderNumber,
    } as any).returning();

    return order;
  }

  async getOrder(id: string, companyId: string): Promise<OrderWithDetails | undefined> {
    const result = await db
      .select({
        order: orders,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          organizationName: users.organizationName,
        },
      })
      .from(orders)
      .innerJoin(patients, eq(orders.patientId, patients.id))
      .innerJoin(users, eq(orders.ecpId, users.id))
      .where(and(
        eq(orders.id, id),
        eq(orders.companyId, companyId)
      ))
      .limit(1);

    if (!result.length) return undefined;

    return {
      ...result[0].order,
      patient: result[0].patient,
      ecp: result[0].ecp,
    };
  }

  // Internal method for workers - bypasses tenant isolation
  async getOrderById_Internal(id: string): Promise<OrderWithDetails | undefined> {
    const result = await db
      .select({
        order: orders,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          organizationName: users.organizationName,
        },
      })
      .from(orders)
      .innerJoin(patients, eq(orders.patientId, patients.id))
      .innerJoin(users, eq(orders.ecpId, users.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!result.length) return undefined;

    return {
      ...result[0].order,
      patient: result[0].patient,
      ecp: result[0].ecp,
    };
  }

  async getOrders(filters: {
    ecpId?: string;
    companyId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderWithDetails[]> {
    const { ecpId, companyId, status, search, limit = 50, offset = 0 } = filters;

    let conditions = [];
    
    if (companyId) {
      conditions.push(eq(orders.companyId, companyId));
    }
    
    if (ecpId) {
      conditions.push(eq(orders.ecpId, ecpId));
    }
    
    if (status && status !== "all") {
      conditions.push(eq(orders.status, status as Order["status"]));
    }
    
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(patients.name, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        order: orders,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          organizationName: users.organizationName,
        },
      })
      .from(orders)
      .innerJoin(patients, eq(orders.patientId, patients.id))
      .innerJoin(users, eq(orders.ecpId, users.id))
      .where(whereClause)
      .orderBy(desc(orders.orderDate))
      .limit(limit)
      .offset(offset);

    return results.map(r => ({
      ...r.order,
      patient: r.patient,
      ecp: r.ecp,
    }));
  }

  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ 
        status,
        completedAt: status === "completed" ? new Date() : undefined,
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  async updateOrderWithLimsJob(id: string, limsData: {
    jobId: string;
    jobStatus: string;
    sentToLabAt: Date;
    jobErrorMessage?: string | null;
  }): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        jobId: limsData.jobId,
        jobStatus: limsData.jobStatus,
        sentToLabAt: limsData.sentToLabAt,
        jobErrorMessage: limsData.jobErrorMessage || null,
        status: "in_production",
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  async markOrderAsShipped(id: string, trackingNumber: string): Promise<OrderWithDetails | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        status: "shipped",
        trackingNumber,
        shippedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (!order || !order.companyId) return undefined;

    return await this.getOrder(id, order.companyId);
  }

  async getOrderStats(ecpId?: string): Promise<{
    total: number;
    pending: number;
    inProduction: number;
    completed: number;
  }> {
    const whereClause = ecpId ? eq(orders.ecpId, ecpId) : undefined;

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        inProduction: sql<number>`count(*) filter (where status = 'in_production')::int`,
        completed: sql<number>`count(*) filter (where status = 'completed')::int`,
      })
      .from(orders)
      .where(whereClause);

    return stats || { total: 0, pending: 0, inProduction: 0, completed: 0 };
  }

  async createConsultLog(insertLog: Omit<InsertConsultLog, 'ecpId'> & { ecpId: string }): Promise<ConsultLog> {
    const [log] = await db.insert(consultLogs).values(insertLog as any).returning();
    return log;
  }

  async getConsultLogs(orderId: string): Promise<ConsultLog[]> {
    return await db
      .select()
      .from(consultLogs)
      .where(eq(consultLogs.orderId, orderId))
      .orderBy(desc(consultLogs.createdAt));
  }

  async getAllConsultLogs(ecpId?: string): Promise<ConsultLog[]> {
    const query = db.select().from(consultLogs);
    
    if (ecpId) {
      return await query
        .where(eq(consultLogs.ecpId, ecpId))
        .orderBy(desc(consultLogs.createdAt));
    }
    
    return await query.orderBy(desc(consultLogs.createdAt));
  }

  async respondToConsultLog(id: string, response: string): Promise<ConsultLog | undefined> {
    const [log] = await db
      .update(consultLogs)
      .set({ 
        labResponse: response,
        status: "resolved",
        respondedAt: new Date(),
      })
      .where(eq(consultLogs.id, id))
      .returning();
    
    return log;
  }

  async createPurchaseOrder(poData: InsertPurchaseOrder & { lineItems: InsertPOLineItem[] }, createdById: string): Promise<PurchaseOrderWithDetails> {
    const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const { lineItems, ...poFields } = poData;

    const [po] = await db.insert(purchaseOrders).values({
      ...poFields,
      poNumber,
      createdById,
    }).returning();

    const insertedLineItems = await db.insert(poLineItems).values(
      lineItems.map(item => ({
        ...item,
        purchaseOrderId: po.id,
      }))
    ).returning();

    // Get supplier and createdBy info (they should be in same company as the PO)
    const supplier = po.companyId ? await this.getUser(po.supplierId, po.companyId) : undefined;
    const createdBy = po.companyId ? await this.getUser(createdById, po.companyId) : undefined;

    return {
      ...po,
      supplier: {
        id: supplier?.id || po.supplierId,
        organizationName: supplier?.organizationName || null,
        email: supplier?.email || null,
        accountNumber: supplier?.accountNumber || null,
        contactEmail: supplier?.contactEmail || null,
        contactPhone: supplier?.contactPhone || null,
      },
      createdBy: {
        id: createdBy?.id || createdById,
        firstName: createdBy?.firstName || null,
        lastName: createdBy?.lastName || null,
      },
      lineItems: insertedLineItems,
    };
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrderWithDetails | undefined> {
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));

    if (!po) return undefined;

    const items = await db
      .select()
      .from(poLineItems)
      .where(eq(poLineItems.purchaseOrderId, id));

    const supplier = po.companyId ? await this.getUser(po.supplierId, po.companyId) : undefined;
    const createdBy = po.companyId ? await this.getUser(po.createdById, po.companyId) : undefined;

    return {
      ...po,
      supplier: {
        id: supplier?.id || po.supplierId,
        organizationName: supplier?.organizationName || null,
        email: supplier?.email || null,
        accountNumber: supplier?.accountNumber || null,
        contactEmail: supplier?.contactEmail || null,
        contactPhone: supplier?.contactPhone || null,
      },
      createdBy: {
        id: createdBy?.id || po.createdById,
        firstName: createdBy?.firstName || null,
        lastName: createdBy?.lastName || null,
      },
      lineItems: items,
    };
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrderWithDetails | undefined> {
    return await this.getPurchaseOrder(id);
  }

  async getPurchaseOrders(filters: {
    supplierId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<PurchaseOrderWithDetails[]> {
    const { supplierId, status, limit = 50, offset = 0 } = filters;

    let conditions = [];
    
    if (supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, supplierId));
    }
    
    if (status && status !== "all") {
      conditions.push(eq(purchaseOrders.status, status as PurchaseOrder["status"]));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const pos = await db
      .select()
      .from(purchaseOrders)
      .where(whereClause)
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit)
      .offset(offset);

    const results: PurchaseOrderWithDetails[] = [];

    for (const po of pos) {
      const items = await db
        .select()
        .from(poLineItems)
        .where(eq(poLineItems.purchaseOrderId, po.id));

      const supplier = po.companyId ? await this.getUser(po.supplierId, po.companyId) : undefined;
      const createdBy = po.companyId ? await this.getUser(po.createdById, po.companyId) : undefined;

      results.push({
        ...po,
        supplier: {
          id: supplier?.id || po.supplierId,
          organizationName: supplier?.organizationName || null,
          email: supplier?.email || null,
          accountNumber: supplier?.accountNumber || null,
          contactEmail: supplier?.contactEmail || null,
          contactPhone: supplier?.contactPhone || null,
        },
        createdBy: {
          id: createdBy?.id || po.createdById,
          firstName: createdBy?.firstName || null,
          lastName: createdBy?.lastName || null,
        },
        lineItems: items,
      });
    }

    return results;
  }

  async updatePOStatus(id: string, status: PurchaseOrder["status"], trackingNumber?: string, actualDeliveryDate?: Date): Promise<PurchaseOrder | undefined> {
    const updateData: any = { 
      status,
      updatedAt: new Date(),
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (actualDeliveryDate) {
      updateData.actualDeliveryDate = actualDeliveryDate;
    }

    const [po] = await db
      .update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, id))
      .returning();
    
    return po;
  }

  async createTechnicalDocument(insertDoc: InsertTechnicalDocument, supplierId: string): Promise<TechnicalDocument> {
    const [doc] = await db.insert(technicalDocuments).values({
      ...insertDoc,
      supplierId,
    }).returning();
    return doc;
  }

  async getTechnicalDocuments(supplierId?: string): Promise<TechnicalDocumentWithSupplier[]> {
    const whereClause = supplierId ? eq(technicalDocuments.supplierId, supplierId) : undefined;

    const results = await db
      .select({
        doc: technicalDocuments,
        supplier: {
          id: users.id,
          organizationName: users.organizationName,
        },
      })
      .from(technicalDocuments)
      .innerJoin(users, eq(technicalDocuments.supplierId, users.id))
      .where(whereClause)
      .orderBy(desc(technicalDocuments.uploadedAt));

    return results.map(r => ({
      ...r.doc,
      supplier: r.supplier,
    }));
  }

  async deleteTechnicalDocument(id: string, supplierId: string): Promise<boolean> {
    const result = await db
      .delete(technicalDocuments)
      .where(and(
        eq(technicalDocuments.id, id),
        eq(technicalDocuments.supplierId, supplierId)
      ))
      .returning();
    
    return result.length > 0;
  }

  async getOrganizationSettings(): Promise<OrganizationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(organizationSettings)
      .limit(1);
    
    return settings;
  }

  async updateOrganizationSettings(settingsData: UpdateOrganizationSettings, updatedById: string): Promise<OrganizationSettings> {
    const existing = await this.getOrganizationSettings();

    if (existing) {
      const [updated] = await db
        .update(organizationSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
          updatedById,
        })
        .where(eq(organizationSettings.id, existing.id))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(organizationSettings)
        .values({
          ...settingsData,
          updatedById,
        })
        .returning();
      
      return created;
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    
    return prefs;
  }

  async updateUserPreferences(userId: string, preferencesData: UpdateUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);

    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({
          ...preferencesData,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(userPreferences)
        .values({
          ...preferencesData,
          userId,
        })
        .returning();
      
      return created;
    }
  }

  async getPatients(ecpId: string, companyId?: string): Promise<Patient[]> {
    const conditions = [eq(patients.ecpId, ecpId)];
    
    if (companyId) {
      conditions.push(eq(patients.companyId, companyId));
    }
    
    return await db
      .select()
      .from(patients)
      .where(and(...conditions))
      .orderBy(desc(patients.createdAt));
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set(updates)
      .where(eq(patients.id, id))
      .returning();
    
    return patient;
  }

  // Patient Activity Log methods
  async createPatientActivity(activity: any): Promise<any> {
    const { patientActivityLog } = await import("@shared/schema");
    const [log] = await db.insert(patientActivityLog).values(activity).returning();
    return log;
  }

  async getPatientActivityLog(
    patientId: string,
    companyId: string,
    options?: {
      limit?: number;
      activityTypes?: string[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<any[]> {
    const { patientActivityLog } = await import("@shared/schema");
    const { and, eq, inArray, gte, lte, desc } = await import("drizzle-orm");
    
    const conditions = [
      eq(patientActivityLog.patientId, patientId),
      eq(patientActivityLog.companyId, companyId),
    ];
    
    if (options?.activityTypes && options.activityTypes.length > 0) {
      conditions.push(inArray(patientActivityLog.activityType, options.activityTypes as any));
    }
    
    if (options?.startDate) {
      conditions.push(gte(patientActivityLog.createdAt, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(patientActivityLog.createdAt, options.endDate));
    }
    
    let query = db
      .select()
      .from(patientActivityLog)
      .where(and(...conditions))
      .orderBy(desc(patientActivityLog.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    
    return await query;
  }

  async createEyeExamination(insertExamination: InsertEyeExamination, ecpId: string): Promise<EyeExamination> {
    const [examination] = await db.insert(eyeExaminations).values({
      ...insertExamination,
      ecpId,
    } as any).returning();
    return examination;
  }

  async getEyeExamination(id: string, companyId?: string): Promise<EyeExaminationWithDetails | undefined> {
    const conditions = [eq(eyeExaminations.id, id)];
    if (companyId) {
      conditions.push(eq(eyeExaminations.companyId, companyId));
    }
    const result = await db
      .select({
        examination: eyeExaminations,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(eyeExaminations)
      .innerJoin(patients, eq(eyeExaminations.patientId, patients.id))
      .innerJoin(users, eq(eyeExaminations.ecpId, users.id))
      .where(and(...conditions))
      .limit(1);

    if (!result.length) return undefined;

    return {
      ...result[0].examination,
      patient: result[0].patient,
      ecp: result[0].ecp,
    };
  }

  async getEyeExaminations(ecpId: string, companyId?: string): Promise<EyeExaminationWithDetails[]> {
    const whereConditions = [eq(eyeExaminations.ecpId, ecpId)];
    
    // Multi-tenancy: filter by companyId if provided
    if (companyId) {
      whereConditions.push(eq(eyeExaminations.companyId, companyId));
    }
    
    const results = await db
      .select({
        examination: eyeExaminations,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(eyeExaminations)
      .innerJoin(patients, eq(eyeExaminations.patientId, patients.id))
      .innerJoin(users, eq(eyeExaminations.ecpId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(eyeExaminations.examinationDate));

    return results.map(r => ({
      ...r.examination,
      patient: r.patient,
      ecp: r.ecp,
    }));
  }

  async getPatientExaminations(patientId: string, companyId?: string): Promise<EyeExaminationWithDetails[]> {
    const whereConditions = [eq(eyeExaminations.patientId, patientId)];
    
    // Multi-tenancy: filter by companyId if provided
    if (companyId) {
      whereConditions.push(eq(eyeExaminations.companyId, companyId));
    }
    
    const results = await db
      .select({
        examination: eyeExaminations,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(eyeExaminations)
      .innerJoin(patients, eq(eyeExaminations.patientId, patients.id))
      .innerJoin(users, eq(eyeExaminations.ecpId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(eyeExaminations.examinationDate));

    return results.map(r => ({
      ...r.examination,
      patient: r.patient,
      ecp: r.ecp,
    }));
  }

  async updateEyeExamination(id: string, updates: Partial<EyeExamination>): Promise<EyeExamination | undefined> {
    const [examination] = await db
      .update(eyeExaminations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(eyeExaminations.id, id))
      .returning();
    
    return examination;
  }

  async finalizeExamination(id: string, ecpId: string): Promise<EyeExamination | undefined> {
    const [examination] = await db
      .update(eyeExaminations)
      .set({
        status: 'finalized',
        updatedAt: new Date(),
      })
      .where(and(eq(eyeExaminations.id, id), eq(eyeExaminations.ecpId, ecpId)))
      .returning();
    
    return examination;
  }

  async createPrescription(insertPrescription: InsertPrescription, ecpId: string): Promise<Prescription> {
    const [prescription] = await db.insert(prescriptions).values({
      ...insertPrescription,
      ecpId,
    } as any).returning();
    return prescription;
  }

  async getPrescription(id: string, companyId?: string): Promise<PrescriptionWithDetails | undefined> {
    const conditions = [eq(prescriptions.id, id)];
    if (companyId) {
      conditions.push(eq(prescriptions.companyId, companyId));
    }
    const result = await db
      .select({
        prescription: prescriptions,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        examination: eyeExaminations,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(users, eq(prescriptions.ecpId, users.id))
      .leftJoin(eyeExaminations, eq(prescriptions.examinationId, eyeExaminations.id))
      .where(and(...conditions))
      .limit(1);

    if (!result.length) return undefined;

    return {
      ...result[0].prescription,
      patient: result[0].patient,
      ecp: result[0].ecp,
      examination: result[0].examination || undefined,
    };
  }

  async getPrescriptions(ecpId: string, companyId?: string): Promise<PrescriptionWithDetails[]> {
    const conditions = [eq(prescriptions.ecpId, ecpId)];
    
    if (companyId) {
      conditions.push(eq(prescriptions.companyId, companyId));
    }
    
    const results = await db
      .select({
        prescription: prescriptions,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        examination: eyeExaminations,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(users, eq(prescriptions.ecpId, users.id))
      .leftJoin(eyeExaminations, eq(prescriptions.examinationId, eyeExaminations.id))
      .where(and(...conditions))
      .orderBy(desc(prescriptions.issueDate));

    return results.map(r => ({
      ...r.prescription,
      patient: r.patient,
      ecp: r.ecp,
      examination: r.examination || undefined,
    }));
  }

  async signPrescription(id: string, ecpId: string, signature: string): Promise<Prescription | undefined> {
    const [prescription] = await db
      .update(prescriptions)
      .set({
        isSigned: true,
        signedByEcpId: ecpId,
        digitalSignature: signature,
        signedAt: new Date(),
      })
      .where(eq(prescriptions.id, id))
      .returning();
    
    return prescription;
  }

  async createProduct(insertProduct: InsertProduct, ecpId: string): Promise<Product> {
    const [product] = await db.insert(products).values({
      ...insertProduct,
      ecpId,
    }).returning();
    return product;
  }

  async getProduct(id: string, companyId?: string): Promise<Product | undefined> {
    const conditions = [eq(products.id, id)];
    if (companyId) {
      conditions.push(eq(products.companyId, companyId));
    }
    const [product] = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .limit(1);
    
    return product;
  }

  async getProducts(ecpId: string, companyId?: string): Promise<Product[]> {
    const conditions = [eq(products.ecpId, ecpId)];
    
    if (companyId) {
      conditions.push(eq(products.companyId, companyId));
    }
    
    return await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(products.productType, products.brand, products.model);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    
    return result.length > 0;
  }

  async createInvoice(invoiceData: InsertInvoice & { lineItems: InsertInvoiceLineItem[] }, ecpId: string): Promise<InvoiceWithDetails> {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const { lineItems, ...invoiceFields } = invoiceData;

    const [invoice] = await db.insert(invoices).values({
      ...invoiceFields,
      invoiceNumber,
      ecpId,
    }).returning();

    const insertedLineItems = await db.insert(invoiceLineItems).values(
      lineItems.map(item => ({
        ...item,
        invoiceId: invoice.id,
      }))
    ).returning();

    let patient: Patient | undefined = undefined;
    if (invoice.patientId && invoice.companyId) {
      patient = await this.getPatient(invoice.patientId, invoice.companyId);
    }

    const ecp = invoice.companyId ? await this.getUser(ecpId, invoice.companyId) : undefined;

    return {
      ...invoice,
      patient: patient,
      ecp: {
        id: ecp?.id || ecpId,
        firstName: ecp?.firstName || null,
        lastName: ecp?.lastName || null,
      },
      lineItems: insertedLineItems,
    };
  }

  async getInvoice(id: string, companyId: string): Promise<InvoiceWithDetails | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.id, id),
        eq(invoices.companyId, companyId)
      ));

    if (!invoice) return undefined;

    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, id));

    let patient: Patient | undefined = undefined;
    if (invoice.patientId) {
      patient = await this.getPatient(invoice.patientId, companyId);
    }

    const ecp = await this.getUser(invoice.ecpId, companyId);

    return {
      ...invoice,
      patient: patient,
      ecp: {
        id: ecp?.id || invoice.ecpId,
        firstName: ecp?.firstName || null,
        lastName: ecp?.lastName || null,
      },
      lineItems: items,
    };
  }

  async getInvoices(ecpId: string, companyId?: string): Promise<InvoiceWithDetails[]> {
    const conditions = [eq(invoices.ecpId, ecpId)];
    
    if (companyId) {
      conditions.push(eq(invoices.companyId, companyId));
    }
    
    const invoicesList = await db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.invoiceDate));

    const invoicesWithDetails = await Promise.all(
      invoicesList.map(async (invoice) => {
        const items = await db
          .select()
          .from(invoiceLineItems)
          .where(eq(invoiceLineItems.invoiceId, invoice.id));

        let patient: Patient | undefined = undefined;
        if (invoice.patientId && invoice.companyId) {
          patient = await this.getPatient(invoice.patientId, invoice.companyId);
        }

        const ecp = invoice.companyId ? await this.getUser(ecpId, invoice.companyId) : undefined;

        return {
          ...invoice,
          patient: patient,
          ecp: {
            id: ecp?.id || ecpId,
            firstName: ecp?.firstName || null,
            lastName: ecp?.lastName || null,
          },
          lineItems: items,
        };
      })
    );

    return invoicesWithDetails;
  }

  async updateInvoiceStatus(id: string, status: Invoice["status"]): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    
    return invoice;
  }

  async recordPayment(id: string, amount: string, companyId: string): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id, companyId);
    if (!invoice) return undefined;

    const currentPaid = parseFloat(invoice.amountPaid);
    const paymentAmount = parseFloat(amount);
    const newAmountPaid = (currentPaid + paymentAmount).toFixed(2);
    const total = parseFloat(invoice.totalAmount);

    const newStatus = parseFloat(newAmountPaid) >= total ? 'paid' : 'draft';

    const [updated] = await db
      .update(invoices)
      .set({
        amountPaid: newAmountPaid,
        status: newStatus as Invoice["status"],
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    
    return updated;
  }

  // ============== COMPANY & MULTI-TENANT METHODS ==============

  async createCompany(company: InsertCompany): Promise<Company> {
    const [created] = await db
      .insert(companies)
      .values(company)
      .returning();
    return created;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);
    return company;
  }

  async getCompanies(filters?: { type?: string; status?: string }): Promise<Company[]> {
    let query = db.select().from(companies);
    
    const conditions = [];
    if (filters?.type) {
      conditions.push(eq(companies.type, filters.type as any));
    }
    if (filters?.status) {
      conditions.push(eq(companies.status, filters.status as any));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async updateCompanyAiProgress(id: string, progress: number): Promise<void> {
    await db
      .update(companies)
      .set({ 
        aiLearningProgress: progress,
        updatedAt: new Date() 
      })
      .where(eq(companies.id, id));
  }

  async createCompanySupplierRelationship(relationship: InsertCompanySupplierRelationship): Promise<CompanySupplierRelationship> {
    const [created] = await db
      .insert(companySupplierRelationships)
      .values(relationship)
      .returning();
    return created;
  }

  async getCompanySupplierRelationships(companyId: string): Promise<CompanySupplierRelationship[]> {
    return await db
      .select()
      .from(companySupplierRelationships)
      .where(eq(companySupplierRelationships.companyId, companyId));
  }

  async updateSupplierRelationshipStatus(
    id: string, 
    status: string, 
    approvedBy?: string
  ): Promise<CompanySupplierRelationship | undefined> {
    const [updated] = await db
      .update(companySupplierRelationships)
      .set({ 
        status,
        approvedBy,
        approvedAt: status === 'approved' ? new Date() : undefined
      })
      .where(eq(companySupplierRelationships.id, id))
      .returning();
    return updated;
  }

  // ============== AI ASSISTANT METHODS ==============

  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [created] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();
    return created;
  }

  async getAiConversation(id: string): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id))
      .limit(1);
    return conversation;
  }

  async getAiConversations(companyId: string, userId?: string): Promise<AiConversation[]> {
    const conditions = [eq(aiConversations.companyId, companyId)];
    if (userId) {
      conditions.push(eq(aiConversations.userId, userId));
    }
    
    return await db
      .select()
      .from(aiConversations)
      .where(and(...conditions))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async updateAiConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation | undefined> {
    const [updated] = await db
      .update(aiConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiConversations.id, id))
      .returning();
    return updated;
  }

  async createAiMessage(message: InsertAiMessage): Promise<AiMessage> {
    const [created] = await db
      .insert(aiMessages)
      .values(message)
      .returning();
    return created;
  }

  async getAiMessages(conversationId: string): Promise<AiMessage[]> {
    return await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);
  }

  async createAiKnowledgeBase(knowledge: InsertAiKnowledgeBase): Promise<AiKnowledgeBase> {
    const [created] = await db
      .insert(aiKnowledgeBase)
      .values(knowledge)
      .returning();
    return created;
  }

  async getAiKnowledgeBase(id: string): Promise<AiKnowledgeBase | undefined> {
    const [knowledge] = await db
      .select()
      .from(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.id, id))
      .limit(1);
    return knowledge;
  }

  async getAiKnowledgeBaseByCompany(companyId: string): Promise<AiKnowledgeBase[]> {
    return await db
      .select()
      .from(aiKnowledgeBase)
      .where(and(
        eq(aiKnowledgeBase.companyId, companyId),
        eq(aiKnowledgeBase.isActive, true)
      ))
      .orderBy(desc(aiKnowledgeBase.createdAt));
  }

  async updateAiKnowledgeBase(id: string, updates: Partial<AiKnowledgeBase>): Promise<AiKnowledgeBase | undefined> {
    const [updated] = await db
      .update(aiKnowledgeBase)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiKnowledgeBase.id, id))
      .returning();
    return updated;
  }

  async deleteAiKnowledgeBase(id: string): Promise<boolean> {
    const result = await db
      .delete(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.id, id));
    return true;
  }

  async createAiLearningData(learning: InsertAiLearningData): Promise<AiLearningData> {
    const [created] = await db
      .insert(aiLearningData)
      .values(learning)
      .returning();
    return created;
  }

  async getAiLearningDataByCompany(companyId: string): Promise<AiLearningData[]> {
    return await db
      .select()
      .from(aiLearningData)
      .where(eq(aiLearningData.companyId, companyId))
      .orderBy(desc(aiLearningData.confidence), desc(aiLearningData.useCount));
  }

  async updateAiLearningData(id: string, updates: Partial<AiLearningData>): Promise<AiLearningData | undefined> {
    const [updated] = await db
      .update(aiLearningData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiLearningData.id, id))
      .returning();
    return updated;
  }

  async incrementAiLearningUseCount(id: string): Promise<void> {
    await db
      .update(aiLearningData)
      .set({ 
        useCount: sql`${aiLearningData.useCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(aiLearningData.id, id));
  }

  async createAiFeedback(feedback: InsertAiFeedback): Promise<AiFeedback> {
    const [created] = await db
      .insert(aiFeedback)
      .values(feedback)
      .returning();
    return created;
  }

  async getAiFeedbackByMessage(messageId: string): Promise<AiFeedback[]> {
    return await db
      .select()
      .from(aiFeedback)
      .where(eq(aiFeedback.messageId, messageId));
  }

  async getAiFeedbackByCompany(companyId: string): Promise<AiFeedback[]> {
    return await db
      .select()
      .from(aiFeedback)
      .where(eq(aiFeedback.companyId, companyId))
      .orderBy(desc(aiFeedback.createdAt));
  }

  // Subscription and payment methods
  async getSubscriptionPlans() {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));
  }

  async createSubscriptionHistory(history: any) {
    const [created] = await db
      .insert(subscriptionHistory)
      .values(history)
      .returning();
    return created;
  }

  async getSubscriptionHistory(companyId: string) {
    return await db
      .select()
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.companyId, companyId))
      .orderBy(desc(subscriptionHistory.createdAt));
  }

  async createPaymentIntent(payment: any) {
    const [created] = await db
      .insert(stripePaymentIntents)
      .values(payment)
      .returning();
    return created;
  }

  async getCompanyByStripeCustomerId(customerId: string) {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.stripeCustomerId, customerId))
      .limit(1);
    return company;
  }

  async createDispenseRecord(record: any) {
    const [created] = await db
      .insert(dispenseRecords)
      .values(record)
      .returning();
    return created;
  }

  async getDispenseRecords(orderId: string) {
    return await db
      .select()
      .from(dispenseRecords)
      .where(eq(dispenseRecords.orderId, orderId));
  }

  // Master AI Training methods
  async createAiModelVersion(version: any) {
    const [created] = await db
      .insert(aiModelVersions)
      .values(version)
      .returning();
    return created;
  }

  async getAiModelVersions(status?: string) {
    if (status) {
      return await db
        .select()
        .from(aiModelVersions)
        .where(eq(aiModelVersions.status, status))
        .orderBy(desc(aiModelVersions.createdAt));
    }
    return await db
      .select()
      .from(aiModelVersions)
      .orderBy(desc(aiModelVersions.createdAt));
  }

  async getAiModelVersion(id: string) {
    const [version] = await db
      .select()
      .from(aiModelVersions)
      .where(eq(aiModelVersions.id, id))
      .limit(1);
    return version;
  }

  async updateAiModelVersion(id: string, updates: any) {
    const [updated] = await db
      .update(aiModelVersions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiModelVersions.id, id))
      .returning();
    return updated;
  }

  async createModelDeployment(deployment: any) {
    const [created] = await db
      .insert(aiModelDeployments)
      .values(deployment)
      .returning();
    return created;
  }

  async getModelDeployments(filters: { companyId?: string; modelVersionId?: string; status?: string }) {
    let query = db.select().from(aiModelDeployments);

    if (filters.companyId) {
      query = query.where(eq(aiModelDeployments.companyId, filters.companyId)) as any;
    }
    if (filters.modelVersionId) {
      query = query.where(eq(aiModelDeployments.modelVersionId, filters.modelVersionId)) as any;
    }
    if (filters.status) {
      query = query.where(eq(aiModelDeployments.deploymentStatus, filters.status)) as any;
    }

    return await query.orderBy(desc(aiModelDeployments.deployedAt));
  }

  async getModelDeploymentsByVersion(versionId: string) {
    return await db
      .select()
      .from(aiModelDeployments)
      .where(eq(aiModelDeployments.modelVersionId, versionId))
      .orderBy(desc(aiModelDeployments.deployedAt));
  }

  async createMasterTrainingDataset(dataset: any) {
    const [created] = await db
      .insert(masterTrainingDatasets)
      .values(dataset)
      .returning();
    return created;
  }

  async getMasterTrainingDatasets(filters: any) {
    let query = db.select().from(masterTrainingDatasets);

    if (filters.category) {
      query = query.where(eq(masterTrainingDatasets.category, filters.category)) as any;
    }
    if (filters.status) {
      query = query.where(eq(masterTrainingDatasets.status, filters.status)) as any;
    }
    if (filters.modelVersionId) {
      query = query.where(eq(masterTrainingDatasets.modelVersionId, filters.modelVersionId)) as any;
    }

    return await query.orderBy(desc(masterTrainingDatasets.createdAt));
  }

  async getMasterTrainingDataByVersion(versionId: string) {
    return await db
      .select()
      .from(masterTrainingDatasets)
      .where(eq(masterTrainingDatasets.modelVersionId, versionId))
      .orderBy(desc(masterTrainingDatasets.createdAt));
  }

  async updateMasterTrainingDataset(id: string, updates: any) {
    const [updated] = await db
      .update(masterTrainingDatasets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(masterTrainingDatasets.id, id))
      .returning();
    return updated;
  }

  async deleteMasterTrainingDataset(id: string) {
    await db
      .delete(masterTrainingDatasets)
      .where(eq(masterTrainingDatasets.id, id));
  }

  async createAiTrainingJob(job: any) {
    const [created] = await db
      .insert(aiTrainingJobs)
      .values(job)
      .returning();
    return created;
  }

  async getAiTrainingJobs(filters: { status?: string; modelVersionId?: string }) {
    let query = db.select().from(aiTrainingJobs);

    if (filters.status) {
      query = query.where(eq(aiTrainingJobs.status, filters.status)) as any;
    }
    if (filters.modelVersionId) {
      query = query.where(eq(aiTrainingJobs.modelVersionId, filters.modelVersionId)) as any;
    }

    return await query.orderBy(desc(aiTrainingJobs.createdAt));
  }

  async createDeploymentQueue(deployment: any) {
    const [created] = await db
      .insert(aiDeploymentQueue)
      .values(deployment)
      .returning();
    return created;
  }

  async updateDeploymentQueue(id: string, updates: any) {
    const [updated] = await db
      .update(aiDeploymentQueue)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiDeploymentQueue.id, id))
      .returning();
    return updated;
  }

  async getAllCompanyAiSettings() {
    return await db
      .select()
      .from(companyAiSettings);
  }

  async updateCompanyAiSettings(companyId: string, updates: any) {
    const [updated] = await db
      .update(companyAiSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyAiSettings.companyId, companyId))
      .returning();
    return updated;
  }

  async getTrainingDataAnalytics() {
    return await db
      .select()
      .from(trainingDataAnalytics)
      .orderBy(desc(trainingDataAnalytics.recordedAt));
  }

  // ============================================================================
  // RCM (REVENUE CYCLE MANAGEMENT) METHODS
  // ============================================================================

  // ========== Insurance Payers ==========

  async createInsurancePayer(payer: InsertInsurancePayer): Promise<InsurancePayer> {
    const [created] = await db
      .insert(insurancePayers)
      .values(payer)
      .returning();
    return created;
  }

  async getInsurancePayer(id: string, companyId: string): Promise<InsurancePayer | undefined> {
    const [payer] = await db
      .select()
      .from(insurancePayers)
      .where(and(
        eq(insurancePayers.id, id),
        eq(insurancePayers.companyId, companyId)
      ));
    return payer;
  }

  async getInsurancePayers(
    companyId: string,
    filters?: { active?: boolean; type?: string }
  ): Promise<InsurancePayer[]> {
    let query = db
      .select()
      .from(insurancePayers)
      .where(eq(insurancePayers.companyId, companyId));

    if (filters?.active !== undefined) {
      query = query.where(
        and(
          eq(insurancePayers.companyId, companyId),
          eq(insurancePayers.active, filters.active)
        )
      ) as any;
    }

    if (filters?.type) {
      query = query.where(
        and(
          eq(insurancePayers.companyId, companyId),
          eq(insurancePayers.type, filters.type as any)
        )
      ) as any;
    }

    return await query.orderBy(insurancePayers.name);
  }

  async updateInsurancePayer(
    id: string,
    companyId: string,
    updates: Partial<InsurancePayer>
  ): Promise<InsurancePayer | undefined> {
    const [updated] = await db
      .update(insurancePayers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(insurancePayers.id, id),
        eq(insurancePayers.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteInsurancePayer(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(insurancePayers)
      .where(and(
        eq(insurancePayers.id, id),
        eq(insurancePayers.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Insurance Claims ==========

  async createInsuranceClaim(claim: InsertInsuranceClaim): Promise<InsuranceClaim> {
    const [created] = await db
      .insert(insuranceClaims)
      .values(claim)
      .returning();
    return created;
  }

  async getInsuranceClaim(id: string, companyId: string): Promise<InsuranceClaim | undefined> {
    const [claim] = await db
      .select()
      .from(insuranceClaims)
      .where(and(
        eq(insuranceClaims.id, id),
        eq(insuranceClaims.companyId, companyId)
      ));
    return claim;
  }

  async getInsuranceClaims(
    companyId: string,
    filters?: { status?: string; patientId?: string; payerId?: string }
  ): Promise<InsuranceClaim[]> {
    const conditions = [eq(insuranceClaims.companyId, companyId)];

    if (filters?.status) {
      conditions.push(eq(insuranceClaims.status, filters.status as any));
    }
    if (filters?.patientId) {
      conditions.push(eq(insuranceClaims.patientId, filters.patientId));
    }
    if (filters?.payerId) {
      conditions.push(eq(insuranceClaims.payerId, filters.payerId));
    }

    return await db
      .select()
      .from(insuranceClaims)
      .where(and(...conditions))
      .orderBy(desc(insuranceClaims.serviceDate));
  }

  async updateInsuranceClaim(
    id: string,
    companyId: string,
    updates: Partial<InsuranceClaim>
  ): Promise<InsuranceClaim | undefined> {
    const [updated] = await db
      .update(insuranceClaims)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(insuranceClaims.id, id),
        eq(insuranceClaims.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteInsuranceClaim(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(insuranceClaims)
      .where(and(
        eq(insuranceClaims.id, id),
        eq(insuranceClaims.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Claim Line Items ==========

  async createClaimLineItem(lineItem: InsertClaimLineItem): Promise<ClaimLineItem> {
    const [created] = await db
      .insert(claimLineItems)
      .values(lineItem)
      .returning();
    return created;
  }

  async getClaimLineItem(id: string): Promise<ClaimLineItem | undefined> {
    const [lineItem] = await db
      .select()
      .from(claimLineItems)
      .where(eq(claimLineItems.id, id));
    return lineItem;
  }

  async getClaimLineItems(claimId: string): Promise<ClaimLineItem[]> {
    return await db
      .select()
      .from(claimLineItems)
      .where(eq(claimLineItems.claimId, claimId))
      .orderBy(claimLineItems.lineNumber);
  }

  async updateClaimLineItem(
    id: string,
    updates: Partial<ClaimLineItem>
  ): Promise<ClaimLineItem | undefined> {
    const [updated] = await db
      .update(claimLineItems)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(claimLineItems.id, id))
      .returning();
    return updated;
  }

  async deleteClaimLineItem(id: string): Promise<boolean> {
    const result = await db
      .delete(claimLineItems)
      .where(eq(claimLineItems.id, id))
      .returning();
    return result.length > 0;
  }

  // ========== Claim Batches ==========

  async createClaimBatch(batch: InsertClaimBatch): Promise<ClaimBatch> {
    const [created] = await db
      .insert(claimBatches)
      .values(batch)
      .returning();
    return created;
  }

  async getClaimBatch(id: string, companyId: string): Promise<ClaimBatch | undefined> {
    const [batch] = await db
      .select()
      .from(claimBatches)
      .where(and(
        eq(claimBatches.id, id),
        eq(claimBatches.companyId, companyId)
      ));
    return batch;
  }

  async getClaimBatches(companyId: string, filters?: { payerId?: string; status?: string }): Promise<ClaimBatch[]> {
    const conditions = [eq(claimBatches.companyId, companyId)];

    if (filters?.payerId) {
      conditions.push(eq(claimBatches.payerId, filters.payerId));
    }
    if (filters?.status) {
      conditions.push(eq(claimBatches.status, filters.status as any));
    }

    return await db
      .select()
      .from(claimBatches)
      .where(and(...conditions))
      .orderBy(desc(claimBatches.submittedAt));
  }

  async updateClaimBatch(
    id: string,
    companyId: string,
    updates: Partial<ClaimBatch>
  ): Promise<ClaimBatch | undefined> {
    const [updated] = await db
      .update(claimBatches)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(claimBatches.id, id),
        eq(claimBatches.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  // ========== Claim Appeals ==========

  async createClaimAppeal(appeal: InsertClaimAppeal): Promise<ClaimAppeal> {
    const [created] = await db
      .insert(claimAppeals)
      .values(appeal)
      .returning();
    return created;
  }

  async getClaimAppeal(id: string): Promise<ClaimAppeal | undefined> {
    const [appeal] = await db
      .select()
      .from(claimAppeals)
      .where(eq(claimAppeals.id, id));
    return appeal;
  }

  async getClaimAppeals(claimId: string): Promise<ClaimAppeal[]> {
    return await db
      .select()
      .from(claimAppeals)
      .where(eq(claimAppeals.claimId, claimId))
      .orderBy(claimAppeals.appealNumber);
  }

  async updateClaimAppeal(
    id: string,
    updates: Partial<ClaimAppeal>
  ): Promise<ClaimAppeal | undefined> {
    const [updated] = await db
      .update(claimAppeals)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(claimAppeals.id, id))
      .returning();
    return updated;
  }

  // ========== Claim ERAs ==========

  async createClaimERA(era: InsertClaimERA): Promise<ClaimERA> {
    const [created] = await db
      .insert(claimERAs)
      .values(era)
      .returning();
    return created;
  }

  async getClaimERA(id: string): Promise<ClaimERA | undefined> {
    const [era] = await db
      .select()
      .from(claimERAs)
      .where(eq(claimERAs.id, id));
    return era;
  }

  async getClaimERAs(payerId: string): Promise<ClaimERA[]> {
    return await db
      .select()
      .from(claimERAs)
      .where(eq(claimERAs.payerId, payerId))
      .orderBy(desc(claimERAs.receivedAt));
  }

  async updateClaimERA(
    id: string,
    updates: Partial<ClaimERA>
  ): Promise<ClaimERA | undefined> {
    const [updated] = await db
      .update(claimERAs)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(claimERAs.id, id))
      .returning();
    return updated;
  }

  // ========== Quality Measures ==========

  async createQualityMeasure(measure: InsertQualityMeasure): Promise<QualityMeasure> {
    const [created] = await db
      .insert(qualityMeasures)
      .values(measure)
      .returning();
    return created;
  }

  async getQualityMeasure(id: string, companyId: string): Promise<QualityMeasure | undefined> {
    const [measure] = await db
      .select()
      .from(qualityMeasures)
      .where(and(
        eq(qualityMeasures.id, id),
        eq(qualityMeasures.companyId, companyId)
      ));
    return measure;
  }

  async getQualityMeasures(companyId: string, filters?: { type?: string; active?: boolean }): Promise<QualityMeasure[]> {
    const conditions = [eq(qualityMeasures.companyId, companyId)];

    if (filters?.type) {
      conditions.push(eq(qualityMeasures.type, filters.type as any));
    }
    if (filters?.active !== undefined) {
      conditions.push(eq(qualityMeasures.active, filters.active));
    }

    return await db
      .select()
      .from(qualityMeasures)
      .where(and(...conditions))
      .orderBy(qualityMeasures.name);
  }

  async updateQualityMeasure(
    id: string,
    companyId: string,
    updates: Partial<QualityMeasure>
  ): Promise<QualityMeasure | undefined> {
    const [updated] = await db
      .update(qualityMeasures)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(qualityMeasures.id, id),
        eq(qualityMeasures.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  // ========== Measure Calculations ==========

  async createMeasureCalculation(calculation: InsertMeasureCalculation): Promise<MeasureCalculation> {
    const [created] = await db
      .insert(measureCalculations)
      .values(calculation)
      .returning();
    return created;
  }

  async getMeasureCalculation(id: string): Promise<MeasureCalculation | undefined> {
    const [calculation] = await db
      .select()
      .from(measureCalculations)
      .where(eq(measureCalculations.id, id));
    return calculation;
  }

  async getMeasureCalculations(measureId: string): Promise<MeasureCalculation[]> {
    return await db
      .select()
      .from(measureCalculations)
      .where(eq(measureCalculations.measureId, measureId))
      .orderBy(desc(measureCalculations.calculationDate));
  }

  async updateMeasureCalculation(
    id: string,
    updates: Partial<MeasureCalculation>
  ): Promise<MeasureCalculation | undefined> {
    const [updated] = await db
      .update(measureCalculations)
      .set(updates)
      .where(eq(measureCalculations.id, id))
      .returning();
    return updated;
  }

  // ========== Star Ratings ==========

  async createStarRating(rating: InsertStarRating): Promise<StarRating> {
    const [created] = await db
      .insert(starRatings)
      .values(rating)
      .returning();
    return created;
  }

  async getStarRating(id: string, companyId: string): Promise<StarRating | undefined> {
    const [rating] = await db
      .select()
      .from(starRatings)
      .where(and(
        eq(starRatings.id, id),
        eq(starRatings.companyId, companyId)
      ));
    return rating;
  }

  async getStarRatings(companyId: string, filters?: { year?: number }): Promise<StarRating[]> {
    const conditions = [eq(starRatings.companyId, companyId)];

    if (filters?.year) {
      conditions.push(eq(starRatings.measurementYear, filters.year));
    }

    return await db
      .select()
      .from(starRatings)
      .where(and(...conditions))
      .orderBy(desc(starRatings.measurementYear));
  }

  async updateStarRating(
    id: string,
    companyId: string,
    updates: Partial<StarRating>
  ): Promise<StarRating | undefined> {
    const [updated] = await db
      .update(starRatings)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(starRatings.id, id),
        eq(starRatings.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  // ========== Quality Gap Analyses ==========

  async createQualityGapAnalysis(analysis: InsertQualityGapAnalysis): Promise<QualityGapAnalysis> {
    const [created] = await db
      .insert(qualityGapAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getQualityGapAnalysis(id: string): Promise<QualityGapAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(qualityGapAnalyses)
      .where(eq(qualityGapAnalyses.id, id));
    return analysis;
  }

  async getQualityGapAnalyses(measureId: string): Promise<QualityGapAnalysis[]> {
    return await db
      .select()
      .from(qualityGapAnalyses)
      .where(eq(qualityGapAnalyses.measureId, measureId))
      .orderBy(desc(qualityGapAnalyses.analysisDate));
  }

  // ========== Quality Dashboards ==========

  async createQualityDashboard(dashboard: InsertQualityDashboard): Promise<QualityDashboard> {
    const [created] = await db
      .insert(qualityDashboards)
      .values(dashboard)
      .returning();
    return created;
  }

  async getQualityDashboard(id: string, companyId: string): Promise<QualityDashboard | undefined> {
    const [dashboard] = await db
      .select()
      .from(qualityDashboards)
      .where(and(
        eq(qualityDashboards.id, id),
        eq(qualityDashboards.companyId, companyId)
      ));
    return dashboard;
  }

  async getQualityDashboards(companyId: string): Promise<QualityDashboard[]> {
    return await db
      .select()
      .from(qualityDashboards)
      .where(eq(qualityDashboards.companyId, companyId))
      .orderBy(qualityDashboards.name);
  }

  async updateQualityDashboard(
    id: string,
    companyId: string,
    updates: Partial<QualityDashboard>
  ): Promise<QualityDashboard | undefined> {
    const [updated] = await db
      .update(qualityDashboards)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(qualityDashboards.id, id),
        eq(qualityDashboards.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  // ========== Population Health - Risk Scores ==========

  async createRiskScore(riskScore: InsertRiskScore): Promise<RiskScore> {
    const [created] = await db
      .insert(riskScores)
      .values(riskScore)
      .returning();
    return created;
  }

  async getRiskScore(id: string, companyId: string): Promise<RiskScore | undefined> {
    const [score] = await db
      .select()
      .from(riskScores)
      .where(and(
        eq(riskScores.id, id),
        eq(riskScores.companyId, companyId)
      ));
    return score;
  }

  async getRiskScores(
    companyId: string,
    filters?: {
      patientId?: string;
      riskLevel?: string;
      category?: string;
    }
  ): Promise<RiskScore[]> {
    const conditions = [eq(riskScores.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(riskScores.patientId, filters.patientId));
    }
    if (filters?.riskLevel) {
      conditions.push(eq(riskScores.riskLevel, filters.riskLevel as any));
    }
    if (filters?.category) {
      conditions.push(eq(riskScores.category, filters.category as any));
    }

    return await db
      .select()
      .from(riskScores)
      .where(and(...conditions))
      .orderBy(desc(riskScores.calculatedDate));
  }

  async updateRiskScore(
    id: string,
    companyId: string,
    updates: Partial<RiskScore>
  ): Promise<RiskScore | undefined> {
    const [updated] = await db
      .update(riskScores)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(riskScores.id, id),
        eq(riskScores.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteRiskScore(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(riskScores)
      .where(and(
        eq(riskScores.id, id),
        eq(riskScores.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Health Risk Assessments ==========

  async createHealthRiskAssessment(assessment: InsertHealthRiskAssessment): Promise<HealthRiskAssessment> {
    const [created] = await db
      .insert(healthRiskAssessments)
      .values(assessment)
      .returning();
    return created;
  }

  async getHealthRiskAssessment(id: string, companyId: string): Promise<HealthRiskAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(healthRiskAssessments)
      .where(and(
        eq(healthRiskAssessments.id, id),
        eq(healthRiskAssessments.companyId, companyId)
      ));
    return assessment;
  }

  async getHealthRiskAssessments(
    companyId: string,
    filters?: {
      patientId?: string;
      status?: string;
      assessmentType?: string;
    }
  ): Promise<HealthRiskAssessment[]> {
    const conditions = [eq(healthRiskAssessments.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(healthRiskAssessments.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(healthRiskAssessments.status, filters.status as any));
    }
    if (filters?.assessmentType) {
      conditions.push(eq(healthRiskAssessments.assessmentType, filters.assessmentType));
    }

    return await db
      .select()
      .from(healthRiskAssessments)
      .where(and(...conditions))
      .orderBy(desc(healthRiskAssessments.createdAt));
  }

  async updateHealthRiskAssessment(
    id: string,
    companyId: string,
    updates: Partial<HealthRiskAssessment>
  ): Promise<HealthRiskAssessment | undefined> {
    const [updated] = await db
      .update(healthRiskAssessments)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(healthRiskAssessments.id, id),
        eq(healthRiskAssessments.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteHealthRiskAssessment(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(healthRiskAssessments)
      .where(and(
        eq(healthRiskAssessments.id, id),
        eq(healthRiskAssessments.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Predictive Models ==========

  async createPredictiveModel(model: InsertPredictiveModel): Promise<PredictiveModel> {
    const [created] = await db
      .insert(predictiveModels)
      .values(model)
      .returning();
    return created;
  }

  async getPredictiveModel(id: string, companyId: string): Promise<PredictiveModel | undefined> {
    const [model] = await db
      .select()
      .from(predictiveModels)
      .where(and(
        eq(predictiveModels.id, id),
        eq(predictiveModels.companyId, companyId)
      ));
    return model;
  }

  async getPredictiveModels(
    companyId: string,
    filters?: {
      isActive?: boolean;
      modelType?: string;
    }
  ): Promise<PredictiveModel[]> {
    const conditions = [eq(predictiveModels.companyId, companyId)];

    if (filters?.isActive !== undefined) {
      conditions.push(eq(predictiveModels.isActive, filters.isActive));
    }
    if (filters?.modelType) {
      conditions.push(eq(predictiveModels.modelType, filters.modelType));
    }

    return await db
      .select()
      .from(predictiveModels)
      .where(and(...conditions))
      .orderBy(desc(predictiveModels.createdAt));
  }

  async updatePredictiveModel(
    id: string,
    companyId: string,
    updates: Partial<PredictiveModel>
  ): Promise<PredictiveModel | undefined> {
    const [updated] = await db
      .update(predictiveModels)
      .set(updates)
      .where(and(
        eq(predictiveModels.id, id),
        eq(predictiveModels.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deletePredictiveModel(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(predictiveModels)
      .where(and(
        eq(predictiveModels.id, id),
        eq(predictiveModels.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Predictive Analyses ==========

  async createPredictiveAnalysis(analysis: InsertPredictiveAnalysis): Promise<PredictiveAnalysis> {
    const [created] = await db
      .insert(predictiveAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getPredictiveAnalysis(id: string, companyId: string): Promise<PredictiveAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(predictiveAnalyses)
      .where(and(
        eq(predictiveAnalyses.id, id),
        eq(predictiveAnalyses.companyId, companyId)
      ));
    return analysis;
  }

  async getPredictiveAnalyses(
    companyId: string,
    filters?: {
      patientId?: string;
      modelId?: string;
      riskLevel?: string;
    }
  ): Promise<PredictiveAnalysis[]> {
    const conditions = [eq(predictiveAnalyses.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(predictiveAnalyses.patientId, filters.patientId));
    }
    if (filters?.modelId) {
      conditions.push(eq(predictiveAnalyses.modelId, filters.modelId));
    }
    if (filters?.riskLevel) {
      conditions.push(eq(predictiveAnalyses.riskLevel, filters.riskLevel as any));
    }

    return await db
      .select()
      .from(predictiveAnalyses)
      .where(and(...conditions))
      .orderBy(desc(predictiveAnalyses.analyzedDate));
  }

  async updatePredictiveAnalysis(
    id: string,
    companyId: string,
    updates: Partial<PredictiveAnalysis>
  ): Promise<PredictiveAnalysis | undefined> {
    const [updated] = await db
      .update(predictiveAnalyses)
      .set(updates)
      .where(and(
        eq(predictiveAnalyses.id, id),
        eq(predictiveAnalyses.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deletePredictiveAnalysis(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(predictiveAnalyses)
      .where(and(
        eq(predictiveAnalyses.id, id),
        eq(predictiveAnalyses.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Social Determinants ==========

  async createSocialDeterminant(determinant: InsertSocialDeterminant): Promise<SocialDeterminant> {
    const [created] = await db
      .insert(socialDeterminants)
      .values(determinant)
      .returning();
    return created;
  }

  async getSocialDeterminant(id: string, companyId: string): Promise<SocialDeterminant | undefined> {
    const [determinant] = await db
      .select()
      .from(socialDeterminants)
      .where(and(
        eq(socialDeterminants.id, id),
        eq(socialDeterminants.companyId, companyId)
      ));
    return determinant;
  }

  async getSocialDeterminants(
    companyId: string,
    filters?: {
      patientId?: string;
      category?: string;
      status?: string;
      severity?: string;
    }
  ): Promise<SocialDeterminant[]> {
    const conditions = [eq(socialDeterminants.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(socialDeterminants.patientId, filters.patientId));
    }
    if (filters?.category) {
      conditions.push(eq(socialDeterminants.category, filters.category as any));
    }
    if (filters?.status) {
      conditions.push(eq(socialDeterminants.status, filters.status as any));
    }
    if (filters?.severity) {
      conditions.push(eq(socialDeterminants.severity, filters.severity as any));
    }

    return await db
      .select()
      .from(socialDeterminants)
      .where(and(...conditions))
      .orderBy(desc(socialDeterminants.identifiedDate));
  }

  async updateSocialDeterminant(
    id: string,
    companyId: string,
    updates: Partial<SocialDeterminant>
  ): Promise<SocialDeterminant | undefined> {
    const [updated] = await db
      .update(socialDeterminants)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(socialDeterminants.id, id),
        eq(socialDeterminants.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteSocialDeterminant(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(socialDeterminants)
      .where(and(
        eq(socialDeterminants.id, id),
        eq(socialDeterminants.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Population Health - Risk Stratification Cohorts ==========

  async createRiskStratificationCohort(cohort: InsertRiskStratificationCohort): Promise<RiskStratificationCohort> {
    const [created] = await db
      .insert(riskStratificationCohorts)
      .values(cohort)
      .returning();
    return created;
  }

  async getRiskStratificationCohort(id: string, companyId: string): Promise<RiskStratificationCohort | undefined> {
    const [cohort] = await db
      .select()
      .from(riskStratificationCohorts)
      .where(and(
        eq(riskStratificationCohorts.id, id),
        eq(riskStratificationCohorts.companyId, companyId)
      ));
    return cohort;
  }

  async getRiskStratificationCohorts(
    companyId: string,
    filters?: {
      active?: boolean;
    }
  ): Promise<RiskStratificationCohort[]> {
    const conditions = [eq(riskStratificationCohorts.companyId, companyId)];

    if (filters?.active !== undefined) {
      conditions.push(eq(riskStratificationCohorts.active, filters.active));
    }

    return await db
      .select()
      .from(riskStratificationCohorts)
      .where(and(...conditions))
      .orderBy(desc(riskStratificationCohorts.createdAt));
  }

  async updateRiskStratificationCohort(
    id: string,
    companyId: string,
    updates: Partial<RiskStratificationCohort>
  ): Promise<RiskStratificationCohort | undefined> {
    const [updated] = await db
      .update(riskStratificationCohorts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(riskStratificationCohorts.id, id),
        eq(riskStratificationCohorts.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteRiskStratificationCohort(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(riskStratificationCohorts)
      .where(and(
        eq(riskStratificationCohorts.id, id),
        eq(riskStratificationCohorts.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Communications - Message Templates ==========

  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const [created] = await db
      .insert(messageTemplates)
      .values(template)
      .returning();
    return created;
  }

  async getMessageTemplate(id: string, companyId: string): Promise<MessageTemplate | undefined> {
    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.companyId, companyId)
      ));
    return template;
  }

  async getMessageTemplates(
    companyId: string,
    filters?: {
      channel?: string;
      category?: string;
      active?: boolean;
    }
  ): Promise<MessageTemplate[]> {
    const conditions = [eq(messageTemplates.companyId, companyId)];

    if (filters?.channel) {
      conditions.push(eq(messageTemplates.channel, filters.channel as any));
    }
    if (filters?.category) {
      conditions.push(eq(messageTemplates.category, filters.category as any));
    }
    if (filters?.active !== undefined) {
      conditions.push(eq(messageTemplates.active, filters.active));
    }

    return await db
      .select()
      .from(messageTemplates)
      .where(and(...conditions))
      .orderBy(desc(messageTemplates.createdAt));
  }

  async updateMessageTemplate(
    id: string,
    companyId: string,
    updates: Partial<MessageTemplate>
  ): Promise<MessageTemplate | undefined> {
    const [updated] = await db
      .update(messageTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteMessageTemplate(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(messageTemplates)
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Communications - Messages ==========

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db
      .insert(messages)
      .values(message)
      .returning();
    return created;
  }

  async getMessage(id: string, companyId: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.id, id),
        eq(messages.companyId, companyId)
      ));
    return message;
  }

  async getMessages(
    companyId: string,
    filters?: {
      recipientId?: string;
      status?: string;
      channel?: string;
      campaignId?: string;
      templateId?: string;
    }
  ): Promise<Message[]> {
    const conditions = [eq(messages.companyId, companyId)];

    if (filters?.recipientId) {
      conditions.push(eq(messages.recipientId, filters.recipientId));
    }
    if (filters?.status) {
      conditions.push(eq(messages.status, filters.status as any));
    }
    if (filters?.channel) {
      conditions.push(eq(messages.channel, filters.channel as any));
    }
    if (filters?.campaignId) {
      conditions.push(eq(messages.campaignId, filters.campaignId));
    }
    if (filters?.templateId) {
      conditions.push(eq(messages.templateId, filters.templateId));
    }

    return await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt));
  }

  async updateMessage(
    id: string,
    companyId: string,
    updates: Partial<Message>
  ): Promise<Message | undefined> {
    const [updated] = await db
      .update(messages)
      .set(updates)
      .where(and(
        eq(messages.id, id),
        eq(messages.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteMessage(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(and(
        eq(messages.id, id),
        eq(messages.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Communications - Unsubscribes ==========

  async createUnsubscribe(unsubscribe: InsertUnsubscribe): Promise<Unsubscribe> {
    const [created] = await db
      .insert(unsubscribes)
      .values(unsubscribe)
      .returning();
    return created;
  }

  async getUnsubscribe(id: string, companyId: string): Promise<Unsubscribe | undefined> {
    const [unsubscribe] = await db
      .select()
      .from(unsubscribes)
      .where(and(
        eq(unsubscribes.id, id),
        eq(unsubscribes.companyId, companyId)
      ));
    return unsubscribe;
  }

  async getUnsubscribes(
    companyId: string,
    filters?: {
      recipientId?: string;
      channel?: string;
      category?: string;
    }
  ): Promise<Unsubscribe[]> {
    const conditions = [eq(unsubscribes.companyId, companyId)];

    if (filters?.recipientId) {
      conditions.push(eq(unsubscribes.recipientId, filters.recipientId));
    }
    if (filters?.channel) {
      conditions.push(eq(unsubscribes.channel, filters.channel as any));
    }
    if (filters?.category) {
      conditions.push(eq(unsubscribes.category, filters.category as any));
    }

    return await db
      .select()
      .from(unsubscribes)
      .where(and(...conditions))
      .orderBy(desc(unsubscribes.unsubscribedAt));
  }

  async deleteUnsubscribe(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(unsubscribes)
      .where(and(
        eq(unsubscribes.id, id),
        eq(unsubscribes.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // Helper: Check if recipient is unsubscribed
  async isUnsubscribed(
    companyId: string,
    recipientId: string,
    channel: string,
    category?: string
  ): Promise<boolean> {
    const conditions = [
      eq(unsubscribes.companyId, companyId),
      eq(unsubscribes.recipientId, recipientId),
      eq(unsubscribes.channel, channel as any)
    ];

    if (category) {
      conditions.push(eq(unsubscribes.category, category as any));
    }

    const [result] = await db
      .select()
      .from(unsubscribes)
      .where(and(...conditions))
      .limit(1);

    return !!result;
  }

  // ========== Campaign Management - Audience Segments ==========

  async createAudienceSegment(segment: InsertAudienceSegment): Promise<AudienceSegment> {
    const [created] = await db
      .insert(audienceSegments)
      .values(segment)
      .returning();
    return created;
  }

  async getAudienceSegment(id: string, companyId: string): Promise<AudienceSegment | undefined> {
    const [segment] = await db
      .select()
      .from(audienceSegments)
      .where(and(
        eq(audienceSegments.id, id),
        eq(audienceSegments.companyId, companyId)
      ));
    return segment;
  }

  async getAudienceSegments(
    companyId: string,
    filters?: {
      name?: string;
    }
  ): Promise<AudienceSegment[]> {
    const conditions = [eq(audienceSegments.companyId, companyId)];

    if (filters?.name) {
      conditions.push(like(audienceSegments.name, `%${filters.name}%`));
    }

    return await db
      .select()
      .from(audienceSegments)
      .where(and(...conditions))
      .orderBy(audienceSegments.name);
  }

  async updateAudienceSegment(
    id: string,
    companyId: string,
    updates: Partial<AudienceSegment>
  ): Promise<AudienceSegment | undefined> {
    const [updated] = await db
      .update(audienceSegments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(audienceSegments.id, id),
        eq(audienceSegments.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteAudienceSegment(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(audienceSegments)
      .where(and(
        eq(audienceSegments.id, id),
        eq(audienceSegments.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Campaign Management - Campaigns ==========

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [created] = await db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return created;
  }

  async getCampaign(id: string, companyId: string): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(
        eq(campaigns.id, id),
        eq(campaigns.companyId, companyId)
      ));
    return campaign;
  }

  async getCampaigns(
    companyId: string,
    filters?: {
      status?: string;
      type?: string;
      channel?: string;
    }
  ): Promise<Campaign[]> {
    const conditions = [eq(campaigns.companyId, companyId)];

    if (filters?.status) {
      conditions.push(eq(campaigns.status, filters.status as any));
    }
    if (filters?.type) {
      conditions.push(eq(campaigns.type, filters.type as any));
    }
    if (filters?.channel) {
      conditions.push(eq(campaigns.channel, filters.channel as any));
    }

    return await db
      .select()
      .from(campaigns)
      .where(and(...conditions))
      .orderBy(desc(campaigns.createdAt));
  }

  async updateCampaign(
    id: string,
    companyId: string,
    updates: Partial<Campaign>
  ): Promise<Campaign | undefined> {
    const [updated] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(campaigns.id, id),
        eq(campaigns.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteCampaign(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(and(
        eq(campaigns.id, id),
        eq(campaigns.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Campaign Management - Campaign Recipients ==========

  async createCampaignRecipient(recipient: InsertCampaignRecipient): Promise<CampaignRecipient> {
    const [created] = await db
      .insert(campaignRecipients)
      .values(recipient)
      .returning();
    return created;
  }

  async getCampaignRecipient(id: string): Promise<CampaignRecipient | undefined> {
    const [recipient] = await db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.id, id));
    return recipient;
  }

  async getCampaignRecipients(
    campaignId: string
  ): Promise<CampaignRecipient[]> {
    return await db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.campaignId, campaignId))
      .orderBy(campaignRecipients.sentAt);
  }

  async getCampaignRecipientsByRecipient(
    recipientId: string
  ): Promise<CampaignRecipient[]> {
    return await db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.recipientId, recipientId))
      .orderBy(desc(campaignRecipients.sentAt));
  }

  async deleteCampaignRecipient(id: string): Promise<boolean> {
    const result = await db
      .delete(campaignRecipients)
      .where(eq(campaignRecipients.id, id))
      .returning();
    return result.length > 0;
  }

  // ========== Clinical Decision Support - Drugs ==========

  async createDrug(drug: InsertDrug): Promise<Drug> {
    const [created] = await db
      .insert(drugs)
      .values(drug)
      .returning();
    return created;
  }

  async getDrug(id: string, companyId: string): Promise<Drug | undefined> {
    const [drug] = await db
      .select()
      .from(drugs)
      .where(and(
        eq(drugs.id, id),
        eq(drugs.companyId, companyId)
      ));
    return drug;
  }

  async getDrugs(
    companyId: string,
    filters?: {
      name?: string;
      genericName?: string;
      drugClass?: string;
    }
  ): Promise<Drug[]> {
    const conditions = [eq(drugs.companyId, companyId)];

    if (filters?.name) {
      conditions.push(like(drugs.name, `%${filters.name}%`));
    }
    if (filters?.genericName) {
      conditions.push(like(drugs.genericName, `%${filters.genericName}%`));
    }
    if (filters?.drugClass) {
      conditions.push(eq(drugs.drugClass, filters.drugClass));
    }

    return await db
      .select()
      .from(drugs)
      .where(and(...conditions))
      .orderBy(drugs.name);
  }

  async updateDrug(
    id: string,
    companyId: string,
    updates: Partial<Drug>
  ): Promise<Drug | undefined> {
    const [updated] = await db
      .update(drugs)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(drugs.id, id),
        eq(drugs.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteDrug(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(drugs)
      .where(and(
        eq(drugs.id, id),
        eq(drugs.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Clinical Decision Support - Drug Interactions ==========

  async createDrugInteraction(interaction: InsertDrugInteraction): Promise<DrugInteraction> {
    const [created] = await db
      .insert(drugInteractions)
      .values(interaction)
      .returning();
    return created;
  }

  async getDrugInteraction(id: string, companyId: string): Promise<DrugInteraction | undefined> {
    const [interaction] = await db
      .select()
      .from(drugInteractions)
      .where(and(
        eq(drugInteractions.id, id),
        eq(drugInteractions.companyId, companyId)
      ));
    return interaction;
  }

  async getDrugInteractions(
    companyId: string,
    filters?: {
      drug1Id?: string;
      drug2Id?: string;
      severity?: string;
    }
  ): Promise<DrugInteraction[]> {
    const conditions = [eq(drugInteractions.companyId, companyId)];

    if (filters?.drug1Id) {
      conditions.push(
        or(
          eq(drugInteractions.drug1Id, filters.drug1Id),
          eq(drugInteractions.drug2Id, filters.drug1Id)
        )!
      );
    }
    if (filters?.drug2Id) {
      conditions.push(
        or(
          eq(drugInteractions.drug1Id, filters.drug2Id),
          eq(drugInteractions.drug2Id, filters.drug2Id)
        )!
      );
    }
    if (filters?.severity) {
      conditions.push(eq(drugInteractions.severity, filters.severity as any));
    }

    return await db
      .select()
      .from(drugInteractions)
      .where(and(...conditions))
      .orderBy(desc(drugInteractions.severity));
  }

  async deleteDrugInteraction(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(drugInteractions)
      .where(and(
        eq(drugInteractions.id, id),
        eq(drugInteractions.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Clinical Decision Support - Clinical Guidelines ==========

  async createClinicalGuideline(guideline: InsertClinicalGuideline): Promise<ClinicalGuideline> {
    const [created] = await db
      .insert(clinicalGuidelines)
      .values(guideline)
      .returning();
    return created;
  }

  async getClinicalGuideline(id: string, companyId: string): Promise<ClinicalGuideline | undefined> {
    const [guideline] = await db
      .select()
      .from(clinicalGuidelines)
      .where(and(
        eq(clinicalGuidelines.id, id),
        eq(clinicalGuidelines.companyId, companyId)
      ));
    return guideline;
  }

  async getClinicalGuidelines(
    companyId: string,
    filters?: {
      condition?: string;
      organization?: string;
    }
  ): Promise<ClinicalGuideline[]> {
    const conditions = [eq(clinicalGuidelines.companyId, companyId)];

    if (filters?.condition) {
      conditions.push(like(clinicalGuidelines.condition, `%${filters.condition}%`));
    }
    if (filters?.organization) {
      conditions.push(eq(clinicalGuidelines.organization, filters.organization));
    }

    return await db
      .select()
      .from(clinicalGuidelines)
      .where(and(...conditions))
      .orderBy(clinicalGuidelines.condition);
  }

  async updateClinicalGuideline(
    id: string,
    companyId: string,
    updates: Partial<ClinicalGuideline>
  ): Promise<ClinicalGuideline | undefined> {
    const [updated] = await db
      .update(clinicalGuidelines)
      .set(updates)
      .where(and(
        eq(clinicalGuidelines.id, id),
        eq(clinicalGuidelines.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteClinicalGuideline(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(clinicalGuidelines)
      .where(and(
        eq(clinicalGuidelines.id, id),
        eq(clinicalGuidelines.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Clinical Decision Support - Clinical Alerts ==========

  async createClinicalAlert(alert: InsertClinicalAlert): Promise<ClinicalAlert> {
    const [created] = await db
      .insert(clinicalAlerts)
      .values(alert)
      .returning();
    return created;
  }

  async getClinicalAlert(id: string, companyId: string): Promise<ClinicalAlert | undefined> {
    const [alert] = await db
      .select()
      .from(clinicalAlerts)
      .where(and(
        eq(clinicalAlerts.id, id),
        eq(clinicalAlerts.companyId, companyId)
      ));
    return alert;
  }

  async getClinicalAlerts(
    companyId: string,
    filters?: {
      patientId?: string;
      type?: string;
      severity?: string;
      acknowledged?: boolean;
    }
  ): Promise<ClinicalAlert[]> {
    const conditions = [eq(clinicalAlerts.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(clinicalAlerts.patientId, filters.patientId));
    }
    if (filters?.type) {
      conditions.push(eq(clinicalAlerts.type, filters.type as any));
    }
    if (filters?.severity) {
      conditions.push(eq(clinicalAlerts.severity, filters.severity as any));
    }
    if (filters?.acknowledged !== undefined) {
      if (filters.acknowledged) {
        conditions.push(sql`${clinicalAlerts.acknowledgedAt} IS NOT NULL`);
      } else {
        conditions.push(sql`${clinicalAlerts.acknowledgedAt} IS NULL`);
      }
    }

    return await db
      .select()
      .from(clinicalAlerts)
      .where(and(...conditions))
      .orderBy(desc(clinicalAlerts.createdAt));
  }

  async updateClinicalAlert(
    id: string,
    companyId: string,
    updates: Partial<ClinicalAlert>
  ): Promise<ClinicalAlert | undefined> {
    const [updated] = await db
      .update(clinicalAlerts)
      .set(updates)
      .where(and(
        eq(clinicalAlerts.id, id),
        eq(clinicalAlerts.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteClinicalAlert(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(clinicalAlerts)
      .where(and(
        eq(clinicalAlerts.id, id),
        eq(clinicalAlerts.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Clinical Decision Support - Treatment Recommendations ==========

  async createTreatmentRecommendation(recommendation: InsertTreatmentRecommendation): Promise<TreatmentRecommendation> {
    const [created] = await db
      .insert(treatmentRecommendations)
      .values(recommendation)
      .returning();
    return created;
  }

  async getTreatmentRecommendation(id: string, companyId: string): Promise<TreatmentRecommendation | undefined> {
    const [recommendation] = await db
      .select()
      .from(treatmentRecommendations)
      .where(and(
        eq(treatmentRecommendations.id, id),
        eq(treatmentRecommendations.companyId, companyId)
      ));
    return recommendation;
  }

  async getTreatmentRecommendations(
    companyId: string,
    filters?: {
      patientId?: string;
      condition?: string;
    }
  ): Promise<TreatmentRecommendation[]> {
    const conditions = [eq(treatmentRecommendations.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(treatmentRecommendations.patientId, filters.patientId));
    }
    if (filters?.condition) {
      conditions.push(like(treatmentRecommendations.condition, `%${filters.condition}%`));
    }

    return await db
      .select()
      .from(treatmentRecommendations)
      .where(and(...conditions))
      .orderBy(desc(treatmentRecommendations.createdAt));
  }

  async deleteTreatmentRecommendation(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(treatmentRecommendations)
      .where(and(
        eq(treatmentRecommendations.id, id),
        eq(treatmentRecommendations.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Clinical Decision Support - Diagnostic Suggestions ==========

  async createDiagnosticSuggestion(suggestion: InsertDiagnosticSuggestion): Promise<DiagnosticSuggestion> {
    const [created] = await db
      .insert(diagnosticSuggestions)
      .values(suggestion)
      .returning();
    return created;
  }

  async getDiagnosticSuggestion(id: string, companyId: string): Promise<DiagnosticSuggestion | undefined> {
    const [suggestion] = await db
      .select()
      .from(diagnosticSuggestions)
      .where(and(
        eq(diagnosticSuggestions.id, id),
        eq(diagnosticSuggestions.companyId, companyId)
      ));
    return suggestion;
  }

  async getDiagnosticSuggestions(
    companyId: string,
    filters?: {
      patientId?: string;
      confidence?: string;
    }
  ): Promise<DiagnosticSuggestion[]> {
    const conditions = [eq(diagnosticSuggestions.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(diagnosticSuggestions.patientId, filters.patientId));
    }
    if (filters?.confidence) {
      conditions.push(eq(diagnosticSuggestions.confidence, filters.confidence as any));
    }

    return await db
      .select()
      .from(diagnosticSuggestions)
      .where(and(...conditions))
      .orderBy(desc(diagnosticSuggestions.createdAt));
  }

  async deleteDiagnosticSuggestion(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(diagnosticSuggestions)
      .where(and(
        eq(diagnosticSuggestions.id, id),
        eq(diagnosticSuggestions.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Engagement Workflows - Workflows ==========

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [created] = await db
      .insert(workflows)
      .values(workflow)
      .returning();
    return created;
  }

  async getWorkflow(id: string, companyId: string): Promise<Workflow | undefined> {
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(and(
        eq(workflows.id, id),
        eq(workflows.companyId, companyId)
      ));
    return workflow;
  }

  async getWorkflows(
    companyId: string,
    filters?: {
      trigger?: string;
      status?: string;
    }
  ): Promise<Workflow[]> {
    const conditions = [eq(workflows.companyId, companyId)];

    if (filters?.trigger) {
      conditions.push(eq(workflows.trigger, filters.trigger as any));
    }
    if (filters?.status) {
      conditions.push(eq(workflows.status, filters.status as any));
    }

    return await db
      .select()
      .from(workflows)
      .where(and(...conditions))
      .orderBy(workflows.name);
  }

  async updateWorkflow(
    id: string,
    companyId: string,
    updates: Partial<Workflow>
  ): Promise<Workflow | undefined> {
    const [updated] = await db
      .update(workflows)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(workflows.id, id),
        eq(workflows.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteWorkflow(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(workflows)
      .where(and(
        eq(workflows.id, id),
        eq(workflows.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Engagement Workflows - Workflow Instances ==========

  async createWorkflowInstance(instance: InsertWorkflowInstance): Promise<WorkflowInstance> {
    const [created] = await db
      .insert(workflowInstances)
      .values(instance)
      .returning();
    return created;
  }

  async getWorkflowInstance(id: string, companyId: string): Promise<WorkflowInstance | undefined> {
    const [instance] = await db
      .select()
      .from(workflowInstances)
      .where(and(
        eq(workflowInstances.id, id),
        eq(workflowInstances.companyId, companyId)
      ));
    return instance;
  }

  async getWorkflowInstances(
    companyId: string,
    filters?: {
      workflowId?: string;
      patientId?: string;
      status?: string;
    }
  ): Promise<WorkflowInstance[]> {
    const conditions = [eq(workflowInstances.companyId, companyId)];

    if (filters?.workflowId) {
      conditions.push(eq(workflowInstances.workflowId, filters.workflowId));
    }
    if (filters?.patientId) {
      conditions.push(eq(workflowInstances.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(workflowInstances.status, filters.status as any));
    }

    return await db
      .select()
      .from(workflowInstances)
      .where(and(...conditions))
      .orderBy(desc(workflowInstances.startedAt));
  }

  async updateWorkflowInstance(
    id: string,
    companyId: string,
    updates: Partial<WorkflowInstance>
  ): Promise<WorkflowInstance | undefined> {
    const [updated] = await db
      .update(workflowInstances)
      .set(updates)
      .where(and(
        eq(workflowInstances.id, id),
        eq(workflowInstances.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteWorkflowInstance(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(workflowInstances)
      .where(and(
        eq(workflowInstances.id, id),
        eq(workflowInstances.companyId, companyId)
      ))
      .returning();
    return result.length > 0;
  }

  // ========== Engagement Workflows - Workflow Run Counts ==========

  async getWorkflowRunCount(
    workflowId: string,
    patientId: string,
    companyId: string
  ): Promise<WorkflowRunCount | undefined> {
    const [count] = await db
      .select()
      .from(workflowRunCounts)
      .where(and(
        eq(workflowRunCounts.workflowId, workflowId),
        eq(workflowRunCounts.patientId, patientId),
        eq(workflowRunCounts.companyId, companyId)
      ));
    return count;
  }

  async incrementWorkflowRunCount(
    workflowId: string,
    patientId: string,
    companyId: string
  ): Promise<WorkflowRunCount> {
    // Try to get existing count
    const existing = await this.getWorkflowRunCount(workflowId, patientId, companyId);

    if (existing) {
      // Increment existing
      const [updated] = await db
        .update(workflowRunCounts)
        .set({
          runCount: existing.runCount + 1,
          lastRunAt: new Date(),
        })
        .where(and(
          eq(workflowRunCounts.id, existing.id),
          eq(workflowRunCounts.companyId, companyId)
        ))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(workflowRunCounts)
        .values({
          id: crypto.randomUUID(),
          companyId,
          workflowId,
          patientId,
          runCount: 1,
          lastRunAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  async getPatientWorkflowRunCounts(
    patientId: string,
    companyId: string
  ): Promise<WorkflowRunCount[]> {
    return await db
      .select()
      .from(workflowRunCounts)
      .where(and(
        eq(workflowRunCounts.patientId, patientId),
        eq(workflowRunCounts.companyId, companyId)
      ));
  }

  // ========== Predictive Analytics - ML Models ==========

  async createMlModel(model: InsertMlModel): Promise<MlModel> {
    const [created] = await db.insert(mlModels).values(model).returning();
    return created;
  }

  async getMlModel(id: string, companyId: string): Promise<MlModel | undefined> {
    const [model] = await db
      .select()
      .from(mlModels)
      .where(and(
        eq(mlModels.id, id),
        eq(mlModels.companyId, companyId)
      ));
    return model;
  }

  async getMlModels(
    companyId: string,
    filters?: { status?: string; type?: string }
  ): Promise<MlModel[]> {
    const conditions = [eq(mlModels.companyId, companyId)];

    if (filters?.status) {
      conditions.push(eq(mlModels.status, filters.status as any));
    }
    if (filters?.type) {
      conditions.push(eq(mlModels.type, filters.type as any));
    }

    return await db
      .select()
      .from(mlModels)
      .where(and(...conditions))
      .orderBy(desc(mlModels.trainedAt));
  }

  async updateMlModel(
    id: string,
    companyId: string,
    updates: Partial<InsertMlModel>
  ): Promise<MlModel | undefined> {
    const [updated] = await db
      .update(mlModels)
      .set(updates)
      .where(and(
        eq(mlModels.id, id),
        eq(mlModels.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  // ========== Predictive Analytics - Risk Stratifications ==========

  async createRiskStratification(stratification: InsertRiskStratification): Promise<RiskStratification> {
    const [created] = await db.insert(riskStratifications).values(stratification).returning();
    return created;
  }

  async getRiskStratifications(
    companyId: string,
    patientId: string,
    riskType?: string
  ): Promise<RiskStratification[]> {
    const conditions = [
      eq(riskStratifications.companyId, companyId),
      eq(riskStratifications.patientId, patientId)
    ];

    if (riskType) {
      conditions.push(eq(riskStratifications.riskType, riskType as any));
    }

    return await db
      .select()
      .from(riskStratifications)
      .where(and(...conditions))
      .orderBy(desc(riskStratifications.createdAt));
  }

  // ========== Predictive Analytics - Readmission Predictions ==========

  async createReadmissionPrediction(prediction: InsertReadmissionPrediction): Promise<ReadmissionPrediction> {
    const [created] = await db.insert(readmissionPredictions).values(prediction).returning();
    return created;
  }

  async getReadmissionPredictions(
    companyId: string,
    filters?: { patientId?: string; admissionId?: string }
  ): Promise<ReadmissionPrediction[]> {
    const conditions = [eq(readmissionPredictions.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(readmissionPredictions.patientId, filters.patientId));
    }
    if (filters?.admissionId) {
      conditions.push(eq(readmissionPredictions.admissionId, filters.admissionId));
    }

    return await db
      .select()
      .from(readmissionPredictions)
      .where(and(...conditions))
      .orderBy(desc(readmissionPredictions.createdAt));
  }

  // ========== Predictive Analytics - No-Show Predictions ==========

  async createNoShowPrediction(prediction: InsertNoShowPrediction): Promise<NoShowPrediction> {
    const [created] = await db.insert(noShowPredictions).values(prediction).returning();
    return created;
  }

  async getNoShowPredictions(
    companyId: string,
    filters?: { patientId?: string; appointmentId?: string }
  ): Promise<NoShowPrediction[]> {
    const conditions = [eq(noShowPredictions.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(noShowPredictions.patientId, filters.patientId));
    }
    if (filters?.appointmentId) {
      conditions.push(eq(noShowPredictions.appointmentId, filters.appointmentId));
    }

    return await db
      .select()
      .from(noShowPredictions)
      .where(and(...conditions))
      .orderBy(desc(noShowPredictions.createdAt));
  }

  // ========== Predictive Analytics - Disease Progression Predictions ==========

  async createDiseaseProgressionPrediction(
    prediction: InsertDiseaseProgressionPrediction
  ): Promise<DiseaseProgressionPrediction> {
    const [created] = await db.insert(diseaseProgressionPredictions).values(prediction).returning();
    return created;
  }

  async getDiseaseProgressionPredictions(
    companyId: string,
    patientId: string,
    disease?: string
  ): Promise<DiseaseProgressionPrediction[]> {
    const conditions = [
      eq(diseaseProgressionPredictions.companyId, companyId),
      eq(diseaseProgressionPredictions.patientId, patientId)
    ];

    if (disease) {
      conditions.push(eq(diseaseProgressionPredictions.disease, disease));
    }

    return await db
      .select()
      .from(diseaseProgressionPredictions)
      .where(and(...conditions))
      .orderBy(desc(diseaseProgressionPredictions.createdAt));
  }

  // ========== Predictive Analytics - Treatment Outcome Predictions ==========

  async createTreatmentOutcomePrediction(
    prediction: InsertTreatmentOutcomePrediction
  ): Promise<TreatmentOutcomePrediction> {
    const [created] = await db.insert(treatmentOutcomePredictions).values(prediction).returning();
    return created;
  }

  async getTreatmentOutcomePredictions(
    companyId: string,
    patientId: string,
    treatment?: string
  ): Promise<TreatmentOutcomePrediction[]> {
    const conditions = [
      eq(treatmentOutcomePredictions.companyId, companyId),
      eq(treatmentOutcomePredictions.patientId, patientId)
    ];

    if (treatment) {
      conditions.push(eq(treatmentOutcomePredictions.treatment, treatment));
    }

    return await db
      .select()
      .from(treatmentOutcomePredictions)
      .where(and(...conditions))
      .orderBy(desc(treatmentOutcomePredictions.createdAt));
  }

  // ========== Predictive Analytics - Statistics ==========

  async getPredictiveAnalyticsStatistics(companyId: string): Promise<{
    totalModels: number;
    activeModels: number;
    totalRiskStratifications: number;
    totalReadmissionPredictions: number;
    totalNoShowPredictions: number;
    totalDiseaseProgressionPredictions: number;
    totalTreatmentOutcomePredictions: number;
    highRiskPredictions: number;
  }> {
    const [models] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(mlModels)
      .where(eq(mlModels.companyId, companyId));

    const [activeModelsResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(mlModels)
      .where(and(
        eq(mlModels.companyId, companyId),
        eq(mlModels.status, 'active')
      ));

    const [riskStrats] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(riskStratifications)
      .where(eq(riskStratifications.companyId, companyId));

    const [readmissions] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(readmissionPredictions)
      .where(eq(readmissionPredictions.companyId, companyId));

    const [noShows] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(noShowPredictions)
      .where(eq(noShowPredictions.companyId, companyId));

    const [diseaseProgressions] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(diseaseProgressionPredictions)
      .where(eq(diseaseProgressionPredictions.companyId, companyId));

    const [treatmentOutcomes] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(treatmentOutcomePredictions)
      .where(eq(treatmentOutcomePredictions.companyId, companyId));

    const [highRiskStrats] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(riskStratifications)
      .where(and(
        eq(riskStratifications.companyId, companyId),
        or(
          eq(riskStratifications.riskLevel, 'high'),
          eq(riskStratifications.riskLevel, 'very_high')
        )
      ));

    const [highRiskReadmissions] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(readmissionPredictions)
      .where(and(
        eq(readmissionPredictions.companyId, companyId),
        or(
          eq(readmissionPredictions.riskLevel, 'high'),
          eq(readmissionPredictions.riskLevel, 'very_high')
        )
      ));

    const [highRiskNoShows] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(noShowPredictions)
      .where(and(
        eq(noShowPredictions.companyId, companyId),
        or(
          eq(noShowPredictions.riskLevel, 'high'),
          eq(noShowPredictions.riskLevel, 'very_high')
        )
      ));

    return {
      totalModels: models?.count || 0,
      activeModels: activeModelsResult?.count || 0,
      totalRiskStratifications: riskStrats?.count || 0,
      totalReadmissionPredictions: readmissions?.count || 0,
      totalNoShowPredictions: noShows?.count || 0,
      totalDiseaseProgressionPredictions: diseaseProgressions?.count || 0,
      totalTreatmentOutcomePredictions: treatmentOutcomes?.count || 0,
      highRiskPredictions: (highRiskStrats?.count || 0) + (highRiskReadmissions?.count || 0) + (highRiskNoShows?.count || 0),
    };
  }

  // ========== Appointment Booking Storage Methods ==========

  async createAppointmentType(data: InsertAppointmentType): Promise<AppointmentType> {
    const [result] = await db.insert(appointmentTypes).values(data).returning();
    return result;
  }

  async getAppointmentType(id: string, companyId: string): Promise<AppointmentType | null> {
    const [result] = await db
      .select()
      .from(appointmentTypes)
      .where(and(eq(appointmentTypes.id, id), eq(appointmentTypes.companyId, companyId)));
    return result || null;
  }

  async getAppointmentTypes(
    companyId: string,
    options?: { onlineBookingOnly?: boolean }
  ): Promise<AppointmentType[]> {
    const conditions = [eq(appointmentTypes.companyId, companyId)];

    if (options?.onlineBookingOnly) {
      conditions.push(eq(appointmentTypes.allowOnlineBooking, true));
    }

    return await db
      .select()
      .from(appointmentTypes)
      .where(and(...conditions))
      .orderBy(appointmentTypes.name);
  }

  async updateAppointmentType(
    id: string,
    companyId: string,
    data: Partial<InsertAppointmentType>
  ): Promise<AppointmentType | null> {
    const [result] = await db
      .update(appointmentTypes)
      .set(data)
      .where(and(eq(appointmentTypes.id, id), eq(appointmentTypes.companyId, companyId)))
      .returning();
    return result || null;
  }

  async createProviderAvailability(data: InsertProviderAvailability): Promise<ProviderAvailability> {
    const [result] = await db.insert(providerAvailability).values(data).returning();
    return result;
  }

  async getProviderAvailability(
    companyId: string,
    providerId: string
  ): Promise<ProviderAvailability[]> {
    return await db
      .select()
      .from(providerAvailability)
      .where(and(
        eq(providerAvailability.companyId, companyId),
        eq(providerAvailability.providerId, providerId)
      ))
      .orderBy(providerAvailability.dayOfWeek);
  }

  async getAllProviderAvailability(companyId: string): Promise<ProviderAvailability[]> {
    return await db
      .select()
      .from(providerAvailability)
      .where(eq(providerAvailability.companyId, companyId))
      .orderBy(providerAvailability.providerId, providerAvailability.dayOfWeek);
  }

  async createAppointmentBooking(data: InsertAppointmentBooking): Promise<AppointmentBooking> {
    const [result] = await db.insert(appointmentBookings).values(data).returning();
    return result;
  }

  async getAppointmentBooking(id: string, companyId: string): Promise<AppointmentBooking | null> {
    const [result] = await db
      .select()
      .from(appointmentBookings)
      .where(and(eq(appointmentBookings.id, id), eq(appointmentBookings.companyId, companyId)));
    return result || null;
  }

  async getPatientAppointments(
    companyId: string,
    patientId: string,
    options?: {
      status?: string;
      upcoming?: boolean;
    }
  ): Promise<AppointmentBooking[]> {
    const conditions = [
      eq(appointmentBookings.companyId, companyId),
      eq(appointmentBookings.patientId, patientId),
    ];

    if (options?.status) {
      conditions.push(eq(appointmentBookings.status, options.status as any));
    }

    if (options?.upcoming) {
      conditions.push(gt(appointmentBookings.date, new Date()));
      conditions.push(ne(appointmentBookings.status, 'cancelled'));
    }

    return await db
      .select()
      .from(appointmentBookings)
      .where(and(...conditions))
      .orderBy(desc(appointmentBookings.date), desc(appointmentBookings.startTime));
  }

  async getProviderAppointments(
    companyId: string,
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AppointmentBooking[]> {
    return await db
      .select()
      .from(appointmentBookings)
      .where(and(
        eq(appointmentBookings.companyId, companyId),
        eq(appointmentBookings.providerId, providerId),
        gte(appointmentBookings.date, startDate),
        lte(appointmentBookings.date, endDate),
        ne(appointmentBookings.status, 'cancelled')
      ))
      .orderBy(appointmentBookings.date, appointmentBookings.startTime);
  }

  async updateAppointmentBooking(
    id: string,
    companyId: string,
    data: Partial<InsertAppointmentBooking>
  ): Promise<AppointmentBooking | null> {
    const [result] = await db
      .update(appointmentBookings)
      .set(data)
      .where(and(eq(appointmentBookings.id, id), eq(appointmentBookings.companyId, companyId)))
      .returning();
    return result || null;
  }

  async getAppointmentsForReminders(
    companyId: string,
    hoursAhead: number
  ): Promise<AppointmentBooking[]> {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + hoursAhead);

    return await db
      .select()
      .from(appointmentBookings)
      .where(and(
        eq(appointmentBookings.companyId, companyId),
        eq(appointmentBookings.status, 'confirmed'),
        eq(appointmentBookings.reminderSent, false),
        gt(appointmentBookings.date, now),
        lte(appointmentBookings.date, reminderTime)
      ));
  }

  async getAppointmentByConfirmationCode(
    confirmationCode: string,
    companyId: string
  ): Promise<AppointmentBooking | null> {
    const [result] = await db
      .select()
      .from(appointmentBookings)
      .where(and(
        eq(appointmentBookings.confirmationCode, confirmationCode),
        eq(appointmentBookings.companyId, companyId)
      ));
    return result || null;
  }

  // ========== Patient Portal Storage Methods ==========

  async createMedicalRecord(data: InsertMedicalRecord): Promise<MedicalRecord> {
    const [result] = await db.insert(medicalRecords).values(data).returning();
    return result;
  }

  async getMedicalRecord(id: string, companyId: string): Promise<MedicalRecord | null> {
    const [result] = await db
      .select()
      .from(medicalRecords)
      .where(and(eq(medicalRecords.id, id), eq(medicalRecords.companyId, companyId)));
    return result || null;
  }

  async getMedicalRecords(
    companyId: string,
    patientId: string,
    options?: {
      type?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<MedicalRecord[]> {
    const conditions = [
      eq(medicalRecords.companyId, companyId),
      eq(medicalRecords.patientId, patientId),
      eq(medicalRecords.viewable, true),
    ];

    if (options?.type) {
      conditions.push(eq(medicalRecords.type, options.type as any));
    }

    if (options?.startDate) {
      conditions.push(gte(medicalRecords.date, options.startDate));
    }

    if (options?.endDate) {
      conditions.push(lte(medicalRecords.date, options.endDate));
    }

    return await db
      .select()
      .from(medicalRecords)
      .where(and(...conditions))
      .orderBy(desc(medicalRecords.date));
  }

  async createPortalConversation(data: InsertPortalConversation): Promise<PortalConversation> {
    const [result] = await db.insert(portalConversations).values(data).returning();
    return result;
  }

  async getPortalConversation(id: string, companyId: string): Promise<PortalConversation | null> {
    const [result] = await db
      .select()
      .from(portalConversations)
      .where(and(eq(portalConversations.id, id), eq(portalConversations.companyId, companyId)));
    return result || null;
  }

  async getPortalConversations(companyId: string, patientId: string): Promise<PortalConversation[]> {
    return await db
      .select()
      .from(portalConversations)
      .where(and(
        eq(portalConversations.companyId, companyId),
        eq(portalConversations.patientId, patientId)
      ))
      .orderBy(desc(portalConversations.lastMessageAt));
  }

  async updatePortalConversation(
    id: string,
    companyId: string,
    data: Partial<InsertPortalConversation>
  ): Promise<PortalConversation | null> {
    const [result] = await db
      .update(portalConversations)
      .set(data)
      .where(and(eq(portalConversations.id, id), eq(portalConversations.companyId, companyId)))
      .returning();
    return result || null;
  }

  async createPortalMessage(data: InsertPortalMessage): Promise<PortalMessage> {
    const [result] = await db.insert(portalMessages).values(data).returning();
    return result;
  }

  async getPortalMessages(companyId: string, conversationId: string): Promise<PortalMessage[]> {
    return await db
      .select()
      .from(portalMessages)
      .where(and(
        eq(portalMessages.companyId, companyId),
        eq(portalMessages.conversationId, conversationId)
      ))
      .orderBy(asc(portalMessages.sentAt));
  }

  async updatePortalMessage(
    id: string,
    companyId: string,
    data: Partial<InsertPortalMessage>
  ): Promise<PortalMessage | null> {
    const [result] = await db
      .update(portalMessages)
      .set(data)
      .where(and(eq(portalMessages.id, id), eq(portalMessages.companyId, companyId)))
      .returning();
    return result || null;
  }

  async markMessagesAsRead(companyId: string, conversationId: string, recipientId: string): Promise<void> {
    await db
      .update(portalMessages)
      .set({ read: true, readAt: new Date() })
      .where(and(
        eq(portalMessages.companyId, companyId),
        eq(portalMessages.conversationId, conversationId),
        eq(portalMessages.recipientId, recipientId),
        eq(portalMessages.read, false)
      ));
  }

  async createPortalPayment(data: InsertPortalPayment): Promise<PortalPayment> {
    const [result] = await db.insert(portalPayments).values(data).returning();
    return result;
  }

  async getPortalPayment(id: string, companyId: string): Promise<PortalPayment | null> {
    const [result] = await db
      .select()
      .from(portalPayments)
      .where(and(eq(portalPayments.id, id), eq(portalPayments.companyId, companyId)));
    return result || null;
  }

  async getPatientPaymentHistory(companyId: string, patientId: string): Promise<PortalPayment[]> {
    return await db
      .select()
      .from(portalPayments)
      .where(and(
        eq(portalPayments.companyId, companyId),
        eq(portalPayments.patientId, patientId)
      ))
      .orderBy(desc(portalPayments.createdAt));
  }

  async updatePortalPayment(
    id: string,
    companyId: string,
    data: Partial<InsertPortalPayment>
  ): Promise<PortalPayment | null> {
    const [result] = await db
      .update(portalPayments)
      .set(data)
      .where(and(eq(portalPayments.id, id), eq(portalPayments.companyId, companyId)))
      .returning();
    return result || null;
  }

  // ============================================================================
  // Care Coordination Methods
  // ============================================================================

  // Care Plans
  async createCarePlan(data: InsertCarePlan): Promise<CarePlan> {
    const [result] = await db.insert(carePlans).values(data).returning();
    return result;
  }

  async getCarePlan(id: string, companyId: string): Promise<CarePlan | null> {
    const [result] = await db
      .select()
      .from(carePlans)
      .where(and(eq(carePlans.id, id), eq(carePlans.companyId, companyId)));
    return result || null;
  }

  async getCarePlans(
    companyId: string,
    filters?: { patientId?: string; status?: string; category?: string }
  ): Promise<CarePlan[]> {
    const conditions = [eq(carePlans.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(carePlans.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(carePlans.status, filters.status as any));
    }
    if (filters?.category) {
      conditions.push(eq(carePlans.category, filters.category as any));
    }

    return await db
      .select()
      .from(carePlans)
      .where(and(...conditions))
      .orderBy(desc(carePlans.nextReviewDate));
  }

  async updateCarePlan(
    id: string,
    companyId: string,
    data: Partial<InsertCarePlan>
  ): Promise<CarePlan | null> {
    const [result] = await db
      .update(carePlans)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(carePlans.id, id), eq(carePlans.companyId, companyId)))
      .returning();
    return result || null;
  }

  async deleteCarePlan(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(carePlans)
      .where(and(eq(carePlans.id, id), eq(carePlans.companyId, companyId)))
      .returning();
    return result.length > 0;
  }

  // Care Teams
  async createCareTeam(data: InsertCareTeam): Promise<CareTeam> {
    const [result] = await db.insert(careTeams).values(data).returning();
    return result;
  }

  async getCareTeam(id: string, companyId: string): Promise<CareTeam | null> {
    const [result] = await db
      .select()
      .from(careTeams)
      .where(and(eq(careTeams.id, id), eq(careTeams.companyId, companyId)));
    return result || null;
  }

  async getCareTeams(
    companyId: string,
    filters?: { patientId?: string; status?: string }
  ): Promise<CareTeam[]> {
    const conditions = [eq(careTeams.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(careTeams.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(careTeams.status, filters.status as any));
    }

    return await db
      .select()
      .from(careTeams)
      .where(and(...conditions))
      .orderBy(desc(careTeams.createdAt));
  }

  async updateCareTeam(
    id: string,
    companyId: string,
    data: Partial<InsertCareTeam>
  ): Promise<CareTeam | null> {
    const [result] = await db
      .update(careTeams)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(careTeams.id, id), eq(careTeams.companyId, companyId)))
      .returning();
    return result || null;
  }

  async deleteCareTeam(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(careTeams)
      .where(and(eq(careTeams.id, id), eq(careTeams.companyId, companyId)))
      .returning();
    return result.length > 0;
  }

  // Care Gaps
  async createCareGap(data: InsertCareGap): Promise<CareGap> {
    const [result] = await db.insert(careGaps).values(data).returning();
    return result;
  }

  async getCareGap(id: string, companyId: string): Promise<CareGap | null> {
    const [result] = await db
      .select()
      .from(careGaps)
      .where(and(eq(careGaps.id, id), eq(careGaps.companyId, companyId)));
    return result || null;
  }

  async getCareGaps(
    companyId: string,
    filters?: { patientId?: string; status?: string; category?: string; severity?: string }
  ): Promise<CareGap[]> {
    const conditions = [eq(careGaps.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(careGaps.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(careGaps.status, filters.status as any));
    }
    if (filters?.category) {
      conditions.push(eq(careGaps.category, filters.category as any));
    }
    if (filters?.severity) {
      conditions.push(eq(careGaps.severity, filters.severity as any));
    }

    return await db
      .select()
      .from(careGaps)
      .where(and(...conditions))
      .orderBy(desc(careGaps.dueDate));
  }

  async updateCareGap(
    id: string,
    companyId: string,
    data: Partial<InsertCareGap>
  ): Promise<CareGap | null> {
    const [result] = await db
      .update(careGaps)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(careGaps.id, id), eq(careGaps.companyId, companyId)))
      .returning();
    return result || null;
  }

  async deleteCareGap(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(careGaps)
      .where(and(eq(careGaps.id, id), eq(careGaps.companyId, companyId)))
      .returning();
    return result.length > 0;
  }

  // Transitions of Care
  async createTransitionOfCare(data: InsertTransitionOfCare): Promise<TransitionOfCare> {
    const [result] = await db.insert(transitionsOfCare).values(data).returning();
    return result;
  }

  async getTransitionOfCare(id: string, companyId: string): Promise<TransitionOfCare | null> {
    const [result] = await db
      .select()
      .from(transitionsOfCare)
      .where(and(eq(transitionsOfCare.id, id), eq(transitionsOfCare.companyId, companyId)));
    return result || null;
  }

  async getTransitionsOfCare(
    companyId: string,
    filters?: { patientId?: string; status?: string; transitionType?: string }
  ): Promise<TransitionOfCare[]> {
    const conditions = [eq(transitionsOfCare.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(transitionsOfCare.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(transitionsOfCare.status, filters.status as any));
    }
    if (filters?.transitionType) {
      conditions.push(eq(transitionsOfCare.transitionType, filters.transitionType as any));
    }

    return await db
      .select()
      .from(transitionsOfCare)
      .where(and(...conditions))
      .orderBy(desc(transitionsOfCare.createdAt));
  }

  async updateTransitionOfCare(
    id: string,
    companyId: string,
    data: Partial<InsertTransitionOfCare>
  ): Promise<TransitionOfCare | null> {
    const [result] = await db
      .update(transitionsOfCare)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(transitionsOfCare.id, id), eq(transitionsOfCare.companyId, companyId)))
      .returning();
    return result || null;
  }

  async deleteTransitionOfCare(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(transitionsOfCare)
      .where(and(eq(transitionsOfCare.id, id), eq(transitionsOfCare.companyId, companyId)))
      .returning();
    return result.length > 0;
  }

  // Care Coordination Tasks
  async createCareCoordinationTask(data: InsertCareCoordinationTask): Promise<CareCoordinationTask> {
    const [result] = await db.insert(careCoordinationTasks).values(data).returning();
    return result;
  }

  async getCareCoordinationTask(id: string, companyId: string): Promise<CareCoordinationTask | null> {
    const [result] = await db
      .select()
      .from(careCoordinationTasks)
      .where(and(eq(careCoordinationTasks.id, id), eq(careCoordinationTasks.companyId, companyId)));
    return result || null;
  }

  async getCareCoordinationTasks(
    companyId: string,
    filters?: {
      patientId?: string;
      status?: string;
      priority?: string;
      assignedTo?: string;
      carePlanId?: string;
    }
  ): Promise<CareCoordinationTask[]> {
    const conditions = [eq(careCoordinationTasks.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(careCoordinationTasks.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(careCoordinationTasks.status, filters.status as any));
    }
    if (filters?.priority) {
      conditions.push(eq(careCoordinationTasks.priority, filters.priority as any));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(careCoordinationTasks.assignedTo, filters.assignedTo));
    }
    if (filters?.carePlanId) {
      conditions.push(eq(careCoordinationTasks.carePlanId, filters.carePlanId));
    }

    return await db
      .select()
      .from(careCoordinationTasks)
      .where(and(...conditions))
      .orderBy(desc(careCoordinationTasks.dueDate));
  }

  async updateCareCoordinationTask(
    id: string,
    companyId: string,
    data: Partial<InsertCareCoordinationTask>
  ): Promise<CareCoordinationTask | null> {
    const [result] = await db
      .update(careCoordinationTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(careCoordinationTasks.id, id), eq(careCoordinationTasks.companyId, companyId)))
      .returning();
    return result || null;
  }

  async deleteCareCoordinationTask(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(careCoordinationTasks)
      .where(and(eq(careCoordinationTasks.id, id), eq(careCoordinationTasks.companyId, companyId)))
      .returning();
    return result.length > 0;
  }

  // Patient Outreach
  async createPatientOutreach(data: InsertPatientOutreach): Promise<PatientOutreach> {
    const [result] = await db.insert(patientOutreach).values(data).returning();
    return result;
  }

  async getPatientOutreach(id: string, companyId: string): Promise<PatientOutreach | null> {
    const [result] = await db
      .select()
      .from(patientOutreach)
      .where(and(eq(patientOutreach.id, id), eq(patientOutreach.companyId, companyId)));
    return result || null;
  }

  async getPatientOutreaches(
    companyId: string,
    filters?: {
      patientId?: string;
      status?: string;
      outreachType?: string;
      taskId?: string;
    }
  ): Promise<PatientOutreach[]> {
    const conditions = [eq(patientOutreach.companyId, companyId)];

    if (filters?.patientId) {
      conditions.push(eq(patientOutreach.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(patientOutreach.status, filters.status as any));
    }
    if (filters?.outreachType) {
      conditions.push(eq(patientOutreach.outreachType, filters.outreachType as any));
    }
    if (filters?.taskId) {
      conditions.push(eq(patientOutreach.taskId, filters.taskId));
    }

    return await db
      .select()
      .from(patientOutreach)
      .where(and(...conditions))
      .orderBy(desc(patientOutreach.scheduledDate));
  }

  async updatePatientOutreach(
    id: string,
    companyId: string,
    data: Partial<InsertPatientOutreach>
  ): Promise<PatientOutreach | null> {
    const [result] = await db
      .update(patientOutreach)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(patientOutreach.id, id), eq(patientOutreach.companyId, companyId)))
      .returning();
    return result || null;
  }

  async deletePatientOutreach(id: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(patientOutreach)
      .where(and(eq(patientOutreach.id, id), eq(patientOutreach.companyId, companyId)))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // Chronic Disease Management Methods
  // ============================================================================

  // Disease Registries
  async createDiseaseRegistry(data: InsertDiseaseRegistry): Promise<DiseaseRegistry> {
    const [result] = await db.insert(diseaseRegistries).values(data).returning();
    return result;
  }

  async getDiseaseRegistry(id: string, companyId: string): Promise<DiseaseRegistry | null> {
    const [result] = await db
      .select()
      .from(diseaseRegistries)
      .where(and(eq(diseaseRegistries.id, id), eq(diseaseRegistries.companyId, companyId)));
    return result || null;
  }

  async getDiseaseRegistries(companyId: string, filters?: { active?: boolean }): Promise<DiseaseRegistry[]> {
    const conditions = [eq(diseaseRegistries.companyId, companyId)];
    if (filters?.active !== undefined) {
      conditions.push(eq(diseaseRegistries.active, filters.active));
    }
    return await db
      .select()
      .from(diseaseRegistries)
      .where(and(...conditions))
      .orderBy(desc(diseaseRegistries.createdAt));
  }

  async updateDiseaseRegistry(
    id: string,
    companyId: string,
    data: Partial<InsertDiseaseRegistry>
  ): Promise<DiseaseRegistry | null> {
    const [result] = await db
      .update(diseaseRegistries)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(diseaseRegistries.id, id), eq(diseaseRegistries.companyId, companyId)))
      .returning();
    return result || null;
  }

  // Registry Enrollments
  async createRegistryEnrollment(data: InsertRegistryEnrollment): Promise<RegistryEnrollment> {
    const [result] = await db.insert(registryEnrollments).values(data).returning();
    return result;
  }

  async getRegistryEnrollment(id: string, companyId: string): Promise<RegistryEnrollment | null> {
    const [result] = await db
      .select()
      .from(registryEnrollments)
      .where(and(eq(registryEnrollments.id, id), eq(registryEnrollments.companyId, companyId)));
    return result || null;
  }

  async getRegistryEnrollments(
    companyId: string,
    filters?: { registryId?: string; patientId?: string; status?: string }
  ): Promise<RegistryEnrollment[]> {
    const conditions = [eq(registryEnrollments.companyId, companyId)];
    if (filters?.registryId) {
      conditions.push(eq(registryEnrollments.registryId, filters.registryId));
    }
    if (filters?.patientId) {
      conditions.push(eq(registryEnrollments.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(registryEnrollments.status, filters.status as any));
    }
    return await db
      .select()
      .from(registryEnrollments)
      .where(and(...conditions))
      .orderBy(desc(registryEnrollments.enrollmentDate));
  }

  async updateRegistryEnrollment(
    id: string,
    companyId: string,
    data: Partial<InsertRegistryEnrollment>
  ): Promise<RegistryEnrollment | null> {
    const [result] = await db
      .update(registryEnrollments)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(registryEnrollments.id, id), eq(registryEnrollments.companyId, companyId)))
      .returning();
    return result || null;
  }

  // Disease Management Programs
  async createDiseaseManagementProgram(data: InsertDiseaseManagementProgram): Promise<DiseaseManagementProgram> {
    const [result] = await db.insert(diseaseManagementPrograms).values(data).returning();
    return result;
  }

  async getDiseaseManagementProgram(id: string, companyId: string): Promise<DiseaseManagementProgram | null> {
    const [result] = await db
      .select()
      .from(diseaseManagementPrograms)
      .where(and(eq(diseaseManagementPrograms.id, id), eq(diseaseManagementPrograms.companyId, companyId)));
    return result || null;
  }

  async getDiseaseManagementPrograms(
    companyId: string,
    filters?: { diseaseType?: string; active?: boolean }
  ): Promise<DiseaseManagementProgram[]> {
    const conditions = [eq(diseaseManagementPrograms.companyId, companyId)];
    if (filters?.diseaseType) {
      conditions.push(eq(diseaseManagementPrograms.diseaseType, filters.diseaseType));
    }
    if (filters?.active !== undefined) {
      conditions.push(eq(diseaseManagementPrograms.active, filters.active));
    }
    return await db
      .select()
      .from(diseaseManagementPrograms)
      .where(and(...conditions))
      .orderBy(desc(diseaseManagementPrograms.createdAt));
  }

  async updateDiseaseManagementProgram(
    id: string,
    companyId: string,
    data: Partial<InsertDiseaseManagementProgram>
  ): Promise<DiseaseManagementProgram | null> {
    const [result] = await db
      .update(diseaseManagementPrograms)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(diseaseManagementPrograms.id, id), eq(diseaseManagementPrograms.companyId, companyId)))
      .returning();
    return result || null;
  }

  // Program Enrollments
  async createProgramEnrollment(data: InsertProgramEnrollment): Promise<ProgramEnrollment> {
    const [result] = await db.insert(programEnrollments).values(data).returning();
    return result;
  }

  async getProgramEnrollment(id: string, companyId: string): Promise<ProgramEnrollment | null> {
    const [result] = await db
      .select()
      .from(programEnrollments)
      .where(and(eq(programEnrollments.id, id), eq(programEnrollments.companyId, companyId)));
    return result || null;
  }

  async getProgramEnrollments(
    companyId: string,
    filters?: { programId?: string; patientId?: string; status?: string; assignedCoach?: string }
  ): Promise<ProgramEnrollment[]> {
    const conditions = [eq(programEnrollments.companyId, companyId)];
    if (filters?.programId) {
      conditions.push(eq(programEnrollments.programId, filters.programId));
    }
    if (filters?.patientId) {
      conditions.push(eq(programEnrollments.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(programEnrollments.status, filters.status as any));
    }
    if (filters?.assignedCoach) {
      conditions.push(eq(programEnrollments.assignedCoach, filters.assignedCoach));
    }
    return await db
      .select()
      .from(programEnrollments)
      .where(and(...conditions))
      .orderBy(desc(programEnrollments.enrollmentDate));
  }

  async updateProgramEnrollment(
    id: string,
    companyId: string,
    data: Partial<InsertProgramEnrollment>
  ): Promise<ProgramEnrollment | null> {
    const [result] = await db
      .update(programEnrollments)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(programEnrollments.id, id), eq(programEnrollments.companyId, companyId)))
      .returning();
    return result || null;
  }

  // Clinical Metrics
  async createClinicalMetric(data: InsertClinicalMetric): Promise<ClinicalMetric> {
    const [result] = await db.insert(clinicalMetrics).values(data).returning();
    return result;
  }

  async getClinicalMetric(id: string, companyId: string): Promise<ClinicalMetric | null> {
    const [result] = await db
      .select()
      .from(clinicalMetrics)
      .where(and(eq(clinicalMetrics.id, id), eq(clinicalMetrics.companyId, companyId)));
    return result || null;
  }

  async getClinicalMetrics(
    companyId: string,
    filters?: { patientId?: string; registryId?: string; programId?: string; metricType?: string }
  ): Promise<ClinicalMetric[]> {
    const conditions = [eq(clinicalMetrics.companyId, companyId)];
    if (filters?.patientId) {
      conditions.push(eq(clinicalMetrics.patientId, filters.patientId));
    }
    if (filters?.registryId) {
      conditions.push(eq(clinicalMetrics.registryId, filters.registryId));
    }
    if (filters?.programId) {
      conditions.push(eq(clinicalMetrics.programId, filters.programId));
    }
    if (filters?.metricType) {
      conditions.push(eq(clinicalMetrics.metricType, filters.metricType));
    }
    return await db
      .select()
      .from(clinicalMetrics)
      .where(and(...conditions))
      .orderBy(desc(clinicalMetrics.measurementDate));
  }

  // Patient Engagement
  async createPatientEngagementRecord(data: InsertPatientEngagement): Promise<PatientEngagement> {
    const [result] = await db.insert(patientEngagement).values(data).returning();
    return result;
  }

  async getPatientEngagementRecord(id: string, companyId: string): Promise<PatientEngagement | null> {
    const [result] = await db
      .select()
      .from(patientEngagement)
      .where(and(eq(patientEngagement.id, id), eq(patientEngagement.companyId, companyId)));
    return result || null;
  }

  async getPatientEngagementRecords(
    companyId: string,
    filters?: { patientId?: string; programId?: string; engagementType?: string }
  ): Promise<PatientEngagement[]> {
    const conditions = [eq(patientEngagement.companyId, companyId)];
    if (filters?.patientId) {
      conditions.push(eq(patientEngagement.patientId, filters.patientId));
    }
    if (filters?.programId) {
      conditions.push(eq(patientEngagement.programId, filters.programId));
    }
    if (filters?.engagementType) {
      conditions.push(eq(patientEngagement.engagementType, filters.engagementType as any));
    }
    return await db
      .select()
      .from(patientEngagement)
      .where(and(...conditions))
      .orderBy(desc(patientEngagement.engagementDate));
  }

  // Outcome Tracking
  async createOutcomeTracking(data: InsertOutcomeTracking): Promise<OutcomeTracking> {
    const [result] = await db.insert(outcomeTracking).values(data).returning();
    return result;
  }

  async getOutcomeTracking(id: string, companyId: string): Promise<OutcomeTracking | null> {
    const [result] = await db
      .select()
      .from(outcomeTracking)
      .where(and(eq(outcomeTracking.id, id), eq(outcomeTracking.companyId, companyId)));
    return result || null;
  }

  async getOutcomeTrackings(
    companyId: string,
    filters?: { patientId?: string; programId?: string; registryId?: string; outcomeType?: string }
  ): Promise<OutcomeTracking[]> {
    const conditions = [eq(outcomeTracking.companyId, companyId)];
    if (filters?.patientId) {
      conditions.push(eq(outcomeTracking.patientId, filters.patientId));
    }
    if (filters?.programId) {
      conditions.push(eq(outcomeTracking.programId, filters.programId));
    }
    if (filters?.registryId) {
      conditions.push(eq(outcomeTracking.registryId, filters.registryId));
    }
    if (filters?.outcomeType) {
      conditions.push(eq(outcomeTracking.outcomeType, filters.outcomeType as any));
    }
    return await db
      .select()
      .from(outcomeTracking)
      .where(and(...conditions))
      .orderBy(desc(outcomeTracking.latestMeasurementDate));
  }

  async updateOutcomeTracking(
    id: string,
    companyId: string,
    data: Partial<InsertOutcomeTracking>
  ): Promise<OutcomeTracking | null> {
    const [result] = await db
      .update(outcomeTracking)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(outcomeTracking.id, id), eq(outcomeTracking.companyId, companyId)))
      .returning();
    return result || null;
  }

  // Preventive Care Recommendations
  async createPreventiveCareRecommendation(data: InsertPreventiveCareRecommendation): Promise<PreventiveCareRecommendation> {
    const [result] = await db.insert(preventiveCareRecommendations).values(data).returning();
    return result;
  }

  async getPreventiveCareRecommendation(id: string, companyId: string): Promise<PreventiveCareRecommendation | null> {
    const [result] = await db
      .select()
      .from(preventiveCareRecommendations)
      .where(and(eq(preventiveCareRecommendations.id, id), eq(preventiveCareRecommendations.companyId, companyId)));
    return result || null;
  }

  async getPreventiveCareRecommendations(
    companyId: string,
    filters?: { patientId?: string; status?: string; recommendationType?: string }
  ): Promise<PreventiveCareRecommendation[]> {
    const conditions = [eq(preventiveCareRecommendations.companyId, companyId)];
    if (filters?.patientId) {
      conditions.push(eq(preventiveCareRecommendations.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(preventiveCareRecommendations.status, filters.status as any));
    }
    if (filters?.recommendationType) {
      conditions.push(eq(preventiveCareRecommendations.recommendationType, filters.recommendationType as any));
    }
    return await db
      .select()
      .from(preventiveCareRecommendations)
      .where(and(...conditions))
      .orderBy(desc(preventiveCareRecommendations.dueDate));
  }

  async updatePreventiveCareRecommendation(
    id: string,
    companyId: string,
    data: Partial<InsertPreventiveCareRecommendation>
  ): Promise<PreventiveCareRecommendation | null> {
    const [result] = await db
      .update(preventiveCareRecommendations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(preventiveCareRecommendations.id, id), eq(preventiveCareRecommendations.companyId, companyId)))
      .returning();
    return result || null;
  }

  // ============================================================================
  // Quality Improvement Methods
  // ============================================================================

  // Quality Improvement Projects
  async createQIProject(data: InsertQualityImprovementProject): Promise<QualityImprovementProject> {
    const [result] = await db.insert(qualityImprovementProjects).values(data).returning();
    return result;
  }

  async getQIProject(companyId: string, id: string): Promise<QualityImprovementProject | undefined> {
    const result = await db
      .select()
      .from(qualityImprovementProjects)
      .where(and(eq(qualityImprovementProjects.id, id), eq(qualityImprovementProjects.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async getQIProjects(companyId: string, filters?: { status?: string }): Promise<QualityImprovementProject[]> {
    const conditions = [eq(qualityImprovementProjects.companyId, companyId)];
    if (filters?.status) {
      conditions.push(eq(qualityImprovementProjects.status, filters.status as any));
    }
    return await db
      .select()
      .from(qualityImprovementProjects)
      .where(and(...conditions))
      .orderBy(desc(qualityImprovementProjects.createdAt));
  }

  async updateQIProject(
    companyId: string,
    id: string,
    data: Partial<InsertQualityImprovementProject>
  ): Promise<QualityImprovementProject | null> {
    const [result] = await db
      .update(qualityImprovementProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(qualityImprovementProjects.id, id), eq(qualityImprovementProjects.companyId, companyId)))
      .returning();
    return result || null;
  }

  // PDSA Cycles
  async createPDSACycle(data: InsertPDSACycle): Promise<PDSACycle> {
    const [result] = await db.insert(pdsaCycles).values(data).returning();
    return result;
  }

  async getPDSACycle(companyId: string, id: string): Promise<PDSACycle | undefined> {
    const result = await db
      .select()
      .from(pdsaCycles)
      .where(and(eq(pdsaCycles.id, id), eq(pdsaCycles.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async getPDSACyclesByProject(companyId: string, projectId: string): Promise<PDSACycle[]> {
    return await db
      .select()
      .from(pdsaCycles)
      .where(and(eq(pdsaCycles.projectId, projectId), eq(pdsaCycles.companyId, companyId)))
      .orderBy(asc(pdsaCycles.cycleNumber));
  }

  async updatePDSACycle(
    companyId: string,
    id: string,
    data: Partial<InsertPDSACycle>
  ): Promise<PDSACycle | null> {
    const [result] = await db
      .update(pdsaCycles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(pdsaCycles.id, id), eq(pdsaCycles.companyId, companyId)))
      .returning();
    return result || null;
  }

  // Care Bundles
  async createCareBundle(data: InsertCareBundle): Promise<CareBundle> {
    const [result] = await db.insert(careBundles).values(data).returning();
    return result;
  }

  async getCareBundle(companyId: string, id: string): Promise<CareBundle | undefined> {
    const result = await db
      .select()
      .from(careBundles)
      .where(and(eq(careBundles.id, id), eq(careBundles.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async getCareBundles(companyId: string, filters?: { active?: boolean; category?: string }): Promise<CareBundle[]> {
    const conditions = [eq(careBundles.companyId, companyId)];
    if (filters?.active !== undefined) {
      conditions.push(eq(careBundles.active, filters.active));
    }
    if (filters?.category) {
      conditions.push(eq(careBundles.category, filters.category));
    }
    return await db
      .select()
      .from(careBundles)
      .where(and(...conditions))
      .orderBy(desc(careBundles.createdAt));
  }

  async updateCareBundle(
    companyId: string,
    id: string,
    data: Partial<InsertCareBundle>
  ): Promise<CareBundle | null> {
    const [result] = await db
      .update(careBundles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(careBundles.id, id), eq(careBundles.companyId, companyId)))
      .returning();
    return result || null;
  }

  // Bundle Compliance
  async createBundleCompliance(data: InsertBundleCompliance): Promise<BundleCompliance> {
    const [result] = await db.insert(bundleCompliance).values(data).returning();
    return result;
  }

  async getBundleCompliance(companyId: string, id: string): Promise<BundleCompliance | undefined> {
    const result = await db
      .select()
      .from(bundleCompliance)
      .where(and(eq(bundleCompliance.id, id), eq(bundleCompliance.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async getBundleComplianceByBundle(companyId: string, bundleId: string): Promise<BundleCompliance[]> {
    return await db
      .select()
      .from(bundleCompliance)
      .where(and(eq(bundleCompliance.bundleId, bundleId), eq(bundleCompliance.companyId, companyId)))
      .orderBy(desc(bundleCompliance.assessmentDate));
  }

  async getBundleComplianceByPatient(companyId: string, patientId: string): Promise<BundleCompliance[]> {
    return await db
      .select()
      .from(bundleCompliance)
      .where(and(eq(bundleCompliance.patientId, patientId), eq(bundleCompliance.companyId, companyId)))
      .orderBy(desc(bundleCompliance.assessmentDate));
  }

  // Performance Improvements
  async createPerformanceImprovement(data: InsertPerformanceImprovement): Promise<PerformanceImprovement> {
    const [result] = await db.insert(performanceImprovements).values(data).returning();
    return result;
  }

  async getPerformanceImprovement(companyId: string, id: string): Promise<PerformanceImprovement | undefined> {
    const result = await db
      .select()
      .from(performanceImprovements)
      .where(and(eq(performanceImprovements.id, id), eq(performanceImprovements.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async getPerformanceImprovements(companyId: string, filters?: { status?: string }): Promise<PerformanceImprovement[]> {
    const conditions = [eq(performanceImprovements.companyId, companyId)];
    if (filters?.status) {
      conditions.push(eq(performanceImprovements.status, filters.status as any));
    }
    return await db
      .select()
      .from(performanceImprovements)
      .where(and(...conditions))
      .orderBy(desc(performanceImprovements.createdAt));
  }

  async updatePerformanceImprovement(
    companyId: string,
    id: string,
    data: Partial<InsertPerformanceImprovement>
  ): Promise<PerformanceImprovement | null> {
    const [result] = await db
      .update(performanceImprovements)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(performanceImprovements.id, id), eq(performanceImprovements.companyId, companyId)))
      .returning();
    return result || null;
  }

  // Best Practices
  async createBestPractice(data: InsertBestPractice): Promise<BestPractice> {
    const [result] = await db.insert(bestPractices).values(data).returning();
    return result;
  }

  async getBestPractice(companyId: string, id: string): Promise<BestPractice | undefined> {
    const result = await db
      .select()
      .from(bestPractices)
      .where(and(eq(bestPractices.id, id), eq(bestPractices.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async getBestPractices(companyId: string, filters?: { active?: boolean; category?: string }): Promise<BestPractice[]> {
    const conditions = [eq(bestPractices.companyId, companyId)];
    if (filters?.active !== undefined) {
      conditions.push(eq(bestPractices.active, filters.active));
    }
    if (filters?.category) {
      conditions.push(eq(bestPractices.category, filters.category));
    }
    return await db
      .select()
      .from(bestPractices)
      .where(and(...conditions))
      .orderBy(desc(bestPractices.createdAt));
  }

  async updateBestPractice(
    companyId: string,
    id: string,
    data: Partial<InsertBestPractice>
  ): Promise<BestPractice | null> {
    const [result] = await db
      .update(bestPractices)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(bestPractices.id, id), eq(bestPractices.companyId, companyId)))
      .returning();
    return result || null;
  }

  // ============================================================================
  // WORLD-CLASS TRANSFORMATION PLACEHOLDER METHODS
  // ============================================================================
  // These methods are placeholders for the new world-class features.
  // They log warnings and return empty/mock data until full implementation.

  async createClinicalAnomaly(data: any) {
    console.warn('[PLACEHOLDER] createClinicalAnomaly not yet implemented. Run migration first.');
    return { id: 'placeholder', ...data };
  }

  async createNotification(data: any) {
    console.warn('[PLACEHOLDER] createNotification not yet implemented. Run migration first.');
    return { id: 'placeholder', ...data };
  }
}

export const storage = new DbStorage();
