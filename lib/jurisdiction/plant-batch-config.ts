/**
 * Plant Batch Configuration System
 *
 * Provides state-specific configuration for plant batch compliance
 * including Open Loop vs Closed Loop tracking, tagging triggers,
 * and source traceability requirements.
 */

import type { TrackingMode, TaggingTriggerType } from '@/types/batch'

// =====================================================
// TYPES
// =====================================================

/**
 * Tagging trigger condition
 */
export interface TaggingTrigger {
  type: TaggingTriggerType
  threshold?: number // For height (inches) or canopy (sqft)
  unit?: 'inches' | 'feet' | 'sqft'
  stage?: string // For stage-based trigger
}

/**
 * State-specific plant batch configuration
 */
export interface StatePlantBatchConfig {
  stateCode: string
  stateName: string

  // Tracking mode defaults
  defaultTrackingMode: TrackingMode
  allowModeSwitch: boolean

  // Open Loop vs Closed Loop (Metrc sandbox terminology)
  // Open Loop: Can create plant batches "from thin air" using POST/plantbatches/v2/plantings
  // Closed Loop: Must create from existing plants/packages using POST/plants/v2/plantings or POST/packages/v2/plantings
  isOpenLoopState: boolean

  // Tagging triggers (when must plants be individually tagged)
  taggingTriggers: TaggingTrigger[]

  // Batch limits
  maxPlantsPerBatch: number

  // Tag requirements
  tagTechnology: 'barcode' | 'rfid'
  tagFormatRegex: string
  tagFormatExample: string

  // Oregon June 2024 batch tagging option
  supportsBatchTagging: boolean

  // Source traceability
  requiresSourceTracking: boolean

  // Immature plant packages (nursery)
  allowsImmaturePackages: boolean
  immaturePackageMinCount?: number
  immaturePackageMaxCount?: number

  // Growth phase mapping (TRAZO stage → Metrc phase)
  growthPhaseMapping: Record<string, string>

  // Compliance notes
  complianceNotes?: string
}

// =====================================================
// STATE CONFIGURATIONS
// Based on Metrc State Matrix - Open Loop vs Closed Loop
// =====================================================

// -----------------------------------------------------
// CLOSED LOOP STATES (Cannot create batches "from thin air")
// Must use POST/plants/v2/plantings or POST/packages/v2/plantings
// -----------------------------------------------------

/**
 * Alaska Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: YES, Mother Plants: NO
 */
export const ALASKA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'AK',
  stateName: 'Alaska',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^1A4FF[A-Z0-9]{2}[0-9]{15}$',
  tagFormatExample: '1A4FF02000000220000004349',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Vegetative tracking enabled, mother plants NOT tracked.',
}

/**
 * California Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: NO
 */
export const CALIFORNIA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'CA',
  stateName: 'California',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }, { type: 'canopy_area' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^1A406[A-Z0-9]{2}[0-9]{15}$',
  tagFormatExample: '1A406AB000001234567890',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. No vegetative or mother plant tracking.',
}

/**
 * Maine Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const MAINE_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'ME',
  stateName: 'Maine',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'ME12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Michigan Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: YES
 */
export const MICHIGAN_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'MI',
  stateName: 'Michigan',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^1A405[A-Z0-9]{2}[0-9]{15}$',
  tagFormatExample: '1A405AB000001234567890',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Mother plant tracking enabled, no vegetative tracking.',
}

/**
 * Missouri Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: YES, Mother Plants: NO
 */
export const MISSOURI_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'MO',
  stateName: 'Missouri',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'MO12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Vegetative tracking enabled, no mother plant tracking.',
}

/**
 * Nevada Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: YES
 */
export const NEVADA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'NV',
  stateName: 'Nevada',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^1A407[A-Z0-9]{2}[0-9]{15}$',
  tagFormatExample: '1A407AB000001234567890',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Mother plant tracking enabled, no vegetative tracking.',
}

/**
 * Ohio Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: YES
 */
export const OHIO_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'OH',
  stateName: 'Ohio',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'OH12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Mother plant tracking enabled, no vegetative tracking.',
}

/**
 * Oregon Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: YES
 * - 36" height or flowering triggers individual tagging
 */
export const OREGON_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'OR',
  stateName: 'Oregon',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [
    { type: 'height', threshold: 36, unit: 'inches' },
    { type: 'flowering' },
  ],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^1A4FF[A-Z0-9]{2}[0-9]{15}$',
  tagFormatExample: '1A4FFAB000001234567890',
  supportsBatchTagging: true,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. June 2024 batch tagging option for ≤100 plants.',
}

/**
 * Rhode Island Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: YES
 */
export const RHODE_ISLAND_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'RI',
  stateName: 'Rhode Island',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'RI12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Mother plant tracking enabled.',
}

/**
 * South Dakota Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: YES
 */
export const SOUTH_DAKOTA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'SD',
  stateName: 'South Dakota',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'SD12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Mother plant tracking enabled.',
}

/**
 * Illinois Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: YES
 */
export const ILLINOIS_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'IL',
  stateName: 'Illinois',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'IL12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Mother plant tracking enabled.',
}

/**
 * Guam Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: YES
 */
export const GUAM_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'GU',
  stateName: 'Guam',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'GU12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state (territory). Mother plant tracking enabled.',
}

/**
 * Alabama Cannabis Configuration
 * - CLOSED LOOP: Cannot create batches from thin air
 * - Vegetative: NO, Mother Plants: YES
 */
export const ALABAMA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'AL',
  stateName: 'Alabama',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: false,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'AL12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: true,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'CLOSED LOOP state. Mother plant tracking enabled.',
}

// -----------------------------------------------------
// OPEN LOOP STATES (Can create batches "from thin air")
// Can use POST/plantbatches/v2/plantings directly
// -----------------------------------------------------

/**
 * Colorado Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: NO
 */
export const COLORADO_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'CO',
  stateName: 'Colorado',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^1A408[A-Z0-9]{2}[0-9]{15}$',
  tagFormatExample: '1A408AB000001234567890',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Can create batches without source. Vegetative tracking enabled.',
}

/**
 * District of Columbia Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const DC_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'DC',
  stateName: 'District of Columbia',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'DC12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Louisiana Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const LOUISIANA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'LA',
  stateName: 'Louisiana',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'LA12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Massachusetts Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const MASSACHUSETTS_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'MA',
  stateName: 'Massachusetts',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^1A400[A-Z0-9]{2}[0-9]{15}$',
  tagFormatExample: '1A400AB000001234567890',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Maryland Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const MARYLAND_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'MD',
  stateName: 'Maryland',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true, // CORRECTED: Matrix shows YES for Open Loop
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'MD12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Minnesota Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const MINNESOTA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'MN',
  stateName: 'Minnesota',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'MN12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Mississippi Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const MISSISSIPPI_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'MS',
  stateName: 'Mississippi',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'MS12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Montana Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const MONTANA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'MT',
  stateName: 'Montana',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'MT12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * New Jersey Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const NEW_JERSEY_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'NJ',
  stateName: 'New Jersey',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'NJ12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Oklahoma Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const OKLAHOMA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'OK',
  stateName: 'Oklahoma',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^1A404[A-Z0-9]{2}[0-9]{15}$',
  tagFormatExample: '1A404AB000001234567890',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. As of 9/19/24, new clone batches must be associated with package tag.',
}

/**
 * West Virginia Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const WEST_VIRGINIA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'WV',
  stateName: 'West Virginia',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'WV12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Virginia Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const VIRGINIA_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'VA',
  stateName: 'Virginia',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'VA12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Kentucky Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const KENTUCKY_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'KY',
  stateName: 'Kentucky',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'KY12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state. Vegetative and mother plant tracking enabled.',
}

/**
 * Virgin Islands Cannabis Configuration
 * - OPEN LOOP: Can create batches from thin air
 * - Vegetative: YES, Mother Plants: YES
 */
export const VIRGIN_ISLANDS_PLANT_BATCH_CONFIG: StatePlantBatchConfig = {
  stateCode: 'VI',
  stateName: 'Virgin Islands',
  defaultTrackingMode: 'open_loop',
  allowModeSwitch: true,
  isOpenLoopState: true,
  taggingTriggers: [{ type: 'flowering' }],
  maxPlantsPerBatch: 100,
  tagTechnology: 'barcode',
  tagFormatRegex: '^[A-Z0-9]{24}$',
  tagFormatExample: 'VI12345678901234567890AB',
  supportsBatchTagging: false,
  requiresSourceTracking: false,
  allowsImmaturePackages: true,
  growthPhaseMapping: { clone: 'Clone', vegetative: 'Vegetative', flowering: 'Flowering' },
  complianceNotes: 'OPEN LOOP state (territory). Vegetative and mother plant tracking enabled.',
}

// =====================================================
// CONFIGURATION REGISTRY
// =====================================================

/**
 * Registry of all state plant batch configurations
 * Based on Metrc State Matrix - 27 states/territories configured
 */
const STATE_PLANT_BATCH_CONFIGS: Record<string, StatePlantBatchConfig> = {
  // CLOSED LOOP STATES (13)
  AK: ALASKA_PLANT_BATCH_CONFIG,
  AL: ALABAMA_PLANT_BATCH_CONFIG,
  CA: CALIFORNIA_PLANT_BATCH_CONFIG,
  GU: GUAM_PLANT_BATCH_CONFIG,
  IL: ILLINOIS_PLANT_BATCH_CONFIG,
  ME: MAINE_PLANT_BATCH_CONFIG,
  MI: MICHIGAN_PLANT_BATCH_CONFIG,
  MO: MISSOURI_PLANT_BATCH_CONFIG,
  NV: NEVADA_PLANT_BATCH_CONFIG,
  OH: OHIO_PLANT_BATCH_CONFIG,
  OR: OREGON_PLANT_BATCH_CONFIG,
  RI: RHODE_ISLAND_PLANT_BATCH_CONFIG,
  SD: SOUTH_DAKOTA_PLANT_BATCH_CONFIG,
  // OPEN LOOP STATES (14)
  CO: COLORADO_PLANT_BATCH_CONFIG,
  DC: DC_PLANT_BATCH_CONFIG,
  KY: KENTUCKY_PLANT_BATCH_CONFIG,
  LA: LOUISIANA_PLANT_BATCH_CONFIG,
  MA: MASSACHUSETTS_PLANT_BATCH_CONFIG,
  MD: MARYLAND_PLANT_BATCH_CONFIG,
  MN: MINNESOTA_PLANT_BATCH_CONFIG,
  MS: MISSISSIPPI_PLANT_BATCH_CONFIG,
  MT: MONTANA_PLANT_BATCH_CONFIG,
  NJ: NEW_JERSEY_PLANT_BATCH_CONFIG,
  OK: OKLAHOMA_PLANT_BATCH_CONFIG,
  VA: VIRGINIA_PLANT_BATCH_CONFIG,
  VI: VIRGIN_ISLANDS_PLANT_BATCH_CONFIG,
  WV: WEST_VIRGINIA_PLANT_BATCH_CONFIG,
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get plant batch configuration for a state
 */
export function getStatePlantBatchConfig(
  stateCode: string
): StatePlantBatchConfig | null {
  return STATE_PLANT_BATCH_CONFIGS[stateCode.toUpperCase()] || null
}

/**
 * Get all supported state codes
 */
export function getSupportedStateCodes(): string[] {
  return Object.keys(STATE_PLANT_BATCH_CONFIGS)
}

/**
 * Check if a state requires immediate tagging (closed loop from start)
 */
export function stateRequiresImmediateTagging(stateCode: string): boolean {
  const config = getStatePlantBatchConfig(stateCode)
  if (!config) return false

  return config.taggingTriggers.some((t) => t.type === 'all_plants')
}

/**
 * Check if plants in a batch require tagging based on state rules
 */
export function checkTaggingRequirement(
  stateCode: string,
  batch: {
    stage?: string
    max_plant_height_inches?: number
    canopy_area_sq_ft?: number
  }
): { requiresTags: boolean; trigger: TaggingTrigger | null; reason?: string } {
  const config = getStatePlantBatchConfig(stateCode)
  if (!config) {
    return { requiresTags: false, trigger: null }
  }

  for (const trigger of config.taggingTriggers) {
    // All plants must be tagged (e.g., Maryland)
    if (trigger.type === 'all_plants') {
      return {
        requiresTags: true,
        trigger,
        reason: 'State requires all plants to be individually tagged',
      }
    }

    // Height-based trigger (e.g., Oregon 36")
    if (
      trigger.type === 'height' &&
      trigger.threshold &&
      batch.max_plant_height_inches &&
      batch.max_plant_height_inches >= trigger.threshold
    ) {
      return {
        requiresTags: true,
        trigger,
        reason: `Plants have exceeded ${trigger.threshold}${trigger.unit || '"'} height threshold`,
      }
    }

    // Flowering stage trigger
    if (trigger.type === 'flowering' && batch.stage === 'flowering') {
      return {
        requiresTags: true,
        trigger,
        reason: 'Plants have entered flowering stage',
      }
    }

    // Canopy area trigger (California)
    if (trigger.type === 'canopy_area' && batch.canopy_area_sq_ft) {
      return {
        requiresTags: true,
        trigger,
        reason: 'Canopy area tracking triggered tagging requirement',
      }
    }
  }

  return { requiresTags: false, trigger: null }
}

/**
 * Validate tag format against state requirements
 */
export function validateTagFormat(stateCode: string, tag: string): boolean {
  const config = getStatePlantBatchConfig(stateCode)
  if (!config || !config.tagFormatRegex) return true

  const regex = new RegExp(config.tagFormatRegex)
  return regex.test(tag)
}

/**
 * Get the Metrc growth phase name for a TRAZO stage
 */
export function getMetrcGrowthPhase(
  stateCode: string,
  trazoStage: string
): string | null {
  const config = getStatePlantBatchConfig(stateCode)
  if (!config) return null

  return config.growthPhaseMapping[trazoStage] || null
}

/**
 * Check if state supports Oregon-style batch tagging
 */
export function supportsBatchTagging(stateCode: string): boolean {
  const config = getStatePlantBatchConfig(stateCode)
  return config?.supportsBatchTagging || false
}

/**
 * Check if state requires source traceability
 */
export function requiresSourceTracking(stateCode: string): boolean {
  const config = getStatePlantBatchConfig(stateCode)
  return config?.requiresSourceTracking || false
}

/**
 * Check if state allows immature plant packages (nursery)
 */
export function allowsImmaturePackages(stateCode: string): boolean {
  const config = getStatePlantBatchConfig(stateCode)
  return config?.allowsImmaturePackages || false
}

/**
 * Get default tracking mode for a state
 */
export function getDefaultTrackingMode(stateCode: string): TrackingMode {
  const config = getStatePlantBatchConfig(stateCode)
  return config?.defaultTrackingMode || 'open_loop'
}

/**
 * Check if a state is an "Open Loop" state in Metrc terms
 *
 * Open Loop states can create plant batches "from thin air" using
 * POST /plantbatches/v2/plantings without a source plant or package.
 *
 * Closed Loop states MUST create plant batches from existing inventory:
 * - From a plant: POST /plants/v2/plantings
 * - From a package: POST /packages/v2/plantings
 *
 * Most states are Closed Loop. Notable Open Loop states: Colorado
 */
export function isOpenLoopState(stateCode: string): boolean {
  const config = getStatePlantBatchConfig(stateCode)
  // Default to closed loop (safer) if state is not configured
  return config?.isOpenLoopState ?? false
}

/**
 * Get the appropriate endpoint for creating plant batches based on state
 */
export function getPlantBatchCreateEndpoint(
  stateCode: string,
  sourceType: 'from_package' | 'from_mother' | 'no_source'
): {
  endpoint: string
  method: 'POST'
  requiresSource: boolean
  description: string
} {
  const isOpenLoop = isOpenLoopState(stateCode)

  // Open Loop states can use the standard plantings endpoint without source
  if (isOpenLoop && sourceType === 'no_source') {
    return {
      endpoint: '/plantbatches/v2/plantings',
      method: 'POST',
      requiresSource: false,
      description: 'Create plant batch directly (Open Loop state)',
    }
  }

  // Closed Loop states or when source is provided
  switch (sourceType) {
    case 'from_package':
      return {
        endpoint: '/packages/v2/plantings',
        method: 'POST',
        requiresSource: true,
        description: 'Create plant batch from package',
      }
    case 'from_mother':
      return {
        endpoint: '/plants/v2/plantings',
        method: 'POST',
        requiresSource: true,
        description: 'Create plant batch from mother plant',
      }
    case 'no_source':
    default:
      // Closed loop state with no source - this will fail
      return {
        endpoint: '/plantbatches/v2/plantings',
        method: 'POST',
        requiresSource: true,
        description: 'REQUIRES SOURCE - this state is Closed Loop',
      }
  }
}
