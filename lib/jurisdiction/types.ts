// Jurisdiction System Types for Trazo MVP
// Handles jurisdiction-specific compliance rules across different regions and plant types

export interface JurisdictionConfig {
  id: string
  name: string
  country: 'us' | 'canada'
  state?: string // For US states
  plant_type: 'cannabis' | 'produce'
  rules: JurisdictionRules
}

export interface JurisdictionRules {
  // Batch rules
  batch: {
    require_license_number: boolean
    require_metrc_id: boolean
    allowed_stages: string[]
    min_plant_count?: number
    max_plant_count?: number
    require_plant_tags: boolean
    tag_format?: string // e.g., '1A4FF...'
    require_genealogy: boolean
    require_mother_plant_tracking: boolean
  }
  
  // Waste rules
  waste: {
    allowed_reasons: string[] // Jurisdiction-specific waste reasons
    require_witness: boolean
    require_photo: boolean
    require_signature: boolean
    disposal_methods: string[]
    require_rendering_unusable: boolean
    minimum_witness_age?: number
    require_state_license_check: boolean
  }
  
  // Inventory rules
  inventory: {
    track_lot_numbers: boolean
    track_expiry: boolean
    require_supplier_info: boolean
    require_coa: boolean // Certificate of Analysis
    track_package_tags: boolean
    require_manifest_for_transfers: boolean
  }
  
  // Compliance reporting
  compliance: {
    report_types: string[]
    report_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
    required_fields: string[]
    submission_deadlines: Record<string, number> // days after period end
    authorities: string[] // Regulatory authorities
  }

  // Plant tracking (for cannabis)
  plant_tracking?: {
    individual_plant_tags: boolean
    tag_assignment_stage: string
    tag_format: string
    track_plant_movements: boolean
    require_plant_destruction_witness: boolean
  }

  // Food safety (for produce)
  food_safety?: {
    require_haccp: boolean
    require_gmp: boolean
    water_testing_frequency: 'daily' | 'weekly' | 'monthly'
    soil_testing_frequency: 'monthly' | 'quarterly' | 'annually'
    pesticide_testing_required: boolean
  }
}

export interface WasteReason {
  code: string
  name: string
  description: string
  requires_photo: boolean
  requires_witness: boolean
  disposal_methods: string[]
}

export interface ComplianceTemplate {
  jurisdiction_id: string
  report_type: string
  template_version: string
  required_sections: string[]
  data_mapping: Record<string, string> // Maps Trazo fields to report fields
  validation_rules: Record<string, unknown>
}

export type PlantType = 'cannabis' | 'produce'
export type JurisdictionId = 
  | 'oregon_cannabis'
  | 'maryland_cannabis' 
  | 'canada_cannabis'
  | 'primus_gfs'
  | 'michigan_cannabis'
  | 'california_cannabis'
  | 'nevada_cannabis'

export interface JurisdictionContext {
  jurisdiction: JurisdictionConfig
  organization_id: string
  site_id?: string
  effective_date: string
}