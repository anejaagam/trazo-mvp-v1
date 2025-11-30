/**
 * Batch Merging Component
 * 
 * Allows merging multiple batches into a single batch with domain-specific validation.
 * Supports both cannabis and produce domains with appropriate compliance rules.
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
import { Merge, X, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Data structure for batch merging
 */
export interface MergeBatchData {
  sourceBatchIds: string[];
  targetBatchName: string;
  targetLocation: string;
  cultivarId: string;
  notes?: string;
}

export interface BatchMergingProps {
  availableBatches: DomainBatch[];
  onMergeBatches?: (data: MergeBatchData) => void;
  onCancel?: () => void;
}

export const BatchMerging: React.FC<BatchMergingProps> = ({
  availableBatches,
  onMergeBatches,
  onCancel
}) => {
  const { domain, config } = useDomain();
  
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [targetName, setTargetName] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Get selected batches
  const selectedBatches = availableBatches.filter(b => selectedBatchIds.includes(b.id));

  // Calculate total quantity and validate
  const totalQuantity = selectedBatches.reduce((sum, batch) => {
    return sum + (batch.yieldData?.totalWeight || 0);
  }, 0);

  const batchUnit = selectedBatches[0]?.yieldData?.unit || (domain === 'cannabis' ? 'grams' : 'lbs');

  // Validation rules
  const validationResult = validateMerge();

  function validateMerge() {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Minimum batches
    if (selectedBatchIds.length < 2) {
      errors.push('At least 2 batches must be selected to merge');
    }

    // Check if all batches have the same cultivar
    const cultivarIds = new Set(selectedBatches.map(b => b.cultivarId));
    if (cultivarIds.size > 1) {
      errors.push('All batches must have the same cultivar/variety to merge');
    }

    // Check if all batches are at the same stage
    const stages = new Set(selectedBatches.map(b => b.stage));
    if (stages.size > 1) {
      errors.push('All batches must be at the same stage to merge');
    }

    // Check for quarantined batches
    const quarantinedBatches = selectedBatches.filter(b => b.quarantineStatus === 'quarantined');
    if (quarantinedBatches.length > 0) {
      errors.push(`Cannot merge quarantined batches: ${quarantinedBatches.map(b => b.name).join(', ')}`);
    }

    // Target name required
    if (!targetName.trim()) {
      errors.push('Target batch name is required');
    }

    // Target location required
    if (!targetLocation.trim()) {
      errors.push('Target location is required');
    }

    // Domain-specific validation
    if (domain === 'cannabis') {
      // Check METRC tags
      const metrcBatches = selectedBatches.filter(b => 
        'metrcPackageTag' in b && b.metrcPackageTag
      );
      if (metrcBatches.length > 0) {
        warnings.push('METRC package tags will need to be updated after merge');
      }

      // Check plant tags
      const plantTagBatches = selectedBatches.filter(b => 
        'metrcPlantTags' in b && b.metrcPlantTags && b.metrcPlantTags.length > 0
      );
      if (plantTagBatches.length > 0) {
        warnings.push('Plant tags will be consolidated - ensure METRC compliance');
      }

      // Minimum quantity check
      if (totalQuantity < 1) {
        warnings.push('Merged batch quantity is very low (< 1g)');
      }
    } else {
      // Produce-specific validation
      // Check grading consistency
      const grades = new Set(selectedBatches.map(b => 
        'grade' in b ? b.grade : undefined
      ).filter(Boolean));
      if (grades.size > 1) {
        warnings.push('Batches have different grades - final grade will need reassessment');
      }

      // Check food safety certifications
      const gapCertified = selectedBatches.filter(b => 
        'gapCertified' in b && b.gapCertified
      );
      const organicCertified = selectedBatches.filter(b => 
        'organicCertified' in b && b.organicCertified
      );
      
      if (gapCertified.length > 0 && gapCertified.length !== selectedBatches.length) {
        warnings.push('Not all batches are GAP certified - merged batch may lose certification');
      }
      if (organicCertified.length > 0 && organicCertified.length !== selectedBatches.length) {
        warnings.push('Not all batches are organic certified - merged batch may lose certification');
      }

      // Minimum quantity check
      if (totalQuantity < 10) {
        warnings.push('Merged batch quantity is very low (< 10 lbs)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  const toggleBatchSelection = (batchId: string) => {
    setSelectedBatchIds(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleMerge = () => {
    if (!validationResult.isValid) return;

    const cultivarId = selectedBatches[0]?.cultivarId || '';

    onMergeBatches?.({
      sourceBatchIds: selectedBatchIds,
      targetBatchName: targetName,
      targetLocation,
      cultivarId,
      notes
    });
  };

  // Get domain-specific information
  const getDomainInfo = () => {
    if (domain === 'cannabis') {
      return {
        title: 'Merge Cannabis Batches',
        description: 'Combine multiple batches into a single batch - METRC compliance required',
        locationLabel: 'Target Pod',
        quantityLabel: 'Total Weight',
        complianceNotes: [
          'All source batches will be marked as closed',
          'METRC package tags must be updated',
          'Plant tags will be consolidated if applicable',
          'Test results from source batches should be retained'
        ]
      };
    } else {
      return {
        title: 'Merge Produce Batches',
        description: 'Combine multiple batches into a single batch - traceability maintained',
        locationLabel: 'Target Growing Area',
        quantityLabel: 'Total Yield',
        complianceNotes: [
          'All source batches will be marked as closed',
          'Lot numbers will be consolidated',
          'Food safety certifications must be verified',
          'Quality grading may need reassessment'
        ]
      };
    }
  };

  const domainInfo = getDomainInfo();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            {domainInfo.title}
          </CardTitle>
          <CardDescription>{domainInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Batch Selection */}
          <div className="space-y-3">
            <Label>Select Batches to Merge (minimum 2)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
              {availableBatches.length === 0 ? (
                <div className="col-span-2 text-center text-muted-foreground py-4">
                  No batches available for merging
                </div>
              ) : (
                availableBatches.map(batch => {
                  const isSelected = selectedBatchIds.includes(batch.id);
                  const batchQuantity = batch.yieldData?.totalWeight || 0;
                  const batchUnit = batch.yieldData?.unit || (domain === 'cannabis' ? 'grams' : 'lbs');
                  
                  return (
                    <div
                      key={batch.id}
                      onClick={() => toggleBatchSelection(batch.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:border-gray-400 hover:bg-gray-50'
                      } ${
                        batch.quarantineStatus === 'quarantined' 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{batch.name}</span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {config.terminology.cultivar}: {batch.cultivarName}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {batch.stage}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {batchQuantity} {batchUnit}
                            </span>
                          </div>
                        </div>
                      </div>
                      {batch.quarantineStatus === 'quarantined' && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          Quarantined
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Batches Summary */}
          {selectedBatches.length > 0 && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Selected Batches</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBatchIds([])}
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {selectedBatches.map(batch => (
                  <div key={batch.id} className="flex items-center justify-between text-sm">
                    <span>{batch.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {batch.yieldData?.totalWeight || 0} {batch.yieldData?.unit || batchUnit}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBatchSelection(batch.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex items-center justify-between font-semibold">
                  <span>{domainInfo.quantityLabel}</span>
                  <span>{totalQuantity.toFixed(2)} {batchUnit}</span>
                </div>
              </div>
            </div>
          )}

          {/* Target Batch Details */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="targetName">New Batch Name</Label>
              <Input
                id="targetName"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder={`Enter merged batch name`}
              />
            </div>

            <div>
              <Label htmlFor="targetLocation">{domainInfo.locationLabel}</Label>
              <Input
                id="targetLocation"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder={`Enter ${domainInfo.locationLabel.toLowerCase()}`}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this merge operation"
                rows={3}
              />
            </div>
          </div>

          {/* Validation Messages */}
          {validationResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">Cannot merge batches:</div>
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

          {/* Compliance Notes */}
          {selectedBatches.length >= 2 && (
            <div className="p-3 border rounded-lg bg-gray-50">
              <div className="font-medium mb-2 text-sm">Compliance Requirements:</div>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                {domainInfo.complianceNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleMerge}
              disabled={!validationResult.isValid}
              className="flex-1"
            >
              <Merge className="h-4 w-4 mr-2" />
              Merge {selectedBatches.length} Batches
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
