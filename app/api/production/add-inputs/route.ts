import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addInputPackages } from '@/lib/compliance/metrc/sync/production-batch-sync'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

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

    // Get user's default site
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    const body = await request.json()
    const { productionBatchId, inputs } = body

    // Validate required fields
    if (!productionBatchId) {
      return NextResponse.json(
        { error: 'Missing required field: productionBatchId' },
        { status: 400 }
      )
    }

    // Validate production batch belongs to current site context
    if (currentSiteId) {
      const { data: productionBatch } = await supabase
        .from('production_batches')
        .select('site_id')
        .eq('id', productionBatchId)
        .single()

      if (productionBatch && productionBatch.site_id !== currentSiteId) {
        return NextResponse.json(
          { error: 'Production batch does not belong to the selected site' },
          { status: 403 }
        )
      }
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
