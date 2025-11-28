/**
 * API Route: Change Plant Batch Growth Phase
 *
 * Changes the growth phase of a plant batch (creates individual plants in Metrc)
 * Metrc Evaluation Step 4
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { changeBatchGrowthPhase } from '@/lib/compliance/metrc/sync/plant-management-sync'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get request body
    const body = await request.json()
    const {
      batchId,
      plantCount,
      startingTag,
      growthPhase,
      newLocation,
      newSubLocation,
      growthDate,
      userId,
    } = body

    if (!batchId || !plantCount || !startingTag || !growthPhase || !newLocation || !growthDate) {
      return NextResponse.json(
        { error: 'batchId, plantCount, startingTag, growthPhase, newLocation, and growthDate are required' },
        { status: 400 }
      )
    }

    // Validate growth phase
    if (!['Vegetative', 'Flowering'].includes(growthPhase)) {
      return NextResponse.json(
        { error: 'growthPhase must be either "Vegetative" or "Flowering"' },
        { status: 400 }
      )
    }

    // Verify batch exists and user has access
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, site_id, organization_id, batch_number, domain_type, metrc_batch_id, plant_count')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Verify user has access to this batch's organization
    if (batch.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'You do not have access to this batch' },
        { status: 403 }
      )
    }

    // Verify batch is cannabis domain and synced to Metrc
    if (batch.domain_type !== 'cannabis') {
      return NextResponse.json(
        { error: 'Only cannabis batches can change Metrc growth phases' },
        { status: 400 }
      )
    }

    if (!batch.metrc_batch_id) {
      return NextResponse.json(
        { error: 'Batch must be synced to Metrc before changing growth phases' },
        { status: 400 }
      )
    }

    // Verify plant count
    if (plantCount > (batch.plant_count || 0)) {
      return NextResponse.json(
        { error: `Cannot transition ${plantCount} plants - batch only has ${batch.plant_count}` },
        { status: 400 }
      )
    }

    // Call sync service
    const result = await changeBatchGrowthPhase({
      batchId,
      plantCount,
      startingTag,
      newPhase: growthPhase as 'Vegetative' | 'Flowering',
      location: newLocation,
      sublocation: newSubLocation || undefined,
      phaseDate: growthDate,
      userId: userId || user.id,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Growth phase changed to ${growthPhase}. ${plantCount} individual plants created.`,
        plantsCreated: result.plantsCreated,
        warnings: result.warnings,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.errors.length > 0 ? result.errors.join(', ') : 'Failed to change growth phase',
          errors: result.errors,
          warnings: result.warnings,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Change growth phase API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
