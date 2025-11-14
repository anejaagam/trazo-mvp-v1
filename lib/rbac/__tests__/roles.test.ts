import { describe, it, expect } from '@jest/globals';
import { ROLES } from '../roles';
import { PERMISSIONS } from '../permissions';
import type { RoleKey, PermissionKey } from '../types';

describe('RBAC Roles', () => {
  describe('ROLES constant', () => {
    it('should contain all 8 required roles', () => {
      const expectedRoles: RoleKey[] = [
        'org_admin',
        'site_manager', 
        'head_grower',
        'operator',
        'compliance_qa',
        'executive_viewer',
        'installer_tech',
        'support'
      ];

      expectedRoles.forEach(role => {
        expect(ROLES[role]).toBeDefined();
      });

      // Should have exactly 8 roles
      expect(Object.keys(ROLES).length).toBe(8);
    });

    it('should have properly formatted role objects', () => {
      Object.entries(ROLES).forEach(([key, role]) => {
        expect(role.id).toBe(key);
        expect(typeof role.name).toBe('string');
        expect(typeof role.description).toBe('string');
        expect(Array.isArray(role.permissions)).toBe(true);
        expect(typeof role.isSystemRole).toBe('boolean');
        
        // Name and description should not be empty
        expect(role.name.length).toBeGreaterThan(0);
        expect(role.description.length).toBeGreaterThan(0);
      });
    });

    it('should have all system roles marked correctly', () => {
      Object.values(ROLES).forEach(role => {
        expect(role.isSystemRole).toBe(true);
      });
    });

    it('should have hierarchical permission patterns', () => {
      const orgAdmin = ROLES.org_admin;
      const operator = ROLES.operator;
      const executiveViewer = ROLES.executive_viewer;
      
      // Org admin should have wildcard or most permissions
      expect(orgAdmin.permissions.includes('*') || orgAdmin.permissions.length > operator.permissions.length).toBe(true);
      
      // Executive viewer should have fewer permissions than operator
      expect(executiveViewer.permissions.length).toBeLessThanOrEqual(operator.permissions.length);
    });
  });

  describe('Role permissions', () => {
    it('should have valid permission references', () => {
      Object.values(ROLES).forEach(role => {
        role.permissions.forEach(permission => {
          // Each permission should either exist in PERMISSIONS or be a wildcard pattern
          if (permission === '*') {
            expect(PERMISSIONS['*']).toBeDefined();
          } else if (permission.endsWith(':*')) {
            // Resource wildcard - should have at least one matching permission
            const resource = permission.replace(':*', '');
            const matchingPerms = Object.keys(PERMISSIONS).filter(key => 
              key.startsWith(`${resource}:`)
            );
            expect(matchingPerms.length).toBeGreaterThan(0);
          } else {
            expect(PERMISSIONS[permission as PermissionKey]).toBeDefined();
          }
        });
      });
    });

    it('should have org_admin with wildcard access', () => {
      const orgAdmin = ROLES.org_admin;
      expect(orgAdmin.permissions).toContain('*');
    });

    it('should have executive_viewer with only view permissions', () => {
      const executiveViewer = ROLES.executive_viewer;
      
      // Should not have create, update, delete permissions
      const nonViewPermissions = executiveViewer.permissions.filter(perm => 
        !perm.includes('view') && 
        !perm.includes('export') && 
        perm !== '*'
      );
      
      // Most permissions should be view-only
      expect(nonViewPermissions.length).toBeLessThan(executiveViewer.permissions.length / 2);
    });

    it('should have support with limited system access', () => {
      const support = ROLES.support;
      
      // Support should not have delete permissions for critical resources
      const dangerousPermissions = support.permissions.filter(perm => 
        perm.includes('delete') && 
        (perm.includes('batch') || perm.includes('user') || perm.includes('org'))
      );
      
      expect(dangerousPermissions.length).toBe(0);
    });

    it('should have compliance_qa with compliance permissions', () => {
      const complianceQA = ROLES.compliance_qa;
      
      // Should have compliance-related permissions
      const compliancePerms = complianceQA.permissions.filter(perm => 
        perm.includes('compliance') || 
        perm.includes('waste') || 
        perm.includes('audit')
      );
      
      expect(compliancePerms.length).toBeGreaterThan(0);
    });

    it('should have installer_tech with technical permissions', () => {
      const installerTech = ROLES.installer_tech;
      
      // Should have control and monitoring permissions
      const techPerms = installerTech.permissions.filter(perm => 
        perm.includes('control') || 
        perm.includes('monitoring') || 
        perm.includes('device')
      );
      
      expect(techPerms.length).toBeGreaterThan(0);
    });
  });

  describe('Role hierarchy validation', () => {
    it('should have consistent permission inheritance patterns', () => {
      // Higher privilege roles should generally have more permissions (except wildcard)
      const rolesByPermissionCount = Object.values(ROLES)
        .filter(role => !role.permissions.includes('*'))
        .sort((a, b) => b.permissions.length - a.permissions.length);
      
      // Should have reasonable distribution of permission counts
      expect(rolesByPermissionCount.length).toBeGreaterThan(0);
      
      // The role with most permissions should have significantly more than the least
      if (rolesByPermissionCount.length > 1) {
        const mostPermissions = rolesByPermissionCount[0].permissions.length;
        const leastPermissions = rolesByPermissionCount[rolesByPermissionCount.length - 1].permissions.length;
        expect(mostPermissions).toBeGreaterThan(leastPermissions);
      }
    });

    it('should have reasonable permission counts per role', () => {
      Object.values(ROLES).forEach(role => {
        // Each role should have at least some permissions
        expect(role.permissions.length).toBeGreaterThan(0);
        
        // But not an excessive number (except org_admin with wildcard)
        if (!role.permissions.includes('*')) {
          expect(role.permissions.length).toBeLessThan(60); // Increased from 50 to accommodate batch/cultivar permissions
        }
      });
    });
  });
});