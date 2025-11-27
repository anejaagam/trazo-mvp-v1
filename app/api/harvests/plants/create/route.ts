import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createHarvestPlantRecord,
  createHarvestPlantRecordsBatch,
} from '@/lib/supabase/queries/harvest-plants'
import {
  validatePlantHarvestCreate,
  validatePlantHarvestBatch,
} from '@/lib/compliance/metrc/validation/plant-harvest-rules'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

export async function POST(request: Request) {
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

    // Support both single plant and batch creation
    const isBatch = Array.isArray(body.plants)

    if (isBatch) {
      // Batch creation
      const { harvest_id, batch_id, organization_id, plants } = body

      if (!harvest_id || !batch_id || !organization_id || !plants) {
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
          .eq('id', batch_id)
          .single()

        if (batch && batch.site_id !== currentSiteId) {
          return NextResponse.json(
            { success: false, message: 'Batch does not belong to the selected site' },
            { status: 403 }
          )
        }
      }

      // Validate batch
      const validation = validatePlantHarvestBatch(plants)
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

      // Create records
      const plantRecords = plants.map((plant: any) => ({
        harvest_id,
        batch_id,
        organization_id,
        plant_tag: plant.plant_tag,
        plant_index: plant.plant_index,
        wet_weight_g: plant.wet_weight_g,
        quality_grade: plant.quality_grade,
        notes: plant.notes,
        harvested_by: plant.harvested_by || user.id,
      }))

      const result = await createHarvestPlantRecordsBatch(plantRecords, user.id)

      if (result.error) {
        throw result.error
      }

      return NextResponse.json({
        success: true,
        count: result.data?.length || 0,
        warnings: validation.warnings,
      })
    } else {
      // Single plant creation
      const { harvest_id, batch_id, organization_id, plant_tag, wet_weight_g, quality_grade, plant_index, notes } = body

      if (!harvest_id || !batch_id || !organization_id || !plant_tag || !wet_weight_g) {
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
          .eq('id', batch_id)
          .single()

        if (batch && batch.site_id !== currentSiteId) {
          return NextResponse.json(
            { success: false, message: 'Batch does not belong to the selected site' },
            { status: 403 }
          )
        }
      }

      // Validate
      const validation = validatePlantHarvestCreate({
        harvest_id,
        batch_id,
        plant_tag,
        wet_weight_g,
        quality_grade,
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

      const result = await createHarvestPlantRecord(
        {
          harvest_id,
          batch_id,
          organization_id,
          plant_tag,
          plant_index,
          wet_weight_g,
          quality_grade,
          notes,
        },
        user.id
      )

      if (result.error) {
        throw result.error
      }

      return NextResponse.json({
        success: true,
        plant_record_id: result.data?.id,
        warnings: validation.warnings,
      })
    }
  } catch (error) {
    console.error('Error in create plant harvest API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
