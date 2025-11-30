/**
 * Lab Test Sync Service
 * Phase 3.5 Week 8 Implementation
 *
 * Handles synchronization of lab test results (COAs) with Metrc
 * Following the established pattern from Weeks 1-7
 */

import { createClient } from '@/lib/supabase/client'
import {
  validateLabTestUpload,
  validateTestResults,
  validatePackageTestAssociation,
  type LabTestUploadData,
  type TestResultsData
} from '../validation/lab-test-rules'
import { createMetrcClientForSite } from '../services'

// Define types locally
type LabTestResult = {
  id: string
  test_number: string
  organization_id: string
  site_id: string | null
  lab_name: string
  lab_license_number: string | null
  test_date: string
  received_date: string
  coa_file_url: string | null
  coa_file_name: string | null
  coa_file_size: number | null
  coa_file_type: string | null
  coa_uploaded_by: string | null
  test_results: any
  notes: string | null
  internal_notes: string | null
  sample_quantity: number | null
  sample_unit_of_measure: string | null
  sample_collected_by: string | null
  metrc_test_id: string | null
  metrc_sync_status: string | null
  metrc_sync_error: string | null
  metrc_last_sync: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'retesting'
}

type PackageTestResult = {
  id: string
  package_id: string
  test_result_id: string
  package_test_status: string
  sample_taken: boolean | null
  sample_quantity: number | null
  sample_unit_of_measure: string | null
  notes: string | null
  associated_at: string
  associated_by: string | null
}

type InsertLabTestResult = Partial<LabTestResult>
type InsertPackageTestResult = Partial<PackageTestResult>

export interface CreateLabTestParams {
  organizationId: string
  siteId: string
  labName: string
  labLicenseNumber?: string
  testDate: string
  coaFileUrl: string
  coaFileName: string
  coaFileSize?: number
  coaFileType?: string
  sampleQuantity?: number
  sampleUnitOfMeasure?: string
  notes?: string
  testResults?: TestResultsData
  userId: string
}

export interface LinkPackageToTestParams {
  packageId: string
  testId: string
  sampleTaken?: boolean
  sampleQuantity?: number
  sampleUnitOfMeasure?: string
  notes?: string
  userId: string
}

export interface LabTestSyncResult {
  success: boolean
  synced: boolean
  testId?: string
  testNumber?: string
  errors: string[]
  warnings: string[]
  syncLogId?: string
}

export interface PackageLinkResult {
  success: boolean
  linkId?: string
  errors: string[]
  warnings: string[]
}

/**
 * Creates a lab test record and optionally syncs to Metrc
 */
export async function createLabTest(
  params: CreateLabTestParams
): Promise<LabTestSyncResult> {
  const result: LabTestSyncResult = {
    success: false,
    synced: false,
    errors: [],
    warnings: []
  }

  try {
    const supabase = createClient()

    // Validate the upload data
    const uploadData: LabTestUploadData = {
      labName: params.labName,
      labLicenseNumber: params.labLicenseNumber,
      testDate: params.testDate,
      coaFile: {
        name: params.coaFileName,
        size: params.coaFileSize || 0,
        type: params.coaFileType || 'application/pdf'
      },
      sampleQuantity: params.sampleQuantity,
      sampleUnitOfMeasure: params.sampleUnitOfMeasure,
      notes: params.notes
    }

    const uploadValidation = validateLabTestUpload(uploadData)
    result.errors.push(...uploadValidation.errors.map((e: any) => e.message))
    result.warnings.push(...uploadValidation.warnings.map((w: any) => w.message))

    if (uploadValidation.errors.length > 0) {
      return result
    }

    // Validate test results if provided
    if (params.testResults) {
      const resultsValidation = validateTestResults(params.testResults)
      result.errors.push(...resultsValidation.errors.map((e: any) => e.message))
      result.warnings.push(...resultsValidation.warnings.map((w: any) => w.message))

      if (resultsValidation.errors.length > 0) {
        return result
      }
    }

    // Determine overall status based on test results
    let status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'retesting' = 'pending'
    if (params.testResults) {
      const hasFailures = Object.values(params.testResults).some(test =>
        test?.tested && test?.passed === false
      )
      const hasTests = Object.values(params.testResults).some(test =>
        test?.tested === true
      )

      if (hasTests) {
        status = hasFailures ? 'failed' : 'passed'
      }
    }

    // Create the lab test record
    const labTestData: InsertLabTestResult = {
      organization_id: params.organizationId,
      site_id: params.siteId,
      lab_name: params.labName,
      lab_license_number: params.labLicenseNumber,
      test_date: params.testDate,
      coa_file_url: params.coaFileUrl,
      coa_file_name: params.coaFileName,
      coa_file_size: params.coaFileSize,
      coa_file_type: params.coaFileType,
      coa_uploaded_by: params.userId,
      sample_quantity: params.sampleQuantity,
      sample_unit_of_measure: params.sampleUnitOfMeasure,
      notes: params.notes,
      test_results: params.testResults ? JSON.parse(JSON.stringify(params.testResults)) : {},
      status,
      created_by: params.userId,
      updated_by: params.userId
    }

    const { data: labTest, error: insertError } = await supabase
      .from('lab_test_results')
      .insert(labTestData)
      .select()
      .single()

    if (insertError || !labTest) {
      result.errors.push(`Failed to create lab test: ${insertError?.message || 'Unknown error'}`)
      return result
    }

    result.testId = labTest.id
    result.testNumber = labTest.test_number

    // Check if Metrc sync is available for this site
    const { client: metrcClient, credentials, error: credError } = await createMetrcClientForSite(params.siteId, supabase)

    if (metrcClient && credentials) {
      // Metrc credentials available - prepare for sync (currently disabled for safety)
      // This would sync the test results to Metrc's testing endpoints

      /*
      // Metrc API call would go here
      // POST /labtests/v2/results
      const metrcPayload = {
        LabFacilityLicenseNumber: params.labLicenseNumber,
        LabFacilityName: params.labName,
        ResultDate: params.testDate,
        OverallPassed: status === 'passed',
        TestResults: transformToMetrcTestResults(params.testResults)
      }

      try {
        // const metrcResponse = await metrcClient.labTests.createResults(metrcPayload)
        // if (metrcResponse) {
        //   await supabase
        //     .from('lab_test_results')
        //     .update({
        //       metrc_test_id: metrcResponse.Id,
        //       metrc_sync_status: 'synced',
        //       metrc_last_sync: new Date().toISOString()
        //     })
        //     .eq('id', labTest.id)
        //
        //   result.synced = true
        // }
      } catch (syncError) {
        console.error('Metrc sync error:', syncError)
        result.warnings.push('Lab test created locally but Metrc sync failed. Will retry later.')
      }
      */

      result.warnings.push('Lab test created. Metrc sync is currently disabled for safety.')
    }

    result.success = true
    return result

  } catch (error) {
    console.error('Create lab test error:', error)
    result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred')
    return result
  }
}

/**
 * Links a package to a lab test
 */
export async function linkPackageToTest(
  params: LinkPackageToTestParams
): Promise<PackageLinkResult> {
  const result: PackageLinkResult = {
    success: false,
    errors: [],
    warnings: []
  }

  try {
    const supabase = createClient()

    // Validate the association
    const validation = validatePackageTestAssociation(
      params.packageId,
      params.testId,
      params.sampleTaken,
      params.sampleQuantity
    )

    result.errors.push(...validation.errors.map((e: any) => e.message))
    result.warnings.push(...validation.warnings.map((w: any) => w.message))

    if (validation.errors.length > 0) {
      return result
    }

    // Check if package exists
    const { data: packageData, error: packageError } = await supabase
      .from('harvest_packages')
      .select('id, package_label, status')
      .eq('id', params.packageId)
      .single()

    if (packageError || !packageData) {
      result.errors.push(`Package not found: ${params.packageId}`)
      return result
    }

    // Check if test exists
    const { data: testData, error: testError } = await supabase
      .from('lab_test_results')
      .select('id, status, test_number')
      .eq('id', params.testId)
      .single()

    if (testError || !testData) {
      result.errors.push(`Lab test not found: ${params.testId}`)
      return result
    }

    // Check if association already exists
    const { data: existingLink } = await supabase
      .from('package_test_results')
      .select('id')
      .eq('package_id', params.packageId)
      .eq('test_result_id', params.testId)
      .single()

    if (existingLink) {
      result.errors.push('Package is already linked to this test')
      return result
    }

    // Create the link
    const linkData: InsertPackageTestResult = {
      package_id: params.packageId,
      test_result_id: params.testId,
      package_test_status: testData.status === 'passed' ? 'passed' :
                          testData.status === 'failed' ? 'failed' : 'pending',
      sample_taken: params.sampleTaken || false,
      sample_quantity: params.sampleQuantity,
      sample_unit_of_measure: params.sampleUnitOfMeasure,
      notes: params.notes,
      associated_by: params.userId
    }

    const { data: link, error: linkError } = await supabase
      .from('package_test_results')
      .insert(linkData)
      .select()
      .single()

    if (linkError || !link) {
      result.errors.push(`Failed to link package to test: ${linkError?.message || 'Unknown error'}`)
      return result
    }

    result.linkId = link.id

    // Update package status if test failed
    if (testData.status === 'failed') {
      await supabase
        .from('harvest_packages')
        .update({
          status: 'quarantine',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.packageId)

      result.warnings.push('Package placed in quarantine due to failed test')
    }

    result.success = true
    return result

  } catch (error) {
    console.error('Link package to test error:', error)
    result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred')
    return result
  }
}

/**
 * Updates test results and status
 */
export async function updateTestResults(
  testId: string,
  testResults: TestResultsData,
  userId: string
): Promise<LabTestSyncResult> {
  const result: LabTestSyncResult = {
    success: false,
    synced: false,
    errors: [],
    warnings: []
  }

  try {
    const supabase = createClient()

    // Get current test
    const { data: currentTest, error: fetchError } = await supabase
      .from('lab_test_results')
      .select('*')
      .eq('id', testId)
      .single()

    if (fetchError || !currentTest) {
      result.errors.push(`Lab test not found: ${testId}`)
      return result
    }

    // Validate test results
    const validation = validateTestResults(testResults)
    result.errors.push(...validation.errors.map((e: any) => e.message))
    result.warnings.push(...validation.warnings.map((w: any) => w.message))

    if (validation.errors.length > 0) {
      return result
    }

    // Determine new status
    const hasFailures = Object.values(testResults).some(test =>
      test?.tested && test?.passed === false
    )
    const hasTests = Object.values(testResults).some(test =>
      test?.tested === true
    )

    const newStatus = hasTests ? (hasFailures ? 'failed' : 'passed') : 'pending'

    // Update the test
    const { error: updateError } = await supabase
      .from('lab_test_results')
      .update({
        test_results: JSON.parse(JSON.stringify(testResults)),
        status: newStatus,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', testId)

    if (updateError) {
      result.errors.push(`Failed to update test results: ${updateError.message}`)
      return result
    }

    // Update all linked packages' status
    const { data: linkedPackages } = await supabase
      .from('package_test_results')
      .select('package_id')
      .eq('test_result_id', testId)

    if (linkedPackages && linkedPackages.length > 0) {
      // Update package test status
      await supabase
        .from('package_test_results')
        .update({
          package_test_status: newStatus === 'passed' ? 'passed' :
                              newStatus === 'failed' ? 'failed' : 'pending'
        })
        .eq('test_result_id', testId)

      // Update package quarantine status if test failed
      if (newStatus === 'failed') {
        const packageIds = linkedPackages.map(lp => lp.package_id)
        await supabase
          .from('harvest_packages')
          .update({
            status: 'quarantine',
            updated_at: new Date().toISOString()
          })
          .in('id', packageIds)

        result.warnings.push(`${packageIds.length} package(s) placed in quarantine due to failed test`)
      } else if (newStatus === 'passed') {
        // Remove from quarantine if passed and was quarantined due to this test
        const packageIds = linkedPackages.map(lp => lp.package_id)

        // Check if packages have other failing tests
        const { data: otherFailedTests } = await supabase
          .from('package_test_results')
          .select('package_id')
          .in('package_id', packageIds)
          .neq('test_result_id', testId)
          .eq('package_test_status', 'failed')

        const packagesWithOtherFailures = new Set(
          otherFailedTests?.map(t => t.package_id) || []
        )

        const packagesToRelease = packageIds.filter(
          id => !packagesWithOtherFailures.has(id)
        )

        if (packagesToRelease.length > 0) {
          await supabase
            .from('harvest_packages')
            .update({
              status: 'ready_for_sale',
              updated_at: new Date().toISOString()
            })
            .in('id', packagesToRelease)
            .eq('status', 'quarantine')

          result.warnings.push(`${packagesToRelease.length} package(s) released from quarantine`)
        }
      }
    }

    result.success = true
    result.testId = testId
    result.testNumber = currentTest.test_number

    return result

  } catch (error) {
    console.error('Update test results error:', error)
    result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred')
    return result
  }
}

/**
 * Gets test status for a package
 */
export async function getPackageTestStatus(packageId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('package_test_results')
    .select(`
      *,
      lab_test_results (
        id,
        test_number,
        lab_name,
        test_date,
        status,
        test_results,
        coa_file_url
      )
    `)
    .eq('package_id', packageId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching package test status:', error)
    return null
  }

  return data
}

/**
 * Checks if a package can be sold (has passing tests for required categories)
 */
export async function canPackageBeSold(
  packageId: string,
  productType?: 'flower' | 'concentrate' | 'edible' | 'topical'
): Promise<{ canSell: boolean; reasons: string[] }> {
  const result = { canSell: true, reasons: [] as string[] }

  try {
    const supabase = createClient()

    // Get all test results for the package
    const { data: testResults } = await supabase
      .from('package_test_results')
      .select(`
        package_test_status,
        lab_test_results (
          status,
          test_results,
          test_date
        )
      `)
      .eq('package_id', packageId) as { data: Array<{
        package_test_status: string
        lab_test_results: {
          status: string
          test_results: TestResultsData
          test_date: string
        } | null
      }> | null }

    if (!testResults || testResults.length === 0) {
      result.canSell = false
      result.reasons.push('No test results found for this package')
      return result
    }

    // Check for any failed tests
    const hasFailedTests = testResults.some(
      tr => tr.package_test_status === 'failed'
    )

    if (hasFailedTests) {
      result.canSell = false
      result.reasons.push('Package has failed test results')
      return result
    }

    // Get the most recent test
    const mostRecentTest = testResults
      .filter(tr => tr.lab_test_results?.test_date)
      .sort((a, b) => {
        const dateA = new Date(a.lab_test_results!.test_date).getTime()
        const dateB = new Date(b.lab_test_results!.test_date).getTime()
        return dateB - dateA
      })[0]

    if (!mostRecentTest) {
      result.canSell = false
      result.reasons.push('No valid test results found')
      return result
    }

    // Check if test is too old (e.g., more than 1 year)
    const testDate = new Date(mostRecentTest.lab_test_results!.test_date)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    if (testDate < oneYearAgo) {
      result.canSell = false
      result.reasons.push('Test results are more than 1 year old')
      return result
    }

    // Check for required test types based on product type
    if (productType) {
      const requiredTests = {
        flower: ['potency', 'pesticides', 'microbials'],
        concentrate: ['potency', 'pesticides', 'microbials', 'heavy_metals'],
        edible: ['potency', 'pesticides', 'microbials', 'heavy_metals'],
        topical: ['potency', 'pesticides', 'microbials']
      }

      const required = requiredTests[productType] || []
      const testData = mostRecentTest.lab_test_results?.test_results as TestResultsData || {}

      for (const testType of required) {
        const test = testData[testType as keyof TestResultsData]
        if (!test || !test.tested) {
          result.canSell = false
          result.reasons.push(`Missing required test: ${testType}`)
        } else if (test.passed === false) {
          result.canSell = false
          result.reasons.push(`Failed ${testType} test`)
        }
      }
    }

    return result

  } catch (error) {
    console.error('Error checking package sale eligibility:', error)
    return {
      canSell: false,
      reasons: ['Error checking test requirements']
    }
  }
}

/**
 * Transform test results to Metrc format (for future use)
 */
function transformToMetrcTestResults(results?: TestResultsData) {
  if (!results) return []

  const metrcResults = []

  // Transform potency results
  if (results.potency?.tested) {
    if (results.potency.thc_percent !== undefined) {
      metrcResults.push({
        TestTypeName: 'THC',
        TestPassed: results.potency.passed,
        TestValue: results.potency.thc_percent,
        TestUnits: 'Percentage'
      })
    }
    if (results.potency.cbd_percent !== undefined) {
      metrcResults.push({
        TestTypeName: 'CBD',
        TestPassed: results.potency.passed,
        TestValue: results.potency.cbd_percent,
        TestUnits: 'Percentage'
      })
    }
  }

  // Transform other test types similarly...
  // This would be expanded based on Metrc's specific requirements

  return metrcResults
}