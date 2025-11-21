import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { destroyPackageWaste } from '@/lib/compliance/metrc/sync/waste-destruction-sync'

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
      packageId,
      wasteWeight,
      wasteUnit,
      wasteReason,
      adjustmentReason,
      renderingMethod,
      inertMaterialWeight,
      destructionDate,
      witnessedBy,
      photoEvidenceUrls,
      notes,
    } = body

    // Validate required fields
    if (
      !packageId ||
      !wasteWeight ||
      !wasteUnit ||
      !wasteReason ||
      !adjustmentReason ||
      !renderingMethod ||
      !destructionDate
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Destroy package waste
    const result = await destroyPackageWaste({
      packageId,
      wasteWeight: Number(wasteWeight),
      wasteUnit,
      wasteReason,
      adjustmentReason,
      renderingMethod,
      inertMaterialWeight: inertMaterialWeight ? Number(inertMaterialWeight) : undefined,
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
          message: 'Failed to destroy package waste',
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
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in destroy package API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
