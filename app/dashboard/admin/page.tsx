import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, FileText } from 'lucide-react';
import { checkAdminAuth } from '@/lib/admin-helpers';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Trazo',
  description: 'Identity, roles, and access management',
};

export default async function AdminDashboardPage() {
  const { isDevMode } = await checkAdminAuth('user:view', 'Dashboard');

  // Mock data for dev mode
  if (isDevMode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-display-4 font-semibold text-brand-dark-green-700">
            Admin Dashboard
          </h1>
          <p className="text-body-base text-slate-600 mt-2">
            Identity, roles, and access management (Dev Mode)
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Mock data in dev mode</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Mock data in dev mode</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audit Events (24h)</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Mock data in dev mode</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Production: Fetch summary statistics
  const supabase = await createClient();
  const [usersCount, activeSessionsCount, auditEventsCount] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('audit_log').select('id', { count: 'exact', head: true })
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-4 font-semibold text-brand-dark-green-700">
          Admin Dashboard
        </h1>
        <p className="text-body-base text-slate-600 mt-2">
          Manage users, roles, permissions, and access control
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount.count || 0}</div>
            <p className="text-xs text-slate-500">Across all organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessionsCount.count || 0}</div>
            <p className="text-xs text-slate-500">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-slate-500">Predefined roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Events (24h)</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditEventsCount.count || 0}</div>
            <p className="text-xs text-slate-500">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/dashboard/admin/users"
              className="block p-3 rounded-lg border hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-brand-lighter-green-600" />
                <div>
                  <div className="font-medium">Manage Users</div>
                  <div className="text-sm text-slate-500">Invite, suspend, or update user roles</div>
                </div>
              </div>
            </a>
            <a
              href="/dashboard/admin/roles"
              className="block p-3 rounded-lg border hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-brand-lighter-green-600" />
                <div>
                  <div className="font-medium">Roles & Permissions</div>
                  <div className="text-sm text-slate-500">View permission matrix and role details</div>
                </div>
              </div>
            </a>
            <a
              href="/dashboard/admin/audit"
              className="block p-3 rounded-lg border hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-brand-lighter-green-600" />
                <div>
                  <div className="font-medium">Audit Log</div>
                  <div className="text-sm text-slate-500">Review system activity and changes</div>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest administrative actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Recent activity feed will be displayed here...</p>
              <p className="text-xs text-slate-400">
                Connect to audit log for real-time updates
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
