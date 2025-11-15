import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { syncPodAndBatchRecipes } from '@/lib/recipes/recipe-sync'

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

    const [{ data: batch }, { data: pod }] = await Promise.all([
      supabase
        .from('batches')
        .select('batch_number')
        .eq('id', batchId)
        .maybeSingle(),
      supabase
        .from('pods')
        .select('name')
        .eq('id', podId)
        .maybeSingle(),
    ])

    await syncPodAndBatchRecipes({
      supabase,
      batchId,
      podId,
      userId,
      batchNumber: batch?.batch_number ?? null,
      podName: pod?.name ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('assign-pod route error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
