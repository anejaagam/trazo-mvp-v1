/**
 * Tests for Dashboard Breadcrumbs Component
 */

import { render, screen } from '@testing-library/react';
import { DashboardBreadcrumbs } from '../breadcrumbs';
import { usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation');

describe('DashboardBreadcrumbs', () => {
  const mockUsePathname = usePathname as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render breadcrumbs for nested paths', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches/active');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Crop Management')).toBeInTheDocument();
      expect(screen.getByText('Active Batches')).toBeInTheDocument();
    });

    it('should not render on dashboard home', () => {
      mockUsePathname.mockReturnValue('/dashboard');

      const { container } = render(<DashboardBreadcrumbs />);

      expect(container.firstChild).toBeNull();
    });

    it('should apply custom className', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches');

      const { container } = render(
        <DashboardBreadcrumbs className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render home icon', () => {
      mockUsePathname.mockReturnValue('/dashboard/inventory');

      const { container } = render(<DashboardBreadcrumbs />);

      const homeIcon = container.querySelector('svg.lucide-home');
      expect(homeIcon).toBeInTheDocument();
    });
  });

  describe('Path Mapping', () => {
    it('should map batches to Crop Management', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Crop Management')).toBeInTheDocument();
    });

    it('should map inventory to Inventory', () => {
      mockUsePathname.mockReturnValue('/dashboard/inventory');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('should map admin to Administration', () => {
      mockUsePathname.mockReturnValue('/dashboard/admin');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Administration')).toBeInTheDocument();
    });

    it('should map users to Users & Roles', () => {
      mockUsePathname.mockReturnValue('/dashboard/admin/users');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Administration')).toBeInTheDocument();
      expect(screen.getByText('Users & Roles')).toBeInTheDocument();
    });

    it('should capitalize unknown segments', () => {
      mockUsePathname.mockReturnValue('/dashboard/unknown-segment');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Unknown-segment')).toBeInTheDocument();
    });
  });

  describe('Nested Paths', () => {
    it('should handle two-level nesting', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches/active');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Crop Management')).toBeInTheDocument();
      expect(screen.getByText('Active Batches')).toBeInTheDocument();
    });

    it('should handle three-level nesting', () => {
      mockUsePathname.mockReturnValue('/dashboard/inventory/stock/details');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Current Stock')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should handle single-level paths', () => {
      mockUsePathname.mockReturnValue('/dashboard/settings');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should make non-final crumbs clickable', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches/active');

      render(<DashboardBreadcrumbs />);

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      const batchesLink = screen.getByRole('link', { name: 'Crop Management' });
      expect(batchesLink).toHaveAttribute('href', '/dashboard/batches');
    });

    it('should not make final crumb clickable', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches/active');

      render(<DashboardBreadcrumbs />);

      const activeBatchesText = screen.getByText('Active Batches');
      expect(activeBatchesText.tagName).toBe('SPAN');
      expect(activeBatchesText).not.toHaveAttribute('href');
    });

    it('should build correct href paths', () => {
      mockUsePathname.mockReturnValue('/dashboard/admin/users/invite');

      render(<DashboardBreadcrumbs />);

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      const adminLink = screen.getByRole('link', { name: 'Administration' });
      expect(adminLink).toHaveAttribute('href', '/dashboard/admin');

      const usersLink = screen.getByRole('link', { name: 'Users & Roles' });
      expect(usersLink).toHaveAttribute('href', '/dashboard/admin/users');
    });
  });

  describe('Chevron Separators', () => {
    it('should show chevron between breadcrumbs', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches/active');

      const { container } = render(<DashboardBreadcrumbs />);

      const chevrons = container.querySelectorAll('svg.lucide-chevron-right');
      expect(chevrons.length).toBeGreaterThan(0);
    });

    it('should not show chevron before first item', () => {
      mockUsePathname.mockReturnValue('/dashboard/inventory');

      const { container } = render(<DashboardBreadcrumbs />);

      const breadcrumbNav = container.querySelector('nav');
      
      // First div should be the home icon
      const firstDiv = breadcrumbNav?.querySelector('div');
      const firstIcon = firstDiv?.querySelector('svg');
      expect(firstIcon?.classList.contains('lucide-home')).toBe(true);
    });

    it('should show correct number of chevrons', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches/active/detail');

      const { container } = render(<DashboardBreadcrumbs />);

      const chevrons = container.querySelectorAll('svg.lucide-chevron-right');
      // Should have chevrons between items (n-1 chevrons for n items)
      expect(chevrons.length).toBeGreaterThan(1);
    });
  });

  describe('Styling', () => {
    it('should apply hover styles to links', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches');

      render(<DashboardBreadcrumbs />);

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).toHaveClass('hover:text-foreground');
    });

    it('should highlight final crumb', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches');

      render(<DashboardBreadcrumbs />);

      const finalCrumb = screen.getByText('Crop Management');
      expect(finalCrumb).toHaveClass('text-foreground', 'font-medium');
    });

    it('should apply muted color to non-final crumbs', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches/active');

      const { container } = render(<DashboardBreadcrumbs />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('text-muted-foreground');
    });
  });

  describe('Complex Paths', () => {
    it('should handle compliance paths', () => {
      mockUsePathname.mockReturnValue('/dashboard/compliance/reports');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Compliance')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('should handle tasks paths', () => {
      mockUsePathname.mockReturnValue('/dashboard/tasks/assigned');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Tasks & Workflows')).toBeInTheDocument();
      expect(screen.getByText('My Tasks')).toBeInTheDocument();
    });

    it('should handle waste management paths', () => {
      mockUsePathname.mockReturnValue('/dashboard/waste/disposal');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Waste Management')).toBeInTheDocument();
      expect(screen.getByText('Disposal Log')).toBeInTheDocument();
    });

    it('should handle environmental controls paths', () => {
      mockUsePathname.mockReturnValue('/dashboard/environmental/monitoring');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Environmental Controls')).toBeInTheDocument();
      expect(screen.getByText('Live Monitoring')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle trailing slashes', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches/');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Crop Management')).toBeInTheDocument();
    });

    it('should handle empty segments', () => {
      mockUsePathname.mockReturnValue('/dashboard//batches');

      render(<DashboardBreadcrumbs />);

      expect(screen.getByText('Crop Management')).toBeInTheDocument();
    });

    it('should handle root dashboard path', () => {
      mockUsePathname.mockReturnValue('/dashboard');

      const { container } = render(<DashboardBreadcrumbs />);

      expect(container.firstChild).toBeNull();
    });
  });
});
