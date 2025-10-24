'use client';

/**
 * UserRoleDialog Component
 * Dialog for assigning/updating a user's role
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ROLES } from '@/lib/rbac/roles';
import type { RoleKey } from '@/lib/rbac/types';
import { canAssignRole } from '@/lib/rbac/hierarchy';
import { toast } from 'sonner';

interface UserRoleDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  currentRole?: RoleKey;
  onUpdated?: () => void;
  inviterRole: RoleKey;
}

export function UserRoleDialog({ open, onClose, userId, currentRole, onUpdated, inviterRole }: UserRoleDialogProps) {
  const [role, setRole] = useState<RoleKey | ''>(currentRole || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setRole(currentRole || '');
    }
  }, [open, currentRole]);

  const handleSubmit = async () => {
    if (!userId || !role) {
      toast.error('Please select a role');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role');
      }
      toast.success('Role updated');
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User Role</DialogTitle>
          <DialogDescription>Select a new role for this user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as RoleKey)} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent align="start" className="w-[400px]">
                {Object.entries(ROLES)
                  .filter(([key]) => canAssignRole(inviterRole, key as RoleKey))
                  .map(([key, roleData]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col py-1 text-left">
                      <div className="font-medium">{roleData.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{roleData.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!role || !canAssignRole(inviterRole, role as RoleKey) || loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
