# LIMS Client Package - Implementation Checklist

## Current Status
- ✅ **Types**: Complete (`src/types.ts` - 200 lines)
- ✅ **Client Class**: Scaffolded (`src/LimsClient.ts` - 350 lines)
- ⏳ **Configuration**: Ready to implement
- ⏳ **Testing**: Ready to implement
- ⏳ **Documentation**: Ready to implement

---

## Phase 1: Setup & Configuration (1-2 hours)

### [ ] Create Package Structure
```bash
packages/lims-client/
├── src/
│   ├── index.ts           # Main export
│   ├── types.ts           # ✅ Complete
│   ├── LimsClient.ts      # ✅ Scaffolded
│   ├── schemas.ts         # TODO: Zod schemas
│   └── __tests__/
│       ├── LimsClient.test.ts
│       ├── schemas.test.ts
│       └── integration.test.ts
├── package.json           # TODO
├── tsconfig.json          # TODO
├── jest.config.js         # TODO
├── README.md              # TODO
└── .gitignore             # TODO
```

### [ ] Create package.json
```json
{
  "name": "@ils/lims-client",
  "version": "1.0.0",
  "description": "Type-safe LIMS API client with retry and circuit breaker",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "@types/node": "^20.16.11",
    "jest": "^30.2.0",
    "ts-jest": "^29.4.5",
    "typescript": "^5.6.3"
  }
}
```

### [ ] Create tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationDir": "./dist",
    "outDir": "./dist",
    "lib": ["ES2020"],
    "target": "ES2020"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts", "src/__tests__"]
}
```

---

## Phase 2: Zod Schema Integration (1-2 hours)

### [ ] Create schemas.ts
```typescript
// packages/lims-client/src/schemas.ts
import { z } from 'zod';

export const PrescriptionDataSchema = z.object({
  odSphere: z.number(),
  odCylinder: z.number().optional(),
  odAxis: z.number().optional(),
  odAdd: z.number().optional(),
  osSphere: z.number(),
  osCylinder: z.number().optional(),
  osAxis: z.number().optional(),
  osAdd: z.number().optional(),
  pd: z.number(),
});

export const CreateJobRequestSchema = z.object({
  ecpId: z.string().uuid(),
  patientId: z.string().uuid(),
  prescription: PrescriptionDataSchema,
  frameSpecs: z.object({
    frameType: z.string(),
    frameSize: z.string(),
    material: z.string(),
  }),
  lensType: z.enum(['single_vision', 'bifocal', 'progressive']),
  coating: z.string(),
  urgency: z.enum(['standard', 'expedited', 'rush']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const JobStatusSchema = z.enum([
  'queued',
  'in_production',
  'quality_check',
  'ready_for_shipping',
  'shipped',
  'completed',
  'failed',
  'on_hold',
]);

export const CreateJobResponseSchema = z.object({
  jobId: z.string().uuid(),
  status: JobStatusSchema,
  estimatedCompletionDate: z.string().datetime(),
  queuePosition: z.number(),
  rulesVersion: z.string(),
});

export const ValidationRequestSchema = z.object({
  prescription: PrescriptionDataSchema,
  lensType: z.string(),
  coating: z.string(),
  frameType: z.string(),
  rulesVersion: z.string().optional(),
});

export const ValidationResponseSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
  })),
  warnings: z.array(z.string()).optional(),
  estimatedLeadTime: z.number().optional(),
});

export const CatalogEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['lens_type', 'material', 'coating', 'frame_type']),
  description: z.string(),
  available: z.boolean(),
  leadTime: z.number(),
  restrictions: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const CatalogResponseSchema = z.object({
  version: z.string(),
  timestamp: z.string().datetime(),
  entries: z.array(CatalogEntrySchema),
  rulesVersion: z.string(),
});

export const LimsStatusUpdatePayloadSchema = z.object({
  jobId: z.string().uuid(),
  previousStatus: JobStatusSchema,
  newStatus: JobStatusSchema,
  timestamp: z.string().datetime(),
  details: z.record(z.string(), z.any()).optional(),
  errorMessage: z.string().optional(),
});
```

### [ ] Update LimsClient to use Zod
Add request validation:
```typescript
// In LimsClient.createJob()
const validatedRequest = CreateJobRequestSchema.parse(request);
// Send validatedRequest instead of request
```

---

## Phase 3: Unit Tests (2-3 hours)

### [ ] Create LimsClient.test.ts
```typescript
// packages/lims-client/src/__tests__/LimsClient.test.ts
import { LimsClient, LimsClientError } from '../LimsClient';
import { CreateJobRequest } from '../types';

describe('LimsClient', () => {
  let client: LimsClient;
  
  beforeEach(() => {
    client = new LimsClient({
      baseUrl: 'http://localhost:3000/api',
      apiKey: 'test-api-key',
      webhookSecret: 'test-webhook-secret',
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      // Mock fetch
      // Verify health check works
    });

    it('should handle LIMS unavailable', async () => {
      // Mock fetch to fail
      // Verify degraded status returned
    });
  });

  describe('createJob', () => {
    it('should create a job successfully', async () => {
      // Mock successful API response
      // Verify job created with correct data
    });

    it('should retry on network failure', async () => {
      // Mock network failure then success
      // Verify retry logic triggered
    });

    it('should validate request schema', async () => {
      // Pass invalid request
      // Verify validation error thrown
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration', async () => {
      // Mock LIMS validation endpoint
      // Verify response structure
    });

    it('should return validation errors', async () => {
      // Mock validation failure
      // Verify error details returned
    });
  });

  describe('fetchCatalog', () => {
    it('should fetch catalog', async () => {
      // Mock catalog endpoint
      // Verify catalog data returned
    });

    it('should cache catalog for 5 minutes', async () => {
      // Call fetchCatalog twice
      // Verify second call uses cache
    });

    it('should bypass cache when requested', async () => {
      // Call with useCache: false
      // Verify fresh data fetched
    });
  });

  describe('getCircuitBreakerState', () => {
    it('should report closed circuit', async () => {
      // Verify initial state
    });

    it('should open circuit after failures', async () => {
      // Mock repeated failures
      // Verify circuit opens
    });

    it('should half-open after timeout', async () => {
      // Wait for circuit timeout
      // Verify half-open state
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = JSON.stringify({ jobId: 'test' });
      const signature = createHmac('sha256', 'test-webhook-secret')
        .update(payload)
        .digest('hex');
      
      expect(client.verifyWebhookSignature(payload, signature)).toBe(true);
    });

    it('should reject invalid signature', () => {
      expect(client.verifyWebhookSignature('payload', 'invalid-sig')).toBe(false);
    });
  });
});
```

### [ ] Create schemas.test.ts
```typescript
// packages/lims-client/src/__tests__/schemas.test.ts
import {
  PrescriptionDataSchema,
  CreateJobRequestSchema,
  ValidationResponseSchema,
  CatalogResponseSchema,
} from '../schemas';

describe('Zod Schemas', () => {
  describe('PrescriptionDataSchema', () => {
    it('should validate valid prescription', () => {
      const data = {
        odSphere: -2.0,
        osSphere: -1.5,
        pd: 64,
      };
      expect(() => PrescriptionDataSchema.parse(data)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const data = { odSphere: -2.0, pd: 64 };
      expect(() => PrescriptionDataSchema.parse(data)).toThrow();
    });
  });

  describe('CreateJobRequestSchema', () => {
    it('should validate complete request', () => {
      const request = {
        ecpId: '123e4567-e89b-12d3-a456-426614174000',
        patientId: '123e4567-e89b-12d3-a456-426614174001',
        prescription: { odSphere: -2.0, osSphere: -1.5, pd: 64 },
        frameSpecs: { frameType: 'full-rim', frameSize: 'M', material: 'acetate' },
        lensType: 'progressive' as const,
        coating: 'anti-reflective',
      };
      expect(() => CreateJobRequestSchema.parse(request)).not.toThrow();
    });
  });

  // Add more schema tests
});
```

### [ ] Create integration.test.ts
```typescript
// packages/lims-client/src/__tests__/integration.test.ts
import { LimsClient } from '../LimsClient';

describe('LimsClient Integration Tests', () => {
  // Mock LIMS server or use test fixtures
  // Test complete workflows:
  // 1. Create job → Validate → Get status
  // 2. Webhook signature verification
  // 3. Catalog caching with expiration
  // 4. Circuit breaker opening/closing
});
```

---

## Phase 4: Export & Documentation (1 hour)

### [ ] Create index.ts
```typescript
// packages/lims-client/src/index.ts
export { LimsClient, LimsClientError } from './LimsClient';
export type {
  LimsClientConfig,
  LimsClientOptions,
  CreateJobRequest,
  CreateJobResponse,
  JobStatus,
  ValidationRequest,
  ValidationResponse,
  CatalogResponse,
  CatalogEntry,
  LimsHealthCheck,
  CircuitBreakerState,
  FrameSpecification,
  PrescriptionData,
  LimsStatusUpdatePayload,
} from './types';

export {
  PrescriptionDataSchema,
  CreateJobRequestSchema,
  CreateJobResponseSchema,
  JobStatusSchema,
  ValidationRequestSchema,
  ValidationResponseSchema,
  CatalogEntrySchema,
  CatalogResponseSchema,
  LimsStatusUpdatePayloadSchema,
} from './schemas';
```

### [ ] Create README.md
```markdown
# LIMS Client Package

Type-safe API client for LIMS integration with built-in retry logic and circuit breaker.

## Installation

```bash
npm install @ils/lims-client
```

## Quick Start

```typescript
import { LimsClient } from '@ils/lims-client';

const client = new LimsClient({
  baseUrl: 'https://lims.company.com/api',
  apiKey: process.env.LIMS_API_KEY,
  webhookSecret: process.env.LIMS_WEBHOOK_SECRET,
});

// Create a job
const job = await client.createJob({
  ecpId: 'ecp-123',
  patientId: 'patient-456',
  prescription: { odSphere: -2.0, osSphere: -1.5, pd: 64 },
  frameSpecs: { frameType: 'full-rim', material: 'acetate' },
  lensType: 'progressive',
  coating: 'anti-reflective',
});

console.log(`Job created: ${job.jobId}`);
```

## Features

- ✅ Type-safe API client
- ✅ Automatic retry with exponential backoff
- ✅ Circuit breaker pattern
- ✅ Built-in caching
- ✅ Webhook signature verification
- ✅ Request/response validation with Zod

## API Reference

[Full API documentation...]
```

---

## Phase 5: Testing & Validation (1-2 hours)

### [ ] Run Tests
```bash
cd packages/lims-client
npm test                      # Run all tests
npm run test:coverage        # Generate coverage report
npm run test:watch           # Watch mode
```

### [ ] Target Coverage
- [ ] Statements: >80%
- [ ] Branches: >80%
- [ ] Functions: >80%
- [ ] Lines: >80%

### [ ] Build Package
```bash
npm run build               # Build to dist/
npm pack                    # Create .tgz for testing
```

### [ ] Manual Testing Checklist
- [ ] Create job with valid data
- [ ] Create job with invalid data (should throw)
- [ ] Test retry logic (mock network failure)
- [ ] Test circuit breaker (mock 5+ failures)
- [ ] Test webhook signature verification
- [ ] Test catalog caching
- [ ] Test health check

---

## Phase 6: Integration with Services (Varies)

### [ ] Make Available to Services

Update monorepo package.json:
```json
{
  "workspaces": [
    "packages/lims-client",
    "."
  ]
}
```

Import in Order Service:
```typescript
import { LimsClient } from '@ils/lims-client';

const limsClient = new LimsClient({
  baseUrl: process.env.LIMS_API_BASE_URL,
  apiKey: process.env.LIMS_API_KEY,
  webhookSecret: process.env.LIMS_WEBHOOK_SECRET,
});
```

---

## Estimated Time to Completion

- Phase 1 (Setup): 1-2 hours
- Phase 2 (Schemas): 1-2 hours
- Phase 3 (Testing): 2-3 hours
- Phase 4 (Docs): 1 hour
- Phase 5 (Validation): 1-2 hours
- **Total**: 6-10 hours

---

## Success Criteria

- ✅ All tests passing
- ✅ >80% code coverage
- ✅ Zero TypeScript errors
- ✅ No console errors or warnings
- ✅ Package builds successfully
- ✅ Can be imported and used by services
- ✅ Documentation complete
- ✅ Ready for Phase 1 implementation

---

## Next: Integration with Order Service

Once LIMS Client Package is complete:

1. Create `server/services/OrderService.ts`
2. Implement Order creation flow:
   - Validate against LIMS
   - Create job in LIMS
   - Store job_id in local database
   - Return order with job_id
3. Create webhook handler endpoint
4. Add tests for Order Service

---

**Document Status**: Ready for Implementation  
**Created**: October 28, 2025  
**Estimated Start**: November 1, 2025  
**Estimated Completion**: November 4-5, 2025 (assuming 2-3 days work)
