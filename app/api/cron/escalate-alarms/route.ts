/**
 * Alarm Escalation Cron Job
 *
 * Automatically escalates unacknowledged critical alarms after escalation delay
 * Runs every 15 minutes
 *
 * ISA-18.2 Requirement: Critical alarms must escalate if not acknowledged
 *
 * Created: 2025-11-17
 * Phase: Alarm System Enhancements
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/app/actions/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Verify authorization (CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Escalate Alarms] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Escalation configuration
    const ESCALATION_DELAY_MINUTES = 15; // Escalate after 15 minutes
    const escalationCutoff = new Date(Date.now() - ESCALATION_DELAY_MINUTES * 60 * 1000).toISOString();

    console.log('[Escalate Alarms] Starting escalation check...');

    // Find unacknowledged critical/warning alarms older than escalation delay
    const { data: alarmsToEscalate, error: queryError } = await supabase
      .from('alarms')
      .select(`
        *,
        policy:alarm_policies(id, organization_id, expected_response_seconds),
        pod:pods!inner(
          id,
          name,
          room:rooms!inner(
            id,
            site:sites!inner(organization_id)
          )
        )
      `)
      .in('severity', ['critical', 'warning'])
      .is('acknowledged_at', null)
      .is('resolved_at', null)
      .lt('triggered_at', escalationCutoff);

    if (queryError) {
      console.error('[Escalate Alarms] Query error:', queryError);
      return NextResponse.json(
        { error: 'Database query failed', details: queryError.message },
        { status: 500 }
      );
    }

    if (!alarmsToEscalate || alarmsToEscalate.length === 0) {
      const duration = Date.now() - startTime;
      console.log(`[Escalate Alarms] ✓ No alarms need escalation (${duration}ms)`);
      return NextResponse.json({
        success: true,
        alarmsEscalated: 0,
        notificationsSent: 0,
        duration,
      });
    }

    console.log(`[Escalate Alarms] Found ${alarmsToEscalate.length} alarms to escalate`);

    let alarmsEscalated = 0;
    let notificationsSent = 0;
    const errors: string[] = [];

    for (const alarm of alarmsToEscalate) {
      try {
        const currentLevel = alarm.escalated_to_level || 1;
        const nextLevel = currentLevel + 1;

        // Get escalation routes for the next level
        const { data: routes } = await supabase
          .from('alarm_routes')
          .select('*, role:roles(name)')
          .eq('policy_id', alarm.policy_id)
          .eq('escalation_level', nextLevel)
          .eq('is_active', true);

        if (!routes || routes.length === 0) {
          // No escalation route configured for next level
          console.log(`[Escalate Alarms] ⚠️  No route for alarm ${alarm.id} level ${nextLevel}`);
          continue;
        }

        // Update alarm escalation level
        const { error: updateError } = await supabase
          .from('alarms')
          .update({
            escalated_to_level: nextLevel,
            escalated_at: new Date().toISOString(),
          })
          .eq('id', alarm.id);

        if (updateError) {
          errors.push(`Failed to escalate alarm ${alarm.id}: ${updateError.message}`);
          continue;
        }

        alarmsEscalated++;

        // Send notifications to users in escalation routes
        const organizationId = alarm.pod?.room?.site?.organization_id;

        for (const route of routes) {
          // Get users with this role in the organization
          const { data: users } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('organization_id', organizationId)
            .eq('role', route.role_id);

          if (users && users.length > 0) {
            for (const user of users) {
              // Send escalation notification
              const notifResult = await createNotification({
                userId: user.id,
                organizationId,
                message: `🚨 ESCALATED ALARM (Level ${nextLevel}): ${alarm.message}`,
                category: 'system',
                urgency: alarm.severity === 'critical' ? 'high' : 'medium',
                linkUrl: `/dashboard/alarms`,
                alarmId: alarm.id,
                channel: route.notification_channel || 'in_app',
              });

              if (notifResult.success) {
                notificationsSent++;
              } else {
                errors.push(`Failed to notify user ${user.id}: ${notifResult.error}`);
              }
            }
          }
        }

        console.log(`[Escalate Alarms] ✓ Escalated alarm ${alarm.id} to level ${nextLevel}`);
      } catch (alarmError) {
        console.error(`[Escalate Alarms] Error processing alarm ${alarm.id}:`, alarmError);
        errors.push(`Alarm ${alarm.id}: ${alarmError instanceof Error ? alarmError.message : 'Unknown error'}`);
      }
    }

    const duration = Date.now() - startTime;

    console.log(`[Escalate Alarms] ✓ Complete: ${alarmsEscalated} escalated, ${notificationsSent} notifications sent (${duration}ms)`);

    return NextResponse.json({
      success: true,
      alarmsEscalated,
      notificationsSent,
      errors: errors.length > 0 ? errors : undefined,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Escalate Alarms] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      },
      { status: 500 }
    );
  }
}
