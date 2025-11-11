/**
 * TagoIO Telemetry Polling Cron Endpoint
 * 
 * Vercel Cron job that polls TagoIO devices every 60 seconds
 * to fetch environmental sensor data and store in database.
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
 * - TAGOIO_DEVICE_TOKEN: TagoIO device authentication token
 * - CRON_SECRET: Secret key to authenticate cron requests
 */

import { NextResponse } from 'next/server'
import { pollDevices } from '@/lib/tagoio/polling-service'

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
    const result = await pollDevices()

    // Log summary
    const duration = Date.now() - startTime
    console.log(
      `Polling complete: ${result.successfulPolls}/${result.podsPolled} successful, ` +
      `${result.totalInserted} readings inserted in ${duration}ms`
    )

    if (result.errors.length > 0) {
      console.error('Polling errors:', result.errors)
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
