/**
 * Seed Alarm Policies Script
 * 
 * Populates the alarm_policies table with realistic default policies
 * for cannabis cultivation facilities based on industry best practices.
 * 
 * Created: November 15, 2025
 * Phase: 14A - Alarm System Integration
 */

import { createClient } from '@supabase/supabase-js';
import type { InsertAlarmPolicy, AlarmType, AlarmSeverity } from '@/types/telemetry';

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
// Configuration
// =====================================================

interface PolicyTemplate {
  name: string;
  alarm_type: AlarmType;
  severity: AlarmSeverity;
  threshold_value: number | null;
  threshold_operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
  time_in_state_seconds: number;
  applies_to_stage?: string[] | null;
  suppression_duration_minutes: number;
  description: string;
}

// Cannabis cultivation best practices for environmental controls
const POLICY_TEMPLATES: PolicyTemplate[] = [
  // ===== TEMPERATURE ALARMS =====
  {
    name: 'Critical High Temperature - Flowering',
    alarm_type: 'temperature_high',
    severity: 'critical',
    threshold_value: 28.0, // 28°C (82.4°F)
    threshold_operator: '>',
    time_in_state_seconds: 300, // 5 minutes
    applies_to_stage: ['flowering'],
    suppression_duration_minutes: 15,
    description: 'Critical high temperature during flowering can cause heat stress and reduce yield',
  },
  {
    name: 'High Temperature Warning - Flowering',
    alarm_type: 'temperature_high',
    severity: 'warning',
    threshold_value: 26.5, // 26.5°C (79.7°F)
    threshold_operator: '>',
    time_in_state_seconds: 600, // 10 minutes
    applies_to_stage: ['flowering'],
    suppression_duration_minutes: 30,
    description: 'Temperature approaching critical levels during flowering',
  },
  {
    name: 'Critical High Temperature - Vegetative',
    alarm_type: 'temperature_high',
    severity: 'critical',
    threshold_value: 30.0, // 30°C (86°F)
    threshold_operator: '>',
    time_in_state_seconds: 300,
    applies_to_stage: ['vegetative', 'propagation'],
    suppression_duration_minutes: 15,
    description: 'Critical high temperature during vegetative growth',
  },
  {
    name: 'Critical Low Temperature - All Stages',
    alarm_type: 'temperature_low',
    severity: 'critical',
    threshold_value: 18.0, // 18°C (64.4°F)
    threshold_operator: '<',
    time_in_state_seconds: 300,
    applies_to_stage: null, // Applies to all stages
    suppression_duration_minutes: 15,
    description: 'Temperature too low for healthy plant growth',
  },
  {
    name: 'Low Temperature Warning',
    alarm_type: 'temperature_low',
    severity: 'warning',
    threshold_value: 20.0, // 20°C (68°F)
    threshold_operator: '<',
    time_in_state_seconds: 600,
    applies_to_stage: null,
    suppression_duration_minutes: 30,
    description: 'Temperature approaching critical low threshold',
  },

  // ===== HUMIDITY ALARMS =====
  {
    name: 'Critical High Humidity - Flowering',
    alarm_type: 'humidity_high',
    severity: 'critical',
    threshold_value: 60.0, // 60% RH
    threshold_operator: '>',
    time_in_state_seconds: 300,
    applies_to_stage: ['flowering'],
    suppression_duration_minutes: 15,
    description: 'High humidity during flowering increases mold/mildew risk',
  },
  {
    name: 'High Humidity Warning - Flowering',
    alarm_type: 'humidity_high',
    severity: 'warning',
    threshold_value: 55.0, // 55% RH
    threshold_operator: '>',
    time_in_state_seconds: 900, // 15 minutes
    applies_to_stage: ['flowering'],
    suppression_duration_minutes: 30,
    description: 'Humidity approaching critical levels during flowering',
  },
  {
    name: 'Critical High Humidity - Vegetative',
    alarm_type: 'humidity_high',
    severity: 'warning',
    threshold_value: 70.0, // 70% RH
    threshold_operator: '>',
    time_in_state_seconds: 600,
    applies_to_stage: ['vegetative', 'propagation'],
    suppression_duration_minutes: 20,
    description: 'High humidity during vegetative growth',
  },
  {
    name: 'Critical Low Humidity - All Stages',
    alarm_type: 'humidity_low',
    severity: 'critical',
    threshold_value: 35.0, // 35% RH
    threshold_operator: '<',
    time_in_state_seconds: 300,
    applies_to_stage: null,
    suppression_duration_minutes: 15,
    description: 'Low humidity can cause plant stress and slow growth',
  },
  {
    name: 'Low Humidity Warning - Vegetative',
    alarm_type: 'humidity_low',
    severity: 'warning',
    threshold_value: 45.0, // 45% RH
    threshold_operator: '<',
    time_in_state_seconds: 600,
    applies_to_stage: ['vegetative', 'propagation'],
    suppression_duration_minutes: 30,
    description: 'Humidity below optimal range for vegetative growth',
  },

  // ===== CO2 ALARMS =====
  {
    name: 'Critical High CO2 - Lights On',
    alarm_type: 'co2_high',
    severity: 'critical',
    threshold_value: 1800.0, // 1800 ppm
    threshold_operator: '>',
    time_in_state_seconds: 300,
    applies_to_stage: null,
    suppression_duration_minutes: 15,
    description: 'CO2 levels dangerously high - potential equipment malfunction',
  },
  {
    name: 'High CO2 Warning',
    alarm_type: 'co2_high',
    severity: 'warning',
    threshold_value: 1600.0, // 1600 ppm
    threshold_operator: '>',
    time_in_state_seconds: 600,
    applies_to_stage: null,
    suppression_duration_minutes: 30,
    description: 'CO2 levels above recommended range',
  },
  {
    name: 'Critical Low CO2 - Lights On',
    alarm_type: 'co2_low',
    severity: 'critical',
    threshold_value: 600.0, // 600 ppm
    threshold_operator: '<',
    time_in_state_seconds: 600,
    applies_to_stage: null,
    suppression_duration_minutes: 20,
    description: 'CO2 levels too low for optimal photosynthesis',
  },
  {
    name: 'Low CO2 Warning',
    alarm_type: 'co2_low',
    severity: 'warning',
    threshold_value: 800.0, // 800 ppm
    threshold_operator: '<',
    time_in_state_seconds: 900,
    applies_to_stage: null,
    suppression_duration_minutes: 30,
    description: 'CO2 levels below optimal range',
  },

  // ===== VPD ALARMS =====
  {
    name: 'VPD Out of Range - Flowering',
    alarm_type: 'vpd_out_of_range',
    severity: 'warning',
    threshold_value: null, // VPD is calculated, not a direct threshold
    threshold_operator: '!=',
    time_in_state_seconds: 900,
    applies_to_stage: ['flowering'],
    suppression_duration_minutes: 30,
    description: 'VPD outside optimal range (0.8-1.2 kPa) for flowering',
  },
  {
    name: 'VPD Out of Range - Vegetative',
    alarm_type: 'vpd_out_of_range',
    severity: 'warning',
    threshold_value: null,
    threshold_operator: '!=',
    time_in_state_seconds: 900,
    applies_to_stage: ['vegetative'],
    suppression_duration_minutes: 30,
    description: 'VPD outside optimal range (0.6-1.0 kPa) for vegetative growth',
  },

  // ===== DEVICE/SYSTEM ALARMS =====
  {
    name: 'Device Offline - Critical',
    alarm_type: 'device_offline',
    severity: 'critical',
    threshold_value: null,
    threshold_operator: '=',
    time_in_state_seconds: 180, // 3 minutes
    applies_to_stage: null,
    suppression_duration_minutes: 10,
    description: 'Environmental monitoring device is offline',
  },
  {
    name: 'Sensor Fault Detected',
    alarm_type: 'sensor_fault',
    severity: 'critical',
    threshold_value: null,
    threshold_operator: '=',
    time_in_state_seconds: 60, // 1 minute
    applies_to_stage: null,
    suppression_duration_minutes: 5,
    description: 'Sensor malfunction or invalid readings detected',
  },
  {
    name: 'Power Failure Detected',
    alarm_type: 'power_failure',
    severity: 'critical',
    threshold_value: null,
    threshold_operator: '=',
    time_in_state_seconds: 30, // 30 seconds
    applies_to_stage: null,
    suppression_duration_minutes: 5,
    description: 'Power failure or UPS backup activated',
  },
  {
    name: 'Water Leak Detected',
    alarm_type: 'water_leak',
    severity: 'critical',
    threshold_value: null,
    threshold_operator: '=',
    time_in_state_seconds: 30,
    applies_to_stage: null,
    suppression_duration_minutes: 5,
    description: 'Water leak sensor triggered',
  },
  {
    name: 'Security Breach',
    alarm_type: 'security_breach',
    severity: 'critical',
    threshold_value: null,
    threshold_operator: '=',
    time_in_state_seconds: 10, // Immediate
    applies_to_stage: null,
    suppression_duration_minutes: 0, // No suppression
    description: 'Unauthorized access or security system triggered',
  },
  {
    name: 'Door Open - Extended Duration',
    alarm_type: 'door_open',
    severity: 'warning',
    threshold_value: null,
    threshold_operator: '=',
    time_in_state_seconds: 300, // 5 minutes
    applies_to_stage: null,
    suppression_duration_minutes: 10,
    description: 'Grow room door left open for extended period',
  },
];

// =====================================================
// Main Seeding Function
// =====================================================

async function seedAlarmPolicies() {
  console.log('🌱 Starting alarm policies seed...\n');

  try {
    // Step 1: Get the first organization and user
    console.log('📋 Fetching organization and user...');
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (orgError) throw orgError;
    if (!organizations || organizations.length === 0) {
      throw new Error('No organizations found. Please create an organization first.');
    }

    const organizationId = organizations[0].id;
    console.log(`   ✓ Using organization: ${organizations[0].name} (${organizationId})`);

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('organization_id', organizationId)
      .limit(1);

    if (userError) throw userError;
    if (!users || users.length === 0) {
      throw new Error('No users found in organization. Please create a user first.');
    }

    const userId = users[0].id;
    console.log(`   ✓ Using user: ${users[0].email} (${userId})\n`);

    // Step 2: Check for existing policies
    console.log('🔍 Checking for existing policies...');
    const { data: existingPolicies, error: checkError } = await supabase
      .from('alarm_policies')
      .select('id, name')
      .eq('organization_id', organizationId);

    if (checkError) throw checkError;

    if (existingPolicies && existingPolicies.length > 0) {
      console.log(`   ⚠️  Found ${existingPolicies.length} existing policies`);
      console.log('   Existing policies:');
      existingPolicies.forEach(p => console.log(`     - ${p.name}`));
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('\n   Continue and create additional policies? (y/n): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('\n❌ Seeding cancelled by user');
        process.exit(0);
      }
    } else {
      console.log('   ✓ No existing policies found\n');
    }

    // Step 3: Insert policies
    console.log('📝 Creating alarm policies...\n');
    const policiesToInsert: InsertAlarmPolicy[] = POLICY_TEMPLATES.map(template => ({
      organization_id: organizationId,
      name: template.name,
      alarm_type: template.alarm_type,
      severity: template.severity,
      threshold_value: template.threshold_value,
      threshold_operator: template.threshold_operator,
      time_in_state_seconds: template.time_in_state_seconds,
      applies_to_stage: template.applies_to_stage,
      applies_to_pod_types: null,
      suppression_duration_minutes: template.suppression_duration_minutes,
      is_active: true,
      created_by: userId,
    }));

    let successCount = 0;
    let errorCount = 0;

    for (const policy of policiesToInsert) {
      const { error } = await supabase
        .from('alarm_policies')
        .insert(policy);

      if (error) {
        console.log(`   ❌ Failed: ${policy.name}`);
        console.log(`      Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✓ Created: ${policy.name}`);
        successCount++;
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} policies`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} policies`);
    }
    console.log(`🏢 Organization: ${organizations[0].name}`);
    console.log(`👤 Created by: ${users[0].email}`);
    console.log('='.repeat(60) + '\n');

    // Step 5: Display policy breakdown
    console.log('📋 POLICY BREAKDOWN BY TYPE:\n');
    const typeGroups: Record<string, number> = {};
    POLICY_TEMPLATES.forEach(p => {
      typeGroups[p.alarm_type] = (typeGroups[p.alarm_type] || 0) + 1;
    });

    Object.entries(typeGroups).forEach(([type, count]) => {
      console.log(`   ${type.padEnd(25)} : ${count} ${count === 1 ? 'policy' : 'policies'}`);
    });

    console.log('\n✨ Alarm policies seeding complete!\n');

  } catch (error) {
    console.error('\n❌ Error seeding alarm policies:');
    console.error(error);
    process.exit(1);
  }
}

// Run the seed function
seedAlarmPolicies();
