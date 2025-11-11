/**
 * TagoIO Data Transformer
 * 
 * Transforms TagoIO API responses into Trazo telemetry schema format.
 * Handles unit conversions, data grouping, and metadata extraction.
 * 
 * @see TAGOIO_API_ANALYSIS.md for mapping documentation
 */

import type { TagoIODataPoint } from './client'
import type { InsertTelemetryReading } from '@/types/telemetry'
import type {
  EquipmentControl,
  EquipmentControlMap,
  AutoConfiguration,
} from '@/types/equipment'
import {
  EquipmentType,
  EquipmentState,
  ControlMode,
} from '@/types/equipment'

// ============================================================================
// Types
// ============================================================================

/**
 * Grouped data points by timestamp
 */
export interface GroupedTagoIOData {
  timestamp: string
  variables: Record<string, TagoIODataPoint>
  deviceId: string
}

/**
 * Transformation result with success/error tracking
 */
export interface TransformationResult {
  successful: InsertTelemetryReading[]
  errors: Array<{
    timestamp: string
    error: string
    data: GroupedTagoIOData
  }>
}

// ============================================================================
// Unit Conversion Functions
// ============================================================================

/**
 * Convert Fahrenheit to Celsius
 * 
 * @param fahrenheit - Temperature in °F
 * @returns Temperature in °C
 * 
 * @example
 * fahrenheitToCelsius(76) // Returns 24.444...
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * (5 / 9)
}

/**
 * Validate and sanitize sensor value
 * 
 * @param value - Value to validate
 * @param min - Minimum valid value
 * @param max - Maximum valid value
 * @returns Validated number or null if invalid
 */
function validateSensorValue(
  value: unknown,
  min: number,
  max: number
): number | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return null
  }
  if (value < min || value > max) {
    console.warn(`Sensor value ${value} outside valid range [${min}, ${max}]`)
    return null
  }
  return value
}

// ============================================================================
// Data Extraction Functions
// ============================================================================

/**
 * Extract temperature in Celsius from TagoIO data
 * 
 * @param tempPoint - Temperature data point from TagoIO
 * @returns Temperature in °C or null if invalid
 */
function extractTemperature(
  tempPoint: TagoIODataPoint | undefined
): number | null {
  if (!tempPoint || tempPoint.variable !== 'temp') return null

  const fahrenheit = validateSensorValue(tempPoint.value, -40, 150)
  if (fahrenheit === null) return null

  const celsius = fahrenheitToCelsius(fahrenheit)
  return Math.round(celsius * 100) / 100 // Round to 2 decimals
}

/**
 * Extract humidity percentage from TagoIO data
 * 
 * @param humPoint - Humidity data point from TagoIO
 * @returns Humidity percentage or null if invalid
 */
function extractHumidity(
  humPoint: TagoIODataPoint | undefined
): number | null {
  if (!humPoint || humPoint.variable !== 'hum') return null

  return validateSensorValue(humPoint.value, 0, 100)
}

/**
 * Extract CO2 concentration from TagoIO data
 * 
 * @param co2Point - CO2 data point from TagoIO
 * @returns CO2 in ppm or null if invalid
 */
function extractCO2(co2Point: TagoIODataPoint | undefined): number | null {
  if (!co2Point || co2Point.variable !== 'co2') return null

  return validateSensorValue(co2Point.value, 0, 5000)
}

/**
 * Extract VPD (Vapor Pressure Deficit) from temperature metadata
 * 
 * @param tempPoint - Temperature data point with VPD in metadata
 * @returns VPD in kPa or null if not available
 */
function extractVPD(tempPoint: TagoIODataPoint | undefined): number | null {
  if (!tempPoint || tempPoint.variable !== 'temp') return null

  const vpd = tempPoint.metadata?.vpd
  if (typeof vpd !== 'number' || isNaN(vpd)) return null

  // VPD should be between 0 and 5 kPa for cultivation
  return validateSensorValue(vpd, 0, 5)
}

/**
 * Extract light level from light_state metadata
 * 
 * NOTE: TagoIO provides light on/off state and level (0-100), not PAR/PPFD.
 * This extracts the level percentage, but light_level_umol will be null.
 * 
 * @param lightPoint - Light state data point from TagoIO
 * @returns Light level percentage or null if off/invalid
 */
function extractLightLevel(
  lightPoint: TagoIODataPoint | undefined
): number | null {
  if (!lightPoint || lightPoint.variable !== 'light_state') return null

  // Light is off
  if (lightPoint.value === 0 || lightPoint.value === '0') return 0

  // Extract level from metadata
  const level = lightPoint.metadata?.level
  if (typeof level !== 'number' || isNaN(level)) return null

  return validateSensorValue(level, 0, 100)
}

// ============================================================================
// Equipment/Actuator Status Extraction Functions
// ============================================================================

/**
 * Extract boolean equipment status from TagoIO data point
 * 
 * @param point - Equipment status data point from TagoIO
 * @param expectedVariable - Expected variable name
 * @returns true if active/on (value = 1), false if inactive/off (value = 0), null if missing
 */
function extractEquipmentStatus(
  point: TagoIODataPoint | undefined,
  expectedVariable: string
): boolean | null {
  if (!point || point.variable !== expectedVariable) return null
  
  // TagoIO sends 1 for active/on, 0 for inactive/off
  if (point.value === 1 || point.value === '1') return true
  if (point.value === 0 || point.value === '0') return false
  
  return null
}

/**
 * Extract lighting status (on/off)
 */
function extractLightsOn(lightPoint: TagoIODataPoint | undefined): boolean | null {
  return extractEquipmentStatus(lightPoint, 'light_state')
}

/**
 * Extract CO2 injection status
 */
function extractCO2Injection(co2ValvePoint: TagoIODataPoint | undefined): boolean | null {
  return extractEquipmentStatus(co2ValvePoint, 'co2_valve')
}

/**
 * Extract cooling status
 */
function extractCooling(coolingPoint: TagoIODataPoint | undefined): boolean | null {
  return extractEquipmentStatus(coolingPoint, 'cooling_valve')
}

/**
 * Extract exhaust fan status
 */
function extractExhaustFan(exFanPoint: TagoIODataPoint | undefined): boolean | null {
  return extractEquipmentStatus(exFanPoint, 'ex_fan')
}

/**
 * Extract dehumidifier status
 */
function extractDehumidifier(dehumPoint: TagoIODataPoint | undefined): boolean | null {
  return extractEquipmentStatus(dehumPoint, 'dehum')
}

// ============================================================================
// Enhanced Equipment Control Extraction (AUTO Mode Support)
// ============================================================================

/**
 * TagoIO equipment metadata structure
 * 
 * Expected metadata fields from TagoIO devices:
 * - mode: 0 (MANUAL) or 1 (AUTOMATIC)
 * - schedule: 0 (disabled) or 1 (enabled)
 * - ov: 0 (no override) or 1 (override active)
 * - level: 0-100 (power/intensity percentage)
 * - Additional fields for AUTO configuration (thresholds, schedules, etc.)
 */
interface TagoIOEquipmentMetadata {
  mode?: number
  schedule?: number
  ov?: number
  level?: number
  temp_min?: number
  temp_max?: number
  hum_min?: number
  hum_max?: number
  co2_min?: number
  co2_max?: number
  on_time?: string
  off_time?: string
  [key: string]: unknown
}

/**
 * Map TagoIO variable names to EquipmentType
 */
const TAGOIO_VARIABLE_TO_EQUIPMENT_TYPE: Record<string, EquipmentType> = {
  cooling_valve: EquipmentType.COOLING,
  heating_valve: EquipmentType.HEATING,
  dehum: EquipmentType.DEHUMIDIFIER,
  humid: EquipmentType.HUMIDIFIER,
  co2_valve: EquipmentType.CO2_INJECTION,
  ex_fan: EquipmentType.EXHAUST_FAN,
  circ_fan: EquipmentType.CIRCULATION_FAN,
  irrigation: EquipmentType.IRRIGATION,
  light_state: EquipmentType.LIGHTING,
  fogger: EquipmentType.FOGGER,
  hepa: EquipmentType.HEPA_FILTER,
  uv: EquipmentType.UV_STERILIZATION,
}

/**
 * Extract enhanced equipment control from TagoIO data point
 * 
 * Extracts state (OFF/ON/AUTO), mode (MANUAL/AUTOMATIC), override flag,
 * schedule flag, and power level from TagoIO metadata.
 * 
 * @param point - Equipment data point from TagoIO
 * @returns EquipmentControl object with full metadata or null if invalid
 */
function extractEquipmentControl(
  point: TagoIODataPoint | undefined
): EquipmentControl | null {
  if (!point) {
    return null
  }

  const metadata = (point.metadata || {}) as TagoIOEquipmentMetadata
  const value = point.value

  // Determine equipment state and mode from TagoIO metadata
  // TagoIO uses:
  // - value: 0=OFF, 1=ON
  // - ov (override): 0=manual OFF, 1=manual ON, 2=AUTO mode
  // - mode: 0=AUTO, 1=MANUAL (inverted from our schema!)
  
  let state: EquipmentState
  let mode: ControlMode
  let override = false

  // Check ov (override) field to determine control mode
  if (metadata.ov === 2) {
    // ov=2 means AUTO mode is active
    state = EquipmentState.AUTO
    mode = ControlMode.AUTOMATIC
    override = false
  } else if (metadata.ov === 1) {
    // ov=1 means manual override ON
    state = EquipmentState.ON
    mode = ControlMode.MANUAL
    override = true
  } else {
    // ov=0 means manual override OFF
    state = value === 1 ? EquipmentState.ON : EquipmentState.OFF
    mode = ControlMode.MANUAL
    override = false
  }

  // Extract schedule enabled flag
  const scheduleEnabled = metadata.schedule === 1

  // Extract power level (default to 100 if not specified)
  const level = typeof metadata.level === 'number'
    ? Math.max(0, Math.min(100, metadata.level))
    : 100

  // Build AUTO configuration from metadata
  let autoConfig: AutoConfiguration | undefined

  if (mode === ControlMode.AUTOMATIC) {
    autoConfig = {}
    
    // Temperature thresholds
    if (metadata.temp_min !== undefined || metadata.temp_max !== undefined) {
      autoConfig.temp_threshold = {
        min: metadata.temp_min ?? 20,
        max: metadata.temp_max ?? 26,
      }
    }
    
    // Humidity thresholds
    if (metadata.hum_min !== undefined || metadata.hum_max !== undefined) {
      autoConfig.humidity_threshold = {
        min: metadata.hum_min ?? 40,
        max: metadata.hum_max ?? 70,
      }
    }
    
    // CO2 thresholds
    if (metadata.co2_min !== undefined || metadata.co2_max !== undefined) {
      autoConfig.co2_threshold = {
        min: metadata.co2_min ?? 800,
        max: metadata.co2_max ?? 1200,
      }
    }
    
    // Schedule
    if (scheduleEnabled && metadata.on_time && metadata.off_time) {
      autoConfig.schedule = {
        on_time: metadata.on_time,
        off_time: metadata.off_time,
      }
    }
  }

  return {
    state,
    mode,
    override,
    schedule_enabled: scheduleEnabled,
    level,
    last_updated: new Date(point.time),
    auto_config: autoConfig,
  }
}

/**
 * Extract all equipment controls from grouped TagoIO data
 * 
 * @param variables - Grouped variables from TagoIO
 * @returns Map of equipment types to their control states
 */
function extractEquipmentControls(
  variables: Record<string, TagoIODataPoint>
): EquipmentControlMap {
  const controls: EquipmentControlMap = {}

  // Map TagoIO variables to equipment controls
  for (const [varName, point] of Object.entries(variables)) {
    const equipmentType = TAGOIO_VARIABLE_TO_EQUIPMENT_TYPE[varName]
    if (equipmentType) {
      const control = extractEquipmentControl(point)
      if (control) {
        controls[equipmentType] = control
      }
    }
  }

  return controls
}

/**
 * Convert EquipmentControlMap to boolean equipment states (backward compatibility)
 * 
 * Only returns boolean fields that exist in the telemetry_readings table schema.
 * Additional equipment states are stored in equipment_states JSONB field.
 * 
 * @param controls - Equipment control map
 * @returns Object with boolean equipment states (only columns that exist in DB)
 */
function equipmentControlsToBoolean(controls: EquipmentControlMap) {
  return {
    // Core equipment (columns exist in telemetry_readings)
    cooling_active: controls.cooling?.state === 1 || controls.cooling?.state === 2,
    heating_active: controls.heating?.state === 1 || controls.heating?.state === 2,
    dehumidifier_active: controls.dehumidifier?.state === 1 || controls.dehumidifier?.state === 2,
    humidifier_active: controls.humidifier?.state === 1 || controls.humidifier?.state === 2,
    co2_injection_active: controls.co2_injection?.state === 1 || controls.co2_injection?.state === 2,
    exhaust_fan_active: controls.exhaust_fan?.state === 1 || controls.exhaust_fan?.state === 2,
    circulation_fan_active: controls.circulation_fan?.state === 1 || controls.circulation_fan?.state === 2,
    lights_on: controls.lighting?.state === 1 || controls.lighting?.state === 2,
    // Note: irrigation, fogger, hepa_filter, uv_sterilization are stored in equipment_states JSONB only
  }
}

// ============================================================================
// Data Grouping Functions
// ============================================================================

/**
 * Groups TagoIO data points by timestamp (rounded to 30-second intervals)
 * 
 * TagoIO returns each variable as a separate record with different timestamps.
 * Equipment variables arrive ~10 seconds before sensor variables.
 * This function groups them by 30-second intervals to capture both in one reading.
 * 
 * @param dataPoints - Array of TagoIO data points
 * @returns Array of grouped data by timestamp (30-second interval precision)
 * 
 * @example
 * const grouped = groupDataByTimestamp(dataPoints)
 * // grouped[0].variables = { temp: {...}, hum: {...}, co2: {...}, light_state: {...} }
 * // Variables at 01:05:22 and 01:05:32 → both grouped into 01:05:30 bucket
 */
export function groupDataByTimestamp(
  dataPoints: TagoIODataPoint[]
): GroupedTagoIOData[] {
  const grouped = new Map<string, GroupedTagoIOData>()

  for (const point of dataPoints) {
    // Round timestamp to the nearest 30-second interval to group sensor + equipment data
    // Equipment variables arrive ~10 seconds before sensor variables, so we need a wider window
    const timestamp = new Date(point.time)
    const seconds = timestamp.getSeconds()
    const roundedSeconds = seconds < 30 ? 0 : 30
    const roundedTimestamp = new Date(
      timestamp.getFullYear(), 
      timestamp.getMonth(), 
      timestamp.getDate(), 
      timestamp.getHours(), 
      timestamp.getMinutes(), 
      roundedSeconds
    )
    const key = roundedTimestamp.toISOString()

    if (!grouped.has(key)) {
      grouped.set(key, {
        timestamp: key,
        variables: {},
        deviceId: point.device,
      })
    }

    const group = grouped.get(key)!
    // If the variable already exists, keep the most recent one (later in the loop)
    group.variables[point.variable] = point
  }

  return Array.from(grouped.values())
}

/**
 * Filter out groups that don't have any meaningful data
 * 
 * Since we're grouping by 30-second intervals, groups should have combined sensor + equipment data.
 * Only filter out completely empty groups.
 * 
 * @param groups - Array of grouped data
 * @returns Filtered array with at least one data point
 */
export function filterIncompleteGroups(
  groups: GroupedTagoIOData[]
): GroupedTagoIOData[] {
  return groups.filter((group) => {
    // Keep any group that has at least one variable
    return Object.keys(group.variables).length > 0
  })
}

// ============================================================================
// Main Transformation Function
// ============================================================================

/**
 * Transform grouped TagoIO data to Trazo telemetry reading
 * 
 * @param group - Grouped TagoIO data for a single timestamp
 * @param podId - Trazo pod ID to associate the reading with
 * @returns Telemetry reading for database insertion
 */
function transformGroupToReading(
  group: GroupedTagoIOData,
  podId: string
): InsertTelemetryReading {
  const { timestamp, variables } = group

  // Extract core sensor values
  const temperature_c = extractTemperature(variables.temp)
  const humidity_pct = extractHumidity(variables.hum)
  const co2_ppm = extractCO2(variables.co2)
  const vpd_kpa = extractVPD(variables.temp)

  // Extract light level (percentage)
  const light_intensity_pct = extractLightLevel(variables.light_state)

  // Extract equipment/actuator status (legacy boolean fields - maintain backward compatibility)
  const lights_on = extractLightsOn(variables.light_state)
  const co2_injection_active = extractCO2Injection(variables.co2_valve)
  const cooling_active = extractCooling(variables.cooling_valve)
  const exhaust_fan_active = extractExhaustFan(variables.ex_fan)
  const dehumidifier_active = extractDehumidifier(variables.dehum)

  // Extract enhanced equipment controls (AUTO mode support)
  const equipment_controls = extractEquipmentControls(variables)
  
  // Convert equipment controls to boolean states for backward compatibility
  const equipmentBooleans = equipmentControlsToBoolean(equipment_controls)

  // Build raw_data object for debugging/auditing
  const raw_data = {
    source: 'tagoio',
    device_id: group.deviceId,
    timestamp: timestamp,
    variables: Object.keys(variables).reduce(
      (acc, key) => {
        const point = variables[key]
        acc[key] = {
          value: point.value,
          unit: point.unit,
          metadata: point.metadata,
        }
        return acc
      },
      {} as Record<string, unknown>
    ),
  }

  // Serialize equipment_controls for JSONB storage
  const equipment_states = Object.keys(equipment_controls).length > 0 
    ? equipment_controls 
    : undefined

  return {
    pod_id: podId,
    timestamp,
    temperature_c,
    humidity_pct,
    co2_ppm,
    vpd_kpa,
    light_intensity_pct,
    // Legacy boolean fields (use enhanced values if available, fallback to legacy extraction)
    // Only include columns that exist in telemetry_readings schema
    lights_on: equipmentBooleans.lights_on ?? lights_on,
    co2_injection_active: equipmentBooleans.co2_injection_active ?? co2_injection_active,
    cooling_active: equipmentBooleans.cooling_active ?? cooling_active,
    exhaust_fan_active: equipmentBooleans.exhaust_fan_active ?? exhaust_fan_active,
    dehumidifier_active: equipmentBooleans.dehumidifier_active ?? dehumidifier_active,
    humidifier_active: equipmentBooleans.humidifier_active,
    circulation_fan_active: equipmentBooleans.circulation_fan_active,
    heating_active: equipmentBooleans.heating_active,
    // Equipment states JSONB field stores all equipment data including irrigation, fogger, hepa, uv
    data_source: 'tagoio',
    raw_data,
    equipment_states: equipment_states as Record<string, unknown> | undefined,
  }
}

/**
 * Transform array of TagoIO data points to Trazo telemetry readings
 * 
 * This is the main entry point for transforming TagoIO data.
 * 
 * @param dataPoints - Array of TagoIO data points
 * @param podId - Trazo pod ID to associate readings with
 * @returns Transformation result with successful readings and errors
 * 
 * @example
 * const client = createTagoIOClient(token)
 * const data = await client.fetchLatestData({ qty: 100 })
 * const result = transformTagoIOData(data, 'pod-uuid')
 * 
 * if (result.errors.length > 0) {
 *   console.error('Transformation errors:', result.errors)
 * }
 * 
 * await batchInsertReadings(result.successful)
 */
export function transformTagoIOData(
  dataPoints: TagoIODataPoint[],
  podId: string
): TransformationResult {
  const result: TransformationResult = {
    successful: [],
    errors: [],
  }

  if (dataPoints.length === 0) {
    return result
  }

  // Group data by timestamp
  const groups = groupDataByTimestamp(dataPoints)

  // Filter out incomplete groups
  const completeGroups = filterIncompleteGroups(groups)

  if (completeGroups.length === 0) {
    console.warn(
      `No complete sensor data found in ${dataPoints.length} data points`
    )
    return result
  }

  // Transform each group
  for (const group of completeGroups) {
    try {
      const reading = transformGroupToReading(group, podId)

      // Since we're grouping by second, most readings should have data
      // Only validate that at least something is present
      const hasAnyData = reading.temperature_c !== null || reading.humidity_pct !== null || 
                        reading.co2_ppm !== null || reading.lights_on !== null || 
                        reading.co2_injection_active !== null || reading.cooling_active !== null || 
                        reading.exhaust_fan_active !== null || reading.dehumidifier_active !== null
      
      if (!hasAnyData) {
        result.errors.push({
          timestamp: group.timestamp,
          error: 'No valid data after transformation',
          data: group,
        })
        continue
      }

      result.successful.push(reading)
    } catch (error) {
      result.errors.push({
        timestamp: group.timestamp,
        error: error instanceof Error ? error.message : String(error),
        data: group,
      })
    }
  }

  return result
}

// ============================================================================
// Batch Processing Utilities
// ============================================================================

/**
 * Transform TagoIO data from multiple devices
 * 
 * @param deviceData - Map of pod ID to TagoIO data points
 * @returns Combined transformation result
 * 
 * @example
 * const deviceData = new Map([
 *   ['pod-1', tagoData1],
 *   ['pod-2', tagoData2],
 * ])
 * const result = transformMultipleDevices(deviceData)
 */
export function transformMultipleDevices(
  deviceData: Map<string, TagoIODataPoint[]>
): TransformationResult {
  const combined: TransformationResult = {
    successful: [],
    errors: [],
  }

  for (const [podId, dataPoints] of deviceData.entries()) {
    const result = transformTagoIOData(dataPoints, podId)
    combined.successful.push(...result.successful)
    combined.errors.push(...result.errors)
  }

  return combined
}

/**
 * Deduplicate readings by timestamp and pod_id
 * 
 * If multiple readings exist for the same pod at the same timestamp,
 * keeps the most recent one (by insertion order).
 * 
 * @param readings - Array of telemetry readings
 * @returns Deduplicated array
 */
export function deduplicateReadings(
  readings: InsertTelemetryReading[]
): InsertTelemetryReading[] {
  const seen = new Map<string, InsertTelemetryReading>()

  for (const reading of readings) {
    const key = `${reading.pod_id}:${reading.timestamp}`
    seen.set(key, reading) // Later entries overwrite earlier ones
  }

  return Array.from(seen.values())
}

/**
 * Sort readings by timestamp (oldest first)
 * 
 * @param readings - Array of telemetry readings
 * @returns Sorted array
 */
export function sortReadingsByTimestamp(
  readings: InsertTelemetryReading[]
): InsertTelemetryReading[] {
  return readings.sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return aTime - bTime
  })
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate a telemetry reading for basic completeness
 * 
 * @param reading - Telemetry reading to validate
 * @returns True if valid, false otherwise
 */
export function isValidReading(reading: InsertTelemetryReading): boolean {
  // Must have pod_id and timestamp
  if (!reading.pod_id || !reading.timestamp) {
    return false
  }

  // Must have at least one sensor value
  if (
    reading.temperature_c === null &&
    reading.humidity_pct === null &&
    reading.co2_ppm === null &&
    reading.vpd_kpa === null
  ) {
    return false
  }

  return true
}

/**
 * Filter out invalid readings
 * 
 * @param readings - Array of telemetry readings
 * @returns Filtered array of valid readings
 */
export function filterValidReadings(
  readings: InsertTelemetryReading[]
): InsertTelemetryReading[] {
  return readings.filter(isValidReading)
}

// ============================================================================
// Statistics Utilities
// ============================================================================

/**
 * Calculate transformation statistics
 * 
 * @param result - Transformation result
 * @returns Statistics object
 */
export function calculateTransformStats(result: TransformationResult) {
  const total = result.successful.length + result.errors.length

  return {
    total,
    successful: result.successful.length,
    errors: result.errors.length,
    successRate: total > 0 ? (result.successful.length / total) * 100 : 0,
    errorsByType: result.errors.reduce(
      (acc, err) => {
        acc[err.error] = (acc[err.error] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
  }
}
