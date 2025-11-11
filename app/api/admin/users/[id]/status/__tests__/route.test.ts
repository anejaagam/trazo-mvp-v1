/**
 * Tests for Update User Status API Route
 * PATCH /api/admin/users/[id]/status
 */

import { NextRequest } from 'next/server';
import { PATCH } from '../route';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { updateUserStatus } from '@/lib/supabase/queries/users';
import { isDevModeActive } from '@/lib/dev-mode';

// Mock modules
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/rbac/guards');
jest.mock('@/lib/supabase/queries/users');
jest.mock('@/lib/dev-mode');

describe('PATCH /api/admin/users/[id]/status', () => {
  const mockId = 'user-123';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockSupabaseClient: any = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(function () {
      return mockSupabaseClient;
    }),
    select: jest.fn(function () {
      return mockSupabaseClient;
    }),
    eq: jest.fn(function () {
      return mockSupabaseClient;
    }),
    single: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    (isDevModeActive as jest.Mock).mockReturnValue(false);
  });

  const createRequest = (body: unknown) => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  const createParams = () => Promise.resolve({ id: mockId });

  describe('Dev Mode', () => {
    it('should return simulated response in dev mode', async () => {
      (isDevModeActive as jest.Mock).mockReturnValue(true);

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('simulated in dev mode');
    });
  });

  describe('Input Validation', () => {
    it('should return 400 if status is missing', async () => {
      const request = createRequest({});
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid status');
    });

    it('should return 400 if status is invalid', async () => {
      const request = createRequest({ status: 'invalid-status' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid status');
    });

    it('should accept "invited" status', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (updateUserStatus as jest.Mock).mockResolvedValue({
        id: mockId,
        status: 'invited',
      });

      const request = createRequest({ status: 'invited' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(200);
    });

    it('should accept "active" status', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (updateUserStatus as jest.Mock).mockResolvedValue({
        id: mockId,
        status: 'active',
      });

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(200);
    });

    it('should accept "suspended" status', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (updateUserStatus as jest.Mock).mockResolvedValue({
        id: mockId,
        status: 'suspended',
      });

      const request = createRequest({ status: 'suspended' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(200);
    });

    it('should accept "deactivated" status', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (updateUserStatus as jest.Mock).mockResolvedValue({
        id: mockId,
        status: 'deactivated',
      });

      const request = createRequest({ status: 'deactivated' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      });

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('User Data Validation', () => {
    it('should return 404 if user data not found', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });
  });

  describe('Permissions', () => {
    it('should return 403 if user lacks user:update permission', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'viewer', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: false });

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should call canPerformAction with correct role', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (updateUserStatus as jest.Mock).mockResolvedValue({
        id: mockId,
        status: 'active',
      });

      const request = createRequest({ status: 'active' });
      await PATCH(request, { params: createParams() });

      expect(canPerformAction).toHaveBeenCalledWith('admin', 'user:update');
    });
  });

  describe('Status Update', () => {
    it('should call updateUserStatus with correct parameters', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (updateUserStatus as jest.Mock).mockResolvedValue({
        id: mockId,
        status: 'suspended',
      });

      const request = createRequest({ status: 'suspended' });
      await PATCH(request, { params: createParams() });

      expect(updateUserStatus).toHaveBeenCalledWith(mockId, 'suspended');
    });

    it('should return success with updated user data', async () => {
      const updatedUser = {
        id: mockId,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (updateUserStatus as jest.Mock).mockResolvedValue(updatedUser);

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedUser);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Database error')
      );

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Database error');
    });

    it('should return 500 if updateUserStatus fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (updateUserStatus as jest.Mock).mockRejectedValue(
        new Error('Status update failed')
      );

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Status update failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue('String error');

      const request = createRequest({ status: 'active' });
      const response = await PATCH(request, { params: createParams() });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to update user status');
    });
  });
});
