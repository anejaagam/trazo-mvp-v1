import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processStageAdvancements } from '@/lib/recipes/stage-advancement-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized recipe stage advancement request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials for cron job')
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const result = await processStageAdvancements(supabase)

    if (result.errors.length > 0) {
      console.warn('Recipe stage advancement completed with warnings', result)
    } else {
      console.log('Recipe stage advancement completed successfully', result)
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Recipe stage advancement cron failed:', message)
    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
