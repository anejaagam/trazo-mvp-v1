import type { RoleKey } from './types'

// Define a simple role hierarchy for assignment constraints
export const ROLE_RANK: Record<RoleKey, number> = {
  developer: 200, // Highest rank - platform developers
  org_admin: 100,
  site_manager: 80,
  head_grower: 70,
  compliance_qa: 60,
  executive_viewer: 50,
  operator: 40,
  installer_tech: 30,
  support: 20,
}

/**
 * Returns true if inviter can assign targetRole.
 * - org_admin can assign any role (including org_admin)
 * - others can only assign strictly lower-ranked roles
 */
export function canAssignRole(inviterRole: RoleKey, targetRole: RoleKey): boolean {
  if (inviterRole === 'org_admin') return true
  const inviterRank = ROLE_RANK[inviterRole] ?? 0
  const targetRank = ROLE_RANK[targetRole] ?? 0
  return targetRank < inviterRank
}
