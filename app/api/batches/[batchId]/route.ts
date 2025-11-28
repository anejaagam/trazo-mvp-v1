/**
 * API Route: Get Single Batch
 *
 * Returns batch details including source traceability info
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const supabase = await createClient()
    const { batchId } = await params

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

    console.log('[GET /api/batches] Fetching batch:', batchId, 'for org:', userData.organization_id)

    // Fetch batch with source info
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id,
        batch_number,
        plant_count,
        stage,
        domain_type,
        start_date,
        expected_harvest_date,
        notes,
        source_type,
        source_package_tag,
        source_mother_plant_tag,
        tracking_mode,
        batch_tag_label,
        uses_batch_tagging,
        metrc_batch_id,
        site_id,
        organization_id,
        cultivar:cultivars(id, name)
      `)
      .eq('id', batchId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (batchError) {
      console.error('[GET /api/batches] Batch query error:', batchError)
      return NextResponse.json(
        { error: 'Batch not found', details: batchError.message },
        { status: 404 }
      )
    }

    if (!batch) {
      console.error('[GET /api/batches] Batch not found (null)')
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    console.log('[GET /api/batches] Returning batch:', {
      batch_number: batch.batch_number,
      source_package_tag: batch.source_package_tag,
      source_mother_plant_tag: batch.source_mother_plant_tag,
    })

    return NextResponse.json(batch)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
