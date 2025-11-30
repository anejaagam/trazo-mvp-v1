export type StrainType = 'indica' | 'sativa' | 'hybrid' | 'indica-dominant' | 'sativa-dominant';

export interface Cultivar {
  id: string;
  name: string;
  type: 'seed' | 'clone';
  strainType: StrainType;
  genetics: string;
  description?: string;
  thcRange?: { min: number; max: number };
  cbdRange?: { min: number; max: number };
  terpeneProfile?: string[]; // dominant terpenes
  floweringTime?: number; // days
  expectedYield?: number; // grams per plant
  growthCharacteristics?: string; // stretch, branching, etc.
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
