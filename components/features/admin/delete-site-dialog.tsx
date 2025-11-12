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

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        if (isJson) {
          const data = await response.json();
          const errorMessage = data.details || data.error || 'Failed to delete site';
          toast.error(errorMessage);
        } else {
          // Handle non-JSON error responses
          const text = await response.text();
          toast.error(text || 'Failed to delete site');
        }
        setLoading(false);
        return;
      }

      // Success response
      if (isJson) {
        await response.json(); // Consume the response
      }
      
      toast.success('Site deleted successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      // Only log unexpected errors (network issues, etc.)
      console.error('Unexpected error deleting site:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Site</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{siteName}</span>?
            </span>
            {(roomCount > 0 || podCount > 0) && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="text-sm text-red-800 dark:text-red-200 font-medium">
                  ⚠️ This site contains:
                </div>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                  {roomCount > 0 && <li>• {roomCount} room(s)</li>}
                  {podCount > 0 && <li>• {podCount} pod(s)</li>}
                </ul>
                <div className="mt-3 text-sm text-red-800 dark:text-red-200 font-semibold">
                  ⚠️ You must delete all rooms and pods first.
                </div>
                <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                  Sites with assigned users, rooms, or pods cannot be deleted.
                  Delete or reassign all dependencies before deleting this site.
                </div>
              </div>
            )}
            <span className="block mt-4 text-sm font-semibold text-red-600 dark:text-red-400">
              This action cannot be undone. The site will be permanently deleted.
            </span>
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
            Delete Site
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
