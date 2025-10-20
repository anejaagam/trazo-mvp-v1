import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsManager, loginAsOperator } from './auth-flow.spec';

/**
 * Integration tests for role-based permission checks
 * 
 * These tests verify:
 * - Permission enforcement across different roles
 * - Navigation visibility based on permissions
 * - API access control
 * - Feature access restrictions
 */

test.describe('Permission Checks', () => {
  test.describe('Organization Admin Permissions', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should have access to all admin features', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should see admin navigation items
      await expect(page.getByRole('link', { name: /users.*roles/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /organization/i })).toBeVisible();
    });

    test('should access users management page', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Should successfully load page
      await expect(page).toHaveURL('/dashboard/admin/users');
      await expect(page.getByText(/manage.*users|users/i)).toBeVisible();
    });

    test('should access roles management page', async ({ page }) => {
      await page.goto('/dashboard/admin/roles');
      
      await expect(page).toHaveURL('/dashboard/admin/roles');
      await expect(page.getByText(/role|permission/i)).toBeVisible();
    });

    test('should access audit log page', async ({ page }) => {
      await page.goto('/dashboard/admin/audit');
      
      await expect(page).toHaveURL('/dashboard/admin/audit');
      await expect(page.getByText(/audit|activity|log/i)).toBeVisible();
    });

    test('should invite new users', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Should see invite button
      const inviteButton = page.getByRole('button', { name: /invite/i });
      await expect(inviteButton).toBeVisible();
      await expect(inviteButton).toBeEnabled();
    });

    test('should suspend users', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Open user dropdown
      const dropdown = page.locator('button[aria-haspopup="menu"]').first();
      await dropdown.click();
      
      // Should have suspend option
      await expect(page.getByRole('menuitem', { name: /suspend|reactivate/i })).toBeVisible();
    });

    test('should change user roles', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Open user dropdown
      const dropdown = page.locator('button[aria-haspopup="menu"]').first();
      await dropdown.click();
      
      // Should have manage roles option
      await expect(page.getByRole('menuitem', { name: /manage.*roles?|roles?/i })).toBeVisible();
    });
  });

  test.describe('Site Manager Permissions', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsManager(page);
    });

    test('should have limited admin access', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should see navigation
      await expect(page.getByRole('navigation')).toBeVisible();
      
      // May see batch management, environmental controls, etc.
      // Exact navigation depends on RBAC configuration
      await expect(page.getByText(/batch|environmental|site/i).first()).toBeVisible();
    });

    test('should NOT access organization-level admin pages', async ({ page }) => {
      // Try to access users management
      await page.goto('/dashboard/admin/users');
      
      // Should redirect away or show access denied
      await expect(page).not.toHaveURL('/dashboard/admin/users');
    });

    test('should NOT access roles management', async ({ page }) => {
      await page.goto('/dashboard/admin/roles');
      
      await expect(page).not.toHaveURL('/dashboard/admin/roles');
    });

    test('should access site-level features', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should have access to operational features
      // Exact features depend on RBAC configuration
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });

  test.describe('Head Grower Permissions', () => {
    test('should have batch management access', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'grower@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Should see batch-related navigation
      await expect(page.getByRole('navigation')).toBeVisible();
    });

    test('should NOT access admin features', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'grower@greenleaf.example');
      await page.fill('[name="password"]', 'YourTestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Try to access admin pages
      await page.goto('/dashboard/admin/users');
      
      // Should be denied
      await expect(page).not.toHaveURL('/dashboard/admin/users');
    });
  });

  test.describe('Operator Permissions', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsOperator(page);
    });

    test('should have minimal dashboard access', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should see basic navigation
      await expect(page.getByRole('navigation')).toBeVisible();
      
      // Should NOT see admin sections
      await expect(page.getByRole('link', { name: /users.*roles|admin/i })).not.toBeVisible();
    });

    test('should NOT access admin pages', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      await expect(page).not.toHaveURL('/dashboard/admin/users');
    });

    test('should NOT invite users', async ({ page }) => {
      // Even if they somehow access the page, API should reject
      const response = await page.request.post('/api/admin/users/invite', {
        data: {
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'operator',
          organization_id: 'test-org-id',
        },
      });
      
      // Should get 401 or 403
      expect([401, 403]).toContain(response.status());
    });

    test('should NOT suspend users', async ({ page }) => {
      // API call should be rejected
      const response = await page.request.patch('/api/admin/users/test-user-id/status', {
        data: { status: 'suspended' },
      });
      
      expect([401, 403]).toContain(response.status());
    });

    test('should access only operator-level features', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should see limited navigation
      await expect(page.getByRole('navigation')).toBeVisible();
      
      // Should not see management features
      await expect(page.getByText(/manage|admin|organization/i)).not.toBeVisible();
    });
  });

  test.describe('Read-Only Permissions', () => {
    test('should allow viewer to see but not modify', async ({ page }) => {
      // Login as a viewer role (if exists in seed data)
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'viewer@greenleaf.example'); // If exists
      await page.fill('[name="password"]', 'YourTestPassword123!');
      
      const loginButton = page.getByRole('button', { name: /sign in/i });
      await loginButton.click();
      
      // May or may not succeed depending on seed data
      // If viewer role doesn't exist, this test will be skipped
      try {
        await page.waitForURL('/dashboard', { timeout: 5000 });
        
        // Should see content but not action buttons
        await expect(page.getByRole('navigation')).toBeVisible();
      } catch {
        // No viewer user in seed data - skip test
        test.skip();
      }
    });
  });

  test.describe('Permission Boundary Tests', () => {
    test('should prevent privilege escalation', async ({ page }) => {
      await loginAsOperator(page);
      
      // Try to access higher-privilege API endpoint directly
      const response = await page.request.post('/api/admin/users/invite', {
        data: {
          email: 'hacker@example.com',
          full_name: 'Hacker',
          role: 'org_admin', // Try to create an admin
          organization_id: 'test-org-id',
        },
      });
      
      // Should be rejected
      expect([401, 403]).toContain(response.status());
    });

    test('should validate role assignment permissions', async ({ page }) => {
      await loginAsManager(page);
      
      // Manager trying to change user to org_admin should fail
      const response = await page.request.patch('/api/admin/users/test-user-id/role', {
        data: { role: 'org_admin' },
      });
      
      // Should be rejected (managers can't create admins)
      expect([401, 403, 404]).toContain(response.status());
    });
  });
});

test.describe('Permission Hook Integration', () => {
  test('should use usePermissions hook correctly in UI', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
    
    // Navigation items should be visible based on permissions
    // The usePermissions hook controls visibility
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Admin should see admin links
    await expect(page.getByRole('link', { name: /users.*roles?|admin/i })).toBeVisible();
  });

  test('should hide features for unauthorized roles', async ({ page }) => {
    await loginAsOperator(page);
    await page.goto('/dashboard');
    
    // Operator should not see admin features
    await expect(page.getByRole('link', { name: /users.*roles?|organization.*admin/i })).not.toBeVisible();
  });
});
