/**
 * Integration test for merge upsert function
 * Tests partial variable merging to ensure no data loss
 * 
 * This test verifies the fix for the TagoIO partial polling issue where
 * different API calls return different subsets of variables at the same timestamp.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@/lib/supabase/server';
import type { InsertTelemetryReading } from '@/types/telemetry';

describe('Merge Upsert Telemetry Function', () => {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  let testPodId: string;
  const testTimestamp = new Date('2025-11-07T10:00:00Z').toISOString();

  beforeAll(async () => {
    supabase = await createClient();
    
    // Get first pod for testing (or create a test pod)
    const { data: pods } = await supabase
      .from('pods')
      .select('id')
      .limit(1);
    
    if (!pods || pods.length === 0) {
      throw new Error('No pods found for testing. Please create a pod first.');
    }
    
    testPodId = pods[0].id;
    
    // Clean up any existing test data
    await supabase
      .from('telemetry_readings')
      .delete()
      .eq('pod_id', testPodId)
      .eq('timestamp', testTimestamp);
  });

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('telemetry_readings')
      .delete()
      .eq('pod_id', testPodId)
      .eq('timestamp', testTimestamp);
  });

  it('should merge partial variables without data loss', async () => {
    // Simulate first poll: only temperature and humidity
    const firstPoll: InsertTelemetryReading = {
      pod_id: testPodId,
      timestamp: testTimestamp,
      temperature_c: 25.5,
      humidity_pct: 60.0,
      data_source: 'tagoio'
    };

    // Insert first poll
    const { error: error1 } = await supabase.rpc('merge_upsert_telemetry_reading', {
      reading: firstPoll as unknown as Record<string, unknown>
    });
    
    expect(error1).toBeNull();

    // Verify first poll data
    const { data: afterFirst, error: fetchError1 } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', testPodId)
      .eq('timestamp', testTimestamp)
      .single();

    expect(fetchError1).toBeNull();
    expect(afterFirst).not.toBeNull();
    expect(afterFirst!.temperature_c).toBe(25.5);
    expect(afterFirst!.humidity_pct).toBe(60.0);
    expect(afterFirst!.co2_ppm).toBeNull();

    // Simulate second poll (milliseconds later): only CO2 and light intensity
    const secondPoll: InsertTelemetryReading = {
      pod_id: testPodId,
      timestamp: testTimestamp, // Same timestamp!
      co2_ppm: 800,
      light_intensity_pct: 75,
      data_source: 'tagoio'
    };

    // Insert second poll (should MERGE, not REPLACE)
    const { error: error2 } = await supabase.rpc('merge_upsert_telemetry_reading', {
      reading: secondPoll as unknown as Record<string, unknown>
    });
    
    expect(error2).toBeNull();

    // Verify merged data - should have ALL variables
    const { data: afterSecond, error: fetchError2 } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', testPodId)
      .eq('timestamp', testTimestamp)
      .single();

    expect(fetchError2).toBeNull();
    expect(afterSecond).not.toBeNull();
    
    // Critical assertions: verify no data loss
    expect(afterSecond!.temperature_c).toBe(25.5); // From first poll - should NOT be null!
    expect(afterSecond!.humidity_pct).toBe(60.0); // From first poll - should NOT be null!
    expect(afterSecond!.co2_ppm).toBe(800); // From second poll
    expect(afterSecond!.light_intensity_pct).toBe(75); // From second poll

    // Simulate third poll: update one existing value, add new values
    const thirdPoll: InsertTelemetryReading = {
      pod_id: testPodId,
      timestamp: testTimestamp,
      temperature_c: 26.0, // Update temperature
      vpd_kpa: 1.2, // New value
      lights_on: true, // New value
      data_source: 'tagoio'
    };

    const { error: error3 } = await supabase.rpc('merge_upsert_telemetry_reading', {
      reading: thirdPoll as unknown as Record<string, unknown>
    });
    
    expect(error3).toBeNull();

    // Verify final merged state
    const { data: afterThird, error: fetchError3 } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', testPodId)
      .eq('timestamp', testTimestamp)
      .single();

    expect(fetchError3).toBeNull();
    expect(afterThird).not.toBeNull();
    
    // Verify all values are correct
    expect(afterThird!.temperature_c).toBe(26.0); // Updated from third poll
    expect(afterThird!.humidity_pct).toBe(60.0); // Preserved from first poll
    expect(afterThird!.co2_ppm).toBe(800); // Preserved from second poll
    expect(afterThird!.light_intensity_pct).toBe(75); // Preserved from second poll
    expect(afterThird!.vpd_kpa).toBe(1.2); // New from third poll
    expect(afterThird!.lights_on).toBe(true); // New from third poll
  });

  it('should handle duplicate constraint correctly', async () => {
    const timestamp = new Date('2025-11-07T11:00:00Z').toISOString();
    
    const reading: InsertTelemetryReading = {
      pod_id: testPodId,
      timestamp,
      temperature_c: 22.0,
      data_source: 'tagoio'
    };

    // Insert first time
    const { error: error1 } = await supabase.rpc('merge_upsert_telemetry_reading', {
      reading: reading as unknown as Record<string, unknown>
    });
    expect(error1).toBeNull();

    // Insert again with same pod_id and timestamp (should merge, not error)
    const { error: error2 } = await supabase.rpc('merge_upsert_telemetry_reading', {
      reading: { ...reading, humidity_pct: 55 } as unknown as Record<string, unknown>
    });
    expect(error2).toBeNull();

    // Verify only one row exists
    const { data, error: fetchError } = await supabase
      .from('telemetry_readings')
      .select('*')
      .eq('pod_id', testPodId)
      .eq('timestamp', timestamp);

    expect(fetchError).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].temperature_c).toBe(22.0);
    expect(data![0].humidity_pct).toBe(55);

    // Clean up
    await supabase
      .from('telemetry_readings')
      .delete()
      .eq('pod_id', testPodId)
      .eq('timestamp', timestamp);
  });
});
