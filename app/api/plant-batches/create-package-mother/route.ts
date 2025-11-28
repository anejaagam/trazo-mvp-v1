/**
 * API Route: Create Package from Mother Plant
 *
 * Creates a clone package from a mother plant batch (keeps batch count unchanged)
 * Metrc Evaluation Step 2
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPackagesFromMother } from '@/lib/compliance/metrc/sync/plant-management-sync'

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

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get request body
    const body = await request.json()
    const {
      batchId,
      packageTag,
      plantCount,
      itemName,
      location,
      sublocation,
      packageDate,
      isTradeSample,
      isDonation,
      note,
      userId,
    } = body

    if (!batchId || !packageTag || !plantCount || !itemName || !packageDate) {
      return NextResponse.json(
        { error: 'batchId, packageTag, plantCount, itemName, and packageDate are required' },
        { status: 400 }
      )
    }

    // Verify batch exists and user has access
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, site_id, organization_id, batch_number, domain_type, metrc_batch_id')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Verify user has access to this batch's organization
    if (batch.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'You do not have access to this batch' },
        { status: 403 }
      )
    }

    // Verify batch is cannabis domain and synced to Metrc
    if (batch.domain_type !== 'cannabis') {
      return NextResponse.json(
        { error: 'Only cannabis batches can create Metrc packages' },
        { status: 400 }
      )
    }

    if (!batch.metrc_batch_id) {
      return NextResponse.json(
        { error: 'Batch must be synced to Metrc before creating packages' },
        { status: 400 }
      )
    }

    // Call sync service (from mother - doesn't reduce count)
    const result = await createPackagesFromMother({
      batchId,
      packageTag,
      plantCount,
      itemName,
      location: location || null,
      sublocation: sublocation || null,
      packageDate,
      isTradeSample: isTradeSample || false,
      isDonation: isDonation || false,
      note: note || null,
      userId: userId || user.id,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Package created from mother plant successfully (batch count unchanged)',
        packageId: result.packageId,
        warnings: result.warnings,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.errors.length > 0 ? result.errors.join(', ') : 'Failed to create package',
          errors: result.errors,
          warnings: result.warnings,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Create package from mother API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
