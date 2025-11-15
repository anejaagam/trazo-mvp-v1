/**
 * Batch Validation Utilities
 * 
 * Domain-specific validation rules for batch creation and management
 * Supports cannabis and produce operations with jurisdiction-based rules
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
  DomainType,
  CannabisStage,
  ProduceStage,
  BatchStage,
  InsertBatch,
  UpdateBatch,
  ValidationResult,
  StageTransitionValidation,
} from '@/types/batch';

/**
 * Validate batch creation data
 */
export function validateBatchCreation(
  data: InsertBatch,
  jurisdiction?: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!data.organization_id) errors.push('Organization ID is required');
  if (!data.site_id) errors.push('Site ID is required');
  if (!data.batch_number) errors.push('Batch number is required');
  if (!data.stage) errors.push('Initial stage is required');
  if (!data.start_date) errors.push('Start date is required');

  // Batch number format validation
  if (data.batch_number && !/^[A-Z0-9-]+$/i.test(data.batch_number)) {
    errors.push('Batch number must contain only letters, numbers, and hyphens');
  }

  // Plant count validation
  if (data.plant_count !== undefined && data.plant_count < 0) {
    errors.push('Plant count cannot be negative');
  }

  // Domain-specific validation
  if (data.domain_type === 'cannabis') {
    validateCannabisCreation(data, jurisdiction, errors, warnings);
  } else if (data.domain_type === 'produce') {
    validateProduceCreation(data, errors, warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate cannabis-specific batch creation
 */
function validateCannabisCreation(
  data: InsertBatch,
  jurisdiction: string | undefined,
  errors: string[],
  warnings: string[]
): void {
  // Lighting schedule validation
  if (data.lighting_schedule) {
    const validSchedules = ['18/6', '12/12', '24/0', '16/8', '20/4'];
    if (!validSchedules.includes(data.lighting_schedule)) {
      warnings.push(
        `Non-standard lighting schedule: ${data.lighting_schedule}. Common schedules are ${validSchedules.join(', ')}`
      );
    }
  }

  // Minimum plant count for cannabis (jurisdiction-specific)
  if (data.plant_count !== undefined) {
    if (jurisdiction === 'oregon' || jurisdiction === 'maryland') {
      // METRC jurisdictions - minimum 1 plant for individual tracking
      if (data.plant_count < 1) {
        errors.push('METRC jurisdictions require at least 1 plant for tracking');
      }
    }
  }

  // Source type validation for cannabis
  if (data.source_type && !['seed', 'clone', 'tissue_culture'].includes(data.source_type)) {
    errors.push('Cannabis source type must be seed, clone, or tissue_culture');
  }

  // Clones require parent batch
  if (data.source_type === 'clone' && !data.parent_batch_id && !data.source_batch_id) {
    warnings.push('Clone batches should reference a parent or source batch for genealogy tracking');
  }
}

/**
 * Validate produce-specific batch creation
 */
function validateProduceCreation(
  data: InsertBatch,
  errors: string[],
  warnings: string[]
): void {
  // Grade validation
  if (data.grade && !['A', 'B', 'C', 'culled'].includes(data.grade)) {
    errors.push('Produce grade must be A, B, C, or culled');
  }

  // Ripeness validation
  if (data.ripeness && !['unripe', 'turning', 'ripe', 'overripe'].includes(data.ripeness)) {
    errors.push('Produce ripeness must be unripe, turning, ripe, or overripe');
  }

  // Certifications validation
  if (data.certifications) {
    const validCertKeys = ['organic', 'gap', 'primus_gfs'];
    const invalidKeys = Object.keys(data.certifications).filter(
      (key) => !validCertKeys.includes(key) && key !== 'other'
    );
    if (invalidKeys.length > 0) {
      warnings.push(`Non-standard certification keys: ${invalidKeys.join(', ')}`);
    }
  }
}

/**
 * Validate stage transition
 */
export function validateStageTransition(
  currentStage: BatchStage,
  newStage: BatchStage,
  domainType: DomainType
): StageTransitionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredFields: string[] = [];
  const requiredChecks: string[] = [];

  // Get allowed transitions for domain
  const allowedNextStages = getAllowedNextStages(currentStage, domainType);

  // Check if transition is valid
  if (!allowedNextStages.includes(newStage)) {
    errors.push(
      `Cannot transition from ${currentStage} to ${newStage}. Allowed stages: ${allowedNextStages.join(', ')}`
    );
  }

  // Domain-specific transition requirements
  if (domainType === 'cannabis') {
    validateCannabisTransition(currentStage as CannabisStage, newStage as CannabisStage, requiredFields, requiredChecks, warnings);
  } else if (domainType === 'produce') {
    validateProduceTransition(currentStage as ProduceStage, newStage as ProduceStage, requiredFields, requiredChecks, warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    allowedNextStages,
    requiredFields,
    requiredChecks,
  };
}

/**
 * Get allowed next stages for a given stage and domain
 */
function getAllowedNextStages(stage: BatchStage, domainType: DomainType): BatchStage[] {
  if (domainType === 'cannabis') {
    const cannabisTransitions: Record<CannabisStage, CannabisStage[]> = {
      planning: ['germination', 'clone'],
      germination: ['clone', 'vegetative'],
      clone: ['vegetative'],
      vegetative: ['flowering', 'destroyed'],
      flowering: ['harvest', 'destroyed'],
      harvest: ['drying', 'destroyed'],
      drying: ['curing', 'packaging', 'destroyed'],
      curing: ['packaging', 'destroyed'],
      packaging: ['completed', 'destroyed'],
      completed: [],
      destroyed: [],
    };
    return cannabisTransitions[stage as CannabisStage] || [];
  } else {
    const produceTransitions: Record<ProduceStage, ProduceStage[]> = {
      planning: ['seeding', 'germination'],
      seeding: ['germination', 'destroyed'],
      germination: ['seedling', 'destroyed'],
      seedling: ['transplant', 'growing', 'destroyed'],
      transplant: ['growing', 'destroyed'],
      growing: ['harvest_ready', 'destroyed'],
      harvest_ready: ['harvesting', 'destroyed'],
      harvesting: ['washing', 'grading', 'destroyed'],
      washing: ['grading', 'packing'],
      grading: ['packing', 'destroyed'],
      packing: ['storage', 'shipped'],
      storage: ['shipped', 'destroyed'],
      shipped: ['completed'],
      completed: [],
      destroyed: [],
    };
    return produceTransitions[stage as ProduceStage] || [];
  }
}

/**
 * Validate cannabis stage transitions
 */
function validateCannabisTransition(
  from: CannabisStage,
  to: CannabisStage,
  requiredFields: string[],
  requiredChecks: string[],
  warnings: string[]
): void {
  switch (to) {
    case 'flowering':
      requiredFields.push('lighting_schedule');
      requiredChecks.push('Verify lighting changed to 12/12 for flowering');
      requiredChecks.push('Ensure plants are sexually mature');
      break;
    case 'harvest':
      requiredChecks.push('Verify trichome development (cloudy/amber ratio)');
      requiredChecks.push('Check for any pest or disease issues');
      break;
    case 'drying':
      requiredFields.push('actual_harvest_date');
      requiredChecks.push('Record wet weight');
      requiredChecks.push('Ensure proper drying conditions (60-65°F, 55-62% RH)');
      break;
    case 'curing':
      requiredChecks.push('Verify dry weight recorded');
      requiredChecks.push('Check moisture content (10-12%)');
      requiredChecks.push('Ensure curing jars/containers prepared');
      break;
    case 'packaging':
      requiredChecks.push('Obtain lab test results (THC/CBD/microbial)');
      requiredChecks.push('Verify compliance with jurisdiction requirements');
      break;
    case 'completed':
      requiredFields.push('yield_weight_g');
      requiredChecks.push('Final quality assessment complete');
      requiredChecks.push('All packaging and labeling complete');
      break;
  }
}

/**
 * Validate produce stage transitions
 */
function validateProduceTransition(
  from: ProduceStage,
  to: ProduceStage,
  requiredFields: string[],
  requiredChecks: string[],
  warnings: string[]
): void {
  switch (to) {
    case 'harvest_ready':
      requiredChecks.push('Verify ripeness/maturity indicators');
      requiredChecks.push('Check for optimal harvest window');
      break;
    case 'harvesting':
      requiredChecks.push('Record harvest date and time');
      requiredChecks.push('Note weather conditions');
      break;
    case 'washing':
      requiredChecks.push('Ensure food safety protocols followed');
      requiredChecks.push('Check water quality');
      break;
    case 'grading':
      requiredFields.push('grade');
      requiredChecks.push('Perform visual quality inspection');
      requiredChecks.push('Measure size/weight standards');
      break;
    case 'packing':
      requiredChecks.push('Verify packaging materials food-safe');
      requiredChecks.push('Label with required information');
      break;
    case 'storage':
      requiredFields.push('storage_temp_c', 'storage_humidity_pct');
      requiredChecks.push('Set proper storage temperature');
      requiredChecks.push('Monitor humidity levels');
      break;
    case 'completed':
      requiredFields.push('yield_weight_g');
      requiredChecks.push('Final quality check complete');
      break;
  }
}

/**
 * Validate plant count update
 */
export function validatePlantCount(
  newCount: number,
  domainType: DomainType,
  jurisdiction?: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (newCount < 0) {
    errors.push('Plant count cannot be negative');
  }

  if (!Number.isInteger(newCount)) {
    errors.push('Plant count must be a whole number');
  }

  // Jurisdiction-specific validation
  if (domainType === 'cannabis') {
    if (jurisdiction === 'oregon' || jurisdiction === 'maryland') {
      if (newCount < 1) {
        errors.push('METRC jurisdictions require at least 1 plant');
      }
    }
  }

  // Produce typically has higher counts
  if (domainType === 'produce' && newCount < 5) {
    warnings.push('Produce batches typically have at least 5 plants');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate harvest data
 */
export function validateHarvestData(
  harvestData: {
    wet_weight: number;
    plant_count: number;
    harvested_at: string;
  }
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Weight validation
  if (harvestData.wet_weight <= 0) {
    errors.push('Harvest weight must be greater than 0');
  }

  // Plant count validation
  if (harvestData.plant_count <= 0) {
    errors.push('Plant count must be greater than 0');
  }

  if (!Number.isInteger(harvestData.plant_count)) {
    errors.push('Plant count must be a whole number');
  }

  // Date validation
  try {
    const harvestDate = new Date(harvestData.harvested_at);
    const now = new Date();
    
    if (harvestDate > now) {
      errors.push('Harvest date cannot be in the future');
    }

    // Warn if harvest date is more than 7 days old
    const daysDiff = (now.getTime() - harvestDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) {
      warnings.push('Harvest date is more than 7 days old - ensure this is correct');
    }
  } catch (error) {
    errors.push('Invalid harvest date format');
  }

  // Calculate average weight per plant
  if (harvestData.wet_weight > 0 && harvestData.plant_count > 0) {
    const avgWeight = harvestData.wet_weight / harvestData.plant_count;
    
    // Cannabis typical range: 50-500g per plant
    if (avgWeight < 10) {
      warnings.push(`Low average weight per plant: ${avgWeight.toFixed(2)}g`);
    } else if (avgWeight > 1000) {
      warnings.push(`High average weight per plant: ${avgWeight.toFixed(2)}g - verify measurements`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
