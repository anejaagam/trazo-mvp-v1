'use client';

/**
 * UserManagementClient Component
 * Client wrapper for user management with invite dialog
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Clock, Mail, MoreHorizontal, RefreshCw, XCircle } from 'lucide-react';
import { UserTable } from '@/components/features/admin/user-table';
import { UserInviteDialog } from '@/components/features/admin/user-invite-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserWithOrg } from '@/types/admin';
import type { PendingInvitation } from '@/lib/supabase/queries/users';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface UserManagementClientProps {
  initialUsers: UserWithOrg[];
  pendingInvitations: PendingInvitation[];
  organizationId: string;
  inviterRole: import('@/lib/rbac/types').RoleKey;
}

export function UserManagementClient({ initialUsers, pendingInvitations, organizationId, inviterRole }: UserManagementClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleUserUpdated = () => {
    router.refresh();
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('pending_invitations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (error) throw error;
      toast.success('Invitation cancelled');
      router.refresh();
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      // Call API to resend invitation email
      const response = await fetch(`/api/admin/invite/${invitationId}/resend`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend invitation');
      }

      toast.success('Invitation email resent successfully');
      router.refresh();
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <>
      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    Users invited but not yet registered
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {pendingInvitations.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatRole(invitation.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invitation.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invitation.expires_at ? formatDate(invitation.expires_at) : 'Never'}
                    </TableCell>
                    <TableCell>
                      {isExpired(invitation.expires_at) ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            disabled={processingId === invitation.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="cursor-pointer"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Resend Invitation
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Invitation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user access, roles, and permissions
              </CardDescription>
            </div>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UserTable users={initialUsers} inviterRole={inviterRole} organizationId={organizationId} onUserUpdated={handleUserUpdated} />
        </CardContent>
      </Card>

      <UserInviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={handleUserUpdated}
        organizationId={organizationId}
        inviterRole={inviterRole}
      />
    </>
  );
}
