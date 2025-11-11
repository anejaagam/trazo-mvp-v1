import type { JurisdictionConfig } from '../types'

// PrimusGFS - Global Food Safety Initiative for Produce
export const PRIMUS_GFS: JurisdictionConfig = {
  id: 'primus_gfs',
  name: 'PrimusGFS (Produce)',
  country: 'us', // Can be US or Canada
  plant_type: 'produce',
  rules: {
    batch: {
      require_license_number: false,
      require_metrc_id: false,
      allowed_stages: [
        'planning',
        'germination',
        'vegetative',
        'harvest',
        'post_harvest',
        'packaging',
        'completed',
        'destroyed'
      ],
      min_plant_count: 1,
      max_plant_count: 999999,
      require_plant_tags: false,
      require_genealogy: false, // Not typically required for produce
      require_mother_plant_tracking: false,
    },
    waste: {
      allowed_reasons: [
        'Pest infestation',
        'Disease',
        'Quality control failure',
        'Overproduction',
        'Damage during handling',
        'Failed food safety testing',
        'Contamination',
        'End of harvest cycle',
        'Weather damage',
        'Equipment malfunction',
        'Other (specify)',
      ],
      require_witness: false, // Not typically required for produce
      require_photo: true,
      require_signature: false,
      disposal_methods: [
        'Composted',
        'Municipal landfill',
        'Animal feed (if approved)',
        'Anaerobic digestion',
        'Other approved method',
      ],
      require_rendering_unusable: false,
      require_state_license_check: false,
    },
    inventory: {
      track_lot_numbers: true,
      track_expiry: true,
      require_supplier_info: true,
      require_coa: false, // Not always required for produce
      track_package_tags: false,
      require_manifest_for_transfers: false,
    },
    compliance: {
      report_types: ['primus_gfs_audit', 'food_safety_plan', 'traceability_records'],
      report_frequency: 'annual',
      required_fields: [
        'food_safety_plan',
        'water_testing_logs',
        'soil_testing_logs',
        'sanitation_logs',
        'pest_control_logs',
        'harvest_logs',
        'post_harvest_logs',
        'traceability_records',
        'personnel_training_records',
      ],
      submission_deadlines: {
        'primus_gfs_audit': 30, // Before audit date
        'food_safety_plan': 365, // Annual update
        'traceability_records': 0, // Maintained continuously
      },
      authorities: ['PrimusGFS Certification Body', 'FDA (if applicable)', 'CFIA (if Canada)'],
    },
    food_safety: {
      require_haccp: true,
      require_gmp: true,
      water_testing_frequency: 'monthly',
      soil_testing_frequency: 'annually',
      pesticide_testing_required: true,
    },
  },
}