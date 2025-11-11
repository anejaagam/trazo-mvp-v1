import type { JurisdictionConfig } from '../types'

// Oregon Cannabis - Metrc Jurisdiction Configuration
export const OREGON_CANNABIS: JurisdictionConfig = {
  id: 'oregon_cannabis',
  name: 'Oregon Cannabis (Metrc)',
  country: 'us',
  state: 'oregon',
  plant_type: 'cannabis',
  rules: {
    batch: {
      require_license_number: true,
      require_metrc_id: true,
      allowed_stages: [
        'planning',
        'clone',
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
      require_plant_tags: true,
      tag_format: '1A4FF', // Oregon Metrc tag format
      require_genealogy: true,
      require_mother_plant_tracking: true,
    },
    waste: {
      allowed_reasons: [
        'Failed quality assurance',
        'Unhealthy or diseased plants',
        'Male plants (non-breeding)',
        'Excess trim or plant waste',
        'Contamination',
        'Failed testing',
        'Overproduction',
        'Product recall',
        'Damaged during processing',
        'End of shelf life',
        'Other (specify)',
      ],
      require_witness: true,
      require_photo: true,
      require_signature: true,
      disposal_methods: [
        'Rendered unusable and compostable',
        'Rendered unusable and disposed in landfill',
        'Hazardous waste disposal',
        'Incineration',
      ],
      require_rendering_unusable: true,
      minimum_witness_age: 21,
      require_state_license_check: true,
    },
    inventory: {
      track_lot_numbers: true,
      track_expiry: true,
      require_supplier_info: true,
      require_coa: true,
      track_package_tags: true,
      require_manifest_for_transfers: true,
    },
    compliance: {
      report_types: ['metrc_monthly', 'metrc_inventory', 'metrc_sales', 'metrc_transfers'],
      report_frequency: 'monthly',
      required_fields: [
        'license_number',
        'metrc_batch_id',
        'plant_tags',
        'waste_logs',
        'inventory_movements',
        'transfer_manifests',
        'test_results',
      ],
      submission_deadlines: {
        'metrc_monthly': 15, // 15 days after month end
        'metrc_inventory': 30,
        'metrc_transfers': 1, // Same day
      },
      authorities: ['Oregon Liquor and Cannabis Commission (OLCC)', 'Metrc'],
    },
    plant_tracking: {
      individual_plant_tags: true,
      tag_assignment_stage: 'vegetative',
      tag_format: '1A4FF...',
      track_plant_movements: true,
      require_plant_destruction_witness: true,
    },
  },
}