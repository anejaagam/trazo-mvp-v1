/**
 * Workflow & Task Management Database Queries
 * 
 * Comprehensive query functions for SOP templates, tasks, and workflow execution.
 * Includes support for task hierarchy, template versioning, and evidence management.
 * 
 * @module lib/supabase/queries/workflows
 */

import { createClient } from '@/lib/supabase/server';
import {
  SOPTemplate,
  Task,
  TaskEvidence,
  TaskDependency,
  TaskStep,
  CreateTemplateInput,
  UpdateTemplateInput,
  CreateTaskInput,
  UpdateTaskInput,
  TaskWithTemplate,
  TaskHierarchyTree,
  TaskHierarchyNode,
  PrerequisiteCheck,
  TaskFilters,
  TemplateFilters,
  PaginationParams,
  PaginatedResult,
  PublishTemplateResult,
  MAX_TASK_HIERARCHY_LEVEL,
  EvidenceAggregation,
} from '@/types/workflow';
import { decompressEvidence } from '@/lib/utils/evidence-compression';
import { wouldCreateDependencyCycle } from '@/lib/utils/dependency-graph';
import { generateNextRecurrenceInstances } from '@/lib/utils/recurrence';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// =====================================================
// SOP TEMPLATE QUERIES
// =====================================================

/**
 * Get all SOP templates with optional filtering
 */
export async function getTemplates(
  filters?: TemplateFilters,
  pagination?: PaginationParams
) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('sop_templates')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.category?.length) {
      query = query.in('category', filters.category);
    }

    if (filters?.is_latest_version !== undefined) {
      query = query.eq('is_latest_version', filters.is_latest_version);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    // Apply sorting
    const sortBy = pagination?.sortBy || 'created_at';
    const sortOrder = pagination?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data as SOPTemplate[],
      error: null,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error('Error in getTemplates:', error);
    return {
      data: null,
      error,
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
  }
}

/**
 * Get a single SOP template by ID
 */
export async function getTemplateById(templateId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sop_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;

    return { data: data as SOPTemplate, error: null };
  } catch (error) {
    console.error('Error in getTemplateById:', error);
    return { data: null, error };
  }
}

/**
 * Get all published templates (for task creation)
 */
export async function getPublishedTemplates() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sop_templates')
      .select('*')
      .eq('status', 'published')
      .eq('is_active', true)
      .eq('is_latest_version', true)
      .order('name');

    if (error) throw error;

    return { data: data as SOPTemplate[], error: null };
  } catch (error) {
    console.error('Error in getPublishedTemplates:', error);
    return { data: null, error };
  }
}

/**
 * Get draft templates for current user
 */
export async function getMyDraftTemplates() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('sop_templates')
      .select('*')
      .eq('status', 'draft')
      .eq('created_by', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return { data: data as SOPTemplate[], error: null };
  } catch (error) {
    console.error('Error in getMyDraftTemplates:', error);
    return { data: null, error };
  }
}

/**
 * Create a new SOP template (starts as draft)
 */
export async function createTemplate(input: CreateTemplateInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return { data: null, error: new Error('User organization not found') };
    }

    const { data, error } = await supabase
      .from('sop_templates')
      .insert({
        ...input,
        organization_id: userData.organization_id,
        created_by: user.id,
        status: 'draft',
        version: '1.0',
        is_latest_version: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: data as SOPTemplate, error: null };
  } catch (error) {
    console.error('Error in createTemplate:', error);
    return { data: null, error };
  }
}

/**
 * Update an SOP template (only drafts can be updated)
 */
export async function updateTemplate(input: UpdateTemplateInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Check if template is draft and owned by user
    const { data: existingTemplate } = await supabase
      .from('sop_templates')
      .select('status, created_by')
      .eq('id', input.id)
      .single();

    if (!existingTemplate) {
      return { data: null, error: new Error('Template not found') };
    }

    if (existingTemplate.status !== 'draft') {
      return {
        data: null,
        error: new Error('Only draft templates can be updated'),
      };
    }

    if (existingTemplate.created_by !== user.id) {
      return {
        data: null,
        error: new Error('You can only update your own templates'),
      };
    }

    const { id, ...updates } = input;

    const { data, error } = await supabase
      .from('sop_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data: data as SOPTemplate, error: null };
  } catch (error) {
    console.error('Error in updateTemplate:', error);
    return { data: null, error };
  }
}

/**
 * Publish a template (creates new version, marks as published)
 */
export async function publishTemplate(
  templateId: string
): Promise<PublishTemplateResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Call database function to publish template
    const { data, error } = await supabase.rpc('publish_template', {
      template_id: templateId,
      published_by_user: user.id,
    });

    if (error) throw error;

    return {
      success: true,
      published_template_id: data,
    };
  } catch (error) {
    console.error('Error in publishTemplate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Archive a template
 */
export async function archiveTemplate(templateId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sop_templates')
      .update({ status: 'archived', is_active: false })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    return { data: data as SOPTemplate, error: null };
  } catch (error) {
    console.error('Error in archiveTemplate:', error);
    return { data: null, error };
  }
}

/**
 * Duplicate a template (creates new draft from published template)
 */
export async function duplicateTemplate(templateId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Get source template
    const { data: sourceTemplate, error: fetchError } = await supabase
      .from('sop_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError) throw fetchError;

    // Create duplicate as draft
    const {
      id,
      created_at,
      updated_at,
      published_at,
      published_by,
      version_history,
      ...templateData
    } = sourceTemplate;

    const { data, error } = await supabase
      .from('sop_templates')
      .insert({
        ...templateData,
        name: `${templateData.name} (Copy)`,
        status: 'draft',
        version: '1.0',
        created_by: user.id,
        is_latest_version: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: data as SOPTemplate, error: null };
  } catch (error) {
    console.error('Error in duplicateTemplate:', error);
    return { data: null, error };
  }
}

// =============================================
// VERSION HISTORY & DIFF QUERIES (Phase 3 UI)
// =============================================

/**
 * Get all versions for an original template (includes the original draft/published and published descendants)
 */
export async function getTemplateVersions(originalTemplateId: string) {
  try {
    const supabase = await createClient();
    // Fetch original + published versions referencing it as parent
    const { data, error } = await supabase
      .from('sop_templates')
      .select('*')
      .or(`id.eq.${originalTemplateId},parent_template_id.eq.${originalTemplateId}`)
      .order('published_at', { ascending: true, nullsFirst: true });
    if (error) throw error;
    return { data: data as SOPTemplate[], error: null };
  } catch (error) {
    console.error('Error in getTemplateVersions:', error);
    return { data: null, error };
  }
}

/**
 * Compute a lightweight diff between two template versions' steps (title-based heuristic)
 */
export async function diffTemplateVersions(templateAId: string, templateBId: string) {
  try {
    const supabase = await createClient();
    const fetchOne = async (id: string): Promise<SOPTemplate | null> => {
      const { data, error } = await supabase
        .from('sop_templates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data as SOPTemplate;
    };
    const a = await fetchOne(templateAId);
    const b = await fetchOne(templateBId);
    if (!a || !b) {
      return { data: null, error: new Error('Templates not found for diff') };
    }
    const aTitles = new Set((a.steps || []).map(s => s.title));
    const bTitles = new Set((b.steps || []).map(s => s.title));
    const added = Array.from(bTitles).filter(t => !aTitles.has(t));
    const removed = Array.from(aTitles).filter(t => !bTitles.has(t));
    const changed: string[] = []; // Placeholder: could compare description/evidence changes later
    return { data: { added, removed, changed }, error: null };
  } catch (error) {
    console.error('Error in diffTemplateVersions:', error);
    return { data: null, error };
  }
}

/**
 * Revert: create a new draft from a prior published version (does not publish immediately)
 */
export async function revertTemplateVersion(originalTemplateId: string, targetVersionId: string) {
  try {
    const supabase = await createClient();
    // Fetch target version
    const { data: target, error: fetchError } = await supabase
      .from('sop_templates')
      .select('*')
      .eq('id', targetVersionId)
      .single();
    if (fetchError) throw fetchError;
    if (!target) throw new Error('Target version not found');
    const {
      id, created_at, updated_at, published_at, published_by, version_history, parent_template_id, version, status,
      ...rest
    } = target as any;
    const { data: inserted, error: insertError } = await supabase
      .from('sop_templates')
      .insert({
        ...rest,
        name: rest.name + ' (Revert Draft)',
        status: 'draft',
        version: '1.0',
        parent_template_id: originalTemplateId, // maintain linkage
        is_latest_version: false,
      })
      .select()
      .single();
    if (insertError) throw insertError;
    return { data: inserted as SOPTemplate, error: null };
  } catch (error) {
    console.error('Error in revertTemplateVersion:', error);
    return { data: null, error };
  }
}

// =====================================================
// TASK QUERIES
// =====================================================

/**
 * Get all tasks with optional filtering
 */
export async function getTasks(
  filters?: TaskFilters,
  pagination?: PaginationParams
) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('tasks')
      .select('*, sop_templates!left(name, version)', { count: 'exact' });

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.priority?.length) {
      query = query.in('priority', filters.priority);
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters?.site_id) {
      query = query.eq('site_id', filters.site_id);
    }

    if (filters?.parent_task_id !== undefined) {
      if (filters.parent_task_id === null) {
        query = query.is('parent_task_id', null);
      } else {
        query = query.eq('parent_task_id', filters.parent_task_id);
      }
    }

    if (filters?.hierarchy_level !== undefined) {
      query = query.eq('hierarchy_level', filters.hierarchy_level);
    }

    if (filters?.due_before) {
      query = query.lte('due_date', filters.due_before);
    }

    if (filters?.due_after) {
      query = query.gte('due_date', filters.due_after);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    // Apply sorting
    const sortBy = pagination?.sortBy || 'created_at';
    const sortOrder = pagination?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data as TaskWithTemplate[],
      error: null,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error('Error in getTasks:', error);
    return {
      data: null,
      error,
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
  }
}

/**
 * Get a single task by ID with full details
 */
export async function getTaskById(taskId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        template:sop_templates(*),
        dependencies:task_dependencies(
          *,
          depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)
        ),
        children:tasks!parent_task_id(id, title, status, hierarchy_level, sequence_order)
      `
      )
      .eq('id', taskId)
      .single();

    if (error) throw error;

    return { data: data as TaskWithTemplate, error: null };
  } catch (error) {
    console.error('Error in getTaskById:', error);
    return { data: null, error };
  }
}

/**
 * Get tasks assigned to current user
 */
export async function getMyTasks() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*, sop_templates!left(name, version)')
      .eq('assigned_to', user.id)
      .in('status', ['to_do', 'in_progress', 'blocked'])
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) throw error;

    return { data: data as TaskWithTemplate[], error: null };
  } catch (error) {
    console.error('Error in getMyTasks:', error);
    return { data: null, error };
  }
}

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return { data: null, error: new Error('User organization not found') };
    }

    // Validate hierarchy level if parent_task_id is provided
    if (input.parent_task_id) {
      const { data: parentTask } = await supabase
        .from('tasks')
        .select('hierarchy_level')
        .eq('id', input.parent_task_id)
        .single();

      if (parentTask && parentTask.hierarchy_level >= MAX_TASK_HIERARCHY_LEVEL) {
        return {
          data: null,
          error: new Error(
            `Cannot create child task. Maximum hierarchy depth of ${
              MAX_TASK_HIERARCHY_LEVEL + 1
            } levels exceeded.`
          ),
        };
      }
    }

    // Auto sequence ordering if not provided
    let sequence_order = input.sequence_order;
    if (sequence_order === undefined) {
      const { data: siblings } = await supabase
        .from('tasks')
        .select('sequence_order')
        .eq('parent_task_id', input.parent_task_id || null);
      const maxOrder = (siblings || []).reduce(
        (max: number, row: any) => Math.max(max, row.sequence_order || 0),
        0
      );
      sequence_order = maxOrder + 1;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...input,
        sequence_order,
        organization_id: userData.organization_id,
        created_by: user.id,
        status: 'to_do',
        current_step_index: 0,
        evidence: [],
        evidence_compressed: false,
        prerequisite_completed: false,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: data as Task, error: null };
  } catch (error) {
    console.error('Error in createTask:', error);
    return { data: null, error };
  }
}

/**
 * Update a task
 */
export async function updateTask(input: UpdateTaskInput) {
  try {
    const supabase = await createClient();
    const { id, ...updates } = input;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data: data as Task, error: null };
  } catch (error) {
    console.error('Error in updateTask:', error);
    return { data: null, error };
  }
}

/**
 * Delete a task (and all children due to CASCADE)
 */
export async function deleteTask(taskId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in deleteTask:', error);
    return { success: false, error };
  }
}

/**
 * Start a task
 */
export async function startTask(taskId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return { data: data as Task, error: null };
  } catch (error) {
    console.error('Error in startTask:', error);
    return { data: null, error };
  }
}

/**
 * Complete a task
 */
export async function completeTask(
  taskId: string,
  evidence?: TaskEvidence[],
  completionNotes?: string,
  actualDurationMinutes?: number
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const updateData: any = {
      status: 'done',
      completed_at: new Date().toISOString(),
      completed_by: user.id,
      completion_notes: completionNotes,
      actual_duration_minutes: actualDurationMinutes,
    };

    // Add evidence if provided and aggregate compression metrics
    if (evidence) {
      updateData.evidence = evidence;
      const aggregation = aggregateEvidence(evidence);
      updateData.evidence_compressed = aggregation.compressedBytes < aggregation.originalBytes;
      updateData.evidence_metadata = aggregation;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    // Unlock dependent tasks if all their blocking prerequisites are now complete
    await cascadeUnlockDependentTasks(taskId);

    return { data: data as Task, error: null };
  } catch (error) {
    console.error('Error in completeTask:', error);
    return { data: null, error };
  }
}

// Evidence aggregation helper
function aggregateEvidence(evidence: TaskEvidence[]): EvidenceAggregation {
  let originalBytes = 0;
  let compressedBytes = 0;
  const byType: EvidenceAggregation['byType'] = {};
  for (const e of evidence) {
    const o = e.originalSize || 0;
    const c = e.compressedSize || o;
    originalBytes += o;
    compressedBytes += c;
    if (!byType[e.type]) {
      byType[e.type] = { count: 0, originalBytes: 0, compressedBytes: 0 };
    }
    byType[e.type]!.count += 1;
    byType[e.type]!.originalBytes += o;
    byType[e.type]!.compressedBytes += c;
  }
  return {
    totalItems: evidence.length,
    originalBytes,
    compressedBytes,
    compressionRatio: compressedBytes === 0 ? 1 : originalBytes / compressedBytes,
    byType,
  };
}

// Unlock dependent tasks whose blocking prerequisites are now all done/approved
async function cascadeUnlockDependentTasks(completedTaskId: string) {
  try {
    const supabase = await createClient();
    const { data: dependents } = await supabase
      .from('task_dependencies')
      .select('task_id')
      .eq('depends_on_task_id', completedTaskId)
      .eq('dependency_type', 'blocking');
    if (!dependents?.length) return;
    for (const dep of dependents) {
      const { data: remaining } = await supabase
        .from('task_dependencies')
        .select('depends_on:tasks!task_dependencies_depends_on_task_id_fkey(status)')
        .eq('task_id', dep.task_id)
        .eq('dependency_type', 'blocking');
      const stillBlocked = (remaining || []).some(
        (r: any) => r.depends_on.status !== 'done' && r.depends_on.status !== 'approved'
      );
      if (!stillBlocked) {
        await supabase
          .from('tasks')
          .update({ status: 'to_do', prerequisite_completed: true })
          .eq('id', dep.task_id);
      }
    }
  } catch (err) {
    console.error('Error cascadeUnlockDependentTasks:', err);
  }
}

// =====================================================
// TASK HIERARCHY QUERIES
// =====================================================

/**
 * Get task hierarchy tree for a root task
 */
export async function getTaskHierarchy(
  rootTaskId: string
): Promise<{ data: TaskHierarchyTree | null; error: any }> {
  try {
    const supabase = await createClient();

    // Use database function to get hierarchy
    const { data, error } = await supabase.rpc('get_task_hierarchy', {
      root_task_id: rootTaskId,
    });

    if (error) throw error;

    // Build tree structure from flat list
    const tree = buildHierarchyTree(data);

    return { data: tree, error: null };
  } catch (error) {
    console.error('Error in getTaskHierarchy:', error);
    return { data: null, error };
  }
}

/**
 * Helper function to build tree from flat hierarchy data
 */
function buildHierarchyTree(flatData: any[]): TaskHierarchyTree | null {
  if (!flatData || flatData.length === 0) return null;

  const nodeMap = new Map<string, TaskHierarchyNode>();

  // Create nodes
  flatData.forEach((item) => {
    nodeMap.set(item.task_id, {
      task_id: item.task_id,
      parent_id: item.parent_id,
      title: item.title,
      status: item.status,
      hierarchy_level: item.hierarchy_level,
      sequence_order: item.sequence_order,
      path: item.path,
      children: [],
    });
  });

  // Build parent-child relationships
  let root: TaskHierarchyNode | null = null;
  let maxDepth = 0;
  let completedCount = 0;
  let blockedCount = 0;

  nodeMap.forEach((node) => {
    if (node.status === 'done' || node.status === 'approved') {
      completedCount++;
    }
    if (node.status === 'blocked') {
      blockedCount++;
    }
    maxDepth = Math.max(maxDepth, node.hierarchy_level);

    if (node.parent_id) {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      root = node;
    }
  });

  // Sort children by sequence_order
  nodeMap.forEach((node) => {
    if (node.children) {
      node.children.sort((a, b) => a.sequence_order - b.sequence_order);
    }
  });

  if (!root) return null;

  return {
    root,
    totalTasks: flatData.length,
    maxDepth,
    completedTasks: completedCount,
    blockedTasks: blockedCount,
  };
}

/**
 * Get root tasks (no parent) for a site
 */
export async function getRootTasks(siteId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('site_id', siteId)
      .is('parent_task_id', null)
      .order('sequence_order');

    if (error) throw error;

    return { data: data as Task[], error: null };
  } catch (error) {
    console.error('Error in getRootTasks:', error);
    return { data: null, error };
  }
}

/**
 * Get child tasks for a parent
 */
export async function getChildTasks(parentTaskId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .order('sequence_order');

    if (error) throw error;

    return { data: data as Task[], error: null };
  } catch (error) {
    console.error('Error in getChildTasks:', error);
    return { data: null, error };
  }
}

// =====================================================
// TASK DEPENDENCY QUERIES
// =====================================================

/**
 * Add a task dependency (prerequisite)
 */
export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  dependencyType: 'blocking' | 'suggested' = 'blocking'
) {
  try {
    const supabase = await createClient();
    if (taskId === dependsOnTaskId) {
      return { data: null, error: new Error('Task cannot depend on itself') };
    }

    const { data: allDeps, error: depsErr } = await supabase
      .from('task_dependencies')
      .select('*');
    if (depsErr) throw depsErr;

    const duplicate = allDeps?.find(
      (d: any) =>
        d.task_id === taskId &&
        d.depends_on_task_id === dependsOnTaskId &&
        d.dependency_type === dependencyType
    );
    if (duplicate) {
      return { data: null, error: new Error('Duplicate dependency exists') };
    }

    if (wouldCreateDependencyCycle(taskId, dependsOnTaskId, allDeps || [])) {
      return { data: null, error: new Error('Adding this dependency would create a cycle') };
    }

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
        dependency_type: dependencyType,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: data as TaskDependency, error: null };
  } catch (error) {
    console.error('Error in addTaskDependency:', error);
    return { data: null, error };
  }
}

/**
 * Remove a task dependency
 */
export async function removeTaskDependency(dependencyId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('id', dependencyId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in removeTaskDependency:', error);
    return { success: false, error };
  }
}

/**
 * Check if all prerequisites are completed
 */
export async function checkPrerequisites(
  taskId: string
): Promise<{ data: PrerequisiteCheck | null; error: any }> {
  try {
    const supabase = await createClient();

    // Use database function
    const { data: allCompleted, error: checkError } = await supabase.rpc(
      'check_task_prerequisites',
      {
        check_task_id: taskId,
      }
    );

    if (checkError) throw checkError;

    // Get incomplete prerequisites details
    const { data: dependencies, error: depsError } = await supabase
      .from('task_dependencies')
      .select(
        `
        depends_on_task_id,
        depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)
      `
      )
      .eq('task_id', taskId)
      .eq('dependency_type', 'blocking');

    if (depsError) throw depsError;

    const incompletePrerequisites = (dependencies || [])
      .filter(
        (dep: any) =>
          dep.depends_on?.status !== 'done' &&
          dep.depends_on?.status !== 'approved'
      )
      .map((dep: any) => ({
        id: dep.depends_on.id,
        title: dep.depends_on.title,
        status: dep.depends_on.status,
      }));

    return {
      data: {
        task_id: taskId,
        all_completed: allCompleted,
        incomplete_prerequisites: incompletePrerequisites,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in checkPrerequisites:', error);
    return { data: null, error };
  }
}

// Expanded task retrieval with optional evidence decompression
export async function getTaskByIdExpanded(
  taskId: string,
  options?: { decompress?: boolean }
) {
  const base = await getTaskById(taskId);
  if (base.error || !base.data) return base;
  const task = base.data;
  if (options?.decompress) {
    task.evidence = task.evidence.map((e) => {
      if (e.compressed && e.compressionType && e.value && typeof e.value === 'string') {
        const result = decompressEvidence(e.value, e.compressionType);
        if (result.success) {
          const data = typeof result.data === 'string' ? result.data : '[binary]';
          return { ...e, value: data };
        }
      }
      return e;
    });
  }
  return { data: task, error: null };
}

export async function createNextRecurrenceInstance(taskId: string) {
  try {
    const supabase = await createClient();
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    if (fetchError) throw fetchError;
    if (!task.recurring_pattern || !task.recurring_config) {
      return { data: null, error: new Error('Task is not recurring') };
    }
    const next = generateNextRecurrenceInstances(task as Task, 1)[0];
    if (!next) {
      return { data: null, error: new Error('No future recurrence generated') };
    }
    const { data: newTask, error: createError } = await supabase
      .from('tasks')
      .insert({
        organization_id: task.organization_id,
        site_id: task.site_id,
        sop_template_id: task.sop_template_id,
        title: task.title,
        description: task.description,
        status: 'to_do',
        priority: task.priority,
        parent_task_id: task.parent_task_id,
        sequence_order: task.sequence_order + 1,
        hierarchy_level: task.hierarchy_level,
        due_date: next.dueDate,
        recurring_pattern: task.recurring_pattern,
        recurring_config: task.recurring_config,
        schedule_mode: task.schedule_mode,
        created_by: task.created_by,
        current_step_index: 0,
        evidence: [],
        evidence_compressed: false,
        prerequisite_completed: false,
      })
      .select()
      .single();
    if (createError) throw createError;
    return { data: newTask as Task, error: null };
  } catch (error) {
    console.error('Error in createNextRecurrenceInstance:', error);
    return { data: null, error };
  }
}

/**
 * Get all dependencies for a task
 */
export async function getTaskDependencies(taskId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('task_dependencies')
      .select(
        `
        *,
        depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status, priority)
      `
      )
      .eq('task_id', taskId);

    if (error) throw error;

    return { data: data as TaskDependency[], error: null };
  } catch (error) {
    console.error('Error in getTaskDependencies:', error);
    return { data: null, error };
  }
}

// Update compression metadata for a task step (task_steps table)
export async function updateTaskStepCompression(
  taskStepId: string,
  metadata: {
    evidence_compressed: boolean;
    evidence_compression_type: string | null;
    original_evidence_size?: number | null;
    compressed_evidence_size?: number | null;
  }
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('task_steps')
      .update(metadata)
      .eq('id', taskStepId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error in updateTaskStepCompression:', error);
    return { data: null, error };
  }
}

// Set dependency type (e.g. suggested -> blocking)
export async function setDependencyType(
  dependencyId: string,
  newType: 'blocking' | 'suggested'
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('task_dependencies')
      .update({ dependency_type: newType })
      .eq('id', dependencyId)
      .select()
      .single();
    if (error) throw error;
    return { data: data as TaskDependency, error: null };
  } catch (error) {
    console.error('Error in setDependencyType:', error);
    return { data: null, error };
  }
}

export async function promoteSuggestedDependency(dependencyId: string) {
  return setDependencyType(dependencyId, 'blocking');
}

export async function getBlockingStatus(taskId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('task_dependencies')
      .select(
        `*, depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)`
      )
      .eq('task_id', taskId)
      .eq('dependency_type', 'blocking');
    if (error) throw error;
    const incomplete = (data || []).filter(
      (d: any) => d.depends_on?.status !== 'done' && d.depends_on?.status !== 'approved'
    );
    return {
      data: {
        task_id: taskId,
        blocked: incomplete.length > 0,
        incomplete_prerequisites: incomplete.map((d: any) => ({
          id: d.depends_on.id,
          title: d.depends_on.title,
          status: d.depends_on.status,
        })),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getBlockingStatus:', error);
    return { data: null, error };
  }
}
