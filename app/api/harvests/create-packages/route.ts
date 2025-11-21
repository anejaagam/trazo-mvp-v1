import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPackagesFromHarvest } from '@/lib/compliance/metrc/sync/package-creation-sync'

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

    const body = await request.json()
    const { harvestId, packages } = body

    // Validate required fields
    if (!harvestId || !packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: harvestId and packages array' },
        { status: 400 }
      )
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
