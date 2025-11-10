#!/usr/bin/env ts-node
/**
 * Historical Data Import Script
 * 
 * One-time script to import last 24 hours and last 7 days of historical data
 * from TagoIO with smart aggregation to prevent database flooding.
 * 
 * Usage:
 *   npm run poll:historical              # Import for all pods
 *   npm run poll:historical --site=<id>  # Import for specific site
 *   ts-node scripts/poll-historical.ts
 * 
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { pollHistoricalDevices } from '@/lib/tagoio/historical-polling'

// Configuration
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
} as const

type ColorName = keyof typeof colors

function log(message: string, color: ColorName = 'reset') {
  const timestamp = new Date().toISOString()
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
}

async function main() {
  log('🚀 Starting Historical Data Import...', 'cyan')
  log('─'.repeat(80), 'reset')

  // Validate environment variables
  if (!process.env.SUPABASE_URL) {
    log('❌ SUPABASE_URL not found in environment', 'red')
    process.exit(1)
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment', 'red')
    process.exit(1)
  }

  // Parse command line arguments
  const siteIdArg = process.argv.find(arg => arg.startsWith('--site='))
  const siteId = siteIdArg ? siteIdArg.split('=')[1] : undefined

  if (siteId) {
    log(`📍 Importing for site: ${siteId}`, 'cyan')
  } else {
    log('🌍 Importing for all sites', 'cyan')
  }

  log('', 'reset')
  log('Time ranges:', 'blue')
  log('  • Last 24 hours: 1-minute intervals (~1,440 points max)', 'blue')
  log('  • Last 7 days: 15-minute intervals (~672 points max)', 'blue')
  log('', 'reset')

  const startTime = Date.now()

  try {
    const result = await pollHistoricalDevices(siteId)
    const duration = Date.now() - startTime

    log('─'.repeat(80), 'reset')
    log('📊 Import Summary:', 'bright')
    log('', 'reset')

    // Overall stats
    if (result.successfulPolls === result.podsPolled && result.podsPolled > 0) {
      log(
        `✅ Successfully imported data for ${result.successfulPolls}/${result.podsPolled} pods`,
        'green'
      )
    } else if (result.podsPolled === 0) {
      log('⚠️  No pods with TagoIO device tokens found', 'yellow')
    } else {
      log(
        `⚠️  Partial success: ${result.successfulPolls}/${result.podsPolled} pods`,
        'yellow'
      )
    }

    log(`📈 Data points received: ${result.totalDataPoints.toLocaleString()}`, 'cyan')
    log(`🔄 Data points aggregated: ${result.totalAggregated.toLocaleString()}`, 'cyan')
    log(`💾 Readings upserted: ${result.totalInserted.toLocaleString()}`, 'green')
    log(`⏱️  Total duration: ${(duration / 1000).toFixed(1)}s`, 'magenta')
    log('', 'reset')

    // Per-device breakdown
    if (result.devices.length > 0) {
      log('📋 Device Details:', 'blue')
      log('', 'reset')
      result.devices.forEach((device) => {
        const status = device.success ? '✓' : '✗'
        const statusColor = device.success ? 'green' : 'red'
        
        console.log(
          `   ${colors[statusColor]}${status}${colors.reset} ` +
          `${device.podName}:`
        )
        console.log(
          `      Received: ${device.dataPointsReceived.toLocaleString()} points`
        )
        console.log(
          `      Aggregated: ${device.dataPointsAggregated.toLocaleString()} points`
        )
        console.log(
          `      Upserted: ${device.readingsInserted.toLocaleString()} readings`
        )
        console.log(
          `      Duration: ${(device.duration / 1000).toFixed(1)}s`
        )

        if (device.errors.length > 0) {
          console.log(`      ${colors.red}Errors:${colors.reset}`)
          device.errors.slice(0, 3).forEach(err => {
            console.log(`        • ${err}`)
          })
          if (device.errors.length > 3) {
            console.log(`        ... and ${device.errors.length - 3} more`)
          }
        }
        console.log('')
      })
    }

    // Global errors
    if (result.errors.length > 0) {
      log('❌ Errors Encountered:', 'red')
      result.errors.forEach((error) => {
        console.error(`   • ${error}`)
      })
      log('', 'reset')
    }

    log('─'.repeat(80), 'reset')
    log('✅ Historical import complete!', 'green')

    process.exit(result.errors.length > 0 ? 1 : 0)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    log(`💥 Fatal error: ${errorMessage}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Run the script
main()
