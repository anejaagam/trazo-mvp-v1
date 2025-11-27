import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { syncPodAndBatchRecipes } from '@/lib/recipes/recipe-sync'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

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

    // Get user's default site for context validation
    const userSupabase = await createClient()
    const { data: userData } = await userSupabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', userId)
      .single()

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData?.default_site_id

    const supabase = createServiceClient('US')

    // Validate batch belongs to current site context
    if (currentSiteId) {
      const { data: batch } = await supabase
        .from('batches')
        .select('site_id')
        .eq('id', batchId)
        .single()

      if (batch && batch.site_id !== currentSiteId) {
        return NextResponse.json(
          { error: 'Batch does not belong to the selected site' },
          { status: 403 }
        )
      }
    }

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
