/**
 * Compliance Sync API Route
 *
 * POST /api/compliance/sync - Trigger a manual sync with Metrc
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { runSync, type SyncType } from '@/lib/compliance/metrc/sync'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions
    if (!canPerformAction(userData.role, 'compliance:sync')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      siteId,
      syncType,
      lastModifiedStart,
      lastModifiedEnd,
    }: {
      siteId: string
      syncType: SyncType
      lastModifiedStart?: string
      lastModifiedEnd?: string
    } = body

    if (!siteId || !syncType) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, syncType' },
        { status: 400 }
      )
    }

    // Verify site belongs to user's organization
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('id', siteId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found or access denied' }, { status: 404 })
    }

    // Run sync
    const result = await runSync(
      syncType,
      siteId,
      userData.organization_id,
      user.id,
      {
        lastModifiedStart,
        lastModifiedEnd,
      }
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error in compliance sync API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
