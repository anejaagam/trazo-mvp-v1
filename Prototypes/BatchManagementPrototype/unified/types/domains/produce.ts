/**
 * Produce Domain Types
 * 
 * Produce-specific extensions of base types with food safety compliance support
 */

import {
  IBatch,
  ILocation,
  ICultivar,
  IYieldData
} from './base';

// Produce-specific batch stages
export type ProduceBatchStage = 
  | 'seeding'
  | 'germination'
  | 'seedling' 
  | 'transplant' 
  | 'growing' 
  | 'pre_harvest'
  | 'harvest' 
  | 'washing' 
  | 'sorting'
  | 'grading'
  | 'ripening'
  | 'packaging'
  | 'storage'
  | 'closed';

// Produce growing area types
export type ProduceAreaType = 
  | 'greenhouse'
  | 'indoor'
  | 'outdoor'
  | 'hydroponics'
  | 'aquaponics'
  | 'field'
  | 'high_tunnel'
  | 'cold_storage'
  | 'processing';

// Produce categories
export type ProduceCategory = 
  | 'vegetable' 
  | 'fruit' 
  | 'herb' 
  | 'leafy_green' 
  | 'root_vegetable'
  | 'berry'
  | 'citrus';

// Produce grade types
export type ProduceGrade = 
  | 'grade_a' 
  | 'grade_b' 
  | 'grade_c'
  | 'premium'
  | 'standard'
  | 'processing'
  | 'reject';

// Ripeness scale
export type RipenessLevel = 
  | 'immature'
  | 'mature'
  | 'ripe'
  | 'optimal'
  | 'overripe';

// Produce-specific quality metric types
export type ProduceQualityMetricType =
  | 'brix' // Sugar content
  | 'firmness'
  | 'color'
  | 'size'
  | 'weight'
  | 'ph'
  | 'titratable_acidity'
  | 'chlorophyll'
  | 'shelf_life';

/**
 * Produce Batch Interface
 */
export interface IProduceBatch extends IBatch {
  domainType: 'produce';
  stage: ProduceBatchStage;
  growingAreaIds: string[]; // Produce uses "growing areas"
  
  // Produce-specific yield
  yieldData?: IProduceYieldData;
  
  // Grading and quality
  grade?: ProduceGrade;
  ripeness?: RipenessLevel;
  
  // Harvest window
  estimatedHarvestDate?: string;
  optimalHarvestWindow?: {
    start: string;
    end: string;
  };
  
  // Food safety
  lastFoodSafetyInspection?: string;
  gapCertified?: boolean;
  organicCertified?: boolean;
  primusGFSCompliant?: boolean;
}

/**
 * Produce Location (Growing Area)
 */
export interface IProduceLocation extends ILocation {
  domainType: 'produce';
  areaType: ProduceAreaType;
  growingArea?: number; // sq ft or acres
  usedGrowingArea?: number;
  
  // Environmental controls
  climateControlled?: boolean;
  irrigationSystem?: string;
  
  // Food safety
  lastSanitized?: string;
  waterSource?: string;
  gapCompliant?: boolean;
}

/**
 * Produce Cultivar (Variety)
 */
export interface IProduceCultivar extends ICultivar {
  domainType: 'produce';
  category: ProduceCategory;
  scientificName?: string;
  flavorProfile?: string;
  storageLife?: number; // Days
  
  // Optimal growing conditions
  optimalTemp?: { min: number; max: number }; // Fahrenheit
  optimalHumidity?: { min: number; max: number }; // Percentage
  
  // Harvest characteristics
  harvestMethod?: 'hand' | 'mechanical' | 'both';
  continuousHarvest?: boolean; // Can harvest multiple times
  
  // Market preferences
  marketSize?: string; // e.g., "4-6 oz", "10-12 inches"
  packagingTypes?: string[]; // e.g., "bulk", "clamshell", "bunch"
}

/**
 * Produce Yield Data
 */
export interface IProduceYieldData extends IYieldData {
  totalYield?: number; // Total harvested
  unit: 'lbs' | 'kg' | 'oz';
  
  // Grade breakdown
  gradeA?: number; // Premium quality
  gradeB?: number; // Standard quality
  gradeC?: number; // Processing quality
  premium?: number; // Above grade A
  reject?: number; // Below grade C
  
  // Size distribution (if applicable)
  sizeDistribution?: {
    small?: number;
    medium?: number;
    large?: number;
    extraLarge?: number;
  };
}

/**
 * Produce Quality Inspection
 */
export interface IProduceQualityInspection {
  id: string;
  batchId: string;
  inspectionType: 'pre_harvest' | 'harvest' | 'post_harvest' | 'packaging';
  inspectionDate: string;
  inspectedBy: string;
  
  // Quality metrics
  brix?: number; // Sugar content
  firmness?: number; // Force required to penetrate
  colorScore?: number; // 1-10
  sizeAverage?: number; // Size in defined units
  defectRate?: number; // Percentage
  
  // Grading results
  grade?: ProduceGrade;
  passed: boolean;
  notes?: string;
  evidenceUrls?: string[];
}

/**
 * Produce Storage Conditions
 */
export interface IProduceStorageConditions {
  batchId: string;
  locationId: string;
  temperature: number; // Fahrenheit
  humidity: number; // Percentage
  atmosphere?: 'controlled' | 'regular' | 'modified';
  o2Level?: number; // Percentage (for controlled atmosphere)
  co2Level?: number; // Percentage (for controlled atmosphere)
  enteredStorageAt: string;
  expectedShelfLife?: number; // Days
}

/**
 * Produce Harvest Record
 */
export interface IProduceHarvestRecord {
  id: string;
  batchId: string;
  harvestDate: string;
  harvestedBy: string;
  
  // Harvest details
  quantityHarvested: number;
  unit: 'lbs' | 'kg' | 'units';
  harvestMethod: 'hand' | 'mechanical';
  
  // Quality at harvest
  ripeness: RipenessLevel;
  averageSize?: string;
  fieldTemp?: number; // Temperature at harvest
  
  // Traceability
  lotNumber?: string;
  packingLot?: string;
  
  notes?: string;
}

/**
 * Produce Food Safety Event
 */
export interface IProduceFoodSafetyEvent {
  id: string;
  batchId?: string;
  locationId?: string;
  eventType: 'water_test' | 'soil_test' | 'equipment_sanitization' | 'worker_hygiene' | 'contamination_alert';
  eventDate: string;
  performedBy: string;
  
  // Test results (if applicable)
  testResults?: Record<string, any>;
  passed: boolean;
  
  // Corrective actions
  correctiveActions?: string;
  verifiedBy?: string;
  
  evidenceUrls?: string[];
}
