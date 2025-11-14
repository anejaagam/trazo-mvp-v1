/**
 * Cannabis Workflow Manager
 * 
 * Orchestrates complete cannabis workflows from propagation to packaging,
 * integrating all cannabis-specific components into cohesive user flows.
 */

import React, { useState } from 'react';
import { DomainBatch } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
  Sprout,
  Scissors,
  Wind,
  Package,
  FlaskConical,
  CheckCircle2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export interface CannabisWorkflowManagerProps {
  batches: DomainBatch[];
  onStageTransition?: (batchId: string, newStage: string) => void;
  onOpenComponent?: (component: string, batch: DomainBatch) => void;
}

export const CannabisWorkflowManager: React.FC<CannabisWorkflowManagerProps> = ({
  batches,
  onStageTransition,
  onOpenComponent
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<'propagation' | 'harvest' | 'post-harvest'>('propagation');

  // Filter cannabis batches only
  const cannabisBatches = batches.filter(b => b.domainType === 'cannabis');

  // Workflow definitions
  const workflows = {
    propagation: {
      name: 'Propagation to Flowering',
      description: 'Clone mother → Create clones → Vegetative → Flowering',
      stages: ['propagation', 'vegetative', 'flowering'],
      icon: Sprout,
      color: 'green'
    },
    harvest: {
      name: 'Harvest & Processing',
      description: 'Harvest → Drying → Curing → Testing → Package',
      stages: ['harvest', 'drying', 'curing', 'testing', 'packaging'],
      icon: Scissors,
      color: 'orange'
    },
    'post-harvest': {
      name: 'Post-Harvest Compliance',
      description: 'Package → Transfer → Distribution',
      stages: ['packaging', 'closed'],
      icon: Package,
      color: 'blue'
    }
  };

  const currentWorkflow = workflows[selectedWorkflow];

  // Get batches for current workflow
  const getWorkflowBatches = () => {
    return cannabisBatches.filter(b => 
      currentWorkflow.stages.includes(b.stage)
    );
  };

  const workflowBatches = getWorkflowBatches();

  // Get next stage for a batch
  const getNextStage = (currentStage: string): string | null => {
    const stageProgression: Record<string, string> = {
      'propagation': 'vegetative',
      'vegetative': 'flowering',
      'flowering': 'harvest',
      'harvest': 'drying',
      'drying': 'curing',
      'curing': 'testing',
      'testing': 'packaging',
      'packaging': 'closed'
    };
    return stageProgression[currentStage] || null;
  };

  // Get required actions for stage transition
  const getRequiredActions = (stage: string): string[] => {
    const requirements: Record<string, string[]> = {
      'propagation': ['Verify clone health', 'Root development check'],
      'vegetative': ['Light schedule: 18/6', 'Growth monitoring'],
      'flowering': ['Light schedule: 12/12', 'Trichome inspection'],
      'harvest': ['Harvest completion', 'Initial weight recording'],
      'drying': ['Environment: 60-70°F, 55-65% RH', 'Minimum 7 days'],
      'curing': ['Moisture content check', 'Quality assessment'],
      'testing': ['Potency testing', 'Microbial testing', 'Pesticide testing'],
      'packaging': ['Test results passed', 'METRC package tags']
    };
    return requirements[stage] || [];
  };

  // Render workflow timeline
  const renderWorkflowTimeline = () => {
    const Icon = currentWorkflow.icon;
    
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`h-5 w-5 text-${currentWorkflow.color}-600`} />
          <div>
            <h3 className="font-semibold">{currentWorkflow.name}</h3>
            <p className="text-sm text-muted-foreground">{currentWorkflow.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {currentWorkflow.stages.map((stage, index) => (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center min-w-[120px]">
                <Badge 
                  variant={workflowBatches.some(b => b.stage === stage) ? 'default' : 'outline'}
                  className="mb-2"
                >
                  {stage.replace(/_/g, ' ')}
                </Badge>
                <div className="text-xs text-center text-muted-foreground">
                  {workflowBatches.filter(b => b.stage === stage).length} batches
                </div>
              </div>
              {index < currentWorkflow.stages.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Render batch card for workflow
  const renderBatchCard = (batch: DomainBatch) => {
    const nextStage = getNextStage(batch.stage);
    const requirements = getRequiredActions(batch.stage);
    const canProgress = nextStage !== null;

    return (
      <Card key={batch.id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{batch.name}</span>
                <Badge variant="outline">{batch.stage}</Badge>
                {batch.quarantineStatus === 'quarantined' && (
                  <Badge variant="destructive">Quarantined</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Cultivar: {batch.cultivarName} • Plants: {batch.plantCount}
              </div>
            </div>
          </div>

          {requirements.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium mb-1">Stage Requirements:</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {/* Stage transition */}
            {canProgress && batch.quarantineStatus !== 'quarantined' && (
              <Button
                size="sm"
                onClick={() => onStageTransition?.(batch.id, nextStage)}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Move to {nextStage}
              </Button>
            )}

            {/* Stage-specific actions */}
            {batch.stage === 'drying' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenComponent?.('drying-curing', batch)}
              >
                <Wind className="h-3 w-3 mr-1" />
                Track Drying
              </Button>
            )}

            {batch.stage === 'testing' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenComponent?.('testing', batch)}
              >
                <FlaskConical className="h-3 w-3 mr-1" />
                Record Tests
              </Button>
            )}

            {(batch.stage === 'packaging' || batch.stage === 'testing') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenComponent?.('metrc-tags', batch)}
              >
                <Package className="h-3 w-3 mr-1" />
                METRC Tags
              </Button>
            )}

            {/* Always available actions */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenComponent?.('quality', batch)}
            >
              Quality Check
            </Button>

            {batch.quarantineStatus !== 'quarantined' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenComponent?.('quarantine', batch)}
              >
                Quarantine
              </Button>
            )}
          </div>

          {batch.quarantineStatus === 'quarantined' && (
            <Alert variant="destructive" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Batch is quarantined. Resolve issues before progressing.
                {batch.quarantineReason && ` Reason: ${batch.quarantineReason}`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cannabis Workflow Manager</CardTitle>
          <CardDescription>
            Complete workflow orchestration for cannabis cultivation and processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedWorkflow} onValueChange={(v) => setSelectedWorkflow(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="propagation">
                <Sprout className="h-4 w-4 mr-2" />
                Propagation
              </TabsTrigger>
              <TabsTrigger value="harvest">
                <Scissors className="h-4 w-4 mr-2" />
                Harvest
              </TabsTrigger>
              <TabsTrigger value="post-harvest">
                <Package className="h-4 w-4 mr-2" />
                Post-Harvest
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedWorkflow} className="mt-6">
              {renderWorkflowTimeline()}

              {workflowBatches.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No batches in this workflow. Create a new batch or check other workflows.
                  </AlertDescription>
                </Alert>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Active Batches ({workflowBatches.length})</h4>
                  </div>
                  {workflowBatches.map(renderBatchCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenComponent?.('waste-tracking', null as any)}
            >
              Record Waste
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenComponent?.('batch-splitting', null as any)}
            >
              Split Batch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenComponent?.('batch-merging', null as any)}
            >
              Merge Batches
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenComponent?.('location-transfer', null as any)}
            >
              Transfer Location
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
