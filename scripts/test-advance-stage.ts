/**
 * Test Script: Manually Advance Recipe Stage
 * 
 * This script advances the current stage of an active recipe on a pod.
 * Useful for testing stage advancement without waiting for the cron job.
 * 
 * Usage:
 *   npx tsx scripts/test-advance-stage.ts <activation-id> <user-id>
 * 
 * Example:
 *   npx tsx scripts/test-advance-stage.ts 794e77ed-0173-48d9-93a4-8219261fa44c ec532649-1aa8-4580-a79e-d3fca9a74f6c
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Get environment variables (US region)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Get command line arguments
const activationId = process.argv[2]
const userId = process.argv[3]

if (!activationId || !userId) {
  console.error('❌ Usage: npx tsx scripts/test-advance-stage.ts <activation-id> <user-id>')
  console.error('')
  console.error('To get activation ID:')
  console.error('  1. Go to /dashboard/monitoring')
  console.error('  2. Click on a pod with an active recipe')
  console.error('  3. Check browser console for activation_id in logs')
  console.error('')
  console.error('User ID is your test user ID (default: ec532649-1aa8-4580-a79e-d3fca9a74f6c)')
  process.exit(1)
}

async function advanceStage() {
  console.log('🚀 Testing Stage Advancement')
  console.log('━'.repeat(60))
  console.log(`Activation ID: ${activationId}`)
  console.log(`User ID: ${userId}`)
  console.log('━'.repeat(60))

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

  try {
    // 1. Get current activation details
    console.log('\n📋 Fetching current activation...')
    const { data: activation, error: fetchError } = await supabase
      .from('recipe_activations')
      .select(`
        *,
        recipe:recipes(name),
        recipe_version:recipe_versions(*),
        current_stage:recipe_stages(name, duration_days, order_index)
      `)
      .eq('id', activationId)
      .single()

    if (fetchError || !activation) {
      console.error('❌ Error fetching activation:', fetchError)
      process.exit(1)
    }

    console.log(`✅ Found activation for recipe: ${(activation.recipe as any).name}`)
    console.log(`   Current Stage: ${(activation.current_stage as any)?.name || 'Unknown'}`)
    console.log(`   Current Stage Day: ${activation.current_stage_day}`)
    console.log(`   Stage Duration: ${(activation.current_stage as any)?.duration_days || 0} days`)

    // 2. Check if stage can be advanced
    if (!activation.is_active) {
      console.error('❌ Recipe is not active')
      process.exit(1)
    }

    // 3. Call the advance_recipe_stage function
    console.log('\n🔄 Calling advance_recipe_stage function...')
    const { data: result, error: advanceError } = await supabase.rpc('advance_recipe_stage', {
      p_activation_id: activationId,
      p_advanced_by: userId
    })

    if (advanceError) {
      console.error('❌ Error advancing stage:', advanceError)
      process.exit(1)
    }

    if (result) {
      console.log('✅ Stage advanced successfully!')
      
      // 4. Fetch updated activation to show changes
      console.log('\n📊 Fetching updated activation...')
      const { data: updatedActivation, error: updateFetchError } = await supabase
        .from('recipe_activations')
        .select(`
          *,
          current_stage:recipe_stages(name, duration_days, order_index)
        `)
        .eq('id', activationId)
        .single()

      if (updateFetchError || !updatedActivation) {
        console.error('⚠️  Could not fetch updated activation')
      } else {
        console.log('━'.repeat(60))
        console.log('📈 NEW STATE:')
        console.log(`   Current Stage: ${(updatedActivation.current_stage as any)?.name || 'Unknown'}`)
        console.log(`   Current Stage Day: ${updatedActivation.current_stage_day}`)
        console.log(`   Stage Duration: ${(updatedActivation.current_stage as any)?.duration_days || 0} days`)
        console.log('━'.repeat(60))
      }

      // 5. Check control log
      console.log('\n📝 Checking control log...')
      const { data: controlLogs, error: logError } = await supabase
        .from('control_logs')
        .select('*')
        .eq('recipe_activation_id', activationId)
        .eq('event_type', 'stage_advanced')
        .order('timestamp', { ascending: false })
        .limit(1)

      if (logError) {
        console.log('⚠️  Could not fetch control log:', logError.message)
      } else if (controlLogs && controlLogs.length > 0) {
        console.log('✅ Control log entry created')
        console.log(`   Timestamp: ${controlLogs[0].timestamp}`)
        console.log(`   Event Type: ${controlLogs[0].event_type}`)
        console.log(`   Reason: ${controlLogs[0].reason}`)
        if (controlLogs[0].metadata) {
          console.log(`   Previous Stage: ${controlLogs[0].metadata.previous_stage_id}`)
          console.log(`   New Stage: ${controlLogs[0].metadata.new_stage_id}`)
        }
      } else {
        console.log('⚠️  No control log entry found')
      }

    } else {
      console.log('⚠️  Stage not advanced (may already be at final stage or not enough days passed)')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }

  console.log('\n✅ Script completed')
}

// Run the script
advanceStage()
