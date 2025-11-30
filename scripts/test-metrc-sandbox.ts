#!/usr/bin/env node

/**
 * Metrc Sandbox Integration Test Script
 *
 * Tests seed-to-sale workflow against Oregon and Maryland Metrc sandbox APIs.
 *
 * Prerequisites:
 *   - Set sandbox credentials in environment variables or .env.local
 *   - METRC_VENDOR_API_KEY - Vendor API key
 *   - METRC_USER_API_KEY - User API key for facility
 *   - METRC_FACILITY_LICENSE - Facility license number
 *   - METRC_STATE - State code (OR or MD)
 *
 * Usage:
 *   npx ts-node scripts/test-metrc-sandbox.ts
 *   # or with state override:
 *   METRC_STATE=MD npx ts-node scripts/test-metrc-sandbox.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { getMetrcBaseUrl } from '../lib/compliance/metrc/config'

// Configuration from environment
const VENDOR_API_KEY = process.env.METRC_VENDOR_API_KEY
const USER_API_KEY = process.env.METRC_USER_API_KEY
const FACILITY_LICENSE = process.env.METRC_FACILITY_LICENSE
const STATE_CODE = process.env.METRC_STATE || 'OR'
const USE_SANDBOX = true

interface TestResult {
  name: string
  passed: boolean
  error?: string
  data?: unknown
}

class MetrcSandboxTester {
  private baseUrl: string
  private headers: Record<string, string>
  private results: TestResult[] = []

  constructor() {
    this.baseUrl = getMetrcBaseUrl(STATE_CODE, USE_SANDBOX)
    this.headers = {
      'Content-Type': 'application/json',
      'x-api-key': VENDOR_API_KEY || '',
      'x-user-api-key': USER_API_KEY || '',
    }
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<{ ok: boolean; status: number; data: unknown; error?: string }> {
    try {
      const options: RequestInit = {
        method,
        headers: this.headers,
      }

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, options)

      let data
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
        error: !response.ok ? `HTTP ${response.status}` : undefined,
      }
    } catch (error) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: (error as Error).message,
      }
    }
  }

  private addResult(name: string, passed: boolean, error?: string, data?: unknown): void {
    this.results.push({ name, passed, error, data })
    const icon = passed ? '✓' : '✗'
    const color = passed ? '\x1b[32m' : '\x1b[31m'
    console.log(`  ${color}${icon}\x1b[0m ${name}`)
    if (!passed && error) {
      console.log(`    \x1b[33m→ ${error}\x1b[0m`)
    }
  }

  async testCredentials(): Promise<void> {
    console.log('\n📋 Testing Credentials...')

    const result = await this.makeRequest('/facilities/v2/')

    if (result.ok) {
      const facilities = result.data as Array<{ Name: string; License: { Number: string } }>
      this.addResult(
        `Credentials valid - ${facilities?.length || 0} facilities found`,
        true,
        undefined,
        facilities
      )
    } else {
      this.addResult('Credentials validation', false, result.error)
    }
  }

  async testStrains(): Promise<void> {
    console.log('\n🌱 Testing Strains Endpoint...')

    // Get active strains
    const result = await this.makeRequest(`/strains/v2/active?licenseNumber=${FACILITY_LICENSE}`)

    if (result.ok) {
      const strains = result.data as unknown[]
      this.addResult(`Get active strains - ${strains?.length || 0} found`, true)
    } else {
      this.addResult('Get active strains', false, result.error)
    }
  }

  async testItems(): Promise<void> {
    console.log('\n📦 Testing Items Endpoint...')

    // Get active items
    const result = await this.makeRequest(`/items/v2/active?licenseNumber=${FACILITY_LICENSE}`)

    if (result.ok) {
      const items = result.data as unknown[]
      this.addResult(`Get active items - ${items?.length || 0} found`, true)
    } else {
      this.addResult('Get active items', false, result.error)
    }
  }

  async testPlantBatches(): Promise<void> {
    console.log('\n🌿 Testing Plant Batches Endpoint...')

    // Get active plant batches
    const result = await this.makeRequest(`/plantbatches/v2/active?licenseNumber=${FACILITY_LICENSE}`)

    if (result.ok) {
      const batches = result.data as unknown[]
      this.addResult(`Get active plant batches - ${batches?.length || 0} found`, true)
    } else {
      this.addResult('Get active plant batches', false, result.error)
    }
  }

  async testPlants(): Promise<void> {
    console.log('\n🌲 Testing Plants Endpoint...')

    // Get vegetative plants
    const vegResult = await this.makeRequest(`/plants/v2/vegetative?licenseNumber=${FACILITY_LICENSE}`)

    if (vegResult.ok) {
      const plants = vegResult.data as unknown[]
      this.addResult(`Get vegetative plants - ${plants?.length || 0} found`, true)
    } else {
      this.addResult('Get vegetative plants', false, vegResult.error)
    }

    // Get flowering plants
    const flowerResult = await this.makeRequest(`/plants/v2/flowering?licenseNumber=${FACILITY_LICENSE}`)

    if (flowerResult.ok) {
      const plants = flowerResult.data as unknown[]
      this.addResult(`Get flowering plants - ${plants?.length || 0} found`, true)
    } else {
      this.addResult('Get flowering plants', false, flowerResult.error)
    }
  }

  async testHarvests(): Promise<void> {
    console.log('\n🌾 Testing Harvests Endpoint...')

    // Get active harvests
    const result = await this.makeRequest(`/harvests/v2/active?licenseNumber=${FACILITY_LICENSE}`)

    if (result.ok) {
      const harvests = result.data as unknown[]
      this.addResult(`Get active harvests - ${harvests?.length || 0} found`, true)
    } else {
      this.addResult('Get active harvests', false, result.error)
    }
  }

  async testPackages(): Promise<void> {
    console.log('\n📦 Testing Packages Endpoint...')

    // Get active packages
    const result = await this.makeRequest(`/packages/v2/active?licenseNumber=${FACILITY_LICENSE}`)

    if (result.ok) {
      const packages = result.data as unknown[]
      this.addResult(`Get active packages - ${packages?.length || 0} found`, true)
    } else {
      this.addResult('Get active packages', false, result.error)
    }
  }

  async testLabTests(): Promise<void> {
    console.log('\n🧪 Testing Lab Tests Endpoint...')

    // Get lab test states
    const statesResult = await this.makeRequest(`/labtests/v2/states`)

    if (statesResult.ok) {
      const states = statesResult.data as unknown[]
      this.addResult(`Get lab test states - ${states?.length || 0} found`, true)
    } else {
      this.addResult('Get lab test states', false, statesResult.error)
    }

    // Get lab test types (required for compliance)
    const typesResult = await this.makeRequest(`/labtests/v2/types`)

    if (typesResult.ok) {
      const types = typesResult.data as unknown[]
      this.addResult(`Get lab test types - ${types?.length || 0} found`, true)
    } else {
      this.addResult('Get lab test types', false, typesResult.error)
    }
  }

  async testTransfers(): Promise<void> {
    console.log('\n🚚 Testing Transfers Endpoint...')

    // Get incoming transfers
    const incomingResult = await this.makeRequest(`/transfers/v2/incoming?licenseNumber=${FACILITY_LICENSE}`)

    if (incomingResult.ok) {
      const transfers = incomingResult.data as unknown[]
      this.addResult(`Get incoming transfers - ${transfers?.length || 0} found`, true)
    } else {
      this.addResult('Get incoming transfers', false, incomingResult.error)
    }

    // Get outgoing transfers
    const outgoingResult = await this.makeRequest(`/transfers/v2/outgoing?licenseNumber=${FACILITY_LICENSE}`)

    if (outgoingResult.ok) {
      const transfers = outgoingResult.data as unknown[]
      this.addResult(`Get outgoing transfers - ${transfers?.length || 0} found`, true)
    } else {
      this.addResult('Get outgoing transfers', false, outgoingResult.error)
    }
  }

  async testLocations(): Promise<void> {
    console.log('\n📍 Testing Locations Endpoint...')

    // Get active locations
    const result = await this.makeRequest(`/locations/v2/active?licenseNumber=${FACILITY_LICENSE}`)

    if (result.ok) {
      const locations = result.data as unknown[]
      this.addResult(`Get active locations - ${locations?.length || 0} found`, true)
    } else {
      this.addResult('Get active locations', false, result.error)
    }
  }

  async testTags(): Promise<void> {
    console.log('\n🏷️ Testing Tags Endpoint...')

    // Get available plant tags
    const plantTagsResult = await this.makeRequest(`/tags/v2/plant/available?licenseNumber=${FACILITY_LICENSE}`)

    if (plantTagsResult.ok) {
      const tags = plantTagsResult.data as unknown[]
      this.addResult(`Get available plant tags - ${tags?.length || 0} found`, true)
    } else {
      this.addResult('Get available plant tags', false, plantTagsResult.error)
    }

    // Get available package tags
    const packageTagsResult = await this.makeRequest(`/tags/v2/package/available?licenseNumber=${FACILITY_LICENSE}`)

    if (packageTagsResult.ok) {
      const tags = packageTagsResult.data as unknown[]
      this.addResult(`Get available package tags - ${tags?.length || 0} found`, true)
    } else {
      this.addResult('Get available package tags', false, packageTagsResult.error)
    }
  }

  async testUnitsOfMeasure(): Promise<void> {
    console.log('\n📐 Testing Units of Measure...')

    const result = await this.makeRequest('/unitsofmeasure/v2/active')

    if (result.ok) {
      const units = result.data as unknown[]
      this.addResult(`Get units of measure - ${units?.length || 0} found`, true)
    } else {
      this.addResult('Get units of measure', false, result.error)
    }
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 Test Summary')
    console.log('='.repeat(60))

    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total = this.results.length

    console.log(`\n  Total:  ${total}`)
    console.log(`  \x1b[32mPassed: ${passed}\x1b[0m`)
    console.log(`  \x1b[31mFailed: ${failed}\x1b[0m`)

    if (failed > 0) {
      console.log('\nFailed tests:')
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  \x1b[31m✗\x1b[0m ${r.name}: ${r.error}`)
        })
    }

    console.log('\n' + '='.repeat(60))
    console.log(failed === 0 ? '\n✅ All tests passed!\n' : '\n❌ Some tests failed.\n')
  }

  async runAllTests(): Promise<void> {
    console.log('='.repeat(60))
    console.log('🧪 Metrc Sandbox Integration Tests')
    console.log('='.repeat(60))
    console.log(`\n  State: ${STATE_CODE}`)
    console.log(`  Environment: Sandbox`)
    console.log(`  Base URL: ${this.baseUrl}`)
    console.log(`  Facility: ${FACILITY_LICENSE}`)

    await this.testCredentials()

    // Only continue if credentials are valid
    if (!this.results[0].passed) {
      console.log('\n❌ Cannot continue - credentials are invalid')
      this.printSummary()
      process.exit(1)
    }

    await this.testStrains()
    await this.testItems()
    await this.testPlantBatches()
    await this.testPlants()
    await this.testHarvests()
    await this.testPackages()
    await this.testLabTests()
    await this.testTransfers()
    await this.testLocations()
    await this.testTags()
    await this.testUnitsOfMeasure()

    this.printSummary()
  }
}

// Main execution
async function main(): Promise<void> {
  // Validate required environment variables
  if (!VENDOR_API_KEY || !USER_API_KEY || !FACILITY_LICENSE) {
    console.error('\n❌ Missing required environment variables:\n')
    console.error('  METRC_VENDOR_API_KEY:', VENDOR_API_KEY ? '✓' : '✗')
    console.error('  METRC_USER_API_KEY:', USER_API_KEY ? '✓' : '✗')
    console.error('  METRC_FACILITY_LICENSE:', FACILITY_LICENSE ? '✓' : '✗')
    console.error('\nPlease set these in .env.local or export them before running.\n')
    process.exit(1)
  }

  const tester = new MetrcSandboxTester()
  await tester.runAllTests()
}

main().catch((error) => {
  console.error('\n❌ Test script error:', error)
  process.exit(1)
})
