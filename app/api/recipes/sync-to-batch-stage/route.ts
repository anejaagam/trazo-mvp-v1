import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchId, userId } = body || {}

    if (!batchId || !userId) {
      return NextResponse.json({ error: 'batchId and userId are required' }, { status: 400 })
    }

    const supabase = createServiceClient('US')

    // Get batch stage
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('stage')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      console.error('Failed to fetch batch:', batchError)
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Get active recipe activation for this batch
    const { data: activation, error: activationError } = await supabase
      .from('recipe_activations')
      .select('id, recipe_version_id, current_stage_id')
      .eq('scope_type', 'batch')
      .eq('scope_id', batchId)
      .eq('is_active', true)
      .maybeSingle()

    if (activationError) {
      console.error('Failed to fetch recipe activation:', activationError)
      return NextResponse.json({ error: 'Failed to fetch recipe activation' }, { status: 500 })
    }

    if (!activation) {
      return NextResponse.json({ success: false, message: 'No active recipe for this batch' })
    }

    // Find the recipe stage that matches the batch stage
    const { data: matchingStage, error: stageError } = await supabase
      .from('recipe_stages')
      .select('id, order_index')
      .eq('recipe_version_id', activation.recipe_version_id)
      .eq('stage_type', batch.stage)
      .maybeSingle()

    if (stageError) {
      console.error('Failed to find matching recipe stage:', stageError)
      return NextResponse.json({ error: 'Failed to find matching recipe stage' }, { status: 500 })
    }

    if (!matchingStage) {
      console.warn(`No recipe stage matches batch stage "${batch.stage}" - keeping current recipe stage`)
      return NextResponse.json({ 
        success: false, 
        message: `No recipe stage found for batch stage "${batch.stage}"` 
      })
    }

    // Update the recipe activation to the matching stage
    const { error: updateError } = await supabase
      .from('recipe_activations')
      .update({
        current_stage_id: matchingStage.id,
        current_stage_day: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activation.id)

    if (updateError) {
      console.error('Failed to update recipe activation:', updateError)
      return NextResponse.json({ error: 'Failed to update recipe stage' }, { status: 500 })
    }

    // Log the stage sync
    await supabase.from('batch_events').insert({
      batch_id: batchId,
      event_type: 'recipe_stage_synced',
      to_value: { stage: batch.stage, recipe_stage_id: matchingStage.id },
      user_id: userId,
      notes: `Recipe stage synced to batch stage: ${batch.stage}`,
    })

    return NextResponse.json({ 
      success: true, 
      synced: true,
      stage: batch.stage 
    })
  } catch (error) {
    console.error('sync-to-batch-stage route error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
