/**
 * Cannabis Domain Types
 * 
 * Cannabis-specific extensions of base types with METRC compliance support
 */

import {
  IBatch,
  ILocation,
  ICultivar,
  IYieldData
} from './base';

// Cannabis-specific batch stages
export type CannabisBatchStage = 
  | 'propagation' 
  | 'vegetative' 
  | 'flowering' 
  | 'harvest' 
  | 'drying' 
  | 'curing'
  | 'testing'
  | 'packaging'
  | 'closed';

// Cannabis room types
export type CannabisRoomType = 
  | 'mother' 
  | 'clone' 
  | 'vegetative' 
  | 'flowering' 
  | 'drying' 
  | 'curing' 
  | 'processing'
  | 'testing'
  | 'storage';

// Cannabis strain types
export type StrainType = 
  | 'indica' 
  | 'sativa' 
  | 'hybrid' 
  | 'indica-dominant' 
  | 'sativa-dominant';

// Cannabis-specific quality metric types
export type CannabisQualityMetricType =
  | 'thc'
  | 'cbd'
  | 'cbg'
  | 'cbn'
  | 'terpene'
  | 'moisture'
  | 'density'
  | 'trichome_development';

/**
 * Cannabis Batch Interface
 */
export interface ICannabisBatch extends IBatch {
  domainType: 'cannabis';
  stage: CannabisBatchStage;
  podIds: string[]; // Cannabis uses "pods"
  
  // METRC Integration
  metrcPackageTag?: string;
  metrcSourcePackageTags?: string[];
  metrcPlantTags?: string[];
  
  // Cannabis-specific yield
  yieldData?: ICannabisYieldData;
  
  // Cannabis-specific tracking
  motherPlantId?: string;
  isMotherPlant?: boolean;
  lightingSchedule?: string; // e.g., "18/6", "12/12"
}

/**
 * Cannabis Location (Pod/Room)
 */
export interface ICannabisLocation extends ILocation {
  domainType: 'cannabis';
  roomType: CannabisRoomType;
  canopyArea?: number; // sq ft
  usedCanopyArea?: number;
  lightingWatts?: number;
  lightingType?: string; // LED, HPS, CMH, etc.
  metrcLocationId?: string;
}

/**
 * Cannabis Cultivar (Strain)
 */
export interface ICannabisCultivar extends ICultivar {
  domainType: 'cannabis';
  strainType: StrainType;
  genetics: string; // Parent strains
  thcRange?: { min: number; max: number };
  cbdRange?: { min: number; max: number };
  cbgRange?: { min: number; max: number };
  terpeneProfile?: string[]; // Dominant terpenes
  floweringTime?: number; // Days
  growthCharacteristics?: string; // Stretch, branching, structure
  metrcStrainId?: string;
}

/**
 * Cannabis Yield Data
 */
export interface ICannabisYieldData extends IYieldData {
  wetWeight?: number; // grams
  dryWeight?: number; // grams
  unit: 'grams' | 'oz';
  
  // Potency results
  totalTHC?: number; // percentage
  totalCBD?: number; // percentage
  totalCBG?: number; // percentage
  totalCBN?: number; // percentage
  
  // Quality breakdown
  gradeA?: number; // Premium buds
  gradeB?: number; // Secondary buds
  trim?: number; // Trim for extraction
  shake?: number; // Shake
}

/**
 * Cannabis Plant Tag
 */
export interface ICannabisPlantTag {
  id: string;
  batchId: string;
  metrcTag: string;
  plantNumber: number;
  status: 'active' | 'harvested' | 'destroyed' | 'lost';
  assignedAt: string;
  assignedBy?: string;
}

/**
 * Cannabis Test Result
 */
export interface ICannabisTestResult {
  id: string;
  batchId: string;
  testType: 'potency' | 'microbial' | 'pesticide' | 'heavy_metals' | 'moisture';
  labName: string;
  labLicense?: string;
  sampleDate: string;
  resultDate: string;
  passed: boolean;
  results: Record<string, any>;
  certificateUrl?: string;
  metrcTestResultId?: string;
}

/**
 * Cannabis Waste Record
 */
export interface ICannabisWasteRecord {
  id: string;
  batchId?: string;
  wasteType: 'plant_waste' | 'harvest_waste' | 'product_waste';
  weight: number;
  unit: 'grams' | 'oz' | 'lbs';
  reason: string;
  disposalMethod: string;
  disposedAt: string;
  disposedBy: string;
  approvedBy?: string;
  witnessedBy?: string;
  metrcWasteId?: string;
  evidenceUrls?: string[];
}
