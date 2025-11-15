'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Task, SOPTemplate, SOPStep, TaskEvidence } from '@/types/workflow';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';
import { DualSignatureCapture } from './dual-signature-capture';
import { X, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Save, GitBranch, SkipForward, RefreshCw } from 'lucide-react';
import type { RoleKey } from '@/lib/rbac/types';
import { usePermissions } from '@/hooks/use-permissions';
import { EvidenceCapture } from './evidence-capture';
import { compressEvidence } from '@/lib/utils/evidence-compression';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface TaskExecutorProps {
  task: Task;
  template: SOPTemplate;
  onClose: () => void;
  onComplete: (evidence: TaskEvidence[]) => Promise<void>;
  onSaveDraft?: (evidence: TaskEvidence[], currentStepIndex: number) => Promise<void>;
  userRole?: RoleKey | null;
  additionalPermissions?: string[];
}

export function TaskExecutor({ 
  task, 
  template, 
  onClose, 
  onComplete,
  onSaveDraft,
  userRole,
  additionalPermissions = [],
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
  const [blockingInfo, setBlockingInfo] = useState<{ blocked: boolean; incomplete: { id: string; title: string; status: string }[] } | null>(null);
  const [stepTrail, setStepTrail] = useState<Array<{ stepId: string; fromStepId?: string }>>([]);
  interface CapturedDualSignature {
    signature1?: { userId: string; userName: string; role: string; signature: string; timestamp: Date };
    signature2?: { userId: string; userName: string; role: string; signature: string; timestamp: Date };
  }
  const [completionDualSignature, setCompletionDualSignature] = useState<CapturedDualSignature | null>(null);
  const [showDualSignoffPanel, setShowDualSignoffPanel] = useState(false);
  // Track skipped steps separately (reason map) instead of overloading TaskEvidence type
  const [skippedSteps, setSkippedSteps] = useState<Record<string, string>>({});
  const [retainOriginalEvidence, setRetainOriginalEvidence] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [skipReasonDraft, setSkipReasonDraft] = useState('');
  const [pendingSkipStep, setPendingSkipStep] = useState<SOPStep | null>(null);
  const [refreshingBlocking, setRefreshingBlocking] = useState(false);
  const { can } = usePermissions(userRole ?? null, additionalPermissions);
  const canRetainOriginalEvidence = can('task:retain_original_evidence');
  const { toast } = useToast();
  const draftStorageKey = useMemo(() => `task-exec-draft-${task.id}`, [task.id]);
  const clearDraft = () => {
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {
      // ignore storage errors
    }
  };
  
  // Offline draft persistence (localStorage)
  useEffect(() => {
    // Load draft if exists
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.evidence)) {
          setEvidence(prev => {
            // Merge without duplicating by stepId (prefer loaded)
            const map = new Map<string, TaskEvidence>();
            prev.forEach(e => map.set(e.stepId, e));
            parsed.evidence.forEach((e: TaskEvidence) => map.set(e.stepId, e));
            return Array.from(map.values());
          });
        }
        if (typeof parsed.currentStepIndex === 'number') {
          setCurrentStepIndex(Math.min(Math.max(0, parsed.currentStepIndex), template.steps.length - 1));
        }
        if (typeof parsed.retainOriginalEvidence === 'boolean') {
          setRetainOriginalEvidence(parsed.retainOriginalEvidence);
        }
      }
    } catch {
      // ignore
    }
  }, [task.id, template.steps.length]);

  useEffect(() => {
    // Persist draft whenever evidence or step changes (throttled by timeout)
    const to = setTimeout(() => {
      try {
        const payload = JSON.stringify({ evidence, currentStepIndex, retainOriginalEvidence });
        localStorage.setItem(draftStorageKey, payload);
      } catch {
        // ignore
      }
    }, 400);
    return () => clearTimeout(to);
  }, [draftStorageKey, evidence, currentStepIndex, retainOriginalEvidence]);
  // Compression summary derived data
  const compressionSummary = (() => {
    const compressedItems = evidence.filter(e => e.compressed && typeof e.originalSize === 'number' && typeof e.compressedSize === 'number');
    if (!compressedItems.length) return null;
    const originalTotal = compressedItems.reduce((sum, e) => sum + (e.originalSize || 0), 0);
    const compressedTotal = compressedItems.reduce((sum, e) => sum + (e.compressedSize || 0), 0);
    const ratio = originalTotal > 0 ? (compressedTotal / originalTotal) : 1;
    return { count: compressedItems.length, originalTotal, compressedTotal, ratio };
  })();

  useEffect(() => {
    if (!canRetainOriginalEvidence && retainOriginalEvidence) {
      setRetainOriginalEvidence(false);
    }
  }, [canRetainOriginalEvidence, retainOriginalEvidence]);

  const currentStep = template.steps[currentStepIndex];
  const progress = Math.round(((currentStepIndex + 1) / template.steps.length) * 100);
  const isLastStep = currentStepIndex === template.steps.length - 1;
  const hasEvidence = currentStep ? evidence.some(e => e.stepId === currentStep.id) : false;
  const needsDualSignoffCompletion = template.requires_dual_signoff && !completionDualSignature; // Permission checks omitted

  // Derive dual sign-off roles (simple heuristic)
  const deriveDualConfig = (): { role1: string; role2: string; description: string; requiredRoles: string[] } => {
    const role1 = template.approval_role || (template.required_role?.[0] || 'site_manager');
    const role2 = (template.required_role?.[1] && template.required_role[1] !== role1) ? template.required_role[1] : 'compliance_qa';
    return {
      role1,
      role2,
      description: 'Final task completion requires dual authorization for compliance integrity.',
      requiredRoles: [role1, role2]
    };
  };

  // Check for conditional logic
  const evaluateConditionalLogic = (step: SOPStep, evidenceValue: string | number | boolean): string | null => {
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
          conditionMet = parseFloat(String(evidenceValue)) > parseFloat(logic.value.toString());
          break;
        case 'less_than':
          conditionMet = parseFloat(String(evidenceValue)) < parseFloat(logic.value.toString());
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

  const handleEvidenceCapture = async (value: unknown) => {
    let normalizedValue: string | number | boolean;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      normalizedValue = value;
    } else if (Array.isArray(value)) {
      normalizedValue = JSON.stringify(value);
    } else if (value && typeof value === 'object') {
      normalizedValue = 'object';
    } else {
      normalizedValue = String(value);
    }
    // Create new evidence entry
    const newEvidence: TaskEvidence = {
      stepId: currentStep.id,
      type: currentStep.evidenceType!,
      value: normalizedValue,
      timestamp: new Date().toISOString(),
      compressed: false,
    };

    const stepEvidenceType = currentStep.evidenceType || '';
    const supportsCompression = stepEvidenceType === 'photo' || stepEvidenceType === 'signature' || stepEvidenceType === 'dual_signature';
    const shouldAttemptCompression = supportsCompression && (!retainOriginalEvidence || !canRetainOriginalEvidence);

    if (supportsCompression && !shouldAttemptCompression) {
      newEvidence.compressionType = 'none';
    }

    if (shouldAttemptCompression) {
      try {
        if (stepEvidenceType === 'photo') {
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
        } else if (stepEvidenceType === 'signature' || stepEvidenceType === 'dual_signature') {
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
    }

    // Update evidence array (replace if exists for this step)
    const updatedEvidence = [
      ...evidence.filter(e => e.stepId !== currentStep.id), 
      newEvidence
    ];
    setEvidence(updatedEvidence);

    // Check for conditional branching
    if (currentStep.isConditional && currentStep.conditionalLogic && (typeof normalizedValue === 'string' || typeof normalizedValue === 'number' || typeof normalizedValue === 'boolean')) {
      const nextStepId = evaluateConditionalLogic(currentStep, normalizedValue);
      if (nextStepId) {
        const nextIndex = template.steps.findIndex(s => s.id === nextStepId);
        if (nextIndex !== -1) {
          setStepTrail(prev => [...prev, { stepId: nextStepId, fromStepId: currentStep.id }]);
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
    const nextIndex = Math.min(currentStepIndex + 1, template.steps.length - 1);
    if (nextIndex !== currentStepIndex) {
      setStepTrail(prev => [...prev, { stepId: template.steps[nextIndex].id, fromStepId: template.steps[currentStepIndex].id }]);
    }
    setCurrentStepIndex(nextIndex);
  };

  const handlePrevious = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };

  const closeSkipDialog = () => {
    setSkipDialogOpen(false);
    setSkipReasonDraft('');
    setPendingSkipStep(null);
  };

  // Skip current step with reason (stores synthetic evidence record for audit)
  const handleSkipStep = () => {
    if (!currentStep) return;
    setPendingSkipStep(currentStep);
    setSkipReasonDraft('');
    setSkipDialogOpen(true);
  };

  const confirmSkipStep = () => {
    if (!pendingSkipStep) return;
    if (!skipReasonDraft.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please describe why this step is being skipped.',
        variant: 'destructive',
      });
      return;
    }

    setSkippedSteps((prev) => ({
      ...prev,
      [pendingSkipStep.id]: skipReasonDraft.trim(),
    }));

    toast({
      title: 'Step skipped',
      description: `${pendingSkipStep.title} marked as skipped.`,
    });

    closeSkipDialog();
    handleNext();
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    
    setIsSaving(true);
    try {
      await onSaveDraft(evidence, currentStepIndex);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlockingRefresh = async () => {
    setRefreshingBlocking(true);
    const snapshot = await fetchBlockingSnapshot();
    if (snapshot) {
      setBlockingInfo(snapshot);
      toast({
        title: snapshot.blocked ? 'Prerequisites still pending' : 'Task unblocked',
        description: snapshot.blocked
          ? 'Complete the listed prerequisites to continue.'
          : 'All blocking tasks are complete. You can resume this task.',
        variant: snapshot.blocked ? 'default' : 'success',
      });
    }
    setRefreshingBlocking(false);
  };

  const handleComplete = async () => {
    // Validate all required evidence is collected
    const missingEvidence = template.steps
      .filter(step => step.evidenceRequired)
      .filter(step => !evidence.some(e => e.stepId === step.id));

    if (missingEvidence.length > 0) {
      toast({
        title: 'Evidence required',
        description: `Missing: ${missingEvidence.map(s => s.title).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Simulate offline sync
    if (isOffline) {
      toast({
        title: 'Offline mode',
        description: 'Task will sync when connection is restored.',
      });
    }

    // If template-level dual signoff required and not yet captured, open panel instead of completing
    if (needsDualSignoffCompletion) {
      setShowDualSignoffPanel(true);
      return;
    }

    setIsCompleting(true);
    try {
      await onComplete(evidence);
      clearDraft();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Completion failed',
        description: 'Failed to complete task. Please try again.',
        variant: 'destructive',
      });
      setIsCompleting(false);
    }
  };

  // After dual signatures captured, proceed to completion
  const finalizeWithDualSignoff = async () => {
    if (!completionDualSignature) return;
    // Basic role validation: ensure distinct roles unless override permission
    const sig1Role = (completionDualSignature as { signature1?: { role?: string } })?.signature1?.role;
    const sig2Role = (completionDualSignature as { signature2?: { role?: string } })?.signature2?.role;
    const rolesDistinct = sig1Role && sig2Role && sig1Role !== sig2Role;
    if (!rolesDistinct) {
      toast({
        title: 'Dual sign-off blocked',
        description: 'Dual sign-off requires two distinct authorized roles.',
        variant: 'destructive',
      });
      return;
    }
    setIsCompleting(true);
    try {
      // Append dual signature evidence item
      const sig = completionDualSignature as {
        signature1?: { userId?: string; userName?: string; role?: string; signature?: string; timestamp?: Date | string };
        signature2?: { userId?: string; userName?: string; role?: string; signature?: string; timestamp?: Date | string };
      };
      const dualEvidence: TaskEvidence = {
        stepId: 'task-final-dual-signoff',
        type: 'dual_signature',
        value: 'dual_signatures_captured',
        timestamp: new Date().toISOString(),
        compressed: false,
        dualSignatures: {
          signature1: {
            userId: sig.signature1?.userId || '',
            userName: sig.signature1?.userName || '',
            role: sig.signature1?.role || '',
            signature: sig.signature1?.signature || '',
            timestamp: sig.signature1?.timestamp instanceof Date ? sig.signature1.timestamp.toISOString() : (sig.signature1?.timestamp || new Date().toISOString())
          },
          signature2: {
            userId: sig.signature2?.userId || '',
            userName: sig.signature2?.userName || '',
            role: sig.signature2?.role || '',
            signature: sig.signature2?.signature || '',
            timestamp: sig.signature2?.timestamp instanceof Date ? sig.signature2.timestamp.toISOString() : (sig.signature2?.timestamp || new Date().toISOString())
          }
        }
      };
      const updated = [...evidence, dualEvidence];
      await onComplete(updated);
      clearDraft();
    } catch (err) {
      console.error('Dual signoff completion error:', err);
      toast({
        title: 'Completion failed',
        description: 'Failed during dual sign-off completion.',
        variant: 'destructive',
      });
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

  const fetchBlockingSnapshot = useCallback(async () => {
    try {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id,title,status)')
        .eq('task_id', task.id)
        .eq('dependency_type', 'blocking');
      if (error) throw error;
      const incomplete = ((data || []) as Array<{ depends_on: { id: string; title: string; status: string } }>)
        .filter((entry) => entry.depends_on.status !== 'done' && entry.depends_on.status !== 'approved')
        .map((entry) => ({
          id: entry.depends_on.id,
          title: entry.depends_on.title,
          status: entry.depends_on.status,
        }));
      return { blocked: incomplete.length > 0, incomplete };
    } catch (err) {
      console.error('Error fetching blocking prerequisites:', err);
      return null;
    }
  }, [task.id]);

  // Fetch blocking prerequisite status on mount and poll periodically
  useEffect(() => {
    let active = true;
    const run = async () => {
      const snapshot = await fetchBlockingSnapshot();
      if (active && snapshot) {
        setBlockingInfo(snapshot);
      }
    };
    run();
    const interval = setInterval(run, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchBlockingSnapshot]);

  // Initialize trail with first step
  useEffect(() => {
    setStepTrail([{ stepId: template.steps[initialStepIndex].id }]);
  }, [template.steps, initialStepIndex]);

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
    <>
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

          {canRetainOriginalEvidence && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mr-4">
                <Label htmlFor="retain-original-evidence" className="text-sm font-medium text-slate-900">
                  Retain original evidence files
                </Label>
                <p className="text-xs text-slate-600 mt-1">
                  Skip automatic compression when capturing photos or signatures for this task.
                </p>
              </div>
              <Switch
                id="retain-original-evidence"
                checked={retainOriginalEvidence}
                onCheckedChange={(checked) => setRetainOriginalEvidence(Boolean(checked))}
                aria-label="Retain original evidence toggle"
              />
            </div>
          )}
        </div>

        {/* Current Step */}
        <div className="p-6 space-y-6">
          {/* Blocking prerequisites banner */}
          {blockingInfo?.blocked && task.status === 'blocked' && (
            <Alert className="border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-1" />
                <AlertDescription className="text-red-900 flex-1">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">Task blocked by prerequisites</p>
                      <p className="text-sm text-red-800">
                        Complete the following tasks to continue execution.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleBlockingRefresh}
                      disabled={refreshingBlocking}
                    >
                      <RefreshCw
                        className={`mr-1 h-3 w-3 ${refreshingBlocking ? 'animate-spin' : ''}`}
                      />
                      {refreshingBlocking ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                  <ul className="mt-3 text-sm list-disc ml-5 space-y-1">
                    {blockingInfo.incomplete.map((pr) => (
                      <li key={pr.id}>
                        {pr.title}{' '}
                        <Badge variant="outline" className="ml-1">
                          {pr.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </div>
            </Alert>
          )}

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

          {/* Compression Summary (shows cumulative compression stats for captured evidence) */}
          {compressionSummary && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-base">Evidence Compression Summary</CardTitle>
                <CardDescription>
                  Optimized {compressionSummary.count} item{compressionSummary.count === 1 ? '' : 's'} · Saved {(compressionSummary.originalTotal - compressionSummary.compressedTotal) > 0 ? ((compressionSummary.originalTotal - compressionSummary.compressedTotal) / 1024).toFixed(2) : '0.00'} KB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Original Size</p>
                    <p className="font-medium">{(compressionSummary.originalTotal / 1024).toFixed(2)} KB</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Compressed Size</p>
                    <p className="font-medium">{(compressionSummary.compressedTotal / 1024).toFixed(2)} KB</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Reduction</p>
                    <p className="font-medium">{(((1 - compressionSummary.ratio) * 100) || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Efficiency Ratio</p>
                    <p className="font-medium">{compressionSummary.ratio.toFixed(2)}</p>
                  </div>
                </div>
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
                        If response {logic.condition.replace('_', ' ')} &quot;{logic.value}&quot; → Jump to &quot;{nextStep?.title}&quot;
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
              <CardTitle className="text-base">Step Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stepTrail.map((trailItem, idx) => {
                  const stepMeta = template.steps.find(s => s.id === trailItem.stepId);
                  if (!stepMeta) return null;
                  const stepEvidence = evidence.find(e => e.stepId === stepMeta.id);
                  const branched = trailItem.fromStepId && trailItem.fromStepId !== template.steps[idx - 1]?.id;
                  const skipped = Boolean(skippedSteps[stepMeta.id]);
                  return (
                    <div
                      key={trailItem.stepId}
                      className="flex items-center gap-2 text-sm px-2 py-1 rounded border bg-white"
                      aria-label={`Trail item ${idx + 1}: ${stepMeta.title}${branched ? ' (branched jump)' : ''}${skipped ? ' (skipped)' : ''}`}
                    >
                      {skipped ? (
                        <SkipForward className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                      )}
                      <span className={skipped ? 'line-through text-slate-500' : ''}>{idx + 1}. {stepMeta.title}</span>
                      {branched && (
                        <Badge variant="secondary" className="ml-1 flex items-center gap-1" aria-label="Branched jump">
                          <GitBranch className="w-3 h-3" /> Jump
                        </Badge>
                      )}
                      {skipped && skippedSteps[stepMeta.id] && (
                        <Badge variant="destructive" className="ml-1" aria-label={`Skipped reason: ${skippedSteps[stepMeta.id]}`}>Skipped</Badge>
                      )}
                      {stepEvidence && !skipped && (
                        <Badge variant="outline" className="ml-auto" aria-label={`Evidence type ${stepEvidence.type}`}>{stepEvidence.type}</Badge>
                      )}
                    </div>
                  );
                })}
                {stepTrail.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Trail initializing...</p>
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

          {/* Skip Step (allowed only if evidence not required OR already provided) */}
          {!isLastStep && (!currentStep.evidenceRequired || hasEvidence) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipStep}
              className="ml-2"
            >
              Skip Step
            </Button>
          )}

          {isLastStep && !showDualSignoffPanel && (
            <Button
              onClick={handleComplete}
              disabled={(currentStep.evidenceRequired && !hasEvidence) || isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {needsDualSignoffCompletion ? 'Begin Dual Sign-off' : (isCompleting ? 'Completing...' : 'Complete Task')}
            </Button>
          )}
        </div>
      </div>
    </div>

    {/* Skip Step Reason Dialog */}
    <Dialog
      open={skipDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeSkipDialog();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skip Step</DialogTitle>
          <DialogDescription>
            Provide a short explanation so the audit trail captures why this step is being skipped.
            {pendingSkipStep && (
              <span className="mt-1 block text-xs text-muted-foreground">
                Current step: {pendingSkipStep.title}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="skip-reason">Reason</Label>
          <Textarea
            id="skip-reason"
            value={skipReasonDraft}
            onChange={(event) => setSkipReasonDraft(event.target.value)}
            placeholder="Explain why this step is not applicable right now..."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeSkipDialog}>
            Cancel
          </Button>
          <Button onClick={confirmSkipStep}>Save &amp; Skip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Template-level Dual Sign-off Modal */}
    {showDualSignoffPanel && template.requires_dual_signoff && (
      <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Final Dual Authorization</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowDualSignoffPanel(false)} disabled={isCompleting}>Cancel</Button>
          </div>
          <p className="text-sm text-slate-600">This task requires dual authorization before completion.</p>
          <DualSignatureCapture
            config={deriveDualConfig()}
            existingValue={completionDualSignature}
            onCapture={(sig) => setCompletionDualSignature(sig)}
          />
          {completionDualSignature && (
            <div className="text-xs text-slate-600 border border-slate-200 rounded p-2" aria-label="Dual signoff role validation">
              <p>Primary Role: {(completionDualSignature as { signature1?: { role?: string } })?.signature1?.role || '—'} | Secondary Role: {(completionDualSignature as { signature2?: { role?: string } })?.signature2?.role || '—'}</p>
              {(completionDualSignature as { signature1?: { role?: string }; signature2?: { role?: string } })?.signature1?.role === (completionDualSignature as { signature1?: { role?: string }; signature2?: { role?: string } })?.signature2?.role && (
                <p className="text-amber-600 mt-1">Roles identical – cannot proceed.</p>
              )}
              {(completionDualSignature as { signature1?: { role?: string }; signature2?: { role?: string } })?.signature1?.role && (completionDualSignature as { signature1?: { role?: string }; signature2?: { role?: string } })?.signature2?.role && (completionDualSignature as { signature1?: { role?: string }; signature2?: { role?: string } })?.signature1?.role !== (completionDualSignature as { signature1?: { role?: string }; signature2?: { role?: string } })?.signature2?.role && (
                <p className="text-green-600 mt-1">Distinct roles captured.</p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDualSignoffPanel(false)}
              disabled={isCompleting}
            >Back</Button>
            <Button
              onClick={finalizeWithDualSignoff}
              disabled={!completionDualSignature || isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? 'Finalizing...' : 'Complete with Dual Sign-off'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
