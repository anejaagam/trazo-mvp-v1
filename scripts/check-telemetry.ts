import { createClient } from '@/lib/supabase/server'

async function checkTelemetry() {
  const supabase = await createClient()
  
  // Check for any readings with actual values
  const { data: withValues, count: withCount } = await supabase
    .from('telemetry_readings')
    .select('*', { count: 'exact', head: false })
    .not('temperature_c', 'is', null)
    .limit(1)
  
  console.log(`\n📊 Telemetry readings WITH temperature values: ${withCount}`)
  if (withValues && withValues.length > 0) {
    console.log('Sample:', {
      temp: withValues[0].temperature_c,
      humidity: withValues[0].humidity_pct,
      co2: withValues[0].co2_ppm,
      timestamp: withValues[0].timestamp
    })
  }
  
  // Check for readings with null values
  const { count: nullCount } = await supabase
    .from('telemetry_readings')
    .select('*', { count: 'exact', head: true })
    .is('temperature_c', null)
  
  console.log(`\n📊 Telemetry readings WITHOUT temperature values: ${nullCount}`)
  
  // Check the most recent reading
  const { data: recent } = await supabase
    .from('telemetry_readings')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()
  
  if (recent) {
    console.log('\n📊 Most recent reading:')
    console.log('Timestamp:', recent.timestamp)
    console.log('Temperature:', recent.temperature_c)
    console.log('Humidity:', recent.humidity_pct)
    console.log('CO2:', recent.co2_ppm)
    console.log('Has raw_data:', !!recent.raw_data)
    if (recent.raw_data) {
      console.log('Raw data keys:', Object.keys(recent.raw_data))
    }
  }
}

checkTelemetry().catch(console.error)
