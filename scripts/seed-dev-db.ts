#!/usr/bin/env node

/**
 * Seed Development Database
 * Populates Supabase with realistic sample data for admin features
 * 
 * Usage:
 *   npm run seed:dev
 *   npm run seed:dev -- --clean  (cleans existing data first)
 * 
 * Prerequisites:
 *   1. Create .env.local file with:
 *      NEXT_PUBLIC_SUPABASE_URL=your_url
 *      SUPABASE_SERVICE_ROLE_KEY=your_key
 * 
 *   2. Run database schema first:
 *      Execute lib/supabase/schema.sql in Supabase SQL Editor
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import {
  SEED_ORGANIZATIONS,
  SEED_SITES,
  SEED_USERS,
  SEED_AUDIT_EVENTS,
  SEED_USER_SITE_ASSIGNMENTS,
} from '../lib/supabase/seed-data';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Error: Missing required environment variables\n');
  console.error('Required variables:');
  console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`);
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✗' : '✗'}`);
  console.error('\n📝 Setup Instructions:\n');
  console.error('1. Create a .env.local file in the project root');
  console.error('2. Copy from .env.example');
  console.error('3. Add your Supabase credentials:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('\n4. Get these values from:');
  console.error('   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api\n');
  process.exit(1);
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function cleanDatabase() {
  console.log('🧹 Cleaning existing seed data...\n');

  try {
    // Delete in reverse order of dependencies
    await supabase.from('user_site_assignments').delete().in('user_id', SEED_USERS.map(u => u.id));
    console.log('   ✓ Cleaned user_site_assignments');

    await supabase.from('audit_log').delete().in('id', SEED_AUDIT_EVENTS.map(e => e.id));
    console.log('   ✓ Cleaned audit_log');

    // Note: Can't delete auth.users directly via JS client, need to use Supabase dashboard or SQL
    await supabase.from('users').delete().in('id', SEED_USERS.map(u => u.id));
    console.log('   ✓ Cleaned users (note: auth.users must be cleaned manually)');

    await supabase.from('sites').delete().in('id', SEED_SITES.map(s => s.id));
    console.log('   ✓ Cleaned sites');

    await supabase.from('organizations').delete().in('id', SEED_ORGANIZATIONS.map(o => o.id));
    console.log('   ✓ Cleaned organizations');

    console.log('\n✅ Database cleaned successfully\n');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

async function seedOrganizations() {
  console.log('📦 Seeding organizations...');
  
  const { error } = await supabase
    .from('organizations')
    .upsert(SEED_ORGANIZATIONS, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding organizations:', error);
    throw error;
  }

  console.log(`   ✓ Created ${SEED_ORGANIZATIONS.length} organizations\n`);
}

async function seedSites() {
  console.log('🏢 Seeding sites...');
  
  const { error } = await supabase
    .from('sites')
    .upsert(SEED_SITES, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding sites:', error);
    throw error;
  }

  console.log(`   ✓ Created ${SEED_SITES.length} sites\n`);
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  console.log('   ⚠️  Note: Auth users must be created manually in Supabase Auth or via signup flow');
  console.log('   Creating user profile records only...\n');

  // We can only seed the users table, not auth.users
  // The auth.users must be created via the Supabase Auth API or signup flow
  const userProfiles = SEED_USERS.map(user => ({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone,
    organization_id: user.organization_id,
    role: user.role,
    is_active: user.is_active,
    hire_date: user.hire_date,
    last_sign_in: user.last_sign_in,
  }));

  const { error } = await supabase
    .from('users')
    .upsert(userProfiles, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }

  console.log(`   ✓ Created ${SEED_USERS.length} user profiles\n`);
  
  // Print instructions for creating auth users
  console.log('   📝 To create corresponding auth users, run:');
  console.log('      npm run seed:auth\n');
  console.log('   Or manually create accounts via signup with these emails:');
  SEED_USERS.slice(0, 5).forEach(user => {
    console.log(`      - ${user.email}`);
  });
  console.log(`      ... and ${SEED_USERS.length - 5} more\n`);
}

async function seedUserSiteAssignments() {
  console.log('🔗 Seeding user site assignments...');
  
  const { error } = await supabase
    .from('user_site_assignments')
    .upsert(SEED_USER_SITE_ASSIGNMENTS);

  if (error) {
    console.error('❌ Error seeding user site assignments:', error);
    throw error;
  }

  console.log(`   ✓ Created ${SEED_USER_SITE_ASSIGNMENTS.length} site assignments\n`);
}

async function seedAuditEvents() {
  console.log('📋 Seeding audit events...');
  
  const { error } = await supabase
    .from('audit_log')
    .upsert(SEED_AUDIT_EVENTS, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding audit events:', error);
    throw error;
  }

  console.log(`   ✓ Created ${SEED_AUDIT_EVENTS.length} audit events\n`);
}

async function verifySeeding() {
  console.log('🔍 Verifying seeded data...\n');

  const checks = [
    { table: 'organizations', expected: SEED_ORGANIZATIONS.length },
    { table: 'sites', expected: SEED_SITES.length },
    { table: 'users', expected: SEED_USERS.length },
    { table: 'audit_log', expected: SEED_AUDIT_EVENTS.length },
    { table: 'user_site_assignments', expected: SEED_USER_SITE_ASSIGNMENTS.length },
  ];

  let allPassed = true;

  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`   ❌ Error checking ${check.table}:`, error);
      allPassed = false;
    } else if (count !== null && count >= check.expected) {
      console.log(`   ✓ ${check.table}: ${count} records (expected at least ${check.expected})`);
    } else {
      console.error(`   ❌ ${check.table}: ${count} records (expected ${check.expected})`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes('--clean');

  console.log('\n🌱 Trazo Development Database Seeding');
  console.log('=====================================\n');

  try {
    if (shouldClean) {
      await cleanDatabase();
    }

    await seedOrganizations();
    await seedSites();
    await seedUsers();
    await seedUserSiteAssignments();
    await seedAuditEvents();

    const verified = await verifySeeding();

    if (verified) {
      console.log('\n✅ Database seeding completed successfully!\n');
      console.log('📊 Summary:');
      console.log(`   • ${SEED_ORGANIZATIONS.length} organizations`);
      console.log(`   • ${SEED_SITES.length} sites`);
      console.log(`   • ${SEED_USERS.length} users (profiles only)`);
      console.log(`   • ${SEED_USER_SITE_ASSIGNMENTS.length} site assignments`);
      console.log(`   • ${SEED_AUDIT_EVENTS.length} audit events\n`);
      console.log('🔐 Admin Access:');
      console.log('   Email: admin@greenleaf.example');
      console.log('   Role: org_admin\n');
      console.log('📖 Next Steps:');
      console.log('   1. Create auth users via signup or Supabase Auth dashboard');
      console.log('   2. Navigate to /dashboard/admin to view the admin interface');
      console.log('   3. Run npm run test to verify functionality\n');
    } else {
      console.log('\n⚠️  Seeding completed with warnings. Please check the output above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding script
main();
