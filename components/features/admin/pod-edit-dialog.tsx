'use client';

/**
 * PodEditDialog Component
 * Dialog for editing pod details including Metrc location mapping
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

interface Pod {
  id: string;
  name: string;
  room_id: string;
  status: string;
  pod_serial_number?: string;
  metrc_location_name?: string;
}

interface PodEditDialogProps {
  open: boolean;
  onClose: () => void;
  pod: Pod | null;
  onSuccess?: () => void;
}

const POD_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'offline', label: 'Offline' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

export function PodEditDialog({
  open,
  onClose,
  pod,
  onSuccess,
}: PodEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    pod_serial_number: '',
    metrc_location_name: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (pod) {
      setFormData({
        name: pod.name || '',
        status: pod.status || 'active',
        pod_serial_number: pod.pod_serial_number || '',
        metrc_location_name: pod.metrc_location_name || '',
      });
    } else {
      // Reset form
      setFormData({
        name: '',
        status: 'active',
        pod_serial_number: '',
        metrc_location_name: '',
      });
    }
  }, [pod, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Pod name is required');
      return;
    }

    if (!pod) {
      toast.error('Pod data is missing');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/pods/${pod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update pod');
      }

      toast.success('Pod updated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating pod:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update pod');
    } finally {
      setLoading(false);
    }
  };

  if (!pod) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Pod</DialogTitle>
          <DialogDescription>
            Update pod details and Metrc location mapping
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pod Name */}
          <div className="space-y-2">
            <Label htmlFor="pod_name">
              Pod Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pod_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VEG-POD-01"
              required
            />
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <Label htmlFor="pod_serial_number">Serial Number</Label>
            <Input
              id="pod_serial_number"
              value={formData.pod_serial_number}
              onChange={(e) => setFormData({ ...formData, pod_serial_number: e.target.value })}
              placeholder="Optional"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POD_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metrc Location Name */}
          <div className="space-y-2">
            <Label htmlFor="metrc_location_name">
              Metrc Location Name
              <span className="text-xs text-muted-foreground ml-2">(For compliance sync)</span>
            </Label>
            <Input
              id="metrc_location_name"
              value={formData.metrc_location_name}
              onChange={(e) => setFormData({ ...formData, metrc_location_name: e.target.value })}
              placeholder="e.g., Vegetative Room 1, Flowering Room 2"
            />
            <p className="text-xs text-muted-foreground">
              Metrc location/room name for this pod. Must match your Metrc facility location names exactly.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Pod
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
