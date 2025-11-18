/**
 * Alarm Evaluation Cron Job
 * 
 * Evaluates all pods with recent telemetry against alarm policies
 * Creates new alarms for threshold violations
 * Auto-resolves normalized conditions
 * 
 * Schedule: Every 1 minute (Vercel Cron)
 * Created: November 15, 2025
 * Phase: 14A - Core Alarms Implementation
 */

import { NextResponse } from 'next/server';
import { evaluateAllPods } from '@/lib/monitoring/alarm-evaluator';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

/**
 * GET /api/cron/evaluate-alarms
 * 
 * Evaluates telemetry readings against alarm policies
 * Protected by Vercel Cron secret
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized alarm evaluation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔔 Starting alarm evaluation...');
    const startTime = Date.now();
    
    // Evaluate all pods with telemetry in last 5 minutes
    const result = await evaluateAllPods(5);
    
    const duration = Date.now() - startTime;
    
    console.log(`✓ Alarm evaluation complete in ${duration}ms:`);
    console.log(`  - Pods evaluated: ${result.podsEvaluated}`);
    console.log(`  - Alarms created: ${result.alarmsCreated}`);
    console.log(`  - Alarms resolved: ${result.alarmsResolved}`);
    
    if (result.errors.length > 0) {
      console.error(`  - Errors: ${result.errors.length}`);
      result.errors.forEach((err) => console.error(`    - ${err}`));
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      ...result,
    });
  } catch (error) {
    console.error('Error in alarm evaluation cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
