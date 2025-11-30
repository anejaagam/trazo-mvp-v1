'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Create a notification for a user about a task
 */
export async function createTaskNotification(
  userId: string,
  taskId: string,
  message: string,
  category: 'task' = 'task',
  urgency: 'low' | 'medium' | 'high' = 'medium',
  organizationId?: string
) {
  try {
    const supabase = await createClient();

    // If organization_id not provided, fetch it from the user
    let orgId = organizationId;
    if (!orgId) {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userId)
        .single();
      orgId = userData?.organization_id;
    }

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      organization_id: orgId,
      channel: 'in-app',
      message,
      status: 'sent',
      category,
      urgency,
      metadata: { task_id: taskId },
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error creating task notification:', error);
    return { success: false, error };
  }
}

/**
 * Check for overdue and due soon tasks and create notifications
 */
export async function checkTaskNotifications() {
  try {
    const supabase = await createClient();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get overdue tasks (due date in past, status not done/cancelled)
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, assigned_to')
      .not('status', 'in', '(done,cancelled)')
      .not('assigned_to', 'is', null)
      .lt('due_date', now.toISOString())
      .order('due_date', { ascending: true });

    // Get tasks due soon (due within 24 hours)
    const { data: dueSoonTasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, assigned_to')
      .not('status', 'in', '(done,cancelled)')
      .not('assigned_to', 'is', null)
      .gte('due_date', now.toISOString())
      .lte('due_date', tomorrow.toISOString())
      .order('due_date', { ascending: true });

    // Create notifications for overdue tasks
    if (overdueTasks) {
      for (const task of overdueTasks) {
        if (!task.assigned_to) continue;

        // Check if notification already exists for this task today
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', task.assigned_to)
          .eq('metadata->>task_id', task.id)
          .gte('sent_at', new Date(now.setHours(0, 0, 0, 0)).toISOString())
          .single();

        if (!existingNotif) {
          await createTaskNotification(
            task.assigned_to,
            task.id,
            `Task "${task.title}" is overdue`,
            'task',
            'high'
          );
        }
      }
    }

    // Create notifications for tasks due soon
    if (dueSoonTasks) {
      for (const task of dueSoonTasks) {
        if (!task.assigned_to) continue;

        // Check if notification already exists for this task today
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', task.assigned_to)
          .eq('metadata->>task_id', task.id)
          .gte('sent_at', new Date(now.setHours(0, 0, 0, 0)).toISOString())
          .single();

        if (!existingNotif) {
          await createTaskNotification(
            task.assigned_to,
            task.id,
            `Task "${task.title}" is due soon`,
            'task',
            'medium'
          );
        }
      }
    }

    return {
      success: true,
      overdueCount: overdueTasks?.length || 0,
      dueSoonCount: dueSoonTasks?.length || 0,
    };
  } catch (error) {
    console.error('Error checking task notifications:', error);
    return { success: false, error };
  }
}
