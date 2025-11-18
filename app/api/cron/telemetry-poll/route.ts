/**
 * TagoIO Telemetry Polling Cron Endpoint
 * 
 * Vercel Cron job that polls TagoIO devices every minute
 * to fetch environmental sensor data and store in database.
 * 
 * Uses service role client to bypass RLS and access all pods.
 * 
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/telemetry-poll",
 *     "schedule": "* * * * *"
 *   }]
 * }
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for database access
 * - CRON_SECRET: Secret key to authenticate cron requests
 */

import { NextResponse } from 'next/server'
import { TagoIOPollingService } from '@/lib/tagoio/polling-service'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { evaluateAllPods } from '@/lib/monitoring/alarm-evaluator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET handler for Vercel Cron
 * 
 * Vercel will call this endpoint on the configured schedule.
 * Returns summary of polling operation.
 */
export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (!authHeader || authHeader !== expectedAuth) {
      console.warn('Unauthorized cron request attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Poll all devices (tokens fetched from database)
    console.log('Starting TagoIO telemetry poll...')
    
    // Create service role client for database access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }
    
    const supabase = createServiceClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const service = new TagoIOPollingService(supabase)
    const result = await service.pollAllDevices()

    // Log summary
    const duration = Date.now() - startTime
    console.log(
      `Polling complete: ${result.successfulPolls}/${result.podsPolled} successful, ` +
      `${result.totalInserted} readings inserted in ${duration}ms`
    )

    if (result.errors.length > 0) {
      console.error('Polling errors:', result.errors)
    }

    // Evaluate alarms after successful telemetry insert
    let alarmResult;
    if (result.totalInserted > 0) {
      console.log('Evaluating alarms for updated pods...');
      alarmResult = await evaluateAllPods(2); // Look back 2 minutes
      console.log(
        `Alarm evaluation: ${alarmResult.alarmsCreated} created, ` +
        `${alarmResult.alarmsResolved} resolved`
      );
    }

    // Return summary
    return NextResponse.json({
      success: result.failedPolls === 0,
      timestamp: result.timestamp,
      summary: {
        podsPolled: result.podsPolled,
        successfulPolls: result.successfulPolls,
        failedPolls: result.failedPolls,
        dataPointsReceived: result.totalDataPoints,
        readingsTransformed: result.totalReadings,
        readingsInserted: result.totalInserted,
        alarmsCreated: alarmResult?.alarmsCreated || 0,
        alarmsResolved: alarmResult?.alarmsResolved || 0,
      },
      duration: result.duration,
      errors: result.errors.length > 0 ? result.errors : undefined,
      devices: result.devices.map((d) => ({
        podName: d.podName,
        success: d.success,
        dataPoints: d.dataPointsReceived,
        inserted: d.readingsInserted,
        duration: d.duration,
        errors: d.errors.length > 0 ? d.errors : undefined,
      })),
    })

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    console.error('Cron job failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        duration,
      },
      { status: 500 }
    )
  }
}
