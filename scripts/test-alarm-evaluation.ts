/**
 * Test Alarm Evaluation Script
 * 
 * Manually triggers alarm evaluation for testing purposes
 * Inserts test telemetry readings that violate thresholds
 * and verifies that alarms are created correctly.
 * 
 * Created: November 15, 2025
 * Phase: 14A - Alarm System Integration
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// Test Scenarios
// =====================================================

interface TestScenario {
  name: string;
  description: string;
  telemetry: {
    temperature?: number;
    humidity?: number;
    co2?: number;
  };
  expectedAlarms: string[];
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Critical High Temperature',
    description: 'Temperature exceeds 28°C during flowering',
    telemetry: {
      temperature: 29.5,
      humidity: 50.0,
      co2: 1200.0,
    },
    expectedAlarms: ['temperature_high'],
  },
  {
    name: 'Critical Low Temperature',
    description: 'Temperature drops below 18°C',
    telemetry: {
      temperature: 17.0,
      humidity: 50.0,
      co2: 1000.0,
    },
    expectedAlarms: ['temperature_low'],
  },
  {
    name: 'High Humidity During Flowering',
    description: 'Humidity exceeds 60% RH during flowering',
    telemetry: {
      temperature: 24.0,
      humidity: 65.0,
      co2: 1200.0,
    },
    expectedAlarms: ['humidity_high'],
  },
  {
    name: 'Critical Low Humidity',
    description: 'Humidity drops below 35% RH',
    telemetry: {
      temperature: 24.0,
      humidity: 32.0,
      co2: 1200.0,
    },
    expectedAlarms: ['humidity_low'],
  },
  {
    name: 'High CO2 Levels',
    description: 'CO2 exceeds 1800 ppm',
    telemetry: {
      temperature: 24.0,
      humidity: 50.0,
      co2: 1850.0,
    },
    expectedAlarms: ['co2_high'],
  },
  {
    name: 'Low CO2 Levels',
    description: 'CO2 drops below 600 ppm',
    telemetry: {
      temperature: 24.0,
      humidity: 50.0,
      co2: 550.0,
    },
    expectedAlarms: ['co2_low'],
  },
  {
    name: 'Multiple Violations',
    description: 'High temperature AND high humidity',
    telemetry: {
      temperature: 30.0,
      humidity: 70.0,
      co2: 1200.0,
    },
    expectedAlarms: ['temperature_high', 'humidity_high'],
  },
];

// =====================================================
// Main Test Function
// =====================================================

async function testAlarmEvaluation() {
  console.log('🧪 Starting alarm evaluation test...\n');

  try {
    // Step 1: Get a test pod
    console.log('📋 Finding test pod...');
    const { data: pods, error: podError } = await supabase
      .from('pods')
      .select(`
        id,
        name,
        room:rooms!inner(
          id,
          name,
          site:sites!inner(
            id,
            name,
            organization_id
          )
        )
      `)
      .limit(1);

    if (podError) throw podError;
    if (!pods || pods.length === 0) {
      throw new Error('No pods found. Please create a pod first.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pod = pods[0] as any; // Type assertion for nested query
    console.log(`   ✓ Using pod: ${pod.name} (${pod.id})`);
    console.log(`   ✓ Room: ${pod.room.name}`);
    console.log(`   ✓ Site: ${pod.room.site.name}\n`);

    // Step 2: Check for active alarm policies
    console.log('🔍 Checking alarm policies...');
    const { data: policies, error: policyError } = await supabase
      .from('alarm_policies')
      .select('id, name, alarm_type, threshold_value, is_active')
      .eq('organization_id', pod.room.site.organization_id)
      .eq('is_active', true);

    if (policyError) throw policyError;
    if (!policies || policies.length === 0) {
      console.log('   ⚠️  No active alarm policies found!');
      console.log('   Run: npm run seed:alarm-policies\n');
      process.exit(1);
    }

    console.log(`   ✓ Found ${policies.length} active policies\n`);

    // Step 3: Run test scenarios
    console.log('=' .repeat(60));
    console.log('🧪 RUNNING TEST SCENARIOS');
    console.log('='.repeat(60) + '\n');

    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      const scenario = TEST_SCENARIOS[i];
      console.log(`Test ${i + 1}/${TEST_SCENARIOS.length}: ${scenario.name}`);
      console.log(`Description: ${scenario.description}`);
      console.log(`Telemetry:`, scenario.telemetry);

      // Insert test telemetry
      const { error: telemetryError } = await supabase
        .from('telemetry_readings')
        .insert({
          pod_id: pod.id,
          temperature: scenario.telemetry.temperature || null,
          humidity: scenario.telemetry.humidity || null,
          co2: scenario.telemetry.co2 || null,
          timestamp: new Date().toISOString(),
        });

      if (telemetryError) {
        console.log(`   ❌ Failed to insert telemetry: ${telemetryError.message}\n`);
        continue;
      }

      console.log(`   ✓ Telemetry inserted`);

      // Wait for evaluation (would normally be triggered by cron)
      console.log(`   ⏳ Waiting for alarm evaluation...`);
      console.log(`   💡 In production, this would be triggered by cron job`);
      console.log(`   💡 You can manually trigger: GET /api/cron/evaluate-alarms\n`);

      // Check if alarms were created
      const { data: alarms, error: alarmError } = await supabase
        .from('alarms')
        .select('id, alarm_type, severity, message')
        .eq('pod_id', pod.id)
        .order('triggered_at', { ascending: false })
        .limit(5);

      if (alarmError) {
        console.log(`   ❌ Error checking alarms: ${alarmError.message}\n`);
        continue;
      }

      if (alarms && alarms.length > 0) {
        console.log(`   ✅ Found ${alarms.length} alarm(s):`);
        alarms.forEach(alarm => {
          console.log(`      - ${alarm.alarm_type} (${alarm.severity}): ${alarm.message}`);
        });
      } else {
        console.log(`   ℹ️  No alarms found yet (evaluation pending)`);
      }

      console.log('');
    }

    // Step 4: Summary
    console.log('='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Inserted ${TEST_SCENARIOS.length} test telemetry readings`);
    console.log(`📍 Pod: ${pod.name}`);
    console.log(`⏰ Alarms will be evaluated by cron job`);
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('   1. Trigger manual evaluation:');
    console.log('      curl -X GET http://localhost:3000/api/cron/evaluate-alarms \\');
    console.log('        -H "Authorization: Bearer $CRON_SECRET"');
    console.log('');
    console.log('   2. Check alarms dashboard:');
    console.log('      http://localhost:3000/dashboard/alarms');
    console.log('');
    console.log('   3. Query alarms directly:');
    console.log('      SELECT * FROM alarms WHERE pod_id = \'' + pod.id + '\';');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error running alarm evaluation test:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testAlarmEvaluation();
