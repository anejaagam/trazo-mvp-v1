# Integration Tests (E2E)

This directory contains end-to-end integration tests using Playwright.

## Setup

1. **Install dependencies** (already done):
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Start your development server**:
   ```bash
   npm run dev
   ```

3. **Set up test database with seed data**:
   ```bash
   npm run seed:dev
   ```

4. **Create test users** (see SEED_SETUP.md):
   - Sign up with seed data emails or use Supabase dashboard
   - Required test users:
     - `admin@greenleaf.example` (org_admin role)
     - `manager@greenleaf.example` (site_manager role)
     - `grower@greenleaf.example` (head_grower role)

## Running Tests

### Run all integration tests:
```bash
npx playwright test
```

### Run specific test file:
```bash
npx playwright test e2e/admin-user-management.spec.ts
```

### Run tests in UI mode (interactive):
```bash
npx playwright test --ui
```

### Run tests in headed mode (see browser):
```bash
npx playwright test --headed
```

### Debug a specific test:
```bash
npx playwright test --debug e2e/admin-user-management.spec.ts
```

### View test report:
```bash
npx playwright show-report
```

## Test Structure

The integration tests are organized by feature area:

1. **auth-flow.spec.ts** - Authentication flows (login, signup, password reset)
2. **admin-user-management.spec.ts** - Admin user management features
3. **permission-checks.spec.ts** - Role-based permission validation
4. **multi-region.spec.ts** - Multi-region data routing and isolation
5. **dashboard-navigation.spec.ts** - Dashboard UI navigation and interactions

## Writing New Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup - navigate to page, login, etc.
    await page.goto('/auth/login');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.fill('[name="email"]', 'test@example.com');
    
    // Act
    await page.click('button[type="submit"]');
    
    // Assert
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for network requests** when testing API interactions
3. **Clean up test data** after tests complete
4. **Use page object pattern** for complex pages
5. **Test realistic user flows** end-to-end
6. **Avoid brittle selectors** (prefer semantic locators)

## Environment Variables

Integration tests use the same environment variables as the application.
Ensure your `.env.local` file is configured with test Supabase credentials.

**Warning**: Never run integration tests against production database!
