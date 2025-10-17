// Telemetry calculations and utilities

/**
 * Calculate VPD (Vapor Pressure Deficit) from temperature and relative humidity
 * @param tempC Temperature in Celsius
 * @param rhPercent Relative Humidity as percentage (0-100)
 * @returns VPD in kPa
 */
export function calculateVPD(tempC: number, rhPercent: number): number {
  // Saturation vapor pressure (SVP) using Tetens formula
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  
  // Actual vapor pressure
  const avp = (rhPercent / 100) * svp;
  
  // VPD = SVP - AVP
  const vpd = svp - avp;
  
  return Number(vpd.toFixed(2));
}

/**
 * Calculate dew point from temperature and relative humidity
 * @param tempC Temperature in Celsius
 * @param rhPercent Relative Humidity as percentage (0-100)
 * @returns Dew point in Celsius
 */
export function calculateDewPoint(tempC: number, rhPercent: number): number {
  const a = 17.27;
  const b = 237.7;
  
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(rhPercent / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  
  return Number(dewPoint.toFixed(1));
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(c: number): number {
  return Number((c * 9/5 + 32).toFixed(1));
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(f: number): number {
  return Number(((f - 32) * 5/9).toFixed(1));
}

/**
 * Format timestamp with timezone
 */
export function formatTimestamp(date: Date, timezone: string, use24h: boolean = true): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24h,
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Check if value is within spec based on setpoint and tolerance
 */
export function getSpecStatus(
  actual: number,
  setpoint: number,
  tolerance: number,
  warningThreshold: number = 0.8
): 'in-spec' | 'approaching' | 'out-of-spec' {
  const deviation = Math.abs(actual - setpoint);
  
  if (deviation > tolerance) {
    return 'out-of-spec';
  } else if (deviation > tolerance * warningThreshold) {
    return 'approaching';
  }
  
  return 'in-spec';
}

/**
 * Validate sensor reading is within physical bounds
 */
export function validateReading(type: string, value: number): boolean {
  const bounds: Record<string, [number, number]> = {
    Temp: [-10, 50], // Celsius
    RH: [0, 100],
    CO2: [0, 10000],
    LightPct: [0, 100],
  };
  
  const [min, max] = bounds[type] || [-Infinity, Infinity];
  return value >= min && value <= max;
}

/**
 * Generate export filename with timestamp
 */
export function generateExportFilename(
  roomName: string,
  startDate: Date,
  endDate: Date,
  format: 'csv' | 'pdf'
): string {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  
  return `${roomName}_${start}_to_${end}_${timestamp}.${format}`;
}

/**
 * Convert telemetry data to CSV format
 */
export function generateCSV(
  data: Array<{
    timestamp: Date;
    temp?: number;
    rh?: number;
    co2?: number;
    light?: number;
    vpd?: number;
    validity: string;
  }>,
  timezone: string
): string {
  const headers = ['Timestamp (Local)', 'Timestamp (UTC)', 'Temperature (°C)', 'RH (%)', 'CO2 (ppm)', 'Light (%)', 'VPD (kPa)', 'Validity'];
  
  const rows = data.map(row => [
    formatTimestamp(row.timestamp, timezone),
    row.timestamp.toISOString(),
    row.temp?.toFixed(1) ?? '',
    row.rh?.toFixed(1) ?? '',
    row.co2?.toFixed(0) ?? '',
    row.light?.toFixed(0) ?? '',
    row.vpd?.toFixed(2) ?? '',
    row.validity,
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}
