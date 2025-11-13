/**
 * Unified Harvest Types
 * 
 * Types for harvest operations across both domains
 */

/**
 * Base Harvest Record
 */
export interface IHarvestRecord {
  id: string;
  batchId: string;
  harvestDate: string;
  harvestedBy: string;
  totalWeight: number;
  weightUnit: 'grams' | 'lbs' | 'kg';
  notes?: string;
  evidenceUrls?: string[];
}

/**
 * Cannabis Harvest Record
 */
export interface ICannabisHarvestRecord extends IHarvestRecord {
  domainType: 'cannabis';
  plantIds: string[];
  wetWeight: number;
  dryingRoomId: string;
  dryingRoomLocation: string;
  metrcReported: boolean;
  metrcReportedAt?: string;
  metrcHarvestId?: string;
}

/**
 * Produce Harvest Record
 */
export interface IProduceHarvestRecord extends IHarvestRecord {
  domainType: 'produce';
  harvestMethod: 'hand' | 'mechanical';
  ripeness: 'immature' | 'mature' | 'ripe' | 'optimal' | 'overripe';
  fieldTemperature?: number;
  lotNumber?: string;
  packingLot?: string;
}

/**
 * Discriminated union for harvest records
 */
export type DomainHarvestRecord = ICannabisHarvestRecord | IProduceHarvestRecord;

/**
 * Plant Interface (Cannabis-specific)
 */
export interface IPlant {
  id: string;
  tagId: string;
  batchId: string;
  location: string;
  status: 'immature' | 'vegetative' | 'flowering' | 'harvested' | 'destroyed';
  plantedDate: string;
  cultivarName: string;
  health?: 'healthy' | 'stressed' | 'diseased';
  harvestedDate?: string;
  wetWeight?: number;
  dryWeight?: number;
  notes?: string;
}

/**
 * Plant Lot Interface (Cannabis immature plants)
 */
export interface IPlantLot {
  id: string;
  batchId: string;
  lotNumber: string;
  plantCount: number;
  stage: 'immature' | 'vegetative' | 'flowering';
  location: string;
  createdAt: string;
  metrcLotId?: string;
  notes?: string;
}

/**
 * Individual Plant Tracking (Cannabis flowering plants)
 */
export interface IIndividualPlant {
  id: string;
  batchId: string;
  tagNumber: string;
  metrcTag?: string;
  stage: 'flowering' | 'harvest' | 'destroyed';
  location: string;
  health: 'healthy' | 'stressed' | 'diseased';
  plantedDate: string;
  harvestedDate?: string;
  wetWeight?: number;
  dryWeight?: number;
  notes?: string;
}

/**
 * Plant Count Snapshot
 */
export interface IPlantCountSnapshot {
  id: string;
  batchId: string;
  timestamp: string;
  immatureLots: { lotId: string; count: number }[];
  individualFloweringCount: number;
  totalCount: number;
  recordedBy: string;
}

/**
 * Drying Room (Cannabis)
 */
export interface IDryingRoom {
  id: string;
  name: string;
  location: string;
  capacity: number; // lbs or kg
  currentLoad: number;
  temperature: number;
  humidity: number;
  targetTemperature?: number;
  targetHumidity?: number;
}

/**
 * Type guards
 */
export function isCannabisHarvestRecord(record: DomainHarvestRecord): record is ICannabisHarvestRecord {
  return record.domainType === 'cannabis';
}

export function isProduceHarvestRecord(record: DomainHarvestRecord): record is IProduceHarvestRecord {
  return record.domainType === 'produce';
}
