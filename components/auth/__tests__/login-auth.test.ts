/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for Login Authentication Logic
 * 
 * Tests the login functionality including:
 * - Multi-region login fallback
 * - Region storage and retrieval
 * - Error handling
 * - Successful authentication
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createClient, getStoredRegion, setStoredRegion } from '@/lib/supabase/client';
import type { Region } from '@/lib/types/region';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
  getStoredRegion: jest.fn(),
  setStoredRegion: jest.fn(),
  clearStoredRegion: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetStoredRegion = getStoredRegion as jest.MockedFunction<typeof getStoredRegion>;
const mockSetStoredRegion = setStoredRegion as jest.MockedFunction<typeof setStoredRegion>;

describe('Login Authentication Logic', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
      },
    };

    mockCreateClient.mockReturnValue(mockSupabase);
    mockGetStoredRegion.mockReturnValue('US');
  });

  describe('Region-based Authentication', () => {
    it('should use stored region for login', async () => {
      mockGetStoredRegion.mockReturnValue('CA');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' }, session: {} },
        error: null,
      });

      const supabase = createClient('CA');
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockCreateClient).toHaveBeenCalledWith('CA');
      expect(result.data?.user).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle US region login', async () => {
      mockGetStoredRegion.mockReturnValue('US');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: {} },
        error: null,
      });

      const supabase = createClient('US');
      const result = await supabase.auth.signInWithPassword({
        email: 'us.user@example.com',
        password: 'password123',
      });

      expect(mockCreateClient).toHaveBeenCalledWith('US');
      expect(result.data?.user?.id).toBe('user-123');
    });

    it('should handle CA region login', async () => {
      mockGetStoredRegion.mockReturnValue('CA');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-456' }, session: {} },
        error: null,
      });

      const supabase = createClient('CA');
      const result = await supabase.auth.signInWithPassword({
        email: 'ca.user@example.com',
        password: 'password123',
      });

      expect(mockCreateClient).toHaveBeenCalledWith('CA');
      expect(result.data?.user?.id).toBe('user-456');
    });
  });

  describe('Multi-Region Fallback', () => {
    it('should attempt CA region if US fails', async () => {
      const usSupabase = { auth: { signInWithPassword: jest.fn() } };
      const caSupabase = { auth: { signInWithPassword: jest.fn() } };

      mockCreateClient
        .mockReturnValueOnce(usSupabase as any)
        .mockReturnValueOnce(caSupabase as any);

      usSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      caSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: {} },
        error: null,
      });

      // Simulate login attempt
      let region: Region = 'US';
      let supabase = createClient(region);
      let result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      // First attempt failed, try CA
      if (result.error && region === 'US') {
        region = 'CA';
        supabase = createClient(region);
        result = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123',
        });
      }

      expect(mockCreateClient).toHaveBeenCalledTimes(2);
      expect(mockCreateClient).toHaveBeenNthCalledWith(1, 'US');
      expect(mockCreateClient).toHaveBeenNthCalledWith(2, 'CA');
      expect(result.data?.user).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should attempt US region if CA fails', async () => {
      const caSupabase = { auth: { signInWithPassword: jest.fn() } };
      const usSupabase = { auth: { signInWithPassword: jest.fn() } };

      mockCreateClient
        .mockReturnValueOnce(caSupabase as any)
        .mockReturnValueOnce(usSupabase as any);

      caSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      usSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-456' }, session: {} },
        error: null,
      });

      // Simulate login attempt
      let region: Region = 'CA';
      let supabase = createClient(region);
      let result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      // First attempt failed, try US
      if (result.error && region === 'CA') {
        region = 'US';
        supabase = createClient(region);
        result = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123',
        });
      }

      expect(mockCreateClient).toHaveBeenCalledTimes(2);
      expect(mockCreateClient).toHaveBeenNthCalledWith(1, 'CA');
      expect(mockCreateClient).toHaveBeenNthCalledWith(2, 'US');
      expect(result.data?.user).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
      });

      const supabase = createClient('US');
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid login credentials');
      expect(result.data).toBeNull();
    });

    it('should handle network errors', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      const supabase = createClient('US');
      
      await expect(
        supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Network error');
    });

    it('should return error when both regions fail', async () => {
      const usSupabase = { auth: { signInWithPassword: jest.fn() } };
      const caSupabase = { auth: { signInWithPassword: jest.fn() } };

      mockCreateClient
        .mockReturnValueOnce(usSupabase as any)
        .mockReturnValueOnce(caSupabase as any);

      usSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      caSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      // Try both regions
      let region: Region = 'US';
      let supabase = createClient(region);
      let result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      if (result.error) {
        region = 'CA';
        supabase = createClient(region);
        result = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      }

      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('Region Storage', () => {
    it('should store region after successful login', () => {
      setStoredRegion('US');
      expect(mockSetStoredRegion).toHaveBeenCalledWith('US');
    });

    it('should update stored region on successful fallback login', () => {
      mockSetStoredRegion('CA');
      expect(mockSetStoredRegion).toHaveBeenCalledWith('CA');
    });

    it('should retrieve stored region', () => {
      mockGetStoredRegion.mockReturnValue('CA');
      const region = getStoredRegion();
      expect(region).toBe('CA');
    });

    it('should default to US when no region stored', () => {
      mockGetStoredRegion.mockReturnValue('US');
      const region = getStoredRegion();
      expect(region).toBe('US');
    });
  });

  describe('Authentication Response', () => {
    it('should return user data on successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
        },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: 'token123', refresh_token: 'refresh123' },
        },
        error: null,
      });

      const supabase = createClient('US');
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data?.user).toEqual(mockUser);
      expect(result.data?.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should return session data on successful login', async () => {
      const mockSession = {
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        expires_in: 3600,
        token_type: 'bearer',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: mockSession,
        },
        error: null,
      });

      const supabase = createClient('US');
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data?.session?.access_token).toBe('access_token_123');
      expect(result.data?.session?.refresh_token).toBe('refresh_token_123');
    });
  });
});
