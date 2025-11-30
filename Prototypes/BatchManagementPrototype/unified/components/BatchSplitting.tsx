import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Split, 
  AlertTriangle, 
  CheckCircle,
  Scale,
  Package
} from 'lucide-react';
import { DomainBatch } from '../types/domains';
import { useDomain } from '../contexts/DomainContext';

interface SplitBatchData {
  sourceBatchId: string;
  sourceBatchName: string;
  sourceQuantity: number;
  splits: {
    id: string;
    name: string;
    quantity: number;
    locationId?: string;
    notes?: string;
  }[];
}

interface BatchSplittingProps {
  batch: DomainBatch;
  onSplitBatch?: (splitData: SplitBatchData) => void;
  onCancel?: () => void;
}

export const BatchSplitting: React.FC<BatchSplittingProps> = ({
  batch,
  onSplitBatch,
  onCancel
}) => {
  const { domain, config } = useDomain();
  
  const [splits, setSplits] = useState([
    { id: '1', name: `${batch.name}-A`, quantity: 0, locationId: '', notes: '' },
    { id: '2', name: `${batch.name}-B`, quantity: 0, locationId: '', notes: '' }
  ]);

  // Calculate totals and validation
  const batchQuantity = batch.yieldData?.totalWeight || 0;
  const batchUnit = batch.yieldData?.unit || (domain === 'cannabis' ? 'grams' : 'lbs');
  const totalAllocated = splits.reduce((sum, split) => sum + split.quantity, 0);
  const remaining = batchQuantity - totalAllocated;
  const isValid = totalAllocated === batchQuantity;

  const addSplit = () => {
    const nextLetter = String.fromCharCode(65 + splits.length); // A, B, C, etc.
    setSplits([
      ...splits,
      {
        id: `${splits.length + 1}`,
        name: `${batch.name}-${nextLetter}`,
        quantity: 0,
        locationId: '',
        notes: ''
      }
    ]);
  };

  const removeSplit = (id: string) => {
    if (splits.length > 2) {
      setSplits(splits.filter(s => s.id !== id));
    }
  };

  const updateSplit = (id: string, field: keyof typeof splits[0], value: string | number) => {
    setSplits(splits.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSplitBatch = () => {
    if (!isValid) return;
    
    onSplitBatch?.({
      sourceBatchId: batch.id,
      sourceBatchName: batch.name,
      sourceQuantity: batchQuantity,
      splits
    });
  };

  // Domain-specific validation rules
  const getDomainRules = () => {
    if (domain === 'cannabis') {
      return {
        minQuantity: 0.1,
        quantityUnit: 'grams',
        warnings: [
          'Each split batch must maintain METRC tracking',
          'Plant tags must be reassigned if splitting during vegetative/flowering',
          'Splitting after harvest requires new package tags'
        ]
      };
    } else {
      return {
        minQuantity: 1,
        quantityUnit: 'lbs',
        warnings: [
          'Each split must maintain traceability lot numbers',
          'Food safety certifications apply to all splits',
          'Grading/quality scores may need reassessment'
        ]
      };
    }
  };

  const rules = getDomainRules();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Batch
          </CardTitle>
          <CardDescription>
            Divide {batch.name} into multiple smaller batches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Batch Info */}
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
                <span className="text-muted-foreground">Quantity:</span>
                <span className="ml-2 font-medium">
                  {batchQuantity} {batchUnit}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{config.terminology.cultivar}:</span>
                <span className="ml-2 font-medium">{batch.cultivarId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <span className="ml-2 font-medium">{batch.locationIds[0]}</span>
              </div>
            </div>
          </div>

          {/* Quantity Allocation Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Total Quantity</div>
              <div className="text-2xl font-bold">{batchQuantity}</div>
              <div className="text-xs text-muted-foreground mt-1">{batchUnit}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Allocated</div>
              <div className="text-2xl font-bold text-blue-600">{totalAllocated}</div>
              <div className="text-xs text-muted-foreground mt-1">{batchUnit}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Remaining</div>
              <div className={`text-2xl font-bold ${
                remaining === 0 ? 'text-green-600' : remaining > 0 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {remaining.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{batchUnit}</div>
            </div>
          </div>

          {/* Split Definitions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Split Batches</h4>
              <Button variant="outline" size="sm" onClick={addSplit}>
                <Split className="h-3 w-3 mr-1" />
                Add Split
              </Button>
            </div>

            {splits.map((split, index) => (
              <div key={split.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Split {index + 1}</Badge>
                  {splits.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSplit(split.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`split-name-${split.id}`}>Batch Name</Label>
                    <Input
                      id={`split-name-${split.id}`}
                      value={split.name}
                      onChange={(e) => updateSplit(split.id, 'name', e.target.value)}
                      placeholder="Batch name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`split-quantity-${split.id}`}>
                      Quantity ({rules.quantityUnit})
                    </Label>
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-gray-400" />
                      <Input
                        id={`split-quantity-${split.id}`}
                        type="number"
                        value={split.quantity}
                        onChange={(e) => updateSplit(split.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min={rules.minQuantity}
                        step={rules.minQuantity}
                      />
                    </div>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor={`split-notes-${split.id}`}>Notes (Optional)</Label>
                    <Textarea
                      id={`split-notes-${split.id}`}
                      value={split.notes}
                      onChange={(e) => updateSplit(split.id, 'notes', e.target.value)}
                      placeholder="Reason for split, special handling..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Validation Messages */}
          {remaining !== 0 && totalAllocated > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Allocated quantity ({totalAllocated} {batchUnit}) must equal source quantity ({batchQuantity} {batchUnit}).
                {remaining > 0 ? ` Allocate ${remaining.toFixed(2)} more.` : ` Reduce by ${Math.abs(remaining).toFixed(2)}.`}
              </AlertDescription>
            </Alert>
          )}

          {isValid && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Ready to split. All quantity allocated correctly.
              </AlertDescription>
            </Alert>
          )}

          {/* Domain-Specific Warnings */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Important - {domain === 'cannabis' ? 'Cannabis' : 'Produce'} Rules:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {rules.warnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-600 flex-shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSplitBatch}
              disabled={!isValid}
              className="flex-1"
            >
              <Package className="h-4 w-4 mr-2" />
              Split into {splits.length} Batches
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
