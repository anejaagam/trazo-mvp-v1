#!/usr/bin/env node

/**
 * Seed Monitoring Data
 * Populates Supabase with demo pods and telemetry readings
 * 
 * Usage:
 *   npm run seed:monitoring
 *   npm run seed:monitoring -- --clean  (cleans existing data first)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import {
  SEED_ROOMS,
  SEED_PODS,
  SEED_DEVICE_STATUS,
  SEED_TELEMETRY_READINGS,
} from '../lib/supabase/seed-monitoring-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Error: Missing required environment variables\n');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function cleanMonitoringData() {
  console.log('🧹 Cleaning existing monitoring data...\n');

  try {
    // Delete in reverse order of dependencies
    await supabase.from('telemetry_readings').delete().in('pod_id', SEED_PODS.map(p => p.id));
    console.log('   ✓ Cleaned telemetry_readings');

    await supabase.from('device_status').delete().in('pod_id', SEED_PODS.map(p => p.id));
    console.log('   ✓ Cleaned device_status');

    await supabase.from('pods').delete().in('id', SEED_PODS.map(p => p.id));
    console.log('   ✓ Cleaned pods');

    await supabase.from('rooms').delete().in('id', SEED_ROOMS.map(r => r.id));
    console.log('   ✓ Cleaned rooms');

    console.log('\n✅ Monitoring data cleaned successfully\n');
  } catch (error) {
    console.error('❌ Error cleaning data:', error);
    throw error;
  }
}

async function seedRooms() {
  console.log('🏠 Seeding rooms...');
  
  const { error } = await supabase
    .from('rooms')
    .upsert(SEED_ROOMS, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding rooms:', error);
    throw error;
  }

  console.log(`   ✓ Created ${SEED_ROOMS.length} rooms\n`);
}

async function seedPods() {
  console.log('🫘 Seeding pods...');
  
  const { error } = await supabase
    .from('pods')
    .upsert(SEED_PODS, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding pods:', error);
    throw error;
  }

  console.log(`   ✓ Created ${SEED_PODS.length} pods\n`);
}

async function seedDeviceStatus() {
  console.log('📡 Seeding device status...');
  
  const { error } = await supabase
    .from('device_status')
    .upsert(SEED_DEVICE_STATUS, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding device status:', error);
    throw error;
  }

  console.log(`   ✓ Created ${SEED_DEVICE_STATUS.length} device statuses\n`);
}

async function seedTelemetryReadings() {
  console.log('📊 Seeding telemetry readings (this may take a moment)...');
  console.log(`   ℹ️  Inserting ${SEED_TELEMETRY_READINGS.length} readings...`);
  
  // Insert in batches of 500 to avoid timeout
  const batchSize = 500;
  const batches = Math.ceil(SEED_TELEMETRY_READINGS.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, SEED_TELEMETRY_READINGS.length);
    const batch = SEED_TELEMETRY_READINGS.slice(start, end);
    
    const { error } = await supabase
      .from('telemetry_readings')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error seeding batch ${i + 1}:`, error);
      throw error;
    }
    
    console.log(`   ✓ Batch ${i + 1}/${batches} (${batch.length} readings)`);
  }

  console.log(`\n   ✅ Created ${SEED_TELEMETRY_READINGS.length} telemetry readings\n`);
}

async function main() {
  const shouldClean = process.argv.includes('--clean');

  console.log('\n🌱 TRAZO Monitoring Data Seeder\n');
  console.log('=====================================\n');

  try {
    if (shouldClean) {
      await cleanMonitoringData();
    }

    await seedRooms();
    await seedPods();
    await seedDeviceStatus();
    await seedTelemetryReadings();

    console.log('=====================================\n');
    console.log('✅ Monitoring data seeded successfully!\n');
    console.log('📋 Summary:');
    console.log(`   • ${SEED_ROOMS.length} rooms`);
    console.log(`   • ${SEED_PODS.length} pods`);
    console.log(`   • ${SEED_DEVICE_STATUS.length} device statuses`);
    console.log(`   • ${SEED_TELEMETRY_READINGS.length} telemetry readings (24h)\n`);
    console.log('🎯 Next steps:');
    console.log('   1. Visit http://localhost:3000/dashboard/monitoring');
    console.log('   2. View fleet overview with 3 pods');
    console.log('   3. Click any pod to see detailed telemetry\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
