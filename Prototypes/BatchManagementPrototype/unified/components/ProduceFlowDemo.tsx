import React, { useState } from 'react';
import {
  Sprout,
  Droplets,
  TrendingUp,
  Scale,
  Thermometer,
  Package,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Star,
  PlayCircle
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';

interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  steps: StepDefinition[];
}

interface StepDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  stage: string;
  requirements: string[];
  actions: string[];
  nextStage?: string;
}

const flows: FlowDefinition[] = [
  {
    id: 'cultivation',
    name: 'Seeding to Harvest',
    description: 'Complete growing cycle from seed to harvest',
    icon: Sprout,
    steps: [
      {
        id: 'seed-planting',
        name: 'Seed Planting',
        description: 'Plant seeds in growing medium',
        icon: Sprout,
        stage: 'seeding',
        requirements: [
          'Seed variety selected and verified',
          'Growing medium prepared (soil/hydroponic)',
          'Planting depth calculated by seed type',
          'Irrigation system configured and tested'
        ],
        actions: [
          'Record seed lot number and expiration date',
          'Document planting density and spacing',
          'Set irrigation schedule based on crop needs',
          'Create batch record with expected germination date',
          'Apply traceability labels to growing areas'
        ],
        nextStage: 'germination'
      },
      {
        id: 'germination-growth',
        name: 'Germination & Early Growth',
        description: 'Monitor seedling emergence and early development',
        icon: Droplets,
        stage: 'germination',
        requirements: [
          'Temperature maintained at optimal range (65-75°F)',
          'Humidity levels controlled (70-80%)',
          'Light exposure managed (duration and intensity)',
          'Germination rate monitored (target >85%)'
        ],
        actions: [
          'Track daily germination percentage',
          'Monitor soil moisture levels',
          'Adjust environmental controls as needed',
          'Record any germination issues or losses',
          'Document transition to growing stage criteria'
        ],
        nextStage: 'growing'
      },
      {
        id: 'growing-harvest',
        name: 'Growing to Harvest',
        description: 'Manage crop through maturity to optimal harvest time',
        icon: TrendingUp,
        stage: 'growing',
        requirements: [
          'Nutrient feeding schedule established and followed',
          'Pest and disease monitoring program active',
          'Growth measurements tracked weekly',
          'Environmental parameters optimized for crop stage'
        ],
        actions: [
          'Record weekly plant height and leaf count',
          'Document any pest treatments or interventions',
          'Perform regular quality inspections',
          'Track harvest window predictions',
          'Prepare harvest equipment and containers'
        ],
        nextStage: 'harvest'
      },
      {
        id: 'harvest-collection',
        name: 'Harvest Collection',
        description: 'Execute harvest at optimal ripeness',
        icon: Scale,
        stage: 'harvest',
        requirements: [
          'Ripeness indicators verified (color, firmness, brix)',
          'Harvest timing optimized for quality',
          'Equipment sanitized per food safety protocols',
          'Harvest containers clean and labeled'
        ],
        actions: [
          'Record harvest date, time, and personnel',
          'Weigh and document total harvest yield',
          'Assign lot numbers to harvested produce',
          'Conduct initial quality assessment',
          'Move to grading or storage within 2 hours'
        ]
      }
    ]
  },
  {
    id: 'processing',
    name: 'Harvest to Packaging',
    description: 'Post-harvest handling, grading, and packaging',
    icon: Package,
    steps: [
      {
        id: 'grading-sorting',
        name: 'Grading & Sorting',
        description: 'Quality inspection and grade assignment',
        icon: Star,
        stage: 'grading',
        requirements: [
          'Grading criteria established (size, color, defects)',
          'Grading personnel trained on standards',
          'Sorted containers prepared and labeled',
          'Quality records ready for documentation'
        ],
        actions: [
          'Perform visual inspection for defects',
          'Assign grade (Premium/A/B/C/Processing)',
          'Sort by size categories if applicable',
          'Document grade percentages and yield',
          'Record any quality issues or rejections'
        ],
        nextStage: 'ripening'
      },
      {
        id: 'ripening-storage',
        name: 'Ripening Management',
        description: 'Control ripening process for optimal quality',
        icon: Clock,
        stage: 'ripening',
        requirements: [
          'Ripeness level assessed (1-10 scale or stages)',
          'Temperature and humidity set for crop type',
          'Ethylene exposure controlled (if applicable)',
          'Daily monitoring schedule established'
        ],
        actions: [
          'Track ripeness progression daily',
          'Adjust environmental controls as needed',
          'Document color and firmness changes',
          'Determine optimal packaging timing',
          'Move batches to packaging when ready'
        ],
        nextStage: 'packaging'
      },
      {
        id: 'packaging-labeling',
        name: 'Packaging & Labeling',
        description: 'Final packaging with compliance labeling',
        icon: Package,
        stage: 'packaging',
        requirements: [
          'Packaging materials selected for product type',
          'Final weight/count verified',
          'Labels prepared with required information',
          'Traceability codes assigned'
        ],
        actions: [
          'Package produce in appropriate containers',
          'Apply labels with variety, date, lot number',
          'Record final packaged weight and count',
          'Generate traceability documentation',
          'Move to cold storage or distribution'
        ]
      }
    ]
  },
  {
    id: 'cold-storage',
    name: 'Cold Storage Management',
    description: 'Temperature-controlled storage and quality maintenance',
    icon: Thermometer,
    steps: [
      {
        id: 'storage-entry',
        name: 'Cold Storage Entry',
        description: 'Receive produce into temperature-controlled storage',
        icon: Thermometer,
        stage: 'storage',
        requirements: [
          'Storage area at target temperature for crop type',
          'Humidity levels appropriate (typically 90-95%)',
          'Storage space allocated and clean',
          'Inventory system ready for new batches'
        ],
        actions: [
          'Record entry date, time, and temperature',
          'Assign storage location within facility',
          'Set expected shelf life and rotation date',
          'Configure temperature monitoring alerts',
          'Document initial quality condition'
        ],
        nextStage: 'grading'
      },
      {
        id: 'quality-inspection',
        name: 'Storage Quality Inspections',
        description: 'Regular quality checks during storage',
        icon: CheckCircle2,
        stage: 'grading',
        requirements: [
          'Visual inspection completed',
          'Temperature logs reviewed and verified',
          'Shelf life remaining calculated',
          'Food safety parameters checked'
        ],
        actions: [
          'Perform visual quality assessment',
          'Check for condensation or temperature issues',
          'Verify rotation schedule adherence',
          'Document any quality degradation',
          'Move to packaging or mark for disposal'
        ],
        nextStage: 'packaging'
      },
      {
        id: 'distribution-prep',
        name: 'Distribution Preparation',
        description: 'Prepare batches for shipment or sale',
        icon: Package,
        stage: 'packaging',
        requirements: [
          'Final quality inspection passed',
          'Temperature maintained throughout storage',
          'Documentation complete and accurate',
          'Packaging suitable for transport'
        ],
        actions: [
          'Verify traceability documentation complete',
          'Prepare shipping manifests',
          'Load for distribution maintaining cold chain',
          'Record shipment date, time, destination',
          'Close batch records in system'
        ]
      }
    ]
  },
  {
    id: 'waste-disposal',
    name: 'Waste & Loss Management',
    description: 'Document and dispose of produce waste properly',
    icon: AlertTriangle,
    steps: [
      {
        id: 'waste-identification',
        name: 'Identify Waste',
        description: 'Document produce that must be disposed',
        icon: AlertTriangle,
        stage: 'harvest',
        requirements: [
          'Waste reason documented (overripe, damage, disease)',
          'Batch and lot numbers recorded',
          'Weight or count of waste measured',
          'Photos taken for quality records'
        ],
        actions: [
          'Separate waste from marketable produce',
          'Weigh and record waste quantity',
          'Assign waste category and reason code',
          'Document location where waste originated',
          'Initiate waste disposal workflow'
        ],
        nextStage: 'grading'
      },
      {
        id: 'waste-approval',
        name: 'Approval & Witness',
        description: 'Obtain required approvals for waste disposal',
        icon: FileText,
        stage: 'grading',
        requirements: [
          'Supervisor approval obtained for >50 lbs',
          'Witness present for large waste events',
          'Disposal method selected and documented',
          'Traceability records updated'
        ],
        actions: [
          'Submit waste report to supervisor',
          'Obtain approval signature',
          'Record witness name if required',
          'Select disposal method (compost/landfill/other)',
          'Update inventory and batch records'
        ],
        nextStage: 'packaging'
      },
      {
        id: 'waste-execution',
        name: 'Execute Disposal',
        description: 'Complete waste disposal process',
        icon: CheckCircle2,
        stage: 'packaging',
        requirements: [
          'All approvals obtained',
          'Disposal method prepared',
          'Documentation ready for final recording',
          'Photos or evidence collected'
        ],
        actions: [
          'Transport waste to designated disposal area',
          'Execute disposal per selected method',
          'Capture photo evidence of disposal',
          'Record disposal completion date and time',
          'File waste documentation for audit trail'
        ]
      }
    ]
  },
  {
    id: 'quality-quarantine',
    name: 'Quality Testing & Quarantine',
    description: 'Handle quality issues and quarantine procedures',
    icon: AlertTriangle,
    steps: [
      {
        id: 'quality-issue',
        name: 'Quality Issue Detection',
        description: 'Identify and document quality concerns',
        icon: AlertTriangle,
        stage: 'grading',
        requirements: [
          'Quality issue clearly documented',
          'Severity assessed (minor/moderate/severe)',
          'Affected batches identified and isolated',
          'Supervisor notified immediately'
        ],
        actions: [
          'Place batch on quality hold status',
          'Document specific quality concerns',
          'Take photos of quality issues',
          'Isolate affected produce physically',
          'Initiate quarantine workflow in system'
        ],
        nextStage: 'storage'
      },
      {
        id: 'investigation',
        name: 'Investigation & Testing',
        description: 'Investigate root cause and conduct testing',
        icon: FileText,
        stage: 'storage',
        requirements: [
          'Batch physically isolated from other inventory',
          'Root cause analysis initiated',
          'Additional testing scheduled if needed',
          'Corrective action plan documented'
        ],
        actions: [
          'Review growing and handling records',
          'Identify potential contamination sources',
          'Conduct additional quality testing',
          'Document investigation findings',
          'Develop corrective and preventive actions'
        ],
        nextStage: 'packaging'
      },
      {
        id: 'resolution',
        name: 'Resolution & Release',
        description: 'Resolve issue and release or dispose batch',
        icon: CheckCircle2,
        stage: 'packaging',
        requirements: [
          'Investigation completed and documented',
          'Corrective actions implemented',
          'Re-inspection passed if releasable',
          'Supervisor approval obtained for release'
        ],
        actions: [
          'Review all investigation documentation',
          'Verify corrective actions completed',
          'Obtain supervisor approval for release or disposal',
          'Update batch status in system',
          'Close quarantine with final disposition'
        ]
      }
    ]
  }
];

export const ProduceFlowDemo: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentFlow = flows[activeFlow];
  const currentStepData = currentFlow?.steps[currentStep];

  // Early return if no flow or step data
  if (!currentFlow || !currentStepData) {
    return null;
  }

  const handleFlowSelect = (flowIndex: number) => {
    setActiveFlow(flowIndex);
    setCurrentStep(0);
  };

  const handleStepChange = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleCompleteStep = () => {
    if (!currentStepData) return;
    
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStepData.id);
    setCompletedSteps(newCompleted);

    // Move to next step if available
    if (currentStep < currentFlow.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    setCompletedSteps(new Set());
    setCurrentStep(0);
  };

  const progress = ((currentStep + 1) / currentFlow.steps.length) * 100;
  const StepIcon = currentStepData?.icon || CheckCircle2;
  const isStepCompleted = completedSteps.has(currentStepData.id);
  const allStepsCompleted = currentFlow.steps.every(step => 
    completedSteps.has(step.id)
  );

  return (
    <div className="space-y-6">
      {/* Flow Selection */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold">Produce Complete Workflows</h2>
        <p className="text-gray-600">
          Interactive demonstrations of complete produce batch management workflows
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow, index) => {
            const FlowIcon = flow.icon;
            return (
              <Button
                key={flow.id}
                variant={activeFlow === index ? "default" : "outline"}
                className="h-auto p-4 justify-start"
                onClick={() => handleFlowSelect(index)}
              >
                <div className="flex items-start gap-3">
                  <FlowIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">{flow.name}</div>
                    <div className="text-sm opacity-80">{flow.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Current Flow Details */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {currentStep + 1} of {currentFlow.steps.length}
              </span>
              <span className="text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Step Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {currentFlow.steps.map((step, index) => {
              const completed = completedSteps.has(step.id);
              return (
                <Button
                  key={step.id}
                  variant={currentStep === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStepChange(index)}
                  className="flex-shrink-0"
                >
                  {completed && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {index + 1}. {step.name}
                </Button>
              );
            })}
          </div>

          {/* Current Step Details */}
          <div className="space-y-4 mt-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${isStepCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                <StepIcon className={`w-6 h-6 ${isStepCompleted ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold">{currentStepData.name}</h3>
                  {isStepCompleted && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600">{currentStepData.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">Stage: {currentStepData.stage}</Badge>
                  {currentStepData.nextStage && (
                    <Badge variant="secondary">Next: {currentStepData.nextStage}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="font-semibold mb-3">Requirements:</h4>
              <div className="space-y-2">
                {currentStepData.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h4 className="font-semibold mb-3">Actions to Complete:</h4>
              <ol className="space-y-2 list-decimal list-inside">
                {currentStepData.actions.map((action, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {action}
                  </li>
                ))}
              </ol>
            </div>

            {/* Next Stage Alert */}
            {currentStepData.nextStage && (
              <Alert>
                <PlayCircle className="w-4 h-4" />
                <AlertDescription>
                  After completing these actions, batch will transition to <strong>{currentStepData.nextStage}</strong> stage.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCompleteStep}
                disabled={isStepCompleted}
                className="flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isStepCompleted ? 'Step Completed' : 'Mark Complete'}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
              >
                Reset Workflow
              </Button>
            </div>

            {/* Completion Message */}
            {allStepsCompleted && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Workflow Complete!</strong> All steps in this produce flow have been completed.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
