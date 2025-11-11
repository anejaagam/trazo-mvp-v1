import { test, expect, Page } from '@playwright/test';

/**
 * Integration tests for authentication flows
 * 
 * These tests verify:
 * - Login flow with US and Canada regions
 * - Signup flow (multi-step form)
 * - Password reset flow
 * - Email verification
 * - Multi-region cookie persistence
 */

test.describe('Authentication Flows', () => {
  test.describe('Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
    });

    test('should display login form with region selection', async ({ page }) => {
      // Verify form elements
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
      
      // Verify region info displayed
      await expect(page.getByText(/data region/i)).toBeVisible();
    });

    test('should login successfully with valid US credentials', async ({ page }) => {
      // Fill in credentials
      await page.fill('[name="email"]', 'admin@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Verify dashboard loads
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByText(/dashboard/i)).toBeVisible();
    });

    test('should show error message for invalid credentials', async ({ page }) => {
      await page.fill('[name="email"]', 'invalid@example.com');
      await page.fill('[name="password"]', 'wrongpassword');
      
      await page.click('button[type="submit"]');
      
      // Should show error toast or message
      await expect(page.getByText(/invalid.*credentials|error/i)).toBeVisible({ timeout: 5000 });
    });

    test('should persist region selection in cookies', async ({ page, context }) => {
      // Login sets region cookie
      await page.fill('[name="email"]', 'admin@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Check cookies
      const cookies = await context.cookies();
      const regionCookie = cookies.find(c => c.name === 'preferred-region');
      
      expect(regionCookie).toBeDefined();
      expect(['us', 'canada']).toContain(regionCookie?.value);
    });

    test('should handle loading state during login', async ({ page }) => {
      await page.fill('[name="email"]', 'admin@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      
      // Click submit
      const submitButton = page.getByRole('button', { name: /sign in/i });
      await submitButton.click();
      
      // Button should be disabled during loading
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Signup Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/sign-up');
    });

    test('should complete full signup flow with all steps', async ({ page }) => {
      // Step 1: Email and password
      await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.fill('[name="confirmPassword"]', 'TestPassword123!');
      
      await page.click('button[type="submit"]');
      
      // Step 2: Company details
      await page.waitForURL(/step-2/, { timeout: 5000 });
      
      await page.fill('[name="companyName"]', 'Test Company');
      await page.fill('[name="addressLine1"]', '123 Test St');
      await page.fill('[name="city"]', 'Portland');
      await page.fill('[name="stateProvince"]', 'OR');
      await page.fill('[name="postalCode"]', '97201');
      await page.fill('[name="country"]', 'USA');
      
      // Select plant type
      await page.click('[name="plantType"][value="cannabis"]');
      
      // Select jurisdiction
      await page.click('button:has-text("Oregon")');
      
      // Select region
      await page.click('[name="region"][value="us"]');
      
      await page.click('button:has-text("Next")');
      
      // Step 3: Emergency contact
      await page.waitForURL(/step-3/, { timeout: 5000 });
      
      await page.fill('[name="emergencyContactPerson"]', 'Jane Doe');
      await page.fill('[name="emergencyContactEmail"]', 'jane@example.com');
      await page.fill('[name="emergencyContactPhone"]', '555-0123');
      
      await page.click('button:has-text("Next")');
      
      // Step 4: Farm details
      await page.waitForURL(/step-4/, { timeout: 5000 });
      
      await page.fill('[name="numberOfContainers"]', '5');
      
      // Submit final step
      await page.click('button:has-text("Complete")');
      
      // Should navigate to success or verification page
      await expect(page).toHaveURL(/sign-up-success|verify-email/, { timeout: 10000 });
    });

    test('should validate required fields in step 2', async ({ page }) => {
      // Navigate to step 2 (assumes step 1 localStorage data exists)
      await page.goto('/auth/sign-up/step-2');
      
      // Try to submit without filling required fields
      await page.click('button:has-text("Next")');
      
      // Should show validation errors or prevent submission
      // Note: Exact validation behavior depends on implementation
      await expect(page).toHaveURL(/step-2/);
    });

    test('should show jurisdiction options based on plant type', async ({ page }) => {
      await page.goto('/auth/sign-up/step-2');
      
      // Select cannabis
      await page.click('[name="plantType"][value="cannabis"]');
      
      // Should show cannabis jurisdictions
      await expect(page.getByText(/oregon|maryland|california/i)).toBeVisible();
      
      // Select produce
      await page.click('[name="plantType"][value="produce"]');
      
      // Should show produce jurisdiction
      await expect(page.getByText(/primusgfs/i)).toBeVisible();
    });

    test('should allow navigation back through steps', async ({ page }) => {
      await page.goto('/auth/sign-up/step-3');
      
      // Click back button
      await page.click('button:has-text("Back")');
      
      // Should navigate to step 2
      await expect(page).toHaveURL(/step-2/);
    });
  });

  test.describe('Password Reset', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /reset/i })).toBeVisible();
    });

    test('should submit password reset request', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      await page.fill('[name="email"]', 'admin@greenleaf.example');
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.getByText(/check.*email|sent/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Email Verification', () => {
    test('should display email verification page', async ({ page }) => {
      await page.goto('/auth/verify-email');
      
      await expect(page.getByText(/verify.*email|check.*email/i)).toBeVisible();
    });
  });
});

/**
 * Helper function to login as a test user
 * Can be used in other test files for authenticated flows
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'admin@greenleaf.example');
  await page.fill('[name="password"]', 'YourTestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function loginAsManager(page: Page) {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'manager@greenleaf.example');
  await page.fill('[name="password"]', 'YourTestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function loginAsOperator(page: Page) {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'operator1@greenleaf.example');
  await page.fill('[name="password"]', 'YourTestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}
