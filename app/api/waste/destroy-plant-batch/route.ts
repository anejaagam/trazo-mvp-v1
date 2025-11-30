import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { destroyPlantBatchWaste } from '@/lib/compliance/metrc/sync/waste-destruction-sync'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's default site
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    const body = await request.json()
    const {
      batchId,
      plantsDestroyed,
      plantTags,
      wasteWeight,
      wasteUnit,
      wasteReason,
      renderingMethod,
      inertMaterialWeight,
      inertMaterialUnit,
      destructionDate,
      witnessedBy,
      photoEvidenceUrls,
      notes,
    } = body

    // Validate required fields
    if (
      !batchId ||
      !plantsDestroyed ||
      !wasteWeight ||
      !wasteUnit ||
      !wasteReason ||
      !renderingMethod ||
      !destructionDate
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate batch belongs to current site context
    if (currentSiteId) {
      const { data: batch } = await supabase
        .from('batches')
        .select('site_id')
        .eq('id', batchId)
        .single()

      if (batch && batch.site_id !== currentSiteId) {
        return NextResponse.json(
          { success: false, message: 'Batch does not belong to the selected site' },
          { status: 403 }
        )
      }
    }

    // Destroy plant batch
    const result = await destroyPlantBatchWaste({
      batchId,
      plantsDestroyed: Number(plantsDestroyed),
      plantTags,
      wasteWeight: Number(wasteWeight),
      wasteUnit,
      wasteReason,
      renderingMethod,
      inertMaterialWeight: inertMaterialWeight ? Number(inertMaterialWeight) : undefined,
      inertMaterialUnit,
      destructionDate,
      witnessedBy,
      photoEvidenceUrls,
      notes,
      destroyedBy: user.id,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to destroy plant batch',
          errors: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      wasteLogId: result.wasteLogId,
      wasteNumber: result.wasteNumber,
      destructionEventId: result.destructionEventId,
      metrcTransactionId: result.metrcTransactionId,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in destroy plant batch API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
