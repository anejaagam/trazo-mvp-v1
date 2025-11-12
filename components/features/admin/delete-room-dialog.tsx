'use client';

/**
 * DeleteRoomDialog Component
 * Confirmation dialog for deleting rooms
 */

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DeleteRoomDialogProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
  roomId: string | null;
  roomName?: string;
  podCount?: number;
  onSuccess?: () => void;
}

export function DeleteRoomDialog({
  open,
  onClose,
  siteId,
  roomId,
  roomName,
  podCount = 0,
  onSuccess,
}: DeleteRoomDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!roomId) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/organizations/sites/${siteId}/rooms?room_id=${roomId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details || data.error || 'Failed to delete room'
        throw new Error(errorMessage);
      }

      toast.success('Room deactivated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Room</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to deactivate{' '}
              <span className="font-semibold text-foreground">{roomName}</span>?
            </p>
            {podCount > 0 && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  ⚠️ This room contains {podCount} pod(s)
                </p>
                <p className="mt-3 text-sm text-amber-800 dark:text-amber-200 font-semibold">
                  ⚠️ Deactivation will be blocked if any pods are still active.
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  Please ensure all pods are decommissioned before attempting to deactivate this room.
                </p>
              </div>
            )}
            <p className="mt-4 text-sm">
              This action will mark the room as inactive. It can be reactivated later by
              an administrator if needed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deactivate Room
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
