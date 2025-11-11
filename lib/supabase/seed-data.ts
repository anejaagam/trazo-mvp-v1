/**
 * Seed Data for Development & Testing
 * This file contains realistic sample data for all admin features
 */

import type { RoleKey } from '@/lib/rbac/types';

export interface SeedUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: RoleKey;
  organization_id: string;
  is_active: boolean;
  hire_date: string;
  last_sign_in?: string;
}

export interface SeedOrganization {
  id: string;
  name: string;
  data_region: 'us' | 'canada';
  jurisdiction: string;
  plant_type: 'cannabis' | 'produce';
  license_number: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  timezone: string;
  is_active: boolean;
}

export interface SeedSite {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  timezone: string;
  max_pods: number;
  is_active: boolean;
}

export interface SeedAuditEvent {
  id: string;
  user_id: string;
  organization_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  notes?: string;
}

// =====================================================
// ORGANIZATIONS
// =====================================================

export const SEED_ORGANIZATIONS: SeedOrganization[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'GreenLeaf Cultivation',
    data_region: 'us',
    jurisdiction: 'oregon_cannabis',
    plant_type: 'cannabis',
    license_number: 'OR-LIC-2024-001',
    contact_email: 'admin@greenleaf.example',
    contact_phone: '+1-503-555-0100',
    address: '1234 Cannabis Ave, Portland, OR 97201',
    timezone: 'America/Los_Angeles',
    is_active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Northern Farms Canada',
    data_region: 'canada',
    jurisdiction: 'canada_cannabis',
    plant_type: 'cannabis',
    license_number: 'CA-LIC-2024-002',
    contact_email: 'admin@northernfarms.example',
    contact_phone: '+1-604-555-0200',
    address: '5678 Maple St, Vancouver, BC V6B 1A1',
    timezone: 'America/Vancouver',
    is_active: true,
  },
];

// =====================================================
// SITES
// =====================================================

export const SEED_SITES: SeedSite[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    organization_id: '11111111-1111-1111-1111-111111111111',
    name: 'GreenLeaf Main Facility',
    address: '1234 Cannabis Ave',
    city: 'Portland',
    state_province: 'Oregon',
    postal_code: '97201',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    max_pods: 48,
    is_active: true,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    organization_id: '22222222-2222-2222-2222-222222222222',
    name: 'Northern Farms Cultivation Center',
    address: '5678 Maple St',
    city: 'Vancouver',
    state_province: 'British Columbia',
    postal_code: 'V6B 1A1',
    country: 'Canada',
    timezone: 'America/Vancouver',
    max_pods: 32,
    is_active: true,
  },
];

// =====================================================
// USERS (All 8 Roles Represented)
// =====================================================

export const SEED_USERS: SeedUser[] = [
  // Organization Admin
  {
    id: 'user-0001-0000-0000-000000000001',
    email: 'admin@greenleaf.example',
    full_name: 'Sarah Johnson',
    phone: '+1-503-555-0101',
    role: 'org_admin',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    hire_date: '2024-01-15',
    last_sign_in: '2025-10-17T10:30:00Z',
  },
  // Site Manager
  {
    id: 'user-0002-0000-0000-000000000002',
    email: 'manager@greenleaf.example',
    full_name: 'Michael Chen',
    phone: '+1-503-555-0102',
    role: 'site_manager',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    hire_date: '2024-02-01',
    last_sign_in: '2025-10-17T09:15:00Z',
  },
  // Head Grower
  {
    id: 'user-0003-0000-0000-000000000003',
    email: 'grower@greenleaf.example',
    full_name: 'Emily Rodriguez',
    phone: '+1-503-555-0103',
    role: 'head_grower',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    hire_date: '2024-02-15',
    last_sign_in: '2025-10-17T08:00:00Z',
  },
  // Operator
  {
    id: 'user-0004-0000-0000-000000000004',
    email: 'operator1@greenleaf.example',
    full_name: 'James Williams',
    phone: '+1-503-555-0104',
    role: 'operator',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    hire_date: '2024-03-01',
    last_sign_in: '2025-10-17T07:30:00Z',
  },
  {
    id: 'user-0005-0000-0000-000000000005',
    email: 'operator2@greenleaf.example',
    full_name: 'Lisa Martinez',
    phone: '+1-503-555-0105',
    role: 'operator',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    hire_date: '2024-03-15',
    last_sign_in: '2025-10-16T16:00:00Z',
  },
  // Compliance QA
  {
    id: 'user-0006-0000-0000-000000000006',
    email: 'compliance@greenleaf.example',
    full_name: 'David Thompson',
    phone: '+1-503-555-0106',
    role: 'compliance_qa',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    hire_date: '2024-04-01',
    last_sign_in: '2025-10-17T09:00:00Z',
  },
  // Executive Viewer
  {
    id: 'user-0007-0000-0000-000000000007',
    email: 'executive@greenleaf.example',
    full_name: 'Jennifer Davis',
    phone: '+1-503-555-0107',
    role: 'executive_viewer',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    hire_date: '2024-01-01',
    last_sign_in: '2025-10-16T14:00:00Z',
  },
  // Installer Tech
  {
    id: 'user-0008-0000-0000-000000000008',
    email: 'installer@greenleaf.example',
    full_name: 'Robert Anderson',
    phone: '+1-503-555-0108',
    role: 'installer_tech',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    hire_date: '2024-05-01',
    last_sign_in: '2025-10-15T11:00:00Z',
  },
  // Support
  {
    id: 'user-0009-0000-0000-000000000009',
    email: 'support@trazo.example',
    full_name: 'Alex Kumar',
    phone: '+1-503-555-0109',
    role: 'support',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    hire_date: '2024-01-10',
    last_sign_in: '2025-10-17T10:00:00Z',
  },
  // Suspended User (for testing)
  {
    id: 'user-0010-0000-0000-000000000010',
    email: 'suspended@greenleaf.example',
    full_name: 'John Suspended',
    phone: '+1-503-555-0110',
    role: 'operator',
    organization_id: '11111111-1111-1111-1111-111111111111',
    is_active: false,
    hire_date: '2024-06-01',
    last_sign_in: '2025-09-01T10:00:00Z',
  },
  // Canada Organization Users
  {
    id: 'user-0011-0000-0000-000000000011',
    email: 'admin@northernfarms.example',
    full_name: 'Sophie Tremblay',
    phone: '+1-604-555-0201',
    role: 'org_admin',
    organization_id: '22222222-2222-2222-2222-222222222222',
    is_active: true,
    hire_date: '2024-01-20',
    last_sign_in: '2025-10-17T11:00:00Z',
  },
  {
    id: 'user-0012-0000-0000-000000000012',
    email: 'grower@northernfarms.example',
    full_name: 'Jean-Pierre Dubois',
    phone: '+1-604-555-0202',
    role: 'head_grower',
    organization_id: '22222222-2222-2222-2222-222222222222',
    is_active: true,
    hire_date: '2024-02-10',
    last_sign_in: '2025-10-17T08:30:00Z',
  },
];

// =====================================================
// AUDIT EVENTS (Realistic Activity Log)
// =====================================================

export const SEED_AUDIT_EVENTS: SeedAuditEvent[] = [
  // User login events
  {
    id: 'audit-0001-0000-0000-000000000001',
    user_id: 'user-0001-0000-0000-000000000001',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'login',
    entity_type: 'session',
    entity_id: 'session-001',
    entity_name: 'User Login',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: '2025-10-17T10:30:00Z',
    notes: 'Successful login via email/password',
  },
  {
    id: 'audit-0002-0000-0000-000000000002',
    user_id: 'user-0002-0000-0000-000000000002',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'login',
    entity_type: 'session',
    entity_id: 'session-002',
    entity_name: 'User Login',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2025-10-17T09:15:00Z',
  },
  // User created events
  {
    id: 'audit-0003-0000-0000-000000000003',
    user_id: 'user-0001-0000-0000-000000000001',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'created',
    entity_type: 'user',
    entity_id: 'user-0005-0000-0000-000000000005',
    entity_name: 'Lisa Martinez',
    new_values: {
      email: 'operator2@greenleaf.example',
      role: 'operator',
      full_name: 'Lisa Martinez',
    },
    ip_address: '192.168.1.100',
    timestamp: '2025-10-15T14:00:00Z',
    notes: 'New operator added to team',
  },
  // User role updated
  {
    id: 'audit-0004-0000-0000-000000000004',
    user_id: 'user-0001-0000-0000-000000000001',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'updated',
    entity_type: 'user',
    entity_id: 'user-0002-0000-0000-000000000002',
    entity_name: 'Michael Chen',
    old_values: {
      role: 'head_grower',
    },
    new_values: {
      role: 'site_manager',
    },
    ip_address: '192.168.1.100',
    timestamp: '2025-10-14T11:30:00Z',
    notes: 'Promoted to Site Manager',
  },
  // User suspended
  {
    id: 'audit-0005-0000-0000-000000000005',
    user_id: 'user-0001-0000-0000-000000000001',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'suspended',
    entity_type: 'user',
    entity_id: 'user-0010-0000-0000-000000000010',
    entity_name: 'John Suspended',
    old_values: {
      is_active: true,
    },
    new_values: {
      is_active: false,
    },
    ip_address: '192.168.1.100',
    timestamp: '2025-10-13T16:00:00Z',
    notes: 'Policy violation - pending investigation',
  },
  // Batch created
  {
    id: 'audit-0006-0000-0000-000000000006',
    user_id: 'user-0003-0000-0000-000000000003',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'created',
    entity_type: 'batch',
    entity_id: 'batch-001',
    entity_name: 'Batch-2025-001',
    new_values: {
      batch_number: 'Batch-2025-001',
      cultivar: 'Blue Dream',
      plant_count: 48,
      stage: 'vegetative',
    },
    ip_address: '192.168.1.102',
    timestamp: '2025-10-16T08:00:00Z',
    notes: 'New batch started in Room A',
  },
  // Recipe applied
  {
    id: 'audit-0007-0000-0000-000000000007',
    user_id: 'user-0003-0000-0000-000000000003',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'updated',
    entity_type: 'pod',
    entity_id: 'pod-001',
    entity_name: 'Pod-A-01',
    new_values: {
      recipe: 'Veg Recipe v2.0',
      temp_setpoint: 24.5,
      humidity_setpoint: 65,
    },
    ip_address: '192.168.1.102',
    timestamp: '2025-10-16T09:00:00Z',
    notes: 'Applied vegetative recipe to pod',
  },
  // Inventory movement
  {
    id: 'audit-0008-0000-0000-000000000008',
    user_id: 'user-0004-0000-0000-000000000004',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'created',
    entity_type: 'inventory_movement',
    entity_id: 'movement-001',
    entity_name: 'CO2 Tank Received',
    new_values: {
      item: 'CO2 Tank 50lb',
      quantity: 4,
      type: 'receive',
    },
    ip_address: '192.168.1.103',
    timestamp: '2025-10-15T10:30:00Z',
    notes: 'Received CO2 tanks from supplier',
  },
  // Waste logged
  {
    id: 'audit-0009-0000-0000-000000000009',
    user_id: 'user-0006-0000-0000-000000000006',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'created',
    entity_type: 'waste_log',
    entity_id: 'waste-001',
    entity_name: 'Plant Material Disposal',
    new_values: {
      waste_type: 'plant_material',
      quantity: 5.2,
      unit: 'kg',
      disposal_method: 'compost',
    },
    ip_address: '192.168.1.104',
    timestamp: '2025-10-14T15:00:00Z',
    notes: 'Trimmed waste material properly disposed',
  },
  // Alarm acknowledged
  {
    id: 'audit-0010-0000-0000-000000000010',
    user_id: 'user-0002-0000-0000-000000000002',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'updated',
    entity_type: 'alarm',
    entity_id: 'alarm-001',
    entity_name: 'High Temperature Alert',
    old_values: {
      status: 'active',
    },
    new_values: {
      status: 'acknowledged',
    },
    ip_address: '192.168.1.101',
    timestamp: '2025-10-17T07:15:00Z',
    notes: 'Temperature normalized after HVAC adjustment',
  },
  // Settings updated
  {
    id: 'audit-0011-0000-0000-000000000011',
    user_id: 'user-0001-0000-0000-000000000001',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'updated',
    entity_type: 'organization',
    entity_id: '11111111-1111-1111-1111-111111111111',
    entity_name: 'GreenLeaf Cultivation',
    old_values: {
      contact_phone: '+1-503-555-0000',
    },
    new_values: {
      contact_phone: '+1-503-555-0100',
    },
    ip_address: '192.168.1.100',
    timestamp: '2025-10-12T13:00:00Z',
    notes: 'Updated organization contact information',
  },
  // Compliance report generated
  {
    id: 'audit-0012-0000-0000-000000000012',
    user_id: 'user-0006-0000-0000-000000000006',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'created',
    entity_type: 'compliance_report',
    entity_id: 'report-001',
    entity_name: 'Monthly METRC Report - September 2025',
    new_values: {
      report_type: 'metrc_monthly',
      period: 'September 2025',
      status: 'draft',
    },
    ip_address: '192.168.1.104',
    timestamp: '2025-10-01T10:00:00Z',
    notes: 'Generated monthly compliance report',
  },
  // Failed login attempt
  {
    id: 'audit-0013-0000-0000-000000000013',
    user_id: 'user-0010-0000-0000-000000000010',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'failed_login',
    entity_type: 'session',
    entity_id: 'session-003',
    entity_name: 'Failed Login Attempt',
    ip_address: '192.168.1.150',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2025-10-16T22:30:00Z',
    notes: 'Account suspended - login denied',
  },
  // Password changed
  {
    id: 'audit-0014-0000-0000-000000000014',
    user_id: 'user-0004-0000-0000-000000000004',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'password_changed',
    entity_type: 'user',
    entity_id: 'user-0004-0000-0000-000000000004',
    entity_name: 'James Williams',
    ip_address: '192.168.1.103',
    timestamp: '2025-10-11T09:00:00Z',
    notes: 'User changed their password',
  },
  // Logout
  {
    id: 'audit-0015-0000-0000-000000000015',
    user_id: 'user-0003-0000-0000-000000000003',
    organization_id: '11111111-1111-1111-1111-111111111111',
    action: 'logout',
    entity_type: 'session',
    entity_id: 'session-004',
    entity_name: 'User Logout',
    ip_address: '192.168.1.102',
    timestamp: '2025-10-16T17:00:00Z',
  },
];

// =====================================================
// USER SITE ASSIGNMENTS
// =====================================================

export const SEED_USER_SITE_ASSIGNMENTS = [
  {
    user_id: 'user-0002-0000-0000-000000000002',
    site_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    assigned_by: 'user-0001-0000-0000-000000000001',
  },
  {
    user_id: 'user-0003-0000-0000-000000000003',
    site_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    assigned_by: 'user-0001-0000-0000-000000000001',
  },
  {
    user_id: 'user-0004-0000-0000-000000000004',
    site_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    assigned_by: 'user-0002-0000-0000-000000000002',
  },
  {
    user_id: 'user-0005-0000-0000-000000000005',
    site_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    assigned_by: 'user-0002-0000-0000-000000000002',
  },
  {
    user_id: 'user-0012-0000-0000-000000000012',
    site_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    assigned_by: 'user-0011-0000-0000-000000000011',
  },
];
