import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Task, SOPStep } from '../../lib/types';
import { mockTemplates } from '../../lib/mockData';
import { X, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { EvidenceCapture } from '../evidence/EvidenceCapture';

interface TaskExecutorProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
}

export function TaskExecutor({ task, onClose, onComplete }: TaskExecutorProps) {
  const template = mockTemplates.find(t => t.id === task.templateId);
  
  if (!template) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-600">Template not found</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </CardContent>
      </Card>
    );
  }

  // Ensure currentStepIndex is within valid bounds
  const initialStepIndex = Math.min(
    Math.max(0, task.currentStepIndex),
    template.steps.length - 1
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [evidence, setEvidence] = useState(task.evidence);
  const [isOffline, setIsOffline] = useState(false);

  const currentStep = template.steps[currentStepIndex];
  const progress = Math.round((currentStepIndex / template.steps.length) * 100);
  const isLastStep = currentStepIndex === template.steps.length - 1;
  const hasEvidence = currentStep ? evidence.some(e => e.stepId === currentStep.id) : false;

  // Check for conditional logic
  const evaluateConditionalLogic = (step: SOPStep, evidenceValue: any): string | null => {
    if (!step.conditionalLogic || !step.isConditional) return null;

    for (const logic of step.conditionalLogic) {
      let conditionMet = false;

      switch (logic.condition) {
        case 'equals':
          conditionMet = evidenceValue === logic.value;
          break;
        case 'not_equals':
          conditionMet = evidenceValue !== logic.value;
          break;
        case 'greater_than':
          conditionMet = parseFloat(evidenceValue) > parseFloat(logic.value.toString());
          break;
        case 'less_than':
          conditionMet = parseFloat(evidenceValue) < parseFloat(logic.value.toString());
          break;
        case 'contains':
          conditionMet = evidenceValue.toString().toLowerCase().includes(logic.value.toString().toLowerCase());
          break;
      }

      if (conditionMet) {
        return logic.nextStepId;
      }
    }

    return null;
  };

  const handleEvidenceCapture = (value: any) => {
    const newEvidence = {
      stepId: currentStep.id,
      type: currentStep.evidenceType!,
      value,
      timestamp: new Date()
    };

    setEvidence([...evidence.filter(e => e.stepId !== currentStep.id), newEvidence]);

    // Check for conditional branching
    if (currentStep.isConditional && currentStep.conditionalLogic) {
      const nextStepId = evaluateConditionalLogic(currentStep, value);
      
      if (nextStepId) {
        const nextIndex = template.steps.findIndex(s => s.id === nextStepId);
        if (nextIndex !== -1) {
          setTimeout(() => {
            setCurrentStepIndex(nextIndex);
          }, 500);
          return;
        }
      }
    }

    // Auto-advance for non-conditional steps or when condition not met
    if (!currentStep.isConditional) {
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => Math.min(prev + 1, template.steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    // Simulate offline sync
    if (isOffline) {
      alert('Task will sync when connection is restored');
    }
    onComplete();
  };

  // Simulate offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl my-8">
        {/* Header */}
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-slate-900">{task.templateName}</h2>
              <p className="text-slate-600">Task ID: {task.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {isOffline && (
                <Badge variant="destructive">Offline Mode</Badge>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span>Step {currentStepIndex + 1} of {template.steps.length}</span>
              <span>{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Current Step */}
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-slate-900">{currentStep.title}</h3>
              {currentStep.isConditional && (
                <Badge variant="secondary">Conditional Step</Badge>
              )}
            </div>
            <p className="text-slate-600">{currentStep.description}</p>
          </div>

          {/* Evidence Capture */}
          {currentStep.evidenceRequired && currentStep.evidenceType && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence Required</CardTitle>
                <CardDescription>
                  {currentStep.evidenceConfig?.requiredText || 
                   `Capture ${currentStep.evidenceType.replace('_', ' ')} evidence`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EvidenceCapture
                  type={currentStep.evidenceType}
                  config={currentStep.evidenceConfig}
                  onCapture={handleEvidenceCapture}
                  existingValue={evidence.find(e => e.stepId === currentStep.id)?.value}
                />
              </CardContent>
            </Card>
          )}

          {/* Conditional Logic Info */}
          {currentStep.isConditional && currentStep.conditionalLogic && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="w-5 h-5" />
                  Conditional Workflow
                </CardTitle>
                <CardDescription className="text-amber-700">
                  The next step may vary based on your response
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentStep.conditionalLogic.map((logic, idx) => {
                    const nextStep = template.steps.find(s => s.id === logic.nextStepId);
                    return (
                      <div key={idx} className="text-amber-900 bg-white p-2 rounded">
                        If response {logic.condition.replace('_', ' ')} "{logic.value}" → Jump to "{nextStep?.title}"
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step History */}
          <Card>
            <CardHeader>
              <CardTitle>Completed Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.steps.slice(0, currentStepIndex).map((step, idx) => {
                  const stepEvidence = evidence.find(e => e.stepId === step.id);
                  return (
                    <div key={step.id} className="flex items-center gap-2 text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{idx + 1}. {step.title}</span>
                      {stepEvidence && (
                        <Badge variant="outline" className="ml-auto">
                          {stepEvidence.type}
                        </Badge>
                      )}
                    </div>
                  );
                })}
                {currentStepIndex === 0 && (
                  <p className="text-slate-500 text-center py-4">No steps completed yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-slate-200 p-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-slate-600">
            {currentStep.evidenceRequired && !hasEvidence && (
              <span className="text-amber-600">Evidence required to continue</span>
            )}
          </div>

          {!isLastStep && (
            <Button
              onClick={handleNext}
              disabled={currentStep.evidenceRequired && !hasEvidence}
            >
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {isLastStep && (
            <Button
              onClick={handleComplete}
              disabled={currentStep.evidenceRequired && !hasEvidence}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Task
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
