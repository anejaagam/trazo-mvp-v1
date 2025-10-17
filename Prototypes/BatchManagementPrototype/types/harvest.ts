export interface Plant {
  id: string;
  tagId: string;
  batchId: string;
  location: string;
  status: 'immature' | 'vegetative' | 'flowering' | 'harvested';
  plantedDate: string;
  strainName: string;
}

export interface HarvestRecord {
  id: string;
  batchId: string;
  plantIds: string[];
  wetWeight: number;
  dryingRoomLocation: string;
  harvestedBy: string;
  harvestDate: string;
  metrcReported: boolean;
  metrcReportedAt?: string;
}

export interface DryingRoom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentLoad: number;
  temperature: number;
  humidity: number;
}
