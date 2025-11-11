#!/usr/bin/env ts-node
/**
 * TagoIO Polling Service - Standalone Script
 * 
 * Simple Node.js script that polls TagoIO devices at regular intervals
 * and stores telemetry data in Supabase.
 * 
 * Usage:
 *   npm run poll              # Run once
 *   npm run poll:watch        # Run continuously (every 60 seconds)
 *   ts-node scripts/poll-tagoio.ts
 * 
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { pollDevices } from '@/lib/tagoio/polling-service'

// Configuration
const POLL_INTERVAL_MS = 60 * 1000 // 60 seconds
const RUN_ONCE = process.argv.includes('--once')

// Colors for console output
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

async function runPoll() {
  log('🚀 Starting TagoIO telemetry poll...', 'cyan')
  const startTime = Date.now()

  try {
    const result = await pollDevices()
    const duration = Date.now() - startTime

    // Log summary
    if (result.successfulPolls === result.podsPolled && result.podsPolled > 0) {
      log(
        `✅ Poll complete: ${result.successfulPolls}/${result.podsPolled} pods, ` +
        `${result.totalInserted} readings inserted in ${duration}ms`,
        'green'
      )
    } else if (result.podsPolled === 0) {
      log('⚠️  No pods with device tokens found', 'yellow')
    } else {
      log(
        `⚠️  Poll partial: ${result.successfulPolls}/${result.podsPolled} successful, ` +
        `${result.totalInserted} readings inserted in ${duration}ms`,
        'yellow'
      )
    }

    // Log errors if any
    if (result.errors.length > 0) {
      log(`❌ Errors encountered:`, 'red')
      result.errors.forEach((error) => {
        console.error(`   ${error}`)
      })
    }

    // Log per-device details
    if (result.devices.length > 0) {
      log('📊 Device details:', 'blue')
      result.devices.forEach((device) => {
        const status = device.success ? '✓' : '✗'
        const statusColor = device.success ? 'green' : 'red'
        console.log(
          `   ${colors[statusColor]}${status}${colors.reset} ` +
          `${device.podName}: ${device.readingsInserted} readings ` +
          `(${device.dataPointsReceived} data points received)`
        )
      })
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    log(`❌ Polling failed: ${errorMessage}`, 'red')
    console.error(error)
    throw error
  }
}

async function startPolling() {
  log('🎯 TagoIO Polling Service Started', 'bright')
  log(`📡 Poll interval: ${POLL_INTERVAL_MS / 1000} seconds`, 'cyan')
  log(`🔄 Mode: ${RUN_ONCE ? 'Single run' : 'Continuous'}`, 'cyan')
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

  // Run first poll immediately
  await runPoll()

  if (RUN_ONCE) {
    log('✅ Single poll complete. Exiting.', 'green')
    process.exit(0)
  }

  // Set up interval for continuous polling
  log(`⏰ Next poll in ${POLL_INTERVAL_MS / 1000} seconds...`, 'cyan')
  
  const intervalId = setInterval(async () => {
    log('─'.repeat(80), 'reset')
    await runPoll()
    log(`⏰ Next poll in ${POLL_INTERVAL_MS / 1000} seconds...`, 'cyan')
  }, POLL_INTERVAL_MS)

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n🛑 Shutting down polling service...', 'yellow')
    clearInterval(intervalId)
    log('👋 Goodbye!', 'green')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    log('\n🛑 Received SIGTERM. Shutting down...', 'yellow')
    clearInterval(intervalId)
    process.exit(0)
  })
}

// Start the service
startPolling().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  log(`💥 Fatal error: ${errorMessage}`, 'red')
  console.error(error)
  process.exit(1)
})
