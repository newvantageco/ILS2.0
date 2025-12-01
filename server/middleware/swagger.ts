/**
 * Swagger/OpenAPI Documentation Middleware
 *
 * Provides API documentation via Swagger UI and OpenAPI spec endpoints.
 *
 * Endpoints:
 * - GET /api/docs - Swagger UI interface
 * - GET /api/docs/openapi.json - OpenAPI 3.1 specification
 * - GET /api/docs/openapi.yaml - OpenAPI spec in YAML format
 *
 * @module server/middleware/swagger
 */

import { Router, Request, Response } from 'express';
import { openAPIDocument } from '../lib/openapi-config';
import { createLogger } from '../utils/logger';

const logger = createLogger('Swagger');
const router = Router();

/**
 * Serve OpenAPI specification as JSON
 */
router.get('/openapi.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(openAPIDocument);
});

/**
 * Serve OpenAPI specification as YAML
 */
router.get('/openapi.yaml', (req: Request, res: Response) => {
  // Simple JSON to YAML conversion for OpenAPI spec
  const yaml = jsonToYaml(openAPIDocument);
  res.setHeader('Content-Type', 'text/yaml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(yaml);
});

/**
 * Swagger UI HTML page
 */
router.get('/', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ILS 2.0 API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 2rem; }
    .swagger-ui .info .description { font-size: 1rem; line-height: 1.6; }
    .swagger-ui .info .description h2 { margin-top: 1.5rem; color: #3b4151; }
    .swagger-ui .info .description code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    .deprecation-banner {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 12px 20px;
      margin: 20px;
      font-size: 14px;
    }
    .deprecation-banner strong { color: #856404; }
  </style>
</head>
<body>
  <div class="deprecation-banner">
    <strong>Deprecation Notice:</strong> Legacy AI endpoints (/api/master-ai, /api/platform-ai, etc.)
    will be removed after <strong>2026-03-01</strong>.
    Please migrate to the unified <code>/api/ai/*</code> endpoints.
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        syntaxHighlight: {
          activate: true,
          theme: "monokai"
        },
        tryItOutEnabled: true,
        requestInterceptor: (request) => {
          // Include credentials for session auth
          request.credentials = 'include';
          return request;
        }
      });
    };
  </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(html);
});

/**
 * Simple JSON to YAML converter for OpenAPI specs
 * Handles the basic structure without external dependencies
 */
function jsonToYaml(obj: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  if (obj === null) {
    return 'null';
  }

  if (typeof obj === 'string') {
    // Check if string needs quoting
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') ||
        obj.startsWith(' ') || obj.endsWith(' ') ||
        /^[\[\]{}>|*&!%@`]/.test(obj)) {
      // Multi-line strings
      if (obj.includes('\n')) {
        return `|\n${obj.split('\n').map(line => spaces + '  ' + line).join('\n')}`;
      }
      // Quote strings with special chars
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    yaml = '\n';
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        yaml += `${spaces}- ${jsonToYaml(item, indent + 1).trimStart()}\n`;
      } else {
        yaml += `${spaces}- ${jsonToYaml(item, indent + 1)}\n`;
      }
    }
    return yaml.trimEnd();
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';

    for (const [key, value] of entries) {
      if (value === undefined) continue;

      if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
        yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:${jsonToYaml(value, indent + 1)}\n`;
      } else {
        yaml += `${spaces}${key}: ${jsonToYaml(value, indent)}\n`;
      }
    }
    return yaml;
  }

  return String(obj);
}

/**
 * Add endpoint documentation dynamically
 * This allows routes to register their documentation at runtime
 */
export function addEndpointDoc(
  path: string,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  doc: any
): void {
  if (!openAPIDocument.paths) {
    openAPIDocument.paths = {};
  }
  if (!openAPIDocument.paths[path]) {
    openAPIDocument.paths[path] = {};
  }
  (openAPIDocument.paths[path] as any)[method] = doc;
}

/**
 * Register common API paths
 */
function registerCommonPaths(): void {
  // Health endpoints
  addEndpointDoc('/health', 'get', {
    tags: ['Health'],
    summary: 'Health check',
    description: 'Basic health check endpoint for container orchestration',
    responses: {
      '200': {
        description: 'Service is healthy',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['ok', 'degraded'] },
                server: { type: 'string', enum: ['ready', 'starting'] },
                database: { type: 'string', enum: ['connected', 'initializing'] },
                timestamp: { type: 'string', format: 'date-time' },
                uptime: { type: 'number', description: 'Server uptime in seconds' },
              },
            },
          },
        },
      },
    },
    security: [],
  });

  // Authentication endpoints
  addEndpointDoc('/auth/login', 'post', {
    tags: ['Authentication'],
    summary: 'User login',
    description: 'Authenticate user with email and password',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/LoginRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Login successful',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginResponse' },
          },
        },
      },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '429': { $ref: '#/components/responses/TooManyRequests' },
    },
    security: [],
  });

  addEndpointDoc('/auth/logout', 'post', {
    tags: ['Authentication'],
    summary: 'User logout',
    description: 'End the current session',
    responses: {
      '200': {
        description: 'Logout successful',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Logged out successfully' },
              },
            },
          },
        },
      },
    },
  });

  addEndpointDoc('/auth/me', 'get', {
    tags: ['Authentication'],
    summary: 'Get current user',
    description: 'Returns the currently authenticated user',
    responses: {
      '200': {
        description: 'Current user information',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/User' },
          },
        },
      },
      '401': { $ref: '#/components/responses/Unauthorized' },
    },
  });

  // Patient endpoints
  addEndpointDoc('/patients', 'get', {
    tags: ['Patients'],
    summary: 'List patients',
    description: 'Get paginated list of patients for the current tenant',
    parameters: [
      { $ref: '#/components/parameters/PageParam' },
      { $ref: '#/components/parameters/LimitParam' },
      { $ref: '#/components/parameters/SortByParam' },
      { $ref: '#/components/parameters/SortOrderParam' },
      {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: 'Search by name, email, or NHS number',
      },
    ],
    responses: {
      '200': {
        description: 'List of patients',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Patient' },
                },
                pagination: { $ref: '#/components/schemas/Pagination' },
              },
            },
          },
        },
      },
      '401': { $ref: '#/components/responses/Unauthorized' },
    },
  });

  addEndpointDoc('/patients/{id}', 'get', {
    tags: ['Patients'],
    summary: 'Get patient by ID',
    description: 'Returns a single patient record',
    parameters: [{ $ref: '#/components/parameters/IdParam' }],
    responses: {
      '200': {
        description: 'Patient details',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Patient' },
          },
        },
      },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  });

  addEndpointDoc('/patients', 'post', {
    tags: ['Patients'],
    summary: 'Create patient',
    description: 'Create a new patient record',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['firstName', 'lastName', 'dateOfBirth'],
            properties: {
              firstName: { type: 'string', maxLength: 50 },
              lastName: { type: 'string', maxLength: 50 },
              dateOfBirth: { type: 'string', format: 'date' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              nhsNumber: { $ref: '#/components/schemas/NHSNumber' },
              address: { $ref: '#/components/schemas/UKAddress' },
            },
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Patient created',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Patient' },
          },
        },
      },
      '400': { $ref: '#/components/responses/BadRequest' },
      '409': {
        description: 'Conflict - patient with same NHS number exists',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  });

  // Orders endpoints
  addEndpointDoc('/orders', 'get', {
    tags: ['Orders'],
    summary: 'List orders',
    description: 'Get paginated list of orders',
    parameters: [
      { $ref: '#/components/parameters/PageParam' },
      { $ref: '#/components/parameters/LimitParam' },
      {
        name: 'status',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        },
        description: 'Filter by order status',
      },
      {
        name: 'patientId',
        in: 'query',
        schema: { type: 'string', format: 'uuid' },
        description: 'Filter by patient ID',
      },
    ],
    responses: {
      '200': {
        description: 'List of orders',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Order' },
                },
                pagination: { $ref: '#/components/schemas/Pagination' },
              },
            },
          },
        },
      },
    },
  });

  // Products/Inventory endpoints
  addEndpointDoc('/products', 'get', {
    tags: ['Inventory'],
    summary: 'List products',
    description: 'Get paginated list of products in inventory',
    parameters: [
      { $ref: '#/components/parameters/PageParam' },
      { $ref: '#/components/parameters/LimitParam' },
      {
        name: 'category',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['frames', 'lenses', 'accessories', 'supplies', 'other'],
        },
      },
      {
        name: 'lowStock',
        in: 'query',
        schema: { type: 'boolean' },
        description: 'Filter products below reorder point',
      },
    ],
    responses: {
      '200': {
        description: 'List of products',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Product' },
                },
                pagination: { $ref: '#/components/schemas/Pagination' },
              },
            },
          },
        },
      },
    },
  });

  // Invoices/Billing endpoints
  addEndpointDoc('/invoices', 'get', {
    tags: ['Billing'],
    summary: 'List invoices',
    description: 'Get paginated list of invoices',
    parameters: [
      { $ref: '#/components/parameters/PageParam' },
      { $ref: '#/components/parameters/LimitParam' },
      {
        name: 'status',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'],
        },
      },
    ],
    responses: {
      '200': {
        description: 'List of invoices',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Invoice' },
                },
                pagination: { $ref: '#/components/schemas/Pagination' },
              },
            },
          },
        },
      },
    },
  });

  // AI endpoints (unified)
  addEndpointDoc('/ai/chat', 'post', {
    tags: ['AI Services'],
    summary: 'AI Chat',
    description: 'Send a message to the AI assistant',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['prompt'],
            properties: {
              prompt: { type: 'string', maxLength: 5000 },
              context: { type: 'string', maxLength: 10000 },
              temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
              maxTokens: { type: 'integer', minimum: 1, maximum: 4000, default: 1000 },
            },
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'AI response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                response: { type: 'string' },
                tokensUsed: { type: 'integer' },
              },
            },
          },
        },
      },
      '402': {
        description: 'Insufficient AI credits',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  });

  logger.info('OpenAPI paths registered');
}

// Register common paths on module load
registerCommonPaths();

export { router as swaggerRouter };
export default router;
