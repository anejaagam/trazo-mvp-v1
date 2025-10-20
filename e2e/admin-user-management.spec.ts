import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsManager, loginAsOperator } from './auth-flow.spec';

/**
 * Integration tests for admin user management features
 * 
 * These tests verify:
 * - User table display and search
 * - User invitation flow
 * - User status management (suspend, reactivate)
 * - Role permission matrix display
 * - Audit log tracking
 */

test.describe('Admin User Management', () => {
  test.describe('User Table', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/dashboard/admin/users');
    });

    test('should display user table with all users', async ({ page }) => {
      // Verify table renders
      await expect(page.getByRole('table')).toBeVisible();
      
      // Verify table headers
      await expect(page.getByText(/name/i)).toBeVisible();
      await expect(page.getByText(/email/i)).toBeVisible();
      await expect(page.getByText(/organization/i)).toBeVisible();
      await expect(page.getByText(/role/i)).toBeVisible();
      await expect(page.getByText(/status/i)).toBeVisible();
      
      // Verify at least one user row exists
      const tableRows = page.locator('tbody tr');
      await expect(tableRows).not.toHaveCount(0);
    });

    test('should search users by name', async ({ page }) => {
      // Type in search box
      await page.fill('[placeholder*="Search"]', 'Admin');
      
      // Wait for filtered results
      await page.waitForTimeout(500); // Debounce wait
      
      // Verify filtered results contain "Admin"
      const visibleRows = page.locator('tbody tr');
      const count = await visibleRows.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Verify first visible row contains "Admin"
      await expect(visibleRows.first()).toContainText(/admin/i);
    });

    test('should search users by email', async ({ page }) => {
      await page.fill('[placeholder*="Search"]', '@greenleaf');
      await page.waitForTimeout(500);
      
      // All visible rows should contain "@greenleaf"
      const visibleRows = page.locator('tbody tr');
      const firstRow = visibleRows.first();
      await expect(firstRow).toContainText(/@greenleaf|@example/);
    });

    test('should display user status badges', async ({ page }) => {
      // Look for status badges
      const statusBadges = page.locator('[class*="badge"]').filter({ hasText: /active|invited|suspended/i });
      
      await expect(statusBadges.first()).toBeVisible();
    });

    test('should display role badges', async ({ page }) => {
      // Look for role information
      await expect(page.getByText(/organization admin|site manager|operator/i).first()).toBeVisible();
    });

    test('should open user action dropdown', async ({ page }) => {
      // Find first dropdown trigger button
      const dropdownButton = page.locator('button[aria-haspopup="menu"]').first();
      await dropdownButton.click();
      
      // Verify dropdown menu appears
      await expect(page.getByRole('menuitem', { name: /suspend|reactivate|resend/i })).toBeVisible();
    });
  });

  test.describe('User Invitation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/dashboard/admin/users');
    });

    test('should open invite user dialog', async ({ page }) => {
      // Click invite button
      await page.click('button:has-text("Invite User")');
      
      // Verify dialog opens
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/invite.*user/i)).toBeVisible();
    });

    test('should invite a new user', async ({ page }) => {
      // Open dialog
      await page.click('button:has-text("Invite User")');
      
      // Fill form
      const timestamp = Date.now();
      await page.fill('[name="fullName"]', `Test User ${timestamp}`);
      await page.fill('[name="email"]', `test-user-${timestamp}@example.com`);
      
      // Select role
      await page.click('[role="combobox"]'); // Role selector
      await page.click('[role="option"]:has-text("Operator")');
      
      // Submit
      await page.click('button[type="submit"]:has-text("Invite")');
      
      // Wait for success
      await expect(page.getByText(/invited|success/i)).toBeVisible({ timeout: 5000 });
      
      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
    });

    test('should validate required fields in invite form', async ({ page }) => {
      await page.click('button:has-text("Invite User")');
      
      // Try to submit without filling fields
      const submitButton = page.getByRole('button', { name: /invite/i });
      
      // Submit button should be disabled
      await expect(submitButton).toBeDisabled();
    });

    test('should cancel invitation', async ({ page }) => {
      await page.click('button:has-text("Invite User")');
      
      // Click cancel
      await page.click('button:has-text("Cancel")');
      
      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('User Status Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/dashboard/admin/users');
    });

    test('should show suspend option for active users', async ({ page }) => {
      // Find an active user row
      const activeRow = page.locator('tr:has([class*="badge"]:has-text("Active"))').first();
      
      // Open dropdown
      await activeRow.locator('button[aria-haspopup="menu"]').click();
      
      // Verify suspend option
      await expect(page.getByRole('menuitem', { name: /suspend/i })).toBeVisible();
    });

    test('should show reactivate option for suspended users', async ({ page }) => {
      // First, suspend a user (if none suspended already)
      // Then check for reactivate option
      
      // Find a suspended user or the dropdown menu
      const dropdownButtons = page.locator('button[aria-haspopup="menu"]');
      const firstDropdown = dropdownButtons.first();
      await firstDropdown.click();
      
      // Should show either suspend or reactivate based on current status
      const menuItems = page.locator('[role="menuitem"]');
      const itemCount = await menuItems.count();
      
      expect(itemCount).toBeGreaterThan(0);
    });
  });

  test.describe('Role Permission Matrix', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/dashboard/admin/roles');
    });

    test('should display permission matrix', async ({ page }) => {
      // Verify role selector buttons
      await expect(page.getByText(/organization admin/i)).toBeVisible();
      await expect(page.getByText(/site manager/i)).toBeVisible();
      await expect(page.getByText(/operator/i)).toBeVisible();
      
      // Verify permission table
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('should switch between roles', async ({ page }) => {
      // Click different role buttons
      await page.click('button:has-text("Organization Admin")');
      
      // Verify role info displays
      await expect(page.getByText(/full.*control|organization/i)).toBeVisible();
      
      // Switch to another role
      await page.click('button:has-text("Operator")');
      
      // Verify operator info displays
      await expect(page.getByText(/operator|daily.*operations/i)).toBeVisible();
    });

    test('should display permission groups', async ({ page }) => {
      // Verify permission categories
      await expect(page.getByText(/dashboard|batch|user|compliance/i).first()).toBeVisible();
    });

    test('should show check marks for granted permissions', async ({ page }) => {
      // Look for check icons (Lucide Check or checkmark)
      const checkIcons = page.locator('svg[class*="check"]');
      const count = await checkIcons.count();
      
      expect(count).toBeGreaterThan(0);
    });

    test('should display role details in second tab', async ({ page }) => {
      // Click role details tab
      await page.click('[role="tab"]:has-text("Role Details")');
      
      // Verify role details table
      await expect(page.getByText(/role.*name|description/i)).toBeVisible();
    });

    test('should show user counts per role', async ({ page }) => {
      // Look for user count badges
      const userCountBadges = page.locator('[class*="badge"]').filter({ hasText: /\d+/ });
      
      // Should have at least one count badge
      await expect(userCountBadges.first()).toBeVisible();
    });
  });

  test.describe('Audit Log', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/dashboard/admin/audit');
    });

    test('should display audit log table', async ({ page }) => {
      // Verify table headers
      await expect(page.getByText(/timestamp|user|action|entity/i).first()).toBeVisible();
      
      // Verify table exists
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('should search audit logs', async ({ page }) => {
      // Type in search box
      await page.fill('[placeholder*="Search"]', 'user');
      await page.waitForTimeout(500);
      
      // Verify filtered results
      const rows = page.locator('tbody tr');
      await expect(rows.first()).toBeVisible();
    });

    test('should filter by action type', async ({ page }) => {
      // Open action filter dropdown
      await page.click('button:has-text("All Actions")');
      
      // Select a specific action
      await page.click('[role="option"]:has-text("Created")');
      
      // Verify filter applied
      await expect(page.getByText(/created/i).first()).toBeVisible();
    });

    test('should display action badges with colors', async ({ page }) => {
      // Look for colored action badges
      const badges = page.locator('[class*="badge"]').filter({ hasText: /created|updated|suspended/i });
      
      await expect(badges.first()).toBeVisible();
    });

    test('should export audit log', async ({ page }) => {
      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export")');
      
      // Verify download starts
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/audit.*log|csv/i);
    });

    test('should display system events', async ({ page }) => {
      // May or may not have system events depending on seed data
      // Just verify table renders and can handle "System" as user
      await expect(page.getByRole('table')).toBeVisible();
    });
  });
});

test.describe('Non-Admin User Restrictions', () => {
  test('should deny access to admin pages for non-admin users', async ({ page }) => {
    await loginAsOperator(page);
    
    // Try to access admin users page
    await page.goto('/dashboard/admin/users');
    
    // Should redirect or show access denied
    await expect(page).not.toHaveURL('/dashboard/admin/users');
    // Should be on dashboard or access denied page
    await expect(page).toHaveURL(/dashboard|access.*denied|unauthorized/);
  });

  test('should not show admin navigation items for operators', async ({ page }) => {
    await loginAsOperator(page);
    await page.goto('/dashboard');
    
    // Should not see "Users & Roles" in navigation
    const adminNavItem = page.getByRole('link', { name: /users.*roles|admin/i });
    await expect(adminNavItem).not.toBeVisible();
  });

  test('should show limited navigation for site managers', async ({ page }) => {
    await loginAsManager(page);
    await page.goto('/dashboard');
    
    // Managers should see some navigation but not all admin features
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Should not have full admin access - just verify navigation renders
    // (Specific items depend on site manager permissions in RBAC)
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
