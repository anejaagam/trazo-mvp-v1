import type { PermissionKey, PermissionContext, RoleKey } from './types'
import { ROLES } from './roles'
import { PERMISSIONS } from './permissions'

/**
 * Core permission checking logic for Trazo MVP RBAC system
 */

export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiresContext?: boolean
}

/**
 * Check if a user role has a specific permission
 */
export function canPerformAction(
  userRole: RoleKey,
  permission: PermissionKey,
  additionalPermissions: string[] = []
): PermissionCheckResult {
  const role = ROLES[userRole]
  if (!role) {
    return {
      allowed: false,
      reason: `Invalid role: ${userRole}`
    }
  }

  // Check if role has wildcard permission
  if (role.permissions.includes('*')) {
    return { allowed: true }
  }

  // Check if role has the specific permission
  if (role.permissions.includes(permission)) {
    return { allowed: true }
  }

  // Check additional user-specific permissions
  if (additionalPermissions.includes(permission)) {
    return { allowed: true }
  }

  // Check wildcard patterns (e.g., 'batch:*' matches 'batch:view')
  const [resource] = permission.split(':')
  const wildcardPermission = `${resource}:*`
  if (role.permissions.includes(wildcardPermission) || additionalPermissions.includes(wildcardPermission)) {
    return { allowed: true }
  }

  // Check for resource-level wildcard permissions
  if (role.permissions.some(p => p.endsWith(':*') && permission.startsWith(p.replace(':*', ':')))) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: `Role '${role.name}' does not have permission '${permission}'`
  }
}

/**
 * Check multiple permissions at once
 */
export function canPerformActions(
  userRole: RoleKey,
  permissions: PermissionKey[],
  additionalPermissions: string[] = []
): Record<PermissionKey, PermissionCheckResult> {
  const results: Record<string, PermissionCheckResult> = {}

  for (const permission of permissions) {
    results[permission] = canPerformAction(
      userRole,
      permission,
      additionalPermissions
    )
  }

  return results
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(roleKey: RoleKey): PermissionKey[] {
  const role = ROLES[roleKey]
  if (!role) return []

  // If role has wildcard, return all permissions
  if (role.permissions.includes('*')) {
    return Object.keys(PERMISSIONS) as PermissionKey[]
  }

  // Expand wildcard patterns
  const expandedPermissions: PermissionKey[] = []
  
  for (const permission of role.permissions) {
    if (permission.endsWith(':*')) {
      // Expand wildcard (e.g., 'batch:*' → all batch permissions)
      const resource = permission.replace(':*', '')
      const resourcePermissions = Object.keys(PERMISSIONS).filter(p => 
        p.startsWith(`${resource}:`)
      ) as PermissionKey[]
      expandedPermissions.push(...resourcePermissions)
    } else if (permission in PERMISSIONS) {
      expandedPermissions.push(permission as PermissionKey)
    }
  }

  // Remove duplicates
  return [...new Set(expandedPermissions)]
}

/**
 * Check if user has any of the required permissions (OR logic)
 */
export function hasAnyPermission(
  userRole: RoleKey,
  permissions: PermissionKey[],
  additionalPermissions: string[] = []
): boolean {
  return permissions.some(permission =>
    canPerformAction(userRole, permission, additionalPermissions).allowed
  )
}

/**
 * Check if user has all required permissions (AND logic)
 */
export function hasAllPermissions(
  userRole: RoleKey,
  permissions: PermissionKey[],
  additionalPermissions: string[] = []
): boolean {
  return permissions.every(permission =>
    canPerformAction(userRole, permission, additionalPermissions).allowed
  )
}

/**
 * Permission guard for UI components - throws error if permission denied
 */
export function requirePermission(
  userRole: RoleKey,
  permission: PermissionKey,
  additionalPermissions: string[] = []
): void {
  const result = canPerformAction(userRole, permission, additionalPermissions)
  if (!result.allowed) {
    throw new Error(result.reason || `Permission denied: ${permission}`)
  }
}

/**
 * Safe permission check that never throws
 */
export function checkPermission(
  userRole: RoleKey | null | undefined,
  permission: PermissionKey,
  additionalPermissions: string[] = []
): boolean {
  if (!userRole) return false
  
  try {
    return canPerformAction(userRole, permission, additionalPermissions).allowed
  } catch {
    return false
  }
}

/**
 * Filter data based on permissions
 */
export function filterByPermission<T>(
  items: T[],
  userRole: RoleKey,
  getRequiredPermission: (item: T) => PermissionKey,
  additionalPermissions: string[] = []
): T[] {
  return items.filter(item => {
    const requiredPermission = getRequiredPermission(item)
    return canPerformAction(userRole, requiredPermission, additionalPermissions).allowed
  })
}

/**
 * Context-aware permission checking for organization/site scoped permissions
 */
export function canPerformActionInContext(
  userRole: RoleKey,
  permission: PermissionKey,
  context: PermissionContext,
  additionalPermissions: string[] = []
): PermissionCheckResult {
  // First check basic permission
  const basicCheck = canPerformAction(userRole, permission, additionalPermissions)
  if (!basicCheck.allowed) {
    return basicCheck
  }

  // Additional context-based checks can be added here
  // For example: site-scoped permissions, time-based permissions, etc.
  // The context parameter is available for future enhancements
  console.debug('Permission context:', context)
  
  return { allowed: true }
}

/**
 * Utility for generating permission matrices (useful for admin interfaces)
 */
export function generatePermissionMatrix(): Record<RoleKey, PermissionKey[]> {
  const matrix: Record<string, PermissionKey[]> = {}
  
  for (const roleKey of Object.keys(ROLES) as RoleKey[]) {
    matrix[roleKey] = getRolePermissions(roleKey)
  }
  
  return matrix
}

/**
 * Check if a role is time-limited and if it has expired
 */
export function isRoleTimeExpired(
  roleKey: RoleKey,
  assignedAt: Date,
  now: Date = new Date()
): boolean {
  const role = ROLES[roleKey]
  if (!role?.timeLimit) return false
  
  const expireTime = new Date(assignedAt.getTime() + (role.timeLimit * 60 * 1000))
  return now > expireTime
}

/**
 * Static class for common permission checks
 */
export class RoleGuard {
  static hasPermission(userRole: RoleKey, permission: PermissionKey, additionalPermissions: string[] = []): boolean {
    return checkPermission(userRole, permission, additionalPermissions)
  }

  static canPerform(userRole: RoleKey, permission: PermissionKey, additionalPermissions: string[] = []): PermissionCheckResult {
    return canPerformAction(userRole, permission, additionalPermissions)
  }

  static hasAnyPermission(userRole: RoleKey, permissions: PermissionKey[], additionalPermissions: string[] = []): boolean {
    return hasAnyPermission(userRole, permissions, additionalPermissions)
  }

  static hasAllPermissions(userRole: RoleKey, permissions: PermissionKey[], additionalPermissions: string[] = []): boolean {
    return hasAllPermissions(userRole, permissions, additionalPermissions)
  }
}