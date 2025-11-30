/**
 * Cannabis Flow Demonstration
 * 
 * Demonstrates all complete cannabis workflows with step-by-step guidance:
 * 1. Clone mother → Create clones → Vegetative → Flowering
 * 2. Harvest → Drying → Curing → Testing → Package
 * 3. Package → Transfer → Sale
 * 4. Waste disposal flow with compliance
 * 5. Quality testing and quarantine flow
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import {
  Sprout,
  Droplets,
  Flower2,
  Scissors,
  Wind,
  Thermometer,
  FlaskConical,
  Package,
  Truck,
  Trash2,
  AlertOctagon,
  CheckCircle2,
  Play,
  RotateCcw
} from 'lucide-react';

export const CannabisFlowDemo: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Define all 5 cannabis workflows
  const flows = [
    {
      id: 'propagation-to-flowering',
      name: 'Flow 1: Propagation to Flowering',
      description: 'Clone mother → Create clones → Vegetative → Flowering',
      steps: [
        {
          id: 'clone-mother',
          name: 'Clone from Mother Plant',
          description: 'Take cuttings from healthy mother plant',
          icon: Sprout,
          stage: 'propagation',
          requirements: [
            'Healthy mother plant identified',
            'Sterile cutting tools prepared',
            'Rooting medium ready',
            'Cloning dome/humidity control available'
          ],
          actions: [
            'Create new batch with type: clone',
            'Record mother plant ID in genealogy',
            'Set initial plant count',
            'Assign to propagation pod',
            'Record METRC plant tags (if applicable)'
          ],
          nextStage: 'vegetative'
        },
        {
          id: 'vegetative',
          name: 'Vegetative Growth',
          description: 'Develop strong root system and vegetation',
          icon: Droplets,
          stage: 'vegetative',
          requirements: [
            'Roots established (minimum 2-3 weeks)',
            'Light schedule: 18/6 (18 hours on, 6 hours off)',
            'Temperature: 70-85°F',
            'Humidity: 40-60%'
          ],
          actions: [
            'Transition batch stage to vegetative',
            'Update lighting schedule',
            'Monitor plant count',
            'Record quality metrics (growth rate, health)',
            'Track environmental conditions'
          ],
          nextStage: 'flowering'
        },
        {
          id: 'flowering',
          name: 'Flowering Stage',
          description: 'Induce and monitor flower development',
          icon: Flower2,
          stage: 'flowering',
          requirements: [
            'Vegetative growth complete (4-8 weeks)',
            'Light schedule: 12/12 (12 hours on, 12 hours off)',
            'Temperature: 65-80°F',
            'Humidity: 40-50%'
          ],
          actions: [
            'Transition to flowering stage',
            'Change light schedule to 12/12',
            'Monitor trichome development',
            'Record quality metrics (bud formation)',
            'Plan harvest window (8-12 weeks)'
          ]
        }
      ]
    },
    {
      id: 'harvest-to-package',
      name: 'Flow 2: Harvest to Packaging',
      description: 'Harvest → Drying → Curing → Testing → Package',
      steps: [
        {
          id: 'harvest',
          name: 'Harvest',
          description: 'Cut and process mature plants',
          icon: Scissors,
          stage: 'harvest',
          requirements: [
            'Flowering complete (trichomes cloudy/amber)',
            'Harvest tools sanitized',
            'Drying space prepared',
            'Initial weight tracking ready'
          ],
          actions: [
            'Transition to harvest stage',
            'Record wet weight in yieldData',
            'Update plant count (mark as harvested)',
            'Assign to drying pod',
            'Create waste record for plant material'
          ],
          nextStage: 'drying'
        },
        {
          id: 'drying',
          name: 'Drying',
          description: 'Controlled environment drying',
          icon: Wind,
          stage: 'drying',
          requirements: [
            'Temperature: 60-70°F',
            'Humidity: 55-65%',
            'Dark environment',
            'Good air circulation',
            'Minimum 7-14 days'
          ],
          actions: [
            'Open DryingCuringTracking component',
            'Record daily environmental conditions',
            'Monitor moisture content',
            'Track weight loss percentage',
            'Complete drying when stems snap'
          ],
          nextStage: 'curing'
        },
        {
          id: 'curing',
          name: 'Curing',
          description: 'Develop flavor and smooth smoke',
          icon: Thermometer,
          stage: 'curing',
          requirements: [
            'Drying complete (moisture 10-12%)',
            'Airtight containers',
            'Humidity packs (62% RH)',
            'Minimum 2-4 weeks'
          ],
          actions: [
            'Transition to curing stage',
            'Continue tracking with DryingCuringTracking',
            'Record dry weight in yieldData',
            'Monitor jar humidity',
            'Burp containers daily (first week)'
          ],
          nextStage: 'testing'
        },
        {
          id: 'testing',
          name: 'Laboratory Testing',
          description: 'Compliance and quality testing',
          icon: FlaskConical,
          stage: 'testing',
          requirements: [
            'Curing complete',
            'Sample prepared for lab',
            'Lab scheduled/confirmed',
            'METRC sample tags ready'
          ],
          actions: [
            'Open CannabisTestingIntegration component',
            'Submit for potency testing (THC/CBD)',
            'Submit for microbial testing',
            'Submit for pesticide testing',
            'Record all test results',
            'Verify all required tests passed'
          ],
          nextStage: 'packaging'
        },
        {
          id: 'packaging',
          name: 'Packaging',
          description: 'Final packaging and labeling',
          icon: Package,
          stage: 'packaging',
          requirements: [
            'All testing passed',
            'METRC package tags available',
            'Packaging materials ready',
            'Labels printed with test results'
          ],
          actions: [
            'Open MetrcTagManagement component',
            'Assign METRC package tags',
            'Record final packaged weight',
            'Update grade breakdown (A, B, trim, shake)',
            'Generate compliance labels'
          ]
        }
      ]
    },
    {
      id: 'package-to-sale',
      name: 'Flow 3: Package to Sale',
      description: 'Package → Transfer → Distribution',
      steps: [
        {
          id: 'package-ready',
          name: 'Package Ready',
          description: 'Verify package ready for transfer',
          icon: Package,
          stage: 'packaging',
          requirements: [
            'METRC package tag assigned',
            'All testing passed and documented',
            'Proper labeling complete',
            'Inventory recorded in METRC'
          ],
          actions: [
            'Verify METRC package status',
            'Review test results (COA)',
            'Confirm compliance with state regulations',
            'Prepare for transfer/sale'
          ],
          nextStage: 'closed'
        },
        {
          id: 'transfer',
          name: 'Transfer Location',
          description: 'Move to storage or distribution',
          icon: Truck,
          stage: 'packaging',
          requirements: [
            'Destination location identified',
            'Transfer manifest prepared',
            'Vehicle and driver designated',
            'METRC transfer created'
          ],
          actions: [
            'Open LocationTransfer component',
            'Select destination (storage/distribution)',
            'Record transfer date and personnel',
            'Update METRC with transfer details',
            'Create transfer manifest'
          ]
        },
        {
          id: 'sale-closure',
          name: 'Sale & Closure',
          description: 'Complete sale and close batch',
          icon: CheckCircle2,
          stage: 'closed',
          requirements: [
            'Sale transaction recorded',
            'METRC updated with sale',
            'Payment processed',
            'Inventory reconciled'
          ],
          actions: [
            'Record final sale in METRC',
            'Close batch (set status to closed)',
            'Archive all documentation',
            'Update inventory levels',
            'Generate final batch report'
          ]
        }
      ]
    },
    {
      id: 'waste-disposal',
      name: 'Flow 4: Waste Disposal',
      description: 'Compliant waste tracking and disposal',
      steps: [
        {
          id: 'waste-identification',
          name: 'Identify Waste',
          description: 'Categorize and quantify waste',
          icon: Trash2,
          stage: 'any',
          requirements: [
            'Waste type identified',
            'Waste source documented',
            'Reason for waste determined',
            'Weight measured'
          ],
          actions: [
            'Open WasteTracking component',
            'Select waste type (plant/harvest/product)',
            'Record weight and unit',
            'Document reason for waste',
            'Link to source batch (if applicable)'
          ]
        },
        {
          id: 'waste-approval',
          name: 'Approval & Witness',
          description: 'Get required approvals',
          icon: CheckCircle2,
          stage: 'any',
          requirements: [
            'Supervisor notified',
            'Witness identified (if >100g)',
            'Disposal method selected',
            'METRC waste ID ready'
          ],
          actions: [
            'Record disposed by (employee)',
            'Record approved by (supervisor)',
            'Record witnessed by (if required)',
            'Select disposal method',
            'Capture photo evidence'
          ]
        },
        {
          id: 'waste-disposal',
          name: 'Execute Disposal',
          description: 'Dispose of waste with documentation',
          icon: Trash2,
          stage: 'any',
          requirements: [
            'Approvals obtained',
            'Disposal area prepared',
            'Camera ready for documentation',
            'Waste rendering materials ready'
          ],
          actions: [
            'Record METRC waste ID',
            'Execute disposal (grinding, mixing)',
            'Capture before/during/after photos',
            'Complete waste record',
            'Update METRC with disposal completion'
          ]
        }
      ]
    },
    {
      id: 'quality-quarantine',
      name: 'Flow 5: Quality Testing & Quarantine',
      description: 'Quality control and quarantine management',
      steps: [
        {
          id: 'quality-issue',
          name: 'Quality Issue Detection',
          description: 'Identify quality or compliance issue',
          icon: AlertOctagon,
          stage: 'any',
          requirements: [
            'Issue documented',
            'Severity assessed',
            'Impact evaluated',
            'Decision to quarantine made'
          ],
          actions: [
            'Open QuarantineManagement component',
            'Select quarantine reason',
            'Record date and personnel',
            'Get supervisor approval',
            'Add investigation notes'
          ]
        },
        {
          id: 'investigation',
          name: 'Investigation & Testing',
          description: 'Root cause analysis and testing',
          icon: FlaskConical,
          stage: 'any',
          requirements: [
            'Batch physically isolated',
            'Investigation plan created',
            'Testing scheduled (if needed)',
            'METRC status updated'
          ],
          actions: [
            'Document investigation findings',
            'Submit for additional testing',
            'Identify root cause',
            'Develop corrective action plan',
            'Review with quality team'
          ]
        },
        {
          id: 'resolution',
          name: 'Resolution & Release',
          description: 'Resolve issues and release from quarantine',
          icon: CheckCircle2,
          stage: 'any',
          requirements: [
            'Issue resolved',
            'Test results passed (if applicable)',
            'Corrective actions completed',
            'Supervisor approval for release'
          ],
          actions: [
            'Open QuarantineManagement (release mode)',
            'Document test results',
            'Record corrective actions taken',
            'Get supervisor approval',
            'Release from quarantine',
            'Update METRC status'
          ]
        }
      ]
    }
  ];

  const currentFlow = flows[activeFlow];
  const currentStepData = currentFlow?.steps[currentStep];
  const progress = currentFlow ? ((currentStep + 1) / currentFlow.steps.length) * 100 : 0;

  const handleCompleteStep = () => {
    if (!currentStepData) return;
    setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    if (currentFlow && currentStep < currentFlow.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  const StepIcon = currentStepData?.icon || CheckCircle2;

  if (!currentFlow || !currentStepData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Flow Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Cannabis Complete Workflows</CardTitle>
          <CardDescription>
            Interactive demonstration of all 5 cannabis workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {flows.map((flow, index) => (
              <Button
                key={flow.id}
                variant={activeFlow === index ? 'default' : 'outline'}
                className="h-auto py-3 px-4 justify-start"
                onClick={() => {
                  setActiveFlow(index);
                  setCurrentStep(0);
                  setCompletedSteps(new Set());
                }}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">{flow.name}</div>
                  <div className="text-xs opacity-90">{flow.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Flow Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{currentFlow.name}</CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {currentFlow.steps.length}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-4" />
          
          {/* Step Navigation */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {currentFlow.steps.map((step, index) => (
              <Button
                key={step.id}
                variant={currentStep === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentStep(index)}
                className="min-w-fit"
              >
                {completedSteps.has(step.id) && (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                {index + 1}. {step.name}
              </Button>
            ))}
          </div>

          {/* Current Step Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <StepIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{currentStepData.name}</h3>
                <p className="text-muted-foreground mb-3">{currentStepData.description}</p>
                <Badge variant="outline">Stage: {currentStepData.stage}</Badge>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="font-medium mb-2">Requirements:</h4>
              <ul className="space-y-1">
                {currentStepData.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div>
              <h4 className="font-medium mb-2">Actions to Complete:</h4>
              <ol className="space-y-1 list-decimal list-inside">
                {currentStepData.actions.map((action, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    {action}
                  </li>
                ))}
              </ol>
            </div>

            {/* Next Step Info */}
            {currentStepData.nextStage && (
              <Alert>
                <Play className="h-4 w-4" />
                <AlertDescription>
                  Next: Transition to <strong>{currentStepData.nextStage}</strong> stage
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCompleteStep}
                disabled={completedSteps.has(currentStepData.id)}
                className="flex-1"
              >
                {completedSteps.has(currentStepData.id) ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Mark Complete & Continue
                  </>
                )}
              </Button>
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Summary */}
      {currentStep === currentFlow.steps.length - 1 && completedSteps.has(currentStepData.id) && (
        <Alert className="border-green-600 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Workflow Complete!</strong> You have successfully completed all steps in the {currentFlow.name} workflow.
            Select another workflow to continue exploring cannabis operations.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
