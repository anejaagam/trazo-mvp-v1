import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    return NextResponse.json({
      error: 'Missing env vars',
      hasUrl: !!url,
      hasKey: !!key,
    })
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Test query
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name')
    .limit(5)

  return NextResponse.json({
    url,
    hasKey: !!key,
    keyPrefix: key.substring(0, 20) + '...',
    tableExists: !error,
    error: error?.message,
    errorCode: error?.code,
    data: data?.length || 0,
  })
}
