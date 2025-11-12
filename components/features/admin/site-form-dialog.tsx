'use client';

/**
 * SiteFormDialog Component
 * Dialog for creating and editing sites
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  timezone?: string;
  max_pods?: number;
  site_license_number?: string;
}

interface SiteFormDialogProps {
  open: boolean;
  onClose: () => void;
  site?: Site | null;
  onSuccess?: () => void;
}

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'America/Vancouver',
  'America/Edmonton',
  'America/Winnipeg',
  'America/Halifax',
];

export function SiteFormDialog({
  open,
  onClose,
  site,
  onSuccess,
}: SiteFormDialogProps) {
  const isEdit = !!site;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    max_pods: 48,
    site_license_number: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        address: site.address || '',
        city: site.city || '',
        state_province: site.state_province || '',
        postal_code: site.postal_code || '',
        country: site.country || 'USA',
        timezone: site.timezone || 'America/Los_Angeles',
        max_pods: site.max_pods || 48,
        site_license_number: site.site_license_number || '',
      });
    } else {
      // Reset form when creating new
      setFormData({
        name: '',
        address: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'USA',
        timezone: 'America/Los_Angeles',
        max_pods: 48,
        site_license_number: '',
      });
    }
  }, [site, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Site name is required');
      return;
    }

    setLoading(true);

    try {
      const url = '/api/admin/organizations/sites';
      const method = isEdit ? 'PATCH' : 'POST';
      const body = isEdit
        ? { site_id: site?.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save site');
      }

      toast.success(isEdit ? 'Site updated successfully' : 'Site created successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving site:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Site' : 'Create New Site'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the site details below'
              : 'Add a new site to your organization'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Site Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Site Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Main Facility"
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Farm Road"
            />
          </div>

          {/* City, State, Postal Code Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Portland"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_province">State/Province</Label>
              <Input
                id="state_province"
                value={formData.state_province}
                onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                placeholder="OR"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="97201"
              />
            </div>
          </div>

          {/* Country and Timezone Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USA">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace('America/', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Max Pods and License Number Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_pods">Maximum Pods</Label>
              <Input
                id="max_pods"
                type="number"
                min="1"
                max="999"
                value={formData.max_pods}
                onChange={(e) =>
                  setFormData({ ...formData, max_pods: parseInt(e.target.value) || 48 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_license_number">Site License Number</Label>
              <Input
                id="site_license_number"
                value={formData.site_license_number}
                onChange={(e) =>
                  setFormData({ ...formData, site_license_number: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Site' : 'Create Site'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
