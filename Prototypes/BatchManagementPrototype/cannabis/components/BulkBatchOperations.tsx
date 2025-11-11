import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Batch, BatchStage, Pod } from '../types/batch';
import { PackagePlus, MapPin, GitBranch, CheckCircle } from 'lucide-react';

interface BulkBatchOperationsProps {
  batches: Batch[];
  pods: Pod[];
  onBulkStageUpdate: (batchIds: string[], newStage: BatchStage, authorizedBy: string) => void;
  onBulkLocationUpdate: (batchIds: string[], podIds: string[], authorizedBy: string) => void;
}

export function BulkBatchOperations({ 
  batches, 
  pods, 
  onBulkStageUpdate, 
  onBulkLocationUpdate 
}: BulkBatchOperationsProps) {
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState<'stage' | 'location'>('stage');
  const [newStage, setNewStage] = useState<BatchStage>('vegetative');
  const [newPodIds, setNewPodIds] = useState<string[]>([]);
  const [authorizedBy, setAuthorizedBy] = useState('');

  const activeBatches = batches.filter(b => b.stage !== 'closed' && b.quarantineStatus !== 'quarantined');
  const selectedBatches = activeBatches.filter(b => selectedBatchIds.includes(b.id));

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  const selectAll = () => {
    setSelectedBatchIds(activeBatches.map(b => b.id));
  };

  const deselectAll = () => {
    setSelectedBatchIds([]);
  };

  const handleOpenStageUpdate = () => {
    setOperationType('stage');
    setDialogOpen(true);
  };

  const handleOpenLocationUpdate = () => {
    setOperationType('location');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!authorizedBy.trim() || selectedBatchIds.length === 0) return;

    if (operationType === 'stage') {
      onBulkStageUpdate(selectedBatchIds, newStage, authorizedBy.trim());
    } else {
      onBulkLocationUpdate(selectedBatchIds, newPodIds, authorizedBy.trim());
    }

    setDialogOpen(false);
    setSelectedBatchIds([]);
    setAuthorizedBy('');
    setNewPodIds([]);
  };

  const togglePod = (podId: string) => {
    setNewPodIds(prev =>
      prev.includes(podId) ? prev.filter(id => id !== podId) : [...prev, podId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Bulk Batch Operations</h2>
          <p className="text-gray-600">Update stage or location for multiple batches simultaneously</p>
        </div>
        <div className="flex gap-2">
          {selectedBatchIds.length > 0 && (
            <>
              <Button variant="outline" onClick={handleOpenStageUpdate}>
                <GitBranch className="w-4 h-4 mr-2" />
                Update Stage ({selectedBatchIds.length})
              </Button>
              <Button variant="outline" onClick={handleOpenLocationUpdate}>
                <MapPin className="w-4 h-4 mr-2" />
                Update Location ({selectedBatchIds.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Selection Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-900">{selectedBatchIds.length} batch(es) selected</p>
            <p className="text-gray-600">Select batches to perform bulk operations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll} disabled={selectedBatchIds.length === 0}>
              Deselect All
            </Button>
          </div>
        </div>
      </Card>

      {/* Batch Selection List */}
      <div className="space-y-3">
        {activeBatches.map(batch => (
          <Card 
            key={batch.id} 
            className={`p-4 cursor-pointer transition-colors ${
              selectedBatchIds.includes(batch.id) ? 'border-blue-600 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => toggleBatch(batch.id)}
          >
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedBatchIds.includes(batch.id)}
                onCheckedChange={() => toggleBatch(batch.id)}
              />
              
              <PackagePlus className="w-5 h-5 text-gray-600" />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-gray-900">{batch.name}</h4>
                  <Badge variant="outline">{batch.cultivar}</Badge>
                  <Badge className="bg-blue-100 text-blue-800">{batch.stage}</Badge>
                </div>
                <p className="text-gray-600">
                  {batch.plantCount} plants • 
                  {' '}{batch.podIds.length} pod(s) •
                  {' '}Started {new Date(batch.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {activeBatches.length === 0 && (
          <Card className="p-8 text-center">
            <PackagePlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No active batches available for bulk operations</p>
          </Card>
        )}
      </div>

      {/* Bulk Operation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {operationType === 'stage' ? 'Bulk Stage Update' : 'Bulk Location Update'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <p className="text-gray-900 mb-1">
                  Updating {selectedBatchIds.length} batch(es)
                </p>
                <p className="text-gray-700">
                  {selectedBatches.map(b => b.name).join(', ')}
                </p>
              </AlertDescription>
            </Alert>

            {operationType === 'stage' ? (
              <div>
                <Label htmlFor="new-stage">New Stage <span className="text-red-600">*</span></Label>
                <Select value={newStage} onValueChange={(val) => setNewStage(val as BatchStage)}>
                  <SelectTrigger id="new-stage" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="propagation">Propagation</SelectItem>
                    <SelectItem value="vegetative">Vegetative</SelectItem>
                    <SelectItem value="flowering">Flowering</SelectItem>
                    <SelectItem value="harvest">Harvest</SelectItem>
                    <SelectItem value="drying">Drying</SelectItem>
                    <SelectItem value="curing">Curing</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-gray-500 mt-1">
                  All selected batches will be transitioned to this stage
                </p>
              </div>
            ) : (
              <div>
                <Label>Assign to Pods <span className="text-red-600">*</span></Label>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {pods.map(pod => (
                    <div
                      key={pod.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        newPodIds.includes(pod.id) ? 'border-blue-600 bg-blue-50' : 'hover:border-blue-300'
                      }`}
                      onClick={() => togglePod(pod.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={newPodIds.includes(pod.id)}
                          onCheckedChange={() => togglePod(pod.id)}
                        />
                        <div className="flex-1">
                          <p className="text-gray-900">{pod.name}</p>
                          <p className="text-gray-600">{pod.location} • Capacity: {pod.capacity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 mt-2">
                  {newPodIds.length} pod(s) selected
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="authorized-by-bulk">
                Authorized By <span className="text-red-600">*</span>
              </Label>
              <Input
                id="authorized-by-bulk"
                placeholder="Enter your full name"
                value={authorizedBy}
                onChange={(e) => setAuthorizedBy(e.target.value)}
                className="mt-2"
              />
              <p className="text-gray-500 mt-1">
                This change will be recorded in each batch's timeline
              </p>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                <p className="text-blue-900">
                  This operation will update all selected batches and sync changes to Metrc
                </p>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogOpen(false);
              setAuthorizedBy('');
              setNewPodIds([]);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !authorizedBy.trim() || 
                (operationType === 'location' && newPodIds.length === 0)
              }
            >
              Update {selectedBatchIds.length} Batch(es)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
