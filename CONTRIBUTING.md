# Contributing to ILS 2.0

Thank you for your interest in contributing to ILS 2.0! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Common Development Tasks](#common-development-tasks)
- [Getting Help](#getting-help)

---

## Code of Conduct

### Our Commitment

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community and the project
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or discriminatory language
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 20.x
- **npm** or **pnpm**
- **PostgreSQL** >= 15.x
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - ESLint
  - TypeScript
  - Tailwind CSS IntelliSense

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ILS2.0.git
   cd ILS2.0
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/newvantageco/ILS2.0.git
   ```

### Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

3. **Set up the database:**
   ```bash
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Verify setup:**
   - Application: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

---

## Development Workflow

### Branch Naming Convention

Create feature branches with descriptive names:

```bash
# Feature branches
git checkout -b feat/patients-export-csv
git checkout -b feat/ai-voice-input

# Bug fix branches
git checkout -b fix/auth-session-timeout
git checkout -b fix/prescription-validation

# Documentation branches
git checkout -b docs/api-endpoints
git checkout -b docs/deployment-guide

# Refactoring branches
git checkout -b refactor/order-service
git checkout -b refactor/database-indexes
```

**Format:** `<type>/<scope>-<short-description>`

**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### Keep Your Fork Updated

Regularly sync with upstream:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Working on Features

1. **Create a branch** from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feat/my-feature
   ```

2. **Make focused commits** as you work
3. **Write/update tests** for your changes
4. **Run tests locally** before pushing:
   ```bash
   npm run test:components
   npm run test:integration
   npm run type-check
   ```

5. **Push your branch:**
   ```bash
   git push origin feat/my-feature
   ```

6. **Open a Pull Request** on GitHub

---

## Coding Standards

### TypeScript

**Type Safety:**
```typescript
// ✅ Good - Explicit types
function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad - Implicit any
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Null/Undefined Handling:**
```typescript
// ✅ Good - Type-safe helper
const getCompanyId = (req: Request): string => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    throw new Error('Company ID is required');
  }
  return companyId;
};

// ❌ Bad - Non-null assertion
const companyId = req.user!.companyId;
```

**Interfaces vs Types:**
```typescript
// ✅ Use interfaces for object shapes that may be extended
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

// ✅ Use types for unions, intersections, utility types
type OrderStatus = 'pending' | 'in_production' | 'shipped' | 'completed';
type PatientWithOrders = Patient & { orders: Order[] };
```

### React Components

**Component Structure:**
```typescript
// ✅ Good - Clear, focused component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            "text-xs",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Hooks:**
```typescript
// ✅ Good - Custom hook with clear responsibility
function usePatientSearch(companyId: string) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<PatientFilters>({});

  const { data, isLoading } = useQuery({
    queryKey: ['patients', companyId, search, filters],
    queryFn: () => fetchPatients(companyId, search, filters),
  });

  return { patients: data, isLoading, search, setSearch, filters, setFilters };
}
```

### Naming Conventions

**Variables:**
```typescript
// ✅ Good - Descriptive names
const activePatients = patients.filter(p => p.status === 'active');
const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

// ❌ Bad - Unclear abbreviations
const aPts = patients.filter(p => p.status === 'active');
const tr = orders.reduce((s, o) => s + o.totalPrice, 0);
```

**Functions:**
```typescript
// ✅ Good - Action verbs
function createOrder(data: OrderInput): Promise<Order>
function validatePrescription(rx: PrescriptionInput): ValidationResult
function calculateLensPrice(type: LensType, material: Material): number

// ❌ Bad - Unclear purpose
function order(data: OrderInput): Promise<Order>
function prescription(rx: PrescriptionInput): ValidationResult
function lens(type: LensType, material: Material): number
```

**Components:**
```typescript
// ✅ Good - PascalCase, descriptive
PatientList.tsx
OrderStatusBadge.tsx
PrescriptionForm.tsx

// ❌ Bad - Unclear or inconsistent
patientlist.tsx
status.tsx
form1.tsx
```

### Code Style

**Guard Clauses:**
```typescript
// ✅ Good - Early returns
function processOrder(order: Order): void {
  if (!order) {
    throw new Error('Order is required');
  }
  if (order.status === 'cancelled') {
    return;
  }
  if (!order.prescription) {
    throw new Error('Prescription is required');
  }

  // Main logic here
  updateOrderStatus(order);
}

// ❌ Bad - Deep nesting
function processOrder(order: Order): void {
  if (order) {
    if (order.status !== 'cancelled') {
      if (order.prescription) {
        // Main logic buried deep
        updateOrderStatus(order);
      } else {
        throw new Error('Prescription is required');
      }
    }
  } else {
    throw new Error('Order is required');
  }
}
```

**Error Handling:**
```typescript
// ✅ Good - Meaningful error messages
try {
  await createOrder(orderData);
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details
    });
  }
  console.error('Failed to create order:', error);
  return res.status(500).json({ error: 'Failed to create order' });
}

// ❌ Bad - Generic error handling
try {
  await createOrder(orderData);
} catch (error) {
  console.error(error);
  return res.status(500).json({ error: 'Error' });
}
```

---

## Testing Requirements

### Component Tests (Vitest)

**Location:** `test/components/`

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBadge } from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('should render pending status correctly', () => {
    render(<StatusBadge status="pending" />);

    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<StatusBadge status="pending" onClick={handleClick} />);

    const badge = screen.getByText('Pending');
    await userEvent.click(badge);

    expect(handleClick).toHaveBeenCalledWith('pending');
  });
});
```

**Run tests:**
```bash
npm run test:components
npm run test:components -- --watch
npm run test:components -- StatusBadge
```

### Integration Tests (Jest)

**Location:** `test/integration/`

**Example:**
```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server';

describe('Patients API', () => {
  let authCookie: string;

  beforeAll(async () => {
    // Login to get auth cookie
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authCookie = response.headers['set-cookie'][0];
  });

  it('should create patient with valid data', async () => {
    const newPatient = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    };

    const response = await request(app)
      .post('/api/patients')
      .set('Cookie', [authCookie])
      .send(newPatient);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.firstName).toBe('John');
  });
});
```

### E2E Tests (Playwright)

**Location:** `test/e2e/`

**Example:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should create new patient', async ({ page }) => {
    await page.goto('/patients');
    await page.click('button:has-text("Add Patient")');

    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'jane@example.com');

    await page.click('button:has-text("Create")');

    await expect(page.locator('text=/Jane Smith/i')).toBeVisible();
  });
});
```

### Testing Requirements

- **All new features** must include tests
- **Bug fixes** should include regression tests
- **Component changes** require component tests
- **API changes** require integration tests
- **Critical workflows** require E2E tests

### Test Coverage Goals

- Component coverage: **>80%**
- Service coverage: **>90%**
- API coverage: **100%** of public endpoints
- E2E coverage: All critical user workflows

---

## Pull Request Process

### Before Opening a PR

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks:**
   ```bash
   npm run type-check
   npm run lint
   npm test
   ```

3. **Test manually:**
   - Start dev server: `npm run dev`
   - Test your changes in the browser
   - Verify no console errors

### PR Checklist

- [ ] **Linked issue or clear purpose** - Reference issue number or explain the change
- [ ] **Tests added/updated** - All new code has appropriate tests
- [ ] **Docs updated** - User-facing changes documented
- [ ] **Type check passes** - `npm run type-check` succeeds
- [ ] **Tests pass** - `npm test` succeeds
- [ ] **No console errors** - Manual smoke test completed
- [ ] **Screenshots/videos** - For UI changes, include visual proof
- [ ] **Database migrations** - If schema changed, migration included
- [ ] **Breaking changes** - Documented in PR description

### PR Template

```markdown
## Description
Brief description of the changes

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Component tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## Screenshots (if applicable)
Drag and drop screenshots here

## Additional Notes
Any additional information reviewers should know
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by at least one maintainer
3. **Changes requested** - Address feedback and push updates
4. **Approval** - PR is approved
5. **Merge** - Maintainer will merge your PR

---

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements

### Scope

The scope should indicate the area of the codebase:

- `auth` - Authentication
- `patients` - Patient management
- `orders` - Order management
- `ai` - AI services
- `ui` - UI components
- `api` - API endpoints
- `db` - Database
- `docs` - Documentation

### Examples

```bash
# Feature
feat(patients): add CSV export functionality

# Bug fix
fix(auth): resolve session timeout issue

# Documentation
docs(api): update authentication endpoint examples

# Refactoring
refactor(orders): simplify status update logic

# Performance
perf(db): add index on patients.companyId

# Breaking change
feat(api)!: change patient API response format

BREAKING CHANGE: Patient API now returns nested address object
```

### Best Practices

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Keep subject line under 72 characters
- Use body to explain what and why, not how

---

## Documentation Guidelines

### Code Comments

**When to comment:**
```typescript
// ✅ Good - Explain why, not what
// Retry failed requests up to 3 times to handle transient network errors
async function fetchWithRetry(url: string, maxRetries = 3) {
  // Implementation
}

// ❌ Bad - Obvious comment
// This function fetches data
async function fetchData(url: string) {
  // Implementation
}
```

**Complex logic:**
```typescript
// Calculate GOC retention period (7 years from last visit)
// UK law requires optical records to be kept for minimum 7 years
const RETENTION_PERIOD = 7 * 365 * 24 * 60 * 60 * 1000;
```

### API Documentation

**Use JSDoc for exported functions:**
```typescript
/**
 * Creates a new order with prescription validation
 *
 * @param orderData - Order details including prescription
 * @param companyId - Company identifier for multi-tenancy
 * @returns Created order with generated ID
 * @throws {ValidationError} If prescription values are invalid
 * @throws {NotFoundError} If patient doesn't exist
 */
export async function createOrder(
  orderData: OrderInput,
  companyId: string
): Promise<Order> {
  // Implementation
}
```

### README Updates

Update relevant documentation when you:
- Add new features
- Change API endpoints
- Update configuration requirements
- Add new scripts or commands

---

## Common Development Tasks

### Adding a New API Endpoint

1. **Create route handler:**
   ```typescript
   // server/routes/myFeature.ts
   import express from 'express';
   import { isAuthenticated } from '../middleware/auth';

   const router = express.Router();

   router.get('/my-endpoint', isAuthenticated, async (req, res) => {
     // Implementation
   });

   export default router;
   ```

2. **Register route:**
   ```typescript
   // server/routes.ts
   import myFeatureRoutes from './routes/myFeature';
   app.use('/api/my-feature', myFeatureRoutes);
   ```

3. **Add tests:**
   ```typescript
   // test/integration/my-feature-api.test.ts
   describe('My Feature API', () => {
     it('should handle GET /api/my-endpoint', async () => {
       // Test implementation
     });
   });
   ```

### Adding a New React Component

1. **Create component:**
   ```typescript
   // client/src/components/MyComponent.tsx
   interface MyComponentProps {
     // Props
   }

   export function MyComponent({ ...props }: MyComponentProps) {
     // Implementation
   }
   ```

2. **Add tests:**
   ```typescript
   // test/components/MyComponent.test.tsx
   describe('MyComponent', () => {
     it('should render correctly', () => {
       // Test implementation
     });
   });
   ```

3. **Export from index:**
   ```typescript
   // client/src/components/index.ts
   export { MyComponent } from './MyComponent';
   ```

### Database Schema Changes

1. **Update schema:**
   ```typescript
   // shared/schema.ts
   export const myTable = pgTable('my_table', {
     id: text('id').primaryKey(),
     companyId: text('company_id').notNull(),
     name: text('name').notNull(),
     createdAt: timestamp('created_at').defaultNow(),
   });
   ```

2. **Push changes:**
   ```bash
   npm run db:push
   ```

3. **Create migration (production):**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Adding Environment Variables

1. **Update `.env.example`:**
   ```env
   NEW_API_KEY="your-key-here"
   ```

2. **Document in README:**
   Update the Environment Variables section

3. **Use in code:**
   ```typescript
   const apiKey = process.env.NEW_API_KEY;
   if (!apiKey) {
     throw new Error('NEW_API_KEY is required');
   }
   ```

---

## Getting Help

### Resources

- **Documentation:** [docs/](./docs/)
  - [Testing Guide](./docs/TESTING.md)
  - [Architecture](./docs/ARCHITECTURE.md)
- **API Docs:** http://localhost:5000/api-docs
- **Issues:** [GitHub Issues](https://github.com/newvantageco/ILS2.0/issues)

### Asking Questions

When asking for help, please include:

1. **What you're trying to do**
2. **What you've tried**
3. **Error messages** (full stack trace)
4. **Environment details** (Node version, OS, etc.)
5. **Code samples** (minimal reproduction)

### Reporting Bugs

Use the bug report template and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Environment information

---

## License

By contributing to ILS 2.0, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to ILS 2.0!**

We appreciate your time and effort in making this project better for everyone in the optical industry.
