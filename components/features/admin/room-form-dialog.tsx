'use client';

/**
 * RoomFormDialog Component
 * Dialog for creating and editing rooms within a site
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

interface Room {
  id: string;
  name: string;
  capacity_pods?: number;
  room_type?: string;
  dimensions_length_ft?: number;
  dimensions_width_ft?: number;
  dimensions_height_ft?: number;
  environmental_zone?: string;
}

interface RoomFormDialogProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
  room?: Room | null;
  onSuccess?: () => void;
}

const ROOM_TYPES = [
  { value: 'veg', label: 'Vegetation' },
  { value: 'flower', label: 'Flowering' },
  { value: 'mother', label: 'Mother Room' },
  { value: 'clone', label: 'Clone Room' },
  { value: 'dry', label: 'Drying Room' },
  { value: 'cure', label: 'Curing Room' },
  { value: 'mixed', label: 'Mixed Use' },
  { value: 'processing', label: 'Processing' },
  { value: 'storage', label: 'Storage' },
];

export function RoomFormDialog({
  open,
  onClose,
  siteId,
  room,
  onSuccess,
}: RoomFormDialogProps) {
  const isEdit = !!room;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity_pods: 8,
    room_type: '',
    dimensions_length_ft: 0,
    dimensions_width_ft: 0,
    dimensions_height_ft: 0,
    environmental_zone: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        capacity_pods: room.capacity_pods || 8,
        room_type: room.room_type || '',
        dimensions_length_ft: room.dimensions_length_ft || 0,
        dimensions_width_ft: room.dimensions_width_ft || 0,
        dimensions_height_ft: room.dimensions_height_ft || 0,
        environmental_zone: room.environmental_zone || '',
      });
    } else {
      // Reset form when creating new
      setFormData({
        name: '',
        capacity_pods: 8,
        room_type: '',
        dimensions_length_ft: 0,
        dimensions_width_ft: 0,
        dimensions_height_ft: 0,
        environmental_zone: '',
      });
    }
  }, [room, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    setLoading(true);

    try {
      const url = `/api/admin/organizations/sites/${siteId}/rooms`;
      const method = isEdit ? 'PATCH' : 'POST';
      const body = isEdit
        ? { room_id: room?.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save room');
      }

      toast.success(isEdit ? 'Room updated successfully' : 'Room created successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Room' : 'Create New Room'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the room details below'
              : 'Add a new room to this site'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Name and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Room Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Veg Room 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_type">Room Type</Label>
              <Select
                value={formData.room_type}
                onValueChange={(value) => setFormData({ ...formData, room_type: value })}
              >
                <SelectTrigger id="room_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Capacity and Environmental Zone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity_pods">Pod Capacity</Label>
              <Input
                id="capacity_pods"
                type="number"
                min="1"
                max="999"
                value={formData.capacity_pods}
                onChange={(e) =>
                  setFormData({ ...formData, capacity_pods: parseInt(e.target.value) || 8 })
                }
              />
              <p className="text-xs text-muted-foreground">Maximum number of pods</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="environmental_zone">Environmental Zone</Label>
              <Input
                id="environmental_zone"
                value={formData.environmental_zone}
                onChange={(e) =>
                  setFormData({ ...formData, environmental_zone: e.target.value })
                }
                placeholder="Zone A"
              />
              <p className="text-xs text-muted-foreground">For grouping rooms</p>
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label>Dimensions (feet)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length" className="text-sm text-muted-foreground">
                  Length
                </Label>
                <Input
                  id="length"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.dimensions_length_ft}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensions_length_ft: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width" className="text-sm text-muted-foreground">
                  Width
                </Label>
                <Input
                  id="width"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.dimensions_width_ft}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensions_width_ft: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm text-muted-foreground">
                  Height
                </Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.dimensions_height_ft}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensions_height_ft: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.0"
                />
              </div>
            </div>
            {formData.dimensions_length_ft > 0 && formData.dimensions_width_ft > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Floor area: {(formData.dimensions_length_ft * formData.dimensions_width_ft).toFixed(1)} sq ft
                {formData.dimensions_height_ft > 0 && (
                  <> • Volume: {(formData.dimensions_length_ft * formData.dimensions_width_ft * formData.dimensions_height_ft).toFixed(1)} cu ft</>
                )}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Room' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
