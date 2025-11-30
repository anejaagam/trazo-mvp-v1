export type ProcessingStage = 'washing' | 'cooling' | 'sorting' | 'packaging' | 'completed';

export interface WashingRecord {
  id: string;
  batchId: string;
  facilityId: string;
  facilityName: string;
  startDate: string;
  endDate?: string;
  startWeight: number;
  endWeight?: number;
  washingMethod: 'spray' | 'immersion' | 'sanitizer_rinse' | 'manual';
  waterTemperature?: number;
  sanitizerUsed?: string;
  sanitizerConcentration?: string;
  qualityNotes?: string;
  completedBy?: string;
}

export interface CoolingRecord {
  id: string;
  batchId: string;
  facilityId: string;
  facilityName: string;
  startDate: string;
  endDate?: string;
  coolingMethod: 'forced_air' | 'hydrocooling' | 'ice' | 'cold_room';
  targetTemperature: number;
  actualTemperature?: { min: number; avg: number; max: number };
  targetHumidity?: number;
  actualHumidity?: { min: number; avg: number; max: number };
  duration: number; // hours
  qualityNotes?: string;
  completedBy?: string;
}

export interface SortingRecord {
  id: string;
  batchId: string;
  sortingDate: string;
  totalWeight: number;
  gradeA: { weight: number; percentage: number };
  gradeB: { weight: number; percentage: number };
  gradeC: { weight: number; percentage: number };
  reject: { weight: number; percentage: number };
  sortingCriteria: string[];
  qualityNotes?: string;
  sortedBy: string;
}

export interface PackagingRecord {
  id: string;
  batchId: string;
  packageDate: string;
  packageType: 'clamshell' | 'bag' | 'box' | 'bulk_bin' | 'tray';
  packageSize: string; // e.g., "1 lb", "5 oz", "10 lb box"
  packageCount: number;
  totalWeight: number;
  packagesCreated: {
    packageId: string;
    weight: number;
    label: string;
    grade?: string;
  }[];
  packagedBy: string;
  qualityCheck: boolean;
  lotNumber?: string;
  expirationDate?: string;
}
