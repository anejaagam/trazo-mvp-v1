/**
 * Location Transfer Component
 * 
 * Manages batch transfers between locations (pods/growing areas) with domain-specific
 * compliance tracking and environmental condition monitoring.
 */

import React, { useState } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { DomainBatch } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowRight, MapPin, AlertTriangle, Info } from 'lucide-react';

/**
 * Data structure for location transfer
 */
export interface LocationTransferData {
  batchId: string;
  batchName: string;
  fromLocationId: string;
  toLocationId: string;
  transferDate: string;
  transferredBy?: string;
  reason?: string;
  notes?: string;
  environmentalConditions?: {
    temperature?: number;
    humidity?: number;
  };
}

export interface LocationTransferProps {
  batch: DomainBatch;
  availableLocations: Array<{ id: string; name: string; type: string; capacity?: number; currentCount?: number }>;
  onTransfer?: (data: LocationTransferData) => void;
  onCancel?: () => void;
}

export const LocationTransfer: React.FC<LocationTransferProps> = ({
  batch,
  availableLocations,
  onTransfer,
  onCancel
}) => {
  const { domain, config } = useDomain();
  
  const currentLocationId = batch.locationIds[0] || '';
  const currentLocation = availableLocations.find(loc => loc.id === currentLocationId);
  
  const [targetLocationId, setTargetLocationId] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferredBy, setTransferredBy] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');

  const targetLocation = availableLocations.find(loc => loc.id === targetLocationId);

  // Validation
  const validationResult = validateTransfer();

  function validateTransfer() {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!targetLocationId) {
      errors.push('Target location must be selected');
    }

    if (targetLocationId === currentLocationId) {
      errors.push('Target location must be different from current location');
    }

    if (!transferDate) {
      errors.push('Transfer date is required');
    }

    // Check capacity
    if (targetLocation) {
      const remainingCapacity = (targetLocation.capacity || 0) - (targetLocation.currentCount || 0);
      if (batch.plantCount > remainingCapacity) {
        warnings.push(`Target location has limited capacity: ${remainingCapacity} plants available, batch has ${batch.plantCount} plants`);
      }
    }

    // Domain-specific validation
    if (domain === 'cannabis') {
      // Check stage compatibility
      if (targetLocation) {
        const stageLocationMap: Record<string, string[]> = {
          'propagation': ['mother', 'clone'],
          'vegetative': ['vegetative'],
          'flowering': ['flowering'],
          'harvest': ['flowering', 'drying'],
          'drying': ['drying'],
          'curing': ['curing'],
          'testing': ['testing', 'storage'],
          'packaging': ['processing', 'storage']
        };

        const compatibleTypes = stageLocationMap[batch.stage] || [];
        if (compatibleTypes.length > 0 && !compatibleTypes.includes(targetLocation.type)) {
          warnings.push(`Batch stage (${batch.stage}) may not be compatible with ${targetLocation.type} location`);
        }
      }

      // METRC warnings
      if ('metrcPackageTag' in batch && batch.metrcPackageTag) {
        warnings.push('METRC location must be updated after transfer');
      }
      if ('metrcPlantTags' in batch && batch.metrcPlantTags && batch.metrcPlantTags.length > 0) {
        warnings.push('METRC plant location updates required');
      }

      // Environmental conditions
      if (batch.stage === 'flowering' || batch.stage === 'vegetative') {
        if (!temperature) {
          warnings.push('Temperature recording recommended for growing stages');
        }
        if (!humidity) {
          warnings.push('Humidity recording recommended for growing stages');
        }
      }
    } else {
      // Produce-specific validation
      if (targetLocation) {
        // Check cold storage requirements
        if (targetLocation.type === 'cold_storage' && batch.stage !== 'storage') {
          warnings.push('Batch will move to cold storage - ensure proper cooling procedures');
        }

        // Check growing area types
        if (['greenhouse', 'indoor', 'outdoor'].includes(targetLocation.type) && 
            !['growing', 'pre_harvest'].includes(batch.stage)) {
          warnings.push('Moving non-growing batch to growing area');
        }
      }

      // Food safety
      if ('gapCertified' in batch && batch.gapCertified) {
        warnings.push('Ensure target location maintains GAP certification');
      }
      if ('organicCertified' in batch && batch.organicCertified) {
        warnings.push('Ensure target location maintains organic certification');
      }

      // Temperature monitoring for quality
      if (['storage', 'packaging'].includes(batch.stage) && !temperature) {
        warnings.push('Temperature recording recommended for storage/packaging stages');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  const handleTransfer = () => {
    if (!validationResult.isValid) return;

    const transferData: LocationTransferData = {
      batchId: batch.id,
      batchName: batch.name,
      fromLocationId: currentLocationId,
      toLocationId: targetLocationId,
      transferDate: transferDate!,
      transferredBy: transferredBy || undefined,
      reason: reason || undefined,
      notes: notes || undefined
    };

    // Add environmental conditions if provided
    if (temperature || humidity) {
      transferData.environmentalConditions = {
        temperature: temperature ? parseFloat(temperature) : undefined,
        humidity: humidity ? parseFloat(humidity) : undefined
      };
    }

    onTransfer?.(transferData);
  };

  // Get domain-specific labels
  const getLocationLabel = () => {
    return domain === 'cannabis' ? 'Pod' : 'Growing Area';
  };

  const getTransferReasons = () => {
    if (domain === 'cannabis') {
      return [
        'Stage progression',
        'Environmental optimization',
        'Capacity management',
        'Maintenance/cleaning',
        'Pest/disease isolation',
        'Other'
      ];
    } else {
      return [
        'Growth stage transition',
        'Ripening control',
        'Temperature management',
        'Quality segregation',
        'Harvest preparation',
        'Other'
      ];
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Transfer Batch Location
          </CardTitle>
          <CardDescription>
            Move {batch.name} to a different {getLocationLabel().toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Batch Information */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Batch Details</span>
              <Badge variant="outline">{batch.stage}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">{batch.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{config.terminology.cultivar}:</span>
                <span className="ml-2 font-medium">{batch.cultivarName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Plant Count:</span>
                <span className="ml-2 font-medium">{batch.plantCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Quantity:</span>
                <span className="ml-2 font-medium">
                  {batch.yieldData?.totalWeight || 0} {batch.yieldData?.unit || (domain === 'cannabis' ? 'grams' : 'lbs')}
                </span>
              </div>
            </div>
          </div>

          {/* Location Transfer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Current Location */}
            <div className="p-4 border rounded-lg">
              <Label className="text-xs text-muted-foreground mb-2">Current {getLocationLabel()}</Label>
              <div className="font-medium">{currentLocation?.name || 'Unknown'}</div>
              {currentLocation && (
                <div className="text-xs text-muted-foreground mt-1">
                  Type: {currentLocation.type}
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Target Location */}
            <div>
              <Label htmlFor="targetLocation">Target {getLocationLabel()}</Label>
              <Select value={targetLocationId} onValueChange={setTargetLocationId}>
                <SelectTrigger id="targetLocation">
                  <SelectValue placeholder={`Select ${getLocationLabel().toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations
                    .filter(loc => loc.id !== currentLocationId)
                    .map(loc => {
                      const remainingCapacity = (loc.capacity || 0) - (loc.currentCount || 0);
                      return (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name} ({loc.type})
                          {loc.capacity && ` - ${remainingCapacity} available`}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {targetLocation && (
                <div className="text-xs text-muted-foreground mt-1">
                  Capacity: {targetLocation.currentCount || 0}/{targetLocation.capacity || 'N/A'}
                </div>
              )}
            </div>
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transferDate">Transfer Date</Label>
              <Input
                id="transferDate"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="transferredBy">Transferred By (optional)</Label>
              <Input
                id="transferredBy"
                value={transferredBy}
                onChange={(e) => setTransferredBy(e.target.value)}
                placeholder="Employee name or ID"
              />
            </div>
          </div>

          {/* Transfer Reason */}
          <div>
            <Label htmlFor="reason">Reason for Transfer</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {getTransferReasons().map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Environmental Conditions */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Environmental Conditions (optional)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="e.g., 72"
                />
              </div>
              <div>
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  step="1"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  placeholder="e.g., 60"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Transfer Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this transfer"
              rows={3}
            />
          </div>

          {/* Validation Messages */}
          {validationResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validationResult.warnings.length > 0 && validationResult.isValid && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">Important Notes:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleTransfer}
              disabled={!validationResult.isValid}
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Transfer to {targetLocation?.name || 'Selected Location'}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
