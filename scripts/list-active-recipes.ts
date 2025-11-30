/**
 * Helper Script: List Active Recipe Activations
 * 
 * Lists all active recipe activations with their IDs for testing.
 * 
 * Usage:
 *   npx tsx scripts/list-active-recipes.ts
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

async function listActiveRecipes() {
  console.log('📋 Active Recipe Activations')
  console.log('═'.repeat(80))

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

  try {
    const { data: activations, error } = await supabase
      .from('recipe_activations')
      .select(`
        id,
        scope_type,
        scope_id,
        scope_name,
        current_stage_day,
        activated_at,
        recipe:recipes(name),
        current_stage:recipe_stages(name, duration_days, order_index)
      `)
      .eq('is_active', true)
      .order('activated_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching activations:', error)
      process.exit(1)
    }

    if (!activations || activations.length === 0) {
      console.log('ℹ️  No active recipe activations found')
      console.log('\nTo create one:')
      console.log('  1. Go to /dashboard/recipes')
      console.log('  2. Click on a recipe')
      console.log('  3. Click "Assign Recipe"')
      console.log('  4. Select a pod and assign')
      process.exit(0)
    }

    console.log(`\nFound ${activations.length} active recipe(s):\n`)

    activations.forEach((activation, index) => {
      console.log(`${index + 1}. Activation ID: ${activation.id}`)
      console.log(`   Recipe: ${(activation.recipe as any)?.name || 'Unknown'}`)
      console.log(`   Scope: ${activation.scope_type} - ${activation.scope_name}`)
      console.log(`   Current Stage: ${(activation.current_stage as any)?.name || 'Unknown'}`)
      console.log(`   Day ${activation.current_stage_day} of ${(activation.current_stage as any)?.duration_days || 0}`)
      console.log(`   Activated: ${new Date(activation.activated_at).toLocaleString()}`)
      console.log('   ─'.repeat(40))
    })

    console.log('\n📝 To advance a stage, run:')
    console.log(`   npx tsx scripts/test-advance-stage.ts <activation-id> <user-id>`)
    console.log('\nExample:')
    console.log(`   npx tsx scripts/test-advance-stage.ts ${activations[0].id} ec532649-1aa8-4580-a79e-d3fca9a74f6c`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
listActiveRecipes()
