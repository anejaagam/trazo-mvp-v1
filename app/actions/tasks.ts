'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { 
  createTask,
  startTask,
  completeTask,
  getTaskById,
  updateTask
} from '@/lib/supabase/queries/workflows';
import { Task, TaskEvidence, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/types/workflow';

/**
 * Create a new task from a template
 */
export async function createTaskAction(taskData: CreateTaskInput) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'task:create').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    const result = await createTask(taskData);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath('/dashboard/workflows');
    revalidatePath('/dashboard/workflows/tasks');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in createTaskAction:', error);
    return { error: 'Failed to create task' };
  }
}

/**
 * Start a task
 */
export async function startTaskAction(taskId: string) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'task:update').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    const result = await startTask(taskId);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath('/dashboard/workflows');
    revalidatePath(`/dashboard/workflows/tasks/${taskId}`);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in startTaskAction:', error);
    return { error: 'Failed to start task' };
  }
}

/**
 * Complete a task with evidence
 */
export async function completeTaskAction(taskId: string, evidence: TaskEvidence[], completionNotes?: string) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'task:complete').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    const result = await completeTask(taskId, evidence, completionNotes);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath('/dashboard/workflows');
    revalidatePath(`/dashboard/workflows/tasks/${taskId}`);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in completeTaskAction:', error);
    return { error: 'Failed to complete task' };
  }
}

/**
 * Save task progress (draft) with evidence
 */
export async function saveTaskProgressAction(
  taskId: string, 
  evidence: TaskEvidence[], 
  currentStepIndex: number
) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'task:update').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      current_step_index: currentStepIndex,
      evidence: evidence,
      status: 'in_progress'
    };

    const result = await updateTask(updateInput);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath(`/dashboard/workflows/tasks/${taskId}`);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in saveTaskProgressAction:', error);
    return { error: 'Failed to save progress' };
  }
}

/**
 * Update task status
 */
export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'task:update').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      status
    };

    const result = await updateTask(updateInput);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath('/dashboard/workflows');
    revalidatePath(`/dashboard/workflows/tasks/${taskId}`);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in updateTaskStatusAction:', error);
    return { error: 'Failed to update task status' };
  }
}

/**
 * Assign task to a user
 */
export async function assignTaskAction(taskId: string, assignedTo: string) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions (task:assign permission)
  if (!canPerformAction(userData.role, 'task:assign').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      assigned_to: assignedTo
    };

    const result = await updateTask(updateInput);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath('/dashboard/workflows');
    revalidatePath(`/dashboard/workflows/tasks/${taskId}`);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in assignTaskAction:', error);
    return { error: 'Failed to assign task' };
  }
}
