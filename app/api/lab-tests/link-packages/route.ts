/**
 * Link Packages to Lab Test API Route
 * Phase 3.5 Week 8 Implementation
 *
 * Handles linking packages or batches to existing lab tests
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { linkPackageToTest } from '@/lib/compliance/metrc/sync/lab-test-sync'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      testId,
      packageIds,
      batchIds,
      sampleTaken,
      sampleQuantity,
      sampleUnitOfMeasure,
      notes
    } = body

    // Validate required fields
    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      )
    }

    if ((!packageIds || packageIds.length === 0) && (!batchIds || batchIds.length === 0)) {
      return NextResponse.json(
        { error: 'At least one package or batch ID is required' },
        { status: 400 }
      )
    }

    // Get the test to check permissions and status
    const { data: labTest, error: fetchError } = await supabase
      .from('lab_test_results')
      .select('organization_id, status')
      .eq('id', testId)
      .single()

    if (fetchError || !labTest) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      )
    }

    // Check user has access to organization
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', labTest.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      )
    }

    const errors: string[] = []
    const successes: string[] = []

    // Link packages
    if (packageIds && packageIds.length > 0) {
      for (const packageId of packageIds) {
        const result = await linkPackageToTest({
          packageId,
          testId,
          sampleTaken,
          sampleQuantity,
          sampleUnitOfMeasure,
          notes,
          userId: user.id
        })

        if (result.success) {
          successes.push(`Package ${packageId} linked successfully`)
        } else {
          errors.push(...result.errors)
        }
      }
    }

    // Link batches
    if (batchIds && batchIds.length > 0) {
      for (const batchId of batchIds) {
        // Check if batch exists
        const { data: batch } = await supabase
          .from('batches')
          .select('id')
          .eq('id', batchId)
          .single()

        if (!batch) {
          errors.push(`Batch ${batchId} not found`)
          continue
        }

        // Check if already linked
        const { data: existingLink } = await supabase
          .from('batch_test_results')
          .select('id')
          .eq('batch_id', batchId)
          .eq('test_result_id', testId)
          .single()

        if (existingLink) {
          errors.push(`Batch ${batchId} is already linked to this test`)
          continue
        }

        // Create the link
        const { error: linkError } = await supabase
          .from('batch_test_results')
          .insert({
            batch_id: batchId,
            test_result_id: testId,
            batch_test_status: labTest.status === 'passed' ? 'passed' :
                              labTest.status === 'failed' ? 'failed' :
                              'pending',
            notes,
            associated_by: user.id
          })

        if (linkError) {
          errors.push(`Failed to link batch ${batchId}: ${linkError.message}`)
        } else {
          successes.push(`Batch ${batchId} linked successfully`)
        }
      }
    }

    // Return appropriate response
    if (errors.length > 0 && successes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      successes,
      warnings: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Link packages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { testId, packageId, batchId } = body

    // Validate required fields
    if (!testId || (!packageId && !batchId)) {
      return NextResponse.json(
        { error: 'Test ID and either package ID or batch ID are required' },
        { status: 400 }
      )
    }

    // Get the test to check permissions
    const { data: labTest, error: fetchError } = await supabase
      .from('lab_test_results')
      .select('organization_id')
      .eq('id', testId)
      .single()

    if (fetchError || !labTest) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      )
    }

    // Check user has access to organization
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', labTest.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      )
    }

    // Remove package link
    if (packageId) {
      const { error: deleteError } = await supabase
        .from('package_test_results')
        .delete()
        .eq('package_id', packageId)
        .eq('test_result_id', testId)

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to remove package link' },
          { status: 400 }
        )
      }
    }

    // Remove batch link
    if (batchId) {
      const { error: deleteError } = await supabase
        .from('batch_test_results')
        .delete()
        .eq('batch_id', batchId)
        .eq('test_result_id', testId)

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to remove batch link' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Link removed successfully'
    })

  } catch (error) {
    console.error('Unlink error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}