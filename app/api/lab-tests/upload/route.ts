/**
 * Lab Test Upload API Route
 * Phase 3.5 Week 8 Implementation
 *
 * Handles COA upload and lab test creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLabTest } from '@/lib/compliance/metrc/sync/lab-test-sync'
import type { TestResultsData } from '@/lib/compliance/metrc/validation/lab-test-rules'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

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

    // Parse request body
    const body = await request.json()
    const {
      organizationId,
      siteId,
      labName,
      labLicenseNumber,
      testDate,
      coaFileUrl,
      coaFileName,
      coaFileSize,
      coaFileType,
      sampleQuantity,
      sampleUnitOfMeasure,
      notes,
      testResults,
      packageIds,
      batchIds
    } = body

    // Use provided siteId or fall back to current site context
    const effectiveSiteId = siteId || currentSiteId

    // Validate required fields
    if (!organizationId || !effectiveSiteId || !labName || !testDate || !coaFileUrl || !coaFileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate siteId matches current site context (if context is set)
    if (currentSiteId && siteId && siteId !== currentSiteId) {
      return NextResponse.json(
        { error: 'Provided siteId does not match current site context' },
        { status: 403 }
      )
    }

    // Check user has access to organization
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      )
    }

    // Create the lab test
    const result = await createLabTest({
      organizationId,
      siteId: effectiveSiteId,
      labName,
      labLicenseNumber,
      testDate,
      coaFileUrl,
      coaFileName,
      coaFileSize,
      coaFileType,
      sampleQuantity,
      sampleUnitOfMeasure,
      notes,
      testResults: testResults as TestResultsData,
      userId: user.id
    })

    if (!result.success || !result.testId) {
      return NextResponse.json(
        {
          error: 'Failed to create lab test',
          details: result.errors
        },
        { status: 400 }
      )
    }

    // Link packages if provided
    if (packageIds && packageIds.length > 0) {
      const packageLinks = packageIds.map((packageId: string) => ({
        package_id: packageId,
        test_result_id: result.testId,
        package_test_status: testResults ?
          (Object.values(testResults).some((t: any) => t?.tested && t?.passed === false) ? 'failed' : 'passed') :
          'pending',
        associated_by: user.id
      }))

      const { error: linkError } = await supabase
        .from('package_test_results')
        .insert(packageLinks)

      if (linkError) {
        console.error('Failed to link packages:', linkError)
        // Don't fail the whole request if linking fails
      }
    }

    // Link batches if provided
    if (batchIds && batchIds.length > 0) {
      const batchLinks = batchIds.map((batchId: string) => ({
        batch_id: batchId,
        test_result_id: result.testId,
        batch_test_status: testResults ?
          (Object.values(testResults).some((t: any) => t?.tested && t?.passed === false) ? 'failed' : 'passed') :
          'pending',
        associated_by: user.id
      }))

      const { error: linkError } = await supabase
        .from('batch_test_results')
        .insert(batchLinks)

      if (linkError) {
        console.error('Failed to link batches:', linkError)
        // Don't fail the whole request if linking fails
      }
    }

    return NextResponse.json({
      success: true,
      testId: result.testId,
      testNumber: result.testNumber,
      warnings: result.warnings
    })

  } catch (error) {
    console.error('Lab test upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}