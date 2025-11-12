'use client';

/**
 * UserInviteDialog Component
 * Dialog for inviting new users with role and site assignment
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { ROLES } from '@/lib/rbac/roles';
import type { RoleKey } from '@/lib/rbac/types';
import { canAssignRole } from '@/lib/rbac/hierarchy';

interface Site {
  id: string;
  name: string;
}

interface UserInviteDialogProps {
  open: boolean;
  onClose: () => void;
  onInvited?: () => void;
  organizationId: string;
  inviterRole: RoleKey;
}

export function UserInviteDialog({
  open,
  onClose,
  onInvited,
  organizationId,
  inviterRole,
}: UserInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<RoleKey | ''>('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  // Fetch available sites when dialog opens
  const fetchSites = useCallback(async () => {
    try {
      setLoadingSites(true);
      const response = await fetch(`/api/admin/sites?organization_id=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch sites');
      const data = await response.json();
      setSites(data.sites || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast.error('Failed to load sites');
    } finally {
      setLoadingSites(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (open && organizationId) {
      fetchSites();
    }
  }, [open, organizationId, fetchSites]);

  const toggleSite = (siteId: string) => {
    setSelectedSiteIds(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const toggleAllSites = () => {
    if (selectedSiteIds.length === sites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(sites.map(s => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      toast.error('Please select a role');
      return;
    }

    try {
      setLoading(true);
      
      // Call API route instead of direct server function
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          full_name: fullName,
          role: role as RoleKey,
          organization_id: organizationId,
          site_ids: selectedSiteIds.length > 0 ? selectedSiteIds : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user');
      }

      toast.success(`Invitation sent to ${email}`);
      
      // Reset form
      setEmail('');
      setFullName('');
      setRole('');
      setSelectedSiteIds([]);
      
      onInvited?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setFullName('');
      setRole('');
      setSelectedSiteIds([]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation with a role assignment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(val: string) => setRole(val as RoleKey)}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLES)
                  .filter(([key]) => canAssignRole(inviterRole, key as RoleKey))
                  .map(([key, roleData]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col py-1">
                      <div className="font-medium">{roleData.name}</div>
                      <div className="text-xs text-slate-500">
                        {roleData.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Site Assignment Section */}
          {sites.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Site Access (Optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllSites}
                  disabled={loading || loadingSites}
                  className="h-auto p-1 text-xs"
                >
                  {selectedSiteIds.length === sites.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <ScrollArea className="h-32 rounded-md border p-3">
                <div className="space-y-2">
                  {loadingSites ? (
                    <p className="text-sm text-muted-foreground">Loading sites...</p>
                  ) : (
                    sites.map((site) => (
                      <div key={site.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`site-${site.id}`}
                          checked={selectedSiteIds.includes(site.id)}
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
                    ))
                  )}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedSiteIds.length === 0
                  ? 'No sites selected. User will be assigned to default site.'
                  : `${selectedSiteIds.length} site${selectedSiteIds.length > 1 ? 's' : ''} selected`}
              </p>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
            <p className="text-slate-600">
              The user will receive an email invitation to join your organization.
            </p>
            <p className="text-slate-600">
              They can sign in using email/password or SSO.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!email || !fullName || !role || !canAssignRole(inviterRole, role as RoleKey) || loading}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
