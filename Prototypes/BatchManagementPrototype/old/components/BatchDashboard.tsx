import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Plus, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { Batch, BatchStage } from '../types/batch';

interface BatchDashboardProps {
  batches: Batch[];
  onCreateBatch: () => void;
  onSelectBatch: (batch: Batch) => void;
}

const stageColors: Record<BatchStage, string> = {
  propagation: 'bg-blue-100 text-blue-800',
  vegetative: 'bg-green-100 text-green-800',
  flowering: 'bg-purple-100 text-purple-800',
  harvest: 'bg-yellow-100 text-yellow-800',
  drying: 'bg-orange-100 text-orange-800',
  curing: 'bg-amber-100 text-amber-800',
  closed: 'bg-gray-100 text-gray-800',
};

export function BatchDashboard({ batches, onCreateBatch, onSelectBatch }: BatchDashboardProps) {
  const activeBatches = batches.filter(b => b.stage !== 'closed');
  const closedBatches = batches.filter(b => b.stage === 'closed');
  
  const stageCounts = activeBatches.reduce((acc, batch) => {
    acc[batch.stage] = (acc[batch.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalPlants = activeBatches.reduce((sum, b) => sum + b.plantCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Active Batches</p>
              <p className="text-gray-900">{activeBatches.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Plants</p>
              <p className="text-gray-900">{totalPlants}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">In Flowering</p>
              <p className="text-gray-900">{stageCounts['flowering'] || 0}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              F
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Completed</p>
              <p className="text-gray-900">{closedBatches.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Batch List Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900">All Batches</h2>
        <Button onClick={onCreateBatch}>
          <Plus className="w-4 h-4 mr-2" />
          New Batch
        </Button>
      </div>

      {/* Batch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map(batch => (
          <Card 
            key={batch.id} 
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelectBatch(batch)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-gray-900">{batch.name}</h3>
                  <p className="text-gray-500">{batch.cultivar}</p>
                </div>
                <Badge className={stageColors[batch.stage]}>
                  {batch.stage}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <div>
                  <p className="text-gray-500">Plant Count</p>
                  <p>{batch.plantCount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pods</p>
                  <p>{batch.podIds.length}</p>
                </div>
              </div>
              
              <div className="border-t pt-2">
                <p className="text-gray-500">Started</p>
                <p className="text-gray-600">
                  {new Date(batch.startDate).toLocaleDateString()}
                </p>
              </div>
              
              {batch.yieldData && (
                <div className="border-t pt-2">
                  <p className="text-gray-500">Dry Yield</p>
                  <p className="text-gray-600">{batch.yieldData.dryWeight} kg</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
