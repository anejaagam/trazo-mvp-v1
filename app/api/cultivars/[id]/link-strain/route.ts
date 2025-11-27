/**
 * Cultivar Link Strain API Route
 *
 * POST /api/cultivars/[id]/link-strain - Link a cultivar to a Metrc strain
 * DELETE /api/cultivars/[id]/link-strain - Unlink a cultivar from Metrc strain
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cultivarId } = await params
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
    const { metrcStrainId, siteId }: { metrcStrainId: number; siteId: string } = body

    if (!metrcStrainId || !siteId) {
      return NextResponse.json(
        { error: 'Missing required fields: metrcStrainId, siteId' },
        { status: 400 }
      )
    }

    // Verify cultivar belongs to user's organization
    const { data: cultivar, error: cultivarError } = await supabase
      .from('cultivars')
      .select('id, name, organization_id, metrc_strain_id')
      .eq('id', cultivarId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (cultivarError || !cultivar) {
      return NextResponse.json({ error: 'Cultivar not found or access denied' }, { status: 404 })
    }

    // Verify the Metrc strain exists in cache
    const { data: cachedStrain, error: strainError } = await supabase
      .from('metrc_strains_cache')
      .select('id, metrc_strain_id, name')
      .eq('site_id', siteId)
      .eq('metrc_strain_id', metrcStrainId)
      .single()

    if (strainError || !cachedStrain) {
      return NextResponse.json(
        { error: 'Metrc strain not found in cache. Please sync strains first.' },
        { status: 400 }
      )
    }

    // Update the cultivar with the Metrc strain link
    const { data: updatedCultivar, error: updateError } = await supabase
      .from('cultivars')
      .update({
        metrc_strain_id: metrcStrainId,
        metrc_sync_status: 'synced',
        metrc_last_synced_at: new Date().toISOString(),
      })
      .eq('id', cultivarId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating cultivar:', updateError)
      return NextResponse.json(
        { error: 'Failed to link cultivar to strain' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cultivar: {
        id: updatedCultivar.id,
        name: updatedCultivar.name,
        metrc_strain_id: updatedCultivar.metrc_strain_id,
        metrc_sync_status: updatedCultivar.metrc_sync_status,
      },
      linked_strain: {
        metrc_strain_id: cachedStrain.metrc_strain_id,
        name: cachedStrain.name,
      },
    })
  } catch (error) {
    console.error('Error linking cultivar to strain:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cultivarId } = await params
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

    // Verify cultivar belongs to user's organization
    const { data: cultivar, error: cultivarError } = await supabase
      .from('cultivars')
      .select('id, name, organization_id')
      .eq('id', cultivarId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (cultivarError || !cultivar) {
      return NextResponse.json({ error: 'Cultivar not found or access denied' }, { status: 404 })
    }

    // Remove the Metrc strain link
    const { error: updateError } = await supabase
      .from('cultivars')
      .update({
        metrc_strain_id: null,
        metrc_sync_status: 'not_synced',
        metrc_last_synced_at: null,
      })
      .eq('id', cultivarId)

    if (updateError) {
      console.error('Error unlinking cultivar:', updateError)
      return NextResponse.json(
        { error: 'Failed to unlink cultivar from strain' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Cultivar "${cultivar.name}" unlinked from Metrc strain`,
    })
  } catch (error) {
    console.error('Error unlinking cultivar from strain:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
