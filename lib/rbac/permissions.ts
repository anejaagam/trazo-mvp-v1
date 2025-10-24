import type { Permission, PermissionKey } from './types'

// Comprehensive permission definitions for Trazo MVP
export const PERMISSIONS: Record<PermissionKey, Permission> = {
  // Dashboard
  'dashboard:view': {
    key: 'dashboard:view',
    name: 'View Dashboard',
    description: 'Access the dashboard overview',
    resource: 'dashboard',
    action: 'view'
  },
  // Batch permissions
  'batch:view': {
    key: 'batch:view',
    name: 'View Batches',
    description: 'View batch information and details',
    resource: 'batch',
    action: 'view'
  },
  'batch:create': {
    key: 'batch:create',
    name: 'Create Batches',
    description: 'Create new batches and initiate batch lifecycle',
    resource: 'batch',
    action: 'create'
  },
  'batch:update': {
    key: 'batch:update',
    name: 'Update Batches',
    description: 'Edit batch details, plant counts, and metadata',
    resource: 'batch',
    action: 'update'
  },
  'batch:delete': {
    key: 'batch:delete',
    name: 'Delete Batches',
    description: 'Delete batches (with proper compliance)',
    resource: 'batch',
    action: 'delete'
  },
  'batch:stage_change': {
    key: 'batch:stage_change',
    name: 'Change Batch Stages',
    description: 'Transition batches between lifecycle stages',
    resource: 'batch',
    action: 'stage_change'
  },
  'batch:quarantine': {
    key: 'batch:quarantine',
    name: 'Quarantine Batches',
    description: 'Place batches in quarantine and manage quarantine status',
    resource: 'batch',
    action: 'quarantine'
  },

  // Inventory permissions
  'inventory:view': {
    key: 'inventory:view',
    name: 'View Inventory',
    description: 'View inventory items, quantities, and locations',
    resource: 'inventory',
    action: 'view'
  },
  'inventory:create': {
    key: 'inventory:create',
    name: 'Create Inventory Items',
    description: 'Add new inventory items to the system',
    resource: 'inventory',
    action: 'create'
  },
  'inventory:update': {
    key: 'inventory:update',
    name: 'Update Inventory',
    description: 'Edit inventory item details and configurations',
    resource: 'inventory',
    action: 'update'
  },
  'inventory:delete': {
    key: 'inventory:delete',
    name: 'Delete Inventory Items',
    description: 'Remove inventory items from the system',
    resource: 'inventory',
    action: 'delete'
  },
  'inventory:consume': {
    key: 'inventory:consume',
    name: 'Record Consumption',
    description: 'Record inventory consumption and usage',
    resource: 'inventory',
    action: 'consume'
  },
  'inventory:waste': {
    key: 'inventory:waste',
    name: 'Record Waste Disposal',
    description: 'Record waste disposal with compliance documentation',
    resource: 'inventory',
    action: 'waste'
  },
  'inventory:transfer': {
    key: 'inventory:transfer',
    name: 'Transfer Inventory',
    description: 'Transfer inventory between locations or facilities',
    resource: 'inventory',
    action: 'transfer'
  },

  // Task permissions
  'task:view': {
    key: 'task:view',
    name: 'View Tasks',
    description: 'View tasks and workflows',
    resource: 'task',
    action: 'view'
  },
  'task:create': {
    key: 'task:create',
    name: 'Create Tasks',
    description: 'Create new tasks and workflows',
    resource: 'task',
    action: 'create'
  },
  'task:update': {
    key: 'task:update',
    name: 'Update Tasks',
    description: 'Edit task details and requirements',
    resource: 'task',
    action: 'update'
  },
  'task:assign': {
    key: 'task:assign',
    name: 'Assign Tasks',
    description: 'Assign tasks to users and manage assignments',
    resource: 'task',
    action: 'assign'
  },
  'task:complete': {
    key: 'task:complete',
    name: 'Complete Tasks',
    description: 'Mark tasks as complete and provide evidence',
    resource: 'task',
    action: 'complete'
  },
  'task:delete': {
    key: 'task:delete',
    name: 'Delete Tasks',
    description: 'Delete tasks and workflows',
    resource: 'task',
    action: 'delete'
  },

  // Control permissions
  'control:view': {
    key: 'control:view',
    name: 'View Controls',
    description: 'View environmental controls and settings',
    resource: 'control',
    action: 'view'
  },
  'control:override': {
    key: 'control:override',
    name: 'Manual Override',
    description: 'Perform manual overrides of environmental controls',
    resource: 'control',
    action: 'override'
  },
  'control:manual_override': {
    key: 'control:manual_override',
    name: 'Manual Override',
    description: 'Perform manual overrides of environmental controls',
    resource: 'control',
    action: 'manual_override'
  },
  'control:recipe_create': {
    key: 'control:recipe_create',
    name: 'Create Recipes',
    description: 'Create new environmental control recipes',
    resource: 'control',
    action: 'recipe_create'
  },
  'control:recipe_edit': {
    key: 'control:recipe_edit',
    name: 'Edit Recipes',
    description: 'Modify existing environmental control recipes',
    resource: 'control',
    action: 'recipe_edit'
  },
  'control:recipe_delete': {
    key: 'control:recipe_delete',
    name: 'Delete Recipes',
    description: 'Delete environmental control recipes',
    resource: 'control',
    action: 'recipe_delete'
  },
  'control:recipe_apply': {
    key: 'control:recipe_apply',
    name: 'Apply Recipes',
    description: 'Apply recipes to pods and batches',
    resource: 'control',
    action: 'recipe_apply'
  },
  'control:schedule': {
    key: 'control:schedule',
    name: 'Manage Schedules',
    description: 'Create and manage control schedules',
    resource: 'control',
    action: 'schedule'
  },

  // Alarm permissions
  'alarm:view': {
    key: 'alarm:view',
    name: 'View Alarms',
    description: 'View active and historical alarms',
    resource: 'alarm',
    action: 'view'
  },
  'alarm:ack': {
    key: 'alarm:ack',
    name: 'Acknowledge Alarms',
    description: 'Acknowledge active alarms',
    resource: 'alarm',
    action: 'ack'
  },
  'alarm:resolve': {
    key: 'alarm:resolve',
    name: 'Resolve Alarms',
    description: 'Mark alarms as resolved',
    resource: 'alarm',
    action: 'resolve'
  },
  'alarm:configure': {
    key: 'alarm:configure',
    name: 'Configure Alarms',
    description: 'Configure alarm thresholds and settings',
    resource: 'alarm',
    action: 'configure'
  },
  'alarm:policy_edit': {
    key: 'alarm:policy_edit',
    name: 'Edit Alarm Policies',
    description: 'Create and modify alarm policies',
    resource: 'alarm',
    action: 'policy_edit'
  },

  // Compliance permissions
  'compliance:view': {
    key: 'compliance:view',
    name: 'View Compliance Data',
    description: 'View compliance reports and audit trails',
    resource: 'compliance',
    action: 'view'
  },
  'compliance:create': {
    key: 'compliance:create',
    name: 'Create Compliance Data',
    description: 'Create compliance records and documentation',
    resource: 'compliance',
    action: 'create'
  },
  'compliance:export': {
    key: 'compliance:export',
    name: 'Export Compliance Reports',
    description: 'Export compliance data and reports',
    resource: 'compliance',
    action: 'export'
  },
  'compliance:submit': {
    key: 'compliance:submit',
    name: 'Submit Compliance Reports',
    description: 'Submit official compliance reports to authorities',
    resource: 'compliance',
    action: 'submit'
  },
  'compliance:report_create': {
    key: 'compliance:report_create',
    name: 'Create Compliance Reports',
    description: 'Generate new compliance reports',
    resource: 'compliance',
    action: 'report_create'
  },
  'evidence:upload': {
    key: 'evidence:upload',
    name: 'Upload Evidence',
    description: 'Upload photos, documents, and other evidence',
    resource: 'evidence',
    action: 'upload'
  },
  'evidence:lock': {
    key: 'evidence:lock',
    name: 'Lock Evidence',
    description: 'Lock evidence for audit protection',
    resource: 'evidence',
    action: 'lock'
  },
  'evidence:delete': {
    key: 'evidence:delete',
    name: 'Delete Evidence',
    description: 'Delete evidence files (admin only)',
    resource: 'evidence',
    action: 'delete'
  },
  'audit:view': {
    key: 'audit:view',
    name: 'View Audit Logs',
    description: 'View system audit trails and logs',
    resource: 'audit',
    action: 'view'
  },

  // User/Admin permissions
  'user:view': {
    key: 'user:view',
    name: 'View Users',
    description: 'View user accounts and profiles',
    resource: 'user',
    action: 'view'
  },
  'user:create': {
    key: 'user:create',
    name: 'Create Users',
    description: 'Create new user accounts',
    resource: 'user',
    action: 'create'
  },
  'user:update': {
    key: 'user:update',
    name: 'Update Users',
    description: 'Edit user account details',
    resource: 'user',
    action: 'update'
  },
  'user:delete': {
    key: 'user:delete',
    name: 'Delete Users',
    description: 'Deactivate or delete user accounts',
    resource: 'user',
    action: 'delete'
  },
  'user:invite': {
    key: 'user:invite',
    name: 'Invite Users',
    description: 'Send user invitations',
    resource: 'user',
    action: 'invite'
  },
  'role:assign': {
    key: 'role:assign',
    name: 'Assign Roles',
    description: 'Assign and modify user roles',
    resource: 'role',
    action: 'assign'
  },

  // System permissions
  'pod:configure': {
    key: 'pod:configure',
    name: 'Configure Pods',
    description: 'Configure pod settings and parameters',
    resource: 'pod',
    action: 'configure'
  },
  'pod:calibrate': {
    key: 'pod:calibrate',
    name: 'Calibrate Pods',
    description: 'Perform pod sensor calibration',
    resource: 'pod',
    action: 'calibrate'
  },
  'device:diagnose': {
    key: 'device:diagnose',
    name: 'Device Diagnostics',
    description: 'Run device diagnostics and troubleshooting',
    resource: 'device',
    action: 'diagnose'
  },
  'system:test': {
    key: 'system:test',
    name: 'System Testing',
    description: 'Perform system testing and validation',
    resource: 'system',
    action: 'test'
  },
  'system:backup': {
    key: 'system:backup',
    name: 'System Backup',
    description: 'Create and manage system backups',
    resource: 'system',
    action: 'backup'
  },
  'monitoring:view': {
    key: 'monitoring:view',
    name: 'View Monitoring Data',
    description: 'View environmental monitoring and telemetry',
    resource: 'monitoring',
    action: 'view'
  },
  'monitoring:export': {
    key: 'monitoring:export',
    name: 'Export Monitoring Data',
    description: 'Export monitoring data and reports',
    resource: 'monitoring',
    action: 'export'
  },

  // Organization permissions
  'org:settings': {
    key: 'org:settings',
    name: 'Organization Settings',
    description: 'Manage organization settings and configuration',
    resource: 'organization',
    action: 'settings'
  },
  'org:billing': {
    key: 'org:billing',
    name: 'Billing Management',
    description: 'Manage billing and subscription settings',
    resource: 'organization',
    action: 'billing'
  },
  'org:integrations': {
    key: 'org:integrations',
    name: 'Manage Integrations',
    description: 'Configure third-party integrations and SSO',
    resource: 'organization',
    action: 'integrations'
  },

  // Wildcard permission
  '*': {
    key: '*',
    name: 'All Permissions',
    description: 'Full system access (admin only)',
    resource: '*',
    action: '*'
  }
}

// Helper function to get permissions by resource
export function getPermissionsByResource(resource: string): Permission[] {
  return Object.values(PERMISSIONS).filter(permission => 
    permission.resource === resource || permission.resource === '*'
  )
}

// Helper function to check if permission exists
export function isValidPermission(permissionKey: string): permissionKey is PermissionKey {
  return permissionKey in PERMISSIONS
}