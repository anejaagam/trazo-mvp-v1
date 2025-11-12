'use client';

/**
 * UserSiteAssignmentDialog Component
 * Dialog for managing user site assignments
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Site {
  id: string;
  name: string;
}

interface UserSiteAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userName?: string;
  organizationId: string;
  onUpdated?: () => void;
}

export function UserSiteAssignmentDialog({
  open,
  onClose,
  userId,
  userName,
  organizationId,
  onUpdated,
}: UserSiteAssignmentDialogProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [assignedSiteIds, setAssignedSiteIds] = useState<string[]>([]);
  const [originalAssignedSiteIds, setOriginalAssignedSiteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Fetch available sites and current assignments when dialog opens
  const fetchData = useCallback(async () => {
    if (!userId || !organizationId) return;

    try {
      setLoadingSites(true);
      setLoadingAssignments(true);

      // Fetch available sites
      const sitesResponse = await fetch(`/api/admin/sites?organization_id=${organizationId}`);
      if (!sitesResponse.ok) throw new Error('Failed to fetch sites');
      const sitesData = await sitesResponse.json();
      setSites(sitesData.sites || []);
      setLoadingSites(false);

      // Fetch current site assignments
      const assignmentsResponse = await fetch(`/api/admin/users/${userId}/sites`);
      if (!assignmentsResponse.ok) throw new Error('Failed to fetch site assignments');
      const assignmentsData = await assignmentsResponse.json();
      const siteIds = assignmentsData.assignments?.map((a: { site_id: string }) => a.site_id) || [];
      setAssignedSiteIds(siteIds);
      setOriginalAssignedSiteIds(siteIds);
      setLoadingAssignments(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load site data');
      setLoadingSites(false);
      setLoadingAssignments(false);
    }
  }, [userId, organizationId]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const toggleSite = (siteId: string) => {
    setAssignedSiteIds(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const toggleAllSites = () => {
    if (assignedSiteIds.length === sites.length) {
      setAssignedSiteIds([]);
    } else {
      setAssignedSiteIds(sites.map(s => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setLoading(true);

      // Determine which sites to add and remove
      const sitesToAdd = assignedSiteIds.filter(id => !originalAssignedSiteIds.includes(id));
      const sitesToRemove = originalAssignedSiteIds.filter(id => !assignedSiteIds.includes(id));

      // Update site assignments
      const response = await fetch(`/api/admin/users/${userId}/sites`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          add_site_ids: sitesToAdd,
          remove_site_ids: sitesToRemove,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update site assignments');
      }

      toast.success('Site assignments updated successfully');
      onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update site assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAssignedSiteIds([]);
      setOriginalAssignedSiteIds([]);
      setSites([]);
      onClose();
    }
  };

  const hasChanges = JSON.stringify([...assignedSiteIds].sort()) !== JSON.stringify([...originalAssignedSiteIds].sort());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Site Access</DialogTitle>
          <DialogDescription>
            {userName ? `Configure site assignments for ${userName}` : 'Configure site assignments for this user'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingSites || loadingAssignments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {sites.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Assigned Sites</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllSites}
                      disabled={loading}
                      className="h-auto p-1 text-xs"
                    >
                      {assignedSiteIds.length === sites.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <div className="space-y-3">
                      {sites.map((site) => (
                        <div key={site.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`site-${site.id}`}
                            checked={assignedSiteIds.includes(site.id)}
                            onCheckedChange={() => toggleSite(site.id)}
                            disabled={loading}
                          />
                          <label
                            htmlFor={`site-${site.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {site.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <p className="text-xs text-muted-foreground">
                    {assignedSiteIds.length === 0
                      ? 'No sites assigned. User will use default site.'
                      : `${assignedSiteIds.length} site${assignedSiteIds.length > 1 ? 's' : ''} assigned`}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No sites available in this organization
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingSites || loadingAssignments || !hasChanges}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
