/**
 * Validation Hooks
 * 
 * React hooks for using validation utilities in components
 */

import { useCallback } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { DomainBatch, DomainLocation } from '../types/domains';
import {
  validateQuantity,
  validateStageTransition,
  validateHarvestDate,
  validatePackagingDate,
  validateStorageDuration,
  validateLocationCapacity,
  validateAreaCapacity,
  validateBatchMergeCompatibility,
  validateBatchSplitCompatibility,
  getQuantityRules,
  getStageRules,
  QuantityValidationResult,
  StageTransitionValidationResult,
  DateValidationResult,
  CapacityValidationResult,
  CompatibilityValidationResult
} from '../lib/validations';

/**
 * Hook for validating batch quantities for operations
 */
export function useQuantityValidation() {
  const { domain } = useDomain();

  const validate = useCallback(
    (
      operation: 'split' | 'waste' | 'transfer' | 'merge',
      quantity: number,
      unit: string
    ): QuantityValidationResult => {
      return validateQuantity(domain, operation, quantity, unit);
    },
    [domain]
  );

  const getRules = useCallback(() => {
    return getQuantityRules(domain);
  }, [domain]);

  return { validate, getRules };
}

/**
 * Hook for validating stage transitions
 */
export function useStageTransitionValidation() {
  const { domain } = useDomain();

  const validate = useCallback(
    (
      currentStage: string,
      nextStage: string,
      batch?: DomainBatch
    ): StageTransitionValidationResult => {
      return validateStageTransition(domain, currentStage, nextStage, batch);
    },
    [domain]
  );

  const getRules = useCallback(() => {
    return getStageRules(domain);
  }, [domain]);

  const getAllowedNextStages = useCallback(
    (currentStage: string): string[] => {
      const rules = getStageRules(domain);
      return rules[currentStage]?.allowedNextStages || [];
    },
    [domain]
  );

  return { validate, getRules, getAllowedNextStages };
}

/**
 * Hook for validating dates and timelines
 */
export function useDateValidation() {
  const { domain } = useDomain();

  const validateHarvest = useCallback(
    (harvestDate: string, startDate: string): DateValidationResult => {
      return validateHarvestDate(harvestDate, startDate, domain);
    },
    [domain]
  );

  const validatePackaging = useCallback(
    (packagingDate: string, harvestDate?: string): DateValidationResult => {
      return validatePackagingDate(packagingDate, harvestDate);
    },
    []
  );

  const validateStorage = useCallback(
    (entryDate: string, currentDate: string, maxShelfLife: number): DateValidationResult => {
      return validateStorageDuration(entryDate, currentDate, maxShelfLife);
    },
    []
  );

  return {
    validateHarvest,
    validatePackaging,
    validateStorage
  };
}

/**
 * Hook for validating location capacity
 */
export function useCapacityValidation() {
  const validatePlantCapacity = useCallback(
    (location: DomainLocation, additionalPlantCount: number): CapacityValidationResult => {
      return validateLocationCapacity(location, additionalPlantCount);
    },
    []
  );

  const validateArea = useCallback(
    (location: DomainLocation, additionalArea: number): CapacityValidationResult => {
      return validateAreaCapacity(location, additionalArea);
    },
    []
  );

  return {
    validatePlantCapacity,
    validateArea
  };
}

/**
 * Hook for validating batch compatibility
 */
export function useBatchCompatibilityValidation() {
  const validateMerge = useCallback(
    (batches: DomainBatch[]): CompatibilityValidationResult => {
      return validateBatchMergeCompatibility(batches);
    },
    []
  );

  const validateSplit = useCallback(
    (batch: DomainBatch, splitCount: number): CompatibilityValidationResult => {
      return validateBatchSplitCompatibility(batch, splitCount);
    },
    []
  );

  return {
    validateMerge,
    validateSplit
  };
}

/**
 * Combined validation hook - provides all validation functions
 */
export function useValidation() {
  const quantityValidation = useQuantityValidation();
  const stageValidation = useStageTransitionValidation();
  const dateValidation = useDateValidation();
  const capacityValidation = useCapacityValidation();
  const compatibilityValidation = useBatchCompatibilityValidation();

  return {
    quantity: quantityValidation,
    stage: stageValidation,
    date: dateValidation,
    capacity: capacityValidation,
    compatibility: compatibilityValidation
  };
}
