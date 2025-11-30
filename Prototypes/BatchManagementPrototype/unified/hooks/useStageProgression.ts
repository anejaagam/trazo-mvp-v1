/**
 * useStageProgression Hook
 * 
 * Domain-aware stage progression and workflow management
 */

import { useCallback, useMemo } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { 
  getStageProgressions, 
  isValidTransition, 
  getNextStages,
  type StageProgression 
} from '../config/stageProgressions';
import type { DomainBatch } from '../types/domains';

export interface StageInfo {
  id: string;
  label: string;
  description: string;
  duration?: string;
  color?: string;
  requirements?: string[];
}

export interface UseStageProgressionReturn {
  // Stage information
  currentStage: StageProgression | undefined;
  allStages: StageProgression[];
  availableTransitions: StageProgression[];
  stageIndex: number;
  totalStages: number;
  progressPercentage: number;
  
  // Validation
  canTransitionTo: (targetStage: string) => boolean;
  validateTransition: (targetStage: string) => {
    valid: boolean;
    errors: string[];
  };
  
  // Stage helpers
  isFirstStage: boolean;
  isFinalStage: boolean;
  previousStages: StageProgression[];
  futureStages: StageProgression[];
}

/**
 * Domain-aware stage progression hook
 */
export function useStageProgression(batch: DomainBatch | null): UseStageProgressionReturn {
  const { domain } = useDomain();

  // Get all stages for current domain
  const allStages = useMemo(() => {
    return getStageProgressions(domain);
  }, [domain]);

  // Get current stage info
  const currentStage = useMemo(() => {
    if (!batch) return undefined;
    return allStages.find((s: StageProgression) => s.stage === batch.stage);
  }, [batch, allStages]);

  // Get current stage index
  const stageIndex = useMemo(() => {
    if (!currentStage) return -1;
    return allStages.findIndex((s: StageProgression) => s.stage === currentStage.stage);
  }, [currentStage, allStages]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (stageIndex < 0 || allStages.length === 0) return 0;
    return Math.round((stageIndex / (allStages.length - 1)) * 100);
  }, [stageIndex, allStages]);

  // Get available transitions
  const availableTransitions = useMemo(() => {
    if (!batch) return [];
    const nextStageObjects = getNextStages(domain, batch.stage);
    return nextStageObjects;
  }, [batch, domain]);

  // Check if can transition to target stage
  const canTransitionTo = useCallback((targetStage: string): boolean => {
    if (!batch) return false;
    return isValidTransition(domain, batch.stage, targetStage);
  }, [batch, domain]);

  // Validate transition with detailed errors
  const validateTransition = useCallback((targetStage: string): {
    valid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (!batch) {
      errors.push('No batch selected');
      return { valid: false, errors };
    }

    // Check if transition is valid
    if (!isValidTransition(domain, batch.stage, targetStage)) {
      errors.push(`Cannot transition from ${batch.stage} to ${targetStage}`);
    }

    // Check batch status
    if (batch.status === 'closed') {
      errors.push('Cannot transition closed batch');
    }

    if (batch.quarantineStatus === 'quarantined') {
      errors.push('Batch is quarantined - release before transitioning');
    }

    // Domain-specific validations
    if (domain === 'cannabis') {
      // Cannabis-specific checks
      if (targetStage === 'flowering' && batch.plantCount === 0) {
        errors.push('Must have plants to transition to flowering');
      }
      
      if (targetStage === 'testing') {
        if (!batch.harvestDate) {
          errors.push('Must have harvest date before testing');
        }
      }
    } else {
      // Produce-specific checks
      if (targetStage === 'harvest') {
        if (!batch.harvestDate) {
          errors.push('Harvest date must be set');
        }
      }
      
      if (targetStage === 'packaging' && batch.plantCount === 0) {
        errors.push('No product to package');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [batch, domain]);

  // Calculate previous and future stages
  const previousStages = useMemo(() => {
    if (stageIndex <= 0) return [];
    return allStages.slice(0, stageIndex);
  }, [stageIndex, allStages]);

  const futureStages = useMemo(() => {
    if (stageIndex < 0 || stageIndex >= allStages.length - 1) return [];
    return allStages.slice(stageIndex + 1);
  }, [stageIndex, allStages]);

  return {
    currentStage,
    allStages,
    availableTransitions,
    stageIndex,
    totalStages: allStages.length,
    progressPercentage,
    canTransitionTo,
    validateTransition,
    isFirstStage: stageIndex === 0,
    isFinalStage: stageIndex === allStages.length - 1,
    previousStages,
    futureStages,
  };
}
