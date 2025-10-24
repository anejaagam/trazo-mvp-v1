'use client';

/**
 * UserManagementClient Component
 * Client wrapper for user management with invite dialog
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { UserTable } from '@/components/features/admin/user-table';
import { UserInviteDialog } from '@/components/features/admin/user-invite-dialog';
import type { UserWithOrg } from '@/types/admin';
import { useRouter } from 'next/navigation';

interface UserManagementClientProps {
  initialUsers: UserWithOrg[];
  organizationId: string;
  inviterRole: import('@/lib/rbac/types').RoleKey;
}

export function UserManagementClient({ initialUsers, organizationId, inviterRole }: UserManagementClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const router = useRouter();

  const handleUserUpdated = () => {
    router.refresh();
  };

  return (
    <>
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
          <UserTable users={initialUsers} inviterRole={inviterRole} onUserUpdated={handleUserUpdated} />
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
