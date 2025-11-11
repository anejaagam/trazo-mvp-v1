import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Pod, BatchStage } from '../types/batch';

interface CreateBatchDialogProps {
  open: boolean;
  onClose: () => void;
  pods: Pod[];
  onCreateBatch: (data: {
    name: string;
    cultivar: string;
    stage: BatchStage;
    startDate: string;
    podIds: string[];
    plantCount: number;
  }) => void;
}

export function CreateBatchDialog({ open, onClose, pods, onCreateBatch }: CreateBatchDialogProps) {
  const [name, setName] = useState('');
  const [cultivar, setCultivar] = useState('');
  const [stage, setStage] = useState<BatchStage>('propagation');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPodIds, setSelectedPodIds] = useState<string[]>([]);
  const [plantCount, setPlantCount] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBatch({
      name,
      cultivar,
      stage,
      startDate,
      podIds: selectedPodIds,
      plantCount: parseInt(plantCount, 10),
    });
    // Reset form
    setName('');
    setCultivar('');
    setStage('propagation');
    setStartDate(new Date().toISOString().split('T')[0]);
    setSelectedPodIds([]);
    setPlantCount('0');
    onClose();
  };

  const togglePod = (podId: string) => {
    setSelectedPodIds(prev =>
      prev.includes(podId) ? prev.filter(id => id !== podId) : [...prev, podId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Cannabis Batch</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Batch ID / Name</Label>
              <Input
                id="name"
                placeholder="BTH-2025-001"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="cultivar">Cannabis Strain</Label>
              <Input
                id="cultivar"
                placeholder="e.g., Blue Dream, OG Kush"
                value={cultivar}
                onChange={(e) => setCultivar(e.target.value)}
                required
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stage">Initial Stage</Label>
              <Select value={stage} onValueChange={(val) => setStage(val as BatchStage)}>
                <SelectTrigger id="stage" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="propagation">Propagation</SelectItem>
                  <SelectItem value="vegetative">Vegetative</SelectItem>
                  <SelectItem value="flowering">Flowering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plantCount">Plant Count</Label>
            <Input
              id="plantCount"
              type="number"
              min="0"
              placeholder="100"
              value={plantCount}
              onChange={(e) => setPlantCount(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label>Assign to Grow Rooms</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {pods.map(pod => (
                <div key={pod.id} className="flex items-center gap-3">
                  <Checkbox
                    id={pod.id}
                    checked={selectedPodIds.includes(pod.id)}
                    onCheckedChange={() => togglePod(pod.id)}
                  />
                  <label htmlFor={pod.id} className="flex-1 cursor-pointer">
                    <p className="text-gray-900">{pod.name}</p>
                    <p className="text-gray-600">
                      {pod.location} • Capacity: {pod.capacity}
                    </p>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-gray-600 mt-2">
              {selectedPodIds.length} pod(s) selected
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedPodIds.length === 0}>
              Create Batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
