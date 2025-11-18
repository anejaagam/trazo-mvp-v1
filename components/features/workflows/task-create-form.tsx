"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createTaskAction } from '@/app/actions/tasks';
import {
  MAX_TASK_HIERARCHY_LEVEL,
  RecurringPattern,
  ScheduleMode,
  SOPTemplate,
  Task,
  CreateTaskRequest,
  TaskDependencySelection,
  TaskPriority,
} from '@/types/workflow';
import { Loader2, Info, Layers, Link2, GitBranch } from 'lucide-react';
import { ROLES } from '@/lib/rbac/roles';
import { useToast } from '@/components/ui/use-toast';

type TaskCreateBatch = {
  id: string;
  batch_number: string;
  status: string;
  cultivar_name?: string | null;
};

type DependencyTypeKey = 'blocking' | 'suggested';

interface TaskCreateFormProps {
  siteId: string;
  publishedTemplates: SOPTemplate[];
  users: { id: string; email: string; role: string }[];
  existingTasks: Task[];
  batches: TaskCreateBatch[];
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];
const SCHEDULE_MODES: { value: ScheduleMode; label: string; description: string }[] = [
  { value: 'manual', label: 'Manual', description: 'Execute on demand with optional due date.' },
  { value: 'recurring', label: 'Recurring', description: 'Generate tasks on a cadence (daily, weekly, monthly).' },
  { value: 'stage_driven', label: 'Stage Driven', description: 'Unlocks after recipe or batch stage progression.' },
  { value: 'event_driven', label: 'Event Driven', description: 'Triggered by telemetry or exception events.' },
];

const WEEKDAYS: { value: string; label: string }[] = [
  { value: 'Mon', label: 'Mon' },
  { value: 'Tue', label: 'Tue' },
  { value: 'Wed', label: 'Wed' },
  { value: 'Thu', label: 'Thu' },
  { value: 'Fri', label: 'Fri' },
  { value: 'Sat', label: 'Sat' },
  { value: 'Sun', label: 'Sun' },
];

const RELATED_ENTITY_OPTIONS = [
  { value: 'batch', label: 'Batch' },
  { value: 'pod', label: 'Pod' },
  { value: 'room', label: 'Room' },
  { value: 'site', label: 'Site' },
  { value: 'inventory_item', label: 'Inventory Item' },
  { value: 'recipe', label: 'Recipe' },
];

export default function TaskCreateForm({
  siteId,
  publishedTemplates,
  users,
  existingTasks,
  batches,
}: TaskCreateFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState<string>('');
  const [parentTaskId, setParentTaskId] = useState<string | undefined>();
  const [sequenceOrder, setSequenceOrder] = useState<string>('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('manual');
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>('daily');
  const [recurringStartDate, setRecurringStartDate] = useState('');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringInterval, setRecurringInterval] = useState<string>('1');
  const [recurringDaysOfWeek, setRecurringDaysOfWeek] = useState<string[]>(['Mon']);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<string>('1');
  const [recurringCustomRule, setRecurringCustomRule] = useState('');
  const [scheduledStart, setScheduledStart] = useState<string>('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalRole, setApprovalRole] = useState<string | undefined>();
  const [requiresDualSignoff, setRequiresDualSignoff] = useState(false);
  const [dualRolePrimary, setDualRolePrimary] = useState<string | undefined>();
  const [dualRoleSecondary, setDualRoleSecondary] = useState<string | undefined>();
  const [dualDescription, setDualDescription] = useState('');
  const [dependencySelection, setDependencySelection] = useState<TaskDependencySelection>({
    blocking: [],
    suggested: [],
  });
  const [selectedBlockingCandidate, setSelectedBlockingCandidate] = useState<string | undefined>();
  const [selectedSuggestedCandidate, setSelectedSuggestedCandidate] = useState<string | undefined>();
  const [batchId, setBatchId] = useState<string | undefined>();
  const [relatedToType, setRelatedToType] = useState<string | undefined>();
  const [relatedToId, setRelatedToId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [customTagsText, setCustomTagsText] = useState('');
  const [slaHours, setSlaHours] = useState<string>('');
  const [estimatedDuration, setEstimatedDuration] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Autofill title when selecting template (if empty)
  useEffect(() => {
    if (!templateId) {
      setRequiresApproval(false);
      setApprovalRole(undefined);
      return;
    }

    const template = publishedTemplates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    if (!title) {
      setTitle(template.name);
    }

    if (template.estimated_duration_minutes && !estimatedDuration) {
      setEstimatedDuration(String(template.estimated_duration_minutes));
    }

    if (template.requires_approval) {
      setRequiresApproval(true);
      setApprovalRole(template.approval_role || template.required_role?.[0]);
    } else {
      setRequiresApproval(false);
      setApprovalRole(undefined);
    }
  }, [templateId, title, publishedTemplates, estimatedDuration]);

  // Automatically align related batch link
  useEffect(() => {
    if (batchId) {
      setRelatedToType((current) => current || 'batch');
      if (!relatedToId) {
        setRelatedToId(batchId);
      }
    }
  }, [batchId, relatedToId]);

  const prioritizedTasks = useMemo(() => {
    return [...existingTasks]
      .sort((a, b) => {
        if (a.hierarchy_level !== b.hierarchy_level) {
          return a.hierarchy_level - b.hierarchy_level;
        }
        return (a.sequence_order || 0) - (b.sequence_order || 0);
      });
  }, [existingTasks]);

  const parentOptions = useMemo(() => {
    return prioritizedTasks.filter((task) => task.hierarchy_level < MAX_TASK_HIERARCHY_LEVEL);
  }, [prioritizedTasks]);

  const selectedParent = useMemo(
    () => (parentTaskId ? prioritizedTasks.find((task) => task.id === parentTaskId) : undefined),
    [parentTaskId, prioritizedTasks]
  );

  const currentDepth = selectedParent ? selectedParent.hierarchy_level + 1 : 0;

  const suggestedSequenceOrder = useMemo(() => {
    const siblings = prioritizedTasks.filter((task) => {
      if (!parentTaskId) {
        return task.parent_task_id === null || task.parent_task_id === undefined;
      }
      return task.parent_task_id === parentTaskId;
    });
    if (siblings.length === 0) return 1;
    const maxOrder = siblings.reduce((max, task) => Math.max(max, task.sequence_order || 0), 0);
    return maxOrder + 1;
  }, [prioritizedTasks, parentTaskId]);

  useEffect(() => {
    setSequenceOrder('');
    if (suggestedSequenceOrder) {
      setSequenceOrder(String(suggestedSequenceOrder));
    }
  }, [parentTaskId, suggestedSequenceOrder]);

  const dependencyCandidates = useMemo(() => {
    return prioritizedTasks.filter((task) => {
      if (task.id === parentTaskId) return false;
      if (task.id === selectedParent?.parent_task_id) return true;
      return !dependencySelection.blocking.includes(task.id) && !dependencySelection.suggested.includes(task.id);
    });
  }, [prioritizedTasks, dependencySelection, parentTaskId, selectedParent]);

  const roleOptions = useMemo(() => Object.values(ROLES).map((role) => ({ id: role.id, name: role.name })), []);

  const handleAddDependency = (taskId: string | undefined, type: DependencyTypeKey) => {
    if (!taskId) return;
    setDependencySelection((prev) => {
      if (prev.blocking.includes(taskId) || prev.suggested.includes(taskId)) {
        toast({
          title: 'Dependency already added',
          description: 'Select a different prerequisite.',
          variant: 'destructive',
        });
        return prev;
      }
      if (type === 'blocking') {
        return {
          ...prev,
          blocking: [...prev.blocking, taskId],
        };
      }
      return {
        ...prev,
        suggested: [...prev.suggested, taskId],
      };
    });
    if (type === 'blocking') {
      setSelectedBlockingCandidate(undefined);
    } else {
      setSelectedSuggestedCandidate(undefined);
    }
  };

  const handleRemoveDependency = (taskId: string, type: DependencyTypeKey) => {
    setDependencySelection((prev) => ({
      ...prev,
      blocking: type === 'blocking' ? prev.blocking.filter((value) => value !== taskId) : prev.blocking,
      suggested: type === 'suggested' ? prev.suggested.filter((value) => value !== taskId) : prev.suggested,
    }));
  };

  const canSubmit = !submitting && Boolean(siteId) && title.trim().length > 0 && priority;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
     setFormErrors([]);

    const validationIssues: string[] = [];

    if (requiresApproval && !approvalRole) {
      validationIssues.push('Approval role is required when approval is enabled.');
    }

    if (requiresDualSignoff) {
      if (!dualRolePrimary || !dualRoleSecondary) {
        validationIssues.push('Both primary and secondary roles are required for dual sign-off.');
      }
      if (dualRolePrimary && dualRoleSecondary && dualRolePrimary === dualRoleSecondary) {
        validationIssues.push('Dual sign-off requires two distinct roles.');
      }
    }

    if (scheduleMode === 'recurring') {
      if (!recurringStartDate) {
        validationIssues.push('Recurring tasks require a start date.');
      }
      if (!recurringInterval || Number(recurringInterval) <= 0) {
        validationIssues.push('Recurring interval must be a positive number.');
      }
      if (recurringPattern === 'weekly' && recurringDaysOfWeek.length === 0) {
        validationIssues.push('Select at least one day of the week for weekly recurrence.');
      }
      if (recurringPattern === 'monthly') {
        const dayValue = Number(recurringDayOfMonth);
        if (!dayValue || dayValue < 1 || dayValue > 31) {
          validationIssues.push('Monthly recurrence requires a day between 1 and 31.');
        }
      }
    }

    if (currentDepth > MAX_TASK_HIERARCHY_LEVEL) {
      validationIssues.push(`Hierarchy depth cannot exceed ${MAX_TASK_HIERARCHY_LEVEL + 1} levels.`);
    }

    const hasSequenceOrder = sequenceOrder !== '';
    const parsedSequenceOrder = hasSequenceOrder ? Number(sequenceOrder) : undefined;
    if (hasSequenceOrder && (Number.isNaN(parsedSequenceOrder!) || parsedSequenceOrder! < 0)) {
      validationIssues.push('Sequence order must be a non-negative number.');
    }

    const parsedInterval = recurringInterval ? Number(recurringInterval) : undefined;
    const parsedDayOfMonth = recurringDayOfMonth ? Number(recurringDayOfMonth) : undefined;
    const hasSlaHours = slaHours !== '';
    const parsedSlaHours = hasSlaHours ? Number(slaHours) : undefined;
    const hasEstimatedDuration = estimatedDuration !== '';
    const parsedEstimatedDuration = hasEstimatedDuration ? Number(estimatedDuration) : undefined;

    if (hasSlaHours && (Number.isNaN(parsedSlaHours!) || parsedSlaHours! < 0)) {
      validationIssues.push('SLA hours must be a positive number.');
    }

    if (hasEstimatedDuration && (Number.isNaN(parsedEstimatedDuration!) || parsedEstimatedDuration! < 0)) {
      validationIssues.push('Estimated duration must be a positive number.');
    }

    if (validationIssues.length) {
      setFormErrors(validationIssues);
      toast({
        title: 'Cannot create task',
        description: validationIssues[0],
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    const recurringConfig = scheduleMode === 'recurring'
      ? {
          startDate: recurringStartDate,
          endDate: recurringEndDate || undefined,
          interval: parsedInterval,
          daysOfWeek: recurringPattern === 'weekly' ? recurringDaysOfWeek : undefined,
          dayOfMonth: recurringPattern === 'monthly' ? parsedDayOfMonth : undefined,
          customRule: recurringPattern === 'custom' ? (recurringCustomRule || undefined) : undefined,
        }
      : undefined;

    const customTags = customTagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const metadata: Record<string, unknown> = {};
    if (customTags.length) {
      metadata.customTags = customTags;
    }
    if (parsedSlaHours !== undefined) {
      metadata.slaHours = parsedSlaHours;
    }
    if (requiresDualSignoff) {
      metadata.dualSignoff = {
        required: true,
        primaryRole: dualRolePrimary,
        secondaryRole: dualRoleSecondary,
        description: dualDescription || undefined,
      };
    }

    const createInput: CreateTaskRequest = {
      site_id: siteId,
      sop_template_id: templateId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      parent_task_id: parentTaskId || undefined,
      assigned_to: assignedTo || undefined,
      sequence_order: parsedSequenceOrder,
      due_date: dueDate || undefined,
      scheduled_start: scheduledStart || undefined,
      schedule_mode: scheduleMode,
      recurring_pattern: scheduleMode === 'recurring' ? recurringPattern : undefined,
      recurring_config: recurringConfig,
      requires_approval: requiresApproval || undefined,
      approval_role: requiresApproval ? approvalRole : undefined,
      batch_id: batchId || undefined,
      related_to_type: relatedToType || undefined,
      related_to_id: relatedToId ? relatedToId.trim() : undefined,
      notes: notes.trim() || undefined,
      estimated_duration_minutes: parsedEstimatedDuration,
      evidence_metadata: Object.keys(metadata).length ? metadata : undefined,
      dependencies: dependencySelection,
    };

    try {
      const result = await createTaskAction(createInput);
      if (!result || result.error || !result.data) {
        const message = typeof result?.error === 'string' ? result.error : 'Failed to create task';
        setError(message);
        toast({
          title: 'Unable to create task',
          description: message,
          variant: 'destructive',
        });
      } else if (result.data) {
        toast({
          title: 'Task created',
          description: 'Task created successfully',
        });
        setSuccessId(result.data.id);
        setTimeout(() => {
          router.push('/dashboard/workflows');
        }, 600);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      toast({
        title: 'Unable to create task',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const renderTaskName = (task: Task) => {
    const indent = task.hierarchy_level > 0 ? `${'--'.repeat(task.hierarchy_level)} ` : '';
    return `${indent}${task.title}`;
  };

  const resolveTaskTitle = (taskId: string) => {
    const task = prioritizedTasks.find((t) => t.id === taskId);
    return task ? task.title : taskId;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>Define the task scope, template, assignment, and scheduling preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {formErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Resolve the following before creating the task</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1">
                  {formErrors.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template">Template (optional)</Label>
              <Select onValueChange={(v) => setTemplateId(v)} value={templateId}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {publishedTemplates.length === 0 && (
                    <div className="px-2 py-1 text-muted-foreground text-sm">No published templates</div>
                  )}
                  {publishedTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} v{template.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter task title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe task objectives"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign To (optional)</Label>
              <Select value={assignedTo} onValueChange={(value) => setAssignedTo(value)}>
                <SelectTrigger id="assigned_to">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date (optional)</Label>
              <Input id="due_date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduled_start">Scheduled Start (optional)</Label>
              <Input
                id="scheduled_start"
                type="datetime-local"
                value={scheduledStart}
                onChange={(event) => setScheduledStart(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
              <Input
                id="estimated_duration"
                type="number"
                min={0}
                value={estimatedDuration}
                onChange={(event) => setEstimatedDuration(event.target.value)}
                placeholder="Optional, defaults from template when available"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_task">Parent Task (optional)</Label>
            <Select value={parentTaskId} onValueChange={(value) => setParentTaskId(value)}>
              <SelectTrigger id="parent_task">
                <SelectValue placeholder="None (root task)" />
              </SelectTrigger>
              <SelectContent>
                {parentOptions.length === 0 && (
                  <div className="px-2 py-1 text-muted-foreground text-sm">No tasks available for hierarchy</div>
                )}
                {parentOptions.map((task) => (
                  <SelectItem
                    key={task.id}
                    value={task.id}
                    disabled={task.hierarchy_level >= MAX_TASK_HIERARCHY_LEVEL}
                  >
                    {renderTaskName(task)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Layers className="h-4 w-4" />
              <span>
                Current depth: {currentDepth} / {MAX_TASK_HIERARCHY_LEVEL + 1}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sequence_order">Sequence Order</Label>
              <Input
                id="sequence_order"
                type="number"
                min={0}
                value={sequenceOrder}
                onChange={(event) => setSequenceOrder(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Suggested next order: {suggestedSequenceOrder}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sla_hours">SLA Hours (optional)</Label>
              <Input
                id="sla_hours"
                type="number"
                min={0}
                value={slaHours}
                onChange={(event) => setSlaHours(event.target.value)}
                placeholder="Use to drive escalations"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduling & Recurrence</CardTitle>
          <CardDescription>Control how the task is triggered and repeated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schedule_mode">Schedule Mode</Label>
              <Select value={scheduleMode} onValueChange={(value) => setScheduleMode(value as ScheduleMode)}>
                <SelectTrigger id="schedule_mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {SCHEDULE_MODES.find((mode) => mode.value === scheduleMode)?.description}
              </p>
            </div>

            {scheduleMode === 'recurring' && (
              <div className="space-y-2">
                <Label htmlFor="recurring_pattern">Recurring Pattern</Label>
                <Select value={recurringPattern} onValueChange={(value) => setRecurringPattern(value as RecurringPattern)}>
                  <SelectTrigger id="recurring_pattern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {scheduleMode === 'recurring' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recurring_start">Start Date</Label>
                <Input
                  id="recurring_start"
                  type="date"
                  value={recurringStartDate}
                  onChange={(event) => setRecurringStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring_end">End Date (optional)</Label>
                <Input
                  id="recurring_end"
                  type="date"
                  value={recurringEndDate}
                  onChange={(event) => setRecurringEndDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring_interval">Interval</Label>
                <Input
                  id="recurring_interval"
                  type="number"
                  min={1}
                  value={recurringInterval}
                  onChange={(event) => setRecurringInterval(event.target.value)}
                  placeholder="How often to repeat"
                />
              </div>

              {recurringPattern === 'weekly' && (
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => {
                      const isActive = recurringDaysOfWeek.includes(day.value);
                      return (
                        <Button
                          key={day.value}
                          type="button"
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setRecurringDaysOfWeek((prev) => {
                              if (isActive) {
                                return prev.filter((value) => value !== day.value);
                              }
                              return [...prev, day.value];
                            });
                          }}
                        >
                          {day.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recurringPattern === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="recurring_day_of_month">Day of Month</Label>
                  <Input
                    id="recurring_day_of_month"
                    type="number"
                    min={1}
                    max={31}
                    value={recurringDayOfMonth}
                    onChange={(event) => setRecurringDayOfMonth(event.target.value)}
                  />
                </div>
              )}

              {recurringPattern === 'custom' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="recurring_custom_rule">Custom Rule</Label>
                  <Input
                    id="recurring_custom_rule"
                    value={recurringCustomRule}
                    onChange={(event) => setRecurringCustomRule(event.target.value)}
                    placeholder="Provide an RRULE or descriptive trigger"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dependencies</CardTitle>
          <CardDescription>Manage prerequisites that must be completed before this task can proceed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dependency_blocking">Blocking Dependencies</Label>
              <div className="flex flex-col gap-2">
                <Select
                  value={selectedBlockingCandidate}
                  onValueChange={(value) => setSelectedBlockingCandidate(value)}
                >
                  <SelectTrigger id="dependency_blocking">
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {dependencyCandidates.length === 0 && (
                      <div className="px-2 py-1 text-muted-foreground text-sm">No available tasks</div>
                    )}
                    {dependencyCandidates.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {renderTaskName(task)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddDependency(selectedBlockingCandidate, 'blocking')}
                  disabled={!selectedBlockingCandidate}
                >
                  Add blocking dependency
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {dependencySelection.blocking.map((taskId) => (
                  <Badge key={taskId} variant="secondary" className="flex items-center gap-2">
                    <Link2 className="h-3 w-3" />
                    {resolveTaskTitle(taskId)}
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-900"
                      onClick={() => handleRemoveDependency(taskId, 'blocking')}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {dependencySelection.blocking.length === 0 && (
                  <p className="text-xs text-slate-500">No blocking dependencies added.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependency_suggested">Suggested Dependencies</Label>
              <div className="flex flex-col gap-2">
                <Select
                  value={selectedSuggestedCandidate}
                  onValueChange={(value) => setSelectedSuggestedCandidate(value)}
                >
                  <SelectTrigger id="dependency_suggested">
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {dependencyCandidates.length === 0 && (
                      <div className="px-2 py-1 text-muted-foreground text-sm">No available tasks</div>
                    )}
                    {dependencyCandidates.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {renderTaskName(task)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddDependency(selectedSuggestedCandidate, 'suggested')}
                  disabled={!selectedSuggestedCandidate}
                >
                  Add suggested dependency
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {dependencySelection.suggested.map((taskId) => (
                  <Badge key={taskId} variant="outline" className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3" />
                    {resolveTaskTitle(taskId)}
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-900"
                      onClick={() => handleRemoveDependency(taskId, 'suggested')}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {dependencySelection.suggested.length === 0 && (
                  <p className="text-xs text-slate-500">No suggested dependencies added.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approval & Dual Sign-off</CardTitle>
          <CardDescription>Configure elevated checks for high-risk workflows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <Label htmlFor="requires_approval_switch">Requires Approval</Label>
              <p className="text-xs text-slate-500">
                Task completion moves to an approval queue before it can be marked done.
              </p>
            </div>
            <Switch id="requires_approval_switch" checked={requiresApproval} onCheckedChange={setRequiresApproval} />
          </div>

          {requiresApproval && (
            <div className="space-y-2">
              <Label htmlFor="approval_role">Approval Role</Label>
              <Select value={approvalRole} onValueChange={(value) => setApprovalRole(value)}>
                <SelectTrigger id="approval_role">
                  <SelectValue placeholder="Select approving role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <Label htmlFor="requires_dual_signoff_switch">Requires Dual Sign-off</Label>
              <p className="text-xs text-slate-500">
                Capture two independent signatures before the task can be completed.
              </p>
            </div>
            <Switch
              id="requires_dual_signoff_switch"
              checked={requiresDualSignoff}
              onCheckedChange={setRequiresDualSignoff}
            />
          </div>

          {requiresDualSignoff && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dual_primary">Primary Role</Label>
                <Select value={dualRolePrimary} onValueChange={(value) => setDualRolePrimary(value)}>
                  <SelectTrigger id="dual_primary">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dual_secondary">Secondary Role</Label>
                <Select value={dualRoleSecondary} onValueChange={(value) => setDualRoleSecondary(value)}>
                  <SelectTrigger id="dual_secondary">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="dual_description">Dual Sign-off Notes</Label>
                <Textarea
                  id="dual_description"
                  value={dualDescription}
                  onChange={(event) => setDualDescription(event.target.value)}
                  placeholder="Describe why dual authorization is required"
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Context & Metadata</CardTitle>
          <CardDescription>Link batches, contextual entities, and add operational notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batch_id">Batch Association</Label>
              <Select value={batchId} onValueChange={(value) => setBatchId(value)}>
                <SelectTrigger id="batch_id">
                  <SelectValue placeholder="No batch linked" />
                </SelectTrigger>
                <SelectContent>
                  {batches.length === 0 && (
                    <div className="px-2 py-1 text-muted-foreground text-sm">No active batches</div>
                  )}
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_number} ({batch.status}){batch.cultivar_name ? ` • ${batch.cultivar_name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_tags">Custom Tags</Label>
              <Input
                id="custom_tags"
                value={customTagsText}
                onChange={(event) => setCustomTagsText(event.target.value)}
                placeholder="Comma-separated tags (e.g. compliance,quarterly)"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="related_type">Related Entity</Label>
              <Select value={relatedToType} onValueChange={(value) => setRelatedToType(value)}>
                <SelectTrigger id="related_type">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {RELATED_ENTITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="related_id">Related Entity ID</Label>
              <Input
                id="related_id"
                value={relatedToId}
                onChange={(event) => setRelatedToId(event.target.value)}
                placeholder="Optional (auto-filled when linking batch)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Operational Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add playbook notes, escalation steps, or compliance references"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to create task</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successId && (
          <Alert>
            <AlertTitle>Task created</AlertTitle>
            <AlertDescription>Redirecting to the new task...</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={!canSubmit}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Changes automatically inherit RLS policies—only users with `task:create` may submit.
        </div>
      </div>
    </form>
  );
}
