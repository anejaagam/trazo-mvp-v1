import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProductionBatch } from '@/lib/compliance/metrc/sync/production-batch-sync'
import type { ProductionType } from '@/lib/compliance/metrc/validation/production-batch-rules'

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
      siteId,
      organizationId,
      productionType,
      startedAt,
      expectedYield,
      expectedYieldUnit,
      sourceHarvestId,
      recipeId,
      notes,
    } = body

    // Validate required fields
    if (!siteId || !organizationId || !productionType || !startedAt) {
      return NextResponse.json(
        {
          error: 'Missing required fields: siteId, organizationId, productionType, startedAt',
        },
        { status: 400 }
      )
    }

    // Validate production type
    const validTypes: ProductionType[] = [
      'processing',
      'extraction',
      'infusion',
      'packaging',
      'preroll',
      'other',
    ]
    if (!validTypes.includes(productionType)) {
      return NextResponse.json(
        { error: `Invalid production type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create production batch
    const result = await createProductionBatch({
      siteId,
      organizationId,
      productionType,
      startedAt,
      expectedYield,
      expectedYieldUnit,
      sourceHarvestId,
      recipeId,
      notes,
      userId: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to create production batch',
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
      message: 'Production batch created successfully',
    })
  } catch (error) {
    console.error('Production batch creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
