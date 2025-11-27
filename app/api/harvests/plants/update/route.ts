import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateHarvestPlantRecord } from '@/lib/supabase/queries/harvest-plants'
import { validatePlantDryWeightUpdate } from '@/lib/compliance/metrc/validation/plant-harvest-rules'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's default site
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    const body = await request.json()
    const {
      record_id,
      dry_weight_g,
      waste_weight_g,
      flower_weight_g,
      trim_weight_g,
      shake_weight_g,
      quality_grade,
      notes,
    } = body

    if (!record_id) {
      return NextResponse.json(
        { success: false, message: 'Record ID is required' },
        { status: 400 }
      )
    }

    // Get current record to validate against wet weight and site context
    const { data: currentRecord } = await supabase
      .from('harvest_plant_records')
      .select('wet_weight_g, batch_id, batches!inner(site_id)')
      .eq('id', record_id)
      .single()

    if (!currentRecord) {
      return NextResponse.json(
        { success: false, message: 'Plant record not found' },
        { status: 404 }
      )
    }

    // Validate plant record belongs to current site context via batch
    if (currentSiteId && (currentRecord.batches as any)?.site_id !== currentSiteId) {
      return NextResponse.json(
        { success: false, message: 'Plant record does not belong to the selected site' },
        { status: 403 }
      )
    }

    // Validate if dry weight is being updated
    let validation
    if (dry_weight_g !== undefined) {
      validation = validatePlantDryWeightUpdate({
        wet_weight_g: currentRecord.wet_weight_g,
        dry_weight_g,
        flower_weight_g,
        trim_weight_g,
        shake_weight_g,
        waste_weight_g,
      })

      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Validation failed',
            errors: validation.errors,
            warnings: validation.warnings,
          },
          { status: 400 }
        )
      }
    }

    const result = await updateHarvestPlantRecord(record_id, {
      dry_weight_g,
      waste_weight_g,
      flower_weight_g,
      trim_weight_g,
      shake_weight_g,
      quality_grade,
      notes,
    })

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({
      success: true,
      plant_record: result.data,
      warnings: validation?.warnings || [],
    })
  } catch (error) {
    console.error('Error in update plant harvest API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
