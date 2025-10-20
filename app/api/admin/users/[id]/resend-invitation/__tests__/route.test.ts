/**
 * Tests for Resend Invitation API Route
 * POST /api/admin/users/[id]/resend-invitation
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { resendInvitation } from '@/lib/supabase/queries/users';
import { isDevModeActive } from '@/lib/dev-mode';

// Mock modules
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/rbac/guards');
jest.mock('@/lib/supabase/queries/users');
jest.mock('@/lib/dev-mode');

describe('POST /api/admin/users/[id]/resend-invitation', () => {
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

  const createRequest = () => ({} as NextRequest);

  const createParams = () => Promise.resolve({ id: mockId });

  describe('Dev Mode', () => {
    it('should return simulated response in dev mode', async () => {
      (isDevModeActive as jest.Mock).mockReturnValue(true);

      const request = createRequest();
      const response = await POST(request, { params: createParams() });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('simulated in dev mode');
    });
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createRequest();
      const response = await POST(request, { params: createParams() });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      });

      const request = createRequest();
      const response = await POST(request, { params: createParams() });

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

      const request = createRequest();
      const response = await POST(request, { params: createParams() });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });
  });

  describe('Permissions', () => {
    it('should return 403 if user lacks user:create permission', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'viewer', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: false });

      const request = createRequest();
      const response = await POST(request, { params: createParams() });

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
      (resendInvitation as jest.Mock).mockResolvedValue({
        id: mockId,
        email: 'user@example.com',
      });

      const request = createRequest();
      await POST(request, { params: createParams() });

      expect(canPerformAction).toHaveBeenCalledWith('admin', 'user:create');
    });

    it('should check user:create permission, not user:update', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'manager', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (resendInvitation as jest.Mock).mockResolvedValue({
        id: mockId,
        email: 'user@example.com',
      });

      const request = createRequest();
      await POST(request, { params: createParams() });

      expect(canPerformAction).toHaveBeenCalledWith('manager', 'user:create');
      expect(canPerformAction).not.toHaveBeenCalledWith(
        expect.anything(),
        'user:update'
      );
    });
  });

  describe('Resend Invitation', () => {
    it('should call resendInvitation with correct user ID', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (resendInvitation as jest.Mock).mockResolvedValue({
        id: mockId,
        email: 'user@example.com',
      });

      const request = createRequest();
      await POST(request, { params: createParams() });

      expect(resendInvitation).toHaveBeenCalledWith(mockId);
    });

    it('should return success with invitation data', async () => {
      const invitationData = {
        id: mockId,
        email: 'user@example.com',
        status: 'invited',
        invited_at: new Date().toISOString(),
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
      (resendInvitation as jest.Mock).mockResolvedValue(invitationData);

      const request = createRequest();
      const response = await POST(request, { params: createParams() });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(invitationData);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Database error')
      );

      const request = createRequest();
      const response = await POST(request, { params: createParams() });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Database error');
    });

    it('should return 500 if resendInvitation fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: { role: 'admin', organization_id: 'org-1' },
        error: null,
      });
      (canPerformAction as jest.Mock).mockReturnValue({ allowed: true });
      (resendInvitation as jest.Mock).mockRejectedValue(
        new Error('Email service failed')
      );

      const request = createRequest();
      const response = await POST(request, { params: createParams() });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Email service failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue('String error');

      const request = createRequest();
      const response = await POST(request, { params: createParams() });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to resend invitation');
    });
  });
});
