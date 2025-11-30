import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { BatchGroup, Batch } from '../types/batch';
import { Users, Plus, Trash2 } from 'lucide-react';

interface BatchGroupManagementProps {
  groups: BatchGroup[];
  batches: Batch[];
  onCreateGroup: (data: { name: string; description: string; batchIds: string[] }) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddBatchToGroup: (groupId: string, batchId: string) => void;
  onRemoveBatchFromGroup: (groupId: string, batchId: string) => void;
}

export function BatchGroupManagement({
  groups,
  batches,
  onCreateGroup,
  onDeleteGroup,
  onAddBatchToGroup,
  onRemoveBatchFromGroup,
}: BatchGroupManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  const handleCreateGroup = () => {
    if (groupName && selectedBatchIds.length > 0) {
      onCreateGroup({
        name: groupName,
        description: groupDescription,
        batchIds: selectedBatchIds,
      });
      setGroupName('');
      setGroupDescription('');
      setSelectedBatchIds([]);
      setDialogOpen(false);
    }
  };

  const toggleBatchSelection = (batchId: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900">Batch Groups</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(group => {
          const groupBatches = batches.filter(b => group.batchIds.includes(b.id));
          const totalPlants = groupBatches.reduce((sum, b) => sum + b.plantCount, 0);

          return (
            <Card key={group.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-gray-900">{group.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteGroup(group.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>

              <p className="text-gray-600 mb-4">{group.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-gray-500">Batches</p>
                  <p className="text-gray-900">{groupBatches.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Plants</p>
                  <p className="text-gray-900">{totalPlants}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-gray-500">Batches in Group:</p>
                <div className="flex flex-wrap gap-2">
                  {groupBatches.map(batch => (
                    <Badge key={batch.id} variant="outline">
                      {batch.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}

        {groups.length === 0 && (
          <Card className="p-8 col-span-2 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No batch groups created yet</p>
            <p className="text-gray-500 mb-4">
              Create groups to manage multiple batches together
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Group
            </Button>
          </Card>
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Batch Group</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Spring 2025 Production"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                placeholder="Primary production batches for Q1 2025"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Select Batches</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {batches
                  .filter(b => b.stage !== 'closed')
                  .map(batch => (
                    <div
                      key={batch.id}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-colors
                        ${selectedBatchIds.includes(batch.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                      `}
                      onClick={() => toggleBatchSelection(batch.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-900">{batch.name}</p>
                          <p className="text-gray-600">{batch.cultivar}</p>
                        </div>
                        <Badge>{batch.stage}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
              <p className="text-gray-600 mt-2">
                {selectedBatchIds.length} batch(es) selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName || selectedBatchIds.length === 0}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
