import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RolePermissionMatrix } from '@/components/features/admin/role-permission-matrix';
import { checkAdminAuth } from '@/lib/admin-helpers';
import type { RoleKey } from '@/lib/rbac/types';

export const metadata: Metadata = {
  title: 'Roles & Permissions - Trazo Admin',
  description: 'View and manage role-based access control',
};

export default async function RolesPage() {
  const { isDevMode } = await checkAdminAuth('user:view', 'Roles');

  // Mock data for dev mode
  const userCounts: Partial<Record<RoleKey, number>> = isDevMode 
    ? { org_admin: 1 }
    : {};

  // Production: Fetch user counts by role
  if (!isDevMode) {
    const supabase = await createClient();
    const { data: users } = await supabase.from('users').select('role');
    users?.forEach((u: { role: RoleKey }) => {
      userCounts[u.role] = (userCounts[u.role] || 0) + 1;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-4 font-semibold text-brand-dark-green-700">
          Roles & Permissions
        </h1>
        <p className="text-body-base text-slate-600 mt-2">
          Role-based access control with least-privilege defaults
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            View and understand the permissions granted to each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolePermissionMatrix userCounts={userCounts} />
        </CardContent>
      </Card>
    </div>
  );
}
