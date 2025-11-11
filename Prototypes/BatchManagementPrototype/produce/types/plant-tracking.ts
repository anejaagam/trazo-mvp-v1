export interface GrowingBed {
  id: string;
  batchId: string;
  bedNumber: string;
  plantCount: number;
  stage: 'seedling' | 'transplant' | 'growing';
  location: string;
  rowCount?: number;
  createdAt: string;
  notes?: string;
}

export interface HarvestUnit {
  id: string;
  batchId: string;
  unitNumber: string;
  bedNumber?: string;
  rowNumber?: string;
  stage: 'ready' | 'harvested' | 'culled';
  location: string;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  plantedDate: string;
  estimatedHarvestDate?: string;
  harvestedDate?: string;
  harvestWeight?: number;
  notes?: string;
}

export interface PlantCountSnapshot {
  id: string;
  batchId: string;
  timestamp: string;
  growingBeds: { bedId: string; count: number }[];
  readyToHarvestCount: number;
  totalCount: number;
  recordedBy: string;
}
