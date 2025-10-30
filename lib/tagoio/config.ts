/**
 * TagoIO Configuration
 * 
 * Device mappings and configuration for TagoIO integration
 * Device Token: ed51659f-6870-454f-8755-52815755c5bb
 */

/**
 * TagoIO API Configuration
 */
export const TAGOIO_CONFIG = {
  baseUrl: 'https://api.tago.io',
  // Device token will be stored in environment variable: TAGOIO_DEVICE_TOKEN
  // Value: ed51659f-6870-454f-8755-52815755c5bb
  pollingIntervalMs: 60000, // 60 seconds
  timeoutMs: 10000, // 10 seconds
  maxRetries: 3,
  retryDelayMs: 1000,
} as const;

/**
 * TagoIO variable name mappings
 * Maps TagoIO variable names to Trazo schema fields
 */
export const TAGOIO_VARIABLE_MAPPINGS = {
  // Environmental sensors
  temperature: 'temperature', // Adjust based on actual TagoIO variable names
  humidity: 'humidity',
  co2: 'co2',
  light: 'light_intensity',
  
  // Equipment states
  cooling: 'cooling',
  heating: 'heating',
  dehumidifier: 'dehumidifier',
  humidifier: 'humidifier',
  co2_injection: 'co2_enable',
  exhaust_fan: 'exhaust_fan',
  circulation_fan: 'circulation_fan',
  irrigation: 'irrigation',
  lighting: 'lights',
  
  // Sensor faults
  temp_fault: 'temp_sensor_fault',
  humidity_fault: 'humidity_sensor_fault',
  co2_fault: 'co2_sensor_fault',
  pressure_fault: 'pressure_sensor_fault',
} as const;

/**
 * Get TagoIO device token from environment
 * 
 * @throws Error if token is not configured
 */
export function getTagoIOToken(): string {
  const token = process.env.TAGOIO_DEVICE_TOKEN;
  
  if (!token) {
    throw new Error(
      'TAGOIO_DEVICE_TOKEN environment variable is not set. ' +
      'Please add it to your .env.local file.'
    );
  }
  
  return token;
}

/**
 * Validate TagoIO configuration
 */
export function validateTagoIOConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!process.env.TAGOIO_DEVICE_TOKEN) {
    errors.push('TAGOIO_DEVICE_TOKEN is not set');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
