/**
 * API Route: Resolve Metrc Location for Batch
 *
 * Returns the Metrc location for a batch based on pod assignment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMetrcLocationForBatch } from '@/lib/compliance/metrc/utils/location-resolver'

export async function GET(request: NextRequest) {
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

    // Get batch ID from query params
    const searchParams = request.nextUrl.searchParams
    const batchId = searchParams.get('batchId')

    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
    }

    // Verify user has access to this batch
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, organization_id')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Verify user belongs to the same organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userData?.organization_id !== batch.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Resolve location
    const result = await resolveMetrcLocationForBatch(batchId)

    return NextResponse.json({
      metrcLocation: result.metrcLocation,
      source: result.source,
      podName: result.podName,
      roomName: result.roomName,
      requiresManualInput: result.requiresManualInput,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
