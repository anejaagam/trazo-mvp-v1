import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { PlantCountSnapshot } from '../types/plant-tracking';
import { Users, Plus, TrendingUp } from 'lucide-react';

interface PlantCountTrackingProps {
  batchId: string;
  snapshots: PlantCountSnapshot[];
  onRecordSnapshot: (snapshot: Omit<PlantCountSnapshot, 'id' | 'timestamp'>) => void;
}

export function PlantCountTracking({ batchId, snapshots, onRecordSnapshot }: PlantCountTrackingProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [immatureCount, setImmatureCount] = useState('');
  const [floweringCount, setFloweringCount] = useState('');
  const [technicianName, setTechnicianName] = useState('');

  const latestSnapshot = snapshots[0];
  const previousSnapshot = snapshots[1];

  const handleSubmit = () => {
    if (!immatureCount && !floweringCount) return;

    const immature = parseInt(immatureCount) || 0;
    const flowering = parseInt(floweringCount) || 0;

    onRecordSnapshot({
      batchId,
      immatureLots: immature > 0 ? [{ lotId: `lot-${Date.now()}`, count: immature }] : [],
      individualFloweringCount: flowering,
      totalCount: immature + flowering,
      recordedBy: technicianName.trim() || 'System',
    });

    setDialogOpen(false);
    setImmatureCount('');
    setFloweringCount('');
    setTechnicianName('');
  };

  const calculateChange = (current?: number, previous?: number) => {
    if (!current || !previous) return null;
    const change = current - previous;
    return {
      value: Math.abs(change),
      isIncrease: change > 0,
      percentage: ((change / previous) * 100).toFixed(1),
    };
  };

  const countChange = calculateChange(latestSnapshot?.totalCount, previousSnapshot?.totalCount);

  return (
    <div className="space-y-6">
      {/* Current Count Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-gray-900">Current Plant Count</h3>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Count
          </Button>
        </div>

        {latestSnapshot ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-600 mb-1">Immature Plants</p>
                <p className="text-gray-900">
                  {latestSnapshot.immatureLots.reduce((sum, lot) => sum + lot.count, 0)}
                </p>
                <p className="text-gray-500">
                  {latestSnapshot.immatureLots.length} lot(s)
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-gray-600 mb-1">Flowering Plants</p>
                <p className="text-gray-900">{latestSnapshot.individualFloweringCount}</p>
                <p className="text-gray-500">Individual tracking</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-gray-600 mb-1">Total Count</p>
                <p className="text-gray-900">{latestSnapshot.totalCount}</p>
                {countChange && (
                  <div className={`flex items-center gap-1 ${countChange.isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`w-4 h-4 ${!countChange.isIncrease ? 'rotate-180' : ''}`} />
                    <p>{countChange.value} ({countChange.percentage}%)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-gray-500">Last Updated</p>
              <p className="text-gray-700">
                {new Date(latestSnapshot.timestamp).toLocaleString()} by {latestSnapshot.recordedBy}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No plant count recorded yet</p>
            <p className="text-gray-500 mb-4">Record your first plant count to start tracking</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Record First Count
            </Button>
          </div>
        )}
      </Card>

      {/* Count History */}
      {snapshots.length > 0 && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-4">Count History</h3>
          <div className="space-y-3">
            {snapshots.slice(0, 10).map((snapshot) => (
              <div key={snapshot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-1">
                    <Badge variant="outline">
                      Total: {snapshot.totalCount}
                    </Badge>
                    <span className="text-gray-600">
                      Immature: {snapshot.immatureLots.reduce((sum, lot) => sum + lot.count, 0)} | 
                      Flowering: {snapshot.individualFloweringCount}
                    </span>
                  </div>
                  <p className="text-gray-500">
                    {new Date(snapshot.timestamp).toLocaleString()} • {snapshot.recordedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Record Count Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Plant Count</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="immature-count">Immature Plants (Lots up to 100)</Label>
              <Input
                id="immature-count"
                type="number"
                min="0"
                placeholder="Enter total immature plant count"
                value={immatureCount}
                onChange={(e) => setImmatureCount(e.target.value)}
                className="mt-2"
              />
              <p className="text-gray-500 mt-1">Plants tracked in lots before individual tagging</p>
            </div>

            <div>
              <Label htmlFor="flowering-count">Individual Flowering Plants</Label>
              <Input
                id="flowering-count"
                type="number"
                min="0"
                placeholder="Enter flowering plant count"
                value={floweringCount}
                onChange={(e) => setFloweringCount(e.target.value)}
                className="mt-2"
              />
              <p className="text-gray-500 mt-1">Individually tagged and tracked plants</p>
            </div>

            {(immatureCount || floweringCount) && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-900">
                  Total Count: {(parseInt(immatureCount) || 0) + (parseInt(floweringCount) || 0)} plants
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="technician">Recorded By</Label>
              <Input
                id="technician"
                placeholder="Your name"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!immatureCount && !floweringCount}>
              Record Count
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
