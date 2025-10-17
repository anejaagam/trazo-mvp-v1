export interface PlantLot {
  id: string;
  batchId: string;
  lotNumber: string;
  plantCount: number;
  stage: 'immature' | 'vegetative' | 'flowering';
  location: string;
  createdAt: string;
  notes?: string;
}

export interface IndividualPlant {
  id: string;
  batchId: string;
  tagNumber: string;
  stage: 'flowering' | 'harvest' | 'destroyed';
  location: string;
  health: 'healthy' | 'stressed' | 'diseased';
  plantedDate: string;
  harvestedDate?: string;
  wetWeight?: number;
  dryWeight?: number;
  notes?: string;
}

export interface PlantCountSnapshot {
  id: string;
  batchId: string;
  timestamp: string;
  immatureLots: { lotId: string; count: number }[];
  individualFloweringCount: number;
  totalCount: number;
  recordedBy: string;
}
