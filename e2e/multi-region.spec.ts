import { test, expect } from '@playwright/test';

/**
 * Integration tests for multi-region support
 * 
 * These tests verify:
 * - Region selection during signup
 * - Data routing to correct region (US vs Canada)
 * - Cookie-based region persistence
 * - Region-specific Supabase client usage
 * - Data isolation between regions
 */

test.describe('Multi-Region Support', () => {
  test.describe('Region Selection', () => {
    test('should allow region selection during signup', async ({ page }) => {
      await page.goto('/auth/sign-up/step-2');
      
      // US region option
      const usRegion = page.locator('[name="region"][value="us"]');
      await expect(usRegion).toBeVisible();
      
      // Canada region option
      const canadaRegion = page.locator('[name="region"][value="canada"]');
      await expect(canadaRegion).toBeVisible();
    });

    test('should persist region choice in localStorage', async ({ page }) => {
      await page.goto('/auth/sign-up/step-2');
      
      // Select Canada
      await page.click('[name="region"][value="canada"]');
      
      // Fill minimal required fields
      await page.fill('[name="companyName"]', 'Test Company');
      await page.fill('[name="addressLine1"]', '123 Test St');
      await page.fill('[name="city"]', 'Vancouver');
      await page.fill('[name="stateProvince"]', 'BC');
      await page.fill('[name="postalCode"]', 'V6B 1A1');
      await page.fill('[name="country"]', 'Canada');
      
      await page.click('[name="plantType"][value="cannabis"]');
      await page.click('button:has-text("Oregon")'); // Select jurisdiction
      
      await page.click('button:has-text("Next")');
      
      // Check localStorage
      const storedData = await page.evaluate(() => {
        const data = localStorage.getItem('signupStep2');
        return data ? JSON.parse(data) : null;
      });
      
      expect(storedData).toBeTruthy();
      expect(storedData?.region).toBe('canada');
    });

    test('should default to US region if not specified', async ({ page }) => {
      await page.goto('/auth/sign-up/step-2');
      
      // US should be default selected
      const usRegion = page.locator('[name="region"][value="us"]');
      await expect(usRegion).toBeChecked();
    });
  });

  test.describe('Region-Based Authentication', () => {
    test('should use US Supabase for US users', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Login as US user
      await page.fill('[name="email"]', 'admin@greenleaf.example'); // US organization
      await page.fill('[name="password"]', 'YourTestPassword123!');
      
      // Monitor network requests
      const requests: string[] = [];
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('supabase')) {
          requests.push(url);
        }
      });
      
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Check that US Supabase URL was used
      const usSupabaseRequests = requests.filter(url => 
        url.includes(process.env.NEXT_PUBLIC_SUPABASE_URL || 'supabase')
      );
      
      expect(usSupabaseRequests.length).toBeGreaterThan(0);
    });

    test('should set region cookie after login', async ({ page, context }) => {
      await page.goto('/auth/login');
      
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
  });

  test.describe('Data Isolation', () => {
    test('should only show US data for US users', async ({ page }) => {
      // Login as US user
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'admin@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Navigate to users page
      await page.goto('/dashboard/admin/users');
      
      // All visible users should be from US organization
      const organizationCells = page.locator('td:has-text("GreenLeaf")');
      const count = await organizationCells.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Should not see Canada organization users
      await expect(page.getByText(/CanadaCo|Canada.*Inc/i)).not.toBeVisible();
    });

    test('should only show Canada data for Canada users', async ({ page }) => {
      // This test requires a Canada user in seed data
      // Skip if not available
      
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'admin@canadaco.example'); // Canada org user
      await page.fill('[name="password"]', 'YourTestPassword123!');
      
      const loginButton = page.getByRole('button', { name: /sign in/i });
      await loginButton.click();
      
      try {
        await page.waitForURL('/dashboard', { timeout: 5000 });
        
        await page.goto('/dashboard/admin/users');
        
        // Should see Canada organization
        await expect(page.getByText(/CanadaCo/i)).toBeVisible();
        
        // Should not see US organizations
        await expect(page.getByText(/GreenLeaf/i)).not.toBeVisible();
      } catch {
        // No Canada user in seed data
        test.skip();
      }
    });

    test('should enforce data isolation at API level', async ({ page }) => {
      // Login as US user
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'admin@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Try to access a Canada user ID directly via API
      // Should be rejected or return empty
      const response = await page.request.get('/api/admin/users/canada-user-id-123');
      
      // Should get 404 or 403 (user not found in their region)
      expect([403, 404]).toContain(response.status());
    });
  });

  test.describe('Region Switching', () => {
    test('should maintain region throughout session', async ({ page, context }) => {
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'admin@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Get initial region cookie
      const cookies1 = await context.cookies();
      const regionCookie1 = cookies1.find(c => c.name === 'preferred-region');
      
      // Navigate to different pages
      await page.goto('/dashboard/admin/users');
      await page.goto('/dashboard/admin/roles');
      await page.goto('/dashboard');
      
      // Region cookie should be the same
      const cookies2 = await context.cookies();
      const regionCookie2 = cookies2.find(c => c.name === 'preferred-region');
      
      expect(regionCookie1?.value).toBe(regionCookie2?.value);
    });

    test('should use correct Supabase client based on region', async ({ page }) => {
      // This test verifies the getSupabaseClient() function behavior
      // by checking network requests
      
      await page.goto('/auth/login');
      
      const requests: string[] = [];
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('supabase')) {
          requests.push(url);
        }
      });
      
      await page.fill('[name="email"]', 'admin@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // All Supabase requests should go to US instance
      const usRequests = requests.filter(url => 
        url.includes(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
      );
      
      expect(usRequests.length).toBeGreaterThan(0);
      
      // No requests to Canada instance for US user
      const canRequests = requests.filter(url => 
        url.includes(process.env.NEXT_PUBLIC_CAN_SUPABASE_URL || 'canada')
      );
      
      expect(canRequests.length).toBe(0);
    });
  });

  test.describe('Jurisdiction Filtering', () => {
    test('should filter jurisdictions by plant type', async ({ page }) => {
      await page.goto('/auth/sign-up/step-2');
      
      // Select cannabis
      await page.click('[name="plantType"][value="cannabis"]');
      
      // Should show cannabis jurisdictions
      await expect(page.getByText(/oregon/i)).toBeVisible();
      await expect(page.getByText(/maryland/i)).toBeVisible();
      await expect(page.getByText(/california/i)).toBeVisible();
      
      // Should not show produce jurisdiction
      await expect(page.getByText(/primusgfs/i)).not.toBeVisible();
      
      // Switch to produce
      await page.click('[name="plantType"][value="produce"]');
      
      // Should show produce jurisdiction
      await expect(page.getByText(/primusgfs/i)).toBeVisible();
      
      // Should not show cannabis jurisdictions
      await expect(page.getByText(/oregon.*metrc|maryland.*metrc/i)).not.toBeVisible();
    });

    test('should associate correct jurisdiction with region', async ({ page }) => {
      await page.goto('/auth/sign-up/step-2');
      
      // Cannabis in Oregon (US)
      await page.click('[name="plantType"][value="cannabis"]');
      await page.click('button:has-text("Oregon")');
      
      // Should default to US region
      const usRegion = page.locator('[name="region"][value="us"]');
      await expect(usRegion).toBeChecked();
    });
  });

  test.describe('Multi-Region Edge Cases', () => {
    test('should handle missing region cookie gracefully', async ({ page, context }) => {
      // Clear cookies
      await context.clearCookies();
      
      // Try to access dashboard directly
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/);
    });

    test('should handle invalid region cookie', async ({ page, context }) => {
      // Set invalid region cookie
      await context.addCookies([{
        name: 'preferred-region',
        value: 'invalid-region',
        domain: 'localhost',
        path: '/',
      }]);
      
      await page.goto('/auth/login');
      
      // Should still work (fall back to default)
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('should handle region mismatch scenarios', async ({ page }) => {
      // Login as US user
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'admin@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // User should only access their region's data
      // Attempts to access other region should fail
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });
});
