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
    // Get current task to check workflow enforcement
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('status, requires_execution')
      .eq('id', taskId)
      .single();

    if (!currentTask) {
      return { error: 'Task not found' };
    }

    // Enforce workflow if task requires execution
    if (currentTask.requires_execution) {
      // Cannot move to in_progress without executing first
      if (status === 'in_progress' && currentTask.status === 'to_do') {
        return { error: 'This task must be executed before starting. Click "Execute Task" first.' };
      }
      
      // Cannot move to done without being in progress
      if (status === 'done' && currentTask.status !== 'in_progress') {
        return { error: 'Task must be in progress before completing. Start the task first.' };
      }
      
      // Cannot move to blocked from to_do (must start first)
      if (status === 'blocked' && currentTask.status === 'to_do') {
        return { error: 'Task must be started before it can be blocked.' };
      }
    }

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

/**
 * Approve a task that's awaiting approval
 */
export async function approveTaskAction(taskId: string, approvalNotes?: string) {
  const supabase = await createClient();
  
  console.log(`[approveTaskAction] Starting approval for task ${taskId}`);
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[approveTaskAction] Error: Unauthorized - no user');
    return { error: 'Unauthorized' };
  }

  console.log(`[approveTaskAction] User: ${user.id}`);

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    console.log('[approveTaskAction] Error: User not found in users table');
    return { error: 'User not found' };
  }

  console.log(`[approveTaskAction] User role: ${userData.role}`);

  // Check basic permissions - require task:update permission
  if (!canPerformAction(userData.role, 'task:update').allowed) {
    console.log('[approveTaskAction] Error: Permission denied');
    return { error: 'Permission denied - insufficient permissions to approve tasks' };
  }

  try {
    // Verify task is in awaiting_approval status and get approval_role
    const { data: task } = await supabase
      .from('tasks')
      .select('status, approval_role, title')
      .eq('id', taskId)
      .single();

    if (!task) {
      console.log('[approveTaskAction] Error: Task not found');
      return { error: 'Task not found' };
    }

    console.log(`[approveTaskAction] Task "${task.title}" current status: ${task.status}`);

    if (task.status !== 'awaiting_approval') {
      console.log(`[approveTaskAction] Error: Task status is ${task.status}, not awaiting_approval`);
      return { error: 'Task is not awaiting approval' };
    }

    // Check if user's role can approve this task
    // Import ROLE_RANK to compare role hierarchy
    const { ROLE_RANK } = await import('@/lib/rbac/hierarchy');
    const userRank = ROLE_RANK[userData.role as keyof typeof ROLE_RANK] ?? 0;
    const requiredRank = task.approval_role 
      ? (ROLE_RANK[task.approval_role as keyof typeof ROLE_RANK] ?? 0)
      : 0;

    // User must have equal or higher rank than the required approval role
    if (task.approval_role && userRank < requiredRank) {
      console.log(`[approveTaskAction] Error: User rank ${userRank} < required rank ${requiredRank}`);
      return { 
        error: `Permission denied - this task requires approval by ${task.approval_role.replace(/_/g, ' ')} or higher` 
      };
    }

    // Update task to approved status
    const updateData = {
      status: 'approved' as const,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      completion_notes: approvalNotes || null
    };
    
    console.log(`[approveTaskAction] Updating task with:`, updateData);

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('[approveTaskAction] Database error:', error);
      throw error;
    }

    console.log(`[approveTaskAction] Task updated successfully. New status: ${updatedTask?.status}`);

    // Cascade unlock dependent tasks
    const { cascadeUnlockDependentTasks } = await import('@/lib/supabase/queries/workflows');
    await cascadeUnlockDependentTasks(taskId);

    revalidatePath('/dashboard/workflows');
    revalidatePath(`/dashboard/workflows/tasks/${taskId}`);
    
    console.log(`[approveTaskAction] Success! Task ${taskId} approved`);
    return { success: true };
  } catch (error) {
    console.error('[approveTaskAction] Error:', error);
    return { error: 'Failed to approve task' };
  }
}

/**
 * Reject a task that's awaiting approval
 */
export async function rejectTaskAction(taskId: string, rejectionReason: string) {
  const supabase = await createClient();
  
  console.log(`[rejectTaskAction] Starting rejection for task ${taskId}`);
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[rejectTaskAction] Error: Unauthorized - no user');
    return { error: 'Unauthorized' };
  }

  console.log(`[rejectTaskAction] User: ${user.id}`);

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    console.log('[rejectTaskAction] Error: User not found in users table');
    return { error: 'User not found' };
  }

  console.log(`[rejectTaskAction] User role: ${userData.role}`);

  // Check permissions - require task:update permission (managers and above)
  if (!canPerformAction(userData.role, 'task:update').allowed) {
    console.log('[rejectTaskAction] Error: Permission denied');
    return { error: 'Permission denied - insufficient permissions to reject tasks' };
  }

  if (!rejectionReason?.trim()) {
    console.log('[rejectTaskAction] Error: No rejection reason provided');
    return { error: 'Rejection reason is required' };
  }

  try {
    // Verify task is in awaiting_approval status and get approval_role
    const { data: task } = await supabase
      .from('tasks')
      .select('status, title, completion_notes, approval_role')
      .eq('id', taskId)
      .single();

    if (!task) {
      console.log('[rejectTaskAction] Error: Task not found');
      return { error: 'Task not found' };
    }

    console.log(`[rejectTaskAction] Task "${task.title}" current status: ${task.status}`);

    if (task.status !== 'awaiting_approval') {
      console.log(`[rejectTaskAction] Error: Task status is ${task.status}, not awaiting_approval`);
      return { error: 'Task is not awaiting approval' };
    }

    // Check if user's role can reject this task (same permission as approve)
    const { ROLE_RANK } = await import('@/lib/rbac/hierarchy');
    const userRank = ROLE_RANK[userData.role as keyof typeof ROLE_RANK] ?? 0;
    const requiredRank = task.approval_role 
      ? (ROLE_RANK[task.approval_role as keyof typeof ROLE_RANK] ?? 0)
      : 0;

    // User must have equal or higher rank than the required approval role
    if (task.approval_role && userRank < requiredRank) {
      console.log(`[rejectTaskAction] Error: User rank ${userRank} < required rank ${requiredRank}`);
      return { 
        error: `Permission denied - this task requires rejection by ${task.approval_role.replace(/_/g, ' ')} or higher` 
      };
    }

    // Update task to rejected status
    const updateData = {
      status: 'rejected' as const,
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
      rejection_reason: rejectionReason,
      completion_notes: task.completion_notes 
        ? `${task.completion_notes}\n\n--- REJECTED ---\nReason: ${rejectionReason}`
        : `--- REJECTED ---\nReason: ${rejectionReason}`
    };
    
    console.log(`[rejectTaskAction] Updating task with:`, { ...updateData, completion_notes: '[truncated]' });

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('[rejectTaskAction] Database error:', error);
      throw error;
    }

    console.log(`[rejectTaskAction] Task updated successfully. New status: ${updatedTask?.status}`);

    revalidatePath('/dashboard/workflows');
    revalidatePath(`/dashboard/workflows/tasks/${taskId}`);
    
    console.log(`[rejectTaskAction] Success! Task ${taskId} rejected`);
    return { success: true };
  } catch (error) {
    console.error('[rejectTaskAction] Error:', error);
    return { error: 'Failed to reject task' };
  }
}
