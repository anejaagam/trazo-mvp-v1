'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import {
  createTask,
  startTask,
  completeTask,
  updateTask,
  addTaskDependency,
  deleteTask,
} from '@/lib/supabase/queries/workflows';
import { TaskEvidence, CreateTaskRequest, UpdateTaskInput, TaskStatus } from '@/types/workflow';
import { notifyTaskAssignment } from './notifications';
import { createTaskNotification } from './task-notifications';

/**
 * Create a new task from a template
 */
export async function createTaskAction(taskData: CreateTaskRequest) {
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
    const { dependencies, ...taskPayload } = taskData;
    const result = await createTask(taskPayload);

    if (result.error) {
      return { error: result.error };
    }

    const newTask = result.data;

    if (newTask && dependencies) {
      const dependencyErrors: string[] = [];

      for (const blockingId of dependencies.blocking || []) {
        const depResult = await addTaskDependency(newTask.id, blockingId, 'blocking');
        if (depResult.error) {
          dependencyErrors.push(
            depResult.error instanceof Error ? depResult.error.message : 'Failed to add blocking dependency'
          );
          break;
        }
      }

      if (dependencyErrors.length === 0) {
        for (const suggestedId of dependencies.suggested || []) {
          const depResult = await addTaskDependency(newTask.id, suggestedId, 'suggested');
          if (depResult.error) {
            dependencyErrors.push(
              depResult.error instanceof Error ? depResult.error.message : 'Failed to add suggested dependency'
            );
            break;
          }
        }
      }

      if (dependencyErrors.length > 0) {
        await deleteTask(newTask.id);
        return { error: dependencyErrors[0] };
      }
    }

    // Create notification if task is assigned
    if (newTask && taskPayload.assigned_to) {
      await createTaskNotification(
        taskPayload.assigned_to,
        newTask.id,
        `New task assigned: "${newTask.title}"`,
        'task',
        taskPayload.priority === 'critical' || taskPayload.priority === 'high' ? 'high' : 'medium'
      );
    }

    revalidatePath('/dashboard/workflows');
    revalidatePath('/dashboard/workflows/tasks');
    return { success: true, data: newTask };
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

    // If task is marked as done or cancelled, mark related notifications as read
    if (status === 'done' || status === 'cancelled') {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('category', 'task')
        .contains('metadata', JSON.stringify({ task_id: taskId }))
        .is('read_at', null);
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
    .select('role, organization_id')
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
    // Fetch task details to get title and due date
    const { data: taskData } = await supabase
      .from('tasks')
      .select('title, due_date')
      .eq('id', taskId)
      .single();

    const updateInput: UpdateTaskInput = {
      id: taskId,
      assigned_to: assignedTo
    };

    const result = await updateTask(updateInput);

    if (result.error) {
      return { error: result.error };
    }

    // Send notification to assigned user
    if (taskData) {
      await notifyTaskAssignment({
        userId: assignedTo,
        organizationId: userData.organization_id,
        taskTitle: taskData.title,
        dueDate: taskData.due_date,
        taskId,
        urgency: 'medium',
      });
    }

    revalidatePath('/dashboard/workflows');
    revalidatePath(`/dashboard/workflows/tasks/${taskId}`);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in assignTaskAction:', error);
    return { error: 'Failed to assign task' };
  }
}
