#!/usr/bin/env node

/**
 * Quick fix script to ensure dev organization and site exist
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixDevOrg() {
  console.log('\n🔧 Creating dev organization, site, and user...\n');

  try {
    // STEP 1: Create auth user first (required for user profile foreign key)
    console.log('1. Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'dev@trazo.ag',
      password: 'DevPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Dev User',
      },
    });

    if (authError && authError.message !== 'User already registered') {
      console.error('❌ Error creating auth user:', authError);
      throw authError;
    }

    const userId = authData?.user?.id || '00000000-0000-0000-0000-000000000001';
    console.log('✓ Auth user ready:', userId);

    // STEP 2: Check if organization exists
    console.log('\n2. Creating organization...');
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', '00000000-0000-0000-0000-000000000010')
      .single();

    if (existingOrg) {
      console.log('✓ Dev organization already exists:', existingOrg.name);
    } else {
      // Create dev organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          id: '00000000-0000-0000-0000-000000000010',
          name: 'Development Farm',
          data_region: 'us',
          jurisdiction: 'maryland_cannabis',
          plant_type: 'cannabis',
          contact_email: 'dev@trazo.ag',
          timezone: 'America/Los_Angeles',
          is_active: true,
        })
        .select()
        .single();

      if (orgError) {
        console.error('❌ Error creating organization:', orgError);
        throw orgError;
      }

      console.log('✓ Created dev organization:', org.name);
    }

    // Check if site exists
    const { data: existingSite } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', '00000000-0000-0000-0000-000000000020')
      .single();

    if (existingSite) {
      console.log('✓ Dev site already exists:', existingSite.name);
    } else {
      // Create dev site
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .insert({
          id: '00000000-0000-0000-0000-000000000020',
          organization_id: '00000000-0000-0000-0000-000000000010',
          name: 'Main Facility',
          timezone: 'America/Los_Angeles',
          is_active: true,
        })
        .select()
        .single();

      if (siteError) {
        console.error('❌ Error creating site:', siteError);
        throw siteError;
      }

      console.log('✓ Created dev site:', site.name);
    }

    // Verify by querying
    const { data: verifyOrg, error: verifyError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', '00000000-0000-0000-0000-000000000010')
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      throw verifyError;
    }

    // STEP 3: Check if user profile exists
    console.log('\n3. Creating user profile...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', userId)
      .single();

    if (existingUser) {
      console.log('✓ Dev user profile already exists:', existingUser.full_name);
    } else {
      // Create dev user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: 'dev@trazo.ag',
          full_name: 'Dev User',
          phone: '+1234567890',
          organization_id: '00000000-0000-0000-0000-000000000010',
          role: 'org_admin',
          is_active: true,
        })
        .select()
        .single();

      if (userError) {
        console.error('❌ Error creating user profile:', userError);
        throw userError;
      }

      console.log('✓ Created dev user profile:', user.full_name);
    }

    console.log('\n✅ Success! Dev environment is ready:');
    console.log('   ID:', verifyOrg.id);
    console.log('   Name:', verifyOrg.name);
    console.log('\n🎉 You can now create inventory items!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

fixDevOrg();
