import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users, Shield, Key, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { mockUsers, mockApiTokens, mockAuditEvents, mockSessions } from '../lib/mock-data';

export function Dashboard() {
  const activeUsers = mockUsers.filter(u => u.status === 'Active').length;
  const invitedUsers = mockUsers.filter(u => u.status === 'Invited').length;
  const suspendedUsers = mockUsers.filter(u => u.status === 'Suspended').length;
  const activeTokens = mockApiTokens.filter(t => !t.revoked_at_utc).length;
  const recentEvents = mockAuditEvents.slice(0, 5);
  const activeSessions = mockSessions.length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{activeUsers}</div>
            <p className="text-xs text-slate-500">
              {invitedUsers} pending invites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{activeSessions}</div>
            <p className="text-xs text-slate-500">
              Across all sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">API Tokens</CardTitle>
            <Key className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{activeTokens}</div>
            <p className="text-xs text-slate-500">
              Site-scoped credentials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{suspendedUsers}</div>
            <p className="text-xs text-slate-500">
              Suspended accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Security Posture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">MFA Enrollment</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">100%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">SSO Integration</span>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Step-up Policy</span>
              <Badge variant="outline">12h TTL</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Session Timeout</span>
              <Badge variant="outline">60 min</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Audit Retention</span>
              <Badge variant="secondary">7 years</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance SLOs</CardTitle>
            <CardDescription>Current vs Target</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Login Latency (SSO)</span>
                <span className="text-sm font-medium text-green-600">1.2s</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '60%' }} />
              </div>
              <div className="text-xs text-slate-500 mt-1">Target: p95 ≤ 2s</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">RBAC Check</span>
                <span className="text-sm font-medium text-green-600">6ms</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '60%' }} />
              </div>
              <div className="text-xs text-slate-500 mt-1">Target: p95 ≤ 10ms</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Session Revocation</span>
                <span className="text-sm font-medium text-green-600">45s</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
              </div>
              <div className="text-xs text-slate-500 mt-1">Target: p95 ≤ 60s</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Audit Events</CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 text-sm">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{event.actor_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.action}
                    </Badge>
                    {event.subject_name && (
                      <span className="text-slate-500">→ {event.subject_name}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(event.ts_utc).toLocaleString()}
                    {event.ip && ` • ${event.ip}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Invite User
            </Button>
            <Button variant="outline" className="justify-start">
              <Key className="mr-2 h-4 w-4" />
              Create Token
            </Button>
            <Button variant="outline" className="justify-start">
              <Activity className="mr-2 h-4 w-4" />
              Export Audit Log
            </Button>
            <Button variant="outline" className="justify-start">
              <Shield className="mr-2 h-4 w-4" />
              View Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
