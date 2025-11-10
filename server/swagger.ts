/**
 * Swagger/OpenAPI Configuration
 * API Documentation setup for ILS 2.0
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ILS 2.0 API Documentation',
      version: '2.0.0',
      description: `
        # ILS 2.0 - Integrated Laboratory System
        
        Comprehensive SaaS platform for the UK optical industry.
        
        ## Features
        - 👁️ Clinical eye examination management
        - 🤖 AI-powered assistance (GPT-4, Claude)
        - 📋 Prescription management
        - 🛍️ Shopify integration
        - 📊 Business intelligence & analytics
        - 🏥 NHS compliance (vouchers, exemptions, claims)
        - 📄 PDF generation (invoices, receipts, prescriptions)
        
        ## Authentication
        All endpoints require authentication unless marked otherwise.
        Use the \`Authorization\` header with a valid session token.
      `,
      contact: {
        name: 'ILS Support',
        email: 'support@ils.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.ils.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your session token'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
              example: 'Invalid prescription values provided'
            },
            details: {
              type: 'object',
              description: 'Additional error details',
              example: {
                field: 'odAxis',
                message: 'Must be between 0 and 180'
              }
            }
          }
        },
        Patient: {
          type: 'object',
          required: ['firstName', 'lastName'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique patient identifier',
              example: 'pat_1234567890'
            },
            companyId: {
              type: 'string',
              description: 'Company identifier (multi-tenant)',
              example: 'comp_abc123'
            },
            customerNumber: {
              type: 'string',
              description: 'Customer reference number',
              example: 'CUST-00001234'
            },
            firstName: {
              type: 'string',
              description: 'Patient first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'Patient last name',
              example: 'Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Patient email address',
              example: 'john.smith@example.com'
            },
            phone: {
              type: 'string',
              description: 'Patient phone number',
              example: '07700900000'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
              example: '1990-01-15'
            },
            nhsNumber: {
              type: 'string',
              description: 'NHS number (UK)',
              example: '4505551234'
            },
            address: {
              type: 'object',
              properties: {
                line1: { type: 'string', example: '123 High Street' },
                line2: { type: 'string', example: 'Flat 4' },
                city: { type: 'string', example: 'London' },
                postcode: { type: 'string', example: 'SW1A 1AA' },
                country: { type: 'string', example: 'United Kingdom' }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Patient creation timestamp',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Prescription: {
          type: 'object',
          required: ['patientId'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique prescription identifier',
              example: 'rx_9876543210'
            },
            patientId: {
              type: 'string',
              description: 'Associated patient ID',
              example: 'pat_1234567890'
            },
            companyId: {
              type: 'string',
              description: 'Company identifier',
              example: 'comp_abc123'
            },
            odSphere: {
              type: 'string',
              description: 'Right eye sphere power',
              example: '+2.00',
              pattern: '^[+-]\\d+\\.\\d{2}$'
            },
            odCylinder: {
              type: 'string',
              description: 'Right eye cylinder power',
              example: '-0.50',
              pattern: '^[+-]\\d+\\.\\d{2}$'
            },
            odAxis: {
              type: 'string',
              description: 'Right eye axis (0-180)',
              example: '90',
              pattern: '^\\d{1,3}$'
            },
            osSphere: {
              type: 'string',
              description: 'Left eye sphere power',
              example: '+2.25'
            },
            osCylinder: {
              type: 'string',
              description: 'Left eye cylinder power',
              example: '-0.75'
            },
            osAxis: {
              type: 'string',
              description: 'Left eye axis (0-180)',
              example: '85'
            },
            pd: {
              type: 'string',
              description: 'Pupillary distance (mm)',
              example: '64'
            },
            prescriptionType: {
              type: 'string',
              enum: ['spectacles', 'contact_lenses'],
              description: 'Type of prescription',
              example: 'spectacles'
            },
            issuedDate: {
              type: 'string',
              format: 'date',
              description: 'Date prescription was issued',
              example: '2024-01-15'
            },
            expiryDate: {
              type: 'string',
              format: 'date',
              description: 'Prescription expiry date',
              example: '2026-01-15'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Order: {
          type: 'object',
          required: ['patientId', 'lensType'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique order identifier',
              example: 'ord_xyz789'
            },
            companyId: {
              type: 'string',
              description: 'Company identifier',
              example: 'comp_abc123'
            },
            patientId: {
              type: 'string',
              description: 'Associated patient ID',
              example: 'pat_1234567890'
            },
            orderNumber: {
              type: 'string',
              description: 'Human-readable order number',
              example: 'ORD-20240115',
              pattern: '^ORD-\\d{8}$'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_production', 'quality_check', 'shipped', 'completed', 'on_hold', 'cancelled'],
              description: 'Current order status',
              example: 'in_production'
            },
            lensType: {
              type: 'string',
              enum: ['single_vision', 'bifocal', 'progressive', 'reading'],
              description: 'Type of lenses',
              example: 'progressive'
            },
            lensMaterial: {
              type: 'string',
              enum: ['cr39', 'polycarbonate', 'trivex', 'high_index_1.67', 'high_index_1.74'],
              description: 'Lens material',
              example: 'polycarbonate'
            },
            coating: {
              type: 'string',
              enum: ['none', 'hard_coat', 'anti-reflective', 'blue_light_filter', 'photochromic', 'premium'],
              description: 'Lens coating',
              example: 'anti-reflective'
            },
            totalPrice: {
              type: 'number',
              description: 'Total order price (GBP)',
              example: 250.00
            },
            prescription: {
              $ref: '#/components/schemas/Prescription'
            },
            notes: {
              type: 'string',
              description: 'Order notes',
              example: 'Patient requires rush processing'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
              example: '2024-01-15T10:30:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-01-16T14:20:00Z'
            }
          }
        },
        AIResponse: {
          type: 'object',
          properties: {
            response: {
              type: 'string',
              description: 'AI-generated response',
              example: 'Progressive lenses are multifocal lenses that provide a smooth transition between different lens powers...'
            },
            sources: {
              type: 'array',
              items: { type: 'string' },
              description: 'Knowledge base sources used',
              example: ['lens_types.md', 'patient_recommendations.md']
            },
            confidence: {
              type: 'number',
              description: 'Response confidence (0-1)',
              example: 0.95
            },
            provider: {
              type: 'string',
              enum: ['openai', 'anthropic'],
              description: 'AI provider used',
              example: 'openai'
            }
          }
        },
        AnalyticsOverview: {
          type: 'object',
          properties: {
            totalOrders: {
              type: 'integer',
              description: 'Total number of orders',
              example: 1234
            },
            totalRevenue: {
              type: 'number',
              description: 'Total revenue (GBP)',
              example: 125000.00
            },
            activePatients: {
              type: 'integer',
              description: 'Number of active patients',
              example: 456
            },
            pendingOrders: {
              type: 'integer',
              description: 'Orders in pending status',
              example: 23
            },
            ordersChange: {
              type: 'number',
              description: 'Percentage change from previous period',
              example: 12.5
            },
            revenueChange: {
              type: 'number',
              description: 'Revenue percentage change',
              example: 8.3
            }
          }
        }
      },
      examples: {
        PatientExample: {
          value: {
            id: 'pat_1234567890',
            companyId: 'comp_abc123',
            customerNumber: 'CUST-00001234',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            phone: '07700900000',
            dateOfBirth: '1990-01-15',
            nhsNumber: '4505551234',
            address: {
              line1: '123 High Street',
              city: 'London',
              postcode: 'SW1A 1AA',
              country: 'United Kingdom'
            },
            createdAt: '2024-01-15T10:30:00Z'
          }
        },
        OrderExample: {
          value: {
            id: 'ord_xyz789',
            orderNumber: 'ORD-20240115',
            status: 'in_production',
            patientId: 'pat_1234567890',
            lensType: 'progressive',
            lensMaterial: 'polycarbonate',
            coating: 'anti-reflective',
            prescription: {
              odSphere: '+2.00',
              odCylinder: '-0.50',
              odAxis: '90',
              osSphere: '+2.25',
              osCylinder: '-0.75',
              osAxis: '85',
              pd: '64'
            },
            totalPrice: 250.00,
            notes: 'Patient requires rush processing',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-16T14:20:00Z'
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        cookieAuth: []
      }
    ]
  },
  apis: [
    './server/routes/*.ts',
    './server/routes.ts'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ILS 2.0 API Docs',
    explorer: true
  }));

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 API Documentation available at /api-docs');
}

export { swaggerSpec };
