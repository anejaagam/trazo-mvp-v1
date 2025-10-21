'use client';

/**
 * UserTable Component
 * Client component for displaying and managing users
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, UserCheck, UserX, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { UserWithOrg, UserStatus } from '@/types/admin';
import { UserRoleDialog } from '@/components/features/admin/user-role-dialog';

interface UserTableProps {
  users: UserWithOrg[];
  onUserUpdated?: () => void;
}

export function UserTable({ users, onUserUpdated }: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<UserWithOrg['role'] | undefined>(undefined);

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuspend = async (userId: string) => {
    try {
      setLoading(userId);
      
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'suspended' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to suspend user');
      }

      toast.success('User suspended and sessions revoked');
      onUserUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to suspend user');
    } finally {
      setLoading(null);
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      setLoading(userId);
      
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate user');
      }

      toast.success('User reactivated');
      onUserUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reactivate user');
    } finally {
      setLoading(null);
    }
  };

  const handleResendInvite = async (userId: string, email: string) => {
    try {
      setLoading(userId);
      
      const response = await fetch(`/api/admin/users/${userId}/resend-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      toast.success(`Invitation resent to ${email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    const variants: Record<
      UserStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
    > = {
      active: { variant: 'default' as const, className: 'bg-green-600' },
      invited: { variant: 'secondary' as const },
      suspended: { variant: 'destructive' as const },
      deactivated: { variant: 'outline' as const },
    };
    return variants[status];
  };

  const getIdpBadge = (idp: string) => {
    const labels: Record<string, string> = {
      local: 'Email',
      oidc: 'Google',
      saml: 'Microsoft',
    };
    return labels[idp] || idp;
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      org_admin: 'Org Admin',
      site_manager: 'Site Manager',
      head_grower: 'Head Grower',
      operator: 'Operator',
      compliance_qa: 'Compliance/QA',
      executive_viewer: 'Executive Viewer',
      installer_tech: 'Installer/Tech',
      support: 'Support',
    };
    return labels[role] || role;
  };

  const openRoleDialog = (user: UserWithOrg) => {
    setSelectedUserId(user.id);
    setSelectedUserRole(user.role);
    setRoleDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Auth Method</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const statusConfig = getStatusBadge(user.status);
                const isLoading = loading === user.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.organization.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge {...statusConfig}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getIdpBadge(user.idp)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {getRoleBadge(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isLoading}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.status === 'invited' && (
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(user.id, user.email)}
                              disabled={isLoading}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          {user.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleSuspend(user.id)}
                              disabled={isLoading}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                          {user.status === 'suspended' && (
                            <DropdownMenuItem
                              onClick={() => handleReactivate(user.id)}
                              disabled={isLoading}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Manage Roles
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      <UserRoleDialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        userId={selectedUserId}
        currentRole={selectedUserRole as any}
        onUpdated={onUserUpdated}
      />
    </div>
  );
}
