#!/usr/bin/env ts-node
/**
 * Organization-Scoped TagoIO Polling Service
 * 
 * Polls TagoIO devices for a specific user's organization and region.
 * Detects the logged-in user's region and organization, then polls only
 * pods belonging to that organization.
 * 
 * Usage:
 *   npm run poll:user <user-email>       # Poll for specific user's org
 *   npm run poll:user:watch <user-email> # Continuous polling
 * 
 * Environment variables required:
 *   - US_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   - US_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY
 *   - CAN_SUPABASE_URL or NEXT_PUBLIC_CAN_SUPABASE_URL
 *   - CAN_SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { TagoIOPollingService } from '@/lib/tagoio/polling-service'

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
  magenta: '\x1b[35m',
} as const

type ColorName = keyof typeof colors

function log(message: string, color: ColorName = 'reset') {
  const timestamp = new Date().toISOString()
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
}

// ============================================================================
// Region & User Detection
// ============================================================================

interface RegionConfig {
  name: string
  url: string
  serviceRoleKey: string
}

interface UserOrgInfo {
  userId: string
  email: string
  organizationId: string
  organizationName: string
  region: 'US' | 'CA'
  role: string
  siteIds: string[]
}

/**
 * Get region configurations from environment
 */
function getRegionConfigs(): { US: RegionConfig; CA: RegionConfig } {
  const usUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const usKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const caUrl = process.env.NEXT_PUBLIC_CAN_SUPABASE_URL || process.env.CAN_SUPABASE_URL
  const caKey = process.env.CAN_SUPABASE_SERVICE_ROLE_KEY

  if (!usUrl || !usKey) {
    throw new Error('Missing US Supabase credentials: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  }
  if (!caUrl || !caKey) {
    throw new Error('Missing Canada Supabase credentials: CAN_SUPABASE_URL and CAN_SUPABASE_SERVICE_ROLE_KEY required')
  }

  return {
    US: { name: 'US', url: usUrl, serviceRoleKey: usKey },
    CA: { name: 'CA', url: caUrl, serviceRoleKey: caKey },
  }
}

/**
 * Find user and their organization across both regions
 */
async function findUserAndOrg(email: string): Promise<UserOrgInfo> {
  const regions = getRegionConfigs()

  // Try US first
  log(`🔍 Searching for user: ${email}`, 'cyan')
  
  for (const [regionKey, config] of Object.entries(regions)) {
    log(`   Checking ${config.name} region...`, 'cyan')
    
    const supabase = createServiceClient(config.url, config.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        organization_id,
        role
      `)
      .eq('email', email)
      .single()

    if (userError) {
      if (userError.code !== 'PGRST116') { // Not "not found" error
        log(`   ⚠️  Error querying ${config.name}: ${userError.message}`, 'yellow')
      }
      continue
    }

    if (userData) {
      log(`   ✅ Found user in ${config.name} region`, 'green')
      
      // Get organization name
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', userData.organization_id)
        .single()
      
      // Get user's site assignments to scope polling
      const { data: siteData } = await supabase
        .from('user_site_assignments')
        .select('site_id')
        .eq('user_id', userData.id)

      const siteIds = siteData?.map((s) => (s as { site_id: string }).site_id) || []

      return {
        userId: userData.id,
        email: userData.email,
        organizationId: userData.organization_id,
        organizationName: orgData?.name || 'Unknown',
        region: regionKey as 'US' | 'CA',
        role: userData.role,
        siteIds,
      }
    }
  }

  throw new Error(`User not found: ${email}`)
}

/**
 * Get all sites for an organization
 */
async function getOrganizationSites(
  supabase: SupabaseClient,
  organizationId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('id')
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(`Failed to fetch organization sites: ${error.message}`)
  }

  return data?.map((s) => (s as { id: string }).id) || []
}

// ============================================================================
// Polling Logic
// ============================================================================

async function runPoll(userOrg: UserOrgInfo, supabase: SupabaseClient) {
  log('🚀 Starting TagoIO telemetry poll...', 'cyan')
  log(`   Organization: ${userOrg.organizationName}`, 'blue')
  log(`   Region: ${userOrg.region}`, 'blue')
  log(`   Sites: ${userOrg.siteIds.length || 'All org sites'}`, 'blue')
  
  const startTime = Date.now()

  try {
    const service = new TagoIOPollingService(supabase)
    
    // If user has site assignments, poll only those sites
    // Otherwise, poll all sites in the organization
    let siteIds = userOrg.siteIds
    if (siteIds.length === 0) {
      log('   📍 No site assignments, polling all org sites...', 'cyan')
      siteIds = await getOrganizationSites(supabase, userOrg.organizationId)
    }

    if (siteIds.length === 0) {
      log('⚠️  No sites found for organization', 'yellow')
      return
    }

    // Poll each site
    let totalPolled = 0
    let totalSuccess = 0
    let totalInserted = 0

    for (const siteId of siteIds) {
      const result = await service.pollAllDevices(siteId)
      totalPolled += result.podsPolled
      totalSuccess += result.successfulPolls
      totalInserted += result.totalInserted

      if (result.errors.length > 0) {
        result.errors.forEach(err => log(`   ⚠️  ${err}`, 'yellow'))
      }
    }

    const duration = Date.now() - startTime

    // Log summary
    if (totalSuccess === totalPolled && totalPolled > 0) {
      log(
        `✅ Poll complete: ${totalSuccess}/${totalPolled} pods, ` +
        `${totalInserted} readings inserted in ${duration}ms`,
        'green'
      )
    } else if (totalPolled === 0) {
      log('⚠️  No pods with device tokens found', 'yellow')
    } else {
      log(
        `⚠️  Poll partial: ${totalSuccess}/${totalPolled} successful, ` +
        `${totalInserted} readings inserted in ${duration}ms`,
        'yellow'
      )
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    log(`❌ Polling failed: ${errorMessage}`, 'red')
    console.error(error)
    throw error
  }
}

async function startPolling() {
  log('🎯 Organization-Scoped TagoIO Polling Service', 'bright')
  log('─'.repeat(80), 'reset')

  // Get user email from command line (skip --once flag if present)
  const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'))
  const userEmail = args[0]
  
  if (!userEmail) {
    log('❌ Usage: npm run poll:user <user-email>', 'red')
    log('   Example: npm run poll:user admin@trazo.app', 'red')
    process.exit(1)
  }

  try {
    // Find user and their organization
    const userOrg = await findUserAndOrg(userEmail)
    
    log(`👤 User: ${userOrg.email}`, 'magenta')
    log(`🏢 Organization: ${userOrg.organizationName}`, 'magenta')
    log(`🌍 Region: ${userOrg.region}`, 'magenta')
    log(`🔑 Role: ${userOrg.role}`, 'magenta')
    log('─'.repeat(80), 'reset')

    // Create Supabase client for user's region
    const regions = getRegionConfigs()
    const regionConfig = regions[userOrg.region]
    const supabase = createServiceClient(regionConfig.url, regionConfig.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    log(`📡 Poll interval: ${POLL_INTERVAL_MS / 1000} seconds`, 'cyan')
    log(`🔄 Mode: ${RUN_ONCE ? 'Single run' : 'Continuous'}`, 'cyan')
    log('─'.repeat(80), 'reset')

    // Run first poll immediately
    await runPoll(userOrg, supabase)

    if (RUN_ONCE) {
      log('✅ Single poll complete. Exiting.', 'green')
      process.exit(0)
    }

    // Set up interval for continuous polling
    log(`⏰ Next poll in ${POLL_INTERVAL_MS / 1000} seconds...`, 'cyan')
    
    const intervalId = setInterval(async () => {
      log('─'.repeat(80), 'reset')
      await runPoll(userOrg, supabase)
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    log(`💥 Fatal error: ${errorMessage}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Start the service
startPolling()
