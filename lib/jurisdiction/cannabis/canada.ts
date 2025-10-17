import type { JurisdictionConfig } from '../types'

// Canada Cannabis - Health Canada Jurisdiction Configuration
export const CANADA_CANNABIS: JurisdictionConfig = {
  id: 'canada_cannabis',
  name: 'Canada Cannabis (Health Canada)',
  country: 'canada',
  plant_type: 'cannabis',
  rules: {
    batch: {
      require_license_number: true,
      require_metrc_id: false, // Canada uses CTLS, not Metrc
      allowed_stages: [
        'planning',
        'germination',
        'vegetative',
        'flowering', 
        'harvest',
        'drying',
        'curing',
        'packaging',
        'completed',
        'destroyed'
      ],
      min_plant_count: 1,
      max_plant_count: 99999,
      require_plant_tags: false, // Canada tracks by batch, not individual plants
      require_genealogy: true,
      require_mother_plant_tracking: true,
    },
    waste: {
      allowed_reasons: [
        'Quality control failure',
        'Contamination',
        'Overgrowth exceeding canopy limits',
        'Pest infestation',
        'Disease',
        'Failed testing',
        'Expired product',
        'Damaged product',
        'Production errors',
        'Trim and plant waste',
        'Other (specify)',
      ],
      require_witness: true,
      require_photo: true,
      require_signature: true,
      disposal_methods: [
        'Composted with non-cannabis organic waste',
        'Municipal solid waste landfill',
        'Incineration',
        'Other method approved by Health Canada',
      ],
      require_rendering_unusable: true,
      minimum_witness_age: 19, // Provincial age of majority
      require_state_license_check: false,
    },
    inventory: {
      track_lot_numbers: true,
      track_expiry: true,
      require_supplier_info: true,
      require_coa: true,
      track_package_tags: false,
      require_manifest_for_transfers: true,
    },
    compliance: {
      report_types: ['ctls_monthly', 'health_canada_annual', 'inventory_report'],
      report_frequency: 'monthly',
      required_fields: [
        'license_number',
        'batch_number',
        'environmental_monitoring_logs',
        'waste_logs',
        'security_logs',
        'inventory_records',
        'quality_control_records',
        'personnel_records',
      ],
      submission_deadlines: {
        'ctls_monthly': 15, // 15 days after month end
        'health_canada_annual': 90, // 90 days after year end
        'inventory_report': 30,
      },
      authorities: ['Health Canada', 'Provincial Cannabis Control Board'],
    },
    plant_tracking: {
      individual_plant_tags: false,
      tag_assignment_stage: 'not_applicable',
      tag_format: 'batch_based',
      track_plant_movements: false,
      require_plant_destruction_witness: true,
    },
  },
}