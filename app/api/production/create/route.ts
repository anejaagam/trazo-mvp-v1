import { NextResponse } from 'next/server'
import { createProductionBatch } from '@/lib/compliance/metrc/sync/production-batch-sync'
import {
  authenticateWithSite,
  isAuthError,
  authErrorResponse,
} from '@/lib/api/auth'
import type { ProductionType } from '@/lib/compliance/metrc/validation/production-batch-rules'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      siteId: requestSiteId,
      organizationId: requestOrgId,
      productionType,
      startedAt,
      expectedYield,
      expectedYieldUnit,
      sourceHarvestId,
      recipeId,
      notes,
    } = body

    // Authenticate and validate site access
    const authResult = await authenticateWithSite({
      requestSiteId,
      permission: 'batch:create',
      allowAllSites: false, // Must select specific site for mutations
    })

    if (isAuthError(authResult)) {
      return authErrorResponse(authResult)
    }

    const { user, siteContext } = authResult
    const siteId = siteContext.siteId
    const organizationId = requestOrgId || user.organizationId

    // Validate required fields
    if (!productionType || !startedAt) {
      return NextResponse.json(
        {
          error: 'Missing required fields: productionType, startedAt',
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

    // Create production batch with validated site context
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
