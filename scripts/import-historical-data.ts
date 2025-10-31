#!/usr/bin/env ts-node
/**
 * Import Historical TagoIO Data
 * 
 * One-time script to fetch historical data from TagoIO and populate database.
 * Fetches last 24 hours of data by default.
 * 
 * Usage:
 *   npx ts-node -r tsconfig-paths/register --project scripts/tsconfig.json scripts/import-historical-data.ts <user-email> [hours]
 *   
 * Example:
 *   npx ts-node -r tsconfig-paths/register --project scripts/tsconfig.json scripts/import-historical-data.ts agam@trazo.ag 24
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createTagoIOClient } from '@/lib/tagoio/client'
import { transformTagoIOData, deduplicateReadings, sortReadingsByTimestamp } from '@/lib/tagoio/transformer'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
} as const

type ColorName = keyof typeof colors

function log(message: string, color: ColorName = 'reset') {
  const timestamp = new Date().toISOString()
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
}

async function importHistoricalData() {
  const userEmail = process.argv[2]
  const hours = parseInt(process.argv[3] || '24', 10)

  if (!userEmail) {
    console.error('Usage: import-historical-data.ts <user-email> [hours]')
    process.exit(1)
  }

  log(`📊 Historical Data Import`, 'cyan')
  log(`────────────────────────────────────────────────────────────────────────────────`, 'cyan')
  log(`User: ${userEmail}`)
  log(`Time range: Last ${hours} hours`)
  log(`────────────────────────────────────────────────────────────────────────────────`, 'cyan')

  try {
    // Connect to Supabase US region (adjust if needed)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createServiceClient(supabaseUrl, supabaseKey)

    // Find user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .eq('email', userEmail)
      .single()

    if (userError || !userData) {
      throw new Error(`User not found: ${userEmail}`)
    }

    log(`✅ Found user (${userData.role})`, 'green')

    // Get all pods with device tokens for this organization
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id')
      .eq('organization_id', userData.organization_id)
      .eq('is_active', true)

    if (sitesError || !sites) {
      throw new Error('Failed to fetch sites')
    }

    const siteIds = sites.map(s => s.id)
    log(`Found ${siteIds.length} sites`, 'blue')

    // Get pods with device tokens
    const { data: pods, error: podsError } = await supabase
      .from('pods')
      .select(`
        id,
        name,
        tagoio_device_id,
        tagoio_device_token,
        room_id,
        rooms!inner (
          site_id
        )
      `)
      .in('rooms.site_id', siteIds)
      .not('tagoio_device_id', 'is', null)
      .not('tagoio_device_token', 'is', null)
      .eq('is_active', true)

    if (podsError || !pods || pods.length === 0) {
      throw new Error('No pods with TagoIO devices found')
    }

    log(`Found ${pods.length} pods with TagoIO devices`, 'green')
    log(`────────────────────────────────────────────────────────────────────────────────`, 'cyan')

    // Calculate time range
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)

    log(`📡 Fetching data from ${startTime.toISOString()} to ${endTime.toISOString()}`)

    let totalInserted = 0

    // Process each pod
    for (const pod of pods) {
      try {
        log(`\n🔄 Processing pod: ${pod.name}`, 'bright')
        
        const token = pod.tagoio_device_token
        if (!token) {
          log(`⚠️  No device token, skipping`, 'yellow')
          continue
        }

        // Create TagoIO client
        const client = createTagoIOClient(token)

        // Fetch historical data (sensors + equipment status)
        log(`   Fetching data from TagoIO...`)
        const dataPoints = await client.fetchDataSince(
          startTime.toISOString(),
          ['temp', 'hum', 'co2', 'light_state', 'co2_valve', 'cooling_valve', 'ex_fan', 'dehum']
        )

        if (dataPoints.length === 0) {
          log(`   ⚠️  No data found`, 'yellow')
          continue
        }

        log(`   📦 Received ${dataPoints.length} data points`)

        // Transform data
        const transformation = transformTagoIOData(dataPoints, pod.id)
        log(`   🔄 Transformed ${transformation.successful.length} readings`)

        if (transformation.errors.length > 0) {
          log(`   ⚠️  ${transformation.errors.length} transformation errors`, 'yellow')
        }

        if (transformation.successful.length === 0) {
          log(`   ⚠️  No valid readings after transformation`, 'yellow')
          continue
        }

        // Deduplicate and sort
        const deduplicated = deduplicateReadings(transformation.successful)
        const sorted = sortReadingsByTimestamp(deduplicated)
        log(`   📊 ${sorted.length} unique readings after deduplication`)

        // Insert in batches using service client (not Next.js createClient which needs cookies)
        const batchSize = 100
        let inserted = 0

        for (let i = 0; i < sorted.length; i += batchSize) {
          const batch = sorted.slice(i, i + batchSize)
          
          const { error } = await supabase
            .from('telemetry_readings')
            .insert(batch)

          if (error) {
            log(`   ❌ Batch insert error: ${error.message}`, 'red')
            continue
          }

          inserted += batch.length
        }

        log(`   ✅ Inserted ${inserted} readings`, 'green')
        totalInserted += inserted

      } catch (error) {
        log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`, 'red')
      }
    }

    log(`\n────────────────────────────────────────────────────────────────────────────────`, 'cyan')
    log(`✅ Import complete!`, 'green')
    log(`📊 Total readings inserted: ${totalInserted}`, 'bright')
    log(`────────────────────────────────────────────────────────────────────────────────`, 'cyan')

  } catch (error) {
    log(`❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`, 'red')
    process.exit(1)
  }
}

// Run the import
importHistoricalData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
