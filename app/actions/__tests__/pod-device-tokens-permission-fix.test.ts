/**
 * Test for permission checking fix in pod-device-tokens
 * 
 * Verifies that canPerformAction return value is properly checked
 */

import { canPerformAction } from '@/lib/rbac/guards'

describe('Pod Device Tokens - Permission Check Fix', () => {
  describe('canPerformAction return type handling', () => {
    it('should return object with allowed property for org_admin', () => {
      const result = canPerformAction('org_admin', 'org:integrations')
      
      expect(result).toHaveProperty('allowed')
      expect(typeof result.allowed).toBe('boolean')
      expect(result.allowed).toBe(true)
    })

    it('should return object with allowed property for site_manager', () => {
      const result = canPerformAction('site_manager', 'user:create')
      
      expect(result).toHaveProperty('allowed')
      expect(typeof result.allowed).toBe('boolean')
      expect(result.allowed).toBe(true)
    })

    it('should return object with allowed=false for insufficient permissions', () => {
      const result = canPerformAction('operator', 'org:integrations')
      
      expect(result).toHaveProperty('allowed')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBeDefined()
    })

    it('should handle wildcard permissions correctly', () => {
      // org_admin has '*' permission
      const orgAdminIntegrations = canPerformAction('org_admin', 'org:integrations')
      const orgAdminUserCreate = canPerformAction('org_admin', 'user:create')
      
      expect(orgAdminIntegrations.allowed).toBe(true)
      expect(orgAdminUserCreate.allowed).toBe(true)
    })

    it('should validate multiple permissions correctly', () => {
      const hasOrgIntegrations = canPerformAction('org_admin', 'org:integrations')
      const hasUserCreate = canPerformAction('org_admin', 'user:create')
      
      // This mimics the fixed validation logic
      const isAuthorized = hasOrgIntegrations.allowed || hasUserCreate.allowed
      
      expect(isAuthorized).toBe(true)
    })
  })
})
