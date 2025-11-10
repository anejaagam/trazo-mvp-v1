import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { UserPlus, Search, MoreVertical, UserCheck, UserX, Mail, Shield } from 'lucide-react';
import { User, UserStatus } from '../lib/supabase';
import { mockUsers, mockRoleBindings, mockRoles } from '../lib/mock-data';
import { UserInviteDialog } from './UserInviteDialog';
import { toast } from 'sonner';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserRoles = (userId: string) => {
    return mockRoleBindings
      .filter(rb => rb.user_id === userId)
      .map(rb => {
        const role = mockRoles.find(r => r.id === rb.role_id);
        return {
          ...rb,
          role_name: role?.display_name || '',
        };
      });
  };

  const handleSuspend = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: 'Suspended' as UserStatus } : u
    ));
    toast.success('User suspended and sessions revoked');
  };

  const handleReactivate = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: 'Active' as UserStatus } : u
    ));
    toast.success('User reactivated');
  };

  const handleResendInvite = (user: User) => {
    toast.success(`Invitation resent to ${user.email}`);
  };

  const getStatusBadge = (status: UserStatus) => {
    const variants: Record<UserStatus, { variant: any; className?: string }> = {
      'Active': { variant: 'default' as const, className: 'bg-green-500' },
      'Invited': { variant: 'secondary' as const },
      'Suspended': { variant: 'destructive' as const },
      'Deactivated': { variant: 'outline' as const },
    };
    return variants[status];
  };

  const getIdpBadge = (idp: string) => {
    const labels: Record<string, string> = {
      'local': 'Email',
      'oidc': 'Google',
      'saml': 'Microsoft',
    };
    return labels[idp] || idp;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Invite users, manage roles, and control access
              </CardDescription>
            </div>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auth Method</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roles = getUserRoles(user.id);
                  const statusConfig = getStatusBadge(user.status);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge {...statusConfig}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getIdpBadge(user.idp)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {roles.map(role => (
                            <Badge key={role.id} variant="secondary" className="text-xs">
                              {role.role_name}
                              <span className="ml-1 text-slate-400">
                                ({role.scope_type})
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {user.last_login_utc 
                          ? new Date(user.last_login_utc).toLocaleString()
                          : '—'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.status === 'Invited' && (
                              <DropdownMenuItem onClick={() => handleResendInvite(user)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Resend Invite
                              </DropdownMenuItem>
                            )}
                            {user.status === 'Active' && (
                              <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
                                <UserX className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            )}
                            {user.status === 'Suspended' && (
                              <DropdownMenuItem onClick={() => handleReactivate(user.id)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Roles
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-slate-500">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      <UserInviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(data) => {
          const newUser: User = {
            id: `u${users.length + 1}`,
            email: data.email,
            name: data.email.split('@')[0],
            status: 'Invited',
            idp: 'local',
            created_at: new Date().toISOString(),
          };
          setUsers([...users, newUser]);
          setInviteOpen(false);
          toast.success(`Invitation sent to ${data.email}`);
        }}
      />
    </div>
  );
}
