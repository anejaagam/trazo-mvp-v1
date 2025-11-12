'use client';

/**
 * PodAssignmentDialog Component
 * Dialog for assigning/reassigning a pod to a different room
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

interface Pod {
  id: string;
  name: string;
  room_id: string;
}

interface Room {
  id: string;
  name: string;
  room_type: string;
  capacity_pods?: number;
  pod_count?: number;
}

interface Site {
  id: string;
  name: string;
  rooms: Room[];
}

interface PodAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  pod: Pod | null;
  currentSiteId: string;
  sites: Site[];
  onSuccess?: () => void;
}

export function PodAssignmentDialog({
  open,
  onClose,
  pod,
  currentSiteId,
  sites,
  onSuccess,
}: PodAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(currentSiteId);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Reset form when dialog opens/closes or pod changes
  useEffect(() => {
    if (open && pod) {
      setSelectedSiteId(currentSiteId);
      setSelectedRoomId(pod.room_id);
    } else {
      setSelectedSiteId(currentSiteId);
      setSelectedRoomId('');
    }
  }, [open, pod, currentSiteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pod || !selectedRoomId) {
      toast.error('Please select a room');
      return;
    }

    // Don't submit if room hasn't changed
    if (selectedRoomId === pod.room_id) {
      toast.info('Pod is already in this room');
      onClose();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/pods/${pod.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: selectedRoomId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to reassign pod');
        if (data.details) {
          toast.error(data.details);
        }
        return;
      }

      toast.success(`Pod "${pod.name}" reassigned successfully`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error reassigning pod:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const currentSite = sites.find(s => s.id === selectedSiteId);
  const availableRooms = currentSite?.rooms || [];
  const selectedRoom = availableRooms.find(r => r.id === selectedRoomId);

  // Calculate if room is at capacity
  const isRoomAtCapacity = selectedRoom?.capacity_pods && selectedRoom?.pod_count
    ? selectedRoom.pod_count >= selectedRoom.capacity_pods
    : false;

  const isRoomChanging = pod && selectedRoomId !== pod.room_id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Reassign Pod
          </DialogTitle>
          <DialogDescription>
            Move &quot;{pod?.name}&quot; to a different room
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Site Selection */}
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Select
                value={selectedSiteId}
                onValueChange={setSelectedSiteId}
              >
                <SelectTrigger id="site">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Selection */}
            <div className="space-y-2">
              <Label htmlFor="room">Target Room</Label>
              <Select
                value={selectedRoomId}
                onValueChange={setSelectedRoomId}
              >
                <SelectTrigger id="room">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No rooms available at this site
                    </div>
                  ) : (
                    availableRooms.map((room) => {
                      const atCapacity = room.capacity_pods && room.pod_count
                        ? room.pod_count >= room.capacity_pods
                        : false;
                      
                      return (
                        <SelectItem 
                          key={room.id} 
                          value={room.id}
                          disabled={atCapacity && room.id !== pod?.room_id}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{room.name}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {room.room_type}
                              {room.capacity_pods && (
                                <> ({room.pod_count || 0}/{room.capacity_pods})</>
                              )}
                              {atCapacity && room.id !== pod?.room_id && (
                                <span className="text-amber-600 ml-1">(Full)</span>
                              )}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Capacity Warning */}
            {isRoomChanging && selectedRoom && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <div className="font-medium mb-1">Room Information</div>
                <div className="text-muted-foreground space-y-1">
                  <div>Type: <span className="capitalize">{selectedRoom.room_type}</span></div>
                  {selectedRoom.capacity_pods && (
                    <div>
                      Capacity: {selectedRoom.pod_count || 0} / {selectedRoom.capacity_pods} pods
                    </div>
                  )}
                </div>
                
                {isRoomAtCapacity && selectedRoom.id !== pod?.room_id && (
                  <div className="flex items-start gap-2 mt-2 text-amber-600">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">
                      This room is at full capacity. The assignment may be blocked.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedRoomId || !isRoomChanging}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Reassigning...' : 'Reassign Pod'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
