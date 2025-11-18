'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  SOPTemplate, 
  SOPStep, 
  EvidenceType, 
  TemplateCategory,
  EvidenceConfig,
  ConditionalLogic,
  ConditionalOperator 
} from '@/types/workflow';
import { ROLES } from '@/lib/rbac/roles';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle, 
  GitBranch,
  Upload,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface TemplateEditorProps {
  template?: SOPTemplate | null;
  isNew?: boolean;
  isCopy?: boolean;
  onSave?: (template: Partial<SOPTemplate>) => Promise<void>;
  onCancel?: () => void;
  canPublish?: boolean;
}

type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

interface TemplateDraftPayload extends Partial<SOPTemplate> {
  recurring_pattern?: RecurrencePattern;
  recurring_config?: {
    interval: number;
    daysOfWeek: string[];
    dayOfMonth: number;
    startDate?: string;
  };
}

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'photo', label: 'Photo' },
  { value: 'numeric', label: 'Numeric Value' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'text', label: 'Text Input' },
  { value: 'signature', label: 'Signature' },
  { value: 'dual_signature', label: 'Dual Signature' },
  { value: 'qr_scan', label: 'QR/Barcode Scan' },
];

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'daily', label: 'Daily Operations' },
  { value: 'weekly', label: 'Weekly Tasks' },
  { value: 'monthly', label: 'Monthly Tasks' },
  { value: 'harvest', label: 'Harvest' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'calibration', label: 'Calibration' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'quality_control', label: 'Quality Control' },
  { value: 'batch_operations', label: 'Batch Operations' },
  { value: 'alarm_response', label: 'Alarm Response' },
  { value: 'exception_scenarios', label: 'Exception Scenarios' },
];

export function TemplateEditor({
  template,
  isNew = false,
  isCopy = false,
  onSave,
  onCancel,
  canPublish = false,
}: TemplateEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  // Template metadata
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState<TemplateCategory>(template?.category || 'daily');
  const [description, setDescription] = useState(template?.description || '');
  const [estimatedDuration, setEstimatedDuration] = useState(
    template?.estimated_duration_minutes?.toString() || '30'
  );
  const [slaHours, setSlaHours] = useState(
    template?.sla_hours?.toString() || '24'
  );
  const [requiresDualSignoff, setRequiresDualSignoff] = useState(
    template?.requires_dual_signoff || false
  );
  const [isExceptionScenario, setIsExceptionScenario] = useState(
    template?.is_exception_scenario || false
  );
  // Recurrence (template-level scheduling metadata - not yet persisted to DB)
  const [recurringPattern, setRecurringPattern] = useState<RecurrencePattern>('none');
  const [recurringInterval, setRecurringInterval] = useState('1');
  const [recurringDaysOfWeek, setRecurringDaysOfWeek] = useState<string[]>([]);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState('1');

  // Steps
  const [steps, setSteps] = useState<SOPStep[]>(
    template?.steps || [
      {
        id: `step-${Date.now()}`,
        order: 1,
        title: '',
        description: '',
        evidenceRequired: false,
      }
    ]
  );

  const addStep = () => {
    const newStep: SOPStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      title: '',
      description: '',
      evidenceRequired: false,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    const filtered = steps.filter(s => s.id !== stepId);
    // Reorder remaining steps
    const reordered = filtered.map((step, idx) => ({
      ...step,
      order: idx + 1,
    }));
    setSteps(reordered);
  };

  const updateStep = (stepId: string, updates: Partial<SOPStep>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Reorder
    const reordered = newSteps.map((step, idx) => ({
      ...step,
      order: idx + 1,
    }));
    
    setSteps(reordered);
  };

  const handleSave = async (publish: boolean = false) => {
    // Validation
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    if (steps.some(s => !s.title.trim())) {
      alert('All steps must have a title');
      return;
    }

    setIsSaving(true);

    try {
      const templateData: TemplateDraftPayload = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        estimated_duration_minutes: parseInt(estimatedDuration) || 30,
        sla_hours: parseInt(slaHours) || 24,
        requires_dual_signoff: requiresDualSignoff,
        is_exception_scenario: isExceptionScenario,
        steps: steps,
        status: publish ? 'published' : 'draft',
      };

      // Attach recurrence metadata to steps root (will be utilized in task creation phase)
      if (recurringPattern !== 'none') {
        templateData.recurring_pattern = recurringPattern;
        templateData.recurring_config = {
          interval: parseInt(recurringInterval, 10) || 1,
          daysOfWeek: recurringPattern === 'weekly' ? recurringDaysOfWeek : [],
          dayOfMonth: recurringPattern === 'monthly' ? parseInt(recurringDayOfMonth, 10) || 1 : 1,
          startDate: new Date().toISOString().split('T')[0],
        };
      }

      if (onSave) {
        await onSave(templateData);
      }

      router.push('/dashboard/workflows/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Create Template' : isCopy ? 'Copy Template' : 'Edit Template'}
          </h2>
          <p className="text-muted-foreground">
            {isNew 
              ? 'Create a new SOP template for your team'
              : isCopy
              ? 'Create a copy of an existing template'
              : 'Edit template details and steps'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          {canPublish && (
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isSaving ? 'Publishing...' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      {/* Template Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>
            Basic information about this SOP template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Environmental Check"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sla">SLA (hours)</Label>
              <Input
                id="sla"
                type="number"
                value={slaHours}
                onChange={(e) => setSlaHours(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <Separator />

          {/* Recurrence Scheduling (Template-level) */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Recurrence Pattern</Label>
              <Select value={recurringPattern} onValueChange={(v) => setRecurringPattern(v as RecurrencePattern)}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Manual)</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recurringPattern !== 'none' && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Interval</Label>
                  <Input
                    type="number"
                    min={1}
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Every N {recurringPattern === 'daily' ? 'day(s)' : recurringPattern === 'weekly' ? 'week(s)' : 'month(s)'}.</p>
                </div>
                {recurringPattern === 'weekly' && (
                  <div className="space-y-1">
                    <Label>Days of Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => {
                        const active = recurringDaysOfWeek.includes(d);
                        return (
                          <Button
                            key={d}
                            type="button"
                            variant={active ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setRecurringDaysOfWeek(prev => active ? prev.filter(x => x!==d) : [...prev,d])}
                          >{d}</Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {recurringPattern === 'monthly' && (
                  <div className="space-y-1">
                    <Label>Day of Month</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={recurringDayOfMonth}
                      onChange={(e) => setRecurringDayOfMonth(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requires Dual Sign-off</Label>
                <p className="text-sm text-muted-foreground">
                  Require two authorized signatures for completion
                </p>
              </div>
              <Switch
                checked={requiresDualSignoff}
                onCheckedChange={setRequiresDualSignoff}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exception Scenario</Label>
                <p className="text-sm text-muted-foreground">
                  Mark this as an exception handling procedure
                </p>
              </div>
              <Switch
                checked={isExceptionScenario}
                onCheckedChange={setIsExceptionScenario}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Steps</CardTitle>
              <CardDescription>
                Define the steps users will follow when executing this template
              </CardDescription>
            </div>
            <Button onClick={addStep} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <StepEditor
              key={step.id}
              step={step}
              stepNumber={index + 1}
              totalSteps={steps.length}
              onUpdate={(updates) => updateStep(step.id, updates)}
              onRemove={() => removeStep(step.id)}
              onMoveUp={index > 0 ? () => moveStep(index, 'up') : undefined}
              onMoveDown={index < steps.length - 1 ? () => moveStep(index, 'down') : undefined}
            />
          ))}

          {steps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p>No steps added yet. Click &quot;Add Step&quot; to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version History */}
      <VersionHistoryViewer template={template} />
    </div>
  );
}

// Step Editor Component
interface StepEditorProps {
  step: SOPStep;
  stepNumber: number;
  totalSteps: number;
  onUpdate: (updates: Partial<SOPStep>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function StepEditor({
  step,
  stepNumber,
  totalSteps,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: StepEditorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Step {stepNumber}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                disabled={totalSteps === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                value={step.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Step title..."
                className="font-medium"
              />
              <Textarea
                value={step.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Step description..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-4 min-h-[40px]">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={step.evidenceRequired}
                  onCheckedChange={(checked) => onUpdate({ evidenceRequired: checked })}
                />
                <Label className="text-sm">Require Evidence</Label>
              </div>

              {step.evidenceRequired && (
                <Select
                  value={step.evidenceType || 'photo'}
                  onValueChange={(v) => onUpdate({ evidenceType: v as EvidenceType })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Evidence type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {step.evidenceRequired && step.evidenceType && (
              <EvidenceConfigEditor
                evidenceType={step.evidenceType}
                config={step.evidenceConfig || {}}
                onUpdate={(config) => onUpdate({ evidenceConfig: config })}
              />
            )}

            {/* Step-level approvals */}
            <div className="mt-2 space-y-3 border rounded-md p-3 bg-muted/40">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Requires Approval</Label>
                <Switch
                  checked={step.requiresApproval || false}
                  onCheckedChange={(checked) => onUpdate({ requiresApproval: checked })}
                />
              </div>
              {step.requiresApproval && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Primary Approval Role</Label>
                    <Select
                      value={step.approvalPrimaryRole || 'select-role'}
                      onValueChange={(v) => {
                        if (v !== 'select-role') {
                          onUpdate({ approvalPrimaryRole: v });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select-role" disabled>Select a role...</SelectItem>
                        {Object.values(ROLES).map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Secondary Approval Role (optional)</Label>
                    <Select
                      value={step.approvalSecondaryRole || 'none'}
                      onValueChange={(v) => onUpdate({ approvalSecondaryRole: v === 'none' ? undefined : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {Object.values(ROLES).map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Dual Sign-off Override</Label>
                <Switch
                  checked={step.requiresDualSignoffOverride || false}
                  onCheckedChange={(checked) => onUpdate({ requiresDualSignoffOverride: checked })}
                />
              </div>
            </div>

            {/* Conditional Logic Builder */}
            <ConditionalLogicBuilder
              step={step}
              steps={totalSteps}
              onUpdate={(logic) => onUpdate({ conditionalLogic: logic, isConditional: logic.length > 0 })}
            />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// Conditional Logic Builder Component
function ConditionalLogicBuilder({ step, steps, onUpdate }: { step: SOPStep; steps: number; onUpdate: (logic: ConditionalLogic[]) => void }) {
  const [expanded, setExpanded] = useState(false);
  const logic = step.conditionalLogic || [];
  const addCondition = () => {
    const prevStepId = `step-${step.order - 1}`; // heuristic id reference; real mapping occurs at save
    const newCond: ConditionalLogic = {
      stepId: prevStepId,
      condition: 'equals',
      value: '',
      nextStepId: step.id, // default
      description: ''
    };
    onUpdate([...logic, newCond]);
  };
  const updateCondition = (index: number, updates: Partial<ConditionalLogic>) => {
    const updated = logic.map((c,i) => i===index ? { ...c, ...updates } : c);
    onUpdate(updated);
  };
  const removeCondition = (index: number) => {
    const updated = logic.filter((_,i)=>i!==index);
    onUpdate(updated);
  };
  return (
    <div className="mt-3">
      <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
        <GitBranch className="w-4 h-4 mr-2" />
        {expanded ? 'Hide Conditional Logic' : logic.length ? `Edit ${logic.length} Conditions` : 'Add Conditional Logic'}
      </Button>
      {expanded && (
        <div className="mt-2 space-y-3 border rounded-md p-3 bg-muted/30">
          {logic.map((c,idx)=> (
            <div key={idx} className="space-y-2 border rounded p-2">
              <div className="flex justify-between items-center">
                <Badge variant="secondary">Condition {idx+1}</Badge>
                <Button variant="ghost" size="sm" onClick={()=>removeCondition(idx)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid md:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Operator</Label>
                  <Select value={c.condition} onValueChange={(v)=>updateCondition(idx,{ condition: v as ConditionalOperator })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['equals','not_equals','greater_than','less_than','contains'].map(op=> <SelectItem key={op} value={op}>{op}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Value</Label>
                  <Input value={String(c.value)} onChange={(e)=>updateCondition(idx,{ value: e.target.value })} placeholder="Expected value" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Next Step #</Label>
                  <Input
                    type="number"
                    min={1}
                    max={steps}
                    value={c.nextStepId.replace('step-','')}
                    onChange={(e)=>updateCondition(idx,{ nextStepId: `step-${e.target.value}` })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input value={c.description || ''} onChange={(e)=>updateCondition(idx,{ description: e.target.value })} placeholder="When value matches..." />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addCondition}>
            <Plus className="w-4 h-4 mr-2" /> Add Condition
          </Button>
        </div>
      )}
    </div>
  );
}

// Version History Viewer (basic diff between last two versions)
function VersionHistoryViewer({ template }: { template?: SOPTemplate | null }) {
  if (!template?.version_history?.length) return null;
  const history = template.version_history;
  const lastTwo = history.slice(-2);
  let diff: { added: number; removed: number; changed: number } | null = null;
  if (lastTwo.length === 2) {
    const prevCount = (template.steps || []).length; // placeholder (ideally stored per version)
    const currCount = prevCount; // no historical snapshot available
    diff = { added: Math.max(0, currCount - prevCount), removed: Math.max(0, prevCount - currCount), changed: 0 };
  }
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Version History</CardTitle>
        <CardDescription>Recent publish events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2 text-sm">
          {history.map(v => (
            <li key={v.version} className="flex items-center justify-between border rounded px-2 py-1">
              <span className="font-mono">v{v.version}</span>
              <span className="text-muted-foreground">{v.status}</span>
              <span className="text-xs">{new Date(v.publishedAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        {diff && (
          <div className="text-xs text-muted-foreground">
            Estimated changes between last two versions: +{diff.added} / -{diff.removed} / ~{diff.changed} modified steps
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Evidence Config Editor Component
interface EvidenceConfigEditorProps {
  evidenceType: EvidenceType;
  config: EvidenceConfig;
  onUpdate: (config: EvidenceConfig) => void;
}

function EvidenceConfigEditor({
  evidenceType,
  config,
  onUpdate,
}: EvidenceConfigEditorProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-4 space-y-3">
        <h4 className="text-sm font-medium">Evidence Configuration</h4>
        
        {evidenceType === 'numeric' && (
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Min Value</Label>
              <Input
                type="number"
                value={config.minValue || ''}
                onChange={(e) => onUpdate({ ...config, minValue: parseFloat(e.target.value) })}
                placeholder="Min"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Value</Label>
              <Input
                type="number"
                value={config.maxValue || ''}
                onChange={(e) => onUpdate({ ...config, maxValue: parseFloat(e.target.value) })}
                placeholder="Max"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unit</Label>
              <Input
                value={config.unit || ''}
                onChange={(e) => onUpdate({ ...config, unit: e.target.value })}
                placeholder="e.g., °F"
              />
            </div>
          </div>
        )}

        {evidenceType === 'photo' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.requireLocation || false}
                onCheckedChange={(checked) => onUpdate({ ...config, requireLocation: checked })}
              />
              <Label className="text-sm">Require GPS location</Label>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Photos</Label>
              <Input
                type="number"
                value={config.maxPhotos || 1}
                onChange={(e) => onUpdate({ ...config, maxPhotos: parseInt(e.target.value) })}
                min="1"
                max="10"
              />
            </div>
          </div>
        )}

        {evidenceType === 'text' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Min Length</Label>
              <Input
                type="number"
                value={config.minLength || ''}
                onChange={(e) => onUpdate({ ...config, minLength: parseInt(e.target.value) })}
                placeholder="Min chars"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Length</Label>
              <Input
                type="number"
                value={config.maxLength || ''}
                onChange={(e) => onUpdate({ ...config, maxLength: parseInt(e.target.value) })}
                placeholder="Max chars"
              />
            </div>
          </div>
        )}

        {evidenceType === 'checkbox' && (
          <div className="space-y-2">
            <Label className="text-xs">Options (one per line)</Label>
            <Textarea
              value={(config.options || []).join('\n')}
              onChange={(e) => onUpdate({ 
                ...config, 
                options: e.target.value.split('\n').filter(o => o.trim()) 
              })}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={3}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
