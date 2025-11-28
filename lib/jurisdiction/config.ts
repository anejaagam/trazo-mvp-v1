import type { JurisdictionConfig, JurisdictionId, PlantType } from './types'
import { OREGON_CANNABIS } from './cannabis/oregon'
import { MARYLAND_CANNABIS } from './cannabis/maryland'
import { CANADA_CANNABIS } from './cannabis/canada'
import { PRIMUS_GFS } from './produce/primus-gfs'

// Central jurisdiction configuration registry
const JURISDICTIONS: Record<JurisdictionId, JurisdictionConfig> = {
  oregon_cannabis: OREGON_CANNABIS,
  maryland_cannabis: MARYLAND_CANNABIS,
  canada_cannabis: CANADA_CANNABIS,
  primus_gfs: PRIMUS_GFS,
  // Future jurisdictions can be added here
  michigan_cannabis: OREGON_CANNABIS, // Placeholder - uses Oregon rules for now
  california_cannabis: OREGON_CANNABIS, // Placeholder - uses Oregon rules for now
  nevada_cannabis: OREGON_CANNABIS, // Placeholder - uses Oregon rules for now
  alaska_cannabis: OREGON_CANNABIS, // Placeholder - uses Oregon rules for now
}

/**
 * Get jurisdiction configuration by ID
 */
export function getJurisdictionConfig(jurisdictionId: JurisdictionId): JurisdictionConfig | null {
  return JURISDICTIONS[jurisdictionId] || null
}

/**
 * Get jurisdiction configuration by state/country and plant type
 */
export function getJurisdictionByLocation(
  country: 'us' | 'canada',
  plantType: PlantType,
  state?: string
): JurisdictionConfig | null {
  if (country === 'us' && plantType === 'cannabis' && state) {
    const jurisdictionId = `${state.toLowerCase()}_cannabis` as JurisdictionId
    return getJurisdictionConfig(jurisdictionId)
  }
  
  if (country === 'canada' && plantType === 'cannabis') {
    return getJurisdictionConfig('canada_cannabis')
  }
  
  if (plantType === 'produce') {
    return getJurisdictionConfig('primus_gfs')
  }
  
  return null
}

/**
 * Get all available jurisdictions
 */
export function getAllJurisdictions(): JurisdictionConfig[] {
  return Object.values(JURISDICTIONS)
}

/**
 * Get jurisdictions by plant type
 */
export function getJurisdictionsByPlantType(plantType: PlantType): JurisdictionConfig[] {
  return Object.values(JURISDICTIONS).filter(j => j.plant_type === plantType)
}

/**
 * Get jurisdictions by country
 */
export function getJurisdictionsByCountry(country: 'us' | 'canada'): JurisdictionConfig[] {
  return Object.values(JURISDICTIONS).filter(j => j.country === country)
}

/**
 * Check if a jurisdiction supports a specific feature
 */
export function jurisdictionSupports(
  jurisdictionId: JurisdictionId,
  feature: string
): boolean {
  const jurisdiction = getJurisdictionConfig(jurisdictionId)
  if (!jurisdiction) return false
  
  // Check various features based on jurisdiction rules
  switch (feature) {
    case 'plant_tags':
      return jurisdiction.rules.batch.require_plant_tags
    case 'metrc_integration':
      return jurisdiction.rules.batch.require_metrc_id
    case 'individual_plant_tracking':
      return jurisdiction.rules.plant_tracking?.individual_plant_tags || false
    case 'waste_witness_required':
      return jurisdiction.rules.waste.require_witness
    case 'food_safety':
      return jurisdiction.rules.food_safety !== undefined
    default:
      return false
  }
}

/**
 * Get waste disposal reasons for a jurisdiction
 */
export function getWasteReasons(jurisdictionId: JurisdictionId): string[] {
  const jurisdiction = getJurisdictionConfig(jurisdictionId)
  return jurisdiction?.rules?.waste?.allowed_reasons || []
}

/**
 * Get disposal methods for a jurisdiction
 */
export function getDisposalMethods(jurisdictionId: JurisdictionId): string[] {
  const jurisdiction = getJurisdictionConfig(jurisdictionId)
  return jurisdiction?.rules?.waste?.disposal_methods || []
}

/**
 * Get allowed batch stages for a jurisdiction
 */
export function getAllowedBatchStages(jurisdictionId: JurisdictionId): string[] {
  const jurisdiction = getJurisdictionConfig(jurisdictionId)
  return jurisdiction?.rules?.batch?.allowed_stages || []
}

/**
 * Validate if a batch stage transition is allowed
 */
export function isBatchStageTransitionAllowed(
  jurisdictionId: JurisdictionId | null | undefined,
  fromStage: string,
  toStage: string
): boolean {
  // If no jurisdiction is configured, allow all transitions
  // This supports testing and organizations without jurisdiction setup
  if (!jurisdictionId) return true

  const jurisdiction = getJurisdictionConfig(jurisdictionId)
  // If jurisdiction is not found in registry, allow all transitions
  // (graceful fallback for new/unsupported jurisdictions)
  if (!jurisdiction) return true

  const allowedStages = jurisdiction.rules.batch.allowed_stages

  // Both stages must be allowed
  if (!allowedStages.includes(fromStage) || !allowedStages.includes(toStage)) {
    return false
  }

  // Additional business logic for stage transitions can be added here
  // For now, any allowed stage can transition to any other allowed stage
  return true
}

/**
 * Get compliance report types for a jurisdiction
 */
export function getComplianceReportTypes(jurisdictionId: JurisdictionId): string[] {
  const jurisdiction = getJurisdictionConfig(jurisdictionId)
  return jurisdiction?.rules?.compliance?.report_types || []
}

/**
 * Check if jurisdiction is valid
 */
export function isValidJurisdiction(jurisdictionId: string): jurisdictionId is JurisdictionId {
  return jurisdictionId in JURISDICTIONS
}

/**
 * Get jurisdiction options for UI dropdowns
 */
export function getJurisdictionOptions(): Array<{ value: JurisdictionId; label: string; country: string; plantType: PlantType }> {
  return Object.values(JURISDICTIONS).map(jurisdiction => ({
    value: jurisdiction.id as JurisdictionId,
    label: jurisdiction.name,
    country: jurisdiction.country,
    plantType: jurisdiction.plant_type,
  }))
}
