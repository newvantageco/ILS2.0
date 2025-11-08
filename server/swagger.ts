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
              description: 'Error message'
            },
            message: {
              type: 'string',
              description: 'Detailed error description'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            companyId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            nhsNumber: { type: 'string' },
            address: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Prescription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            patientId: { type: 'string' },
            companyId: { type: 'string' },
            odSphere: { type: 'string' },
            odCylinder: { type: 'string' },
            odAxis: { type: 'string' },
            osSphere: { type: 'string' },
            osCylinder: { type: 'string' },
            osAxis: { type: 'string' },
            pd: { type: 'string' },
            prescriptionType: { type: 'string', enum: ['spectacles', 'contact_lenses'] },
            issuedDate: { type: 'string', format: 'date' },
            expiryDate: { type: 'string', format: 'date' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            companyId: { type: 'string' },
            patientId: { type: 'string' },
            orderNumber: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_production', 'quality_check', 'shipped', 'completed', 'cancelled'] },
            lensType: { type: 'string' },
            lensMaterial: { type: 'string' },
            coating: { type: 'string' },
            totalPrice: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
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
