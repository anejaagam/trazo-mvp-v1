export type BatchStage = 
  | 'seedling' 
  | 'transplant' 
  | 'growing' 
  | 'harvest' 
  | 'washing' 
  | 'sorting' 
  | 'packaging' 
  | 'closed';

export type EventType = 'stage_change' | 'alarm' | 'override' | 'note' | 'qa_check';

export interface GrowingArea {
  id: string;
  name: string;
  location: string;
  capacity: number; // plants or beds
  currentPlantCount?: number;
  growingArea?: number; // sq ft
  usedGrowingArea?: number; // sq ft
  type?: 'greenhouse' | 'indoor' | 'outdoor' | 'hydroponics';
}

export interface Batch {
  id: string;
  name: string;
  variety: string;
  varietyId?: string;
  stage: BatchStage;
  startDate: string;
  groupId?: string;
  growingAreaIds: string[];
  plantCount: number;
  createdAt: string;
  harvestDate?: string;
  closedDate?: string;
  quarantineStatus?: 'none' | 'quarantined' | 'released';
  quarantineReason?: string;
  quarantinedAt?: string;
  quarantinedBy?: string;
  yieldData?: {
    totalYield?: number; // lbs or kg
    grade_a?: number;
    grade_b?: number;
    waste?: number;
  };
}

export interface BatchGroup {
  id: string;
  name: string;
  description: string;
  batchIds: string[];
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  batchId: string;
  type: EventType;
  timestamp: string;
  description: string;
  data?: Record<string, any>;
  userId?: string;
  evidenceUrls?: string[];
}

export interface BatchMetrics {
  temperature: { min: number; avg: number; max: number };
  humidity: { min: number; avg: number; max: number };
  vpd: { min: number; avg: number; max: number };
}
