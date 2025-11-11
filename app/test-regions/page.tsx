/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validateRegionConfig } from '@/lib/supabase/region';

export default function TestRegions() {
  const [usStatus, setUsStatus] = useState<string>('🔄 Testing...');
  const [caStatus, setCaStatus] = useState<string>('🔄 Testing...');
  const [configValid, setConfigValid] = useState<string>('🔄 Validating...');

  useEffect(() => {
    // Validate config first
    try {
      validateRegionConfig();
      setConfigValid('✅ All environment variables configured');
    } catch (e: any) {
      setConfigValid(`❌ ${e.message}`);
      return;
    }

    // Test US connection
    async function testUS() {
      try {
        const supabase = createClient('US');
        const { error } = await supabase.auth.getSession();
        if (error) {
          setUsStatus(`❌ US: ${error.message}`);
        } else {
          setUsStatus('✅ US: Connected successfully');
        }
      } catch (e: any) {
        setUsStatus(`❌ US: ${e.message}`);
      }
    }

    // Test Canada connection
    async function testCA() {
      try {
        const supabase = createClient('CA');
        const { error } = await supabase.auth.getSession();
        if (error) {
          setCaStatus(`❌ Canada: ${error.message}`);
        } else {
          setCaStatus('✅ Canada: Connected successfully');
        }
      } catch (e: any) {
        setCaStatus(`❌ Canada: ${e.message}`);
      }
    }

    testUS();
    testCA();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>🌍 Dual-Region Connection Test</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Configuration Validation</h2>
        <pre style={{ background: '#f5f5f5', padding: '1rem' }}>
          {configValid}
        </pre>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Database Connections</h2>
        <pre style={{ background: '#f5f5f5', padding: '1rem' }}>
          {usStatus}
          {'\n'}
          {caStatus}
        </pre>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Environment Variables Detected:</h3>
        <pre style={{ background: '#f5f5f5', padding: '1rem', fontSize: '0.85rem' }}>
          US_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}
          {'\n'}
          CA_URL: {process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY ? '✅' : '❌'}
        </pre>
      </div>
    </div>
  );
}