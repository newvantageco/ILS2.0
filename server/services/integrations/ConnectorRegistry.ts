/**
 * Connector Registry
 *
 * Registry of available integration connectors with their capabilities,
 * configuration requirements, and supported features
 */

import { loggers } from '../../utils/logger.js';
import type {
  IntegrationType,
  AuthType,
  SyncDirection,
  SyncStrategy,
  EntityMapping,
  FieldMapping,
} from './IntegrationFramework.js';

const logger = loggers.api;

/**
 * Connector Definition
 */
export interface ConnectorDefinition {
  id: string;
  name: string;
  provider: string;
  type: IntegrationType;
  description: string;
  version: string;
  logoUrl?: string;
  documentationUrl?: string;

  // Authentication
  supportedAuthTypes: AuthType[];
  authConfig: {
    authType: AuthType;
    fields: AuthField[];
  }[];

  // Sync capabilities
  supportedSyncDirections: SyncDirection[];
  supportedSyncStrategies: SyncStrategy[];
  defaultSyncStrategy: SyncStrategy;
  recommendedSyncFrequency?: number; // minutes

  // Supported entities
  supportedEntities: SupportedEntity[];

  // Features and capabilities
  capabilities: string[];
  limitations?: string[];

  // Configuration
  requiredSettings: ConfigSetting[];
  optionalSettings: ConfigSetting[];

  // Status
  isAvailable: boolean;
  isBeta: boolean;
  requiresApproval: boolean; // Some integrations may require vendor approval

  // Metadata
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Authentication Field
 */
export interface AuthField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'file' | 'select';
  required: boolean;
  description?: string;
  placeholder?: string;
  options?: string[]; // For select type
  validation?: string; // Regex pattern
}

/**
 * Supported Entity
 */
export interface SupportedEntity {
  localEntity: string;
  remoteEntity: string;
  supportedDirections: SyncDirection[];
  defaultMapping: FieldMapping[];
  description?: string;
}

/**
 * Configuration Setting
 */
export interface ConfigSetting {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json';
  description: string;
  defaultValue?: any;
  options?: any[];
}

/**
 * Connector Registry Service
 */
export class ConnectorRegistry {
  /**
   * Registry of available connectors
   */
  private static connectors = new Map<string, ConnectorDefinition>();

  /**
   * Initialize default connectors
   */
  static initializeConnectors(): void {
    const defaultConnectors: ConnectorDefinition[] = [
      // Epic EHR Integration
      {
        id: 'epic-ehr',
        name: 'Epic EHR',
        provider: 'Epic Systems',
        type: 'ehr',
        description: 'Integration with Epic Electronic Health Record system via FHIR API',
        version: '1.0.0',
        documentationUrl: 'https://fhir.epic.com/',
        supportedAuthTypes: ['oauth2'],
        authConfig: [
          {
            authType: 'oauth2',
            fields: [
              {
                name: 'clientId',
                label: 'Client ID',
                type: 'text',
                required: true,
                description: 'OAuth2 Client ID from Epic App Orchard',
              },
              {
                name: 'clientSecret',
                label: 'Client Secret',
                type: 'password',
                required: true,
                description: 'OAuth2 Client Secret',
              },
              {
                name: 'fhirBaseUrl',
                label: 'FHIR Base URL',
                type: 'url',
                required: true,
                placeholder: 'https://fhir.epic.com/interconnect-fhir-oauth/',
              },
            ],
          },
        ],
        supportedSyncDirections: ['pull', 'bidirectional'],
        supportedSyncStrategies: ['webhook', 'polling'],
        defaultSyncStrategy: 'webhook',
        recommendedSyncFrequency: 60, // 1 hour for polling
        supportedEntities: [
          {
            localEntity: 'patients',
            remoteEntity: 'Patient',
            supportedDirections: ['pull', 'bidirectional'],
            defaultMapping: [
              { localField: 'firstName', remoteField: 'name[0].given[0]', required: true, direction: 'both' },
              { localField: 'lastName', remoteField: 'name[0].family', required: true, direction: 'both' },
              { localField: 'dateOfBirth', remoteField: 'birthDate', required: true, direction: 'both' },
              { localField: 'gender', remoteField: 'gender', required: false, direction: 'both' },
              { localField: 'email', remoteField: 'telecom[?(@.system=="email")].value', required: false, direction: 'both' },
              { localField: 'phone', remoteField: 'telecom[?(@.system=="phone")].value', required: false, direction: 'both' },
            ],
          },
        ],
        capabilities: [
          'Patient demographics sync',
          'Appointment scheduling',
          'Clinical documents',
          'Lab results',
          'Medication history',
        ],
        limitations: [
          'Requires Epic App Orchard approval',
          'Rate limited to 1000 requests/hour',
        ],
        requiredSettings: [],
        optionalSettings: [
          {
            key: 'enableDemographics',
            label: 'Sync Patient Demographics',
            type: 'boolean',
            description: 'Enable synchronization of patient demographic data',
            defaultValue: true,
          },
        ],
        isAvailable: true,
        isBeta: false,
        requiresApproval: true,
        tags: ['ehr', 'fhir', 'healthcare', 'epic'],
        createdAt: new Date(),
      },

      // Cerner EHR Integration
      {
        id: 'cerner-ehr',
        name: 'Cerner Millennium',
        provider: 'Oracle Health (Cerner)',
        type: 'ehr',
        description: 'Integration with Cerner Millennium EHR via FHIR API',
        version: '1.0.0',
        documentationUrl: 'https://fhir.cerner.com/',
        supportedAuthTypes: ['oauth2'],
        authConfig: [
          {
            authType: 'oauth2',
            fields: [
              {
                name: 'clientId',
                label: 'Client ID',
                type: 'text',
                required: true,
              },
              {
                name: 'clientSecret',
                label: 'Client Secret',
                type: 'password',
                required: true,
              },
              {
                name: 'fhirBaseUrl',
                label: 'FHIR Base URL',
                type: 'url',
                required: true,
                placeholder: 'https://fhir-ehr.cerner.com/',
              },
            ],
          },
        ],
        supportedSyncDirections: ['pull', 'bidirectional'],
        supportedSyncStrategies: ['polling', 'webhook'],
        defaultSyncStrategy: 'polling',
        recommendedSyncFrequency: 60,
        supportedEntities: [
          {
            localEntity: 'patients',
            remoteEntity: 'Patient',
            supportedDirections: ['pull', 'bidirectional'],
            defaultMapping: [
              { localField: 'firstName', remoteField: 'name[0].given[0]', required: true, direction: 'both' },
              { localField: 'lastName', remoteField: 'name[0].family', required: true, direction: 'both' },
              { localField: 'dateOfBirth', remoteField: 'birthDate', required: true, direction: 'both' },
            ],
          },
        ],
        capabilities: ['Patient sync', 'Appointments', 'Lab results'],
        isAvailable: true,
        isBeta: false,
        requiresApproval: true,
        requiredSettings: [],
        optionalSettings: [],
        tags: ['ehr', 'fhir', 'healthcare', 'cerner'],
        createdAt: new Date(),
      },

      // Lab Integration
      {
        id: 'quest-diagnostics',
        name: 'Quest Diagnostics',
        provider: 'Quest Diagnostics',
        type: 'lab',
        description: 'Integration with Quest Diagnostics for lab orders and results',
        version: '1.0.0',
        supportedAuthTypes: ['api_key'],
        authConfig: [
          {
            authType: 'api_key',
            fields: [
              {
                name: 'apiKey',
                label: 'API Key',
                type: 'password',
                required: true,
              },
              {
                name: 'accountNumber',
                label: 'Account Number',
                type: 'text',
                required: true,
              },
            ],
          },
        ],
        supportedSyncDirections: ['bidirectional'],
        supportedSyncStrategies: ['webhook', 'polling'],
        defaultSyncStrategy: 'webhook',
        recommendedSyncFrequency: 30,
        supportedEntities: [
          {
            localEntity: 'lab_orders',
            remoteEntity: 'Order',
            supportedDirections: ['push'],
            defaultMapping: [
              { localField: 'patientId', remoteField: 'patient_id', required: true, direction: 'export' },
              { localField: 'testCode', remoteField: 'test_code', required: true, direction: 'export' },
            ],
          },
          {
            localEntity: 'lab_results',
            remoteEntity: 'Result',
            supportedDirections: ['pull'],
            defaultMapping: [
              { localField: 'orderId', remoteField: 'order_id', required: true, direction: 'import' },
              { localField: 'result', remoteField: 'result_value', required: true, direction: 'import' },
            ],
          },
        ],
        capabilities: ['Lab order submission', 'Result retrieval', 'Status tracking'],
        isAvailable: true,
        isBeta: false,
        requiresApproval: true,
        requiredSettings: [],
        optionalSettings: [],
        tags: ['lab', 'diagnostics', 'healthcare'],
        createdAt: new Date(),
      },

      // Insurance Verification
      {
        id: 'eligibility-api',
        name: 'Eligibility API',
        provider: 'Change Healthcare',
        type: 'insurance',
        description: 'Real-time insurance eligibility and benefit verification',
        version: '1.0.0',
        supportedAuthTypes: ['api_key'],
        authConfig: [
          {
            authType: 'api_key',
            fields: [
              {
                name: 'apiKey',
                label: 'API Key',
                type: 'password',
                required: true,
              },
              {
                name: 'providerId',
                label: 'Provider ID',
                type: 'text',
                required: true,
              },
            ],
          },
        ],
        supportedSyncDirections: ['pull'],
        supportedSyncStrategies: ['manual', 'real_time'],
        defaultSyncStrategy: 'real_time',
        supportedEntities: [
          {
            localEntity: 'insurance_verifications',
            remoteEntity: 'EligibilityInquiry',
            supportedDirections: ['pull'],
            defaultMapping: [
              { localField: 'memberId', remoteField: 'member_id', required: true, direction: 'import' },
              { localField: 'coverage', remoteField: 'coverage_status', required: true, direction: 'import' },
            ],
          },
        ],
        capabilities: ['Eligibility verification', 'Benefit inquiry', 'Coverage details'],
        isAvailable: true,
        isBeta: false,
        requiresApproval: false,
        requiredSettings: [],
        optionalSettings: [],
        tags: ['insurance', 'eligibility', 'verification'],
        createdAt: new Date(),
      },

      // Pharmacy Integration
      {
        id: 'surescripts',
        name: 'Surescripts',
        provider: 'Surescripts',
        type: 'pharmacy',
        description: 'E-prescribing and medication history via Surescripts network',
        version: '1.0.0',
        supportedAuthTypes: ['certificate'],
        authConfig: [
          {
            authType: 'certificate',
            fields: [
              {
                name: 'certificate',
                label: 'SSL Certificate',
                type: 'file',
                required: true,
              },
              {
                name: 'privateKey',
                label: 'Private Key',
                type: 'file',
                required: true,
              },
              {
                name: 'spi',
                label: 'SPI (Surescripts Provider ID)',
                type: 'text',
                required: true,
              },
            ],
          },
        ],
        supportedSyncDirections: ['bidirectional'],
        supportedSyncStrategies: ['real_time'],
        defaultSyncStrategy: 'real_time',
        supportedEntities: [
          {
            localEntity: 'prescriptions',
            remoteEntity: 'NewRx',
            supportedDirections: ['push'],
            defaultMapping: [
              { localField: 'patientId', remoteField: 'Patient.Identification', required: true, direction: 'export' },
              { localField: 'medication', remoteField: 'MedicationPrescribed', required: true, direction: 'export' },
            ],
          },
        ],
        capabilities: ['E-prescribing', 'Medication history', 'Prescription renewals'],
        limitations: ['Requires Surescripts certification', 'Provider must be DEA licensed'],
        isAvailable: true,
        isBeta: false,
        requiresApproval: true,
        requiredSettings: [],
        optionalSettings: [],
        tags: ['pharmacy', 'prescriptions', 'medication'],
        createdAt: new Date(),
      },

      // Shopify Integration (already exists in codebase)
      {
        id: 'shopify',
        name: 'Shopify',
        provider: 'Shopify Inc.',
        type: 'ecommerce',
        description: 'E-commerce integration with Shopify for online orders and inventory sync',
        version: '1.0.0',
        documentationUrl: 'https://shopify.dev/docs/api',
        supportedAuthTypes: ['oauth2', 'api_key'],
        authConfig: [
          {
            authType: 'api_key',
            fields: [
              {
                name: 'shopDomain',
                label: 'Shop Domain',
                type: 'text',
                required: true,
                placeholder: 'myshop.myshopify.com',
              },
              {
                name: 'accessToken',
                label: 'Access Token',
                type: 'password',
                required: true,
              },
            ],
          },
        ],
        supportedSyncDirections: ['bidirectional'],
        supportedSyncStrategies: ['webhook', 'polling'],
        defaultSyncStrategy: 'webhook',
        recommendedSyncFrequency: 15,
        supportedEntities: [
          {
            localEntity: 'orders',
            remoteEntity: 'Order',
            supportedDirections: ['pull'],
            defaultMapping: [
              { localField: 'orderNumber', remoteField: 'order_number', required: true, direction: 'import' },
              { localField: 'customerEmail', remoteField: 'customer.email', required: false, direction: 'import' },
            ],
          },
          {
            localEntity: 'products',
            remoteEntity: 'Product',
            supportedDirections: ['bidirectional'],
            defaultMapping: [
              { localField: 'name', remoteField: 'title', required: true, direction: 'both' },
              { localField: 'price', remoteField: 'variants[0].price', required: true, direction: 'both' },
            ],
          },
        ],
        capabilities: ['Order sync', 'Product sync', 'Inventory sync', 'Customer sync'],
        isAvailable: true,
        isBeta: false,
        requiresApproval: false,
        requiredSettings: [],
        optionalSettings: [
          {
            key: 'syncInventory',
            label: 'Sync Inventory Levels',
            type: 'boolean',
            description: 'Automatically sync inventory levels between systems',
            defaultValue: true,
          },
        ],
        tags: ['ecommerce', 'retail', 'shopify', 'orders'],
        createdAt: new Date(),
      },
    ];

    defaultConnectors.forEach((connector) => {
      this.connectors.set(connector.id, connector);
    });

    logger.info({ count: defaultConnectors.length }, 'Connectors initialized');
  }

  /**
   * Get all available connectors
   */
  static getConnectors(filters?: {
    type?: IntegrationType;
    isAvailable?: boolean;
    tag?: string;
  }): ConnectorDefinition[] {
    let connectors = Array.from(this.connectors.values());

    if (filters?.type) {
      connectors = connectors.filter((c) => c.type === filters.type);
    }

    if (filters?.isAvailable !== undefined) {
      connectors = connectors.filter((c) => c.isAvailable === filters.isAvailable);
    }

    if (filters?.tag) {
      connectors = connectors.filter((c) => c.tags.includes(filters.tag));
    }

    return connectors;
  }

  /**
   * Get connector by ID
   */
  static getConnector(connectorId: string): ConnectorDefinition | null {
    return this.connectors.get(connectorId) || null;
  }

  /**
   * Search connectors
   */
  static searchConnectors(query: string): ConnectorDefinition[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.connectors.values()).filter(
      (connector) =>
        connector.name.toLowerCase().includes(lowerQuery) ||
        connector.provider.toLowerCase().includes(lowerQuery) ||
        connector.description.toLowerCase().includes(lowerQuery) ||
        connector.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get connectors by type
   */
  static getConnectorsByType(type: IntegrationType): ConnectorDefinition[] {
    return this.getConnectors({ type });
  }

  /**
   * Register a custom connector
   */
  static registerConnector(connector: ConnectorDefinition): void {
    this.connectors.set(connector.id, connector);
    logger.info({ connectorId: connector.id, name: connector.name }, 'Connector registered');
  }

  /**
   * Update connector
   */
  static updateConnector(
    connectorId: string,
    updates: Partial<ConnectorDefinition>
  ): ConnectorDefinition | null {
    const connector = this.connectors.get(connectorId);

    if (!connector) {
      return null;
    }

    const updated = {
      ...connector,
      ...updates,
      updatedAt: new Date(),
    };

    this.connectors.set(connectorId, updated);

    logger.info({ connectorId, updates }, 'Connector updated');

    return updated;
  }

  /**
   * Get connector statistics
   */
  static getConnectorStats(): {
    total: number;
    byType: Record<IntegrationType, number>;
    available: number;
    beta: number;
    requiresApproval: number;
  } {
    const all = Array.from(this.connectors.values());

    const byType: Partial<Record<IntegrationType, number>> = {};
    all.forEach((connector) => {
      byType[connector.type] = (byType[connector.type] || 0) + 1;
    });

    return {
      total: all.length,
      byType: byType as Record<IntegrationType, number>,
      available: all.filter((c) => c.isAvailable).length,
      beta: all.filter((c) => c.isBeta).length,
      requiresApproval: all.filter((c) => c.requiresApproval).length,
    };
  }
}

// Initialize connectors on module load
ConnectorRegistry.initializeConnectors();
