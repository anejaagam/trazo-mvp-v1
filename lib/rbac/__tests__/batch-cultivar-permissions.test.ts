/**
 * Tests for new batch and cultivar permissions
 */

import { PERMISSIONS } from '../permissions';
import { ROLES } from '../roles';
import { canPerformAction } from '../guards';

describe('Batch and Cultivar Permissions', () => {
  describe('New Permissions', () => {
    it('should have batch:harvest permission defined', () => {
      expect(PERMISSIONS['batch:harvest']).toBeDefined();
      expect(PERMISSIONS['batch:harvest'].resource).toBe('batch');
      expect(PERMISSIONS['batch:harvest'].action).toBe('harvest');
    });

    it('should have batch:assign_pod permission defined', () => {
      expect(PERMISSIONS['batch:assign_pod']).toBeDefined();
      expect(PERMISSIONS['batch:assign_pod'].resource).toBe('batch');
      expect(PERMISSIONS['batch:assign_pod'].action).toBe('assign_pod');
    });

    it('should have all cultivar permissions defined', () => {
      expect(PERMISSIONS['cultivar:view']).toBeDefined();
      expect(PERMISSIONS['cultivar:create']).toBeDefined();
      expect(PERMISSIONS['cultivar:edit']).toBeDefined();
      expect(PERMISSIONS['cultivar:delete']).toBeDefined();
    });
  });

  describe('Role Permission Assignment', () => {
    it('should grant site_manager all batch permissions', () => {
      const siteManager = ROLES.site_manager;
      expect(siteManager.permissions).toContain('batch:view');
      expect(siteManager.permissions).toContain('batch:create');
      expect(siteManager.permissions).toContain('batch:update');
      expect(siteManager.permissions).toContain('batch:delete');
      expect(siteManager.permissions).toContain('batch:stage_change');
      expect(siteManager.permissions).toContain('batch:quarantine');
      expect(siteManager.permissions).toContain('batch:harvest');
      expect(siteManager.permissions).toContain('batch:assign_pod');
    });

    it('should grant site_manager all cultivar permissions', () => {
      const siteManager = ROLES.site_manager;
      expect(siteManager.permissions).toContain('cultivar:view');
      expect(siteManager.permissions).toContain('cultivar:create');
      expect(siteManager.permissions).toContain('cultivar:edit');
      expect(siteManager.permissions).toContain('cultivar:delete');
    });

    it('should grant head_grower all batch permissions', () => {
      const headGrower = ROLES.head_grower;
      expect(headGrower.permissions).toContain('batch:view');
      expect(headGrower.permissions).toContain('batch:create');
      expect(headGrower.permissions).toContain('batch:update');
      expect(headGrower.permissions).toContain('batch:stage_change');
      expect(headGrower.permissions).toContain('batch:quarantine');
      expect(headGrower.permissions).toContain('batch:harvest');
      expect(headGrower.permissions).toContain('batch:assign_pod');
    });

    it('should grant head_grower all cultivar permissions', () => {
      const headGrower = ROLES.head_grower;
      expect(headGrower.permissions).toContain('cultivar:view');
      expect(headGrower.permissions).toContain('cultivar:create');
      expect(headGrower.permissions).toContain('cultivar:edit');
      expect(headGrower.permissions).toContain('cultivar:delete');
    });

    it('should grant operator limited batch and cultivar permissions', () => {
      const operator = ROLES.operator;
      expect(operator.permissions).toContain('batch:view');
      expect(operator.permissions).toContain('batch:create');
      expect(operator.permissions).toContain('batch:update');
      expect(operator.permissions).toContain('cultivar:view');
      
      // Operator should NOT have these permissions
      expect(operator.permissions).not.toContain('batch:delete');
      expect(operator.permissions).not.toContain('cultivar:create');
      expect(operator.permissions).not.toContain('cultivar:edit');
      expect(operator.permissions).not.toContain('cultivar:delete');
    });

    it('should grant compliance_qa quarantine permission but not others', () => {
      const complianceQA = ROLES.compliance_qa;
      expect(complianceQA.permissions).toContain('batch:view');
      expect(complianceQA.permissions).toContain('batch:quarantine');
      expect(complianceQA.permissions).toContain('cultivar:view');
      
      // Should NOT have creation/editing permissions
      expect(complianceQA.permissions).not.toContain('batch:create');
      expect(complianceQA.permissions).not.toContain('batch:harvest');
      expect(complianceQA.permissions).not.toContain('cultivar:create');
    });

    it('should grant executive_viewer only view permissions', () => {
      const executiveViewer = ROLES.executive_viewer;
      expect(executiveViewer.permissions).toContain('batch:view');
      expect(executiveViewer.permissions).toContain('cultivar:view');
      
      // Should NOT have any modification permissions
      expect(executiveViewer.permissions).not.toContain('batch:create');
      expect(executiveViewer.permissions).not.toContain('batch:update');
      expect(executiveViewer.permissions).not.toContain('cultivar:create');
    });
  });

  describe('Permission Checks', () => {
    it('should allow head_grower to harvest batches', () => {
      expect(canPerformAction('head_grower', 'batch:harvest').allowed).toBe(true);
    });

    it('should allow site_manager to manage cultivars', () => {
      expect(canPerformAction('site_manager', 'cultivar:create').allowed).toBe(true);
      expect(canPerformAction('site_manager', 'cultivar:edit').allowed).toBe(true);
      expect(canPerformAction('site_manager', 'cultivar:delete').allowed).toBe(true);
    });

    it('should NOT allow operator to delete cultivars', () => {
      expect(canPerformAction('operator', 'cultivar:delete').allowed).toBe(false);
    });

    it('should NOT allow executive_viewer to modify batches', () => {
      expect(canPerformAction('executive_viewer', 'batch:create').allowed).toBe(false);
      expect(canPerformAction('executive_viewer', 'batch:update').allowed).toBe(false);
    });

    it('should allow compliance_qa to quarantine batches', () => {
      expect(canPerformAction('compliance_qa', 'batch:quarantine').allowed).toBe(true);
    });

    it('should allow org_admin all permissions (wildcard)', () => {
      expect(canPerformAction('org_admin', 'batch:harvest').allowed).toBe(true);
      expect(canPerformAction('org_admin', 'batch:assign_pod').allowed).toBe(true);
      expect(canPerformAction('org_admin', 'cultivar:create').allowed).toBe(true);
      expect(canPerformAction('org_admin', 'cultivar:delete').allowed).toBe(true);
    });
  });
});
