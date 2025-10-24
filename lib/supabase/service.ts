import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getRegionConfig, type Region } from './region'

/**
 * Creates a Supabase client with SERVICE ROLE permissions
 * WARNING: This bypasses RLS - only use in secure server-side code!
 * 
 * @param region - 'US' or 'CA' (defaults to 'US')
 */
export function createServiceClient(region: Region = 'US') {
  const config = getRegionConfig(region)
  
  const serviceRoleKey = region === 'CA' 
    ? process.env.CAN_SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error(`Service role key not found for region ${region}`)
  }

  return createSupabaseClient(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'apikey': serviceRoleKey
      }
    }
  })
}
