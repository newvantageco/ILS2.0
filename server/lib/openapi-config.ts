/**
 * OpenAPI 3.1 Configuration
 *
 * Defines the OpenAPI specification for ILS 2.0 API documentation.
 * This configuration is used by swagger-jsdoc to generate the spec.
 *
 * @module server/lib/openapi-config
 */

import type { OpenAPIV3_1 } from 'openapi-types';

/**
 * Base OpenAPI specification document
 */
export const openAPIDocument: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'ILS 2.0 API',
    version: '1.0.0',
    description: `
# ILS 2.0 - Integrated Lab System API

Comprehensive optical practice management system for UK and international markets.

## Authentication

Most endpoints require authentication via session cookies or JWT tokens.
Use the \`/api/auth/login\` endpoint to authenticate.

## Multi-Tenant Architecture

All data is isolated by tenant (company). The tenant context is automatically
applied based on the authenticated user's company.

## Rate Limiting

API requests are rate-limited:
- General API: 100 requests per minute
- Authentication: 5 requests per minute

## Deprecation Notice

The following AI endpoints are deprecated and will be removed after **2026-03-01**:
- \`/api/master-ai/*\` → Use \`/api/ai/chat\`
- \`/api/platform-ai/*\` → Use \`/api/ai/analytics\`
- \`/api/ai-ml/*\` → Use \`/api/ai/clinical/*\`

See the [Migration Guide](/docs/AI_SERVICES_ANALYSIS.md) for details.
    `,
    contact: {
      name: 'ILS Support',
      email: 'support@ils.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API v1 (current)',
    },
    {
      url: '/api/v1',
      description: 'API v1 (explicit version)',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and session management' },
    { name: 'Patients', description: 'Patient record management (PHI)' },
    { name: 'Orders', description: 'Order processing and tracking' },
    { name: 'Inventory', description: 'Product and stock management' },
    { name: 'Billing', description: 'Invoicing and payment processing' },
    { name: 'AI Services', description: 'AI-powered features and analytics' },
    { name: 'NHS', description: 'UK NHS-specific operations' },
    { name: 'Examinations', description: 'Eye examination records' },
    { name: 'Prescriptions', description: 'Optical prescription management' },
    { name: 'Users', description: 'User and staff management' },
    { name: 'Settings', description: 'System and company settings' },
    { name: 'Analytics', description: 'Reports and analytics' },
    { name: 'Health', description: 'System health and status' },
  ],
  components: {
    securitySchemes: {
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
        description: 'Session cookie authentication',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication',
      },
    },
    schemas: {
      // Error response
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'object' },
            },
            required: ['code', 'message'],
          },
        },
        required: ['success', 'error'],
      },

      // Pagination
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, example: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, example: 20 },
          total: { type: 'integer', example: 150 },
          totalPages: { type: 'integer', example: 8 },
        },
      },

      // Patient schema
      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string', maxLength: 50 },
          lastName: { type: 'string', maxLength: 50 },
          dateOfBirth: { type: 'string', format: 'date' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          nhsNumber: { type: 'string', pattern: '^\\d{10}$', description: 'UK NHS number (10 digits)' },
          address: { $ref: '#/components/schemas/UKAddress' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'firstName', 'lastName', 'dateOfBirth'],
      },

      // UK Address
      UKAddress: {
        type: 'object',
        properties: {
          addressLine1: { type: 'string', maxLength: 100 },
          addressLine2: { type: 'string', maxLength: 100 },
          addressLine3: { type: 'string', maxLength: 100 },
          city: { type: 'string', maxLength: 50 },
          county: { type: 'string', maxLength: 50 },
          postcode: { type: 'string', pattern: '^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$' },
          country: { type: 'string', enum: ['GB', 'UK'], default: 'GB' },
        },
        required: ['addressLine1', 'city', 'postcode'],
      },

      // Order schema
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          },
          totalAmount: { type: 'number', format: 'decimal' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItem' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1 },
          unitPrice: { type: 'number', format: 'decimal' },
          prescription: { $ref: '#/components/schemas/Prescription' },
        },
      },

      // Prescription schema
      Prescription: {
        type: 'object',
        properties: {
          rightEye: { $ref: '#/components/schemas/EyePrescription' },
          leftEye: { $ref: '#/components/schemas/EyePrescription' },
          pd: { type: 'number', minimum: 40, maximum: 80, description: 'Pupillary distance in mm' },
        },
      },

      EyePrescription: {
        type: 'object',
        properties: {
          sphere: { type: 'number', minimum: -20, maximum: 20 },
          cylinder: { type: 'number', minimum: -10, maximum: 10 },
          axis: { type: 'integer', minimum: 0, maximum: 180 },
          add: { type: 'number', minimum: 0, maximum: 4 },
        },
        required: ['sphere'],
      },

      // Product schema
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', maxLength: 100 },
          sku: { type: 'string', maxLength: 50 },
          category: {
            type: 'string',
            enum: ['frames', 'lenses', 'accessories', 'supplies', 'other'],
          },
          quantity: { type: 'integer', minimum: 0 },
          unitPrice: { type: 'number', format: 'decimal' },
          reorderPoint: { type: 'integer', minimum: 0 },
          isActive: { type: 'boolean', default: true },
        },
      },

      // Invoice schema
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          invoiceNumber: { type: 'string' },
          patientId: { type: 'string', format: 'uuid' },
          orderId: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'],
          },
          subtotal: { type: 'number', format: 'decimal' },
          tax: { type: 'number', format: 'decimal' },
          total: { type: 'number', format: 'decimal' },
          dueDate: { type: 'string', format: 'date' },
          paidAt: { type: 'string', format: 'date-time' },
        },
      },

      // User schema
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: {
            type: 'string',
            enum: ['owner', 'admin', 'manager', 'staff', 'optometrist', 'dispenser'],
          },
          accountStatus: {
            type: 'string',
            enum: ['active', 'suspended', 'pending'],
          },
          companyId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // Login request
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
        required: ['email', 'password'],
      },

      // Login response
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string', description: 'JWT token (if token auth enabled)' },
        },
      },

      // NHS Number validation
      NHSNumber: {
        type: 'string',
        pattern: '^\\d{10}$',
        description: 'UK NHS number (10 digits with Modulus 11 checksum)',
        example: '9434765919',
      },

      // GOC Number
      GOCNumber: {
        type: 'string',
        pattern: '^0[12]-\\d{5}$',
        description: 'General Optical Council registration (01-XXXXX for optometrists, 02-XXXXX for dispensing opticians)',
        example: '01-12345',
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request - validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
        headers: {
          'Retry-After': {
            schema: { type: 'integer' },
            description: 'Seconds until rate limit resets',
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number for pagination',
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Number of items per page',
      },
      SortByParam: {
        name: 'sortBy',
        in: 'query',
        schema: { type: 'string' },
        description: 'Field to sort by',
      },
      SortOrderParam: {
        name: 'sortOrder',
        in: 'query',
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        description: 'Sort direction',
      },
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Resource ID',
      },
    },
  },
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  paths: {}, // Paths are defined in route files via JSDoc comments
};

/**
 * swagger-jsdoc options
 */
export const swaggerJsdocOptions = {
  definition: openAPIDocument,
  apis: [
    './server/routes/**/*.ts',
    './server/routes/*.ts',
  ],
};

export default openAPIDocument;
