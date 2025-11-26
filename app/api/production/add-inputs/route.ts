import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addInputPackages } from '@/lib/compliance/metrc/sync/production-batch-sync'

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
    const { productionBatchId, inputs } = body

    // Validate required fields
    if (!productionBatchId) {
      return NextResponse.json(
        { error: 'Missing required field: productionBatchId' },
        { status: 400 }
      )
    }

    if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
      return NextResponse.json(
        { error: 'inputs must be a non-empty array of package inputs' },
        { status: 400 }
      )
    }

    // Validate each input has required fields
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      if (!input.packageId || !input.quantityUsed || !input.unitOfMeasure) {
        return NextResponse.json(
          {
            error: `Input at index ${i} missing required fields: packageId, quantityUsed, unitOfMeasure`,
          },
          { status: 400 }
        )
      }
    }

    // Add input packages
    const result = await addInputPackages({
      productionBatchId,
      inputs,
      userId: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to add input packages',
          details: result.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      productionBatchId: result.productionBatchId,
      batchNumber: result.batchNumber,
      inputsAdded: inputs.length,
      warnings: result.warnings,
      message: 'Input packages added successfully',
    })
  } catch (error) {
    console.error('Add inputs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
