/**
 * Equipment Control Types for AUTO Mode Support
 * 
 * Defines 3-state equipment control (OFF/ON/AUTO) with metadata
 * for automated environmental control systems.
 * 
 * Supports:
 * - Manual control (OFF/ON with power levels)
 * - Automatic control (based on thresholds or schedules)
 * - Override mechanisms
 * - Equipment-specific configurations
 * 
 * @see /docs/roadmap/planning-progress/WEEK1_AUTO_MODE_FINDINGS.md
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Equipment operational state (3-state control)
 * 
 * @enum {number}
 * - OFF: Equipment is powered off
 * - ON: Equipment is manually powered on
 * - AUTO: Equipment is controlled by automation logic
 */
export enum EquipmentState {
  /** Equipment is powered off */
  OFF = 0,
  /** Equipment is manually powered on (MANUAL mode) */
  ON = 1,
  /** Equipment is controlled by automation (AUTO mode) */
  AUTO = 2,
}

/**
 * Control mode indicating manual vs automatic operation
 * 
 * @enum {number}
 * - MANUAL: User directly controls equipment state
 * - AUTOMATIC: System controls equipment based on rules
 */
export enum ControlMode {
  /** User directly controls equipment state and power level */
  MANUAL = 0,
  /** System controls equipment based on environmental conditions or schedules */
  AUTOMATIC = 1,
}

/**
 * Equipment types supported in the system
 */
export enum EquipmentType {
  COOLING = 'cooling',
  HEATING = 'heating',
  DEHUMIDIFIER = 'dehumidifier',
  HUMIDIFIER = 'humidifier',
  CO2_INJECTION = 'co2_injection',
  EXHAUST_FAN = 'exhaust_fan',
  CIRCULATION_FAN = 'circulation_fan',
  LIGHTING = 'lighting',
  IRRIGATION = 'irrigation',
  FOGGER = 'fogger',
  HEPA_FILTER = 'hepa_filter',
  UV_STERILIZATION = 'uv_sterilization',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Temperature threshold configuration for AUTO mode
 */
export interface TemperatureThreshold {
  /** Minimum temperature in Celsius */
  min: number;
  /** Maximum temperature in Celsius */
  max: number;
}

/**
 * Humidity threshold configuration for AUTO mode
 */
export interface HumidityThreshold {
  /** Minimum humidity percentage (0-100) */
  min: number;
  /** Maximum humidity percentage (0-100) */
  max: number;
}

/**
 * CO2 threshold configuration for AUTO mode
 */
export interface CO2Threshold {
  /** Minimum CO2 concentration in ppm */
  min: number;
  /** Maximum CO2 concentration in ppm */
  max: number;
}

/**
 * Schedule configuration for time-based automation
 */
export interface EquipmentSchedule {
  /** Time to turn equipment on (24-hour format: "HH:MM") */
  on_time: string;
  /** Time to turn equipment off (24-hour format: "HH:MM") */
  off_time: string;
}

/**
 * AUTO mode configuration for equipment
 * 
 * Different equipment types may use different thresholds:
 * - Cooling/Heating: temp_threshold
 * - Dehumidifier/Humidifier: humidity_threshold
 * - CO2 Injection: co2_threshold
 * - Lighting: schedule
 */
export interface AutoConfiguration {
  /** Temperature thresholds for temperature-controlled equipment */
  temp_threshold?: TemperatureThreshold;
  /** Humidity thresholds for humidity-controlled equipment */
  humidity_threshold?: HumidityThreshold;
  /** CO2 thresholds for CO2-controlled equipment */
  co2_threshold?: CO2Threshold;
  /** Time-based schedule for equipment operation */
  schedule?: EquipmentSchedule;
}

/**
 * Complete equipment control state with metadata
 * 
 * This represents the full state of a piece of equipment including
 * its operational state, control mode, and automation configuration.
 * 
 * @example
 * // Manual cooling at 50% power
 * const cooling: EquipmentControl = {
 *   state: EquipmentState.ON,
 *   mode: ControlMode.MANUAL,
 *   override: false,
 *   schedule_enabled: false,
 *   level: 50,
 *   last_updated: new Date()
 * }
 * 
 * @example
 * // AUTO cooling with temperature thresholds
 * const autoCooling: EquipmentControl = {
 *   state: EquipmentState.AUTO,
 *   mode: ControlMode.AUTOMATIC,
 *   override: false,
 *   schedule_enabled: false,
 *   level: 75,
 *   last_updated: new Date(),
 *   auto_config: {
 *     temp_threshold: { min: 20, max: 24 }
 *   }
 * }
 */
export interface EquipmentControl {
  /** Current operational state (OFF/ON/AUTO) */
  state: EquipmentState;
  
  /** Control mode (MANUAL/AUTOMATIC) */
  mode: ControlMode;
  
  /** Whether this equipment is in manual override mode */
  override: boolean;
  
  /** Whether schedule-based control is enabled */
  schedule_enabled: boolean;
  
  /** Power level percentage (0-100) */
  level: number;
  
  /** Last time this equipment state was updated */
  last_updated: Date;
  
  /** AUTO mode configuration (only present when mode is AUTOMATIC) */
  auto_config?: AutoConfiguration;
}

/**
 * Equipment control data for database insertion
 * 
 * Used when creating or updating equipment controls in the database.
 * Mirrors EquipmentControl but with optional fields and string timestamp.
 */
export interface InsertEquipmentControl {
  /** Pod ID this equipment belongs to */
  pod_id: string;
  
  /** Type of equipment */
  equipment_type: EquipmentType | string;
  
  /** Current operational state (OFF/ON/AUTO) */
  state: EquipmentState;
  
  /** Control mode (MANUAL/AUTOMATIC) */
  mode: ControlMode;
  
  /** Whether this equipment is in manual override mode */
  override?: boolean;
  
  /** Whether schedule-based control is enabled */
  schedule_enabled?: boolean;
  
  /** Power level percentage (0-100) */
  level?: number;
  
  /** AUTO mode configuration (JSONB in database) */
  auto_config?: AutoConfiguration;
}

/**
 * Equipment control record from database (with ID and timestamps)
 */
export interface EquipmentControlRecord extends InsertEquipmentControl {
  /** Unique identifier */
  id: string;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Map of equipment type to control state
 * 
 * Used for grouping multiple equipment controls together
 * (e.g., all equipment for a single pod)
 */
export type EquipmentControlMap = {
  [K in EquipmentType]?: EquipmentControl;
};

/**
 * Partial equipment control for updates
 * 
 * Allows updating only specific fields without providing the complete state
 */
export type EquipmentControlUpdate = Partial<Omit<EquipmentControl, 'last_updated'>> & {
  last_updated?: Date;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert EquipmentControl to boolean for backward compatibility
 * 
 * Legacy code expects boolean equipment states. This adapter converts
 * the new 3-state control to a simple active/inactive boolean.
 * 
 * @param control - Equipment control state
 * @returns true if equipment is ON or AUTO, false if OFF
 * 
 * @example
 * equipmentControlToBoolean({ state: EquipmentState.AUTO, ... }) // true
 * equipmentControlToBoolean({ state: EquipmentState.OFF, ... }) // false
 */
export function equipmentControlToBoolean(
  control: EquipmentControl | null | undefined
): boolean {
  if (!control) return false;
  return control.state === EquipmentState.ON || control.state === EquipmentState.AUTO;
}

/**
 * Create default equipment control (OFF state)
 * 
 * @returns Default EquipmentControl in OFF state
 */
export function createDefaultEquipmentControl(): EquipmentControl {
  return {
    state: EquipmentState.OFF,
    mode: ControlMode.MANUAL,
    override: false,
    schedule_enabled: false,
    level: 0,
    last_updated: new Date(),
  };
}

/**
 * Convert boolean equipment state to EquipmentControl
 * 
 * For migrating legacy boolean states to new 3-state control.
 * 
 * @param isActive - Boolean equipment state
 * @returns EquipmentControl representing the boolean state
 */
export function booleanToEquipmentControl(isActive: boolean | null | undefined): EquipmentControl {
  if (isActive) {
    return {
      state: EquipmentState.ON,
      mode: ControlMode.MANUAL,
      override: false,
      schedule_enabled: false,
      level: 100,
      last_updated: new Date(),
    };
  }
  
  return createDefaultEquipmentControl();
}

/**
 * Validate equipment control state
 * 
 * Ensures equipment control has valid values and consistent state.
 * 
 * @param control - Equipment control to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateEquipmentControl(control: EquipmentControl): string[] {
  const errors: string[] = [];
  
  // Validate state
  if (![EquipmentState.OFF, EquipmentState.ON, EquipmentState.AUTO].includes(control.state)) {
    errors.push(`Invalid state: ${control.state}`);
  }
  
  // Validate mode
  if (![ControlMode.MANUAL, ControlMode.AUTOMATIC].includes(control.mode)) {
    errors.push(`Invalid mode: ${control.mode}`);
  }
  
  // Validate level
  if (control.level < 0 || control.level > 100) {
    errors.push(`Invalid level: ${control.level} (must be 0-100)`);
  }
  
  // State-specific validations
  if (control.state === EquipmentState.OFF && control.level > 0) {
    errors.push('Equipment cannot have power level > 0 when OFF');
  }
  
  if (control.state === EquipmentState.AUTO && !control.auto_config) {
    errors.push('AUTO state requires auto_config');
  }
  
  if (control.mode === ControlMode.AUTOMATIC && control.state !== EquipmentState.AUTO) {
    errors.push('AUTOMATIC mode requires AUTO state');
  }
  
  return errors;
}

/**
 * Get human-readable label for equipment state
 * 
 * @param state - Equipment state enum value
 * @returns Display label for UI
 */
export function getEquipmentStateLabel(state: EquipmentState): string {
  switch (state) {
    case EquipmentState.OFF:
      return 'OFF';
    case EquipmentState.ON:
      return 'MANUAL';
    case EquipmentState.AUTO:
      return 'AUTO';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Get CSS color class for equipment state
 * 
 * @param state - Equipment state enum value
 * @returns Tailwind CSS color class
 */
export function getEquipmentStateColor(state: EquipmentState): string {
  switch (state) {
    case EquipmentState.OFF:
      return 'bg-gray-500';
    case EquipmentState.ON:
      return 'bg-green-500';
    case EquipmentState.AUTO:
      return 'bg-gray-400 text-white';
    default:
      return 'bg-gray-400';
  }
}
