export interface Cultivar {
  id: string;
  name: string;
  type: 'seed' | 'clone';
  genetics: string;
  description?: string;
  thcRange?: { min: number; max: number };
  cbdRange?: { min: number; max: number };
  floweringTime?: number; // days
  expectedYield?: number; // kg per plant
  createdAt: string;
  isActive: boolean;
}

export interface BatchGenealogy {
  batchId: string;
  source: 'seed' | 'clone' | 'mother_plant';
  parentBatchId?: string;
  seedVendor?: string;
  seedLotNumber?: string;
  motherPlantId?: string;
  generationNumber?: number;
  notes?: string;
}
