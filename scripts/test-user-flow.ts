#!/usr/bin/env node

/**
 * Test User Flow Script
 * Tests sign-up, login, invite, and user management operations
 * 
 * Usage:
 *   npm run test:user-flow
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Error: Missing required environment variables\n');
  console.error('Required variables:');
  console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`);
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✗' : '✗'}`);
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testUserFlow() {
  console.log('\n🧪 Testing User Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Check database setup
    console.log('\n📊 Step 1: Checking database setup...');
    
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (orgsError) {
      throw new Error(`Organizations table error: ${orgsError.message}`);
    }

    let testOrgId: string;
    
    if (orgs && orgs.length > 0) {
      testOrgId = orgs[0].id;
      console.log(`   ✓ Found existing organization: ${orgs[0].name} (${testOrgId})`);
    } else {
      // Create test organization
      const { data: newOrg, error: createOrgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Organization',
          data_region: 'us',
          jurisdiction: 'oregon_cannabis',
          plant_type: 'cannabis',
        })
        .select()
        .single();

      if (createOrgError) {
        throw new Error(`Failed to create organization: ${createOrgError.message}`);
      }

      testOrgId = newOrg.id;
      console.log(`   ✓ Created test organization: ${testOrgId}`);
    }

    // Step 2: Test trigger by creating an auth user
    console.log('\n👤 Step 2: Testing auto profile creation trigger...');
    const testEmail = `test-${Date.now()}@trazo-test.com`;
    
    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
        role: 'operator',
        organization_id: testOrgId,
      },
    });

    if (signUpError) {
      throw new Error(`Failed to create auth user: ${signUpError.message}`);
    }

    console.log(`   ✓ Created auth user: ${authUser.user.id}`);

    // Wait a moment for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError) {
      console.error(`   ✗ Profile NOT created automatically`);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    console.log(`   ✓ Profile created automatically via trigger`);
    console.log(`   ✓ Status: ${profile.status}`);
    console.log(`   ✓ Role: ${profile.role}`);
    console.log(`   ✓ IDP: ${profile.idp}`);

    // Step 3: Test user invitation
    console.log('\n📧 Step 3: Testing user invitation...');
    const inviteEmail = `invite-${Date.now()}@trazo-test.com`;

    const { data: invitedUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      inviteEmail,
      {
        data: {
          full_name: 'Invited User',
          role: 'head_grower',
          organization_id: testOrgId,
        },
        redirectTo: 'http://localhost:3000/auth/confirm?next=/dashboard',
      }
    );

    if (inviteError) {
      throw new Error(`Failed to invite user: ${inviteError.message}`);
    }

    console.log(`   ✓ User invited: ${invitedUser.user.id}`);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the invited user profile
    const { data: invitedProfile, error: updateError } = await supabase
      .from('users')
      .update({ status: 'invited' })
      .eq('id', invitedUser.user.id)
      .select()
      .single();

    if (updateError) {
      console.error(`   ⚠️  Could not set invited status: ${updateError.message}`);
    } else {
      console.log(`   ✓ Profile status set to: ${invitedProfile.status}`);
    }

    // Step 4: Test user status updates
    console.log('\n🔄 Step 4: Testing user status updates...');
    
    // Suspend user
    const { error: suspendError } = await supabase
      .from('users')
      .update({ status: 'suspended' })
      .eq('id', authUser.user.id);

    if (suspendError) {
      throw new Error(`Failed to suspend user: ${suspendError.message}`);
    }
    console.log('   ✓ User suspended successfully');

    // Reactivate user
    const { error: activateError } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', authUser.user.id);

    if (activateError) {
      throw new Error(`Failed to activate user: ${activateError.message}`);
    }
    console.log('   ✓ User reactivated successfully');

    // Step 5: Test site assignments
    console.log('\n🏢 Step 5: Testing site assignments...');
    
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', testOrgId)
      .limit(1);

    if (sitesError) {
      throw new Error(`Failed to fetch sites: ${sitesError.message}`);
    }

    let testSiteId: string;

    if (sites && sites.length > 0) {
      testSiteId = sites[0].id;
      console.log(`   ✓ Using existing site: ${sites[0].name}`);
    } else {
      const { data: newSite, error: createSiteError } = await supabase
        .from('sites')
        .insert({
          organization_id: testOrgId,
          name: 'Test Site',
          city: 'Portland',
          state_province: 'OR',
          country: 'USA',
        })
        .select()
        .single();

      if (createSiteError) {
        throw new Error(`Failed to create site: ${createSiteError.message}`);
      }

      testSiteId = newSite.id;
      console.log(`   ✓ Created test site: ${testSiteId}`);
    }

    // Add site assignment
    const { error: assignError } = await supabase
      .from('user_site_assignments')
      .insert({
        user_id: authUser.user.id,
        site_id: testSiteId,
      });

    if (assignError) {
      throw new Error(`Failed to assign site: ${assignError.message}`);
    }
    console.log('   ✓ Site assigned to user');

    // Remove site assignment
    const { error: removeError } = await supabase
      .from('user_site_assignments')
      .delete()
      .eq('user_id', authUser.user.id)
      .eq('site_id', testSiteId);

    if (removeError) {
      throw new Error(`Failed to remove site assignment: ${removeError.message}`);
    }
    console.log('   ✓ Site assignment removed');

    // Step 6: Cleanup
    console.log('\n🧹 Step 6: Cleaning up test data...');

    // Delete test users
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await supabase.auth.admin.deleteUser(invitedUser.user.id);
    
    console.log('   ✓ Test users deleted');

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\n' + '='.repeat(60));
    process.exit(1);
  }
}

// Run the test
testUserFlow();
