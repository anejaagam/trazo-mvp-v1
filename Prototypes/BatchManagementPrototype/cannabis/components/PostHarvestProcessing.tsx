import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DryingRecord, CuringRecord, PackagingRecord } from '../types/post-harvest';
import { Wind, Archive, Package, CheckCircle, Clock } from 'lucide-react';

interface PostHarvestProcessingProps {
  batchId: string;
  batchName: string;
  currentStage: 'drying' | 'curing' | 'packaging' | 'completed';
  dryingRecords: DryingRecord[];
  curingRecords: CuringRecord[];
  packagingRecords: PackagingRecord[];
  onStartDrying: (record: Omit<DryingRecord, 'id'>) => void;
  onCompleteDrying: (recordId: string, data: { endWeight: number; qualityNotes: string; completedBy: string }) => void;
  onStartCuring: (record: Omit<CuringRecord, 'id'>) => void;
  onCompleteCuring: (recordId: string, data: { endWeight: number; qualityNotes: string; completedBy: string }) => void;
  onCompletePackaging: (record: Omit<PackagingRecord, 'id'>) => void;
}

export function PostHarvestProcessing({
  batchId,
  batchName,
  currentStage,
  dryingRecords,
  curingRecords,
  packagingRecords,
  onStartDrying,
  onCompleteDrying,
  onStartCuring,
  onCompleteCuring,
  onCompletePackaging,
}: PostHarvestProcessingProps) {
  const activeDrying = dryingRecords.find(r => !r.endDate);
  const activeCuring = curingRecords.find(r => !r.endDate);

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {(['drying', 'curing', 'packaging', 'completed'] as const).map((stage, index) => {
            const isComplete = ['drying', 'curing', 'packaging', 'completed'].indexOf(currentStage) > index;
            const isCurrent = currentStage === stage;

            return (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${isComplete ? 'bg-green-600 text-white' : ''}
                      ${isCurrent ? 'bg-blue-600 text-white' : ''}
                      ${!isComplete && !isCurrent ? 'bg-gray-200 text-gray-600' : ''}
                    `}
                  >
                    {isComplete ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  <p className={`mt-2 ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </p>
                </div>
                {index < 3 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      isComplete ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Processing Tabs */}
      <Tabs value={currentStage} className="w-full">
        <TabsList>
          <TabsTrigger value="drying">Drying</TabsTrigger>
          <TabsTrigger value="curing">Curing</TabsTrigger>
          <TabsTrigger value="packaging">Packaging</TabsTrigger>
        </TabsList>

        {/* Drying Tab */}
        <TabsContent value="drying" className="mt-4">
          <DryingWorkflow
            batchId={batchId}
            batchName={batchName}
            activeRecord={activeDrying}
            onStartDrying={onStartDrying}
            onCompleteDrying={onCompleteDrying}
          />
        </TabsContent>

        {/* Curing Tab */}
        <TabsContent value="curing" className="mt-4">
          <CuringWorkflow
            batchId={batchId}
            batchName={batchName}
            activeRecord={activeCuring}
            onStartCuring={onStartCuring}
            onCompleteCuring={onCompleteCuring}
          />
        </TabsContent>

        {/* Packaging Tab */}
        <TabsContent value="packaging" className="mt-4">
          <PackagingWorkflow
            batchId={batchId}
            batchName={batchName}
            onCompletePackaging={onCompletePackaging}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for each workflow
function DryingWorkflow({
  batchId,
  batchName,
  activeRecord,
  onStartDrying,
  onCompleteDrying,
}: {
  batchId: string;
  batchName: string;
  activeRecord?: DryingRecord;
  onStartDrying: (record: Omit<DryingRecord, 'id'>) => void;
  onCompleteDrying: (recordId: string, data: any) => void;
}) {
  const [roomName, setRoomName] = useState('Drying Room A');
  const [startWeight, setStartWeight] = useState('');
  const [endWeight, setEndWeight] = useState('');
  const [qualityNotes, setQualityNotes] = useState('');
  const [completedBy, setCompletedBy] = useState('');

  if (activeRecord) {
    const daysInDrying = Math.floor(
      (new Date().getTime() - new Date(activeRecord.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wind className="w-5 h-5 text-blue-600" />
          <h3 className="text-gray-900">Drying in Progress</h3>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-gray-600">Room</p>
              <p className="text-gray-900">{activeRecord.roomName}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-gray-600">Days Drying</p>
              <p className="text-gray-900">{daysInDrying} days</p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Start Weight</p>
            <p className="text-gray-900">{activeRecord.startWeight} kg (wet)</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="end-weight">Final Dry Weight (kg) <span className="text-red-600">*</span></Label>
            <Input
              id="end-weight"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={endWeight}
              onChange={(e) => setEndWeight(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="quality">Quality Notes</Label>
            <Textarea
              id="quality"
              placeholder="Observations about color, aroma, moisture content..."
              value={qualityNotes}
              onChange={(e) => setQualityNotes(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="completed-by">Completed By <span className="text-red-600">*</span></Label>
            <Input
              id="completed-by"
              placeholder="Your name"
              value={completedBy}
              onChange={(e) => setCompletedBy(e.target.value)}
              className="mt-2"
            />
          </div>

          <Button
            className="w-full"
            onClick={() => {
              if (endWeight && completedBy) {
                onCompleteDrying(activeRecord.id, {
                  endWeight: parseFloat(endWeight),
                  qualityNotes,
                  completedBy,
                });
              }
            }}
            disabled={!endWeight || !completedBy}
          >
            Complete Drying
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-gray-900 mb-4">Start Drying Process</h3>

      <div className="space-y-4">
        <div>
          <Label htmlFor="room">Drying Room</Label>
          <Input
            id="room"
            placeholder="Drying Room A"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="start-weight">Wet Weight (kg) <span className="text-red-600">*</span></Label>
          <Input
            id="start-weight"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={startWeight}
            onChange={(e) => setStartWeight(e.target.value)}
            className="mt-2"
          />
        </div>

        <Button
          className="w-full"
          onClick={() => {
            if (startWeight) {
              onStartDrying({
                batchId,
                roomId: 'dry-room-1',
                roomName,
                startDate: new Date().toISOString(),
                startWeight: parseFloat(startWeight),
                targetHumidity: 55,
                targetTemperature: 18,
              });
            }
          }}
          disabled={!startWeight}
        >
          Start Drying
        </Button>
      </div>
    </Card>
  );
}

function CuringWorkflow({
  batchId,
  batchName,
  activeRecord,
  onStartCuring,
  onCompleteCuring,
}: {
  batchId: string;
  batchName: string;
  activeRecord?: CuringRecord;
  onStartCuring: (record: Omit<CuringRecord, 'id'>) => void;
  onCompleteCuring: (recordId: string, data: any) => void;
}) {
  const [containerType, setContainerType] = useState<'jar' | 'bin' | 'bag'>('jar');
  const [containerCount, setContainerCount] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [targetDuration, setTargetDuration] = useState('14');
  const [endWeight, setEndWeight] = useState('');
  const [qualityNotes, setQualityNotes] = useState('');
  const [completedBy, setCompletedBy] = useState('');

  if (activeRecord) {
    const daysCuring = Math.floor(
      (new Date().getTime() - new Date(activeRecord.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Archive className="w-5 h-5 text-amber-600" />
          <h3 className="text-gray-900">Curing in Progress</h3>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-gray-600">Container</p>
              <p className="text-gray-900">{activeRecord.containerType}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-gray-600">Count</p>
              <p className="text-gray-900">{activeRecord.containerCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-gray-600">Days Curing</p>
              <p className="text-gray-900">{daysCuring} / {activeRecord.targetDuration}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="end-weight-cure">Final Weight (kg) <span className="text-red-600">*</span></Label>
            <Input
              id="end-weight-cure"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={endWeight}
              onChange={(e) => setEndWeight(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="quality-cure">Quality Notes</Label>
            <Textarea
              id="quality-cure"
              placeholder="Notes on aroma development, moisture, overall quality..."
              value={qualityNotes}
              onChange={(e) => setQualityNotes(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="completed-by-cure">Completed By <span className="text-red-600">*</span></Label>
            <Input
              id="completed-by-cure"
              placeholder="Your name"
              value={completedBy}
              onChange={(e) => setCompletedBy(e.target.value)}
              className="mt-2"
            />
          </div>

          <Button
            className="w-full"
            onClick={() => {
              if (endWeight && completedBy) {
                onCompleteCuring(activeRecord.id, {
                  endWeight: parseFloat(endWeight),
                  qualityNotes,
                  completedBy,
                });
              }
            }}
            disabled={!endWeight || !completedBy}
          >
            Complete Curing
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-gray-900 mb-4">Start Curing Process</h3>

      <div className="space-y-4">
        <div>
          <Label htmlFor="container-type">Container Type</Label>
          <Select value={containerType} onValueChange={(val) => setContainerType(val as any)}>
            <SelectTrigger id="container-type" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jar">Glass Jars</SelectItem>
              <SelectItem value="bin">Plastic Bins</SelectItem>
              <SelectItem value="bag">Grove Bags</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="container-count">Container Count</Label>
            <Input
              id="container-count"
              type="number"
              placeholder="0"
              value={containerCount}
              onChange={(e) => setContainerCount(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="cure-duration">Target Duration (days)</Label>
            <Input
              id="cure-duration"
              type="number"
              placeholder="14"
              value={targetDuration}
              onChange={(e) => setTargetDuration(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="start-weight-cure">Start Weight (kg) <span className="text-red-600">*</span></Label>
          <Input
            id="start-weight-cure"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={startWeight}
            onChange={(e) => setStartWeight(e.target.value)}
            className="mt-2"
          />
        </div>

        <Button
          className="w-full"
          onClick={() => {
            if (startWeight && containerCount) {
              onStartCuring({
                batchId,
                containerType,
                containerCount: parseInt(containerCount),
                startDate: new Date().toISOString(),
                targetDuration: parseInt(targetDuration),
                startWeight: parseFloat(startWeight),
              });
            }
          }}
          disabled={!startWeight || !containerCount}
        >
          Start Curing
        </Button>
      </div>
    </Card>
  );
}

function PackagingWorkflow({
  batchId,
  batchName,
  onCompletePackaging,
}: {
  batchId: string;
  batchName: string;
  onCompletePackaging: (record: Omit<PackagingRecord, 'id'>) => void;
}) {
  const [packageType, setPackageType] = useState('');
  const [packageCount, setPackageCount] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [packagedBy, setPackagedBy] = useState('');

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-green-600" />
        <h3 className="text-gray-900">Package for Distribution</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="package-type">Package Type</Label>
          <Input
            id="package-type"
            placeholder="e.g., 1oz jars, 3.5g bags"
            value={packageType}
            onChange={(e) => setPackageType(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="package-count">Package Count</Label>
            <Input
              id="package-count"
              type="number"
              placeholder="0"
              value={packageCount}
              onChange={(e) => setPackageCount(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="total-weight-pkg">Total Weight (kg)</Label>
            <Input
              id="total-weight-pkg"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={totalWeight}
              onChange={(e) => setTotalWeight(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="packaged-by">Packaged By <span className="text-red-600">*</span></Label>
          <Input
            id="packaged-by"
            placeholder="Your name"
            value={packagedBy}
            onChange={(e) => setPackagedBy(e.target.value)}
            className="mt-2"
          />
        </div>

        <Button
          className="w-full"
          onClick={() => {
            if (packageType && packageCount && totalWeight && packagedBy) {
              onCompletePackaging({
                batchId,
                packageDate: new Date().toISOString(),
                packageType,
                packageCount: parseInt(packageCount),
                totalWeight: parseFloat(totalWeight),
                packagesCreated: [],
                packagedBy,
                qualityCheck: true,
                metrcReported: false,
              });
            }
          }}
          disabled={!packageType || !packageCount || !totalWeight || !packagedBy}
        >
          Complete Packaging & Report to Metrc
        </Button>
      </div>
    </Card>
  );
}
