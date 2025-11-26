import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelProduction } from '@/lib/compliance/metrc/sync/production-batch-sync'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productionBatchId, cancellationReason, cancelledAt } = body

    // Validate required fields
    if (!productionBatchId || !cancellationReason) {
      return NextResponse.json(
        {
          error: 'Missing required fields: productionBatchId, cancellationReason',
        },
        { status: 400 }
      )
    }

    // Use current time if not provided
    const cancelTime = cancelledAt || new Date().toISOString()

    // Cancel production
    const result = await cancelProduction({
      productionBatchId,
      cancellationReason,
      cancelledAt: cancelTime,
      userId: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to cancel production',
          details: result.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      productionBatchId: result.productionBatchId,
      batchNumber: result.batchNumber,
      warnings: result.warnings,
      message: 'Production cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel production error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
