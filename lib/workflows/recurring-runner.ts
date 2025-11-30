import type { SupabaseClient } from '@supabase/supabase-js';
import { Task, RecurringConfig } from '@/types/workflow';
import { generateNextRecurrenceInstances, validateRecurringConfig } from '@/lib/utils/recurrence';

type SeedRecurringConfig = RecurringConfig & {
  seedTaskId?: string;
  lastGeneratedAt?: string;
};

export interface RecurringJobSummary {
  seedsChecked: number;
  created: number;
  skipped: number;
  errors: Array<{ taskId: string; message: string }>;
}

export interface RecurringJobOptions {
  lookAhead?: number;
}

function normalizeRecurringConfig(config: unknown): SeedRecurringConfig | null {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return null;
  }
  return config as SeedRecurringConfig;
}

export async function runRecurringGenerationJob(
  supabase: SupabaseClient,
  options: RecurringJobOptions = {}
): Promise<RecurringJobSummary> {
  const lookAhead = options.lookAhead ?? 3;
  const summary: RecurringJobSummary = {
    seedsChecked: 0,
    created: 0,
    skipped: 0,
    errors: [],
  };

  const { data: seeds, error } = await supabase
    .from('tasks')
    .select('*')
    .not('recurring_pattern', 'is', null)
    .eq('schedule_mode', 'recurring')
    .limit(500);

  if (error) {
    throw new Error(`Unable to load recurring seeds: ${error.message}`);
  }

  for (const rawSeed of (seeds || []) as Task[]) {
    summary.seedsChecked += 1;
    const config = normalizeRecurringConfig(rawSeed.recurring_config);
    if (!rawSeed.recurring_pattern || !config) {
      summary.errors.push({ taskId: rawSeed.id, message: 'Missing recurrence configuration' });
      continue;
    }

    if (!config.seedTaskId) {
      config.seedTaskId = rawSeed.id;
      const { error: tagError } = await supabase
        .from('tasks')
        .update({ recurring_config: config })
        .eq('id', rawSeed.id);
      if (tagError) {
        summary.errors.push({ taskId: rawSeed.id, message: `Failed to tag seed: ${tagError.message}` });
        continue;
      }
    }

    const validation = validateRecurringConfig(rawSeed.recurring_pattern, config);
    if (!validation.valid) {
      summary.errors.push({ taskId: rawSeed.id, message: validation.errors.join('; ') || 'Invalid recurrence config' });
      continue;
    }

    const projections = generateNextRecurrenceInstances(rawSeed, lookAhead);
    if (!projections.length) {
      summary.skipped += 1;
      continue;
    }

    let latestGenerated: string | null = null;

    for (const projection of projections) {
      const dueDateIso = new Date(projection.dueDate).toISOString();

      const { data: existing, error: existingError } = await supabase
        .from('tasks')
        .select('id')
        .eq('schedule_mode', 'recurring')
        .filter('recurring_config->>seedTaskId', 'eq', config.seedTaskId)
        .eq('due_date', dueDateIso)
        .limit(1);
      if (existingError) {
        summary.errors.push({ taskId: rawSeed.id, message: existingError.message });
        break;
      }
      if (existing && existing.length > 0) {
        summary.skipped += 1;
        continue;
      }

      const insertPayload = {
        organization_id: rawSeed.organization_id,
        site_id: rawSeed.site_id,
        sop_template_id: rawSeed.sop_template_id,
        title: rawSeed.title,
        description: rawSeed.description,
        status: 'to_do',
        priority: rawSeed.priority,
        parent_task_id: rawSeed.parent_task_id,
        hierarchy_level: rawSeed.hierarchy_level,
        sequence_order: rawSeed.sequence_order,
        assigned_to: rawSeed.assigned_to,
        assigned_by: rawSeed.assigned_by,
        related_to_type: rawSeed.related_to_type,
        related_to_id: rawSeed.related_to_id,
        batch_id: rawSeed.batch_id,
        due_date: dueDateIso,
        scheduled_start: rawSeed.scheduled_start,
        recurring_pattern: rawSeed.recurring_pattern,
        recurring_config: {
          ...config,
          seedTaskId: config.seedTaskId,
        },
        schedule_mode: rawSeed.schedule_mode,
        created_by: rawSeed.created_by,
        current_step_index: 0,
        evidence: [],
        evidence_compressed: false,
        prerequisite_completed: false,
        requires_approval: rawSeed.requires_approval,
        approval_role: rawSeed.approval_role,
        requires_dual_signoff: rawSeed.requires_dual_signoff,
        dual_signoff_roles: rawSeed.dual_signoff_roles,
        dual_signoff_description: rawSeed.dual_signoff_description,
      };

      const { error: insertError } = await supabase.from('tasks').insert(insertPayload);
      if (insertError) {
        summary.errors.push({ taskId: rawSeed.id, message: insertError.message });
        break;
      }

      summary.created += 1;
      latestGenerated = dueDateIso;
    }

    if (latestGenerated) {
      const updatedConfig = { ...config, lastGeneratedAt: latestGenerated };
      await supabase.from('tasks').update({ recurring_config: updatedConfig }).eq('id', rawSeed.id);
    }
  }

  return summary;
}
