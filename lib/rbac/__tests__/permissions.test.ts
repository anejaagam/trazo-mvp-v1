import { describe, it, expect } from '@jest/globals';
import { PERMISSIONS } from '../permissions';
import type { PermissionKey } from '../types';

describe('RBAC Permissions', () => {
  describe('PERMISSIONS constant', () => {
    it('should contain all required permission categories', () => {
      const permissionKeys = Object.keys(PERMISSIONS) as PermissionKey[];
      
      // Check for key permission categories
      const batchPermissions = permissionKeys.filter(key => key.startsWith('batch:'));
      const inventoryPermissions = permissionKeys.filter(key => key.startsWith('inventory:'));
      const userPermissions = permissionKeys.filter(key => key.startsWith('user:'));
      const orgPermissions = permissionKeys.filter(key => key.startsWith('org:'));
      
      expect(batchPermissions.length).toBeGreaterThan(0);
      expect(inventoryPermissions.length).toBeGreaterThan(0);
      expect(userPermissions.length).toBeGreaterThan(0);
      expect(orgPermissions.length).toBeGreaterThan(0);
    });

    it('should have wildcard permission', () => {
      expect(PERMISSIONS['*']).toBeDefined();
      expect(PERMISSIONS['*'].key).toBe('*');
      expect(PERMISSIONS['*'].name).toBe('All Permissions');
    });

    it('should have properly formatted permission objects', () => {
      Object.entries(PERMISSIONS).forEach(([key, permission]) => {
        expect(permission.key).toBe(key);
        expect(typeof permission.name).toBe('string');
        expect(typeof permission.description).toBe('string');
        expect(typeof permission.resource).toBe('string');
        expect(typeof permission.action).toBe('string');
        
        // Name and description should not be empty
        expect(permission.name.length).toBeGreaterThan(0);
        expect(permission.description.length).toBeGreaterThan(0);
      });
    });

    it('should have consistent resource:action format for keys (except wildcard)', () => {
      Object.keys(PERMISSIONS).forEach(key => {
        if (key !== '*') {
          expect(key).toMatch(/^[a-z_]+:[a-z_]+$/);
        }
      });
    });

    it('should have all core CRUD operations for major resources', () => {
      const coreResources = ['batch', 'inventory', 'user'];
      const coreActions = ['view', 'create', 'update', 'delete'];
      
      coreResources.forEach(resource => {
        coreActions.forEach(action => {
          const permissionKey = `${resource}:${action}` as PermissionKey;
          expect(PERMISSIONS[permissionKey]).toBeDefined();
        });
      });
    });

    it('should have environmental control permissions', () => {
      const environmentalPermissions = [
        'control:view',
        'control:manual_override', 
        'control:recipe_create',
        'control:recipe_apply'
      ] as PermissionKey[];
      
      environmentalPermissions.forEach(permission => {
        expect(PERMISSIONS[permission]).toBeDefined();
      });
    });

    it('should have compliance permissions', () => {
      const compliancePermissions = [
        'compliance:view',
        'compliance:create',
        'compliance:export'
      ] as PermissionKey[];
      
      compliancePermissions.forEach(permission => {
        expect(PERMISSIONS[permission]).toBeDefined();
      });
    });

    it('should have task management permissions', () => {
      const taskPermissions = [
        'task:view',
        'task:create',
        'task:update',
        'task:delete',
        'task:assign',
        'task:complete'
      ] as PermissionKey[];
      
      taskPermissions.forEach(permission => {
        expect(PERMISSIONS[permission]).toBeDefined();
      });
    });
  });

  describe('Permission validation', () => {
    it('should have unique permission keys', () => {
      const keys = Object.keys(PERMISSIONS);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it('should have consistent resource names', () => {
      const resources = Object.values(PERMISSIONS).map(p => p.resource);
      const uniqueResources = new Set(resources);
      
      // Should have reasonable number of distinct resources
      expect(uniqueResources.size).toBeGreaterThan(5);
      expect(uniqueResources.size).toBeLessThan(20);
    });
  });
});