import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transitionBatchStage } from '@/lib/supabase/queries/batches'
import { willTriggerMetrcPhaseSync } from '@/lib/compliance/metrc/sync/batch-phase-sync'

/**
 * POST /api/batches/transition-stage
 *
 * Transitions a batch to a new stage with optional notes and location
 * Automatically syncs to Metrc if batch is cannabis and stage change requires phase transition
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { batchId, newStage, notes, newLocation } = body

    // Validate required fields
    if (!batchId) {
      return NextResponse.json(
        { success: false, message: 'Batch ID is required' },
        { status: 400 }
      )
    }

    if (!newStage) {
      return NextResponse.json(
        { success: false, message: 'New stage is required' },
        { status: 400 }
      )
    }

    // Get current batch to validate domain and stage
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('stage, domain_type')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { success: false, message: 'Batch not found' },
        { status: 404 }
      )
    }

    // Check if this will trigger Metrc sync (informational)
    const willSync = await willTriggerMetrcPhaseSync(batchId, batch.stage, newStage)

    // Transition stage
    const { data, error } = await transitionBatchStage(
      batchId,
      newStage,
      user.id,
      notes,
      newLocation
    )

    if (error) {
      console.error('Error transitioning batch stage:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to transition batch stage', error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Batch stage transitioned successfully',
      data,
      metrcSyncTriggered: willSync,
      metrcSyncInfo: willSync
        ? 'Stage transition will be automatically synced to Metrc'
        : 'No Metrc sync required for this stage transition',
    })
  } catch (error) {
    console.error('Error in transition-stage API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
