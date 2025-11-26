/**
 * Metrc Lab Tests Endpoint (Read-Only)
 *
 * Provides read access to lab test data from Metrc.
 *
 * NOTE: This is a READ-ONLY endpoint for cultivators.
 * Labs are responsible for submitting test results to Metrc.
 * Cultivators use this to:
 * - Verify test results submitted by labs
 * - Get available test types and states
 * - Track which packages have been tested
 */

import type { MetrcClient } from '../client'
import type { MetrcLabTestType, MetrcLabTestBatch, MetrcLabTestResult } from '../types'

export class LabTestsEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get all available lab test states
   *
   * States include: NotSubmitted, SubmittedForTesting, TestPassed, TestFailed, etc.
   *
   * @returns Array of test state strings
   */
  async listStates(): Promise<string[]> {
    return this.client.request<string[]>('/labtests/v2/states', {
      method: 'GET',
    })
  }

  /**
   * Get all available lab test types
   *
   * Types include various testing categories required by state regulations:
   * - Potency (THC, CBD levels)
   * - Pesticides
   * - Heavy metals
   * - Microbials
   * - Residual solvents
   * - Mycotoxins
   * - Foreign materials
   * - Moisture content
   *
   * @returns Array of lab test types
   */
  async listTypes(): Promise<MetrcLabTestType[]> {
    return this.client.request<MetrcLabTestType[]>('/labtests/v2/types', {
      method: 'GET',
    })
  }

  /**
   * Get lab test batches (results submitted by labs)
   *
   * Returns test results that have been submitted to Metrc.
   * Use this to verify what the lab has reported.
   *
   * @param lastModifiedStart - Optional filter for tests modified after this date
   * @param lastModifiedEnd - Optional filter for tests modified before this date
   * @returns Array of lab test batches with results
   */
  async listBatches(lastModifiedStart?: string, lastModifiedEnd?: string): Promise<MetrcLabTestBatch[]> {
    let endpoint = '/labtests/v2/batches'
    const params: string[] = []

    if (lastModifiedStart) {
      params.push(`lastModifiedStart=${encodeURIComponent(lastModifiedStart)}`)
    }
    if (lastModifiedEnd) {
      params.push(`lastModifiedEnd=${encodeURIComponent(lastModifiedEnd)}`)
    }

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`
    }

    return this.client.request<MetrcLabTestBatch[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get lab test results for a specific package
   *
   * Returns all test results associated with a package label.
   *
   * @param packageId - The Metrc package ID
   * @returns Array of lab test results
   */
  async getResultsByPackageId(packageId: number): Promise<MetrcLabTestResult[]> {
    return this.client.request<MetrcLabTestResult[]>(`/labtests/v2/results?packageId=${packageId}`, {
      method: 'GET',
    })
  }

  /**
   * Get lab test results by package label
   *
   * Convenience method to get results by the package tag/label.
   *
   * @param packageLabel - The package tag (e.g., "1A4000000000000000012345")
   * @returns Array of lab test results or null if not found
   */
  async getResultsByLabel(packageLabel: string): Promise<MetrcLabTestBatch | null> {
    try {
      const batches = await this.listBatches()
      const found = batches.find(
        (batch) => batch.PackageLabel === packageLabel
      )
      return found || null
    } catch (error) {
      console.error('Error fetching lab test results by label:', error)
      return null
    }
  }

  /**
   * Check if a package has passed all required tests
   *
   * Utility method to quickly check compliance status.
   *
   * @param packageLabel - The package tag
   * @returns Object with pass status and details
   */
  async checkPackageTestStatus(packageLabel: string): Promise<{
    found: boolean
    passed: boolean
    testDate: string | null
    labName: string | null
    failedTests: string[]
  }> {
    const result = {
      found: false,
      passed: false,
      testDate: null as string | null,
      labName: null as string | null,
      failedTests: [] as string[],
    }

    const batch = await this.getResultsByLabel(packageLabel)

    if (!batch) {
      return result
    }

    result.found = true
    result.passed = batch.OverallPassed
    result.testDate = batch.TestPerformedDate
    result.labName = batch.LabFacilityName

    // Collect failed tests
    if (batch.TestResults) {
      result.failedTests = batch.TestResults
        .filter((test) => !test.TestPassed)
        .map((test) => test.TestTypeName)
    }

    return result
  }

  /**
   * Get packages pending lab testing
   *
   * Returns packages that have been submitted for testing but don't have results yet.
   * This requires checking package status, not the lab tests endpoint directly.
   *
   * @returns Array of package labels pending testing
   */
  async getPendingPackages(): Promise<string[]> {
    // Get all batches and find those without final results
    const batches = await this.listBatches()

    // Filter to packages that are in testing but not yet complete
    // Note: This is a simplified check - actual implementation may need
    // to cross-reference with packages endpoint
    return batches
      .filter((batch) => !batch.OverallPassed && batch.TestResults.length === 0)
      .map((batch) => batch.PackageLabel)
  }

  /**
   * Get test results summary for multiple packages
   *
   * Batch lookup for efficiency when checking multiple packages.
   *
   * @param packageLabels - Array of package labels to check
   * @returns Map of package label to test status
   */
  async getResultsSummary(packageLabels: string[]): Promise<Map<string, {
    found: boolean
    passed: boolean
    testDate: string | null
  }>> {
    const results = new Map<string, { found: boolean; passed: boolean; testDate: string | null }>()

    // Initialize all as not found
    for (const label of packageLabels) {
      results.set(label, { found: false, passed: false, testDate: null })
    }

    // Fetch all batches and match
    const batches = await this.listBatches()
    const labelSet = new Set(packageLabels)

    for (const batch of batches) {
      if (labelSet.has(batch.PackageLabel)) {
        results.set(batch.PackageLabel, {
          found: true,
          passed: batch.OverallPassed,
          testDate: batch.TestPerformedDate,
        })
      }
    }

    return results
  }
}
