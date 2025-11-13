/**
 * Cross-Domain Validation Utilities
 * 
 * Business rule validations for both cannabis and produce domains
 */

import { DomainBatch, DomainLocation } from '../types/domains';
import { DomainType } from '../types/domains/base';

// ========================================
// Quantity Validation Rules
// ========================================

export interface QuantityValidationRule {
  minWeight: number;
  maxWeight?: number;
  unit: string;
  context: string;
}

const cannabisQuantityRules: Record<string, QuantityValidationRule> = {
  split: {
    minWeight: 0.1,
    unit: 'grams',
    context: 'METRC requires minimum 0.1g tracking precision'
  },
  waste: {
    minWeight: 0.1,
    unit: 'grams',
    context: 'All cannabis waste must be tracked per METRC'
  },
  transfer: {
    minWeight: 0.1,
    unit: 'grams',
    context: 'Transfer packages must meet METRC minimum weight'
  },
  merge: {
    minWeight: 0.1,
    maxWeight: 50000, // 50kg typical package limit
    unit: 'grams',
    context: 'METRC package weight limits'
  }
};

const produceQuantityRules: Record<string, QuantityValidationRule> = {
  split: {
    minWeight: 5,
    unit: 'grams',
    context: 'Minimum split quantity for traceability'
  },
  waste: {
    minWeight: 5,
    unit: 'grams',
    context: 'Food safety requires waste documentation for losses >5g'
  },
  transfer: {
    minWeight: 5,
    unit: 'grams',
    context: 'Minimum transfer quantity for efficiency'
  },
  merge: {
    minWeight: 5,
    maxWeight: 907185, // 1 ton (2000 lbs) in grams
    unit: 'grams',
    context: 'Practical handling and storage limits'
  }
};

export function getQuantityRules(domain: DomainType): Record<string, QuantityValidationRule> {
  return domain === 'cannabis' ? cannabisQuantityRules : produceQuantityRules;
}

export interface QuantityValidationResult {
  isValid: boolean;
  error?: string;
  rule?: QuantityValidationRule;
}

export function validateQuantity(
  domain: DomainType,
  operation: 'split' | 'waste' | 'transfer' | 'merge',
  quantity: number,
  unit: string
): QuantityValidationResult {
  const rules = getQuantityRules(domain);
  const rule = rules[operation];

  if (!rule) {
    return {
      isValid: false,
      error: `Unknown operation: ${operation}`
    };
  }

  // Check unit compatibility
  if (unit !== rule.unit) {
    return {
      isValid: false,
      error: `Unit mismatch: expected ${rule.unit}, got ${unit}`,
      rule
    };
  }

  // Check minimum
  if (quantity < rule.minWeight) {
    return {
      isValid: false,
      error: `Quantity ${quantity}${unit} is below minimum ${rule.minWeight}${rule.unit}. ${rule.context}`,
      rule
    };
  }

  // Check maximum if defined
  if (rule.maxWeight && quantity > rule.maxWeight) {
    return {
      isValid: false,
      error: `Quantity ${quantity}${unit} exceeds maximum ${rule.maxWeight}${rule.unit}. ${rule.context}`,
      rule
    };
  }

  return {
    isValid: true,
    rule
  };
}

// ========================================
// Stage Transition Rules
// ========================================

export interface StageTransitionRule {
  allowedNextStages: string[];
  requiredFields?: string[];
  minDuration?: number; // in days
  maxDuration?: number; // in days
  validationMessage?: string;
}

const cannabisStageRules: Record<string, StageTransitionRule> = {
  propagation: {
    allowedNextStages: ['vegetative'],
    requiredFields: ['plantCount'],
    minDuration: 7,
    validationMessage: 'Clones must root for minimum 7 days before vegetative stage'
  },
  vegetative: {
    allowedNextStages: ['flowering'],
    requiredFields: ['lightingSchedule'],
    minDuration: 14,
    validationMessage: 'Minimum 14 days vegetative growth required'
  },
  flowering: {
    allowedNextStages: ['harvest'],
    minDuration: 49,
    maxDuration: 90,
    validationMessage: 'Typical flowering period is 7-12 weeks'
  },
  harvest: {
    allowedNextStages: ['drying'],
    requiredFields: ['harvestDate'],
    validationMessage: 'Harvest date must be recorded'
  },
  drying: {
    allowedNextStages: ['curing'],
    minDuration: 7,
    maxDuration: 21,
    validationMessage: 'Drying typically takes 7-14 days'
  },
  curing: {
    allowedNextStages: ['testing'],
    minDuration: 14,
    validationMessage: 'Minimum 14 days curing required for quality'
  },
  testing: {
    allowedNextStages: ['packaging'],
    requiredFields: ['testResults'],
    validationMessage: 'Test results must be recorded before packaging'
  },
  packaging: {
    allowedNextStages: ['closed'],
    requiredFields: ['metrcPackageTag'],
    validationMessage: 'METRC package tag required'
  }
};

const produceStageRules: Record<string, StageTransitionRule> = {
  seeding: {
    allowedNextStages: ['germination'],
    requiredFields: ['seedLotNumber'],
    minDuration: 1,
    validationMessage: 'Record seed lot number before germination'
  },
  germination: {
    allowedNextStages: ['growing'],
    minDuration: 2,
    maxDuration: 14,
    validationMessage: 'Germination typically takes 2-7 days'
  },
  growing: {
    allowedNextStages: ['harvest'],
    minDuration: 21,
    validationMessage: 'Minimum growing period varies by crop type'
  },
  harvest: {
    allowedNextStages: ['grading', 'storage'],
    requiredFields: ['harvestDate'],
    validationMessage: 'Move to grading or storage within 2 hours of harvest'
  },
  grading: {
    allowedNextStages: ['ripening', 'packaging', 'storage'],
    requiredFields: ['gradeAssignment'],
    validationMessage: 'Grade assignment required'
  },
  ripening: {
    allowedNextStages: ['packaging'],
    minDuration: 1,
    maxDuration: 14,
    validationMessage: 'Ripening duration varies by produce type'
  },
  storage: {
    allowedNextStages: ['grading', 'packaging'],
    maxDuration: 30,
    validationMessage: 'Monitor shelf life - typical storage is 7-30 days'
  },
  packaging: {
    allowedNextStages: ['closed'],
    requiredFields: ['lotNumber', 'packagingDate'],
    validationMessage: 'Lot number and packaging date required for traceability'
  }
};

export function getStageRules(domain: DomainType): Record<string, StageTransitionRule> {
  return domain === 'cannabis' ? cannabisStageRules : produceStageRules;
}

export interface StageTransitionValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  rule?: StageTransitionRule;
}

export function validateStageTransition(
  domain: DomainType,
  currentStage: string,
  nextStage: string,
  batch?: DomainBatch
): StageTransitionValidationResult {
  const rules = getStageRules(domain);
  const rule = rules[currentStage];

  if (!rule) {
    return {
      isValid: true,
      warnings: [`No transition rules defined for stage: ${currentStage}`]
    };
  }

  // Check if transition is allowed
  if (!rule.allowedNextStages.includes(nextStage)) {
    return {
      isValid: false,
      error: `Cannot transition from ${currentStage} to ${nextStage}. Allowed stages: ${rule.allowedNextStages.join(', ')}`,
      rule
    };
  }

  const warnings: string[] = [];

  // Check required fields if batch provided
  if (batch && rule.requiredFields) {
    const missingFields = rule.requiredFields.filter(field => {
      return !batch[field as keyof DomainBatch];
    });

    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: `Missing required fields: ${missingFields.join(', ')}. ${rule.validationMessage || ''}`,
        rule
      };
    }
  }

  // Check duration if batch provided
  if (batch && batch.startDate) {
    const startDate = new Date(batch.startDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (rule.minDuration && daysDiff < rule.minDuration) {
      return {
        isValid: false,
        error: `Batch has been in ${currentStage} for ${daysDiff} days. Minimum ${rule.minDuration} days required. ${rule.validationMessage || ''}`,
        rule
      };
    }

    if (rule.maxDuration && daysDiff > rule.maxDuration) {
      warnings.push(
        `Batch has been in ${currentStage} for ${daysDiff} days, exceeding typical duration of ${rule.maxDuration} days. ${rule.validationMessage || ''}`
      );
    }
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    rule
  };
}

// ========================================
// Date & Timeline Validations
// ========================================

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export function validateHarvestDate(
  harvestDate: string,
  startDate: string,
  domain: DomainType
): DateValidationResult {
  const harvest = new Date(harvestDate);
  const start = new Date(startDate);
  const now = new Date();

  // Harvest date cannot be in the future
  if (harvest > now) {
    return {
      isValid: false,
      error: 'Harvest date cannot be in the future'
    };
  }

  // Harvest must be after start date
  if (harvest < start) {
    return {
      isValid: false,
      error: 'Harvest date cannot be before batch start date'
    };
  }

  const daysDiff = Math.floor((harvest.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const warnings: string[] = [];

  // Domain-specific timeline checks
  if (domain === 'cannabis') {
    if (daysDiff < 60) {
      warnings.push('Cannabis harvest in less than 60 days is unusually fast');
    }
    if (daysDiff > 180) {
      warnings.push('Cannabis cycle exceeding 180 days is unusually long');
    }
  } else {
    if (daysDiff < 21) {
      warnings.push('Produce harvest in less than 21 days may indicate early harvest');
    }
    if (daysDiff > 120) {
      warnings.push('Produce cycle exceeding 120 days is longer than typical');
    }
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

export function validatePackagingDate(
  packagingDate: string,
  harvestDate?: string
): DateValidationResult {
  const packaging = new Date(packagingDate);
  const now = new Date();

  // Packaging date cannot be in the future
  if (packaging > now) {
    return {
      isValid: false,
      error: 'Packaging date cannot be in the future'
    };
  }

  // If harvest date provided, packaging must be after
  if (harvestDate) {
    const harvest = new Date(harvestDate);
    if (packaging < harvest) {
      return {
        isValid: false,
        error: 'Packaging date cannot be before harvest date'
      };
    }

    const daysDiff = Math.floor((packaging.getTime() - harvest.getTime()) / (1000 * 60 * 60 * 24));
    const warnings: string[] = [];

    if (daysDiff > 60) {
      warnings.push('Packaging more than 60 days after harvest - verify shelf life');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  return { isValid: true };
}

export function validateStorageDuration(
  entryDate: string,
  currentDate: string,
  maxShelfLife: number
): DateValidationResult {
  const entry = new Date(entryDate);
  const current = new Date(currentDate);

  const daysDiff = Math.floor((current.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
  const warnings: string[] = [];

  if (daysDiff > maxShelfLife) {
    return {
      isValid: false,
      error: `Storage duration of ${daysDiff} days exceeds maximum shelf life of ${maxShelfLife} days`
    };
  }

  const percentUsed = (daysDiff / maxShelfLife) * 100;
  if (percentUsed > 75) {
    warnings.push(`${percentUsed.toFixed(0)}% of shelf life used - prioritize for distribution`);
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// ========================================
// Location Capacity Checks
// ========================================

export interface CapacityValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  availableCapacity?: number;
  utilizationPercent?: number;
}

export function validateLocationCapacity(
  location: DomainLocation,
  additionalPlantCount: number
): CapacityValidationResult {
  const currentCount = location.currentPlantCount || 0;
  const newTotal = currentCount + additionalPlantCount;

  if (newTotal > location.capacity) {
    return {
      isValid: false,
      error: `Location "${location.name}" would exceed capacity. Current: ${currentCount}, Adding: ${additionalPlantCount}, Capacity: ${location.capacity}`,
      availableCapacity: location.capacity - currentCount,
      utilizationPercent: 100
    };
  }

  const utilizationPercent = (newTotal / location.capacity) * 100;
  const warnings: string[] = [];

  if (utilizationPercent > 90) {
    warnings.push(`Location "${location.name}" will be at ${utilizationPercent.toFixed(0)}% capacity - consider alternative locations`);
  } else if (utilizationPercent > 75) {
    warnings.push(`Location "${location.name}" will be at ${utilizationPercent.toFixed(0)}% capacity`);
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    availableCapacity: location.capacity - newTotal,
    utilizationPercent
  };
}

export function validateAreaCapacity(
  location: DomainLocation,
  additionalArea: number
): CapacityValidationResult {
  if (!location.area) {
    return {
      isValid: true,
      warnings: ['Location does not have area tracking configured']
    };
  }

  const currentUsed = location.usedArea || 0;
  const newTotal = currentUsed + additionalArea;

  if (newTotal > location.area) {
    return {
      isValid: false,
      error: `Location "${location.name}" area would exceed capacity. Current: ${currentUsed} sq ft, Adding: ${additionalArea} sq ft, Capacity: ${location.area} sq ft`,
      availableCapacity: location.area - currentUsed,
      utilizationPercent: 100
    };
  }

  const utilizationPercent = (newTotal / location.area) * 100;
  const warnings: string[] = [];

  if (utilizationPercent > 90) {
    warnings.push(`Location "${location.name}" area will be at ${utilizationPercent.toFixed(0)}% - limited space remaining`);
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    availableCapacity: location.area - newTotal,
    utilizationPercent
  };
}

// ========================================
// Batch Compatibility Checks
// ========================================

export interface CompatibilityValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export function validateBatchMergeCompatibility(
  batches: DomainBatch[]
): CompatibilityValidationResult {
  if (batches.length < 2) {
    return {
      isValid: false,
      error: 'At least 2 batches required for merge operation'
    };
  }

  // Check domain consistency
  const domains = new Set(batches.map(b => b.domainType));
  if (domains.size > 1) {
    return {
      isValid: false,
      error: 'Cannot merge batches from different domains (cannabis/produce)'
    };
  }

  // Check cultivar consistency
  const cultivars = new Set(batches.map(b => b.cultivarId));
  if (cultivars.size > 1) {
    return {
      isValid: false,
      error: 'Cannot merge batches with different cultivars/varieties'
    };
  }

  // Check stage consistency
  const stages = new Set(batches.map(b => b.stage));
  if (stages.size > 1) {
    return {
      isValid: false,
      error: `Cannot merge batches in different stages: ${Array.from(stages).join(', ')}`
    };
  }

  // Check quarantine status
  const quarantinedBatches = batches.filter(b => b.quarantineStatus === 'quarantined');
  if (quarantinedBatches.length > 0) {
    return {
      isValid: false,
      error: `Cannot merge batches: ${quarantinedBatches.length} batch(es) are quarantined`
    };
  }

  const warnings: string[] = [];

  // Check if batches have different start dates (might indicate different vintages)
  const startDates = new Set(batches.map(b => b.startDate));
  if (startDates.size > 1) {
    warnings.push('Batches have different start dates - verify this merge is intentional');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

export function validateBatchSplitCompatibility(
  batch: DomainBatch,
  splitCount: number
): CompatibilityValidationResult {
  if (splitCount < 2) {
    return {
      isValid: false,
      error: 'Split operation requires at least 2 resulting batches'
    };
  }

  if (splitCount > 20) {
    return {
      isValid: false,
      error: 'Cannot split into more than 20 batches - use multiple split operations if needed'
    };
  }

  if (batch.quarantineStatus === 'quarantined') {
    return {
      isValid: false,
      error: 'Cannot split quarantined batch - release from quarantine first'
    };
  }

  if (batch.status === 'closed') {
    return {
      isValid: false,
      error: 'Cannot split closed batch'
    };
  }

  return { isValid: true };
}
