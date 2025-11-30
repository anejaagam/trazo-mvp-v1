/**
 * API Route: Push Inventory Lot to Metrc
 *
 * Manually push a single inventory lot to Metrc
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pushInventoryLotToMetrc } from '@/lib/compliance/metrc/sync/inventory-push-sync'
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's default site
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    // Get request body
    const body = await request.json()
    const { lotId } = body

    if (!lotId) {
      return NextResponse.json({ error: 'lotId is required' }, { status: 400 })
    }

    // Verify lot exists and user has access
    const { data: lot, error: lotError } = await supabase
      .from('inventory_lots')
      .select('id, site_id, item_id, compliance_package_uid')
      .eq('id', lotId)
      .single()

    if (lotError || !lot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 })
    }

    // Validate lot belongs to current site context
    if (currentSiteId && lot.site_id !== currentSiteId) {
      return NextResponse.json(
        { error: 'Lot does not belong to the selected site' },
        { status: 403 }
      )
    }

    // Check if lot already has Metrc package UID
    if (lot.compliance_package_uid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lot already synced to Metrc',
          packageUid: lot.compliance_package_uid,
        },
        { status: 400 }
      )
    }

    // Get site and organization info for push
    const { data: siteData } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('id', lot.site_id)
      .single()

    if (!siteData) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Push to Metrc
    try {
      const result = await pushInventoryLotToMetrc(
        lotId,
        siteData.id,
        siteData.organization_id,
        user.id
      )

      if (result.success && result.lotsCreated > 0) {
        return NextResponse.json({
          success: true,
          message: 'Lot pushed to Metrc successfully',
          lotsCreated: result.lotsCreated,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message: result.errors.length > 0 ? result.errors.join(', ') : 'Failed to push lot to Metrc',
            errors: result.errors,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
