import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPackagesFromHarvest } from '@/lib/compliance/metrc/sync/package-creation-sync'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's default site
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    const body = await request.json()
    const { harvestId, packages } = body

    // Validate required fields
    if (!harvestId || !packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: harvestId and packages array' },
        { status: 400 }
      )
    }

    // Validate harvest belongs to current site context via batch
    if (currentSiteId) {
      const { data: harvest } = await supabase
        .from('harvests')
        .select('batch_id, batches!inner(site_id)')
        .eq('id', harvestId)
        .single()

      if (harvest && (harvest.batches as any)?.site_id !== currentSiteId) {
        return NextResponse.json(
          { error: 'Harvest does not belong to the selected site' },
          { status: 403 }
        )
      }
    }

    // Validate package structure
    for (const pkg of packages) {
      if (!pkg.packageTag || !pkg.packageType || !pkg.productName || !pkg.quantity || !pkg.unitOfMeasure) {
        return NextResponse.json(
          { error: 'Each package must have: packageTag, packageType, productName, quantity, unitOfMeasure' },
          { status: 400 }
        )
      }
    }

    // Create packages
    const result = await createPackagesFromHarvest(harvestId, packages, user.id)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to create packages',
          details: result.errors,
          warnings: result.warnings,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      packagesCreated: result.packagesCreated,
      packageIds: result.packageIds,
      synced: result.synced,
      warnings: result.warnings,
      message: `${result.packagesCreated} package(s) created successfully`,
    })
  } catch (error) {
    console.error('Package creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
