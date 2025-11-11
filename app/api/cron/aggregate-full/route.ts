/**
 * Full Telemetry Aggregation & Cleanup Cron Job
 * 
 * Runs complete aggregation process: hourly + daily + cleanup
 * Can be used as alternative to separate cron jobs
 * 
 * Created: November 10, 2025
 */

import { NextResponse } from 'next/server'
import { runFullAggregation } from '@/lib/monitoring/aggregation-service'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120 // 120 seconds max execution for full process

/**
 * Vercel Cron Job - Full Aggregation
 * 
 * This endpoint runs the complete aggregation process.
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

    console.log('🚀 Starting full telemetry aggregation process...')

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Run full aggregation
    const result = await runFullAggregation(supabase)

    // Log comprehensive results
    console.log(`✅ Full aggregation complete:`)
    console.log(`   - Hourly aggregated: ${result.hourly.hourlyAggregated} hours`)
    console.log(`   - Daily aggregated: ${result.daily.dailyAggregated} days`)
    console.log(`   - Cleaned up: ${result.cleanupDeleted} rows`)
    console.log(`   - Total duration: ${result.totalDuration}ms`)
    
    const totalErrors = [...result.hourly.errors, ...result.daily.errors]
    if (totalErrors.length > 0) {
      console.error(`⚠️  Errors encountered:`)
      totalErrors.forEach(error => console.error(`   - ${error}`))
    }

    // Return success response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      hourlyAggregated: result.hourly.hourlyAggregated,
      dailyAggregated: result.daily.dailyAggregated,
      cleanupDeleted: result.cleanupDeleted,
      totalDuration: result.totalDuration,
      errors: totalErrors,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Full aggregation failed:', errorMessage)

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
