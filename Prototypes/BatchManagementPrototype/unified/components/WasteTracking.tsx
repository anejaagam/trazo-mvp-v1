/**
 * Waste Tracking Component
 * 
 * Records waste disposal for both cannabis and produce domains with compliance
 * documentation and evidence capture.
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
import { Trash2, AlertTriangle, Camera, User } from 'lucide-react';

/**
 * Data structure for waste tracking
 */
export interface WasteTrackingData {
  batchId?: string;
  batchName?: string;
  wasteType: string;
  weight: number;
  unit: string;
  reason: string;
  disposalMethod: string;
  disposedAt: string;
  disposedBy: string;
  approvedBy?: string;
  witnessedBy?: string;
  notes?: string;
  evidenceUrls?: string[];
}

export interface WasteTrackingProps {
  batch?: DomainBatch;
  onRecordWaste?: (data: WasteTrackingData) => void;
  onCancel?: () => void;
}

export const WasteTracking: React.FC<WasteTrackingProps> = ({
  batch,
  onRecordWaste,
  onCancel
}) => {
  const { domain } = useDomain();
  
  const [wasteType, setWasteType] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState(domain === 'cannabis' ? 'grams' : 'lbs');
  const [reason, setReason] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('');
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split('T')[0]);
  const [disposedBy, setDisposedBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [witnessedBy, setWitnessedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [evidenceCount, setEvidenceCount] = useState(0);

  // Validation
  const validationResult = validateWaste();

  function validateWaste() {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!wasteType) {
      errors.push('Waste type is required');
    }

    if (!weight || parseFloat(weight) <= 0) {
      errors.push('Valid waste weight is required');
    }

    if (!reason) {
      errors.push('Reason for waste is required');
    }

    if (!disposalMethod) {
      errors.push('Disposal method is required');
    }

    if (!disposedBy.trim()) {
      errors.push('Disposed by (employee) is required');
    }

    // Domain-specific validation
    if (domain === 'cannabis') {
      // Cannabis waste requires witness for amounts over threshold
      const weightValue = parseFloat(weight);
      if (unit === 'grams' && weightValue > 100 && !witnessedBy.trim()) {
        warnings.push('Waste over 100g should have a witness');
      }
      if (unit === 'oz' && weightValue > 3.5 && !witnessedBy.trim()) {
        warnings.push('Waste over 3.5oz should have a witness');
      }

      // METRC compliance
      if (batch && 'metrcPackageTag' in batch && batch.metrcPackageTag) {
        warnings.push('METRC waste reporting required for tagged batches');
      }

      // Approval requirements
      if (!approvedBy.trim()) {
        warnings.push('Supervisor approval recommended for cannabis waste');
      }

      // Evidence requirements
      if (evidenceCount === 0) {
        warnings.push('Photo evidence required for cannabis waste disposal');
      }
    } else {
      // Produce waste tracking
      const weightValue = parseFloat(weight);
      if (unit === 'lbs' && weightValue > 50 && !approvedBy.trim()) {
        warnings.push('Large waste quantities (>50 lbs) should have supervisor approval');
      }

      // Food safety compliance
      if (batch) {
        if ('gapCertified' in batch && batch.gapCertified) {
          warnings.push('Document waste disposal for GAP compliance audit trail');
        }
        if ('organicCertified' in batch && batch.organicCertified) {
          warnings.push('Ensure disposal method maintains organic certification');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  const handleRecordWaste = () => {
    if (!validationResult.isValid) return;

    const wasteData: WasteTrackingData = {
      batchId: batch?.id,
      batchName: batch?.name,
      wasteType,
      weight: parseFloat(weight),
      unit,
      reason,
      disposalMethod,
      disposedAt: disposalDate!,
      disposedBy,
      approvedBy: approvedBy || undefined,
      witnessedBy: witnessedBy || undefined,
      notes: notes || undefined,
      evidenceUrls: evidenceCount > 0 ? Array(evidenceCount).fill('placeholder-url') : undefined
    };

    onRecordWaste?.(wasteData);
  };

  // Get domain-specific options
  const getWasteTypes = () => {
    if (domain === 'cannabis') {
      return [
        'plant_waste',
        'harvest_waste',
        'trim_waste',
        'product_waste',
        'contaminated_material',
        'failed_testing',
        'other'
      ];
    } else {
      return [
        'harvest_waste',
        'culled_produce',
        'damaged_goods',
        'overripe',
        'pest_damage',
        'disease_infected',
        'processing_waste',
        'packaging_waste',
        'other'
      ];
    }
  };

  const getDisposalMethods = () => {
    if (domain === 'cannabis') {
      return [
        'grinding_and_mixing',
        'composting_onsite',
        'licensed_disposal',
        'incineration',
        'landfill',
        'other'
      ];
    } else {
      return [
        'composting',
        'animal_feed',
        'municipal_waste',
        'anaerobic_digestion',
        'landfill',
        'donation',
        'other'
      ];
    }
  };

  const getReasonOptions = () => {
    if (domain === 'cannabis') {
      return [
        'Quality failure',
        'Failed testing',
        'Pest infestation',
        'Disease/mold',
        'Overproduction',
        'Damaged during processing',
        'Expired',
        'Regulatory compliance',
        'Other'
      ];
    } else {
      return [
        'Below grade',
        'Pest damage',
        'Disease',
        'Overripe/spoiled',
        'Physical damage',
        'Cosmetic defects',
        'Excess inventory',
        'Failed inspection',
        'Other'
      ];
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Record Waste Disposal
          </CardTitle>
          <CardDescription>
            Document waste for {domain === 'cannabis' ? 'METRC' : 'food safety'} compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Batch Information (if provided) */}
          {batch && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Source Batch</span>
                <Badge variant="outline">{batch.stage}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">{batch.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cultivar:</span>
                  <span className="ml-2 font-medium">{batch.cultivarName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Waste Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wasteType">Waste Type</Label>
              <Select value={wasteType} onValueChange={setWasteType}>
                <SelectTrigger id="wasteType">
                  <SelectValue placeholder="Select waste type" />
                </SelectTrigger>
                <SelectContent>
                  {getWasteTypes().map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {getReasonOptions().map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Waste Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domain === 'cannabis' ? (
                    <>
                      <SelectItem value="grams">Grams</SelectItem>
                      <SelectItem value="oz">Ounces</SelectItem>
                      <SelectItem value="lbs">Pounds</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="lbs">Pounds</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="oz">Ounces</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Disposal Method */}
          <div>
            <Label htmlFor="disposalMethod">Disposal Method</Label>
            <Select value={disposalMethod} onValueChange={setDisposalMethod}>
              <SelectTrigger id="disposalMethod">
                <SelectValue placeholder="Select disposal method" />
              </SelectTrigger>
              <SelectContent>
                {getDisposalMethods().map(method => (
                  <SelectItem key={method} value={method}>
                    {method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personnel */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Personnel Information</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="disposedBy">Disposed By (Required)</Label>
                <Input
                  id="disposedBy"
                  value={disposedBy}
                  onChange={(e) => setDisposedBy(e.target.value)}
                  placeholder="Employee name or ID"
                />
              </div>

              <div>
                <Label htmlFor="disposalDate">Disposal Date</Label>
                <Input
                  id="disposalDate"
                  type="date"
                  value={disposalDate}
                  onChange={(e) => setDisposalDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="approvedBy">Approved By (optional)</Label>
                <Input
                  id="approvedBy"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="Supervisor name or ID"
                />
              </div>

              <div>
                <Label htmlFor="witnessedBy">Witnessed By (optional)</Label>
                <Input
                  id="witnessedBy"
                  value={witnessedBy}
                  onChange={(e) => setWitnessedBy(e.target.value)}
                  placeholder="Witness name or ID"
                />
              </div>
            </div>
          </div>

          {/* Evidence Capture */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Evidence Documentation</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEvidenceCount(prev => prev + 1)}
              >
                <Camera className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
              {evidenceCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{evidenceCount} photo(s)</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEvidenceCount(0)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {domain === 'cannabis' 
                ? 'Photo evidence is required for cannabis waste disposal compliance'
                : 'Photo evidence recommended for audit trail and quality control'}
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details about the waste disposal"
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
                <div className="font-semibold mb-1">Compliance Notes:</div>
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
              onClick={handleRecordWaste}
              disabled={!validationResult.isValid}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Record Waste ({weight || '0'} {unit})
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
