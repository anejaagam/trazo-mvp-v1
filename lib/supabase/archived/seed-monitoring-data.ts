/**
 * Monitoring Seed Data
 * Creates demo pods with telemetry readings for testing
 */

export interface SeedRoom {
  id: string;
  site_id: string;
  name: string;
  room_type: 'veg' | 'flower' | 'mother' | 'clone' | 'dry' | 'cure' | 'mixed' | 'processing' | 'storage';
  capacity_pods?: number;
  dimensions_length_ft?: number;
  dimensions_width_ft?: number;
  dimensions_height_ft?: number;
  environmental_zone?: string;
  is_active: boolean;
}

export interface SeedPod {
  id: string;
  room_id: string;
  name: string;
  pod_serial_number?: string;
  gcu_address?: number;
  tagoio_device_id?: string;
  status?: 'active' | 'maintenance' | 'offline' | 'decommissioned';
  canopy_area_sqft?: number;
  max_plant_count?: number;
  site_id?: string; // Will be populated via room relationship
}

export interface SeedTelemetryReading {
  pod_id: string;
  timestamp: string;
  temperature_c?: number;
  humidity_pct?: number;
  co2_ppm?: number;
  light_intensity_pct?: number;
  vpd_kpa?: number;
  lights_on?: boolean;
  data_source?: 'tagoio' | 'manual' | 'calculated' | 'simulated';
  raw_data?: Record<string, unknown>;
}

export interface SeedDeviceStatus {
  id: string;
  pod_id: string;
  device_name: string;
  device_type: 'gcu' | 'sensor' | 'actuator';
  status: 'online' | 'offline' | 'error' | 'maintenance';
  last_communication: string;
  error_message?: string;
  firmware_version?: string;
  hardware_version?: string;
}

// =====================================================
// ROOMS
// =====================================================

export const SEED_ROOMS: SeedRoom[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    site_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // GreenLeaf Main Facility
    name: 'Flowering Room A',
    room_type: 'flower',
    capacity_pods: 8,
    dimensions_length_ft: 40,
    dimensions_width_ft: 30,
    dimensions_height_ft: 12,
    environmental_zone: 'Zone A',
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    site_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // GreenLeaf Main Facility
    name: 'Vegetative Room B',
    room_type: 'veg',
    capacity_pods: 8,
    dimensions_length_ft: 30,
    dimensions_width_ft: 25,
    dimensions_height_ft: 10,
    environmental_zone: 'Zone B',
    is_active: true,
  },
];

// Demo Pods
export const SEED_PODS: SeedPod[] = [
  {
    id: '00000000-0000-0000-0000-000000000011',
    room_id: SEED_ROOMS[0].id,
    name: 'Pod Alpha-1',
    pod_serial_number: 'TRAZO-POD-2024-001',
    gcu_address: 1,
    tagoio_device_id: process.env.NEXT_PUBLIC_TAGOIO_DEVICE_ID_1 || 'demo-device-1',
    status: 'active',
    canopy_area_sqft: 128,
    max_plant_count: 48,
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    room_id: SEED_ROOMS[0].id,
    name: 'Pod Alpha-2',
    pod_serial_number: 'TRAZO-POD-2024-002',
    gcu_address: 2,
    tagoio_device_id: 'demo-device-2',
    status: 'active',
    canopy_area_sqft: 128,
    max_plant_count: 48,
  },
  {
    id: '00000000-0000-0000-0000-000000000021',
    room_id: SEED_ROOMS[1].id,
    name: 'Pod Beta-1',
    pod_serial_number: 'TRAZO-POD-2024-003',
    gcu_address: 1,
    tagoio_device_id: 'demo-device-3',
    status: 'offline',
    canopy_area_sqft: 96,
    max_plant_count: 32,
  },
];

// =====================================================
// DEVICE STATUS
// =====================================================

export const SEED_DEVICE_STATUS: SeedDeviceStatus[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    pod_id: SEED_PODS[0].id,
    device_name: 'TagoIO Sensor Alpha-1',
    device_type: 'sensor',
    status: 'online',
    last_communication: new Date().toISOString(),
    firmware_version: 'v2.1.3',
    hardware_version: 'HW-1.0',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    pod_id: SEED_PODS[1].id,
    device_name: 'TagoIO Sensor Alpha-2',
    device_type: 'sensor',
    status: 'online',
    last_communication: new Date(Date.now() - 5 * 60000).toISOString(), // 5 min ago
    firmware_version: 'v2.1.3',
    hardware_version: 'HW-1.0',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    pod_id: SEED_PODS[2].id,
    device_name: 'TagoIO Sensor Beta-1',
    device_type: 'sensor',
    status: 'offline',
    last_communication: new Date(Date.now() - 30 * 60000).toISOString(), // 30 min ago
    error_message: 'Connection timeout - device not responding',
    firmware_version: 'v2.1.2',
    hardware_version: 'HW-1.0',
  },
];

// =====================================================
// TELEMETRY READINGS (LAST 24 HOURS)
// =====================================================

/**
 * Generate realistic telemetry readings for the last 24 hours
 * Readings every 5 minutes = 288 readings per pod per day
 */
export function generateTelemetryReadings(): SeedTelemetryReading[] {
  const readings: SeedTelemetryReading[] = [];
  const now = Date.now();
  const interval = 5 * 60 * 1000; // 5 minutes
  
  // Pod Alpha-1: Optimal conditions (flowering)
  for (let i = 0; i < 288; i++) {
    const timestamp = new Date(now - i * interval);
    const hour = timestamp.getHours();
    
    // Simulate day/night cycle
    const isDaytime = hour >= 6 && hour < 18;
    
    readings.push({
      pod_id: SEED_PODS[0].id,
      timestamp: timestamp.toISOString(),
      temperature_c: isDaytime 
        ? 24 + Math.random() * 2 // 24-26°C day
        : 20 + Math.random() * 2, // 20-22°C night
      humidity_pct: isDaytime
        ? 45 + Math.random() * 5 // 45-50% day
        : 55 + Math.random() * 5, // 55-60% night
      co2_ppm: Math.round(isDaytime
        ? 1200 + Math.random() * 200 // 1200-1400 ppm day
        : 400 + Math.random() * 100), // 400-500 ppm night
      light_intensity_pct: isDaytime ? Math.round(80 + Math.random() * 20) : 0,
      vpd_kpa: isDaytime ? 1.2 + Math.random() * 0.3 : 0.8 + Math.random() * 0.2,
      lights_on: isDaytime,
      data_source: 'tagoio',
    });
  }
  
  // Pod Alpha-2: Running a bit warm
  for (let i = 0; i < 288; i++) {
    const timestamp = new Date(now - i * interval);
    const hour = timestamp.getHours();
    const isDaytime = hour >= 6 && hour < 18;
    
    readings.push({
      pod_id: SEED_PODS[1].id,
      timestamp: timestamp.toISOString(),
      temperature_c: isDaytime 
        ? 27 + Math.random() * 2 // 27-29°C (too warm!)
        : 22 + Math.random() * 2,
      humidity_pct: isDaytime
        ? 40 + Math.random() * 5 // 40-45% (a bit low)
        : 50 + Math.random() * 5,
      co2_ppm: Math.round(isDaytime
        ? 1100 + Math.random() * 200
        : 400 + Math.random() * 100),
      light_intensity_pct: isDaytime ? Math.round(85 + Math.random() * 15) : 0,
      vpd_kpa: isDaytime ? 1.5 + Math.random() * 0.3 : 0.9 + Math.random() * 0.2,
      lights_on: isDaytime,
      data_source: 'tagoio',
    });
  }
  
  // Pod Beta-1: Offline for last 30 min, but has historical data
  for (let i = 6; i < 288; i++) { // Skip last 6 readings (30 min)
    const timestamp = new Date(now - i * interval);
    const hour = timestamp.getHours();
    const isDaytime = hour >= 6 && hour < 18;
    
    readings.push({
      pod_id: SEED_PODS[2].id,
      timestamp: timestamp.toISOString(),
      temperature_c: isDaytime 
        ? 22 + Math.random() * 2 // Veg temps
        : 19 + Math.random() * 2,
      humidity_pct: isDaytime
        ? 60 + Math.random() * 5 // Higher humidity for veg
        : 70 + Math.random() * 5,
      co2_ppm: Math.round(isDaytime
        ? 800 + Math.random() * 200
        : 400 + Math.random() * 100),
      light_intensity_pct: isDaytime ? Math.round(60 + Math.random() * 15) : 0,
      vpd_kpa: isDaytime ? 0.8 + Math.random() * 0.2 : 0.6 + Math.random() * 0.15,
      lights_on: isDaytime,
      data_source: 'tagoio',
    });
  }
  
  return readings;
}

// Export generated readings
export const SEED_TELEMETRY_READINGS = generateTelemetryReadings();
