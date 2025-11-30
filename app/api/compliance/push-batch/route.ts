/**
 * API Route: Push Batch to Metrc (Semi-Autonomous)
 *
 * Pushes a batch to Metrc with optional location auto-resolution
 * Supports sourceInfo for Closed Loop states
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pushBatchToMetrc, type BatchSourceInfo } from '@/lib/compliance/metrc/sync/batch-push-sync'
import { resolveMetrcLocationForBatch } from '@/lib/compliance/metrc/utils/location-resolver'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Push batch request from user:', user.id)

    // Get user's default site
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('User query error:', userError)
      return NextResponse.json({ error: 'User not found', details: userError.message }, { status: 404 })
    }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User data:', { orgId: userData.organization_id, siteId: userData.default_site_id })

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    console.log('Site context:', { contextSiteId, currentSiteId })

    // Get request body
    const body = await request.json()
    const { batchId, location: providedLocation, sourceInfo: providedSourceInfo } = body

    console.log('Request body:', { batchId, location: providedLocation, sourceInfo: providedSourceInfo })

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
    console.log('Querying batch:', batchId)
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, site_id, organization_id, batch_number, domain_type, metrc_batch_id')
      .eq('id', batchId)
      .single()

    console.log('Batch query result:', { batch: batch?.id, error: batchError?.message })

    if (batchError) {
      console.error('Batch query error:', batchError)
      return NextResponse.json(
        { error: 'Batch not found', details: batchError.message },
        { status: 404 }
      )
    }

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    console.log('Batch details:', {
      id: batch.id,
      site_id: batch.site_id,
      organization_id: batch.organization_id,
      domain_type: batch.domain_type,
      metrc_batch_id: batch.metrc_batch_id,
    })

    // Verify user has access to this batch's organization
    if (batch.organization_id !== userData.organization_id) {
      console.log('Org mismatch:', { batch: batch.organization_id, user: userData.organization_id })
      return NextResponse.json(
        { error: 'You do not have access to this batch' },
        { status: 403 }
      )
    }

    // Validate batch belongs to current site context
    if (currentSiteId && batch.site_id !== currentSiteId) {
      console.log('Site mismatch:', { batch: batch.site_id, context: currentSiteId })
      return NextResponse.json(
        { error: 'Batch does not belong to the selected site' },
        { status: 403 }
      )
    }

    // Verify batch is cannabis domain
    if (batch.domain_type !== 'cannabis') {
      console.log('Domain type is not cannabis:', batch.domain_type)
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
      console.log('Batch already synced:', batch.metrc_batch_id)
      return NextResponse.json(
        {
          success: false,
          message: 'Batch already synced to Metrc',
          metrcBatchId: batch.metrc_batch_id,
        },
        { status: 400 }
      )
    }

    console.log('All checks passed, getting site data...')

    // Get site and organization info for push
    const { data: siteData, error: siteError } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('id', batch.site_id)
      .single()

    console.log('Site data result:', { siteData, error: siteError?.message })

    if (!siteData) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    console.log('Calling pushBatchToMetrc...')

    // Build sourceInfo from request or let it auto-detect from batch data
    let sourceInfo: BatchSourceInfo | undefined = undefined
    if (providedSourceInfo) {
      // Convert from API format to internal format
      sourceInfo = {
        type: providedSourceInfo.type as 'from_package' | 'from_mother' | 'no_source',
        packageTag: providedSourceInfo.packageTag,
        motherPlantTags: providedSourceInfo.motherPlantTags,
      }
      console.log('Using provided sourceInfo:', sourceInfo)
    }

    // Push to Metrc
    try {
      const result = await pushBatchToMetrc(
        batchId,
        siteData.id,
        siteData.organization_id,
        user.id,
        location.trim(),
        sourceInfo, // Pass sourceInfo from request (or undefined to auto-detect from batch data)
        supabase // Pass authenticated client to avoid RLS issues
      )

      console.log('pushBatchToMetrc result:', JSON.stringify(result, null, 2))

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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
