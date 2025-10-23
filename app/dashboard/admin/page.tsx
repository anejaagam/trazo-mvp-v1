import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, FileText, UserPlus, AlertTriangle, TrendingUp, Activity, Clock, CheckCircle2, XCircle, Building2 } from 'lucide-react';
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
          <h1 className="text-display-4 font-semibold text-brand-dark-green-700 dark:text-brand-lighter-green-400">
            Admin Dashboard
          </h1>
          <p className="text-body-base text-slate-600 dark:text-slate-300 mt-2">
            Identity, roles, and access management (Dev Mode)
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-brand-lighter-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+0%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <UserPlus className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Awaiting acceptance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roles Defined</CardTitle>
              <Shield className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">System-wide roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audit Events (24h)</CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Security events logged</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/dashboard/admin/users"
                className="block p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-brand-lighter-green-600" />
                  <div className="flex-1">
                    <div className="font-medium">Manage Users</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Invite, suspend, or update user roles</div>
                  </div>
                  <Badge variant="secondary">1</Badge>
                </div>
              </a>
              <a
                href="/dashboard/admin/roles"
                className="block p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-brand-lighter-green-600" />
                  <div className="flex-1">
                    <div className="font-medium">Roles & Permissions</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">View permission matrix and role details</div>
                  </div>
                  <Badge variant="secondary">8</Badge>
                </div>
              </a>
              <a
                href="/dashboard/admin/audit"
                className="block p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-brand-lighter-green-600" />
                  <div className="flex-1">
                    <div className="font-medium">Audit Log</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Review system activity and changes</div>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-1 bg-green-100 dark:bg-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Dev Mode Activated</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mock user session started</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Just now
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                  Connect to audit log for real-time updates
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health & User Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Current system status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Authentication Service</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Database</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">API Gateway</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution by Role</CardTitle>
              <CardDescription>Active users per role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Organization Admin</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-dark-green-700 w-full"></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">1</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Site Manager</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <span className="text-sm text-slate-500 w-8 text-right">0</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Head Grower</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <span className="text-sm text-slate-500 w-8 text-right">0</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Operator</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <span className="text-sm text-slate-500 w-8 text-right">0</span>
                </div>
              </div>
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
        <h1 className="text-display-4 font-semibold text-brand-dark-green-700 dark:text-brand-lighter-green-400">
          Admin Dashboard
        </h1>
        <p className="text-body-base text-slate-600 dark:text-slate-300 mt-2">
          Manage users, roles, permissions, and access control
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-brand-lighter-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount.count || 0}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+0%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessionsCount.count || 0}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <UserPlus className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Defined</CardTitle>
            <Shield className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">System-wide roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Events (24h)</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditEventsCount.count || 0}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Security events logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/dashboard/admin/users"
              className="block p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-brand-lighter-green-600" />
                <div className="flex-1">
                  <div className="font-medium">Manage Users</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Invite, suspend, or update user roles</div>
                </div>
                <Badge variant="secondary">{usersCount.count || 0}</Badge>
              </div>
            </a>
            <a
              href="/dashboard/admin/roles"
              className="block p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-brand-lighter-green-600" />
                <div className="flex-1">
                  <div className="font-medium">Roles & Permissions</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">View permission matrix and role details</div>
                </div>
                <Badge variant="secondary">8</Badge>
              </div>
            </a>
            <a
              href="/dashboard/admin/audit"
              className="block p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-brand-lighter-green-600" />
                <div className="flex-1">
                  <div className="font-medium">Audit Log</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Review system activity and changes</div>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest administrative actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">
                Connect to audit log for real-time updates
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health & User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Authentication Service</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Database</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">API Gateway</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
            <CardDescription>Active users per role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">
              User role distribution will be displayed here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
