/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test utilities for Supabase client mocking
 * 
 * Provides reusable mock builders for testing query modules
 * that use Supabase's fluent API.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock query builder that supports chaining
 */
export class MockQueryBuilder {
  private mockData: any = null;
  private mockError: any = null;
  private mockCount: number | null = null;

  constructor(data: any = null, error: any = null, count: number | null = null) {
    this.mockData = data;
    this.mockError = error;
    this.mockCount = count;
  }

  // Query modifiers (return this for chaining)
  select() {
    return this;
  }

  insert() {
    return this;
  }

  upsert() {
    return this;
  }

  update() {
    return this;
  }

  delete() {
    return this;
  }

  eq() {
    return this;
  }

  neq() {
    return this;
  }

  in() {
    return this;
  }

  is() {
    return this;
  }

  ilike() {
    return this;
  }

  or() {
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return this;
  }

  range() {
    return this;
  }

  single() {
    return this;
  }

  maybeSingle() {
    return this;
  }

  // Terminal operations (return promise)
  async then(resolve: (value: any) => any) {
    const result = {
      data: this.mockData,
      error: this.mockError,
      count: this.mockCount,
    };
    
    // Always resolve with the result object
    // The query functions will check result.error and throw if needed
    return resolve(result);
  }
}

/**
 * Create a mock Supabase client with builder support
 */
export function createMockSupabaseClient(
  mockData: any = null,
  mockError: any = null,
  mockCount: number | null = null
): SupabaseClient {
  const builder = new MockQueryBuilder(mockData, mockError, mockCount);

  return {
    from: jest.fn(() => builder),
    auth: {
      admin: {
        inviteUserByEmail: jest.fn().mockResolvedValue({
          data: mockData,
          error: mockError,
        }),
        updateUserById: jest.fn().mockResolvedValue({
          data: mockData,
          error: mockError,
        }),
        deleteUser: jest.fn().mockResolvedValue({
          data: mockData,
          error: mockError,
        }),
      },
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockData },
        error: mockError,
      }),
    },
    rpc: jest.fn(() => builder),
  } as any;
}

/**
 * Helper to create mock user data
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '+1234567890',
    role: 'operator',
    status: 'active',
    organization_id: 'org-123',
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
    last_login_at: null,
    ...overrides,
  };
}

/**
 * Helper to create mock user with organization
 */
export function createMockUserWithOrg(overrides: Partial<any> = {}) {
  return {
    ...createMockUser(overrides),
    organizations: {
      id: 'org-123',
      name: 'Test Organization',
      plant_type: 'cannabis',
      ...overrides.organizations,
    },
  };
}

/**
 * Helper to create mock role binding
 */
export function createMockRoleBinding(overrides: Partial<any> = {}) {
  return {
    id: 'binding-123',
    user_id: 'user-123',
    role: 'operator',
    organization_id: 'org-123',
    site_id: null,
    assigned_by: 'user-456',
    assigned_at: '2025-10-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Helper to create mock audit event
 */
export function createMockAuditEvent(overrides: Partial<any> = {}) {
  return {
    id: 'audit-123',
    user_id: 'user-123',
    organization_id: 'org-123',
    action: 'created',
    entity_type: 'user',
    entity_id: 'user-456',
    entity_name: 'New User',
    old_values: null,
    new_values: { role: 'operator' },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    created_at: '2025-10-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Helper to create mock site assignment
 */
export function createMockSiteAssignment(overrides: Partial<any> = {}) {
  return {
    id: 'assignment-123',
    user_id: 'user-123',
    site_id: 'site-123',
    organization_id: 'org-123',
    assigned_by: 'user-456',
    assigned_at: '2025-10-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create multiple mock items
 */
export function createMockArray<T>(
  factory: (index: number) => T,
  count: number
): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}
