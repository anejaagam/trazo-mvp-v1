/**
 * Validation Demo Component
 * 
 * Interactive demonstration of all validation rules and their usage
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Scale,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useValidation } from '../hooks/useValidation';
import { useDomain } from '../contexts/DomainContext';

export const ValidationDemo: React.FC = () => {
  const { domain } = useDomain();
  const validation = useValidation();

  // Quantity validation state
  const [quantityOp, setQuantityOp] = useState<'split' | 'waste' | 'transfer' | 'merge'>('split');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState(domain === 'cannabis' ? 'grams' : 'lbs');

  // Stage transition state
  const [currentStage, setCurrentStage] = useState(domain === 'cannabis' ? 'vegetative' : 'growing');
  const [nextStage, setNextStage] = useState(domain === 'cannabis' ? 'flowering' : 'harvest');

  // Date validation state
  const [harvestDate, setHarvestDate] = useState('2024-06-01');
  const [startDate, setStartDate] = useState('2024-03-01');

  const quantityRules = validation.quantity.getRules();
  const stageRules = validation.stage.getRules();

  // Run validations
  const quantityResult = validation.quantity.validate(quantityOp, parseFloat(quantity) || 0, unit);
  const stageResult = validation.stage.validate(currentStage, nextStage);
  const dateResult = validation.date.validateHarvest(harvestDate, startDate);

  const renderValidationResult = (
    result: { isValid: boolean; error?: string; warnings?: string[] },
    title: string
  ) => {
    if (result.isValid && !result.warnings) {
      return (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{title}:</strong> Validation passed
          </AlertDescription>
        </Alert>
      );
    }

    if (!result.isValid && result.error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>{title}:</strong> {result.error}
          </AlertDescription>
        </Alert>
      );
    }

    if (result.warnings && result.warnings.length > 0) {
      return (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>{title}:</strong> {result.warnings.join('; ')}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Validation Rules Demo</h2>
        <p className="text-gray-600">
          Interactive demonstration of cross-domain validation rules for {domain} batches
        </p>
      </div>

      {/* Quantity Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Quantity Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Operation</Label>
              <select
                className="w-full p-2 border rounded"
                value={quantityOp}
                onChange={(e) => setQuantityOp(e.target.value as any)}
              >
                <option value="split">Split Batch</option>
                <option value="waste">Record Waste</option>
                <option value="transfer">Transfer</option>
                <option value="merge">Merge Batches</option>
              </select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.1"
              />
            </div>
            <div>
              <Label>Unit</Label>
              <select
                className="w-full p-2 border rounded"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {domain === 'cannabis' ? (
                  <>
                    <option value="grams">grams</option>
                    <option value="oz">oz</option>
                  </>
                ) : (
                  <>
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Quantity Rules Reference */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-semibold text-sm mb-2">Rules for {quantityOp}:</h4>
            {quantityRules[quantityOp] && (
              <div className="text-sm space-y-1">
                <p>Min: {quantityRules[quantityOp].minWeight} {quantityRules[quantityOp].unit}</p>
                {quantityRules[quantityOp].maxWeight && (
                  <p>Max: {quantityRules[quantityOp].maxWeight} {quantityRules[quantityOp].unit}</p>
                )}
                <p className="text-gray-600 italic">{quantityRules[quantityOp].context}</p>
              </div>
            )}
          </div>

          {renderValidationResult(quantityResult, 'Quantity Validation')}
        </CardContent>
      </Card>

      {/* Stage Transition Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Stage Transition Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Current Stage</Label>
              <select
                className="w-full p-2 border rounded"
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value)}
              >
                {Object.keys(stageRules).map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Next Stage</Label>
              <select
                className="w-full p-2 border rounded"
                value={nextStage}
                onChange={(e) => setNextStage(e.target.value)}
              >
                {Object.keys(stageRules).map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stage Rules Reference */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-semibold text-sm mb-2">Rules for {currentStage}:</h4>
            {stageRules[currentStage] && (
              <div className="text-sm space-y-1">
                <p>Allowed next stages: {stageRules[currentStage].allowedNextStages.join(', ')}</p>
                {stageRules[currentStage].minDuration && (
                  <p>Minimum duration: {stageRules[currentStage].minDuration} days</p>
                )}
                {stageRules[currentStage].maxDuration && (
                  <p>Typical duration: {stageRules[currentStage].maxDuration} days</p>
                )}
                {stageRules[currentStage].requiredFields && (
                  <p>Required fields: {stageRules[currentStage].requiredFields?.join(', ')}</p>
                )}
                {stageRules[currentStage].validationMessage && (
                  <p className="text-gray-600 italic">{stageRules[currentStage].validationMessage}</p>
                )}
              </div>
            )}
          </div>

          {renderValidationResult(stageResult, 'Stage Transition')}
        </CardContent>
      </Card>

      {/* Date Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date & Timeline Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Batch Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Harvest Date</Label>
              <Input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
              />
            </div>
          </div>

          {/* Timeline Info */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-semibold text-sm mb-2">Timeline Analysis:</h4>
            <div className="text-sm space-y-1">
              <p>Days from start to harvest: {
                Math.floor((new Date(harvestDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
              }</p>
              <p className="text-gray-600 italic">
                {domain === 'cannabis' 
                  ? 'Typical cannabis cycle: 60-180 days'
                  : 'Typical produce cycle: 21-120 days'}
              </p>
            </div>
          </div>

          {renderValidationResult(dateResult, 'Harvest Date')}
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Domain:</span>
              <Badge>{domain}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Quantity Validation:</span>
              <Badge variant={quantityResult.isValid ? "default" : "destructive"}>
                {quantityResult.isValid ? 'Valid' : 'Invalid'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Stage Transition:</span>
              <Badge variant={stageResult.isValid ? "default" : "destructive"}>
                {stageResult.isValid ? 'Valid' : 'Invalid'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Date Validation:</span>
              <Badge variant={dateResult.isValid ? "default" : "destructive"}>
                {dateResult.isValid ? 'Valid' : 'Invalid'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
