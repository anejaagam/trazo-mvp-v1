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
} from '@/types/workflow';

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

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...input,
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

    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        completion_notes: completionNotes,
        actual_duration_minutes: actualDurationMinutes,
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return { data: data as Task, error: null };
  } catch (error) {
    console.error('Error in completeTask:', error);
    return { data: null, error };
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
