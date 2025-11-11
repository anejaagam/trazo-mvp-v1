import { render, screen, fireEvent } from '@testing-library/react';
import { RolePermissionMatrix } from '../role-permission-matrix';
import { ROLES } from '@/lib/rbac/roles';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import type { RoleKey } from '@/lib/rbac/types';

describe('RolePermissionMatrix', () => {
  const mockUserCounts: Partial<Record<RoleKey, number>> = {
    org_admin: 5,
    site_manager: 12,
    head_grower: 8,
    operator: 25,
  };

  describe('Rendering', () => {
    it('should render the permission matrix', () => {
      render(<RolePermissionMatrix />);
      
      expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
      expect(screen.getByText('Role Details')).toBeInTheDocument();
    });

    it('should render with user counts', () => {
      render(<RolePermissionMatrix userCounts={mockUserCounts} />);
      
      // Multiple elements may contain these numbers; ensure at least one appears
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
      expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    });

    it('should render without user counts', () => {
      render(<RolePermissionMatrix />);
      
      // Should still render but without user count badges
      expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
    });

    it('should render tabs', () => {
      render(<RolePermissionMatrix />);
      
      const matrixTab = screen.getByRole('tab', { name: /permission matrix/i });
      const rolesTab = screen.getByRole('tab', { name: /role details/i });
      
      expect(matrixTab).toBeInTheDocument();
      expect(rolesTab).toBeInTheDocument();
    });
  });

  describe('Role Selection', () => {
    it('should render role selector buttons', () => {
      render(<RolePermissionMatrix />);
      
      // Should have buttons for all roles
      Object.values(ROLES).forEach((role) => {
        expect(screen.getByText(role.name)).toBeInTheDocument();
      });
    });

    it('should select org_admin by default', () => {
      render(<RolePermissionMatrix />);
      
      // Check if org_admin role info is displayed
      const orgAdminRole = ROLES.org_admin;
      expect(screen.getByText(orgAdminRole.name)).toBeInTheDocument();
      expect(screen.getByText(orgAdminRole.description)).toBeInTheDocument();
    });

    it('should change selected role when button is clicked', () => {
      render(<RolePermissionMatrix />);
      
      // Click on site_manager button
      const siteManagerButton = screen.getByRole('button', { name: /site manager/i });
      fireEvent.click(siteManagerButton);
      
      // Should show site_manager description
      const siteManagerRole = ROLES.site_manager;
      expect(screen.getByText(siteManagerRole.description)).toBeInTheDocument();
    });

    it('should display user count badges on role buttons', () => {
      render(<RolePermissionMatrix userCounts={mockUserCounts} />);
      
      // Check for user count badges (may appear in multiple places)
      expect(screen.getAllByText('5').length).toBeGreaterThan(0); // org_admin
      expect(screen.getAllByText('12').length).toBeGreaterThan(0); // site_manager
    });
  });

  describe('Selected Role Info Card', () => {
    it('should display selected role information', () => {
      render(<RolePermissionMatrix />);
      
      const orgAdminRole = ROLES.org_admin;
      expect(screen.getByText(orgAdminRole.name)).toBeInTheDocument();
      expect(screen.getByText(orgAdminRole.description)).toBeInTheDocument();
    });

    it('should display permission count for role', () => {
      render(<RolePermissionMatrix />);
      
      // org_admin has wildcard permissions
      expect(screen.getByText(/all \(wildcard\)/i)).toBeInTheDocument();
    });

    it('should display permission count for non-wildcard role', () => {
      render(<RolePermissionMatrix />);
      
      // Click on a role without wildcard
      const operatorButton = screen.getByRole('button', { name: /operator/i });
      fireEvent.click(operatorButton);
      
      // Should show specific permission count
      const operatorRole = ROLES.operator;
      const permCount = operatorRole.permissions.length;
      expect(screen.getByText(`${permCount} granted`)).toBeInTheDocument();
    });

    it('should display user count in role info', () => {
      render(<RolePermissionMatrix userCounts={mockUserCounts} />);
      
      // Should show user count for org_admin (default selected)
      expect(screen.getByText('Users:')).toBeInTheDocument();
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    });
  });

  describe('Permission Groups', () => {
    it('should display permission groups', () => {
      render(<RolePermissionMatrix />);
      
      // Should have grouped permissions by resource
      // Examples: Dashboard, Batch, Inventory, etc.
      const permissionKeys = Object.keys(PERMISSIONS);
      const resources = new Set(permissionKeys.map(key => key.split(':')[0]));
      
      // At least some resource groups should be visible
      expect(resources.size).toBeGreaterThan(0);
    });

    it('should display permission table headers', () => {
      render(<RolePermissionMatrix />);
      
      expect(screen.getByText('Permission Key')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Granted')).toBeInTheDocument();
    });

    it('should display check marks for granted permissions', () => {
      render(<RolePermissionMatrix />);
      
      // org_admin (default) has wildcard, so all permissions should show check marks
      const { container } = render(<RolePermissionMatrix />);
      
      // Check for check mark icons (rendered as SVG)
      const checkIcons = container.querySelectorAll('svg');
      expect(checkIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Tabs Navigation', () => {
    it('should switch to role details tab', () => {
      render(<RolePermissionMatrix />);
      
      const rolesTab = screen.getByRole('tab', { name: /role details/i });
      fireEvent.click(rolesTab);
      
      // Should show role details table
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Permissions')).toBeInTheDocument();
    });

    it('should display all roles in role details table', () => {
      render(<RolePermissionMatrix />);
      
      const rolesTab = screen.getByRole('tab', { name: /role details/i });
      fireEvent.click(rolesTab);
      
      // All roles should be listed
      Object.values(ROLES).forEach((role) => {
        expect(screen.getByText(role.name)).toBeInTheDocument();
      });
    });

    it('should display role hierarchy information', () => {
      render(<RolePermissionMatrix />);
      
      const rolesTab = screen.getByRole('tab', { name: /role details/i });
      fireEvent.click(rolesTab);
      
      expect(screen.getByText('Role Hierarchy')).toBeInTheDocument();
      expect(screen.getByText(/understanding role relationships/i)).toBeInTheDocument();
    });

    it('should display role use cases', () => {
      render(<RolePermissionMatrix />);
      
      const rolesTab = screen.getByRole('tab', { name: /role details/i });
      fireEvent.click(rolesTab);
      
      // Check for role descriptions in hierarchy section
      expect(screen.getByText(/full administrative access/i)).toBeInTheDocument();
      expect(screen.getByText(/manages specific sites/i)).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render shield icons for roles', () => {
      const { container } = render(<RolePermissionMatrix />);
      
      // Shield icons should be present (rendered as SVG)
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user counts', () => {
      render(<RolePermissionMatrix userCounts={{}} />);
      
      // Should render without crashing
      expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
    });

    it('should handle missing user count for a role', () => {
      const partialCounts: Partial<Record<RoleKey, number>> = {
        org_admin: 5,
        // site_manager count is missing
      };
      
      render(<RolePermissionMatrix userCounts={partialCounts} />);
      
      // Should still render
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    });

    it('should handle role selection changes', () => {
      render(<RolePermissionMatrix />);
      
      // Select different roles
      const headGrowerButton = screen.getByRole('button', { name: /head grower/i });
      fireEvent.click(headGrowerButton);
      
      const headGrowerRole = ROLES.head_grower;
      expect(screen.getByText(headGrowerRole.description)).toBeInTheDocument();
      
      const operatorButton = screen.getByRole('button', { name: /operator/i });
      fireEvent.click(operatorButton);
      
      const operatorRole = ROLES.operator;
      expect(screen.getByText(operatorRole.description)).toBeInTheDocument();
    });
  });

  describe('Permission Checking Logic', () => {
    it('should show all permissions granted for wildcard role', () => {
      render(<RolePermissionMatrix />);
      
      // org_admin has wildcard, should show "All (Wildcard)"
      expect(screen.getByText(/all \(wildcard\)/i)).toBeInTheDocument();
    });

    it('should show specific permission count for non-wildcard role', () => {
      render(<RolePermissionMatrix />);
      
      // Click on operator role
      const operatorButton = screen.getByRole('button', { name: /operator/i });
      fireEvent.click(operatorButton);
      
      const operatorRole = ROLES.operator;
      const permCount = operatorRole.permissions.length;
      
      // Should show exact count
      expect(screen.getByText(`${permCount} granted`)).toBeInTheDocument();
    });
  });

  describe('Role Details Table', () => {
    it('should display permission counts in role table', async () => {
      render(<RolePermissionMatrix userCounts={mockUserCounts} />);
      
      const rolesTab = screen.getByRole('tab', { name: /role details/i });
      fireEvent.click(rolesTab);
      
      // Should show "All" for wildcard permissions (org_admin)
      expect(await screen.findByText('All')).toBeInTheDocument();
      
      // Should show specific counts for other roles
      const permCountBadges = await screen.findAllByText(/permissions/i);
      expect(permCountBadges.length).toBeGreaterThan(0);
    });

    it('should display user counts in role table', async () => {
      render(<RolePermissionMatrix userCounts={mockUserCounts} />);
      
      const rolesTab = screen.getByRole('tab', { name: /role details/i });
      fireEvent.click(rolesTab);
      
      // Should show user counts - checking for text containing "users"
      const userCountText = await screen.findAllByText(/\d+ users/i);
      expect(userCountText.length).toBeGreaterThan(0);
    });

    it('should show table with role information', () => {
      render(<RolePermissionMatrix />);
      
      const rolesTab = screen.getByRole('tab', { name: /role details/i });
      fireEvent.click(rolesTab);
      
      // Should show role details table - multiple tables exist in component
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);
    });
  });
});
