/**
 * Reset Telemetry Data Script
 * 
 * Clears all telemetry readings and re-imports fresh data from TagoIO
 * with improved grouping (by second instead of millisecond)
 */

import { createServiceClient } from '@/lib/supabase/service'
import { createTagoIOClient } from '@/lib/tagoio/client'
import { transformTagoIOData, deduplicateReadings } from '@/lib/tagoio/transformer'

// Logging utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  const timestamp = new Date().toISOString()
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
}

async function main() {
  const args = process.argv.slice(2)
  const userEmail = args[0]
  const hours = parseInt(args[1] || '24', 10)

  if (!userEmail) {
    console.error('Usage: npm run reset-telemetry <user-email> [hours=24]')
    console.error('Example: npm run reset-telemetry agam@trazo.ag 24')
    process.exit(1)
  }

  log(`User: ${userEmail}`)
  log(`Time range: Last ${hours} hours`)
  log(`────────────────────────────────────────────────────────────────────────────────`, 'cyan')

  // Step 1: Find user and their organization
  const supabase = createServiceClient('US')

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role, organization_id, organizations!inner(name)')
    .eq('email', userEmail)
    .single()

  if (userError || !user) {
    throw new Error(`User not found: ${userEmail}`)
  }

  log(`✅ Found user (${user.role})`, 'green')

  // Step 2: Get all sites for this organization
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', user.organization_id)
    .eq('is_active', true)

  if (sitesError || !sites || sites.length === 0) {
    throw new Error('No active sites found')
  }

  log(`Found ${sites.length} sites`)

  // Step 3: Get all pods with TagoIO devices
  const siteIds = sites.map(s => s.id)

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

  // Step 4: DELETE all existing telemetry data for these pods
  log(`────────────────────────────────────────────────────────────────────────────────`, 'cyan')
  log(`🗑️  Deleting existing telemetry data...`, 'yellow')

  const podIds = pods.map(p => p.id)
  const { error: deleteError, count } = await supabase
    .from('telemetry_readings')
    .delete()
    .in('pod_id', podIds)

  if (deleteError) {
    throw new Error(`Failed to delete telemetry data: ${deleteError.message}`)
  }

  log(`✅ Deleted ${count || 'all'} existing readings`, 'green')

  // Step 5: Re-import fresh data
  log(`────────────────────────────────────────────────────────────────────────────────`, 'cyan')
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)

  log(`📡 Fetching fresh data from ${startTime.toISOString()} to ${endTime.toISOString()}`)

  let totalInserted = 0

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

      // Transform data (now groups by second, merges sensor + equipment)
      const transformResult = transformTagoIOData(dataPoints, pod.id)

      if (transformResult.errors.length > 0) {
        log(`   ⚠️  ${transformResult.errors.length} transformation errors`, 'yellow')
      }

      if (transformResult.successful.length === 0) {
        log(`   ⚠️  No successful transformations`, 'yellow')
        continue
      }

      log(`   🔄 Transformed ${transformResult.successful.length} readings`)

      // Deduplicate
      const uniqueReadings = deduplicateReadings(transformResult.successful)
      log(`   📊 ${uniqueReadings.length} unique readings after deduplication`)

      // Insert into database
      const { error: insertError } = await supabase
        .from('telemetry_readings')
        .insert(uniqueReadings)

      if (insertError) {
        log(`   ❌ Insert failed: ${insertError.message}`, 'red')
        continue
      }

      log(`   ✅ Inserted ${uniqueReadings.length} readings`, 'green')
      totalInserted += uniqueReadings.length

    } catch (error) {
      log(`   ❌ Error processing pod: ${error instanceof Error ? error.message : String(error)}`, 'red')
    }
  }

  log(`\n────────────────────────────────────────────────────────────────────────────────`, 'cyan')
  log(`✅ Reset complete!`, 'green')
  log(`📊 Total readings inserted: ${totalInserted}`, 'green')
  log(`────────────────────────────────────────────────────────────────────────────────`, 'cyan')
}

main().catch((error) => {
  log(`❌ Fatal error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
