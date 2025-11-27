#!/usr/bin/env node
/**
 * Metrc Interactive API Test - Alaska Sandbox
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const VENDOR_API_KEY = process.env.METRC_VENDOR_KEY_AK
const USER_API_KEY = process.env.METRC_USER_KEY_AK
const FACILITY_LICENSE = process.env.METRC_FACILITY_LICENSE_AK || '4a-12345'
const BASE_URL = 'https://sandbox-api-ak.metrc.com'

interface MetrcResponse<T> {
  Data: T[]
  Total: number
  TotalRecords: number
  PageSize: number
  RecordsOnPage: number
}

async function makeRequest<T = any>(endpoint: string, licenseNumber?: string): Promise<{ data: T[], total: number } | null> {
  const url = licenseNumber
    ? `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}licenseNumber=${licenseNumber}`
    : `${BASE_URL}${endpoint}`

  console.log(`\n📡 GET ${url}`)

  // Metrc uses Basic Auth: vendor_key:user_key
  const credentials = Buffer.from(`${VENDOR_API_KEY}:${USER_API_KEY}`).toString('base64')

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
  })

  const rawData = await response.json()

  if (!response.ok) {
    console.log(`❌ Status: ${response.status}`)
    console.log('Error:', JSON.stringify(rawData, null, 2))
    return null
  }

  console.log(`✅ Status: ${response.status}`)

  // Handle paginated response (v2 API) vs direct array (v1 or some endpoints)
  if (rawData && typeof rawData === 'object' && 'Data' in rawData) {
    return { data: rawData.Data, total: rawData.TotalRecords || rawData.Data.length }
  }

  // Direct array response
  if (Array.isArray(rawData)) {
    return { data: rawData, total: rawData.length }
  }

  return { data: [], total: 0 }
}

async function main() {
  console.log('='.repeat(60))
  console.log('🧪 Metrc Alaska Sandbox - Interactive Test')
  console.log('='.repeat(60))
  console.log(`\nBase URL: ${BASE_URL}`)
  console.log(`Vendor Key: ${VENDOR_API_KEY ? '✓ Set' : '✗ Missing'}`)
  console.log(`User Key: ${USER_API_KEY ? '✓ Set' : '✗ Missing'}`)

  if (!VENDOR_API_KEY || !USER_API_KEY) {
    console.error('\n❌ Missing API keys in .env.local')
    process.exit(1)
  }

  console.log(`Facility: ${FACILITY_LICENSE}`)

  // Step 1: Get Facilities
  console.log('\n' + '='.repeat(60))
  console.log('STEP 1: Get Facilities')
  console.log('='.repeat(60))

  const facilities = await makeRequest('/facilities/v2/')

  if (facilities) {
    console.log(`\nFound ${facilities.total} facility(ies)`)
    const targetFacility = facilities.data.find((f: any) => f.License?.Number === FACILITY_LICENSE)
    if (targetFacility) {
      console.log(`\n✓ Using: ${targetFacility.Name} (${targetFacility.License?.LicenseType})`)
    }
  }

  // Step 2: Get Locations
  console.log('\n' + '='.repeat(60))
  console.log('STEP 2: Locations')
  console.log('='.repeat(60))

  const locations = await makeRequest('/locations/v2/active', FACILITY_LICENSE)

  if (locations) {
    console.log(`\nFound ${locations.total} location(s):`)
    if (locations.data.length === 0) {
      console.log('  (empty - no locations configured)')
    } else {
      locations.data.slice(0, 10).forEach((loc: any) => {
        console.log(`  - ${loc.Name} (ID: ${loc.Id}, Type: ${loc.LocationTypeName})`)
      })
      if (locations.data.length > 10) console.log(`  ... and ${locations.data.length - 10} more`)
    }
  }

  // Step 3: Get Strains
  console.log('\n' + '='.repeat(60))
  console.log('STEP 3: Strains')
  console.log('='.repeat(60))

  const strains = await makeRequest('/strains/v2/active', FACILITY_LICENSE)

  if (strains) {
    console.log(`\nFound ${strains.total} strain(s):`)
    if (strains.data.length === 0) {
      console.log('  (empty)')
    } else {
      strains.data.slice(0, 10).forEach((strain: any) => {
        console.log(`  - ${strain.Name} (ID: ${strain.Id}, Indica: ${strain.IndicaPercentage}%, Sativa: ${strain.SativaPercentage}%)`)
      })
      if (strains.data.length > 10) console.log(`  ... and ${strains.data.length - 10} more`)
    }
  }

  // Step 4: Get Items
  console.log('\n' + '='.repeat(60))
  console.log('STEP 4: Items')
  console.log('='.repeat(60))

  const items = await makeRequest('/items/v2/active', FACILITY_LICENSE)

  if (items) {
    console.log(`\nFound ${items.total} item(s):`)
    if (items.data.length === 0) {
      console.log('  (empty)')
    } else {
      items.data.slice(0, 10).forEach((item: any) => {
        console.log(`  - ${item.Name} (ID: ${item.Id}, Category: ${item.ProductCategoryName})`)
      })
      if (items.data.length > 10) console.log(`  ... and ${items.data.length - 10} more`)
    }
  }

  // Step 5: Get Plant Batches
  console.log('\n' + '='.repeat(60))
  console.log('STEP 5: Plant Batches')
  console.log('='.repeat(60))

  const batches = await makeRequest('/plantbatches/v2/active', FACILITY_LICENSE)

  if (batches) {
    console.log(`\nFound ${batches.total} plant batch(es):`)
    if (batches.data.length === 0) {
      console.log('  (empty)')
    } else {
      batches.data.slice(0, 10).forEach((batch: any) => {
        console.log(`  - ${batch.Name} (ID: ${batch.Id}, Count: ${batch.UntrackedCount}, Strain: ${batch.StrainName})`)
      })
      if (batches.data.length > 10) console.log(`  ... and ${batches.data.length - 10} more`)
    }
  }

  // Step 6: Get Vegetative Plants
  console.log('\n' + '='.repeat(60))
  console.log('STEP 6: Plants (Vegetative)')
  console.log('='.repeat(60))

  const vegPlants = await makeRequest('/plants/v2/vegetative', FACILITY_LICENSE)

  if (vegPlants) {
    console.log(`\nFound ${vegPlants.total} vegetative plant(s):`)
    if (vegPlants.data.length === 0) {
      console.log('  (empty)')
    } else {
      vegPlants.data.slice(0, 5).forEach((plant: any) => {
        console.log(`  - ${plant.Label} (ID: ${plant.Id}, Strain: ${plant.StrainName})`)
      })
      if (vegPlants.data.length > 5) console.log(`  ... and ${vegPlants.data.length - 5} more`)
    }
  }

  // Step 7: Get Flowering Plants
  console.log('\n' + '='.repeat(60))
  console.log('STEP 7: Plants (Flowering)')
  console.log('='.repeat(60))

  const flowerPlants = await makeRequest('/plants/v2/flowering', FACILITY_LICENSE)

  if (flowerPlants) {
    console.log(`\nFound ${flowerPlants.total} flowering plant(s):`)
    if (flowerPlants.data.length === 0) {
      console.log('  (empty)')
    } else {
      flowerPlants.data.slice(0, 5).forEach((plant: any) => {
        console.log(`  - ${plant.Label} (ID: ${plant.Id}, Strain: ${plant.StrainName})`)
      })
      if (flowerPlants.data.length > 5) console.log(`  ... and ${flowerPlants.data.length - 5} more`)
    }
  }

  // Step 8: Get Harvests
  console.log('\n' + '='.repeat(60))
  console.log('STEP 8: Harvests')
  console.log('='.repeat(60))

  const harvests = await makeRequest('/harvests/v2/active', FACILITY_LICENSE)

  if (harvests) {
    console.log(`\nFound ${harvests.total} harvest(s):`)
    if (harvests.data.length === 0) {
      console.log('  (empty)')
    } else {
      harvests.data.slice(0, 5).forEach((h: any) => {
        console.log(`  - ${h.Name} (ID: ${h.Id}, Weight: ${h.CurrentWeight} ${h.UnitOfWeightName})`)
      })
      if (harvests.data.length > 5) console.log(`  ... and ${harvests.data.length - 5} more`)
    }
  }

  // Step 9: Get Packages
  console.log('\n' + '='.repeat(60))
  console.log('STEP 9: Packages')
  console.log('='.repeat(60))

  const packages = await makeRequest('/packages/v2/active', FACILITY_LICENSE)

  if (packages) {
    console.log(`\nFound ${packages.total} package(s):`)
    if (packages.data.length === 0) {
      console.log('  (empty)')
    } else {
      packages.data.slice(0, 5).forEach((pkg: any) => {
        console.log(`  - ${pkg.Label} (ID: ${pkg.Id}, Item: ${pkg.Item?.Name}, Qty: ${pkg.Quantity} ${pkg.UnitOfMeasureName})`)
      })
      if (packages.data.length > 5) console.log(`  ... and ${packages.data.length - 5} more`)
    }
  }

  // Step 10: Get Transfers
  console.log('\n' + '='.repeat(60))
  console.log('STEP 10: Transfers (Incoming)')
  console.log('='.repeat(60))

  const incomingTransfers = await makeRequest('/transfers/v2/incoming', FACILITY_LICENSE)

  if (incomingTransfers) {
    console.log(`\nFound ${incomingTransfers.total} incoming transfer(s):`)
    if (incomingTransfers.data.length === 0) {
      console.log('  (empty)')
    } else {
      incomingTransfers.data.slice(0, 5).forEach((t: any) => {
        console.log(`  - Manifest: ${t.ManifestNumber} (ID: ${t.Id}, From: ${t.ShipperFacilityName})`)
      })
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ All endpoints tested!')
  console.log('='.repeat(60))

  // Test the MetrcClient class with Basic Auth
  console.log('\n' + '='.repeat(60))
  console.log('BONUS: Testing MetrcClient class')
  console.log('='.repeat(60))

  const { MetrcClient } = await import('../lib/compliance/metrc/client')

  const client = new MetrcClient({
    vendorApiKey: VENDOR_API_KEY,
    userApiKey: USER_API_KEY,
    facilityLicenseNumber: FACILITY_LICENSE,
    state: 'AK',
    isSandbox: true,
  })

  try {
    const isValid = await client.validateCredentials()
    console.log(`\n✅ MetrcClient credentials valid: ${isValid}`)

    const locationsResult = await client.locations.listActive()
    console.log(`✅ MetrcClient locations.listActive(): ${locationsResult.total} locations`)
  } catch (error) {
    console.log(`\n❌ MetrcClient error: ${(error as Error).message}`)
  }
}

main().catch(console.error)
