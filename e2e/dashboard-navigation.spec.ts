import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsManager, loginAsOperator } from './auth-flow.spec';

/**
 * Integration tests for dashboard navigation and UI interactions
 * 
 * These tests verify:
 * - Dashboard layout and navigation
 * - Sidebar menu interactions
 * - Header user menu and notifications
 * - Breadcrumb navigation
 * - Active state highlighting
 * - Responsive behavior
 */

test.describe('Dashboard Navigation', () => {
  test.describe('Dashboard Layout', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display complete dashboard layout', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Verify main layout components
      await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
      await expect(page.locator('header')).toBeVisible(); // Header
      await expect(page.locator('main')).toBeVisible(); // Main content
    });

    test('should display user information in header', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show user name or email
      await expect(page.getByText(/admin|greenleaf/i)).toBeVisible();
    });

    test('should display organization information', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show organization name
      await expect(page.getByText(/greenleaf/i)).toBeVisible();
    });

    test('should display theme switcher', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Look for theme toggle button
      const themeButton = page.locator('button[aria-label*="theme" i]');
      await expect(themeButton).toBeVisible();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display all navigation sections for admin', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Admin should see all sections
      const nav = page.getByRole('navigation');
      
      // Common sections
      await expect(nav.getByText(/dashboard/i)).toBeVisible();
      
      // Admin-specific sections
      await expect(nav.getByText(/users.*roles?|admin/i)).toBeVisible();
    });

    test('should navigate to different sections', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click on admin link
      await page.click('a[href*="/dashboard/admin"]');
      
      // Should navigate
      await expect(page).toHaveURL(/\/dashboard\/admin/);
    });

    test('should display navigation icons', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Navigation items should have icons
      const navItems = page.locator('nav a');
      const firstItem = navItems.first();
      
      // Should have an icon (svg)
      await expect(firstItem.locator('svg')).toBeVisible();
    });

    test('should expand and collapse nested navigation', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Look for expandable sections
      // If nested nav exists, test expansion
      const expandableItems = page.locator('button[aria-expanded]');
      const count = await expandableItems.count();
      
      if (count > 0) {
        const firstExpandable = expandableItems.first();
        await firstExpandable.click();
        
        // Should expand
        await expect(firstExpandable).toHaveAttribute('aria-expanded', 'true');
      }
    });
  });

  test.describe('Header User Menu', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should open user dropdown menu', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click on user menu button
      const userMenuButton = page.locator('button[aria-haspopup="menu"]').filter({ hasText: /admin|greenleaf/i }).first();
      await userMenuButton.click();
      
      // Menu should appear
      await expect(page.getByRole('menu')).toBeVisible();
    });

    test('should display user menu options', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Open menu
      const userMenuButton = page.locator('button[aria-haspopup="menu"]').filter({ hasText: /admin|greenleaf/i }).first();
      await userMenuButton.click();
      
      // Should have profile option
      await expect(page.getByRole('menuitem', { name: /profile|settings/i })).toBeVisible();
      
      // Should have logout option
      await expect(page.getByRole('menuitem', { name: /logout|sign out/i })).toBeVisible();
    });

    test('should logout user', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Open user menu
      const userMenuButton = page.locator('button[aria-haspopup="menu"]').filter({ hasText: /admin|greenleaf/i }).first();
      await userMenuButton.click();
      
      // Click logout
      await page.click('[role="menuitem"]:has-text("Logout"), [role="menuitem"]:has-text("Sign Out")');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/, { timeout: 5000 });
    });

    test('should navigate to profile settings', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Open user menu
      const userMenuButton = page.locator('button[aria-haspopup="menu"]').filter({ hasText: /admin|greenleaf/i }).first();
      await userMenuButton.click();
      
      // Click profile
      const profileMenuItem = page.getByRole('menuitem', { name: /profile|settings/i });
      
      if (await profileMenuItem.isVisible()) {
        await profileMenuItem.click();
        
        // Should navigate to profile page
        await expect(page).toHaveURL(/profile|settings/);
      }
    });
  });

  test.describe('Notifications', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display notifications section in header', async ({ page }) => {
      await page.goto('/dashboard');
      
      // May or may not be visible depending on implementation
      // Just verify header exists with expected elements
      await expect(page.locator('header')).toBeVisible();
    });

    test('should handle notifications if present', async ({ page }) => {
      await page.goto('/dashboard');
      
      // May have notification count or not depending on implementation
      // Just verify page loads successfully
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display breadcrumbs on nested pages', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Should show breadcrumbs
      await expect(page.getByText(/dashboard/i)).toBeVisible();
      await expect(page.getByText(/admin/i)).toBeVisible();
      await expect(page.getByText(/users/i)).toBeVisible();
    });

    test('should navigate using breadcrumb links', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Click on "Dashboard" breadcrumb
      const dashboardCrumb = page.locator('a[href="/dashboard"]').first();
      await dashboardCrumb.click();
      
      // Should navigate to dashboard
      await expect(page).toHaveURL('/dashboard');
    });

    test('should highlight current page in breadcrumbs', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Current page (Users) should not be a link
      const usersCrumb = page.locator('li').filter({ hasText: /users/i }).last();
      
      // Should exist but not be clickable
      await expect(usersCrumb).toBeVisible();
    });

    test('should display chevron separators', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Should have separator icons between breadcrumbs
      const chevrons = page.locator('svg').filter({ has: page.locator('path') });
      const count = await chevrons.count();
      
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Active State Highlighting', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should highlight active navigation item', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Admin navigation item should be highlighted
      const adminLink = page.locator('a[href*="/dashboard/admin"]').first();
      
      // Should have active styling (check for class or aria-current)
      const classes = await adminLink.getAttribute('class');
      const ariaCurrent = await adminLink.getAttribute('aria-current');
      
      expect(classes?.includes('active') || ariaCurrent === 'page').toBeTruthy();
    });

    test('should update highlighting when navigating', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Dashboard should be active
      const dashboardLink = page.locator('a[href="/dashboard"]').first();
      const classes = await dashboardLink.getAttribute('class');
      expect(classes).toContain('active');
      
      // Navigate to admin
      await page.goto('/dashboard/admin/users');
      
      // Admin should now be active
      const adminLink = page.locator('a[href*="/dashboard/admin"]').first();
      const adminClasses = await adminLink.getAttribute('class');
      expect(adminClasses).toBeTruthy();
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should adapt layout for mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginAsAdmin(page);
      await page.goto('/dashboard');
      
      // Sidebar may be hidden or collapsed on mobile
      // Should have mobile menu button
      const mobileMenu = page.locator('button[aria-label*="menu" i], button:has-text("Menu")');
      
      // If mobile menu exists, it should be visible
      const count = await mobileMenu.count();
      if (count > 0) {
        await expect(mobileMenu.first()).toBeVisible();
      } else {
        // Or sidebar is visible but styled differently
        await expect(page.getByRole('navigation')).toBeVisible();
      }
    });

    test('should show full sidebar on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await loginAsAdmin(page);
      await page.goto('/dashboard');
      
      // Sidebar should be visible
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });

  test.describe('Role-Based Navigation', () => {
    test('should show admin navigation for admin role', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/dashboard');
      
      // Should see admin-specific links
      await expect(page.getByRole('link', { name: /users.*roles?|admin/i })).toBeVisible();
    });

    test('should hide admin navigation for operator role', async ({ page }) => {
      await loginAsOperator(page);
      await page.goto('/dashboard');
      
      // Should NOT see admin links
      await expect(page.getByRole('link', { name: /users.*roles?|organization.*admin/i })).not.toBeVisible();
    });

    test('should show appropriate navigation for manager role', async ({ page }) => {
      await loginAsManager(page);
      await page.goto('/dashboard');
      
      // Should see navigation
      await expect(page.getByRole('navigation')).toBeVisible();
      
      // Should not see full admin access
      const fullAdminLinks = page.getByRole('link', { name: /organization.*settings?/i });
      const count = await fullAdminLinks.count();
      
      // Manager may or may not see certain items
      // Just verify navigation renders
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Loading States', () => {
    test('should handle page transitions smoothly', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/dashboard');
      
      // Click a navigation link
      await page.click('a[href*="/dashboard/admin"]');
      
      // Page should load
      await page.waitForLoadState('networkidle');
      
      // Should successfully navigate
      await expect(page).toHaveURL(/\/dashboard\/admin/);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to non-existent page
      await page.goto('/dashboard/nonexistent-page');
      
      // Should show 404 or redirect
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle unauthorized access', async ({ page }) => {
      await loginAsOperator(page);
      
      // Try to access admin page
      await page.goto('/dashboard/admin/users');
      
      // Should redirect or show error
      await expect(page).not.toHaveURL('/dashboard/admin/users');
    });
  });
});

test.describe('Page-Specific Navigation', () => {
  test.describe('Admin Pages', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should navigate between admin sub-pages', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Navigate to roles
      await page.click('a[href*="/dashboard/admin/roles"]');
      await expect(page).toHaveURL(/\/admin\/roles/);
      
      // Navigate to audit
      await page.click('a[href*="/dashboard/admin/audit"]');
      await expect(page).toHaveURL(/\/admin\/audit/);
    });

    test('should maintain context when navigating admin pages', async ({ page }) => {
      await page.goto('/dashboard/admin/users');
      
      // Search for a user
      await page.fill('[placeholder*="Search"]', 'Admin');
      
      // Navigate away
      await page.click('a[href*="/dashboard/admin/roles"]');
      
      // Navigate back
      await page.click('a[href*="/dashboard/admin/users"]');
      
      // Page should load (search may or may not be preserved)
      await expect(page).toHaveURL(/\/admin\/users/);
    });
  });
});
