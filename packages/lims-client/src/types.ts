// packages/lims-client/src/types.ts
// Type definitions for LIMS integration

export interface PrescriptionData {
  odSphere: number;
  odCylinder?: number;
  odAxis?: number;
  odAdd?: number;
  osSphere: number;
  osCylinder?: number;
  osAxis?: number;
  osAdd?: number;
  pd: number;
}

export interface FrameSpecification {
  frameType: string;
  frameSize: string;
  material: string;
  width?: number;
  height?: number;
  bridgeSize?: number;
  templeLength?: number;
}

export interface CreateJobRequest {
  ecpId: string;
  patientId: string;
  prescription: PrescriptionData;
  frameSpecs: FrameSpecification;
  lensType: 'single_vision' | 'bifocal' | 'progressive';
  coating: string;
  urgency?: 'standard' | 'expedited' | 'rush';
  metadata?: Record<string, any>;
}

export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
  estimatedCompletionDate: Date;
  queuePosition: number;
  rulesVersion: string;
}

export type JobStatus = 
  | 'queued'
  | 'in_production'
  | 'quality_check'
  | 'ready_for_shipping'
  | 'shipped'
  | 'completed'
  | 'failed'
  | 'on_hold';

export interface LimsStatusUpdatePayload {
  jobId: string;
  previousStatus: JobStatus;
  newStatus: JobStatus;
  timestamp: Date;
  details?: Record<string, any>;
  errorMessage?: string;
}

export interface ValidationRequest {
  prescription: PrescriptionData;
  lensType: string;
  coating: string;
  frameType: string;
  rulesVersion?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResponse {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
  estimatedLeadTime?: number; // in hours
}

export interface CatalogEntry {
  id: string;
  name: string;
  category: 'lens_type' | 'material' | 'coating' | 'frame_type';
  description: string;
  available: boolean;
  leadTime: number; // in hours
  restrictions?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CatalogResponse {
  version: string;
  timestamp: Date;
  entries: CatalogEntry[];
  rulesVersion: string;
}

export interface LimsHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  latency: number; // in ms
  version: string;
}

export interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
}

export interface LimsClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number; // in ms, default 30000
  retryMaxAttempts?: number; // default 3
  retryBackoffMs?: number; // default 1000
  circuitBreakerThreshold?: number; // default 5 failures
  circuitBreakerTimeout?: number; // default 60000ms
  webhookSecret?: string;
}

export interface LimsClientOptions extends LimsClientConfig {
  logger?: {
    debug: (msg: string, data?: any) => void;
    info: (msg: string, data?: any) => void;
    warn: (msg: string, data?: any) => void;
    error: (msg: string, data?: any) => void;
  };
}
