export interface ProduceVariety {
  id: string;
  name: string;
  category: 'vegetable' | 'fruit' | 'herb' | 'leafy_green' | 'root_vegetable';
  type: 'seed' | 'transplant' | 'cutting';
  commonName: string;
  scientificName?: string;
  description?: string;
  growingDays?: number; // days to maturity
  expectedYield?: number; // lbs per plant or per sq ft
  flavorProfile?: string;
  storageLife?: number; // days
  optimalTemp?: { min: number; max: number }; // fahrenheit
  createdAt: string;
  isActive: boolean;
}

export interface BatchGenealogy {
  batchId: string;
  source: 'seed' | 'transplant' | 'cutting';
  parentBatchId?: string;
  seedVendor?: string;
  seedLotNumber?: string;
  motherPlantId?: string;
  generationNumber?: number;
  notes?: string;
}
