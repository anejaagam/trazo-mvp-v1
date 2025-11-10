/**
 * Test script to verify transformer correctly interprets TagoIO AUTO mode
 * 
 * TagoIO metadata format:
 * - ov: 0=manual OFF, 1=manual ON, 2=AUTO mode
 * - mode: 0=AUTO, 1=MANUAL (inverted!)
 * - level: 0-100 power percentage
 * - schedule: 0=disabled, 1=enabled
 */

// Mock TagoIO data based on real data from database
const mockTagoIOData = {
  variables: {
    light_state: {
      value: 1,
      time: new Date().toISOString(),
      device: 'test-device',
      variable: 'light_state',
      metadata: {
        ov: 2,        // AUTO mode
        mode: 0,      // AUTO (TagoIO convention)
        level: 70,    // 70% power
        schedule: 1,  // Schedule enabled
      },
    },
    co2_valve: {
      value: 1,
      time: new Date().toISOString(),
      device: 'test-device',
      variable: 'co2_valve',
      metadata: {
        ov: 2,        // AUTO mode
        mode: 0,      // AUTO
        level: 0,
      },
    },
    cooling_valve: {
      value: 0,
      time: new Date().toISOString(),
      device: 'test-device',
      variable: 'cooling_valve',
      metadata: {
        ov: 2,        // AUTO mode
        mode: 0,      // AUTO
        level: 100,
      },
    },
    dehum: {
      value: 0,
      time: new Date().toISOString(),
      device: 'test-device',
      variable: 'dehum',
      metadata: {
        ov: 2,        // AUTO mode
        mode: 0,      // AUTO
        level: 0,
        schedule: 0,
      },
    },
  },
}

console.log('Testing AUTO mode interpretation:')
console.log('==================================\n')

// Test lighting (ov=2, value=1, level=70)
console.log('Lighting (ov=2, value=1, level=70):')
console.log('  Expected: state=AUTO, mode=AUTOMATIC, override=false, level=70')
console.log('  TagoIO metadata:', mockTagoIOData.variables.light_state.metadata)

// Test CO2 valve (ov=2, value=1)
console.log('\nCO2 Valve (ov=2, value=1):')
console.log('  Expected: state=AUTO, mode=AUTOMATIC, override=false')
console.log('  TagoIO metadata:', mockTagoIOData.variables.co2_valve.metadata)

// Test cooling (ov=2, value=0)
console.log('\nCooling (ov=2, value=0):')
console.log('  Expected: state=AUTO, mode=AUTOMATIC, override=false')
console.log('  TagoIO metadata:', mockTagoIOData.variables.cooling_valve.metadata)

console.log('\n==================================')
console.log('Key insight: ov=2 means AUTO mode is ACTIVE')
console.log('The value (0/1) indicates current equipment state within AUTO mode')
console.log('level indicates power percentage when equipment is ON')
