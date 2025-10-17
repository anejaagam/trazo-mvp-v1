// Mock data generation for MVP simulation
import type { Site, Room, Pod, PodSnapshot, OverlayEvent, ChartDataPoint, Alarm, Notification, AlarmSeverity, AlarmStatus } from '../types/telemetry';
import { calculateVPD, getSpecStatus } from './telemetry';

export const mockSites: Site[] = [
  { id: 'site-1', name: 'Denver Facility', timezone: 'America/Denver' },
  { id: 'site-2', name: 'Oakland Facility', timezone: 'America/Los_Angeles' },
];

export const mockRooms: Room[] = [
  { id: 'room-1', site_id: 'site-1', name: 'Flower Room A', stage: 'Flower Week 4', tz: 'America/Denver' },
  { id: 'room-2', site_id: 'site-1', name: 'Veg Room B', stage: 'Vegetative', tz: 'America/Denver' },
  { id: 'room-3', site_id: 'site-1', name: 'Clone Room C', stage: 'Propagation', tz: 'America/Denver' },
  { id: 'room-4', site_id: 'site-2', name: 'Flower Room D', stage: 'Flower Week 6', tz: 'America/Los_Angeles' },
];

export const mockPods: Pod[] = [
  { id: 'pod-1', room_id: 'room-1', name: 'Pod A1' },
  { id: 'pod-2', room_id: 'room-1', name: 'Pod A2' },
  { id: 'pod-3', room_id: 'room-1', name: 'Pod A3' },
  { id: 'pod-4', room_id: 'room-2', name: 'Pod B1' },
  { id: 'pod-5', room_id: 'room-2', name: 'Pod B2' },
  { id: 'pod-6', room_id: 'room-3', name: 'Pod C1' },
  { id: 'pod-7', room_id: 'room-4', name: 'Pod D1' },
  { id: 'pod-8', room_id: 'room-4', name: 'Pod D2' },
];

// Stage-specific setpoints
const stageSetpoints: Record<string, { temp: number; rh: number; co2: number; light: number }> = {
  'Propagation': { temp: 24, rh: 75, co2: 800, light: 40 },
  'Vegetative': { temp: 26, rh: 65, co2: 1200, light: 80 },
  'Flower Week 4': { temp: 24, rh: 55, co2: 1400, light: 100 },
  'Flower Week 6': { temp: 23, rh: 45, co2: 1400, light: 100 },
};

// Tolerances for spec checking
const tolerances = {
  temp: 2.0, // ±2°C
  rh: 5.0,   // ±5%
  co2: 150,  // ±150ppm
};

// Cache for smoother value transitions
let cachedValues: Record<string, number> = {};
let lastUpdateTime: Record<string, number> = {};

/**
 * Generate realistic mock telemetry reading with some variance and smoothing
 */
function generateReading(key: string, setpoint: number, variance: number, drift: number = 0): number {
  const now = Date.now();
  const timeSinceLastUpdate = lastUpdateTime[key] ? now - lastUpdateTime[key] : 0;
  
  // Only update values every 10 seconds to match refresh rate
  if (timeSinceLastUpdate < 10000 && cachedValues[key] !== undefined) {
    return cachedValues[key];
  }
  
  // Use smaller noise for more stable readings
  const noise = (Math.random() - 0.5) * variance * 0.25; // Reduced to 25% of original variance
  const targetValue = setpoint + noise + drift;
  
  // If we have a cached value, smooth the transition
  if (cachedValues[key] !== undefined) {
    // Move only 15% of the way toward the target value (smoothing factor)
    const smoothedValue = cachedValues[key] + (targetValue - cachedValues[key]) * 0.15;
    cachedValues[key] = Number(smoothedValue.toFixed(1));
  } else {
    // First time, just set the value
    cachedValues[key] = Number(targetValue.toFixed(1));
  }
  
  lastUpdateTime[key] = now;
  return cachedValues[key];
}

/**
 * Generate mock pod snapshot with realistic data
 */
export function generatePodSnapshot(pod: Pod, room: Room, driftFactor: number = 0): PodSnapshot {
  const setpoints = stageSetpoints[room.stage] || stageSetpoints['Vegetative'];
  
  // Simulate some pods with drift
  const tempDrift = driftFactor * 1.5;
  const rhDrift = driftFactor * 8;
  const co2Drift = driftFactor * 200;
  
  const temp = generateReading(`${pod.id}-temp`, setpoints.temp, 0.5, tempDrift);
  const rh = generateReading(`${pod.id}-rh`, setpoints.rh, 2, rhDrift);
  const co2 = generateReading(`${pod.id}-co2`, setpoints.co2, 50, co2Drift);
  const light = generateReading(`${pod.id}-light`, setpoints.light, 2, 0);
  
  const vpd = calculateVPD(temp, rh);
  
  // Determine health status
  const tempStatus = getSpecStatus(temp, setpoints.temp, tolerances.temp);
  const rhStatus = getSpecStatus(rh, setpoints.rh, tolerances.rh);
  const co2Status = getSpecStatus(co2, setpoints.co2, tolerances.co2);
  
  // Random device states
  const now = new Date();
  // Use fixed last update to prevent constant re-renders
  const lastUpdate = new Date(Math.floor(now.getTime() / 10000) * 10000); // Round to nearest 10 seconds
  
  return {
    pod,
    room,
    last_update: lastUpdate,
    temp: {
      value: temp,
      health: tempStatus === 'out-of-spec' ? 'Faulted' : (Math.random() > 0.95 ? 'CalDue' : 'Healthy'),
      unit: '°C',
    },
    rh: {
      value: rh,
      health: rhStatus === 'out-of-spec' ? 'Faulted' : 'Healthy',
      unit: '%',
    },
    co2: {
      value: co2,
      health: co2Status === 'out-of-spec' ? 'Faulted' : 'Healthy',
      unit: 'ppm',
    },
    light: {
      value: light,
      health: 'Healthy',
      unit: '%',
    },
    vpd: {
      value: vpd,
      health: temp < 0 || rh < 0 ? 'Faulted' : 'Healthy',
      unit: 'kPa',
    },
    devices: {
      fan: temp > setpoints.temp - 1,
      cooling: temp > setpoints.temp + 1,
      dehum: rh > setpoints.rh + 3,
      co2_enable: co2 < setpoints.co2 + 50,
    },
    setpoints,
    drift: {
      temp: temp - setpoints.temp,
      rh: rh - setpoints.rh,
      co2: co2 - setpoints.co2,
    },
    alarm_count_24h: Math.abs(driftFactor) > 1 ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 2),
  };
}

/**
 * Generate historical chart data
 */
export function generateChartData(
  pod: Pod,
  room: Room,
  hours: number = 24
): { data: ChartDataPoint[]; events: OverlayEvent[] } {
  const setpoints = stageSetpoints[room.stage] || stageSetpoints['Vegetative'];
  const data: ChartDataPoint[] = [];
  const events: OverlayEvent[] = [];
  
  const now = new Date();
  const interval = 5 * 60 * 1000; // 5 minutes
  const points = Math.floor((hours * 60 * 60 * 1000) / interval);
  
  // Generate setpoint change event
  if (hours >= 12) {
    events.push({
      id: `evt-${pod.id}-1`,
      type: 'setpoint_change',
      ts_utc: new Date(now.getTime() - (hours * 0.6 * 60 * 60 * 1000)),
      room_id: room.id,
      pod_id: pod.id,
      attrs: { parameter: 'temperature', old: setpoints.temp - 1, new: setpoints.temp },
    });
  }
  
  // Generate alarm event if there's drift
  if (Math.random() > 0.7) {
    events.push({
      id: `evt-${pod.id}-alarm`,
      type: 'alarm_event',
      ts_utc: new Date(now.getTime() - (hours * 0.3 * 60 * 60 * 1000)),
      room_id: room.id,
      pod_id: pod.id,
      attrs: { severity: 'warning', message: 'RH approaching upper bound' },
    });
  }
  
  // Generate irrigation cycle
  if (room.stage.includes('Flower')) {
    events.push({
      id: `evt-${pod.id}-irr1`,
      type: 'irrigation_cycle',
      ts_utc: new Date(now.getTime() - (hours * 0.8 * 60 * 60 * 1000)),
      room_id: room.id,
      pod_id: pod.id,
      attrs: { zone: 'A', duration_min: 12, volume_L: 45 },
    });
    
    events.push({
      id: `evt-${pod.id}-irr2`,
      type: 'irrigation_cycle',
      ts_utc: new Date(now.getTime() - (hours * 0.2 * 60 * 60 * 1000)),
      room_id: room.id,
      pod_id: pod.id,
      attrs: { zone: 'A', duration_min: 10, volume_L: 42 },
    });
  }
  
  // Generate time series with gradual drift
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(now.getTime() - (points - i) * interval);
    const driftAmount = Math.sin((i / points) * Math.PI) * 0.5; // Gentle sine wave drift
    
    // Use unique keys for chart smoothing
    const pointKey = `chart-${pod.id}-${i}`;
    
    const temp = generateReading(`${pointKey}-temp`, setpoints.temp, 0.3, driftAmount);
    const rh = generateReading(`${pointKey}-rh`, setpoints.rh, 1.5, driftAmount * 3);
    const co2 = generateReading(`${pointKey}-co2`, setpoints.co2, 40, driftAmount * 100);
    const light = generateReading(`${pointKey}-light`, setpoints.light, 1.5, 0);
    const vpd = calculateVPD(temp, rh);
    
    data.push({
      timestamp,
      temp,
      rh,
      co2,
      light,
      vpd,
      setpoint_temp: setpoints.temp,
      setpoint_rh: setpoints.rh,
      setpoint_co2: setpoints.co2,
      setpoint_light: setpoints.light,
    });
  }
  
  return { data, events };
}

/**
 * Get all pod snapshots for a site
 */
export function getAllPodSnapshots(siteId: string): PodSnapshot[] {
  const siteRooms = mockRooms.filter(r => r.site_id === siteId);
  const snapshots: PodSnapshot[] = [];
  
  siteRooms.forEach(room => {
    const roomPods = mockPods.filter(p => p.room_id === room.id);
    roomPods.forEach((pod, idx) => {
      // Introduce drift in some pods
      const driftFactor = idx % 3 === 0 ? Math.random() * 2 - 1 : 0;
      snapshots.push(generatePodSnapshot(pod, room, driftFactor));
    });
  });
  
  return snapshots;
}

/**
 * Generate mock alarms for a site
 */
export function generateMockAlarms(siteId: string): Alarm[] {
  const siteRooms = mockRooms.filter(r => r.site_id === siteId);
  const alarms: Alarm[] = [];
  const now = new Date();
  
  siteRooms.forEach(room => {
    const roomPods = mockPods.filter(p => p.room_id === room.id);
    
    roomPods.forEach((pod, idx) => {
      // Generate some alarms based on index
      if (idx % 3 === 0) {
        // Temperature high alarm
        alarms.push({
          id: `alarm-${pod.id}-temp`,
          pod_id: pod.id,
          pod_name: pod.name,
          room_id: room.id,
          room_name: room.name,
          severity: 'warning',
          status: 'active',
          category: 'environmental',
          title: 'Temperature Approaching Upper Limit',
          message: 'Temperature is 1.8°C above setpoint and approaching tolerance threshold',
          parameter: 'Temperature',
          value: 25.8,
          setpoint: 24.0,
          threshold: 26.0,
          triggered_at: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
        });
      }
      
      if (idx % 4 === 0) {
        // RH out of range alarm
        alarms.push({
          id: `alarm-${pod.id}-rh`,
          pod_id: pod.id,
          pod_name: pod.name,
          room_id: room.id,
          room_name: room.name,
          severity: 'critical',
          status: 'active',
          category: 'environmental',
          title: 'Humidity Out of Specification',
          message: 'Relative humidity has exceeded tolerance range for 8 minutes',
          parameter: 'Relative Humidity',
          value: 72.0,
          setpoint: 65.0,
          threshold: 70.0,
          triggered_at: new Date(now.getTime() - 8 * 60 * 1000), // 8 min ago
        });
      }
      
      if (idx % 5 === 0) {
        // Calibration due
        alarms.push({
          id: `alarm-${pod.id}-cal`,
          pod_id: pod.id,
          pod_name: pod.name,
          room_id: room.id,
          room_name: room.name,
          severity: 'info',
          status: 'acknowledged',
          category: 'calibration',
          title: 'Sensor Calibration Due',
          message: 'Temperature sensor calibration is due within 7 days',
          parameter: 'Temperature',
          triggered_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          acknowledged_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          acknowledged_by: 'operator-1',
        });
      }
      
      if (idx === 1) {
        // Equipment fault
        alarms.push({
          id: `alarm-${pod.id}-equip`,
          pod_id: pod.id,
          pod_name: pod.name,
          room_id: room.id,
          room_name: room.name,
          severity: 'critical',
          status: 'active',
          category: 'equipment',
          title: 'Dehumidifier Communication Lost',
          message: 'No response from dehumidifier for 120 seconds. Check physical connection.',
          triggered_at: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
        });
      }
    });
  });
  
  return alarms;
}

/**
 * Generate mock notifications
 */
export function generateMockNotifications(alarms: Alarm[]): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();
  
  // Create notifications from alarms
  alarms.forEach(alarm => {
    if (alarm.status === 'active') {
      notifications.push({
        id: `notif-${alarm.id}`,
        type: 'alarm',
        severity: alarm.severity,
        title: alarm.title,
        message: `${alarm.pod_name} - ${alarm.message}`,
        timestamp: alarm.triggered_at,
        read: false,
        alarm_id: alarm.id,
        pod_id: alarm.pod_id,
        room_id: alarm.room_id,
      });
    }
  });
  
  // Add some system notifications
  notifications.push({
    id: 'notif-system-1',
    type: 'system',
    severity: 'info',
    title: 'System Update Available',
    message: 'A new version of the monitoring system is available for installation',
    timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: true,
  });
  
  notifications.push({
    id: 'notif-export-1',
    type: 'export',
    severity: 'info',
    title: 'Export Complete',
    message: 'Your data export for Flower Room A (7 days) is ready for download',
    timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
    read: false,
  });
  
  notifications.push({
    id: 'notif-maint-1',
    type: 'maintenance',
    severity: 'warning',
    title: 'Scheduled Maintenance Reminder',
    message: 'HVAC filter replacement due in 3 days',
    timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
    read: false,
  });
  
  return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
