import { describe, it, expect } from '@jest/globals';
import { 
  canPerformAction, 
  checkPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  RoleGuard
} from '../guards';
import type { RoleKey, PermissionKey } from '../types';

describe('RBAC Guards', () => {
  describe('canPerformAction', () => {
    it('should allow org_admin to perform any action', () => {
      const result = canPerformAction('org_admin', 'batch:create');
      expect(result.allowed).toBe(true);
    });

    it('should deny invalid role', () => {
      const result = canPerformAction('invalid_role' as RoleKey, 'batch:view');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Invalid role');
    });

    it('should handle additional permissions', () => {
      // Executive viewer normally can't create batches
      const withoutAdditional = canPerformAction('executive_viewer', 'batch:create');
      expect(withoutAdditional.allowed).toBe(false);

      // But should be allowed with additional permission
      const withAdditional = canPerformAction('executive_viewer', 'batch:create', ['batch:create']);
      expect(withAdditional.allowed).toBe(true);
    });

    it('should handle wildcard permissions', () => {
      // Roles with batch:* should allow any batch action
      const result = canPerformAction('head_grower', 'batch:view');
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkPermission', () => {
    it('should return boolean for permission check', () => {
      const allowed = checkPermission('org_admin', 'user:create');
      expect(typeof allowed).toBe('boolean');
      expect(allowed).toBe(true);
    });

    it('should deny operator from creating users', () => {
      const allowed = checkPermission('operator', 'user:create');
      expect(allowed).toBe(false);
    });

    it('should allow head_grower to view batches', () => {
      const allowed = checkPermission('head_grower', 'batch:view');
      expect(allowed).toBe(true);
    });

    it('should handle null/undefined role', () => {
      expect(checkPermission(null, 'batch:view')).toBe(false);
      expect(checkPermission(undefined, 'batch:view')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', () => {
      const permissions: PermissionKey[] = ['batch:create', 'user:delete'];
      const result = hasAnyPermission('head_grower', permissions);
      expect(result).toBe(true); // Should have batch:create
    });

    it('should return false if user has none of the permissions', () => {
      const permissions: PermissionKey[] = ['user:create', 'org:billing'];
      const result = hasAnyPermission('operator', permissions);
      expect(result).toBe(false);
    });

    it('should handle empty permissions array', () => {
      const result = hasAnyPermission('org_admin', []);
      expect(result).toBe(false);
    });

    it('should handle null role', () => {
      const permissions: PermissionKey[] = ['batch:view'];
      // @ts-expect-error Testing null role handling
      const result = hasAnyPermission(null, permissions);
      expect(result).toBe(false);
    });

  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const permissions: PermissionKey[] = ['batch:view', 'inventory:view'];
      const result = hasAllPermissions('org_admin', permissions);
      expect(result).toBe(true); // org_admin has wildcard
    });

    it('should return false if user is missing any permission', () => {
      const permissions: PermissionKey[] = ['batch:view', 'user:create'];
      const result = hasAllPermissions('operator', permissions);
      expect(result).toBe(false); // Operator likely can't create users
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const permissions: PermissionKey[] = ['batch:view', 'inventory:view'];
      const result = hasAllPermissions('org_admin', permissions);
      expect(result).toBe(true); // org_admin has wildcard
    });

    it('should return false if user is missing any permission', () => {
      const permissions: PermissionKey[] = ['batch:view', 'user:create'];
      const result = hasAllPermissions('operator', permissions);
      expect(result).toBe(false); // Operator likely can't create users
    });

    it('should handle empty permissions array', () => {
      const result = hasAllPermissions('operator', []);
      expect(result).toBe(true); // Vacuously true
    });

    it('should handle single permission', () => {
      const result = hasAllPermissions('head_grower', ['batch:view']);
      expect(result).toBe(true);
    });
  });

  describe('RoleGuard static methods', () => {
    it('should provide hasPermission method', () => {
      expect(RoleGuard.hasPermission('org_admin', 'batch:create')).toBe(true);
      expect(RoleGuard.hasPermission('executive_viewer', 'batch:delete')).toBe(false);
    });

    it('should provide canPerform method', () => {
      const result = RoleGuard.canPerform('site_manager', 'inventory:create');
      expect(result).toHaveProperty('allowed');
      expect(typeof result.allowed).toBe('boolean');
    });

    it('should provide hasAnyPermission method', () => {
      const permissions: PermissionKey[] = ['batch:view', 'inventory:view'];
      const result = RoleGuard.hasAnyPermission('operator', permissions);
      expect(typeof result).toBe('boolean');
    });

    it('should provide hasAllPermissions method', () => {
      const permissions: PermissionKey[] = ['batch:view'];
      const result = RoleGuard.hasAllPermissions('head_grower', permissions);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Specific role permission tests', () => {
    it('should allow roles to access their designated permissions', () => {
      // Test basic batch permissions
      expect(checkPermission('head_grower', 'batch:view')).toBe(true);
      expect(checkPermission('site_manager', 'batch:create')).toBe(true);
      
      // Test inventory permissions  
      expect(checkPermission('site_manager', 'inventory:view')).toBe(true);
      expect(checkPermission('operator', 'inventory:view')).toBe(true);
    });

    it('should restrict support role appropriately', () => {
      // Support should have view access
      expect(checkPermission('support', 'user:view')).toBe(true);
      
      // But not delete access for critical resources
      expect(checkPermission('support', 'batch:delete')).toBe(false);
      expect(checkPermission('support', 'user:delete')).toBe(false);
    });

    it('should allow executive_viewer read-only access', () => {
      // Should have view permissions
      expect(checkPermission('executive_viewer', 'batch:view')).toBe(true);
      expect(checkPermission('executive_viewer', 'inventory:view')).toBe(true);
      
      // Should not have create/update/delete permissions
      expect(checkPermission('executive_viewer', 'batch:create')).toBe(false);
      expect(checkPermission('executive_viewer', 'batch:update')).toBe(false);
      expect(checkPermission('executive_viewer', 'user:create')).toBe(false);
    });

    it('should allow site_manager comprehensive access', () => {
      // Should manage batches and inventory
      expect(checkPermission('site_manager', 'batch:create')).toBe(true);
      expect(checkPermission('site_manager', 'inventory:update')).toBe(true);
      
      // Should manage users within their scope
      expect(checkPermission('site_manager', 'user:view')).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed permission keys gracefully', () => {
      expect(() => {
        checkPermission('operator', 'invalid-permission' as PermissionKey);
      }).not.toThrow();
      
      const result = checkPermission('operator', 'invalid-permission' as PermissionKey);
      expect(result).toBe(false);
    });

    it('should handle additional permissions with wildcards', () => {
      const result = canPerformAction('operator', 'batch:create', ['batch:*']);
      expect(result.allowed).toBe(true);
    });

    it('should handle permissions case sensitivity', () => {
      // Our system should be case sensitive
      expect(checkPermission('operator', 'BATCH:VIEW' as PermissionKey)).toBe(false);
    });
  });
});