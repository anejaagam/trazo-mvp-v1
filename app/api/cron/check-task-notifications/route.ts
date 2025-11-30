import { NextRequest, NextResponse } from 'next/server'
import { checkTaskNotifications } from '@/app/actions/task-notifications'

/**
 * Cron endpoint to check for overdue and due-soon tasks
 * This should be called periodically (e.g., every hour via Vercel Cron or external service)
 * 
 * To set up with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-task-notifications",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('[CRON] Running task notification check...')
    
    // Check for overdue and due-soon tasks
    const result = await checkTaskNotifications()
    
    console.log('[CRON] Task notification check complete:', result)
    
    return NextResponse.json({
      ...result,
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[CRON] Error checking task notifications:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
