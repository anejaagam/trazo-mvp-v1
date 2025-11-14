import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  ThermometerSun, 
  Calendar, 
  AlertTriangle,
  TrendingDown
} from 'lucide-react';
import { IProduceBatch, IProduceCultivar } from '../types/domains/produce';

interface StorageConditions {
  currentTemperature: number;
  currentHumidity: number;
  targetTemperature: {
    min: number;
    max: number;
  };
  targetHumidity: {
    min: number;
    max: number;
  };
  storageZone: string;
  atmosphereControlled: boolean;
  ethyleneManaged: boolean;
}

interface ShelfLifeData {
  expectedShelfLife: number; // days
  daysInStorage: number;
  remainingShelfLife: number;
  qualityDegradationRate: number; // percentage per day
  estimatedExpirationDate: string;
}

interface StorageAlert {
  type: 'temperature' | 'humidity' | 'shelf_life' | 'ethylene';
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

interface ColdStorageManagementProps {
  batch: IProduceBatch;
  cultivar?: IProduceCultivar;
  onUpdateStorage?: (conditions: Partial<StorageConditions>) => void;
}

export const ColdStorageManagement: React.FC<ColdStorageManagementProps> = ({
  batch,
  cultivar,
  onUpdateStorage
}) => {
  const [storageConditions, setStorageConditions] = useState<StorageConditions>({
    currentTemperature: 4,
    currentHumidity: 90,
    targetTemperature: { min: 2, max: 6 },
    targetHumidity: { min: 85, max: 95 },
    storageZone: 'A1',
    atmosphereControlled: false,
    ethyleneManaged: false
  });

  const [shelfLifeData] = useState<ShelfLifeData>(() => {
    const expectedDays = cultivar?.storageLife || 14;
    const daysInStorage = batch.createdAt 
      ? Math.floor((Date.now() - new Date(batch.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const expirationDateStr = new Date(
      Date.now() + (expectedDays - daysInStorage) * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];
    
    return {
      expectedShelfLife: expectedDays,
      daysInStorage,
      remainingShelfLife: Math.max(0, expectedDays - daysInStorage),
      qualityDegradationRate: 100 / expectedDays,
      estimatedExpirationDate: expirationDateStr || ''
    };
  });

  // Generate storage alerts based on conditions
  const generateAlerts = (): StorageAlert[] => {
    const alerts: StorageAlert[] = [];

    // Temperature alerts
    if (storageConditions.currentTemperature < storageConditions.targetTemperature.min) {
      alerts.push({
        type: 'temperature',
        severity: 'warning',
        message: `Temperature below target (${storageConditions.currentTemperature}°C < ${storageConditions.targetTemperature.min}°C)`
      });
    } else if (storageConditions.currentTemperature > storageConditions.targetTemperature.max) {
      alerts.push({
        type: 'temperature',
        severity: 'critical',
        message: `Temperature above target (${storageConditions.currentTemperature}°C > ${storageConditions.targetTemperature.max}°C)`
      });
    }

    // Humidity alerts
    if (storageConditions.currentHumidity < storageConditions.targetHumidity.min) {
      alerts.push({
        type: 'humidity',
        severity: 'warning',
        message: `Humidity below target (${storageConditions.currentHumidity}% < ${storageConditions.targetHumidity.min}%)`
      });
    } else if (storageConditions.currentHumidity > storageConditions.targetHumidity.max) {
      alerts.push({
        type: 'humidity',
        severity: 'warning',
        message: `Humidity above target (${storageConditions.currentHumidity}% > ${storageConditions.targetHumidity.max}%)`
      });
    }

    // Shelf life alerts
    const shelfLifePercentage = (shelfLifeData.remainingShelfLife / shelfLifeData.expectedShelfLife) * 100;
    if (shelfLifePercentage <= 10) {
      alerts.push({
        type: 'shelf_life',
        severity: 'critical',
        message: `Critical: Only ${shelfLifeData.remainingShelfLife} days remaining shelf life`
      });
    } else if (shelfLifePercentage <= 25) {
      alerts.push({
        type: 'shelf_life',
        severity: 'warning',
        message: `Warning: ${shelfLifeData.remainingShelfLife} days remaining (${shelfLifePercentage.toFixed(0)}% of shelf life)`
      });
    }

    // Ethylene management alert for sensitive produce
    if (!storageConditions.ethyleneManaged && cultivar?.category === 'fruit') {
      alerts.push({
        type: 'ethylene',
        severity: 'info',
        message: 'Consider ethylene management for this fruit variety'
      });
    }

    return alerts;
  };

  const alerts = generateAlerts();

  const handleConditionChange = (
    field: keyof StorageConditions, 
    value: number | string | boolean | { min: number; max: number }
  ) => {
    const updated = { ...storageConditions, [field]: value } as StorageConditions;
    setStorageConditions(updated);
    onUpdateStorage?.(updated);
  };

  const getShelfLifeStatus = () => {
    const percentage = (shelfLifeData.remainingShelfLife / shelfLifeData.expectedShelfLife) * 100;
    if (percentage > 50) return { color: 'bg-green-500', label: 'Excellent' };
    if (percentage > 25) return { color: 'bg-yellow-500', label: 'Good' };
    if (percentage > 10) return { color: 'bg-orange-500', label: 'Fair' };
    return { color: 'bg-red-500', label: 'Critical' };
  };

  const shelfLifeStatus = getShelfLifeStatus();

  return (
    <div className="space-y-4">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              variant={alert.severity === 'critical' ? 'destructive' : 'default'}
              className={
                alert.severity === 'warning'
                  ? 'border-yellow-500 bg-yellow-50'
                  : alert.severity === 'info'
                  ? 'border-blue-500 bg-blue-50'
                  : ''
              }
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Current Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThermometerSun className="h-5 w-5" />
            Current Storage Conditions
          </CardTitle>
          <CardDescription>Real-time monitoring of storage environment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-temp">Current Temperature (°C)</Label>
              <Input
                id="current-temp"
                type="number"
                value={storageConditions.currentTemperature}
                onChange={(e) => handleConditionChange('currentTemperature', parseFloat(e.target.value))}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-humidity">Current Humidity (%)</Label>
              <Input
                id="current-humidity"
                type="number"
                value={storageConditions.currentHumidity}
                onChange={(e) => handleConditionChange('currentHumidity', parseFloat(e.target.value))}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage-zone">Storage Zone</Label>
              <Input
                id="storage-zone"
                value={storageConditions.storageZone}
                onChange={(e) => handleConditionChange('storageZone', e.target.value)}
                placeholder="e.g., A1, B2"
              />
            </div>

            <div className="space-y-2">
              <Label>Storage Features</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={storageConditions.atmosphereControlled}
                    onChange={(e) => handleConditionChange('atmosphereControlled', e.target.checked)}
                  />
                  <span className="text-sm">CA Storage</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={storageConditions.ethyleneManaged}
                    onChange={(e) => handleConditionChange('ethyleneManaged', e.target.checked)}
                  />
                  <span className="text-sm">Ethylene Control</span>
                </label>
              </div>
            </div>
          </div>

          {/* Target Ranges */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium">Target Ranges</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperature Range (°C)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={storageConditions.targetTemperature.min}
                    onChange={(e) =>
                      handleConditionChange('targetTemperature', {
                        ...storageConditions.targetTemperature,
                        min: parseFloat(e.target.value)
                      })
                    }
                    step={0.1}
                    className="w-20"
                  />
                  <span>to</span>
                  <Input
                    type="number"
                    value={storageConditions.targetTemperature.max}
                    onChange={(e) =>
                      handleConditionChange('targetTemperature', {
                        ...storageConditions.targetTemperature,
                        max: parseFloat(e.target.value)
                      })
                    }
                    step={0.1}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Humidity Range (%)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={storageConditions.targetHumidity.min}
                    onChange={(e) =>
                      handleConditionChange('targetHumidity', {
                        ...storageConditions.targetHumidity,
                        min: parseFloat(e.target.value)
                      })
                    }
                    step={1}
                    className="w-20"
                  />
                  <span>to</span>
                  <Input
                    type="number"
                    value={storageConditions.targetHumidity.max}
                    onChange={(e) =>
                      handleConditionChange('targetHumidity', {
                        ...storageConditions.targetHumidity,
                        max: parseFloat(e.target.value)
                      })
                    }
                    step={1}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shelf Life Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Shelf Life Tracking
          </CardTitle>
          <CardDescription>Monitor remaining shelf life and quality degradation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{shelfLifeData.expectedShelfLife}</div>
              <div className="text-sm text-muted-foreground">Expected Days</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{shelfLifeData.daysInStorage}</div>
              <div className="text-sm text-muted-foreground">Days in Storage</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{shelfLifeData.remainingShelfLife}</div>
              <div className="text-sm text-muted-foreground">Days Remaining</div>
            </div>
          </div>

          {/* Shelf Life Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Shelf Life Status</span>
              <Badge variant="outline" className={`${shelfLifeStatus.color} text-white`}>
                {shelfLifeStatus.label}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${shelfLifeStatus.color}`}
                style={{
                  width: `${(shelfLifeData.remainingShelfLife / shelfLifeData.expectedShelfLife) * 100}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {((shelfLifeData.remainingShelfLife / shelfLifeData.expectedShelfLife) * 100).toFixed(1)}% remaining
              </span>
              <span>Est. expiration: {shelfLifeData.estimatedExpirationDate}</span>
            </div>
          </div>

          {/* Quality Degradation */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Quality Degradation</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Estimated degradation rate: {shelfLifeData.qualityDegradationRate.toFixed(2)}% per day
            </div>
            <div className="text-sm text-muted-foreground">
              Current quality estimate:{' '}
              {Math.max(0, 100 - shelfLifeData.daysInStorage * shelfLifeData.qualityDegradationRate).toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
