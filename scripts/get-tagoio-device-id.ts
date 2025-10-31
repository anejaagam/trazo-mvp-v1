/**
 * Get TagoIO Device ID from Token
 * 
 * This script calls the TagoIO API directly to get the device ID
 * and updates the integration_settings config in the database.
 */

const TOKEN = 'ed51659f-6870-454f-8755-52815755c5bb'

async function getDeviceInfo() {
  try {
    console.log('Fetching device info from TagoIO...')
    
    const response = await fetch('https://api.tago.io/info', {
      method: 'GET',
      headers: {
        'Authorization': TOKEN,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('\nFull response:', JSON.stringify(data, null, 2))

    const result = data?.result || data
    const deviceId = result?.id
    const deviceName = result?.name

    console.log('\n✅ Device ID:', deviceId)
    console.log('✅ Device Name:', deviceName)

    console.log('\n📝 Next steps:')
    console.log(`1. Update integration_settings config with deviceId: "${deviceId}"`)
    console.log(`2. Create a pod with tagoio_device_id: "${deviceId}"`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

getDeviceInfo()
