import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Wind, 
  Thermometer, 
  Droplets,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { ICannabisBatch } from '../types/domains/cannabis';
import { IDryingRecord } from '../types/post-harvest';

interface DryingCuringTrackingProps {
  batch: ICannabisBatch;
  dryingRecords?: IDryingRecord[];
  curingRecords?: any[]; // ICuringRecord from post-harvest types
  onStartDrying?: (record: Omit<IDryingRecord, 'id'>) => void;
  onUpdateDryingConditions?: (recordId: string, conditions: EnvironmentalConditions) => void;
  onCompleteDrying?: (recordId: string, finalData: CompletionData) => void;
  onStartCuring?: (data: any) => void;
  onUpdateCuring?: (recordId: string, data: any) => void;
}

interface EnvironmentalConditions {
  temperature: number;
  humidity: number;
  timestamp: string;
}

interface CompletionData {
  endWeight: number;
  moistureContent: number;
  qualityNotes: string;
  completedBy: string;
}

interface DryingStatus {
  stage: 'not-started' | 'active' | 'completed';
  daysElapsed: number;
  targetDays: number;
  currentMoisture?: number;
  targetMoisture: number;
  weightLoss: number;
}

export const DryingCuringTracking: React.FC<DryingCuringTrackingProps> = ({
  batch,
  dryingRecords = [],
  curingRecords = [],
  onStartDrying,
  onUpdateDryingConditions,
  onCompleteDrying,
  onStartCuring
}) => {
  const activeDrying = dryingRecords.find(r => !r.endDate);
  const activeCuring = curingRecords.find((r: any) => !r.endDate);

  const [newDryingData, setNewDryingData] = useState({
    roomName: 'Drying Room A',
    startWeight: 0,
    targetHumidity: 60,
    targetTemperature: 68,
    targetDuration: 10
  });

  const [environmentalData, setEnvironmentalData] = useState({
    currentTemperature: 68,
    currentHumidity: 60
  });

  const [completionData, setCompletionData] = useState({
    endWeight: 0,
    moistureContent: 12,
    qualityNotes: '',
    completedBy: ''
  });

  // Calculate drying status
  const getDryingStatus = (): DryingStatus => {
    if (!activeDrying) {
      return {
        stage: 'not-started',
        daysElapsed: 0,
        targetDays: newDryingData.targetDuration,
        targetMoisture: 12,
        weightLoss: 0
      };
    }

    const daysElapsed = Math.floor(
      (Date.now() - new Date(activeDrying.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const weightLoss = activeDrying.endWeight
      ? ((activeDrying.startWeight - activeDrying.endWeight) / activeDrying.startWeight) * 100
      : 0;

    return {
      stage: activeDrying.endDate ? 'completed' : 'active',
      daysElapsed,
      targetDays: 10,
      currentMoisture: completionData.moistureContent,
      targetMoisture: 12,
      weightLoss
    };
  };

  const status = getDryingStatus();

  const handleStartDrying = () => {
    if (onStartDrying && newDryingData.startWeight > 0) {
      onStartDrying({
        batchId: batch.id,
        roomId: 'room-1',
        roomName: newDryingData.roomName,
        startDate: new Date().toISOString(),
        startWeight: newDryingData.startWeight,
        weightUnit: 'grams',
        targetHumidity: newDryingData.targetHumidity,
        targetTemperature: newDryingData.targetTemperature
      });
    }
  };

  const handleCompleteDrying = () => {
    if (onCompleteDrying && activeDrying) {
      onCompleteDrying(activeDrying.id, {
        endWeight: completionData.endWeight,
        moistureContent: completionData.moistureContent,
        qualityNotes: completionData.qualityNotes,
        completedBy: completionData.completedBy
      });
    }
  };

  const getEnvironmentalStatus = () => {
    const { currentTemperature, currentHumidity } = environmentalData;
    const tempInRange = currentTemperature >= 60 && currentTemperature <= 70;
    const humidityInRange = currentHumidity >= 55 && currentHumidity <= 65;

    if (tempInRange && humidityInRange) return { status: 'optimal', color: 'text-green-600' };
    if (!tempInRange || !humidityInRange) return { status: 'warning', color: 'text-yellow-600' };
    return { status: 'critical', color: 'text-red-600' };
  };

  const envStatus = getEnvironmentalStatus();

  return (
    <div className="space-y-4">
      {/* Current Stage Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status.stage === 'active' ? (
              <>
                <Wind className="h-5 w-5 text-blue-600" />
                Drying in Progress
              </>
            ) : status.stage === 'completed' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Drying Completed
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-gray-600" />
                Ready to Start Drying
              </>
            )}
          </CardTitle>
          <CardDescription>
            {batch.stage === 'drying' ? 'Monitoring environmental conditions' : 'Post-harvest processing'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{status.daysElapsed}</div>
              <div className="text-sm text-muted-foreground">Days Elapsed</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{status.targetDays}</div>
              <div className="text-sm text-muted-foreground">Target Days</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{status.currentMoisture || '--'}%</div>
              <div className="text-sm text-muted-foreground">Moisture</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{status.weightLoss.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Weight Loss</div>
            </div>
          </div>

          {status.stage === 'active' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Drying Progress</span>
                <span>{Math.min(100, (status.daysElapsed / status.targetDays) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={Math.min(100, (status.daysElapsed / status.targetDays) * 100)} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environmental Monitoring */}
      {status.stage === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Environmental Conditions
              <Badge variant="outline" className={envStatus.color}>
                {envStatus.status.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>Current drying room conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-temp">Current Temperature (°F)</Label>
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  <Input
                    id="current-temp"
                    type="number"
                    value={environmentalData.currentTemperature}
                    onChange={(e) =>
                      setEnvironmentalData(prev => ({ ...prev, currentTemperature: parseFloat(e.target.value) }))
                    }
                    step={0.1}
                  />
                </div>
                <div className="text-xs text-muted-foreground">Target: 60-70°F</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-humidity">Current Humidity (%)</Label>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <Input
                    id="current-humidity"
                    type="number"
                    value={environmentalData.currentHumidity}
                    onChange={(e) =>
                      setEnvironmentalData(prev => ({ ...prev, currentHumidity: parseFloat(e.target.value) }))
                    }
                    step={1}
                  />
                </div>
                <div className="text-xs text-muted-foreground">Target: 55-65% RH</div>
              </div>
            </div>

            {(environmentalData.currentTemperature < 60 || environmentalData.currentTemperature > 70 ||
              environmentalData.currentHumidity < 55 || environmentalData.currentHumidity > 65) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Environmental conditions are outside optimal range. Adjust temperature or humidity to prevent mold or
                  over-drying.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => {
                if (onUpdateDryingConditions && activeDrying) {
                  onUpdateDryingConditions(activeDrying.id, {
                    temperature: environmentalData.currentTemperature,
                    humidity: environmentalData.currentHumidity,
                    timestamp: new Date().toISOString()
                  });
                }
              }}
              className="w-full"
            >
              Log Current Conditions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Start Drying */}
      {status.stage === 'not-started' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              Start Drying Process
            </CardTitle>
            <CardDescription>Configure drying parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Drying Room</Label>
                <Input
                  id="room-name"
                  value={newDryingData.roomName}
                  onChange={(e) => setNewDryingData(prev => ({ ...prev, roomName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-weight">Initial Wet Weight (g)</Label>
                <Input
                  id="start-weight"
                  type="number"
                  value={newDryingData.startWeight}
                  onChange={(e) => setNewDryingData(prev => ({ ...prev, startWeight: parseFloat(e.target.value) }))}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-humidity">Target Humidity (%)</Label>
                <Input
                  id="target-humidity"
                  type="number"
                  value={newDryingData.targetHumidity}
                  onChange={(e) => setNewDryingData(prev => ({ ...prev, targetHumidity: parseFloat(e.target.value) }))}
                  min={0}
                  max={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-temp">Target Temperature (°F)</Label>
                <Input
                  id="target-temp"
                  type="number"
                  value={newDryingData.targetTemperature}
                  onChange={(e) =>
                    setNewDryingData(prev => ({ ...prev, targetTemperature: parseFloat(e.target.value) }))
                  }
                  min={0}
                />
              </div>
            </div>

            <Button onClick={handleStartDrying} disabled={newDryingData.startWeight <= 0} className="w-full">
              <Wind className="h-4 w-4 mr-2" />
              Start Drying Process
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Complete Drying */}
      {status.stage === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Complete Drying
            </CardTitle>
            <CardDescription>Record final measurements and quality assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="end-weight">Final Dry Weight (g)</Label>
                <Input
                  id="end-weight"
                  type="number"
                  value={completionData.endWeight}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, endWeight: parseFloat(e.target.value) }))}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moisture">Moisture Content (%)</Label>
                <Input
                  id="moisture"
                  type="number"
                  value={completionData.moistureContent}
                  onChange={(e) =>
                    setCompletionData(prev => ({ ...prev, moistureContent: parseFloat(e.target.value) }))
                  }
                  min={0}
                  max={100}
                  step={0.1}
                />
                <div className="text-xs text-muted-foreground">Target: 10-12%</div>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="quality-notes">Quality Notes</Label>
                <Textarea
                  id="quality-notes"
                  value={completionData.qualityNotes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, qualityNotes: e.target.value }))}
                  placeholder="Appearance, aroma, trichome preservation..."
                  rows={3}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="completed-by">Completed By</Label>
                <Input
                  id="completed-by"
                  value={completionData.completedBy}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, completedBy: e.target.value }))}
                  placeholder="Operator name"
                />
              </div>
            </div>

            <Button
              onClick={handleCompleteDrying}
              disabled={completionData.endWeight <= 0 || !completionData.completedBy}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Drying & Move to Curing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Curing Section */}
      {status.stage === 'completed' && !activeCuring && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ready for Curing
            </CardTitle>
            <CardDescription>Begin curing process to enhance quality</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                if (onStartCuring) {
                  onStartCuring({
                    batchId: batch.id,
                    containerType: 'jar',
                    containerCount: 10,
                    startDate: new Date().toISOString(),
                    startWeight: completionData.endWeight,
                    targetDuration: 21
                  });
                }
              }}
              className="w-full"
            >
              Start Curing Process
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
