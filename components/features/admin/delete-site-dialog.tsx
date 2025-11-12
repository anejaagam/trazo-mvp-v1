'use client';

/**
 * DeleteSiteDialog Component
 * Confirmation dialog for deleting sites
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

interface DeleteSiteDialogProps {
  open: boolean;
  onClose: () => void;
  siteId: string | null;
  siteName?: string;
  roomCount?: number;
  podCount?: number;
  onSuccess?: () => void;
}

export function DeleteSiteDialog({
  open,
  onClose,
  siteId,
  siteName,
  roomCount = 0,
  podCount = 0,
  onSuccess,
}: DeleteSiteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!siteId) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/organizations/sites?site_id=${siteId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Show more detailed error if available
        const errorMessage = data.details || data.error || 'Failed to delete site'
        throw new Error(errorMessage);
      }

      toast.success('Site deactivated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error deleting site:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Site</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to deactivate{' '}
              <span className="font-semibold text-foreground">{siteName}</span>?
            </p>
            {(roomCount > 0 || podCount > 0) && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  ⚠️ This site contains:
                </p>
                <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {roomCount > 0 && <li>• {roomCount} room(s)</li>}
                  {podCount > 0 && <li>• {podCount} pod(s)</li>}
                </ul>
                <p className="mt-3 text-sm text-amber-800 dark:text-amber-200 font-semibold">
                  ⚠️ Deactivation will be blocked if any rooms or pods are still active.
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  Please ensure all rooms and pods are deactivated or decommissioned before 
                  attempting to deactivate this site.
                </p>
              </div>
            )}
            <p className="mt-4 text-sm">
              This action will mark the site as inactive. It can be reactivated later by
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
            Deactivate Site
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
