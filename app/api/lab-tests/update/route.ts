/**
 * Lab Test Update API Route
 * Phase 3.5 Week 8 Implementation
 *
 * Handles updating test results and status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateTestResults } from '@/lib/compliance/metrc/sync/lab-test-sync'
import type { TestResultsData } from '@/lib/compliance/metrc/validation/lab-test-rules'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

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
      testResults,
      status,
      notes
    } = body

    // Validate required fields
    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
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

    // Update test results if provided
    if (testResults) {
      const result = await updateTestResults(
        testId,
        testResults as TestResultsData,
        user.id
      )

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Failed to update test results',
            details: result.errors
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        testId: result.testId,
        testNumber: result.testNumber,
        warnings: result.warnings
      })
    }

    // Otherwise just update status/notes
    const updateData: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }

    if (status) {
      const validStatuses = ['pending', 'in_progress', 'passed', 'failed', 'conditional', 'retesting']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { error: updateError } = await supabase
      .from('lab_test_results')
      .update(updateData)
      .eq('id', testId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update lab test' },
        { status: 400 }
      )
    }

    // If status changed, update linked packages
    if (status) {
      await supabase
        .from('package_test_results')
        .update({
          package_test_status: status === 'passed' ? 'passed' :
                              status === 'failed' ? 'failed' :
                              status === 'retesting' ? 'retesting' :
                              'pending'
        })
        .eq('test_result_id', testId)

      // Update batch test results too
      await supabase
        .from('batch_test_results')
        .update({
          batch_test_status: status === 'passed' ? 'passed' :
                            status === 'failed' ? 'failed' :
                            status === 'retesting' ? 'retesting' :
                            'pending'
        })
        .eq('test_result_id', testId)
    }

    return NextResponse.json({
      success: true,
      testId
    })

  } catch (error) {
    console.error('Lab test update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}