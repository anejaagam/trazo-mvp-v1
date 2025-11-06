// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// In a production environment, these would come from environment variables
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching the spec
export type UserStatus = 'Invited' | 'Active' | 'Suspended' | 'Deactivated';
export type RoleName = 'org_admin' | 'site_manager' | 'head_grower' | 'operator' | 'installer' | 'compliance' | 'exec_viewer' | 'support_ro';
export type ScopeType = 'org' | 'site' | 'room' | 'batch_group';
export type IdpType = 'local' | 'oidc' | 'saml';

export interface User {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  idp: IdpType;
  last_login_utc?: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: RoleName;
  display_name: string;
  permissions: string[];
  description: string;
}

export interface RoleBinding {
  id: string;
  user_id: string;
  role_id: string;
  scope_type: ScopeType;
  scope_id: string;
  scope_name?: string;
  created_by: string;
  created_at_utc: string;
  expires_at_utc?: string;
}

export interface ApiToken {
  id: string;
  name: string;
  scope_type: 'site';
  scope_id: string;
  scope_name?: string;
  hash: string;
  created_by: string;
  created_at_utc: string;
  last_used_utc?: string;
  revoked_at_utc?: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string;
  actor_name?: string;
  subject_id?: string;
  subject_name?: string;
  action: string;
  reason?: string;
  ip?: string;
  user_agent?: string;
  ts_utc: string;
  attrs?: Record<string, any>;
}

export interface Session {
  id: string;
  user_id: string;
  issued_at_utc: string;
  expires_at_utc: string;
  last_mfa_at_utc?: string;
  ip?: string;
  user_agent?: string;
  kiosk?: boolean;
}

export interface MfaPolicy {
  step_up_actions: string[];
  ttl_hours: number;
}

// Permission definitions
export const PERMISSIONS = {
  // User management
  'users.invite': 'Invite new users',
  'users.manage': 'Manage user status and roles',
  'users.view': 'View user list',
  
  // Role management
  'roles.assign': 'Assign roles to users',
  'roles.manage': 'Create and modify roles',
  
  // Recipe management
  'recipes.publish': 'Publish recipes (requires step-up)',
  'recipes.edit': 'Edit recipes',
  'recipes.view': 'View recipes',
  
  // Control actions
  'control.override': 'Issue manual overrides (requires step-up)',
  'control.adjust': 'Adjust setpoints',
  'control.view': 'View control status',
  
  // Evidence & compliance
  'evidence.lock': 'Lock evidence (requires step-up)',
  'evidence.redact': 'Redact evidence (requires step-up)',
  'evidence.view': 'View evidence',
  
  // Routing & alarms
  'routing.edit': 'Edit alarm routing (requires step-up)',
  'routing.view': 'View routing config',
  
  // Tasks
  'tasks.complete': 'Complete tasks',
  'tasks.manage': 'Manage task templates',
  'tasks.view': 'View tasks',
  
  // API & tokens
  'tokens.create': 'Create API tokens (requires step-up)',
  'tokens.rotate': 'Rotate API tokens (requires step-up)',
  'tokens.revoke': 'Revoke API tokens',
  
  // Audit
  'audit.export': 'Export audit logs',
  'audit.view': 'View audit logs',
  
  // Organization
  'org.configure': 'Configure organization settings',
  'org.view': 'View organization info',
};

// Role → Permission mappings
export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  org_admin: Object.keys(PERMISSIONS), // All permissions
  
  site_manager: [
    'users.invite', 'users.view', 'roles.assign',
    'recipes.publish', 'recipes.edit', 'recipes.view',
    'control.override', 'control.adjust', 'control.view',
    'evidence.view', 'routing.edit', 'routing.view',
    'tasks.complete', 'tasks.manage', 'tasks.view',
    'tokens.create', 'tokens.rotate', 'tokens.revoke',
    'audit.view', 'org.view',
  ],
  
  head_grower: [
    'recipes.publish', 'recipes.edit', 'recipes.view',
    'control.override', 'control.adjust', 'control.view',
    'tasks.complete', 'tasks.view',
    'audit.view', 'org.view',
  ],
  
  operator: [
    'recipes.view',
    'control.adjust', 'control.view',
    'tasks.complete', 'tasks.view',
    'org.view',
  ],
  
  installer: [
    'control.view',
    'tasks.complete', 'tasks.view',
    'org.view',
  ],
  
  compliance: [
    'recipes.view',
    'evidence.lock', 'evidence.redact', 'evidence.view',
    'audit.export', 'audit.view',
    'org.view',
  ],
  
  exec_viewer: [
    'recipes.view',
    'control.view',
    'evidence.view',
    'tasks.view',
    'audit.view',
    'org.view',
  ],
  
  support_ro: [
    'recipes.view',
    'control.view',
    'tasks.view',
    'org.view',
  ],
};

// Step-up required actions (default)
export const STEP_UP_ACTIONS = [
  'recipes.publish',
  'control.override',
  'evidence.lock',
  'evidence.redact',
  'routing.edit',
  'tokens.create',
  'tokens.rotate',
];
