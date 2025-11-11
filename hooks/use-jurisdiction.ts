'use client'

import { useCallback } from 'react'
import type { JurisdictionConfig, JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import { 
  getJurisdictionConfig,
  getWasteReasons,
  getDisposalMethods,
  getAllowedBatchStages,
  isBatchStageTransitionAllowed,
  getComplianceReportTypes,
  jurisdictionSupports,
  getJurisdictionsByPlantType,
  getAllJurisdictions
} from '@/lib/jurisdiction/config'

export interface UseJurisdictionReturn {
  jurisdiction: JurisdictionConfig | null
  getWasteReasons: () => string[]
  getDisposalMethods: () => string[]
  getAllowedBatchStages: () => string[]
  isStageTransitionAllowed: (fromStage: string, toStage: string) => boolean
  getComplianceReportTypes: () => string[]
  supports: (feature: string) => boolean
  requiresPlantTags: boolean
  requiresMetrc: boolean
  requiresWitness: boolean
  isCannabiJurisdiction: boolean
  isProduceJurisdiction: boolean
}

/**
 * React hook for accessing jurisdiction-specific rules and functions
 */
export function useJurisdiction(jurisdictionId: JurisdictionId | null | undefined): UseJurisdictionReturn {
  const jurisdiction = jurisdictionId ? getJurisdictionConfig(jurisdictionId) : null

  const getWasteReasonsCallback = useCallback((): string[] => {
    return jurisdictionId ? getWasteReasons(jurisdictionId) : []
  }, [jurisdictionId])

  const getDisposalMethodsCallback = useCallback((): string[] => {
    return jurisdictionId ? getDisposalMethods(jurisdictionId) : []
  }, [jurisdictionId])

  const getAllowedBatchStagesCallback = useCallback((): string[] => {
    return jurisdictionId ? getAllowedBatchStages(jurisdictionId) : []
  }, [jurisdictionId])

  const isStageTransitionAllowed = useCallback((fromStage: string, toStage: string): boolean => {
    return jurisdictionId ? isBatchStageTransitionAllowed(jurisdictionId, fromStage, toStage) : false
  }, [jurisdictionId])

  const getComplianceReportTypesCallback = useCallback((): string[] => {
    return jurisdictionId ? getComplianceReportTypes(jurisdictionId) : []
  }, [jurisdictionId])

  const supports = useCallback((feature: string): boolean => {
    return jurisdictionId ? jurisdictionSupports(jurisdictionId, feature) : false
  }, [jurisdictionId])

  // Computed properties for common checks
  const requiresPlantTags = jurisdiction?.rules.batch.require_plant_tags || false
  const requiresMetrc = jurisdiction?.rules.batch.require_metrc_id || false
  const requiresWitness = jurisdiction?.rules.waste.require_witness || false
  const isCannabiJurisdiction = jurisdiction?.plant_type === 'cannabis'
  const isProduceJurisdiction = jurisdiction?.plant_type === 'produce'

  return {
    jurisdiction,
    getWasteReasons: getWasteReasonsCallback,
    getDisposalMethods: getDisposalMethodsCallback,
    getAllowedBatchStages: getAllowedBatchStagesCallback,
    isStageTransitionAllowed,
    getComplianceReportTypes: getComplianceReportTypesCallback,
    supports,
    requiresPlantTags,
    requiresMetrc,
    requiresWitness,
    isCannabiJurisdiction,
    isProduceJurisdiction,
  }
}

/**
 * Hook for getting jurisdiction options for dropdowns
 */
export function useJurisdictionOptions(plantType?: PlantType) {
  return useCallback(() => {
    if (plantType) {
      return getJurisdictionsByPlantType(plantType).map((j: JurisdictionConfig) => ({
        value: j.id,
        label: j.name,
        country: j.country,
        plantType: j.plant_type,
      }))
    }
    
    return getAllJurisdictions().map((j: JurisdictionConfig) => ({
      value: j.id,
      label: j.name,
      country: j.country,
      plantType: j.plant_type,
    }))
  }, [plantType])
}