export type ProcessingStage = 'drying' | 'curing' | 'packaging' | 'completed';

export interface DryingRecord {
  id: string;
  batchId: string;
  roomId: string;
  roomName: string;
  startDate: string;
  endDate?: string;
  startWeight: number;
  endWeight?: number;
  targetHumidity: number;
  targetTemperature: number;
  actualHumidity?: { min: number; avg: number; max: number };
  actualTemperature?: { min: number; avg: number; max: number };
  qualityNotes?: string;
  completedBy?: string;
}

export interface CuringRecord {
  id: string;
  batchId: string;
  containerType: 'jar' | 'bin' | 'bag';
  containerCount: number;
  startDate: string;
  endDate?: string;
  targetDuration: number; // days
  startWeight: number;
  endWeight?: number;
  burpingSchedule?: string;
  qualityNotes?: string;
  completedBy?: string;
}

export interface PackagingRecord {
  id: string;
  batchId: string;
  packageDate: string;
  packageType: string;
  packageCount: number;
  totalWeight: number;
  packagesCreated: {
    packageId: string;
    weight: number;
    label: string;
  }[];
  packagedBy: string;
  qualityCheck: boolean;
  metrcReported: boolean;
  metrcReportedAt?: string;
}
