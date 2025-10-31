import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSites() {
  console.log('🔍 Checking existing sites...\n');
  
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, organization_id')
    .limit(10);
  
  if (sitesError) {
    console.error('❌ Error fetching sites:', sitesError);
    return;
  }
  
  if (!sites || sites.length === 0) {
    console.log('⚠️  No sites found. You need to seed sites first.');
    return;
  }
  
  console.log(`✅ Found ${sites.length} site(s):\n`);
  sites.forEach((site, index) => {
    console.log(`${index + 1}. ${site.name}`);
    console.log(`   ID: ${site.id}`);
    console.log(`   Organization: ${site.organization_id}\n`);
  });
}

checkSites();
