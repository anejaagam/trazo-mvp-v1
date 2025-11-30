/**
 * Base Domain Types
 * 
 * These interfaces define the core structure shared across all domains.
 * Domain-specific implementations should extend these base types.
 */

export type DomainType = 'cannabis' | 'produce';

// Shared batch stages (domains extend with specific stages)
export type BaseBatchStage = 'closed';

// Shared event types
export type EventType = 'stage_change' | 'alarm' | 'override' | 'note' | 'qa_check' | 'compliance';

// Shared batch status
export type BatchStatus = 'active' | 'quarantined' | 'completed' | 'closed';

// Quarantine status
export type QuarantineStatus = 'none' | 'quarantined' | 'released';

/**
 * Base Batch Interface
 * All domain-specific batches extend this interface
 */
export interface IBatch {
  id: string;
  domainType: DomainType;
  name: string;
  cultivarId: string;
  cultivarName: string;
  stage: string; // Domain-specific stage types
  status: BatchStatus;
  startDate: string;
  createdAt: string;
  closedDate?: string;
  groupId?: string;
  locationIds: string[]; // Generic location references (rooms/areas/pods)
  plantCount: number;
  harvestDate?: string;
  
  // Quarantine
  quarantineStatus: QuarantineStatus;
  quarantineReason?: string;
  quarantinedAt?: string;
  quarantinedBy?: string;
  
  // Genealogy
  genealogy?: IBatchGenealogy;
  
  // Metadata
  notes?: string;
  tags?: string[];
}

/**
 * Base Location Interface
 * Represents growing areas, rooms, pods, etc.
 */
export interface ILocation {
  id: string;
  domainType: DomainType;
  name: string;
  location: string; // Physical location description
  capacity: number;
  currentPlantCount?: number;
  area?: number; // square feet
  usedArea?: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * Base Cultivar Interface
 * Represents strains (cannabis) or varieties (produce)
 */
export interface ICultivar {
  id: string;
  domainType: DomainType;
  name: string;
  commonName: string;
  type: 'seed' | 'clone' | 'transplant' | 'cutting';
  description?: string;
  growingDays?: number; // Days to maturity/harvest
  expectedYield?: number;
  createdAt: string;
  isActive: boolean;
}

/**
 * Base Genealogy Interface
 */
export interface IBatchGenealogy {
  batchId: string;
  source: 'seed' | 'clone' | 'transplant' | 'cutting' | 'mother_plant';
  parentBatchId?: string;
  seedVendor?: string;
  seedLotNumber?: string;
  motherPlantId?: string;
  generationNumber?: number;
  notes?: string;
}

/**
 * Base Batch Group Interface
 */
export interface IBatchGroup {
  id: string;
  domainType: DomainType;
  name: string;
  description: string;
  batchIds: string[];
  createdAt: string;
}

/**
 * Base Timeline Event Interface
 */
export interface ITimelineEvent {
  id: string;
  batchId: string;
  type: EventType;
  timestamp: string;
  description: string;
  data?: Record<string, any>;
  userId?: string;
  evidenceUrls?: string[];
}

/**
 * Base Metrics Interface
 */
export interface IBatchMetrics {
  temperature: { min: number; avg: number; max: number };
  humidity: { min: number; avg: number; max: number };
  vpd: { min: number; avg: number; max: number };
}

/**
 * Base Quality Metric Interface
 */
export interface IQualityMetric {
  id: string;
  batchId: string;
  metricType: string; // Domain-specific quality metric types
  value: number;
  unit: string;
  measuredAt: string;
  measuredBy?: string;
  notes?: string;
}

/**
 * Base Yield Data Interface
 */
export interface IYieldData {
  totalWeight?: number;
  waste?: number;
  unit: 'grams' | 'kg' | 'lbs' | 'oz';
}
