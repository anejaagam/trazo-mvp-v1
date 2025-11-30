import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Pod } from '../types/batch';
import { Batch } from '../types/batch';
import { Home, AlertTriangle, TrendingUp } from 'lucide-react';

interface RoomCapacityMonitorProps {
  pods: Pod[];
  batches: Batch[];
}

export function RoomCapacityMonitor({ pods, batches }: RoomCapacityMonitorProps) {
  // Calculate plant count per pod
  const podStats = pods.map(pod => {
    const podBatches = batches.filter(b => b.podIds.includes(pod.id) && b.stage !== 'closed');
    const currentPlantCount = podBatches.reduce((sum, b) => sum + b.plantCount, 0);
    const utilizationPercent = (currentPlantCount / pod.capacity) * 100;
    const canopyUtilization = pod.canopyArea && pod.usedCanopyArea 
      ? (pod.usedCanopyArea / pod.canopyArea) * 100 
      : null;

    return {
      ...pod,
      currentPlantCount,
      utilizationPercent,
      canopyUtilization,
      activeBatches: podBatches.length,
      status: utilizationPercent > 90 ? 'critical' : utilizationPercent > 75 ? 'warning' : 'normal',
    };
  });

  const totalCapacity = pods.reduce((sum, p) => sum + p.capacity, 0);
  const totalPlants = podStats.reduce((sum, p) => sum + p.currentPlantCount, 0);
  const overallUtilization = (totalPlants / totalCapacity) * 100;

  const criticalPods = podStats.filter(p => p.status === 'critical');
  const warningPods = podStats.filter(p => p.status === 'warning');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Cannabis Grow Room Capacity Monitoring</h2>
        <p className="text-gray-600">Track marijuana plant count and canopy area usage against state licensed limits</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Capacity</p>
              <p className="text-gray-900">{totalCapacity} plants</p>
            </div>
            <Home className="w-8 h-8 text-gray-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Current Plants</p>
              <p className="text-gray-900">{totalPlants} plants</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Overall Utilization</p>
              <p className="text-gray-900">{overallUtilization.toFixed(1)}%</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              overallUtilization > 90 ? 'bg-red-100 text-red-600' :
              overallUtilization > 75 ? 'bg-yellow-100 text-yellow-600' :
              'bg-green-100 text-green-600'
            }`}>
              {overallUtilization.toFixed(0)}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Available Capacity</p>
              <p className="text-gray-900">{totalCapacity - totalPlants} plants</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              ✓
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {criticalPods.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <p className="text-red-900">
              {criticalPods.length} room(s) over 90% capacity - immediate attention required
            </p>
          </AlertDescription>
        </Alert>
      )}

      {warningPods.length > 0 && criticalPods.length === 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <p className="text-yellow-900">
              {warningPods.length} room(s) over 75% capacity - approaching limit
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Pod Details */}
      <div>
        <h3 className="text-gray-900 mb-4">Room Details</h3>
        <div className="space-y-4">
          {podStats.map(pod => (
            <Card key={pod.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-gray-900">{pod.name}</h4>
                    <Badge className={
                      pod.status === 'critical' ? 'bg-red-100 text-red-800' :
                      pod.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {pod.utilizationPercent.toFixed(0)}% Full
                    </Badge>
                  </div>
                  <p className="text-gray-600">{pod.location}</p>
                </div>
                <p className="text-gray-500">{pod.activeBatches} active batch(es)</p>
              </div>

              {/* Plant Capacity */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <p className="text-gray-600">Plant Count</p>
                  <p className="text-gray-900">
                    {pod.currentPlantCount} / {pod.capacity} plants
                  </p>
                </div>
                <Progress 
                  value={pod.utilizationPercent} 
                  className={`h-2 ${
                    pod.status === 'critical' ? '[&>div]:bg-red-600' :
                    pod.status === 'warning' ? '[&>div]:bg-yellow-600' :
                    '[&>div]:bg-green-600'
                  }`}
                />
              </div>

              {/* Canopy Area (if tracked) */}
              {pod.canopyArea && pod.canopyUtilization !== null && (
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-gray-600">Canopy Area</p>
                    <p className="text-gray-900">
                      {pod.usedCanopyArea?.toFixed(0) || 0} / {pod.canopyArea} sq ft
                    </p>
                  </div>
                  <Progress 
                    value={pod.canopyUtilization} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Warning for near capacity */}
              {pod.status === 'critical' && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-red-800">
                    Critical: Room exceeds 90% capacity. Consider moving batches or reducing plant count.
                  </p>
                </div>
              )}

              {pod.status === 'warning' && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-yellow-800">
                    Warning: Room approaching capacity limit. Plan for additional space if needed.
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
