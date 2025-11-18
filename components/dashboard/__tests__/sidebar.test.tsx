/**
 * Tests for Dashboard Sidebar Component
 */

import { render, screen } from '@testing-library/react';
import { DashboardSidebar } from '../sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: jest.fn(),
}));

describe('DashboardSidebar', () => {
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

  const mockUser = {
    id: 'user-1',
    role: 'admin',
    additional_permissions: [],
    organization: {
      name: 'Test Farm',
      jurisdiction: 'US',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  // Helper to create complete mock permissions
  const createMockPermissions = (canFn: (permission: string) => boolean = () => true) => ({
    can: jest.fn(canFn),
    cannot: jest.fn((permission: string) => !canFn(permission)),
    hasAny: jest.fn(() => true),
    hasAll: jest.fn(() => true),
    requirePermission: jest.fn(),
  });

  describe('Rendering', () => {
    it('should render the sidebar', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());

      render(<DashboardSidebar user={mockUser} />);

      // Check for multiple Overview items (one main, one in admin)
      const overviewItems = screen.getAllByText('Overview');
      expect(overviewItems.length).toBeGreaterThan(0);
    });

    it('should apply custom className', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());

      const { container } = render(
        <DashboardSidebar user={mockUser} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Navigation Items', () => {
    it('should show Overview nav item', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());

      render(<DashboardSidebar user={mockUser} />);

      const overviewLinks = screen.getAllByRole('link', { name: /overview/i });
      const mainOverview = overviewLinks.find(link => link.getAttribute('href') === '/dashboard');
      expect(mainOverview).toBeInTheDocument();
      expect(mainOverview).toHaveAttribute('href', '/dashboard');
    });

    it('should show Crop Management nav item', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());

      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('Crop Management')).toBeInTheDocument();
    });

    it('should show Inventory nav item', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());

      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('should show Admin nav item for admin users', () => {
      mockUsePermissions.mockReturnValue(
        createMockPermissions((permission) => permission === 'user:view')
      );

      render(<DashboardSidebar user={{ ...mockUser, role: 'admin' }} />);

      expect(screen.getByText('Administration')).toBeInTheDocument();
    });
  });

  describe('Permissions', () => {
    it('should hide items without permission', () => {
      mockUsePermissions.mockReturnValue(
        createMockPermissions((permission) => permission === 'dashboard:view')
      );

      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    });

    it('should call usePermissions with correct role', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());

      render(<DashboardSidebar user={mockUser} />);

      expect(mockUsePermissions).toHaveBeenCalledWith('admin', []);
    });

    it('should pass additional permissions to usePermissions', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());
      const userWithPerms = {
        ...mockUser,
        additional_permissions: ['custom:permission'],
      };

      render(<DashboardSidebar user={userWithPerms} />);

      expect(mockUsePermissions).toHaveBeenCalledWith('admin', [
        'custom:permission',
      ]);
    });

    it('should show different items for manager role', () => {
      mockUsePermissions.mockReturnValue(
        createMockPermissions((permission) =>
          ['dashboard:view', 'batch:view'].includes(permission)
        )
      );

      render(<DashboardSidebar user={{ ...mockUser, role: 'manager' }} />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Crop Management')).toBeInTheDocument();
    });

    it('should show limited items for viewer role', () => {
      mockUsePermissions.mockReturnValue(
        createMockPermissions((permission) => permission === 'dashboard:view')
      );

      render(<DashboardSidebar user={{ ...mockUser, role: 'viewer' }} />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should highlight active nav item', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      mockUsePermissions.mockReturnValue(createMockPermissions());

      render(<DashboardSidebar user={mockUser} />);

      const overviewLinks = screen.getAllByRole('link', { name: /overview/i });
      const mainOverview = overviewLinks.find(link => link.getAttribute('href') === '/dashboard');
      expect(mainOverview).toBeInTheDocument();
      // Check if the div child has the active class
      const activeDiv = mainOverview?.querySelector('.bg-accent');
      expect(activeDiv).toBeInTheDocument();
    });

    it('should highlight nested active nav item', () => {
      mockUsePathname.mockReturnValue('/dashboard/batches/active');
      mockUsePermissions.mockReturnValue(createMockPermissions());

      render(<DashboardSidebar user={mockUser} />);

      const activeLink = screen.getByRole('link', { name: /active batches/i });
      // Check if the div child has the active class
      const activeDiv = activeLink.querySelector('.bg-accent');
      expect(activeDiv).toBeInTheDocument();
    });

    it('should not highlight non-active items', () => {
      mockUsePathname.mockReturnValue('/dashboard/inventory');
      mockUsePermissions.mockReturnValue(createMockPermissions());

      render(<DashboardSidebar user={mockUser} />);

      const overviewLinks = screen.getAllByRole('link', { name: /overview/i });
      const mainOverview = overviewLinks.find(link => link.getAttribute('href') === '/dashboard');
      expect(mainOverview).toBeInTheDocument();
      // Check that the div child does not have both active classes
      const activeDiv = mainOverview?.querySelector('.bg-accent.text-accent-foreground');
      expect(activeDiv).not.toBeInTheDocument();
    });
  });

  describe('User Information', () => {
    it('should use user role for permissions check', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());

      render(
        <DashboardSidebar user={{ ...mockUser, role: 'manager' }} />
      );

      expect(mockUsePermissions).toHaveBeenCalledWith('manager', []);
    });

    it('should handle missing organization gracefully', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());
      const userWithoutOrg = {
        ...mockUser,
        organization: undefined,
      };

      expect(() => {
        render(<DashboardSidebar user={userWithoutOrg} />);
      }).not.toThrow();
    });
  });

  describe('Nested Navigation', () => {
    it('should show nested items under Crop Management', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());
      mockUsePathname.mockReturnValue('/dashboard/batches/active');

      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('Active Batches')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('Harvest Queue')).toBeInTheDocument();
    });

    it('should show nested items under Inventory', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());
      mockUsePathname.mockReturnValue('/dashboard/inventory/items');

      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('Item Catalog')).toBeInTheDocument();
      expect(screen.getByText('Movements Log')).toBeInTheDocument();
    });

    it('should hide nested items if parent permission is denied', () => {
      mockUsePermissions.mockReturnValue(
        createMockPermissions((permission) => permission !== 'batch:view')
      );

      render(<DashboardSidebar user={mockUser} />);

      expect(screen.queryByText('Active Batches')).not.toBeInTheDocument();
      expect(screen.queryByText('Planning')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render icons for navigation items', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());

      const { container } = render(<DashboardSidebar user={mockUser} />);

      // Check for SVG icons
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render mobile-friendly structure', () => {
      mockUsePermissions.mockReturnValue(createMockPermissions());

      const { container } = render(<DashboardSidebar user={mockUser} />);

      // Should have navigation structure
      expect(container.querySelector('nav')).toBeInTheDocument();
    });
  });
});
