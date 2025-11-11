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
  const [growingCount, setGrowingCount] = useState('');
  const [readyToHarvestCount, setReadyToHarvestCount] = useState('');
  const [technicianName, setTechnicianName] = useState('');

  const latestSnapshot = snapshots[0];
  const previousSnapshot = snapshots[1];

  const handleSubmit = () => {
    if (!growingCount && !readyToHarvestCount) return;

    const growing = parseInt(growingCount) || 0;
    const readyHarvest = parseInt(readyToHarvestCount) || 0;

    onRecordSnapshot({
      batchId,
      growingBeds: growing > 0 ? [{ bedId: `bed-${Date.now()}`, count: growing }] : [],
      readyToHarvestCount: readyHarvest,
      totalCount: growing + readyHarvest,
      recordedBy: technicianName.trim() || 'System',
    });

    setDialogOpen(false);
    setGrowingCount('');
    setReadyToHarvestCount('');
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
                <p className="text-gray-600 mb-1">Growing Plants</p>
                <p className="text-gray-900">
                  {latestSnapshot.growingBeds?.reduce((sum, bed) => sum + bed.count, 0) || 0}
                </p>
                <p className="text-gray-500">
                  {latestSnapshot.growingBeds?.length || 0} bed(s)
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-gray-600 mb-1">Ready to Harvest</p>
                <p className="text-gray-900">{latestSnapshot.readyToHarvestCount || 0}</p>
                <p className="text-gray-500">Mature plants</p>
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
                      Growing: {snapshot.growingBeds?.reduce((sum, bed) => sum + bed.count, 0) || 0} | 
                      Ready: {snapshot.readyToHarvestCount || 0}
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
              <Label htmlFor="growing-count">Growing Plants</Label>
              <Input
                id="growing-count"
                type="number"
                min="0"
                placeholder="Enter growing plant count"
                value={growingCount}
                onChange={(e) => setGrowingCount(e.target.value)}
                className="mt-2"
              />
              <p className="text-gray-500 mt-1">Plants currently in growing beds</p>
            </div>

            <div>
              <Label htmlFor="ready-count">Ready to Harvest</Label>
              <Input
                id="ready-count"
                type="number"
                min="0"
                placeholder="Enter ready to harvest count"
                value={readyToHarvestCount}
                onChange={(e) => setReadyToHarvestCount(e.target.value)}
                className="mt-2"
              />
              <p className="text-gray-500 mt-1">Mature plants ready for harvest</p>
            </div>

            {(growingCount || readyToHarvestCount) && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-900">
                  Total Count: {(parseInt(growingCount) || 0) + (parseInt(readyToHarvestCount) || 0)} plants
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
            <Button onClick={handleSubmit} disabled={!growingCount && !readyToHarvestCount}>
              Record Count
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
