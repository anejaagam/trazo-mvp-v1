'use client'

import { useCallback } from 'react'
import type { PermissionKey, RoleKey } from '@/lib/rbac/types'
import { canPerformAction, checkPermission, hasAnyPermission, hasAllPermissions } from '@/lib/rbac/guards'

export interface UsePermissionsReturn {
  can: (permission: PermissionKey) => boolean
  cannot: (permission: PermissionKey) => boolean
  hasAny: (permissions: PermissionKey[]) => boolean
  hasAll: (permissions: PermissionKey[]) => boolean
  requirePermission: (permission: PermissionKey) => void
}

/**
 * React hook for checking user permissions based on their role
 * Requires user context to be available (useAuth or similar)
 */
export function usePermissions(
  userRole: RoleKey | null | undefined,
  additionalPermissions: string[] = []
): UsePermissionsReturn {
  
  const can = useCallback((permission: PermissionKey): boolean => {
    return checkPermission(userRole, permission, additionalPermissions)
  }, [userRole, additionalPermissions])

  const cannot = useCallback((permission: PermissionKey): boolean => {
    return !can(permission)
  }, [can])

  const hasAny = useCallback((permissions: PermissionKey[]): boolean => {
    if (!userRole) return false
    return hasAnyPermission(userRole, permissions, additionalPermissions)
  }, [userRole, additionalPermissions])

  const hasAll = useCallback((permissions: PermissionKey[]): boolean => {
    if (!userRole) return false
    return hasAllPermissions(userRole, permissions, additionalPermissions)
  }, [userRole, additionalPermissions])

  const requirePermission = useCallback((permission: PermissionKey): void => {
    if (!userRole) {
      throw new Error('User not authenticated')
    }
    
    const result = canPerformAction(userRole, permission, additionalPermissions)
    if (!result.allowed) {
      throw new Error(result.reason || `Permission denied: ${permission}`)
    }
  }, [userRole, additionalPermissions])

  return {
    can,
    cannot,
    hasAny,
    hasAll,
    requirePermission,
  }
}

// Convenience hook for checking single permission
export function usePermission(
  permission: PermissionKey,
  userRole: RoleKey | null | undefined,
  additionalPermissions: string[] = []
): boolean {
  return checkPermission(userRole, permission, additionalPermissions)
}