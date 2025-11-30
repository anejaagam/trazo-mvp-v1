/**
 * Quarantine Management Component
 * 
 * Manages batch quarantine and release workflows for both cannabis and produce
 * with compliance documentation and quality control integration.
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
import { AlertOctagon, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

/**
 * Data structure for quarantine operations
 */
export interface QuarantineActionData {
  batchId: string;
  batchName: string;
  action: 'quarantine' | 'release';
  reason: string;
  actionDate: string;
  actionBy: string;
  approvedBy?: string;
  notes?: string;
  testResults?: string;
  correctiveActions?: string;
}

export interface QuarantineManagementProps {
  batch: DomainBatch;
  onQuarantineAction?: (data: QuarantineActionData) => void;
  onCancel?: () => void;
}

export const QuarantineManagement: React.FC<QuarantineManagementProps> = ({
  batch,
  onQuarantineAction,
  onCancel
}) => {
  const { domain, config } = useDomain();
  
  const isQuarantined = batch.quarantineStatus === 'quarantined';
  const [action] = useState<'quarantine' | 'release'>(isQuarantined ? 'release' : 'quarantine');
  
  const [reason, setReason] = useState('');
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionBy, setActionBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [testResults, setTestResults] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState('');

  // Validation
  const validationResult = validateQuarantine();

  function validateQuarantine() {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!reason) {
      errors.push('Reason is required');
    }

    if (!actionBy.trim()) {
      errors.push('Action by (employee) is required');
    }

    if (action === 'quarantine') {
      if (!approvedBy.trim()) {
        warnings.push('Supervisor approval recommended for quarantine actions');
      }
    }

    if (action === 'release') {
      if (!approvedBy.trim()) {
        errors.push('Supervisor approval is required to release from quarantine');
      }
      
      if (!correctiveActions.trim()) {
        warnings.push('Corrective actions should be documented for release');
      }

      // Domain-specific release requirements
      if (domain === 'cannabis') {
        if (!testResults.trim()) {
          warnings.push('Test results should be documented for cannabis release');
        }
      } else {
        if (!testResults.trim()) {
          warnings.push('Quality inspection results should be documented for produce release');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  const handleSubmit = () => {
    if (!validationResult.isValid) return;

    const actionData: QuarantineActionData = {
      batchId: batch.id,
      batchName: batch.name,
      action,
      reason,
      actionDate: actionDate!,
      actionBy,
      approvedBy: approvedBy || undefined,
      notes: notes || undefined,
      testResults: testResults || undefined,
      correctiveActions: correctiveActions || undefined
    };

    onQuarantineAction?.(actionData);
  };

  // Get domain-specific quarantine reasons
  const getQuarantineReasons = () => {
    if (domain === 'cannabis') {
      return action === 'quarantine' ? [
        'Failed potency testing',
        'Failed microbial testing',
        'Failed pesticide testing',
        'Mold/mildew detected',
        'Pest infestation',
        'Cross-contamination',
        'Unknown substance detected',
        'Quality concerns',
        'Compliance investigation',
        'Other'
      ] : [
        'Testing passed - cleared',
        'Remediation completed',
        'Investigation cleared',
        'Quality restored',
        'Compliance approved',
        'Other'
      ];
    } else {
      return action === 'quarantine' ? [
        'Pest detection',
        'Disease symptoms',
        'Quality failure',
        'Contamination suspected',
        'Failed food safety inspection',
        'Recall investigation',
        'Temperature excursion',
        'Traceability issue',
        'Customer complaint',
        'Other'
      ] : [
        'Inspection passed',
        'Treatment completed',
        'Quality verified',
        'Investigation cleared',
        'Corrective actions completed',
        'Other'
      ];
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {action === 'quarantine' ? (
              <>
                <AlertOctagon className="h-5 w-5 text-red-600" />
                Quarantine Batch
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Release from Quarantine
              </>
            )}
          </CardTitle>
          <CardDescription>
            {action === 'quarantine' 
              ? 'Place batch under quarantine for investigation and remediation'
              : 'Release batch from quarantine after corrective actions'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Batch Information */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Batch Details</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{batch.stage}</Badge>
                {isQuarantined && (
                  <Badge variant="destructive">Quarantined</Badge>
                )}
              </div>
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
            {isQuarantined && batch.quarantineReason && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Current Quarantine Reason:</span>
                  <p className="mt-1 font-medium text-red-600">{batch.quarantineReason}</p>
                </div>
                {batch.quarantinedAt && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Quarantined: {new Date(batch.quarantinedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">
                {action === 'quarantine' ? 'Quarantine Reason' : 'Release Reason'}
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {getQuarantineReasons().map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actionDate">{action === 'quarantine' ? 'Quarantine' : 'Release'} Date</Label>
                <Input
                  id="actionDate"
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="actionBy">Action By</Label>
                <Input
                  id="actionBy"
                  value={actionBy}
                  onChange={(e) => setActionBy(e.target.value)}
                  placeholder="Employee name or ID"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="approvedBy">
                Approved By {action === 'release' ? '(Required)' : '(Recommended)'}
              </Label>
              <Input
                id="approvedBy"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                placeholder="Supervisor name or ID"
              />
            </div>
          </div>

          {/* Additional Documentation */}
          {action === 'release' && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Release Documentation</span>
              </div>

              <div>
                <Label htmlFor="testResults">Test/Inspection Results</Label>
                <Textarea
                  id="testResults"
                  value={testResults}
                  onChange={(e) => setTestResults(e.target.value)}
                  placeholder={domain === 'cannabis' 
                    ? 'Document test results (potency, microbial, pesticide, etc.)'
                    : 'Document inspection results (quality, food safety, etc.)'}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="correctiveActions">Corrective Actions Taken</Label>
                <Textarea
                  id="correctiveActions"
                  value={correctiveActions}
                  onChange={(e) => setCorrectiveActions(e.target.value)}
                  placeholder="Describe corrective actions, remediation, or treatments applied"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={action === 'quarantine' 
                ? 'Describe the issue and investigation plan'
                : 'Add any additional notes about the release'}
              rows={3}
            />
          </div>

          {/* Compliance Information */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">
                {action === 'quarantine' ? 'Quarantine' : 'Release'} Compliance Notes:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {action === 'quarantine' ? (
                  <>
                    {domain === 'cannabis' ? (
                      <>
                        <li>Quarantined batches cannot be sold or transferred</li>
                        <li>METRC status must be updated</li>
                        <li>Investigation must be documented</li>
                        <li>Notify quality control team</li>
                      </>
                    ) : (
                      <>
                        <li>Quarantined batches must be physically separated</li>
                        <li>Cannot be shipped or sold during quarantine</li>
                        <li>Traceability records must be maintained</li>
                        <li>Food safety team must be notified</li>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {domain === 'cannabis' ? (
                      <>
                        <li>All test results must pass before release</li>
                        <li>Corrective actions must be documented</li>
                        <li>METRC status must be updated</li>
                        <li>Supervisor approval required</li>
                      </>
                    ) : (
                      <>
                        <li>Quality inspection must confirm corrective actions</li>
                        <li>Food safety verification required</li>
                        <li>Traceability documentation must be complete</li>
                        <li>Supervisor approval required</li>
                      </>
                    )}
                  </>
                )}
              </ul>
            </AlertDescription>
          </Alert>

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
              onClick={handleSubmit}
              disabled={!validationResult.isValid}
              variant={action === 'quarantine' ? 'destructive' : 'default'}
              className="flex-1"
            >
              {action === 'quarantine' ? (
                <>
                  <AlertOctagon className="h-4 w-4 mr-2" />
                  Place in Quarantine
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Release from Quarantine
                </>
              )}
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
