/**
 * API Route: Push Batch to Metrc (Semi-Autonomous)
 *
 * Pushes a batch to Metrc with optional location auto-resolution
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pushBatchToMetrc } from '@/lib/compliance/metrc/sync/batch-push-sync'
import { resolveMetrcLocationForBatch } from '@/lib/compliance/metrc/utils/location-resolver'

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

    // Get request body
    const body = await request.json()
    const { batchId, location: providedLocation } = body

    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
    }

    // Location can be provided or auto-resolved
    let location = providedLocation?.trim()

    // If no location provided, try to auto-resolve
    if (!location) {
      const resolved = await resolveMetrcLocationForBatch(batchId)
      if (resolved.metrcLocation) {
        location = resolved.metrcLocation
      } else {
        return NextResponse.json(
          { error: 'location (Metrc room/location name) is required and could not be auto-resolved' },
          { status: 400 }
        )
      }
    }

    // Verify batch exists and user has access
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, site_id, batch_number, domain_type, metrc_batch_id')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Verify batch is cannabis domain
    if (batch.domain_type !== 'cannabis') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only cannabis batches can be synced to Metrc',
        },
        { status: 400 }
      )
    }

    // Check if batch already synced
    if (batch.metrc_batch_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Batch already synced to Metrc',
          metrcBatchId: batch.metrc_batch_id,
        },
        { status: 400 }
      )
    }

    // Get site and organization info for push
    const { data: siteData } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('id', batch.site_id)
      .single()

    if (!siteData) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Push to Metrc
    try {
      const result = await pushBatchToMetrc(
        batchId,
        siteData.id,
        siteData.organization_id,
        user.id,
        location.trim()
      )

      if (result.success && result.batchesCreated > 0) {
        return NextResponse.json({
          success: true,
          message: 'Batch pushed to Metrc successfully',
          batchesCreated: result.batchesCreated,
          warnings: result.warnings,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              result.errors.length > 0 ? result.errors.join(', ') : 'Failed to push batch to Metrc',
            errors: result.errors,
            warnings: result.warnings,
          },
          { status: 500 }
        )
      }
    } catch (pushError) {
      console.error('Push to Metrc error:', pushError)
      return NextResponse.json(
        {
          success: false,
          message: pushError instanceof Error ? pushError.message : 'Failed to push to Metrc',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
