import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { getUsers } from '@/lib/supabase/queries/users';
import { UserManagementClient } from './user-management-client';
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode';

export const metadata: Metadata = {
  title: 'User Management - Trazo Admin',
  description: 'Manage users, roles, and access',
};

export default async function UsersPage() {
  // Check for dev mode first
  if (isDevModeActive()) {
    logDevMode('Admin Users Page');
    
    // Use mock data in dev mode
    const mockUsers = [
      {
        id: DEV_MOCK_USER.id,
        email: DEV_MOCK_USER.email,
        full_name: DEV_MOCK_USER.full_name,
        phone: DEV_MOCK_USER.phone,
        role: DEV_MOCK_USER.role,
        status: 'active' as const,
        idp: 'local' as const,
        is_active: true,
        organization_id: DEV_MOCK_USER.organization_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization: DEV_MOCK_USER.organization
      }
    ];
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-display-4 font-semibold text-brand-dark-green-700">
            User Management
          </h1>
          <p className="text-body-base text-slate-600 mt-2">
            Invite users, manage roles, and control access (Dev Mode)
          </p>
        </div>
        <UserManagementClient 
          initialUsers={mockUsers}
          organizationId={DEV_MOCK_USER.organization_id}
        />
      </div>
    );
  }
  
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    redirect('/dashboard');
  }

  const hasPermission = canPerformAction(userData.role, 'user:view');
  
  if (!hasPermission.allowed) {
    redirect('/dashboard');
  }

  // Fetch users
  const usersData = await getUsers({ organization_id: userData.organization_id });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-4 font-semibold text-brand-dark-green-700">
          User Management
        </h1>
        <p className="text-body-base text-slate-600 mt-2">
          Invite users, manage roles, and control access
        </p>
      </div>

      <UserManagementClient 
        initialUsers={usersData.data} 
        organizationId={userData.organization_id}
      />
    </div>
  );
}
