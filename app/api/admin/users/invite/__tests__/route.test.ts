/**
 * Tests for POST /api/admin/users/invite
 */

import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { inviteUser } from '@/lib/supabase/queries/users';
import { isDevModeActive } from '@/lib/dev-mode';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/rbac/guards');
jest.mock('@/lib/supabase/queries/users');
jest.mock('@/lib/dev-mode');

describe('POST /api/admin/users/invite', () => {
  const mockGetUser = jest.fn();
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();
  
  const mockSupabaseClient = {
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    (isDevModeActive as jest.Mock).mockReturnValue(false);
    
    // Setup default chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  const createRequest = (body: unknown) => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  describe('Dev Mode', () => {
    it('should return simulated response in dev mode', async () => {
      (isDevModeActive as jest.Mock).mockReturnValue(true);

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('dev mode');
      expect(inviteUser).not.toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should return 400 if email is missing', async () => {
      const request = createRequest({
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 if full_name is missing', async () => {
      const request = createRequest({
        email: 'test@example.com',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 if role is missing', async () => {
      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 if organization_id is missing', async () => {
      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should accept all required fields', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { role: 'org_admin', organization_id: 'org-123' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (inviteUser as jest.Mock).mockResolvedValue({ id: 'new-user-id' });

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if auth error occurs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      });

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('User Data Validation', () => {
    it('should return 404 if user data not found', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('Organization Validation', () => {
    it('should return 403 if trying to invite to different organization', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { role: 'org_admin', organization_id: 'org-456' },
        error: null,
      });

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Cannot invite users to other organizations');
    });

    it('should allow invite to same organization', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { role: 'org_admin', organization_id: 'org-123' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (inviteUser as jest.Mock).mockResolvedValue({ id: 'new-user-id' });

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Permissions', () => {
    it('should return 403 if user lacks user:create permission', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { role: 'farm_worker', organization_id: 'org-123' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: false });

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should call canPerformAction with correct role', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { role: 'org_admin', organization_id: 'org-123' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (inviteUser as jest.Mock).mockResolvedValue({ id: 'new-user-id' });

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      await POST(request);

      expect(canPerformAction).toHaveBeenCalledWith('org_admin', 'user:create');
    });
  });

  describe('User Invitation', () => {
    it('should block inviting equal or higher role for non-admin', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      // inviter is site_manager in org-123
      mockSingle.mockResolvedValue({
        data: { role: 'site_manager', organization_id: 'org-123' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });

      const request = createRequest({
        email: 'peer@example.com',
        full_name: 'Peer',
        role: 'site_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('equal or higher');
    });

    it('should allow inviting lower role for non-admin', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      // inviter is site_manager in org-123
      mockSingle.mockResolvedValue({
        data: { role: 'site_manager', organization_id: 'org-123' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (inviteUser as jest.Mock).mockResolvedValue({ id: 'new-user-id' });

      const request = createRequest({
        email: 'op@example.com',
        full_name: 'Operator',
        role: 'operator',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
    it('should call inviteUser with correct parameters', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { role: 'org_admin', organization_id: 'org-123' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (inviteUser as jest.Mock).mockResolvedValue({ id: 'new-user-id' });

      const request = createRequest({
        email: 'newuser@example.com',
        full_name: 'New User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      await POST(request);

      expect(inviteUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        full_name: 'New User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });
    });

    it('should return success with user data', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { role: 'org_admin', organization_id: 'org-123' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (inviteUser as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        email: 'test@example.com',
      });

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: 'new-user-id',
        email: 'test@example.com',
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockGetUser.mockRejectedValue(new Error('Database error'));

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });

    it('should return 500 if inviteUser fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { role: 'org_admin', organization_id: 'org-123' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (inviteUser as jest.Mock).mockRejectedValue(new Error('Email service failed'));

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Email service failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockGetUser.mockRejectedValue('String error');

      const request = createRequest({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'farm_manager',
        organization_id: 'org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to invite user');
    });
  });
});
