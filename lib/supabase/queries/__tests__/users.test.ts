/**
 * Tests for user management query functions
 * 
 * Note: These tests use mocked Supabase client to avoid database dependency
 */

import { createClient } from '../../server';
import {
  getUsers,
  getUserById,
  getUserByEmail,
  inviteUser,
  updateUserStatus,
  updateUser,
  updateUserRole,
  getUserSiteAssignments,
  addUserSiteAssignment,
  removeUserSiteAssignment,
  deleteUser,
  resendInvitation,
  getUserCountsByStatus,
} from '../users';
import { MockQueryBuilder } from './test-helpers';

// Mock Supabase server client
jest.mock('../../server', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('User Management Query Functions', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create base mock structure
    mockSupabase = {
      from: jest.fn(),
      auth: {
        admin: {
          inviteUserByEmail: jest.fn(),
          updateUserById: jest.fn(),
          deleteUser: jest.fn(),
        },
        getUser: jest.fn(),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('getUsers', () => {
    it('should return paginated users with organization data', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', full_name: 'User 1', organizations: { id: 'org-1', name: 'Org 1' } },
        { id: 'user-2', email: 'user2@example.com', full_name: 'User 2', organizations: { id: 'org-1', name: 'Org 1' } },
      ];

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockUsers, null, 2));

      const result = await getUsers(
        { organization_id: 'org-1' },
        { page: 1, per_page: 10 }
      );

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, { message: 'Database error' }));

      await expect(getUsers(
        { organization_id: 'org-1' },
        { page: 1, per_page: 10 }
      )).rejects.toThrow('Failed to fetch users: Database error');
    });
  });

  describe('getUserById', () => {
    it('should return user with organization data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        organizations: { id: 'org-1', name: 'Test Org' },
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockUser));

      const user = await getUserById('user-123');

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-123');
      expect(user).toHaveProperty('organizations');
    });

    it('should return null for non-existent user', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, { code: 'PGRST116', message: 'Not found' }));

      const user = await getUserById('non-existent');

      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockUser));

      const user = await getUserByEmail('test@example.com');

      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, { code: 'PGRST116', message: 'Not found' }));

      const user = await getUserByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('inviteUser', () => {
    it('should invite a new user successfully', async () => {
      const inviteData = {
        email: 'newuser@example.com',
        full_name: 'New User',
        phone: '+1234567890',
        role: 'operator' as const,
        organization_id: 'org-123',
      };

      // Mock getUserByEmail to return null (user doesn't exist)
      mockSupabase.from.mockReturnValueOnce(new MockQueryBuilder(null, { code: 'PGRST116' }));
      // Mock insert success
      mockSupabase.from.mockReturnValueOnce(new MockQueryBuilder({ id: 'user-123', ...inviteData, status: 'invited', idp: 'local' }));

      const user = await inviteUser(inviteData);

      expect(user).not.toBeNull();
      expect(user.email).toBe(inviteData.email);
      expect(user.status).toBe('invited');
    });

    it('should handle existing user error', async () => {
      const inviteData = {
        email: 'existing@example.com',
        full_name: 'Existing User',
        phone: '+1234567890',
        role: 'operator' as const,
        organization_id: 'org-123',
      };

      // Mock getUserByEmail to return existing user
      mockSupabase.from.mockReturnValueOnce(new MockQueryBuilder({ id: 'user-123', email: inviteData.email }));

      await expect(inviteUser(inviteData)).rejects.toThrow('A user with this email already exists');
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status to suspended', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder({ id: 'user-123', status: 'suspended' }));

      const user = await updateUserStatus('user-123', 'suspended');

      expect(user).not.toBeNull();
      expect(user.status).toBe('suspended');
    });

    it('should handle update errors', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, { message: 'Update failed' }));

      await expect(updateUserStatus('user-123', 'suspended')).rejects.toThrow('Update failed');
    });
  });

  describe('updateUser', () => {
    it('should update user profile information', async () => {
      const updates = {
        full_name: 'Updated Name',
        phone: '+9876543210',
      };

      mockSupabase.from.mockReturnValue(new MockQueryBuilder({ id: 'user-123', ...updates }));

      const user = await updateUser('user-123', updates);

      expect(user).not.toBeNull();
      expect(user.full_name).toBe('Updated Name');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder({ id: 'user-123', role: 'site_manager' }));

      const user = await updateUserRole('user-123', 'site_manager');

      expect(user).not.toBeNull();
      expect(user.role).toBe('site_manager');
    });
  });

  describe('getUserSiteAssignments', () => {
    it('should return user site assignments', async () => {
      const mockAssignments = [
        { id: 'assign-1', user_id: 'user-123', site_id: 'site-1' },
        { id: 'assign-2', user_id: 'user-123', site_id: 'site-2' },
      ];

      mockSupabase.from.mockReturnValue(new MockQueryBuilder(mockAssignments));

      const assignments = await getUserSiteAssignments('user-123');

      expect(assignments).toHaveLength(2);
      expect(assignments[0].user_id).toBe('user-123');
    });

    it('should return empty array for user with no assignments', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder([]));

      const assignments = await getUserSiteAssignments('user-123');

      expect(assignments).toEqual([]);
    });
  });

  describe('addUserSiteAssignment', () => {
    it('should create site assignment', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder({ id: 'assign-1', user_id: 'user-123', site_id: 'site-456' }));

      const result = await addUserSiteAssignment('user-123', 'site-456');

      expect(result).not.toBeNull();
      expect(result.user_id).toBe('user-123');
      expect(result.site_id).toBe('site-456');
    });

    it('should handle duplicate assignment errors', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, { message: 'Assignment already exists' }));

      await expect(addUserSiteAssignment('user-123', 'site-456')).rejects.toThrow('Assignment already exists');
    });
  });

  describe('removeUserSiteAssignment', () => {
    it('should remove site assignment', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null));

      await expect(removeUserSiteAssignment('user-123', 'site-456')).resolves.not.toThrow();
    });

    it('should throw error on failure', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, { message: 'Not found' }));

      await expect(removeUserSiteAssignment('user-123', 'site-456')).rejects.toThrow('Not found');
    });
  });

  describe('deleteUser', () => {
    it('should deactivate user successfully', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder({ id: 'user-123', status: 'deactivated' }));

      await expect(deleteUser('user-123')).resolves.not.toThrow();
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation successfully', async () => {
      // Mock getUserById
      mockSupabase.from.mockReturnValueOnce(new MockQueryBuilder({ id: 'user-123', email: 'user@example.com', status: 'invited' }));

      await expect(resendInvitation('user-123')).resolves.not.toThrow();
    });

    it('should throw error if user not found', async () => {
      mockSupabase.from.mockReturnValueOnce(new MockQueryBuilder(null, { code: 'PGRST116' }));

      await expect(resendInvitation('user-123')).rejects.toThrow('User not found');
    });

    it('should throw error if user is not in invited status', async () => {
      mockSupabase.from.mockReturnValueOnce(new MockQueryBuilder({ id: 'user-123', email: 'user@example.com', status: 'active' }));

      await expect(resendInvitation('user-123')).rejects.toThrow('Can only resend invitations to users with invited status');
    });
  });

  describe('getUserCountsByStatus', () => {
    it('should return counts grouped by status', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder([
        { status: 'active' },
        { status: 'active' },
        { status: 'active' },
        { status: 'invited' },
        { status: 'invited' },
        { status: 'suspended' },
      ]));

      const counts = await getUserCountsByStatus();

      expect(counts).toEqual({
        active: 3,
        invited: 2,
        suspended: 1,
        deactivated: 0,
      });
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from.mockReturnValue(new MockQueryBuilder(null, { message: 'Database error' }));

      await expect(getUserCountsByStatus()).rejects.toThrow('Failed to fetch user counts');
    });
  });
});
