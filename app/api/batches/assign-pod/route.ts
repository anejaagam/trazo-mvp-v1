import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchId, podId, plantCount, userId } = body || {}

    if (!batchId || !podId || !plantCount || !userId) {
      return NextResponse.json(
        { error: 'batchId, podId, plantCount, and userId are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient('US')

    const timestamp = new Date().toISOString()

    const { data: insertedAssignment, error: insertError } = await supabase
      .from('batch_pod_assignments')
      .insert({
        batch_id: batchId,
        pod_id: podId,
        plant_count: plantCount,
        assigned_by: userId,
        notes: body?.notes || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('assign-pod insert error', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { error: releaseError } = await supabase
      .from('batch_pod_assignments')
      .update({
        removed_at: timestamp,
        removed_by: userId,
      })
      .eq('batch_id', batchId)
      .is('removed_at', null)
      .neq('id', insertedAssignment.id)

    if (releaseError) {
      console.error('assign-pod release error', releaseError)
      return NextResponse.json({ error: releaseError.message }, { status: 500 })
    }

    const { data: activeRecipe } = await supabase
      .from('recipe_activations')
      .select(
        `
        id,
        recipe_id,
        recipe_version_id,
        recipe:recipes(id, name),
        recipe_version:recipe_versions(id)
      `
      )
      .eq('scope_type', 'batch')
      .eq('scope_id', batchId)
      .eq('is_active', true)
      .maybeSingle()

    if (activeRecipe?.recipe_id && activeRecipe?.recipe_version_id) {
      const { data: pod } = await supabase
        .from('pods')
        .select('name')
        .eq('id', podId)
        .maybeSingle()

      await supabase.rpc('activate_recipe', {
        p_recipe_id: activeRecipe.recipe_id,
        p_recipe_version_id: activeRecipe.recipe_version_id,
        p_scope_type: 'pod',
        p_scope_id: podId,
        p_scope_name: pod?.name || podId,
        p_activated_by: userId,
        p_scheduled_start: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('assign-pod route error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
