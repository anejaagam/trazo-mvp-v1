import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { linkPackageToPlants } from '@/lib/supabase/queries/harvest-plants'
import { validatePackageTraceability } from '@/lib/compliance/metrc/validation/plant-harvest-rules'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { package_id, plant_sources } = body

    if (!package_id || !plant_sources) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get package weight for validation
    const { data: packageData } = await supabase
      .from('harvest_packages')
      .select('quantity')
      .eq('id', package_id)
      .single()

    if (!packageData) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      )
    }

    // Validate traceability
    const validation = validatePackageTraceability(
      packageData.quantity,
      plant_sources
    )

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      )
    }

    // Link plants to package
    const result = await linkPackageToPlants(package_id, plant_sources)

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({
      success: true,
      sources_linked: result.data?.length || 0,
      warnings: validation.warnings,
    })
  } catch (error) {
    console.error('Error in link package plants API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
