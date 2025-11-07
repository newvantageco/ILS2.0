# 🛠️ ILS 2.0 Implementation Guide

**Developer Guide for Extending and Customizing ILS 2.0**

---

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Code Patterns](#code-patterns)
4. [Adding New Features](#adding-new-features)
5. [Database Development](#database-development)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Testing](#testing)
9. [Best Practices](#best-practices)
10. [Common Tasks](#common-tasks)

---

## Development Setup

### Prerequisites

```bash
# Required
- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- Git
- Text editor (VS Code recommended)

# Optional
- Docker (for containerized development)
- PostgreSQL GUI (pgAdmin, DBeaver, Postico)
```

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd ILS2.0

# 2. Install dependencies
npm install
# or
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# 4. Set up database
createdb ils2_development

# 5. Run migrations
npm run db:push

# 6. Start development server
npm run dev
```

### Development Environment Variables

```bash
# .env.development
DATABASE_URL="postgresql://postgres:password@localhost:5432/ils2_development"
OPENAI_API_KEY="sk-..."  # Required for AI features
SESSION_SECRET="dev-secret-min-32-characters-long"
NODE_ENV="development"
PORT="5000"
VITE_API_URL="http://localhost:5000"
```

### VS Code Setup

Recommended extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "Prisma.prisma"
  ]
}
```

Recommended settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Project Structure

```
ILS2.0/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   └── ...          # Feature-specific components
│   │   ├── pages/           # Page components (routes)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── styles/          # CSS files
│   │   │   ├── design-system.css
│   │   │   └── index.css
│   │   ├── App.tsx          # Root component
│   │   └── main.tsx         # Entry point
│   └── index.html
│
├── server/                   # Backend Express application
│   ├── routes/              # API route handlers
│   │   ├── auth.ts
│   │   ├── nhs.ts
│   │   ├── contactLens.ts
│   │   ├── ophthalamicAI.ts
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── NhsClaimsService.ts
│   │   ├── ContactLensService.ts
│   │   ├── OphthalamicAIService.ts
│   │   └── ...
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── routes.ts            # Route mounting
│   └── index.ts             # Server entry point
│
├── shared/                  # Shared code (client + server)
│   └── schema.ts            # Database schema (Drizzle)
│
├── db/                      # Database files
│   └── migrations/          # Migration files
│
├── docs/                    # Documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── API_DOCUMENTATION.md
│   ├── FEATURES_SUMMARY.md
│   └── ...
│
├── .env                     # Environment variables (gitignored)
├── .env.example             # Example environment variables
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── drizzle.config.ts        # Drizzle ORM configuration
```

---

## Code Patterns

### 1. Multi-Tenant Architecture

**All data must be isolated by `companyId`**

```typescript
// ❌ WRONG - No company isolation
const patients = await db.select().from(patients).execute();

// ✅ CORRECT - Company isolated
const patients = await db
  .select()
  .from(patients)
  .where(eq(patients.companyId, companyId))
  .execute();

// ✅ BEST - Use helper with AND
import { and, eq } from "drizzle-orm";

const patients = await db
  .select()
  .from(patients)
  .where(
    and(
      eq(patients.companyId, companyId),
      eq(patients.active, true)
    )
  )
  .execute();
```

### 2. Service Layer Pattern

Business logic belongs in services, not routes:

```typescript
// ❌ WRONG - Business logic in route
router.post("/claims/create", async (req, res) => {
  const claim = await db.insert(nhsClaims).values({
    ...req.body,
    claimNumber: `GOS1-${Date.now()}`, // Business logic here
  }).returning();
  res.json(claim);
});

// ✅ CORRECT - Business logic in service
// In routes/nhs.ts
router.post("/claims/create", async (req, res) => {
  const { companyId } = req.user!;
  const claim = await NhsClaimsService.createClaim({
    ...req.body,
    companyId,
  });
  res.json(claim);
});

// In services/NhsClaimsService.ts
export class NhsClaimsService {
  static async createClaim(data: CreateClaimData) {
    // Generate claim number
    const claimNumber = await this.generateClaimNumber(data.companyId, data.claimType);

    // Validate claim
    await this.validateClaim(data);

    // Create claim
    const [claim] = await db.insert(nhsClaims).values({
      ...data,
      claimNumber,
      status: "draft",
    }).returning();

    return claim;
  }

  private static async generateClaimNumber(companyId: string, type: string) {
    // Complex business logic
    const count = await db.select({ count: count() })
      .from(nhsClaims)
      .where(and(
        eq(nhsClaims.companyId, companyId),
        eq(nhsClaims.claimType, type)
      ));
    return `${type}-${new Date().getFullYear()}-${String(count[0].count + 1).padStart(4, "0")}`;
  }
}
```

### 3. Zod Validation

Always validate API inputs:

```typescript
import { z } from "zod";

// Define schema
const createPatientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  nhsNumber: z.string().regex(/^\d{3}\s?\d{3}\s?\d{4}$/).optional(),
  companyId: z.string().min(1),
});

// Use in route
router.post("/patients", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const validatedData = createPatientSchema.parse({ ...req.body, companyId });

    const patient = await PatientService.createPatient(validatedData);
    res.json(patient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});
```

### 4. Error Handling

Consistent error handling pattern:

```typescript
// Service layer - throw meaningful errors
export class PatientService {
  static async getPatient(patientId: string, companyId: string) {
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.companyId, companyId)
      ))
      .limit(1);

    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    return patient;
  }
}

// Route layer - catch and format errors
router.get("/patients/:patientId", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { patientId } = req.params;

    const patient = await PatientService.getPatient(patientId, companyId);
    res.json(patient);
  } catch (error: any) {
    console.error("Error fetching patient:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
});
```

### 5. TypeScript Types

Use shared types from schema:

```typescript
import type { Patient, Prescription, Order } from "@shared/schema";

// Infer insert types
import { patients } from "@shared/schema";

type CreatePatientData = typeof patients.$inferInsert;
type PatientData = typeof patients.$inferSelect;

// Use in service
export class PatientService {
  static async createPatient(data: CreatePatientData): Promise<PatientData> {
    const [patient] = await db.insert(patients).values(data).returning();
    return patient;
  }
}
```

---

## Adding New Features

### Step-by-Step: Adding a New Feature

Let's walk through adding a "Patient Recalls" feature.

#### Step 1: Database Schema

Edit `shared/schema.ts`:

```typescript
import { pgTable, varchar, date, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

// 1. Create enum if needed
export const recallReasonEnum = pgEnum("recall_reason", [
  "routine_exam",
  "glaucoma_check",
  "diabetic_check",
  "cl_aftercare",
  "other"
]);

// 2. Create table
export const patientRecalls = pgTable("patient_recalls", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: varchar("company_id", { length: 255 }).notNull(),
  patientId: varchar("patient_id", { length: 255 })
    .notNull()
    .references(() => patients.id),
  recallDate: date("recall_date").notNull(),
  recallReason: recallReasonEnum("recall_reason").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedDate: date("completed_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. Create indexes
export const patientRecallsCompanyIdIndex = index("patient_recalls_company_id_idx").on(
  patientRecalls.companyId
);
export const patientRecallsPatientIdIndex = index("patient_recalls_patient_id_idx").on(
  patientRecalls.patientId
);
export const patientRecallsDateIndex = index("patient_recalls_date_idx").on(
  patientRecalls.recallDate
);
```

#### Step 2: Run Migration

```bash
# Generate migration
npm run db:generate

# Review migration file in db/migrations/

# Apply migration
npm run db:push

# Or run migration
npm run db:migrate
```

#### Step 3: Create Service

Create `server/services/PatientRecallService.ts`:

```typescript
import { db } from "../db";
import { patientRecalls } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export class PatientRecallService {
  /**
   * Create a patient recall
   */
  static async createRecall(data: {
    companyId: string;
    patientId: string;
    recallDate: string;
    recallReason: string;
    notes?: string;
  }) {
    const [recall] = await db
      .insert(patientRecalls)
      .values({
        ...data,
        isCompleted: false,
      })
      .returning();

    return recall;
  }

  /**
   * Get all recalls for a patient
   */
  static async getPatientRecalls(patientId: string, companyId: string) {
    return await db
      .select()
      .from(patientRecalls)
      .where(
        and(
          eq(patientRecalls.companyId, companyId),
          eq(patientRecalls.patientId, patientId)
        )
      )
      .orderBy(desc(patientRecalls.recallDate));
  }

  /**
   * Get upcoming recalls
   */
  static async getUpcomingRecalls(
    companyId: string,
    daysAhead: number = 30
  ) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await db
      .select({
        recall: patientRecalls,
        patient: patients,
      })
      .from(patientRecalls)
      .innerJoin(patients, eq(patientRecalls.patientId, patients.id))
      .where(
        and(
          eq(patientRecalls.companyId, companyId),
          eq(patientRecalls.isCompleted, false),
          gte(patientRecalls.recallDate, today.toISOString().split("T")[0]),
          lte(patientRecalls.recallDate, futureDate.toISOString().split("T")[0])
        )
      )
      .orderBy(patientRecalls.recallDate);
  }

  /**
   * Complete a recall
   */
  static async completeRecall(recallId: string, companyId: string) {
    const [recall] = await db
      .update(patientRecalls)
      .set({
        isCompleted: true,
        completedDate: new Date().toISOString().split("T")[0],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(patientRecalls.id, recallId),
          eq(patientRecalls.companyId, companyId)
        )
      )
      .returning();

    if (!recall) {
      throw new Error("Recall not found");
    }

    return recall;
  }
}
```

#### Step 4: Create API Routes

Create `server/routes/patientRecalls.ts`:

```typescript
import { Router } from "express";
import { PatientRecallService } from "../services/PatientRecallService.js";
import { requireAuth } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

// Validation schemas
const createRecallSchema = z.object({
  patientId: z.string().min(1),
  recallDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recallReason: z.enum(["routine_exam", "glaucoma_check", "diabetic_check", "cl_aftercare", "other"]),
  notes: z.string().optional(),
});

// Create recall
router.post("/", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const validatedData = createRecallSchema.parse(req.body);

    const recall = await PatientRecallService.createRecall({
      ...validatedData,
      companyId,
    });

    res.json(recall);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get patient recalls
router.get("/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { patientId } = req.params;

    const recalls = await PatientRecallService.getPatientRecalls(patientId, companyId);
    res.json(recalls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming recalls
router.get("/upcoming", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const daysAhead = req.query.days ? parseInt(req.query.days as string) : 30;

    const recalls = await PatientRecallService.getUpcomingRecalls(companyId, daysAhead);
    res.json(recalls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Complete recall
router.post("/:recallId/complete", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { recallId } = req.params;

    const recall = await PatientRecallService.completeRecall(recallId, companyId);
    res.json(recall);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### Step 5: Mount Routes

Edit `server/routes.ts`:

```typescript
import patientRecallRoutes from "./routes/patientRecalls";

// Mount routes
app.use("/api/patient-recalls", patientRecallRoutes);
```

#### Step 6: Create Frontend Component

Create `client/src/pages/PatientRecalls.tsx`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle } from "lucide-react";

interface Recall {
  id: string;
  patient: { name: string };
  recallDate: string;
  recallReason: string;
  isCompleted: boolean;
}

export default function PatientRecalls() {
  const { data: recalls, isLoading } = useQuery<Recall[]>({
    queryKey: ["/api/patient-recalls/upcoming"],
  });

  const completeRecall = async (recallId: string) => {
    await fetch(`/api/patient-recalls/${recallId}/complete`, {
      method: "POST",
    });
    // Invalidate query to refresh
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Patient Recalls</h1>

      <div className="grid gap-4">
        {recalls?.map((recall) => (
          <Card key={recall.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{recall.patient.name}</span>
                <Button
                  onClick={() => completeRecall(recall.id)}
                  disabled={recall.isCompleted}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {recall.isCompleted ? "Completed" : "Complete"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date(recall.recallDate).toLocaleDateString()}</span>
                <span className="ml-4">Reason: {recall.recallReason}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### Step 7: Add Route

Edit `client/src/App.tsx`:

```typescript
import PatientRecalls from "./pages/PatientRecalls";

// Add route
<Route path="/ecp/recalls" component={PatientRecalls} />
```

#### Step 8: Test

```bash
# Test API endpoints
curl -X POST http://localhost:5000/api/patient-recalls \
  -H "Content-Type: application/json" \
  -d '{"patientId":"patient-123","recallDate":"2024-02-01","recallReason":"routine_exam"}'

curl http://localhost:5000/api/patient-recalls/upcoming

# Test frontend
# Navigate to http://localhost:5000/ecp/recalls
```

---

## Database Development

### Creating Tables

```typescript
// In shared/schema.ts
export const myTable = pgTable("my_table", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: varchar("company_id", { length: 255 }).notNull(), // Required for multi-tenant
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("active"),
  metadata: json("metadata"), // For flexible JSON data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create index on companyId (required for performance)
export const myTableCompanyIdIndex = index("my_table_company_id_idx").on(myTable.companyId);
```

### Relationships

```typescript
export const orders = pgTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  patientId: varchar("patient_id", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  // ...
});

// In queries
const ordersWithPatients = await db
  .select({
    order: orders,
    patient: patients,
  })
  .from(orders)
  .innerJoin(patients, eq(orders.patientId, patients.id))
  .where(eq(orders.companyId, companyId));
```

### Migrations

```bash
# Generate migration from schema changes
npm run db:generate

# Review migration file
cat db/migrations/0001_migration_name.sql

# Apply migration to dev database
npm run db:push

# Apply migration to production
npm run db:migrate
```

### Best Practices

1. **Always include `companyId`** for multi-tenant isolation
2. **Create indexes** on foreign keys and frequently queried columns
3. **Use enums** for fixed value sets (status, types, etc.)
4. **Add `createdAt`/`updatedAt`** for audit trails
5. **Use `onDelete: "cascade"`** for dependent records
6. **Use `decimal`** for money/precise numbers, not `float`

---

## API Development

### RESTful Conventions

```typescript
// Resource: /api/patients

GET    /api/patients              // List all patients
GET    /api/patients/:id          // Get patient by ID
POST   /api/patients              // Create patient
PUT    /api/patients/:id          // Update patient
DELETE /api/patients/:id          // Delete patient

// Sub-resources
GET    /api/patients/:id/prescriptions    // Get patient's prescriptions
POST   /api/patients/:id/prescriptions    // Create prescription for patient

// Actions
POST   /api/claims/:id/submit             // Submit claim
POST   /api/recalls/:id/complete          // Complete recall
```

### Request/Response Format

```typescript
// Request
POST /api/patients
Content-Type: application/json

{
  "name": "John Smith",
  "dateOfBirth": "1980-05-15",
  "email": "john@example.com"
}

// Success Response (200 OK, 201 Created)
{
  "id": "patient-123",
  "name": "John Smith",
  "dateOfBirth": "1980-05-15",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z"
}

// Error Response (400 Bad Request, 404 Not Found, 500 Internal Error)
{
  "error": "Validation failed",
  "details": [
    {
      "field": "dateOfBirth",
      "message": "Invalid date format"
    }
  ]
}
```

---

## Frontend Development

### Component Structure

```typescript
// Good component structure
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  patientId: string;
}

export default function PatientDetails({ patientId }: Props) {
  // 1. Hooks
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  // 2. Data fetching
  const { data: patient, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
  });

  // 3. Mutations
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
    },
  });

  // 4. Event handlers
  const handleSave = async (data) => {
    await updateMutation.mutateAsync(data);
    setEditing(false);
  };

  // 5. Loading/error states
  if (isLoading) return <div>Loading...</div>;
  if (!patient) return <div>Patient not found</div>;

  // 6. Render
  return (
    <Card>
      <h2>{patient.name}</h2>
      <p>DOB: {patient.dateOfBirth}</p>
      {editing ? (
        <EditForm patient={patient} onSave={handleSave} />
      ) : (
        <Button onClick={() => setEditing(true)}>Edit</Button>
      )}
    </Card>
  );
}
```

### Using Design System

```typescript
import { StatsCard, GradientCard } from "@/components/ui";

// Stats Card
<StatsCard
  title="Total Patients"
  value="1,234"
  subtitle="Active patients"
  icon={Users}
  variant="primary"
  trend={{ value: 12.5, isPositive: true, label: "vs last month" }}
/>

// Gradient Card
<GradientCard variant="primary">
  <GradientCardHeader
    title="AI Assistant"
    subtitle="Get instant insights"
    icon={<Brain />}
  />
  <GradientCardContent>
    Content here
  </GradientCardContent>
  <GradientCardActions>
    <Button>Action</Button>
  </GradientCardActions>
</GradientCard>
```

---

## Testing

### Unit Tests

```typescript
// services/PatientRecallService.test.ts
import { describe, it, expect } from "vitest";
import { PatientRecallService } from "./PatientRecallService";

describe("PatientRecallService", () => {
  it("should create a recall", async () => {
    const recall = await PatientRecallService.createRecall({
      companyId: "test-company",
      patientId: "patient-123",
      recallDate: "2024-02-01",
      recallReason: "routine_exam",
    });

    expect(recall.id).toBeDefined();
    expect(recall.isCompleted).toBe(false);
  });

  it("should get upcoming recalls", async () => {
    const recalls = await PatientRecallService.getUpcomingRecalls("test-company", 30);
    expect(Array.isArray(recalls)).toBe(true);
  });
});
```

### API Tests

```bash
# Using curl
curl -X POST http://localhost:5000/api/patient-recalls \
  -H "Content-Type: application/json" \
  -d '{"patientId":"patient-123","recallDate":"2024-02-01","recallReason":"routine_exam"}'

# Expected: 200 OK with recall object
```

---

## Best Practices

### 1. Security

```typescript
// ✅ Always validate company isolation
const patient = await db
  .select()
  .from(patients)
  .where(
    and(
      eq(patients.id, patientId),
      eq(patients.companyId, req.user!.companyId) // CRITICAL
    )
  );

// ❌ Never trust client input without validation
const data = req.body; // WRONG
const data = createPatientSchema.parse(req.body); // CORRECT

// ✅ Sanitize user input
import { escape } from "html-escaper";
const safeNote = escape(userInput);
```

### 2. Performance

```typescript
// ✅ Use indexes for frequently queried columns
export const patientNameIndex = index("patient_name_idx").on(patients.name);

// ✅ Limit query results
const patients = await db.select().from(patients).limit(100);

// ✅ Use pagination
const patients = await db.select().from(patients).limit(50).offset(page * 50);

// ❌ Avoid N+1 queries
for (const patient of patients) {
  const orders = await db.select().from(orders).where(eq(orders.patientId, patient.id)); // SLOW
}

// ✅ Use joins instead
const patientsWithOrders = await db
  .select()
  .from(patients)
  .leftJoin(orders, eq(orders.patientId, patients.id));
```

### 3. Error Handling

```typescript
// ✅ Use try-catch in routes
router.get("/patients/:id", async (req, res) => {
  try {
    const patient = await PatientService.getPatient(req.params.id, req.user!.companyId);
    res.json(patient);
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Throw meaningful errors in services
if (!patient) {
  throw new Error(`Patient not found: ${patientId}`);
}

// ✅ Handle specific error types
if (error instanceof z.ZodError) {
  return res.status(400).json({ error: "Validation failed", details: error.errors });
}
```

### 4. Code Organization

```typescript
// ✅ Group related functionality
services/
  ├── PatientService.ts
  ├── PrescriptionService.ts
  └── OrderService.ts

// ✅ Use meaningful names
const activePatients = await PatientService.getActivePatients(); // GOOD
const data = await service.get(); // BAD

// ✅ Keep functions small and focused
// Function should do one thing well

// ✅ Use constants
const NHS_GOS1_FEE = 23.35;
const MAX_CLAIM_AGE_DAYS = 90;
```

---

## Common Tasks

### Add a New API Endpoint

1. Create service method in `services/`
2. Add route in `routes/`
3. Mount route in `routes.ts`
4. Test with curl or Postman
5. Document in `API_DOCUMENTATION.md`

### Add a New Table

1. Add table definition in `shared/schema.ts`
2. Run `npm run db:generate`
3. Review migration
4. Run `npm run db:push` (dev) or `npm run db:migrate` (prod)
5. Create service for business logic
6. Create API routes
7. Create frontend components

### Add a New UI Component

1. Create component in `client/src/components/`
2. Use design system variables
3. Add to `client/src/components/ui/index.ts` if reusable
4. Document props with TypeScript
5. Test responsiveness

### Integrate with External API

1. Add API key to `.env`
2. Create service in `services/ExternalAPIService.ts`
3. Handle errors and rate limiting
4. Add caching if appropriate
5. Document in API docs

---

## Resources

- **TypeScript**: https://www.typescriptlang.org/docs/
- **React**: https://react.dev/
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **TanStack Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Shadcn/ui**: https://ui.shadcn.com/
- **OpenAI API**: https://platform.openai.com/docs/

---

**Happy coding! 🚀**
