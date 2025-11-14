'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Task, SOPTemplate, SOPStep, TaskEvidence, ConditionalLogic } from '@/types/workflow';
import { X, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
import { EvidenceCapture } from './evidence-capture';
import { compressEvidence } from '@/lib/utils/evidence-compression';

interface TaskExecutorProps {
  task: Task;
  template: SOPTemplate;
  onClose: () => void;
  onComplete: (evidence: TaskEvidence[]) => Promise<void>;
  onSaveDraft?: (evidence: TaskEvidence[], currentStepIndex: number) => Promise<void>;
}

export function TaskExecutor({ 
  task, 
  template, 
  onClose, 
  onComplete,
  onSaveDraft 
}: TaskExecutorProps) {
  // Ensure currentStepIndex is within valid bounds
  const initialStepIndex = Math.min(
    Math.max(0, task.current_step_index || 0),
    template.steps.length - 1
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [evidence, setEvidence] = useState<TaskEvidence[]>(task.evidence || []);
  const [isOffline, setIsOffline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const currentStep = template.steps[currentStepIndex];
  const progress = Math.round(((currentStepIndex + 1) / template.steps.length) * 100);
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

  const handleEvidenceCapture = async (value: any) => {
    // Create new evidence entry
    const newEvidence: TaskEvidence = {
      stepId: currentStep.id,
      type: currentStep.evidenceType!,
      value,
      timestamp: new Date().toISOString(),
      compressed: false,
    };

    // Attempt to compress evidence if it's large (photo, signature)
    try {
      if (currentStep.evidenceType === 'photo') {
        const compressionResult = await compressEvidence(value, 'photo');
        if (compressionResult.success && compressionResult.data) {
          // Convert Blob to base64 string if needed
          if (compressionResult.data instanceof Blob) {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(compressionResult.data as Blob);
            });
            newEvidence.value = base64;
          } else {
            newEvidence.value = compressionResult.data;
          }
          newEvidence.compressed = true;
          newEvidence.compressionType = compressionResult.compressionType;
          newEvidence.originalSize = compressionResult.originalSize;
          newEvidence.compressedSize = compressionResult.compressedSize;
        }
      } else if (currentStep.evidenceType === 'signature' || currentStep.evidenceType === 'dual_signature') {
        const compressionResult = await compressEvidence(value, 'signature');
        if (compressionResult.success && compressionResult.data) {
          // Convert Blob to base64 string if needed
          if (compressionResult.data instanceof Blob) {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(compressionResult.data as Blob);
            });
            newEvidence.value = base64;
          } else {
            newEvidence.value = compressionResult.data;
          }
          newEvidence.compressed = true;
          newEvidence.compressionType = compressionResult.compressionType;
          newEvidence.originalSize = compressionResult.originalSize;
          newEvidence.compressedSize = compressionResult.compressedSize;
        }
      }
    } catch (error) {
      console.error('Error compressing evidence:', error);
      // Continue without compression
    }

    // Update evidence array (replace if exists for this step)
    const updatedEvidence = [
      ...evidence.filter(e => e.stepId !== currentStep.id), 
      newEvidence
    ];
    setEvidence(updatedEvidence);

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
      // Don't auto-complete, let user click Complete button
      return;
    }
    setCurrentStepIndex(prev => Math.min(prev + 1, template.steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    
    setIsSaving(true);
    try {
      await onSaveDraft(evidence, currentStepIndex);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    // Validate all required evidence is collected
    const missingEvidence = template.steps
      .filter(step => step.evidenceRequired)
      .filter(step => !evidence.some(e => e.stepId === step.id));

    if (missingEvidence.length > 0) {
      alert(`Please complete all required evidence. Missing: ${missingEvidence.map(s => s.title).join(', ')}`);
      return;
    }

    // Simulate offline sync
    if (isOffline) {
      alert('Task will sync when connection is restored');
    }

    setIsCompleting(true);
    try {
      await onComplete(evidence);
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Please try again.');
      setIsCompleting(false);
    }
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

  if (!currentStep) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-600">No steps found in template</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl my-8">
        {/* Header */}
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{template.name}</h2>
              <p className="text-sm text-slate-600">Task ID: {task.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {isOffline && (
                <Badge variant="destructive">Offline Mode</Badge>
              )}
              {onSaveDraft && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
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
              <h3 className="text-xl font-semibold text-slate-900">{currentStep.title}</h3>
              <div className="flex items-center gap-2">
                {currentStep.isConditional && (
                  <Badge variant="secondary">Conditional Step</Badge>
                )}
                {currentStep.isHighRisk && (
                  <Badge variant="destructive">High Risk</Badge>
                )}
              </div>
            </div>
            <p className="text-slate-600">{currentStep.description}</p>
            {currentStep.instructions && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">Instructions:</p>
                <p className="text-sm text-blue-800 mt-1">{currentStep.instructions}</p>
              </div>
            )}
            {currentStep.safetyNotes && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900 font-medium">⚠️ Safety Notes:</p>
                <p className="text-sm text-amber-800 mt-1">{currentStep.safetyNotes}</p>
              </div>
            )}
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
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">Conditional Workflow</span>
                </div>
                <p className="text-sm text-amber-700">The next step may vary based on your response</p>
                <div className="mt-3 space-y-2">
                  {currentStep.conditionalLogic.map((logic, idx) => {
                    const nextStep = template.steps.find(s => s.id === logic.nextStepId);
                    return (
                      <div key={idx} className="text-sm text-amber-900 bg-white p-2 rounded">
                        If response {logic.condition.replace('_', ' ')} "{logic.value}" → Jump to "{nextStep?.title}"
                      </div>
                    );
                  })}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Step History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completed Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.steps.slice(0, currentStepIndex).map((step, idx) => {
                  const stepEvidence = evidence.find(e => e.stepId === step.id);
                  return (
                    <div key={step.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
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
                  <p className="text-sm text-slate-500 text-center py-4">No steps completed yet</p>
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

          <div className="text-sm text-slate-600">
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
              disabled={(currentStep.evidenceRequired && !hasEvidence) || isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isCompleting ? 'Completing...' : 'Complete Task'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
