import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getRegionConfig, type Region } from './region'

/**
 * Create a server-side Supabase client using the Service Role key.
 * Never expose this to the browser.
 */
export async function createServiceClient(region?: Region) {
  // Region is explicit from callers; cookie fallback only if omitted
  let selected: Region = region || 'US'
  if (!region) {
    try {
      const cookieStore = await cookies()
      selected = (cookieStore.get('user_region')?.value === 'CA' ? 'CA' : 'US') as Region
    } catch {
      // ignore
    }
  }

  const cfg = getRegionConfig(selected)
  if (!cfg.serviceRoleKey) {
    throw new Error(`Missing service role key for region ${selected}`)
  }

  return createSupabaseClient(cfg.url, cfg.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
