/**
 * Overdue Task Checker Cron Job
 *
 * Checks for overdue tasks and creates alarms for them
 * Sends notifications to assigned users
 *
 * Schedule: Every hour (Vercel Cron)
 * Created: Phase 1 - Alarms & Notifications v2
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

/**
 * GET /api/cron/check-overdue-tasks
 *
 * Checks for overdue tasks and creates alarms
 * Protected by Vercel Cron secret
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Query for overdue tasks that don't already have an alarm
    const { data: overdueTasks, error: queryError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        assigned_to,
        batch_id,
        users!tasks_assigned_to_fkey (
          id,
          organization_id
        ),
        batches (
          pod_id
        )
      `)
      .lt('due_date', now)
      .in('status', ['pending', 'in_progress'])
      .is('completed_at', null) as any;

    if (queryError) {
      console.error('Error querying overdue tasks:', queryError);
      return NextResponse.json(
        { error: 'Failed to query overdue tasks', details: queryError.message },
        { status: 500 }
      );
    }

    let alarmsCreated = 0;
    let notificationsSent = 0;
    let dueSoonNotificationsSent = 0;
    const errors: string[] = [];

    // Check for tasks due soon (within 24 hours)
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    
    const { data: dueSoonTasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, assigned_to, users!tasks_assigned_to_fkey(organization_id)')
      .not('status', 'in', '(done,cancelled)')
      .not('assigned_to', 'is', null)
      .gte('due_date', now)
      .lte('due_date', tomorrow.toISOString()) as any;
    
    // Send notifications for tasks due soon
    for (const task of dueSoonTasks || []) {
      try {
        // Check if notification already sent today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', task.assigned_to)
          .eq('category', 'task')
          .contains('message', task.title)
          .gte('created_at', todayStart.toISOString())
          .single();
        
        if (!existingNotif) {
          const organizationId = Array.isArray(task.users) 
            ? task.users[0]?.organization_id 
            : task.users?.organization_id;
            
          if (organizationId) {
            await supabase.from('notifications').insert({
              user_id: task.assigned_to,
              organization_id: organizationId,
              channel: 'in-app',
              message: `Task "${task.title}" is due soon`,
              status: 'sent',
              category: 'task',
              urgency: 'medium',
              metadata: { task_id: task.id },
            });
            dueSoonNotificationsSent++;
          }
        }
      } catch (err) {
        errors.push(`Failed to send due-soon notification for task ${task.id}`);
      }
    }

    for (const task of overdueTasks || []) {
      try {
        // Check if an alarm already exists for this task
        const { data: existingAlarms } = await supabase
          .from('alarms')
          .select('id')
          .eq('alarm_type', 'task_overdue')
          .is('resolved_at', null)
          .contains('message', task.title)
          .limit(1);

        // Skip if alarm already exists
        if (existingAlarms && existingAlarms.length > 0) {
          continue;
        }

        const podId = Array.isArray(task.batches) ? task.batches[0]?.pod_id : task.batches?.pod_id;
        const organizationId = Array.isArray(task.users) ? task.users[0]?.organization_id : task.users?.organization_id;

        if (!podId) {
          errors.push(`Task ${task.id} has no associated pod`);
          continue;
        }

        // Create alarm
        const { data: alarm, error: alarmError } = await supabase
          .from('alarms')
          .insert({
            pod_id: podId,
            alarm_type: 'task_overdue',
            severity: 'warning',
            message: `Task "${task.title}" is overdue`,
            batch_id: task.batch_id,
          })
          .select()
          .single();

        if (alarmError) {
          errors.push(`Failed to create alarm for task ${task.id}: ${alarmError.message}`);
          continue;
        }

        alarmsCreated++;

        // Send notification to assigned user if available
        if (task.assigned_to && organizationId) {
          // Check if notification already sent today for this task
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', task.assigned_to)
            .eq('category', 'task')
            .contains('message', task.title)
            .gte('created_at', todayStart.toISOString())
            .single();
          
          if (!existingNotif) {
            const { error: notifError } = await supabase.from('notifications').insert({
              user_id: task.assigned_to,
              organization_id: organizationId,
              channel: 'in-app',
              message: `Task "${task.title}" is overdue`,
              status: 'sent',
              category: 'task',
              urgency: 'high',
              metadata: { task_id: task.id },
            });

            if (notifError) {
              errors.push(`Failed to send notification for task ${task.id}: ${notifError.message}`);
            } else {
              notificationsSent++;
            }
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Error processing task ${task.id}: ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      tasksChecked: overdueTasks?.length || 0,
      dueSoonTasksChecked: dueSoonTasks?.length || 0,
      alarmsCreated,
      notificationsSent,
      dueSoonNotificationsSent,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error in check-overdue-tasks cron:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
