import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { advanceRecipeStageForBatch } from '@/lib/recipes/recipe-sync'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchId, userId } = body || {}

    if (!batchId || !userId) {
      return NextResponse.json({ error: 'batchId and userId are required' }, { status: 400 })
    }

    const supabase = createServiceClient('US')
    const result = await advanceRecipeStageForBatch({
      supabase,
      batchId,
      userId,
    })

    return NextResponse.json({ success: result.advanced })
  } catch (error) {
    console.error('advance-stage route error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
