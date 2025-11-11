/**
 * Daily Telemetry Aggregation Cron Job
 * 
 * Runs once per day to aggregate hourly data into daily statistics.
 * Vercel Cron configuration in vercel.json
 * 
 * Created: November 10, 2025
 */

import { NextResponse } from 'next/server'
import { runDailyAggregation } from '@/lib/monitoring/aggregation-service'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max execution

/**
 * Vercel Cron Job - Daily Aggregation
 * 
 * This endpoint is triggered by Vercel Cron once per day (typically at 00:00 UTC).
 * Protected by authorization header check.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized aggregation request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('📅 Starting daily telemetry aggregation...')

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Run aggregation
    const result = await runDailyAggregation(supabase)

    // Log results
    console.log(`✅ Daily aggregation complete:`)
    console.log(`   - Days aggregated: ${result.dailyAggregated}`)
    console.log(`   - Pods processed: ${result.podsProcessed}`)
    console.log(`   - Duration: ${result.duration}ms`)
    
    if (result.errors.length > 0) {
      console.error(`⚠️  Errors encountered:`)
      result.errors.forEach(error => console.error(`   - ${error}`))
    }

    // Return success response
    return NextResponse.json({
      success: true,
      timestamp: result.timestamp,
      dailyAggregated: result.dailyAggregated,
      podsProcessed: result.podsProcessed,
      duration: result.duration,
      errors: result.errors,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Daily aggregation failed:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
