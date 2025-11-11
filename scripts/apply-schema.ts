#!/usr/bin/env node

/**
 * Apply Database Schema
 * Executes the schema.sql file to create all database tables
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

async function applySchema() {
  console.log('\n🗄️  Applying Database Schema...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'supabase', 'schema.sql');
    console.log('📄 Reading schema file:', schemaPath);
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('📊 Schema file size:', (schemaSql.length / 1024).toFixed(2), 'KB');
    console.log('⚙️  Executing schema...\n');
    
    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSql }).select();
    
    if (error) {
      // Try direct approach if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying direct execution...\n');
      
      // Split by statement and execute one by one
      const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          const { error: stmtError } = await supabase.rpc('query', { query_text: stmt });
          
          if (stmtError) {
            console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
            errorCount++;
          } else {
            successCount++;
            if ((i + 1) % 10 === 0) {
              console.log(`✓ Executed ${i + 1}/${statements.length} statements`);
            }
          }
        } catch (err) {
          console.error(`❌ Error executing statement ${i + 1}:`, err);
          errorCount++;
        }
      }
      
      console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors\n`);
      
      if (errorCount > 0) {
        console.log('⚠️  Some statements failed. This may be expected for:');
        console.log('   - Tables/functions that already exist');
        console.log('   - Duplicate indexes');
        console.log('   - View recreation');
      }
    } else {
      console.log('✅ Schema executed successfully!\n');
    }

    // Verify key tables exist
    console.log('🔍 Verifying table creation...\n');
    
    const tables = [
      'organizations',
      'sites',
      'users',
      'inventory_items',
      'inventory_lots',
      'inventory_movements',
      'batches',
      'audit_log'
    ];
    
    for (const table of tables) {
      const { error: checkError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (checkError) {
        console.log(`❌ ${table}: NOT FOUND`);
      } else {
        console.log(`✓ ${table}: EXISTS`);
      }
    }
    
    console.log('\n✅ Schema application complete!\n');
    console.log('📖 Next steps:');
    console.log('   1. Run: npm run seed:dev (to populate test data)');
    console.log('   2. Try creating inventory items again\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

applySchema();
