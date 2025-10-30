# Testing Quick Reference Card

## 🚀 Quick Commands

### Run Tests
```bash
npm run check                    # TypeScript type check
npm run test:unit               # Unit tests only
npm run test:integration        # API integration tests
npm run test:components         # React component tests
npm run test:e2e                # E2E tests (Playwright)
npm run test:all                # Run everything
npm run test:ci                 # CI test suite (faster)
```

### Watch Mode (Development)
```bash
npm run test:watch              # Unit tests (auto-reload)
npm run test:components:watch   # Component tests (auto-reload)
npm run test:e2e:ui            # E2E tests (interactive UI)
```

### Coverage
```bash
npm run test:coverage           # Generate coverage report
open coverage/index.html        # View coverage in browser
```

---

## ✅ Before Pushing Code

```bash
# Quick check (5-10 seconds)
npm run check

# Full local validation (2-3 minutes)
npm run test:ci

# Full test suite including E2E (5-10 minutes)
npm run test:all
```

---

## 🛡️ Adding Validation to a Route

```typescript
import { validateBody } from '@/server/middleware/zodValidation';
import { insertOrderSchema } from '@shared/schema';

app.post('/api/orders', 
  isAuthenticated,
  validateBody(insertOrderSchema),  // ← Add this line
  async (req, res) => {
    // req.body is now validated!
  }
);
```

---

## 🧪 Writing a Unit Test

```typescript
// test/unit/myFunction.test.ts
import { describe, it, expect } from '@jest/globals';

describe('myFunction', () => {
  it('should return correct value', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

---

## 🔗 Writing an Integration Test

```typescript
// test/integration/myApi.test.ts
import request from 'supertest';

describe('My API', () => {
  it('POST /api/resource - creates resource', async () => {
    const response = await request(app)
      .post('/api/resource')
      .send({ data: 'test' });
    
    expect(response.status).toBe(201);
  });
});
```

---

## 🎨 Writing a Component Test

```typescript
// test/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## 🌐 Writing an E2E Test

```typescript
// test/e2e/myFlow.spec.ts
import { test, expect } from '@playwright/test';

test('user can complete flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button:has-text("Submit")');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

---

## 🔍 Debugging Tests

### Unit/Integration Tests
```bash
# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create order"

# Run in watch mode with coverage
npm run test:watch -- --coverage
```

### E2E Tests
```bash
# Run specific test file
npx playwright test test/e2e/myFlow.spec.ts

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in UI mode (interactive debugging)
npm run test:e2e:ui

# Run specific test by name
npx playwright test -g "user can complete flow"
```

---

## 📊 CI/CD Status

GitHub Actions runs automatically on every PR:

1. ✅ Lint & Type Check
2. ✅ Unit Tests
3. ✅ Integration Tests
4. ✅ Component Tests
5. ✅ E2E Tests
6. ✅ Security Audit
7. ✅ Build Verification

View results: https://github.com/newvantageco/ILS2.0/actions

---

## 🚨 Common Issues

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Test database connection failed"
```bash
# Verify DATABASE_URL is set
echo $TEST_DATABASE_URL

# Start test database
docker start ils-test-db

# Run migrations
npm run db:push
```

### "E2E tests timeout"
```bash
# Increase timeout in playwright.config.ts
timeout: 60000  // milliseconds
```

### "Validation middleware not working"
```typescript
// Make sure schema is imported correctly
import { mySchema } from '@shared/schema';

// Not from drizzle-zod
import { createInsertSchema } from 'drizzle-zod';
```

---

## 📚 Documentation

- **Full Guide**: `TESTING_IMPLEMENTATION_SUMMARY.md`
- **Examples**: `server/routes/EXAMPLE_VALIDATED_ROUTES.ts`
- **Fixtures**: `test/fixtures/`

---

## 🎯 Testing Checklist

When writing a new feature:

- [ ] Write unit tests for business logic
- [ ] Add integration test for API endpoint
- [ ] Add component test for UI
- [ ] Add E2E test for critical flow
- [ ] Add Zod validation to route
- [ ] Verify tests pass locally
- [ ] Verify CI passes on PR

---

## 💡 Pro Tips

1. **Test the behavior, not the implementation**
2. **Write tests before fixing bugs** (TDD)
3. **Keep tests fast** - Mock external dependencies
4. **Use descriptive test names** - They're documentation
5. **Run tests in watch mode** while developing
6. **Check coverage regularly** - Aim for 80%+
7. **E2E tests are expensive** - Focus on critical paths
8. **Validate at boundaries** - API inputs/outputs, DB queries

---

**Questions?** See `TESTING_IMPLEMENTATION_SUMMARY.md` for detailed guide.
