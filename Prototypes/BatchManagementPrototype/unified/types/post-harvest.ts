/**
 * Unified Post-Harvest Processing Types
 * 
 * Types for post-harvest workflows (primarily cannabis)
 */

export type ProcessingStage = 'drying' | 'curing' | 'packaging' | 'completed';

/**
 * Drying Record (Cannabis)
 */
export interface IDryingRecord {
  id: string;
  batchId: string;
  roomId: string;
  roomName: string;
  startDate: string;
  endDate?: string;
  startWeight: number;
  endWeight?: number;
  weightUnit: 'grams' | 'oz' | 'lbs';
  targetHumidity: number;
  targetTemperature: number;
  actualHumidity?: { min: number; avg: number; max: number };
  actualTemperature?: { min: number; avg: number; max: number };
  qualityNotes?: string;
  completedBy?: string;
}

/**
 * Curing Record (Cannabis)
 */
export interface ICuringRecord {
  id: string;
  batchId: string;
  containerType: 'jar' | 'bin' | 'bag' | 'grove_bag';
  containerCount: number;
  startDate: string;
  endDate?: string;
  targetDuration: number; // days
  startWeight: number;
  endWeight?: number;
  weightUnit: 'grams' | 'oz' | 'lbs';
  burpingSchedule?: string;
  humidityRange?: { min: number; max: number };
  qualityNotes?: string;
  completedBy?: string;
}

/**
 * Packaging Record
 */
export interface IPackagingRecord {
  id: string;
  batchId: string;
  packageDate: string;
  packageType: string;
  packageCount: number;
  totalWeight: number;
  weightUnit: 'grams' | 'oz' | 'lbs';
  packagesCreated: {
    packageId: string;
    weight: number;
    label: string;
    metrcTag?: string; // Cannabis only
  }[];
  packagedBy: string;
  qualityCheck: boolean;
  qualityCheckBy?: string;
  metrcReported?: boolean; // Cannabis
  metrcReportedAt?: string; // Cannabis
  notes?: string;
}

/**
 * Grading Record (Produce)
 */
export interface IGradingRecord {
  id: string;
  batchId: string;
  gradingDate: string;
  gradedBy: string;
  totalWeight: number;
  weightUnit: 'lbs' | 'kg';
  gradeDistribution: {
    gradeA?: number;
    gradeB?: number;
    gradeC?: number;
    premium?: number;
    reject?: number;
  };
  sizeDistribution?: {
    small?: number;
    medium?: number;
    large?: number;
    extraLarge?: number;
  };
  qualityMetrics?: {
    brix?: number;
    firmness?: number;
    colorScore?: number;
  };
  notes?: string;
}

/**
 * Washing Record (Produce)
 */
export interface IWashingRecord {
  id: string;
  batchId: string;
  washDate: string;
  washedBy: string;
  washMethod: 'water' | 'sanitizer' | 'triple_wash';
  sanitizerType?: string;
  sanitizerConcentration?: number;
  waterTemp?: number;
  weight: number;
  weightUnit: 'lbs' | 'kg';
  notes?: string;
}

/**
 * Sorting Record (Produce)
 */
export interface ISortingRecord {
  id: string;
  batchId: string;
  sortingDate: string;
  sortedBy: string;
  sortingCriteria: ('size' | 'color' | 'ripeness' | 'quality')[];
  totalProcessed: number;
  weightUnit: 'lbs' | 'kg';
  notes?: string;
}
