// RBAC Type Definitions for Trazo MVP
// Comprehensive role-based access control system

export interface Permission {
  key: string
  name: string
  description: string
  resource: string
  action: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystemRole: boolean
  timeLimit?: number // minutes, for temporary roles like installer_tech
}

export interface UserWithRole {
  id: string
  email: string
  full_name: string
  role: RoleKey
  organization_id: string
  additional_permissions?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RoleKey = 
  | 'org_admin'
  | 'site_manager' 
  | 'head_grower'
  | 'operator'
  | 'compliance_qa'
  | 'executive_viewer'
  | 'installer_tech'
  | 'support'

export type PermissionKey = 
  // Dashboard
  | 'dashboard:view'
  // Batch permissions
  | 'batch:view'
  | 'batch:create'
  | 'batch:update'
  | 'batch:delete'
  | 'batch:stage_change'
  | 'batch:quarantine'
  | 'batch:harvest'
  | 'batch:assign_pod'
  
  // Cultivar permissions
  | 'cultivar:view'
  | 'cultivar:create'
  | 'cultivar:edit'
  | 'cultivar:delete'
  
  // Inventory permissions
  | 'inventory:view'
  | 'inventory:create'
  | 'inventory:update'
  | 'inventory:delete'
  | 'inventory:consume'
  | 'inventory:waste'
  | 'inventory:transfer'
  
  // Task permissions
  | 'task:view'
  | 'task:create'
  | 'task:update'
  | 'task:assign'
  | 'task:complete'
  | 'task:delete'
  
  // Control permissions
  | 'control:view'
  | 'control:override'
  | 'control:manual_override'
  | 'control:recipe_create'
  | 'control:recipe_edit'
  | 'control:recipe_delete'
  | 'control:recipe_apply'
  | 'control:schedule'
  
  // Alarm permissions
  | 'alarm:view'
  | 'alarm:ack'
  | 'alarm:resolve'
  | 'alarm:configure'
  | 'alarm:policy_edit'
  
  // Compliance permissions
  | 'compliance:view'
  | 'compliance:create'
  | 'compliance:export'
  | 'compliance:submit'
  | 'compliance:report_create'
  | 'evidence:upload'
  | 'evidence:lock'
  | 'evidence:delete'
  | 'audit:view'
  
  // User/Admin permissions
  | 'user:view'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'user:invite'
  | 'role:assign'
  
  // System permissions
  | 'pod:configure'
  | 'pod:calibrate'
  | 'device:diagnose'
  | 'system:test'
  | 'system:backup'
  | 'monitoring:view'
  | 'monitoring:export'
  
  // Equipment Control permissions (AUTO Mode)
  | 'equipment:control:manual'
  | 'equipment:control:auto'
  | 'equipment:override'
  
  // Organization permissions
  | 'org:settings'
  | 'org:billing'
  | 'org:integrations'
  
  // Wildcard
  | '*'

export interface PermissionContext {
  organizationId: string
  siteId?: string
  userId?: string
  resource?: {
    type: string
    id: string
  }
}

export interface PermissionCheck {
  permission: PermissionKey
  context?: PermissionContext
  reason?: string
}

export interface RolePermissionMatrix {
  [key: string]: {
    role: Role
    permissions: Permission[]
  }
}