import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeProduction } from '@/lib/compliance/metrc/sync/production-batch-sync'

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
    const {
      productionBatchId,
      completedAt,
      actualYield,
      actualYieldUnit,
      yieldVarianceReason,
      outputs,
    } = body

    // Validate required fields
    if (!productionBatchId || !completedAt || actualYield === undefined || !actualYieldUnit) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: productionBatchId, completedAt, actualYield, actualYieldUnit',
        },
        { status: 400 }
      )
    }

    if (!outputs || !Array.isArray(outputs) || outputs.length === 0) {
      return NextResponse.json(
        { error: 'outputs must be a non-empty array of output products' },
        { status: 400 }
      )
    }

    // Validate each output has required fields
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i]
      if (!output.productName || !output.productType || !output.quantity || !output.unitOfMeasure) {
        return NextResponse.json(
          {
            error: `Output at index ${i} missing required fields: productName, productType, quantity, unitOfMeasure`,
          },
          { status: 400 }
        )
      }
    }

    // Complete production
    const result = await completeProduction({
      productionBatchId,
      completedAt,
      actualYield,
      actualYieldUnit,
      yieldVarianceReason,
      outputs,
      userId: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to complete production',
          details: result.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      productionBatchId: result.productionBatchId,
      batchNumber: result.batchNumber,
      outputsCreated: outputs.length,
      warnings: result.warnings,
      message: 'Production completed successfully',
    })
  } catch (error) {
    console.error('Complete production error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
