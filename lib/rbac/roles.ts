import type { Role, RoleKey } from './types'

// Comprehensive role definitions for Trazo MVP
export const ROLES: Record<RoleKey, Role> = {
  org_admin: {
    id: 'org_admin',
    name: 'Organization Admin',
    description: 'Full administrative access to the organization',
    isSystemRole: true,
    permissions: ['*'], // Full access to everything
  },

  site_manager: {
    id: 'site_manager', 
    name: 'Site Manager',
    description: 'Manages operations for specific sites within the organization',
    isSystemRole: true,
    permissions: [
      'dashboard:view',
      // User management (site-scoped)
      'user:view',
      'user:create', 
      'user:update',
      'user:invite',
      'role:assign',
      
      // Full batch management
      'batch:view',
      'batch:create',
      'batch:update', 
      'batch:delete',
      'batch:stage_change',
      'batch:quarantine',
      'batch:harvest',
      'batch:assign_pod',
      'batch:tasks_link',
      'batch:packet_generate',
      
      // Full cultivar management
      'cultivar:view',
      'cultivar:create',
      'cultivar:edit',
      'cultivar:delete',
      
      // Full inventory management
      'inventory:view',
      'inventory:create',
      'inventory:update',
      'inventory:delete',
      'inventory:consume',
      'inventory:waste',
      'inventory:transfer',
      
      // Full waste management
      'waste:view',
      'waste:create',
      'waste:update',
      'waste:delete',
      'waste:witness',
      'waste:export',
      
      // Full task management
      'task:view',
      'task:create',
      'task:update',
      'task:assign',
      'task:complete',
      'task:retain_original_evidence',
      'task:delete',
      
      // Full control management
      'control:view',
      'control:override',
      'control:recipe_create',
      'control:recipe_edit',
      'control:recipe_delete',
      'control:recipe_apply',
      'control:schedule',
      
      // Alarm management
      'alarm:view',
      'alarm:ack',
      'alarm:resolve',
      'alarm:configure',
      'alarm:policy_edit',
      
      // Compliance access
      'compliance:view',
      'compliance:export',
      'compliance:report_create',
      'compliance:sync',
      'evidence:upload',
      'evidence:lock',
      'audit:view',
      
      // Monitoring
      'monitoring:view',
      'monitoring:export',
      
      // Equipment Control (AUTO Mode) - Full access
      'equipment:control:manual',
      'equipment:control:auto',
      'equipment:override',
    ],
  },

  head_grower: {
    id: 'head_grower',
    name: 'Head Grower', 
    description: 'Senior cultivation expert responsible for crop production',
    isSystemRole: true,
    permissions: [
      'dashboard:view',
      // Batch management (full)
      'batch:view',
      'batch:create',
      'batch:update',
      'batch:stage_change',
      'batch:quarantine',
      'batch:harvest',
      'batch:assign_pod',
      'batch:tasks_link',
      'batch:packet_generate',
      
      // Cultivar management (full)
      'cultivar:view',
      'cultivar:create',
      'cultivar:edit',
      'cultivar:delete',
      
      // Recipe and control management
      'control:view',
      'control:recipe_create',
      'control:recipe_edit',
      'control:recipe_delete',
      'control:recipe_apply',
      'control:schedule',
      'control:override',
      
      // Task management
      'task:view',
      'task:create',
      'task:update',
      'task:assign',
      'task:complete',
      'task:retain_original_evidence',
      
      // Full inventory management
      'inventory:view',
      'inventory:create',
      'inventory:update',
      'inventory:delete',
      'inventory:consume',
      'inventory:waste',
      'inventory:transfer',
      
      // Waste management
      'waste:view',
      'waste:create',
      'waste:update',
      'waste:delete',
      'waste:witness',
      'waste:export',
      
      // Alarm handling
      'alarm:view',
      'alarm:ack',
      'alarm:resolve',
      
      // Monitoring
      'monitoring:view',
      'monitoring:export',
      
      // Pod configuration
      'pod:configure',
      'pod:calibrate',
      
      // Equipment Control (AUTO Mode) - Full access
      'equipment:control:manual',
      'equipment:control:auto',
      'equipment:override',
      
      // Evidence collection
      'evidence:upload',
    ],
  },

  operator: {
    id: 'operator',
    name: 'Operator',
    description: 'Day-to-day operations and task execution',
    isSystemRole: true,
    permissions: [
      'dashboard:view',
      // Basic batch viewing and creation
      'batch:view',
      'batch:create',
      'batch:update', // Basic updates like plant counts
      
      // Basic cultivar viewing
      'cultivar:view',
      
      // Basic inventory operations
      'inventory:view',
      'inventory:consume',
      
      // Waste recording and witnessing
      'waste:view',
      'waste:create',
      'waste:witness',
      
      // Task execution
      'task:view',
      'task:complete',
      'task:update', // Status updates only
      
      // Limited control access
      'control:view',
      'control:override', // Emergency overrides only
      
      // Alarm acknowledgment
      'alarm:view',
      'alarm:ack',
      
      // Monitoring
      'monitoring:view',
      
      // Equipment Control - Manual only (no AUTO mode for operators)
      'equipment:control:manual',
      'equipment:override', // Emergency overrides
      
      // Evidence capture
      'evidence:upload',
    ],
  },

  compliance_qa: {
    id: 'compliance_qa',
    name: 'Compliance/QA Manager',
    description: 'Manages compliance, quality assurance, and regulatory requirements',
    isSystemRole: true,
    permissions: [
      'dashboard:view',
      // Full compliance access
      'compliance:view',
      'compliance:export',
      'compliance:submit',
      'compliance:report_create',
      'compliance:sync',
      
      // Evidence management
      'evidence:upload',
      'evidence:lock',
      'evidence:delete',
      
      // Audit access
      'audit:view',
      
      // Viewing access to operations
      'batch:view',
      'batch:quarantine', // Can quarantine batches for QA issues
      'batch:packet_generate', // Can generate batch packets for compliance
      'cultivar:view',
      'inventory:view',
      'task:view',
      'alarm:view',
      'monitoring:view',
      
      // Full waste management for compliance oversight
      'waste:view',
      'waste:create',
      'waste:update',
      'waste:delete',
      'waste:witness',
      'waste:export',
      
      // Task management for compliance tasks
      'task:create',
      'task:assign',
      'task:update',
      'task:retain_original_evidence',
    ],
  },

  executive_viewer: {
    id: 'executive_viewer',
    name: 'Executive Viewer',
    description: 'Read-only access for executives and stakeholders',
    isSystemRole: true,
    permissions: [
      'dashboard:view',
      // View-only access across all areas
      'batch:view',
      'cultivar:view',
      'inventory:view',
      'waste:view',
      'task:view',
      'compliance:view',
      'alarm:view',
      'monitoring:view',
      'audit:view',
      
      // Export capabilities for reporting
      'compliance:export',
      'monitoring:export',
    ],
  },

  installer_tech: {
    id: 'installer_tech',
    name: 'Installer/Technician',
    description: 'Technical installation and maintenance access (time-limited)',
    isSystemRole: true,
    timeLimit: 480, // 8 hours in minutes
    permissions: [
      'dashboard:view',
      // System-level access
      'pod:configure',
      'pod:calibrate',
      'device:diagnose',
      'system:test',
      
      // Limited operational viewing
      'monitoring:view',
      'alarm:view',
      
      // Control system access
      'control:view',
      'control:override',
    ],
  },

  support: {
    id: 'support',
    name: 'Support (Read-Only)',
    description: 'Customer support with read-only access (time-limited)',
    isSystemRole: true,
    timeLimit: 240, // 4 hours in minutes
    permissions: [
      'dashboard:view',
      // Read-only operational access
      'batch:view',
      'inventory:view',
      'task:view',
      'alarm:view',
      'monitoring:view',
      'user:view',
      
      // System diagnostics
      'device:diagnose',
      'system:test',
    ],
  },

  developer: {
    id: 'developer',
    name: 'Developer',
    description: 'Platform developer with full access for debugging and organization approval',
    isSystemRole: true,
    permissions: ['*'], // Full access to everything including dev-specific features
  },
}

// Helper functions
export function getRoleById(roleId: RoleKey): Role | undefined {
  return ROLES[roleId]
}

export function getAllRoles(): Role[] {
  return Object.values(ROLES)
}

export function getOperationalRoles(): Role[] {
  return Object.values(ROLES).filter(role => 
    !['installer_tech', 'support'].includes(role.id)
  )
}

export function getTimeLimitedRoles(): Role[] {
  return Object.values(ROLES).filter(role => role.timeLimit !== undefined)
}

export function isValidRole(roleKey: string): roleKey is RoleKey {
  return roleKey in ROLES
}

// Role hierarchy helper (for UI organization)
export const ROLE_HIERARCHY = {
  administrative: ['org_admin', 'site_manager'],
  operational: ['head_grower', 'operator'],
  specialized: ['compliance_qa', 'executive_viewer'],
  temporary: ['installer_tech', 'support'],
  developer: ['developer'],
} as const

export function getRolesByCategory(category: keyof typeof ROLE_HIERARCHY): Role[] {
  return ROLE_HIERARCHY[category].map(roleId => ROLES[roleId])
}