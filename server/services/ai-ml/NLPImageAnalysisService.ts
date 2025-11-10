/**
 * NLP & Image Analysis Service
 *
 * Natural language processing for clinical notes and AI-powered image analysis
 * for diagnostic imaging
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Entity type
 */
export type EntityType =
  | 'condition'
  | 'medication'
  | 'procedure'
  | 'anatomy'
  | 'symptom'
  | 'lab_test'
  | 'measurement'
  | 'temporal';

/**
 * Extracted entity
 */
export interface ExtractedEntity {
  text: string;
  type: EntityType;
  startIndex: number;
  endIndex: number;
  confidence: number; // 0-1
  normalizedForm?: string;
  icd10Code?: string;
  snomedCode?: string;
}

/**
 * Clinical note extraction
 */
export interface ClinicalNoteExtraction {
  id: string;
  noteId: string;
  noteText: string;
  entities: ExtractedEntity[];
  summary: string;
  keyFindings: string[];
  sentiment?: {
    score: number; // -1 to 1
    magnitude: number; // 0 to infinity
    label: 'positive' | 'neutral' | 'negative';
  };
  extractedAt: Date;
}

/**
 * Medical code
 */
export interface MedicalCode {
  code: string;
  system: 'ICD-10' | 'CPT' | 'SNOMED' | 'LOINC';
  description: string;
  category?: string;
}

/**
 * Medical coding suggestion
 */
export interface MedicalCodingSuggestion {
  id: string;
  noteText: string;
  suggestedCodes: {
    code: MedicalCode;
    confidence: number; // 0-1
    supportingText: string[];
    reasoning: string;
  }[];
  createdAt: Date;
}

/**
 * Document classification
 */
export interface DocumentClassification {
  id: string;
  documentId: string;
  documentType: string; // e.g., 'Progress Note', 'Discharge Summary', 'Lab Report'
  confidence: number; // 0-1
  topics: {
    topic: string;
    relevance: number; // 0-1
  }[];
  classifiedAt: Date;
}

/**
 * Image type
 */
export type ImageType =
  | 'fundus_photo'
  | 'oct'
  | 'visual_field'
  | 'anterior_segment'
  | 'fluorescein_angiography'
  | 'icg_angiography';

/**
 * Image finding
 */
export interface ImageFinding {
  finding: string;
  location?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  confidence: number; // 0-1
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Image analysis result
 */
export interface ImageAnalysisResult {
  id: string;
  imageId: string;
  imageType: ImageType;
  findings: ImageFinding[];
  diagnosis: {
    condition: string;
    confidence: number; // 0-1
    icd10Code?: string;
    supportingFindings: string[];
  }[];
  quality: {
    score: number; // 0-1
    issues?: string[];
  };
  recommendations: string[];
  analyzedAt: Date;
  modelVersion: string;
}

/**
 * OCR result
 */
export interface OCRResult {
  id: string;
  documentId: string;
  extractedText: string;
  confidence: number; // 0-1
  structuredData?: Record<string, any>;
  detectedLanguage?: string;
  processedAt: Date;
}

/**
 * Text summarization
 */
export interface TextSummarization {
  id: string;
  originalText: string;
  summary: string;
  extractiveKeywords: string[];
  sentenceCount: number;
  compressionRatio: number;
  createdAt: Date;
}

/**
 * NLP & Image Analysis Service
 */
export class NLPImageAnalysisService {
  /**
   * In-memory stores (use database in production)
   */
  private static noteExtractions: ClinicalNoteExtraction[] = [];
  private static codingSuggestions: MedicalCodingSuggestion[] = [];
  private static documentClassifications: DocumentClassification[] = [];
  private static imageAnalyses: ImageAnalysisResult[] = [];
  private static ocrResults: OCRResult[] = [];

  /**
   * Medical terminology dictionary
   */
  private static readonly MEDICAL_TERMS: Record<EntityType, string[]> = {
    condition: [
      'glaucoma',
      'cataract',
      'macular degeneration',
      'diabetic retinopathy',
      'dry eye',
      'blepharitis',
      'conjunctivitis',
      'keratitis',
      'uveitis',
    ],
    medication: [
      'latanoprost',
      'timolol',
      'prednisolone',
      'atropine',
      'cyclopentolate',
      'tropicamide',
      'ketorolac',
    ],
    procedure: [
      'trabeculectomy',
      'cataract extraction',
      'vitrectomy',
      'laser photocoagulation',
      'injection',
      'examination',
    ],
    anatomy: [
      'cornea',
      'lens',
      'retina',
      'macula',
      'optic nerve',
      'iris',
      'pupil',
      'conjunctiva',
      'sclera',
    ],
    symptom: [
      'blurred vision',
      'pain',
      'redness',
      'discharge',
      'photophobia',
      'floaters',
      'flashes',
      'vision loss',
    ],
    lab_test: [
      'visual acuity',
      'intraocular pressure',
      'visual field',
      'oct',
      'fundus photo',
      'gonioscopy',
    ],
    measurement: ['20/20', '20/40', 'mmhg', 'mm', 'degrees', 'diopters'],
    temporal: ['today', 'yesterday', 'last week', 'next month', 'days ago', 'weeks', 'months'],
  };

  /**
   * ICD-10 codes
   */
  private static readonly ICD10_CODES: Record<string, MedicalCode> = {
    'H40.11': {
      code: 'H40.11',
      system: 'ICD-10',
      description: 'Primary open-angle glaucoma',
      category: 'Glaucoma',
    },
    'H25.9': {
      code: 'H25.9',
      system: 'ICD-10',
      description: 'Age-related cataract, unspecified',
      category: 'Cataract',
    },
    'H35.30': {
      code: 'H35.30',
      system: 'ICD-10',
      description: 'Macular degeneration, unspecified',
      category: 'Retinal disorders',
    },
    'E11.319': {
      code: 'E11.319',
      system: 'ICD-10',
      description: 'Type 2 diabetes with unspecified diabetic retinopathy',
      category: 'Diabetic eye disease',
    },
    'H04.123': {
      code: 'H04.123',
      system: 'ICD-10',
      description: 'Dry eye syndrome',
      category: 'Lacrimal system disorders',
    },
    'H01.009': {
      code: 'H01.009',
      system: 'ICD-10',
      description: 'Blepharitis, unspecified',
      category: 'Eyelid disorders',
    },
    'H10.9': {
      code: 'H10.9',
      system: 'ICD-10',
      description: 'Conjunctivitis, unspecified',
      category: 'Conjunctival disorders',
    },
  };

  /**
   * CPT codes
   */
  private static readonly CPT_CODES: Record<string, MedicalCode> = {
    '92004': {
      code: '92004',
      system: 'CPT',
      description: 'Ophthalmological examination, comprehensive',
      category: 'Examination',
    },
    '92014': {
      code: '92014',
      system: 'CPT',
      description: 'Ophthalmological examination, established patient',
      category: 'Examination',
    },
    '92134': {
      code: '92134',
      system: 'CPT',
      description: 'OCT imaging',
      category: 'Imaging',
    },
    '92250': {
      code: '92250',
      system: 'CPT',
      description: 'Fundus photography',
      category: 'Imaging',
    },
    '66984': {
      code: '66984',
      system: 'CPT',
      description: 'Cataract surgery with IOL, one stage',
      category: 'Surgery',
    },
    '67228': {
      code: '67228',
      system: 'CPT',
      description: 'Intravitreal injection',
      category: 'Injection',
    },
  };

  // ========== Clinical Note Processing ==========

  /**
   * Extract entities from clinical note
   */
  static extractEntitiesFromNote(
    noteId: string,
    noteText: string
  ): ClinicalNoteExtraction {
    const entities: ExtractedEntity[] = [];

    // Simple keyword-based entity extraction (in production, use NLP model)
    const textLower = noteText.toLowerCase();

    Object.entries(this.MEDICAL_TERMS).forEach(([type, terms]) => {
      terms.forEach((term) => {
        const termLower = term.toLowerCase();
        let index = textLower.indexOf(termLower);

        while (index !== -1) {
          // Find corresponding ICD-10 code if available
          let icd10Code: string | undefined;
          Object.entries(this.ICD10_CODES).forEach(([code, codeData]) => {
            if (codeData.description.toLowerCase().includes(termLower)) {
              icd10Code = code;
            }
          });

          entities.push({
            text: noteText.substring(index, index + term.length),
            type: type as EntityType,
            startIndex: index,
            endIndex: index + term.length,
            confidence: 0.85,
            normalizedForm: term,
            icd10Code,
          });

          index = textLower.indexOf(termLower, index + 1);
        }
      });
    });

    // Sort by position in text
    entities.sort((a, b) => a.startIndex - b.startIndex);

    // Generate summary
    const summary = this.generateSummary(noteText, entities);

    // Extract key findings
    const keyFindings = this.extractKeyFindings(noteText, entities);

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(noteText);

    const extraction: ClinicalNoteExtraction = {
      id: crypto.randomUUID(),
      noteId,
      noteText,
      entities,
      summary,
      keyFindings,
      sentiment,
      extractedAt: new Date(),
    };

    this.noteExtractions.push(extraction);

    logger.info({ noteId, entityCount: entities.length }, 'Entities extracted from clinical note');

    return extraction;
  }

  /**
   * Generate summary
   */
  private static generateSummary(text: string, entities: ExtractedEntity[]): string {
    // Extract first sentence or first 150 characters
    const sentences = text.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim() || '';

    if (firstSentence.length > 150) {
      return firstSentence.substring(0, 150) + '...';
    }

    return firstSentence;
  }

  /**
   * Extract key findings
   */
  private static extractKeyFindings(text: string, entities: ExtractedEntity[]): string[] {
    const findings: string[] = [];

    // Find conditions
    const conditions = entities.filter((e) => e.type === 'condition');
    conditions.forEach((condition) => {
      findings.push(`Diagnosis: ${condition.normalizedForm}`);
    });

    // Find measurements
    const measurements = entities.filter((e) => e.type === 'measurement');
    if (measurements.length > 0) {
      findings.push(`Measurements documented: ${measurements.length} values`);
    }

    // Find procedures
    const procedures = entities.filter((e) => e.type === 'procedure');
    procedures.forEach((procedure) => {
      findings.push(`Procedure: ${procedure.normalizedForm}`);
    });

    return findings;
  }

  /**
   * Analyze sentiment
   */
  private static analyzeSentiment(text: string): ClinicalNoteExtraction['sentiment'] {
    // Simple keyword-based sentiment (in production, use NLP model)
    const positiveWords = ['improved', 'stable', 'resolved', 'better', 'normal'];
    const negativeWords = ['worsened', 'worse', 'deteriorated', 'severe', 'critical'];

    const textLower = text.toLowerCase();

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach((word) => {
      const count = (textLower.match(new RegExp(word, 'g')) || []).length;
      positiveCount += count;
    });

    negativeWords.forEach((word) => {
      const count = (textLower.match(new RegExp(word, 'g')) || []).length;
      negativeCount += count;
    });

    const score = positiveCount - negativeCount;
    const magnitude = positiveCount + negativeCount;

    let label: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (score > 0) {
      label = 'positive';
    } else if (score < 0) {
      label = 'negative';
    }

    return {
      score: score / Math.max(1, positiveCount + negativeCount),
      magnitude,
      label,
    };
  }

  // ========== Medical Coding ==========

  /**
   * Suggest medical codes
   */
  static suggestMedicalCodes(noteText: string): MedicalCodingSuggestion {
    const suggestedCodes: MedicalCodingSuggestion['suggestedCodes'] = [];

    // Extract entities first
    const extraction = this.extractEntitiesFromNote('temp', noteText);

    // Suggest ICD-10 codes based on conditions
    const conditions = extraction.entities.filter((e) => e.type === 'condition');
    conditions.forEach((condition) => {
      Object.entries(this.ICD10_CODES).forEach(([code, codeData]) => {
        if (
          codeData.description.toLowerCase().includes(condition.normalizedForm?.toLowerCase() || '')
        ) {
          suggestedCodes.push({
            code: codeData,
            confidence: condition.confidence,
            supportingText: [condition.text],
            reasoning: `Condition "${condition.text}" found in note`,
          });
        }
      });
    });

    // Suggest CPT codes based on procedures
    const procedures = extraction.entities.filter((e) => e.type === 'procedure');
    procedures.forEach((procedure) => {
      Object.entries(this.CPT_CODES).forEach(([code, codeData]) => {
        if (
          codeData.description.toLowerCase().includes(procedure.normalizedForm?.toLowerCase() || '')
        ) {
          suggestedCodes.push({
            code: codeData,
            confidence: procedure.confidence,
            supportingText: [procedure.text],
            reasoning: `Procedure "${procedure.text}" found in note`,
          });
        }
      });
    });

    // Check for examination codes
    if (noteText.toLowerCase().includes('comprehensive') || noteText.toLowerCase().includes('new patient')) {
      suggestedCodes.push({
        code: this.CPT_CODES['92004'],
        confidence: 0.9,
        supportingText: ['Comprehensive examination'],
        reasoning: 'Comprehensive examination documented',
      });
    } else if (noteText.toLowerCase().includes('established patient')) {
      suggestedCodes.push({
        code: this.CPT_CODES['92014'],
        confidence: 0.9,
        supportingText: ['Established patient visit'],
        reasoning: 'Follow-up examination for established patient',
      });
    }

    // Sort by confidence
    suggestedCodes.sort((a, b) => b.confidence - a.confidence);

    const suggestion: MedicalCodingSuggestion = {
      id: crypto.randomUUID(),
      noteText,
      suggestedCodes,
      createdAt: new Date(),
    };

    this.codingSuggestions.push(suggestion);

    logger.info({ codeCount: suggestedCodes.length }, 'Medical codes suggested');

    return suggestion;
  }

  // ========== Document Classification ==========

  /**
   * Classify document
   */
  static classifyDocument(documentId: string, documentText: string): DocumentClassification {
    const textLower = documentText.toLowerCase();

    // Determine document type
    let documentType = 'Unknown';
    let confidence = 0.5;

    if (textLower.includes('progress note') || textLower.includes('soap note')) {
      documentType = 'Progress Note';
      confidence = 0.9;
    } else if (textLower.includes('discharge summary') || textLower.includes('hospital course')) {
      documentType = 'Discharge Summary';
      confidence = 0.9;
    } else if (textLower.includes('operative report') || textLower.includes('procedure note')) {
      documentType = 'Operative Report';
      confidence = 0.9;
    } else if (textLower.includes('lab') && textLower.includes('results')) {
      documentType = 'Lab Report';
      confidence = 0.85;
    } else if (textLower.includes('consult') || textLower.includes('referral')) {
      documentType = 'Consultation';
      confidence = 0.85;
    }

    // Extract topics
    const topics: DocumentClassification['topics'] = [];

    if (textLower.includes('glaucoma')) {
      topics.push({ topic: 'Glaucoma', relevance: 0.9 });
    }
    if (textLower.includes('cataract')) {
      topics.push({ topic: 'Cataract', relevance: 0.9 });
    }
    if (textLower.includes('retina') || textLower.includes('macula')) {
      topics.push({ topic: 'Retinal Disease', relevance: 0.85 });
    }
    if (textLower.includes('diabetes') || textLower.includes('diabetic')) {
      topics.push({ topic: 'Diabetes', relevance: 0.85 });
    }

    const classification: DocumentClassification = {
      id: crypto.randomUUID(),
      documentId,
      documentType,
      confidence,
      topics,
      classifiedAt: new Date(),
    };

    this.documentClassifications.push(classification);

    logger.info({ documentId, documentType, confidence }, 'Document classified');

    return classification;
  }

  // ========== Image Analysis ==========

  /**
   * Analyze medical image
   */
  static analyzeImage(
    imageId: string,
    imageType: ImageType,
    imageData?: any
  ): ImageAnalysisResult {
    // In production, use actual AI model (TensorFlow, PyTorch, etc.)
    // For now, generate sample analysis based on image type

    const findings: ImageFinding[] = [];
    const diagnosis: ImageAnalysisResult['diagnosis'] = [];
    let quality = { score: 0.85, issues: [] as string[] };
    const recommendations: string[] = [];

    switch (imageType) {
      case 'fundus_photo':
        findings.push({
          finding: 'Cup-to-disc ratio 0.6',
          location: 'Optic disc',
          severity: 'moderate',
          confidence: 0.87,
        });

        findings.push({
          finding: 'Microaneurysms',
          location: 'Posterior pole',
          severity: 'mild',
          confidence: 0.75,
        });

        diagnosis.push({
          condition: 'Glaucoma suspect',
          confidence: 0.72,
          icd10Code: 'H40.001',
          supportingFindings: ['Increased cup-to-disc ratio'],
        });

        diagnosis.push({
          condition: 'Early diabetic retinopathy',
          confidence: 0.68,
          icd10Code: 'E11.329',
          supportingFindings: ['Microaneurysms present'],
        });

        recommendations.push('Visual field testing recommended');
        recommendations.push('OCT imaging for further evaluation');
        recommendations.push('Follow-up in 3-6 months');
        break;

      case 'oct':
        findings.push({
          finding: 'Central macular thickness 285 µm',
          location: 'Fovea',
          confidence: 0.95,
        });

        findings.push({
          finding: 'Intraretinal fluid',
          location: 'Central macula',
          severity: 'moderate',
          confidence: 0.82,
        });

        diagnosis.push({
          condition: 'Diabetic macular edema',
          confidence: 0.85,
          icd10Code: 'E11.311',
          supportingFindings: ['Intraretinal fluid', 'Increased central thickness'],
        });

        recommendations.push('Consider anti-VEGF injection');
        recommendations.push('Optimize diabetes control');
        recommendations.push('Repeat OCT in 4-6 weeks');
        break;

      case 'visual_field':
        findings.push({
          finding: 'Superior arcuate defect',
          location: 'Superior hemifield',
          severity: 'moderate',
          confidence: 0.81,
        });

        diagnosis.push({
          condition: 'Glaucomatous optic neuropathy',
          confidence: 0.79,
          icd10Code: 'H40.11',
          supportingFindings: ['Arcuate visual field defect'],
        });

        recommendations.push('Initiate IOP-lowering therapy');
        recommendations.push('Baseline OCT RNFL');
        recommendations.push('Repeat visual field in 3 months');
        break;
    }

    // Check image quality
    if (Math.random() > 0.8) {
      quality.score = 0.65;
      quality.issues = ['Slight blur detected', 'Suboptimal illumination'];
    }

    const analysis: ImageAnalysisResult = {
      id: crypto.randomUUID(),
      imageId,
      imageType,
      findings,
      diagnosis: diagnosis.sort((a, b) => b.confidence - a.confidence),
      quality,
      recommendations,
      analyzedAt: new Date(),
      modelVersion: '2.0.0',
    };

    this.imageAnalyses.push(analysis);

    logger.info({ imageId, imageType, findingCount: findings.length }, 'Medical image analyzed');

    return analysis;
  }

  /**
   * Get image analysis
   */
  static getImageAnalysis(imageId: string): ImageAnalysisResult | null {
    return this.imageAnalyses.find((a) => a.imageId === imageId) || null;
  }

  // ========== OCR ==========

  /**
   * Perform OCR on document
   */
  static performOCR(documentId: string, imageData?: any): OCRResult {
    // In production, use actual OCR engine (Tesseract, Google Vision API, etc.)
    // For now, return sample extracted text

    const extractedText = `
PATIENT: John Doe
DATE OF BIRTH: 01/15/1960
DATE OF SERVICE: ${new Date().toLocaleDateString()}

CHIEF COMPLAINT: Blurred vision

VISUAL ACUITY:
Right Eye: 20/40
Left Eye: 20/30

INTRAOCULAR PRESSURE:
Right Eye: 18 mmHg
Left Eye: 19 mmHg

ASSESSMENT:
1. Age-related cataract, bilateral
2. Presbyopia

PLAN:
- Cataract surgery discussed
- Updated glasses prescription
- Follow-up in 6 months
    `.trim();

    // Extract structured data
    const structuredData = {
      patientName: 'John Doe',
      dateOfBirth: '01/15/1960',
      dateOfService: new Date().toLocaleDateString(),
      visualAcuity: {
        rightEye: '20/40',
        leftEye: '20/30',
      },
      intraocularPressure: {
        rightEye: '18 mmHg',
        leftEye: '19 mmHg',
      },
      diagnoses: ['Age-related cataract, bilateral', 'Presbyopia'],
    };

    const result: OCRResult = {
      id: crypto.randomUUID(),
      documentId,
      extractedText,
      confidence: 0.92,
      structuredData,
      detectedLanguage: 'en',
      processedAt: new Date(),
    };

    this.ocrResults.push(result);

    logger.info({ documentId, confidence: result.confidence }, 'OCR performed on document');

    return result;
  }

  // ========== Text Summarization ==========

  /**
   * Summarize text
   */
  static summarizeText(originalText: string, maxSentences: number = 3): TextSummarization {
    // Simple extractive summarization (in production, use transformer model)
    const sentences = originalText.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Take first N sentences
    const summarySentences = sentences.slice(0, maxSentences);
    const summary = summarySentences.join('. ') + '.';

    // Extract keywords
    const extractiveKeywords = this.extractKeywords(originalText);

    const summarization: TextSummarization = {
      id: crypto.randomUUID(),
      originalText,
      summary,
      extractiveKeywords,
      sentenceCount: sentences.length,
      compressionRatio: summary.length / originalText.length,
      createdAt: new Date(),
    };

    logger.info(
      { originalLength: originalText.length, summaryLength: summary.length },
      'Text summarized'
    );

    return summarization;
  }

  /**
   * Extract keywords
   */
  private static extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);

    // Simple frequency-based keyword extraction
    const wordFreq: Record<string, number> = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had']);

    words.forEach((word) => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Get top 10 keywords
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((entry) => entry[0]);

    return keywords;
  }

  // ========== Statistics ==========

  /**
   * Get statistics
   */
  static getStatistics(): {
    totalNoteExtractions: number;
    totalCodingSuggestions: number;
    totalDocumentClassifications: number;
    totalImageAnalyses: number;
    totalOCRs: number;
    averageEntityCount: number;
    averageCodeSuggestions: number;
  } {
    const avgEntityCount =
      this.noteExtractions.length > 0
        ? this.noteExtractions.reduce((sum, e) => sum + e.entities.length, 0) /
          this.noteExtractions.length
        : 0;

    const avgCodeSuggestions =
      this.codingSuggestions.length > 0
        ? this.codingSuggestions.reduce((sum, c) => sum + c.suggestedCodes.length, 0) /
          this.codingSuggestions.length
        : 0;

    return {
      totalNoteExtractions: this.noteExtractions.length,
      totalCodingSuggestions: this.codingSuggestions.length,
      totalDocumentClassifications: this.documentClassifications.length,
      totalImageAnalyses: this.imageAnalyses.length,
      totalOCRs: this.ocrResults.length,
      averageEntityCount: avgEntityCount,
      averageCodeSuggestions: avgCodeSuggestions,
    };
  }
}
