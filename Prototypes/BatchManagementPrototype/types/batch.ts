export type BatchStage = 
  | 'propagation' 
  | 'vegetative' 
  | 'flowering' 
  | 'harvest' 
  | 'drying' 
  | 'curing' 
  | 'closed';

export type EventType = 'stage_change' | 'alarm' | 'override' | 'note' | 'qa_check';

export interface Pod {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentPlantCount?: number;
  canopyArea?: number; // sq ft
  usedCanopyArea?: number; // sq ft
}

export interface Batch {
  id: string;
  name: string;
  cultivar: string;
  cultivarId?: string;
  stage: BatchStage;
  startDate: string;
  groupId?: string;
  podIds: string[];
  plantCount: number;
  createdAt: string;
  harvestDate?: string;
  closedDate?: string;
  quarantineStatus?: 'none' | 'quarantined' | 'released';
  quarantineReason?: string;
  quarantinedAt?: string;
  quarantinedBy?: string;
  yieldData?: {
    wetWeight?: number;
    dryWeight?: number;
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
