#!/usr/bin/env ts-node
/**
 * TagoIO API Test Script
 * 
 * Purpose: Test TagoIO API endpoints to understand:
 * - Data structure and response format
 * - Available variables and their names
 * - How to map TagoIO data to Trazo schema
 * - Rate limits and error responses
 * 
 * Usage: npx ts-node -P scripts/tsconfig.json scripts/test-tagoio-api.ts
 */

import 'dotenv/config'

const TAGOIO_DEVICE_TOKEN = process.env.TAGOIO_DEVICE_TOKEN
const TAGOIO_API_BASE = 'https://api.tago.io'

interface TagoIODataPoint {
  variable: string
  value: string | number
  unit?: string
  time: string
  serie?: string
  [key: string]: unknown
}

async function testTagoIOAPI() {
  console.log('🚀 Starting TagoIO API Tests...\n')
  
  if (!TAGOIO_DEVICE_TOKEN) {
    console.error('❌ TAGOIO_DEVICE_TOKEN not found in .env.local')
    process.exit(1)
  }
  
  console.log('✅ Device Token:', TAGOIO_DEVICE_TOKEN)
  console.log('📡 API Base:', TAGOIO_API_BASE)
  console.log('\n' + '='.repeat(60) + '\n')
  
  try {
    // Test 1: Get device info (if endpoint exists)
    console.log('Test 1: GET /info (Device Information)')
    console.log('-'.repeat(60))
    
    const infoResponse = await fetch(`${TAGOIO_API_BASE}/info`, {
      method: 'GET',
      headers: {
        'Device-Token': TAGOIO_DEVICE_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Status:', infoResponse.status, infoResponse.statusText)
    
    if (infoResponse.ok) {
      const infoData = await infoResponse.json()
      console.log('Response:', JSON.stringify(infoData, null, 2))
    } else {
      const errorText = await infoResponse.text()
      console.log('Error:', errorText)
    }
    
    console.log('\n' + '='.repeat(60) + '\n')
    
    // Test 2: Get recent data
    console.log('Test 2: GET /data (Recent Telemetry Data)')
    console.log('-'.repeat(60))
    
    const dataResponse = await fetch(`${TAGOIO_API_BASE}/data`, {
      method: 'GET',
      headers: {
        'Device-Token': TAGOIO_DEVICE_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Status:', dataResponse.status, dataResponse.statusText)
    
    if (dataResponse.ok) {
      const data = await dataResponse.json()
      console.log('Response Type:', typeof data)
      console.log('Is Array:', Array.isArray(data))
      
      if (Array.isArray(data)) {
        console.log('Total Records:', data.length)
        
        if (data.length > 0) {
          console.log('\nFirst Record:')
          console.log(JSON.stringify(data[0], null, 2))
          
          // Extract unique variables
          const variables = [...new Set(data.map((d: TagoIODataPoint) => d.variable))]
          console.log('\nAvailable Variables:', variables)
          
          // Show sample for each variable
          console.log('\nSample Data by Variable:')
          variables.forEach(variable => {
            const sample = data.find((d: TagoIODataPoint) => d.variable === variable)
            if (sample) {
              console.log(`  ${variable}:`, {
                value: sample.value,
                unit: sample.unit || 'N/A',
                time: sample.time,
              })
            }
          })
        } else {
          console.log('⚠️  No data returned (empty array)')
        }
      } else {
        console.log('Response:', JSON.stringify(data, null, 2))
      }
    } else {
      const errorText = await dataResponse.text()
      console.log('Error:', errorText)
    }
    
    console.log('\n' + '='.repeat(60) + '\n')
    
    // Test 3: Query with parameters (last 24 hours)
    console.log('Test 3: GET /data?qty=100 (Last 100 readings)')
    console.log('-'.repeat(60))
    
    const queryResponse = await fetch(`${TAGOIO_API_BASE}/data?qty=100`, {
      method: 'GET',
      headers: {
        'Device-Token': TAGOIO_DEVICE_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Status:', queryResponse.status, queryResponse.statusText)
    
    if (queryResponse.ok) {
      const queryData = await queryResponse.json()
      
      if (Array.isArray(queryData)) {
        console.log('Records Retrieved:', queryData.length)
        
        // Group by variable
        const grouped = queryData.reduce((acc: Record<string, number>, item: TagoIODataPoint) => {
          acc[item.variable] = (acc[item.variable] || 0) + 1
          return acc
        }, {})
        
        console.log('\nRecords per Variable:')
        Object.entries(grouped).forEach(([variable, count]) => {
          console.log(`  ${variable}: ${count} readings`)
        })
        
        // Show time range
        if (queryData.length > 0) {
          const times = queryData.map((d: TagoIODataPoint) => new Date(d.time).getTime())
          const oldest = new Date(Math.min(...times))
          const newest = new Date(Math.max(...times))
          
          console.log('\nTime Range:')
          console.log('  Oldest:', oldest.toISOString())
          console.log('  Newest:', newest.toISOString())
          console.log('  Duration:', ((newest.getTime() - oldest.getTime()) / 3600000).toFixed(2), 'hours')
        }
      } else {
        console.log('Response:', JSON.stringify(queryData, null, 2))
      }
    } else {
      const errorText = await queryResponse.text()
      console.log('Error:', errorText)
    }
    
    console.log('\n' + '='.repeat(60) + '\n')
    
    // Test 4: Try sending data (POST)
    console.log('Test 4: POST /data (Send Test Data)')
    console.log('-'.repeat(60))
    console.log('⚠️  Skipping POST test to avoid modifying live data')
    console.log('(Can be enabled if needed for testing)')
    
    console.log('\n' + '='.repeat(60) + '\n')
    console.log('✅ API Tests Complete!')
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error)
    if (error instanceof Error) {
      console.error('Error Message:', error.message)
      console.error('Stack Trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run tests
testTagoIOAPI()
  .then(() => {
    console.log('\n✅ All tests completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  })
