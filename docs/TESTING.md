# Testing Guide - ILS 2.0

Comprehensive testing documentation for the ILS 2.0 platform.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

ILS 2.0 employs a multi-layered testing strategy to ensure reliability, security, and performance:

- **Unit Tests** - Test individual functions and classes in isolation
- **Component Tests** - Test React components with user interactions
- **Service Tests** - Test business logic services
- **Integration Tests** - Test API endpoints and workflows
- **E2E Tests** - Test complete user workflows across the full stack

### Test Stack

- **Vitest** - Fast unit and component testing for React
- **React Testing Library** - Component testing utilities
- **Jest** - Backend service and integration testing
- **Playwright** - Cross-browser E2E testing
- **Supertest** - HTTP API testing

---

## Test Structure

```
test/
├── components/              # React component tests (Vitest)
│   ├── StatCard.test.tsx
│   ├── StatusBadge.test.tsx
│   └── SearchBar.test.tsx
├── services/                # Service unit tests (Jest)
│   ├── EmailService.test.ts
│   ├── OrderService.test.ts
│   ├── MasterAIService.test.ts
│   ├── OphthalamicAIService.test.ts
│   └── ...
├── integration/             # API integration tests (Jest + Supertest)
│   ├── patients-api.test.ts
│   ├── orders-api.test.ts
│   ├── analytics-api.test.ts
│   └── shopify-to-prescription-workflow.test.ts
├── e2e/                     # End-to-end tests (Playwright)
│   ├── authentication.spec.ts
│   ├── patient-management.spec.ts
│   ├── ai-assistant.spec.ts
│   └── user-flows.spec.ts
└── unit/                    # Utility unit tests
    └── example.test.ts
```

---

## Running Tests

### Component Tests (Vitest)

Test React components with user interactions:

```bash
# Run all component tests
npm run test:components

# Run in watch mode
npm run test:components -- --watch

# Run specific component test
npm run test:components -- StatCard

# Run with coverage
npm run test:components -- --coverage
```

**Current Coverage:**
- ✅ 72 tests passing
- StatCard (21 tests)
- StatusBadge (17 tests)
- SearchBar (29 tests)
- UI utilities (5 tests)

### E2E Tests (Playwright)

Test complete user workflows across browsers:

```bash
# Run all E2E tests
npx playwright test

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run specific test file
npx playwright test authentication

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run on mobile
npx playwright test --project="Mobile Chrome"

# Generate test report
npx playwright show-report
```

**Current Coverage:**
- ✅ 65 tests × 5 browsers = 325 total executions
- Authentication (21 tests)
- Patient Management (19 tests)
- AI Assistant (19 tests)
- User Flows (6 tests)

**Browsers Tested:**
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

### Integration Tests (Jest)

Test API endpoints and workflows:

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- patients-api

# Run with coverage
npm run test:integration -- --coverage

# Run in watch mode
npm run test:integration -- --watch
```

**Current Coverage:**
- ✅ 200+ test cases
- Patients API (60+ tests)
- Orders API (80+ tests)
- Analytics API (70+ tests)

### Service Tests (Jest)

Test business logic services:

```bash
# Run all service tests
npm run test:services

# Run specific service test
npm run test:services -- EmailService

# Run with coverage
npm run test:services -- --coverage
```

**Current Coverage:**
- ✅ 100+ test cases
- EmailService (40+ tests)
- OrderService (50+ tests)
- AI Services (80+ tests)
- PDF/Document Services (30+ tests)

### Run All Tests

```bash
# Run complete test suite
npm test

# Run with coverage report
npm run test:coverage
```

---

## Test Coverage

### Current Test Statistics

| Category | Tests | Status |
|----------|-------|--------|
| Component Tests | 72 | ✅ Passing |
| E2E Tests | 65 (×5 browsers) | ✅ Passing |
| API Integration Tests | 200+ | ✅ Framework Ready |
| Service Tests | 100+ | ✅ Framework Ready |
| **Total** | **~450+** | **✅** |

### Coverage Goals

- **Component Coverage:** >80% of UI components
- **Service Coverage:** >90% of critical services
- **API Coverage:** 100% of public endpoints
- **E2E Coverage:** All critical user workflows

### Coverage by Module

**Frontend (Components):**
- ✅ Dashboard widgets (StatCard, StatusBadge)
- ✅ Search and filter components
- 🔄 Form components (in progress)
- 🔄 Modal dialogs (in progress)
- 🔄 Data tables (in progress)

**Backend (Services):**
- ✅ Email notifications
- ✅ Order management
- ✅ AI services (Master AI, Ophthalmic AI)
- ✅ PDF generation
- ✅ Shopify integration
- 🔄 Payment processing (in progress)
- 🔄 NHS integration (in progress)

**API Endpoints:**
- ✅ Authentication
- ✅ Patients CRUD
- ✅ Orders CRUD
- ✅ Analytics
- 🔄 Inventory (in progress)
- 🔄 POS (in progress)

**E2E Workflows:**
- ✅ User registration and approval
- ✅ Patient management
- ✅ Order creation
- ✅ AI assistant interaction
- ✅ Production workflow
- 🔄 Payment checkout (in progress)
- 🔄 Shopify sync (in progress)

---

## Writing Tests

### Component Test Example

```typescript
// test/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render with props', () => {
    render(<MyComponent title="Test" />);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Service Test Example

```typescript
// test/services/MyService.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { MyService } from '../../server/services/MyService';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should process data correctly', async () => {
    const result = await service.processData({ input: 'test' });

    expect(result).toHaveProperty('output');
    expect(result.status).toBe('success');
  });
});
```

### Integration Test Example

```typescript
// test/integration/my-api.test.ts
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';

describe('My API', () => {
  it('GET /api/resource - should return list', async () => {
    const response = await request(app)
      .get('/api/resource')
      .set('Cookie', [authCookie]);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /api/resource - should create resource', async () => {
    const response = await request(app)
      .post('/api/resource')
      .set('Cookie', [authCookie])
      .send({ name: 'Test' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### E2E Test Example

```typescript
// test/e2e/my-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Workflow', () => {
  test('should complete workflow', async ({ page }) => {
    // Navigate to page
    await page.goto('/workflow');

    // Fill form
    await page.fill('input[name="field"]', 'value');

    // Submit
    await page.click('button[type="submit"]');

    // Verify result
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

---

## Test Best Practices

### 1. Test Naming

Use descriptive test names that explain what is being tested:

```typescript
// ✅ Good
it('should display error message when email is invalid', () => {});

// ❌ Bad
it('test email', () => {});
```

### 2. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('should update order status', async () => {
  // Arrange
  const orderId = 'test-order-id';
  const newStatus = 'in_production';

  // Act
  const result = await orderService.updateStatus(orderId, newStatus);

  // Assert
  expect(result.status).toBe('in_production');
});
```

### 3. Test Independence

Each test should run independently:

```typescript
// ✅ Good - Each test creates its own data
beforeEach(() => {
  testData = createTestData();
});

// ❌ Bad - Tests depend on each other
let sharedData;
it('test 1', () => { sharedData = create(); });
it('test 2', () => { use(sharedData); }); // Depends on test 1
```

### 4. Use Test IDs for Stable Selectors

```typescript
// Component
<button data-testid="submit-button">Submit</button>

// Test
const button = screen.getByTestId('submit-button');
```

### 5. Mock External Dependencies

```typescript
// Mock API calls
jest.mock('../../services/ExternalAPI', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'mocked' })
}));
```

### 6. Test Error Cases

Always test error scenarios:

```typescript
it('should handle API errors gracefully', async () => {
  mockAPI.fetchData.mockRejectedValue(new Error('Network error'));

  const result = await service.getData();

  expect(result.error).toBeDefined();
});
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

**Workflow:** `.github/workflows/test.yml`

```yaml
on:
  push:
    branches: [ main, develop, 'claude/**' ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
```

### Pre-commit Hooks

Set up pre-commit hooks to run tests before commits:

```bash
# Install husky
npm install --save-dev husky

# Create pre-commit hook
npx husky add .husky/pre-commit "npm run test:components"
```

---

## Troubleshooting

### Component Tests

**Issue:** Tests failing with "document is not defined"

```bash
# Solution: Ensure vitest.config.ts has jsdom environment
export default defineConfig({
  test: {
    environment: 'jsdom',
  }
});
```

**Issue:** React hooks errors in tests

```typescript
// Solution: Wrap component in proper context
import { QueryClientProvider } from '@tanstack/react-query';

render(
  <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
);
```

### E2E Tests

**Issue:** Timeouts waiting for elements

```typescript
// Solution: Increase timeout for slow operations
await expect(page.locator('text=Loading')).toBeVisible({ timeout: 10000 });
```

**Issue:** Flaky tests due to animations

```typescript
// Solution: Disable animations in test mode
await page.addStyleTag({ content: '* { animation-duration: 0s !important; }' });
```

### Integration Tests

**Issue:** Database connection errors

```bash
# Solution: Ensure test database is running
docker-compose up -d test-db

# Or use in-memory database for tests
export TEST_DATABASE_URL=sqlite::memory:
```

**Issue:** Port conflicts

```bash
# Solution: Use random ports for tests
const testPort = Math.floor(Math.random() * 10000) + 30000;
```

---

## Performance Testing

### Load Testing with k6

```javascript
// test/load/orders.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  let res = http.get('http://localhost:5000/api/orders');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

Run load tests:

```bash
k6 run test/load/orders.js
```

---

## Security Testing

### SQL Injection Tests

```typescript
it('should prevent SQL injection', async () => {
  const maliciousInput = "'; DROP TABLE patients; --";

  const response = await request(app)
    .get(`/api/patients?search=${encodeURIComponent(maliciousInput)}`);

  expect(response.status).toBe(200);
  // Should return empty results, not execute SQL
});
```

### XSS Prevention Tests

```typescript
it('should sanitize HTML in user input', async () => {
  const xssAttempt = '<script>alert("XSS")</script>';

  const response = await request(app)
    .post('/api/patients')
    .send({ firstName: xssAttempt });

  if (response.status === 201) {
    expect(response.body.firstName).not.toContain('<script>');
  }
});
```

---

## Continuous Improvement

### Adding New Tests

When adding new features:

1. **Write tests first** (TDD approach)
2. **Cover happy path** - Normal usage scenarios
3. **Cover edge cases** - Boundary conditions
4. **Cover error cases** - Failure scenarios
5. **Add integration tests** - API endpoints
6. **Add E2E tests** - Critical user workflows

### Maintaining Tests

- **Review test failures** - Don't ignore flaky tests
- **Update tests** - When requirements change
- **Refactor tests** - Remove duplication
- **Monitor coverage** - Aim for >80% coverage
- **Performance** - Keep tests fast (<10s for unit tests)

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Getting Help

- Check this documentation first
- Review existing test examples in `/test` directory
- Ask in team chat for testing questions
- Open GitHub issue for test infrastructure problems

---

**Last Updated:** November 2024
**Test Coverage:** ~450+ tests
**Status:** ✅ Active & Growing
