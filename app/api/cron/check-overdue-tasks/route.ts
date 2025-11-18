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
import { notifyTaskOverdue } from '@/app/actions/notifications';

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
    const errors: string[] = [];

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
          const notifyResult = await notifyTaskOverdue({
            userId: task.assigned_to,
            organizationId,
            taskTitle: task.title,
            taskId: task.id,
          });

          if (notifyResult.success) {
            notificationsSent++;
          } else {
            errors.push(`Failed to send notification for task ${task.id}: ${notifyResult.error}`);
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
      alarmsCreated,
      notificationsSent,
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
