/**
 * TagoIO Environmental Control Utilities
 * 
 * MOCK IMPLEMENTATION - Console logging only, no actual TagoIO commands sent.
 * 
 * TODO: Integrate with actual TagoIO API when ready for production.
 * Requirements for production integration:
 * - TagoIO device ID mapping for each pod/room
 * - TagoIO API authentication (token management)
 * - Command queue for reliable delivery
 * - Acknowledgment/confirmation handling
 * - Error handling and retry logic
 * - Rate limiting to respect TagoIO API limits
 */

import type {
  SetpointParameterType,
  EnvironmentalSetpoint,
  ControlOverride,
} from '@/types/recipe'

export interface ControlCommand {
  deviceId: string
  parameter: SetpointParameterType
  value: number
  unit: string
  priority: string
  timestamp: string
}

export interface ControlCommandResult {
  success: boolean
  commandId?: string
  error?: string
  message: string
}

/**
 * MOCK: Send control command to TagoIO device
 * 
 * @param deviceId - TagoIO device ID
 * @param parameter - Environmental parameter type
 * @param value - Target value
 * @param unit - Unit of measurement
 * @param priority - Command priority level
 * @returns Mock result with console logging
 */
export async function sendControlCommand(
  deviceId: string,
  parameter: SetpointParameterType,
  value: number,
  unit: string,
  priority: string = 'normal'
): Promise<ControlCommandResult> {
  const command: ControlCommand = {
    deviceId,
    parameter,
    value,
    unit,
    priority,
    timestamp: new Date().toISOString(),
  }

  // MOCK: Console log only - DO NOT send actual commands
  console.log('[MOCK] TagoIO Control Command:', {
    command,
    note: 'This is a mock implementation. No actual command sent to TagoIO.',
  })

  // Simulate successful command
  return {
    success: true,
    commandId: `mock-cmd-${Date.now()}`,
    message: `MOCK: Command logged for ${parameter} = ${value} ${unit}`,
  }
}

/**
 * MOCK: Apply setpoint to TagoIO device
 * 
 * @param deviceId - TagoIO device ID
 * @param setpoint - Environmental setpoint configuration
 * @param isDayPeriod - Whether currently in day period (for day/night values)
 * @returns Mock result
 */
export async function applySetpoint(
  deviceId: string,
  setpoint: EnvironmentalSetpoint,
  isDayPeriod: boolean = true
): Promise<ControlCommandResult> {
  if (!setpoint.enabled) {
    return {
      success: false,
      message: 'Setpoint is disabled',
    }
  }

  // Determine which value to use
  let targetValue: number | undefined
  if (setpoint.day_value !== null && setpoint.night_value !== null) {
    targetValue = isDayPeriod ? setpoint.day_value : setpoint.night_value
  } else {
    targetValue = setpoint.value ?? undefined
  }

  if (targetValue === undefined) {
    return {
      success: false,
      message: 'No valid target value found',
    }
  }

  // MOCK: Send command
  return sendControlCommand(
    deviceId,
    setpoint.parameter_type,
    targetValue,
    setpoint.unit,
    `recipe-${setpoint.priority}`
  )
}

/**
 * MOCK: Apply control override to TagoIO device
 * 
 * @param deviceId - TagoIO device ID
 * @param override - Control override configuration
 * @returns Mock result
 */
export async function applyOverride(
  deviceId: string,
  override: ControlOverride
): Promise<ControlCommandResult> {
  // MOCK: Send override command with high priority
  return sendControlCommand(
    deviceId,
    override.parameter_type,
    override.override_value,
    override.unit,
    `override-${override.priority}`
  )
}

/**
 * MOCK: Clear override and restore recipe setpoint
 * 
 * @param deviceId - TagoIO device ID
 * @param parameter - Parameter type to clear
 * @param recipeSetpoint - Recipe setpoint to restore to (optional)
 * @returns Mock result
 */
export async function clearOverride(
  deviceId: string,
  parameter: SetpointParameterType,
  recipeSetpoint?: EnvironmentalSetpoint
): Promise<ControlCommandResult> {
  if (recipeSetpoint) {
    // Restore to recipe setpoint
    return applySetpoint(deviceId, recipeSetpoint)
  }

  // MOCK: Clear command
  console.log('[MOCK] TagoIO Clear Override:', {
    deviceId,
    parameter,
    note: 'Override cleared. No recipe setpoint to restore.',
  })

  return {
    success: true,
    message: `MOCK: Override cleared for ${parameter}`,
  }
}

/**
 * MOCK: Apply ramp transition (gradual value change)
 * 
 * @param deviceId - TagoIO device ID
 * @param setpoint - Setpoint with ramp configuration
 * @returns Mock result
 */
export async function applyRamp(
  deviceId: string,
  setpoint: EnvironmentalSetpoint
): Promise<ControlCommandResult> {
  if (!setpoint.ramp_enabled || !setpoint.ramp_start_value || !setpoint.ramp_end_value) {
    return {
      success: false,
      message: 'Ramp not configured',
    }
  }

  // MOCK: Ramp command
  console.log('[MOCK] TagoIO Ramp Command:', {
    deviceId,
    parameter: setpoint.parameter_type,
    from: setpoint.ramp_start_value,
    to: setpoint.ramp_end_value,
    duration_minutes: setpoint.ramp_duration_minutes,
    unit: setpoint.unit,
    note: 'This is a mock ramp implementation.',
  })

  return {
    success: true,
    commandId: `mock-ramp-${Date.now()}`,
    message: `MOCK: Ramp scheduled from ${setpoint.ramp_start_value} to ${setpoint.ramp_end_value} over ${setpoint.ramp_duration_minutes} minutes`,
  }
}

/**
 * MOCK: Get current device status from TagoIO
 * 
 * TODO: Implement actual TagoIO device status query
 * 
 * @param deviceId - TagoIO device ID
 * @returns Mock device status
 */
export async function getDeviceStatus(deviceId: string) {
  console.log('[MOCK] TagoIO Get Device Status:', {
    deviceId,
    note: 'This is a mock implementation. Returning simulated data.',
  })

  // Return mock status
  return {
    success: true,
    data: {
      deviceId,
      online: true,
      lastUpdate: new Date().toISOString(),
      parameters: {
        temperature: { value: 22.5, unit: '°C' },
        humidity: { value: 65.0, unit: '%' },
        co2: { value: 1200, unit: 'ppm' },
      },
    },
  }
}

/**
 * MOCK: Batch apply multiple setpoints
 * 
 * @param deviceId - TagoIO device ID
 * @param setpoints - Array of setpoints to apply
 * @param isDayPeriod - Whether currently in day period
 * @returns Array of results
 */
export async function batchApplySetpoints(
  deviceId: string,
  setpoints: EnvironmentalSetpoint[],
  isDayPeriod: boolean = true
): Promise<ControlCommandResult[]> {
  console.log('[MOCK] TagoIO Batch Apply Setpoints:', {
    deviceId,
    count: setpoints.length,
    isDayPeriod,
    note: 'Applying multiple setpoints in batch.',
  })

  const results = await Promise.all(
    setpoints.map((setpoint) => applySetpoint(deviceId, setpoint, isDayPeriod))
  )

  return results
}

/**
 * MOCK: Emergency stop - set all systems to safe default state
 * 
 * @param deviceId - TagoIO device ID
 * @returns Mock result
 */
export async function emergencyStop(deviceId: string): Promise<ControlCommandResult> {
  console.warn('[MOCK] TagoIO Emergency Stop:', {
    deviceId,
    note: 'EMERGENCY STOP TRIGGERED - All systems would be set to safe defaults.',
  })

  // MOCK: Would send emergency stop commands
  return {
    success: true,
    message: 'MOCK: Emergency stop activated. All systems set to safe defaults.',
  }
}

/**
 * Get TagoIO device ID for a pod
 * 
 * TODO: Implement actual mapping from pods table or configuration
 * 
 * @param podId - Pod UUID
 * @returns Mock device ID
 */
export function getDeviceIdForPod(podId: string): string {
  // MOCK: Return a mock device ID
  // In production, this would query the pods table for tagoio_device_id
  console.log('[MOCK] Get TagoIO Device ID for pod:', podId)
  return `mock-device-${podId.substring(0, 8)}`
}

/**
 * Validate setpoint value against min/max bounds
 * 
 * @param setpoint - Setpoint configuration
 * @param value - Value to validate
 * @returns Whether value is within bounds
 */
export function validateSetpointValue(
  setpoint: EnvironmentalSetpoint,
  value: number
): boolean {
  if (setpoint.min_value !== null && setpoint.min_value !== undefined && value < setpoint.min_value) {
    console.warn(`Value ${value} below minimum ${setpoint.min_value} for ${setpoint.parameter_type}`)
    return false
  }

  if (setpoint.max_value !== null && setpoint.max_value !== undefined && value > setpoint.max_value) {
    console.warn(`Value ${value} above maximum ${setpoint.max_value} for ${setpoint.parameter_type}`)
    return false
  }

  return true
}

/**
 * Check if value is within deadband (no adjustment needed)
 * 
 * @param targetValue - Target setpoint value
 * @param currentValue - Current measured value
 * @param deadband - Acceptable deviation
 * @returns Whether value is within acceptable range
 */
export function isWithinDeadband(
  targetValue: number,
  currentValue: number,
  deadband: number
): boolean {
  const deviation = Math.abs(targetValue - currentValue)
  return deviation <= deadband
}
