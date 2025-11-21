import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { destroyPlantBatchWaste } from '@/lib/compliance/metrc/sync/waste-destruction-sync'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

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
