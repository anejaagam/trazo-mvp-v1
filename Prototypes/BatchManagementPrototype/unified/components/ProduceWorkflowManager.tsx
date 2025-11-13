import React, { useState } from 'react';
import { 
  Sprout, 
  Package, 
  Thermometer, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Clock,
  MapPin
} from 'lucide-react';
import { DomainBatch } from '../types/domains';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';

interface ProduceWorkflowManagerProps {
  batches: DomainBatch[];
  onStageTransition: (batchId: string, newStage: string) => void;
  onOpenComponent: (componentName: string, batchId?: string) => void;
}

type WorkflowType = 'cultivation' | 'processing' | 'storage';

interface WorkflowDefinition {
  id: WorkflowType;
  name: string;
  description: string;
  stages: string[];
  icon: React.ElementType;
  color: string;
}

const workflows: WorkflowDefinition[] = [
  {
    id: 'cultivation',
    name: 'Cultivation Cycle',
    description: 'Seeding → Germination → Growing → Harvesting',
    stages: ['seeding', 'germination', 'growing', 'harvest'],
    icon: Sprout,
    color: 'green'
  },
  {
    id: 'processing',
    name: 'Post-Harvest Processing',
    description: 'Harvest → Grading → Ripening → Packaging',
    stages: ['harvest', 'grading', 'ripening', 'packaging'],
    icon: Package,
    color: 'blue'
  },
  {
    id: 'storage',
    name: 'Cold Storage & Distribution',
    description: 'Cold Storage → Quality Inspection → Ready for Distribution',
    stages: ['storage', 'grading', 'packaging', 'closed'],
    icon: Thermometer,
    color: 'purple'
  }
];

const stageProgression: Record<string, string> = {
  'seeding': 'germination',
  'germination': 'growing',
  'growing': 'harvest',
  'harvest': 'grading',
  'grading': 'ripening',
  'ripening': 'packaging',
  'storage': 'grading',
  'packaging': 'closed'
};

const stageRequirements: Record<string, string[]> = {
  'seeding': [
    'Seed variety selected',
    'Planting medium prepared',
    'Seeding depth verified',
    'Irrigation system ready'
  ],
  'germination': [
    'Temperature maintained (65-75°F)',
    'Humidity controlled (70-80%)',
    'Light exposure monitored',
    'Germination rate tracked (minimum 2-7 days)'
  ],
  'growing': [
    'Nutrient schedule established',
    'Pest monitoring active',
    'Growth measurements recorded',
    'Environmental conditions optimal'
  ],
  'harvest': [
    'Ripeness verified (visual/touch/brix)',
    'Harvest window confirmed',
    'Equipment sanitized',
    'Harvest weight recorded'
  ],
  'grading': [
    'Quality inspection completed',
    'Grade assigned (A/B/C)',
    'Defects documented',
    'Size/color sorting completed'
  ],
  'ripening': [
    'Ripeness level assessed (1-10 scale)',
    'Ethylene exposure controlled (if needed)',
    'Temperature/humidity monitored',
    'Daily ripeness checks performed'
  ],
  'storage': [
    'Target temperature maintained',
    'Humidity levels controlled',
    'Storage duration tracked',
    'Condensation prevention active'
  ],
  'packaging': [
    'Packaging materials selected',
    'Weight/count verified',
    'Labeling completed (variety, date, lot)',
    'Traceability codes assigned'
  ]
};

export const ProduceWorkflowManager: React.FC<ProduceWorkflowManagerProps> = ({
  batches,
  onStageTransition,
  onOpenComponent
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType>('cultivation');

  // Filter for produce batches only
  const produceBatches = batches.filter(b => b.domainType === 'produce');

  const getWorkflowBatches = (workflow: WorkflowDefinition) => {
    return produceBatches.filter(batch => 
      workflow.stages.includes(batch.stage)
    );
  };

  const getNextStage = (currentStage: string): string | null => {
    return stageProgression[currentStage] || null;
  };

  const getRequiredActions = (stage: string): string[] => {
    return stageRequirements[stage] || [];
  };

  const selectedWorkflowDef = workflows.find(w => w.id === selectedWorkflow)!;
  const workflowBatches = getWorkflowBatches(selectedWorkflowDef);

  return (
    <div className="space-y-6">
      {/* Workflow Tabs */}
      <div className="flex gap-2 border-b">
        {workflows.map(workflow => {
          const Icon = workflow.icon;
          const batchCount = getWorkflowBatches(workflow).length;
          
          return (
            <button
              key={workflow.id}
              onClick={() => setSelectedWorkflow(workflow.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                selectedWorkflow === workflow.id
                  ? `border-${workflow.color}-500 text-${workflow.color}-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{workflow.name}</span>
              <Badge variant="secondary">{batchCount}</Badge>
            </button>
          );
        })}
      </div>

      {/* Workflow Timeline */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Workflow Timeline</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {selectedWorkflowDef.stages.map((stage, index) => {
            const stageCount = workflowBatches.filter(b => b.stage === stage).length;
            
            return (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center min-w-[120px]">
                  <Badge 
                    variant={stageCount > 0 ? "default" : "outline"}
                    className="mb-2"
                  >
                    {stage.replace('-', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-600">{stageCount} batches</span>
                </div>
                {index < selectedWorkflowDef.stages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Batch Cards */}
      <div className="space-y-4">
        <h3 className="font-semibold">
          Active Batches ({workflowBatches.length})
        </h3>
        
        {workflowBatches.length === 0 ? (
          <Alert>
            <AlertDescription>
              No batches in this workflow. Create a new produce batch to get started.
            </AlertDescription>
          </Alert>
        ) : (
          workflowBatches.map(batch => {
            const nextStage = getNextStage(batch.stage);
            const requirements = getRequiredActions(batch.stage);
            const isQuarantined = batch.quarantineStatus === 'quarantined';

            return (
              <Card key={batch.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{batch.name}</h4>
                      <Badge variant="outline">{batch.stage}</Badge>
                      {isQuarantined && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Quarantined
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {batch.cultivarName} • {batch.yieldData?.totalWeight || 0} {batch.yieldData?.unit || 'lbs'}
                    </p>
                  </div>
                  {nextStage && (
                    <Button
                      size="sm"
                      onClick={() => onStageTransition(batch.id, nextStage)}
                      disabled={isQuarantined}
                    >
                      Move to {nextStage.replace('-', ' ')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>

                {/* Quarantine Alert */}
                {isQuarantined && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      Batch is quarantined{batch.quarantineReason ? `: ${batch.quarantineReason}` : ''}. 
                      Release from quarantine before progressing.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Stage Requirements */}
                <div className="mb-3">
                  <h5 className="text-sm font-medium mb-2">Stage Requirements:</h5>
                  <ul className="text-sm space-y-1">
                    {requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stage-Specific Actions */}
                <div className="flex flex-wrap gap-2">
                  {batch.stage === 'grading' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenComponent('GradingSystem', batch.id)}
                    >
                      <Scale className="w-4 h-4 mr-2" />
                      Grade Batch
                    </Button>
                  )}
                  
                  {batch.stage === 'ripening' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenComponent('RipenessTracking', batch.id)}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Track Ripeness
                    </Button>
                  )}
                  
                  {batch.stage === 'storage' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenComponent('ColdStorageManagement', batch.id)}
                    >
                      <Thermometer className="w-4 h-4 mr-2" />
                      Manage Storage
                    </Button>
                  )}
                  
                  {batch.stage === 'packaging' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenComponent('ProducePackaging', batch.id)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Package Batch
                    </Button>
                  )}

                  {/* Always available actions */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenComponent('ProduceQualityControl', batch.id)}
                  >
                    Quality Check
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenComponent('QuarantineManagement', batch.id)}
                  >
                    Quarantine
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenComponent('WasteTracking')}
          >
            Record Waste
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenComponent('BatchSplitting')}
          >
            Split Batch
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenComponent('BatchMerging')}
          >
            Merge Batches
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenComponent('LocationTransfer')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Transfer Location
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenComponent('HarvestWindowPredictions')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Harvest Planning
          </Button>
        </div>
      </Card>
    </div>
  );
};
