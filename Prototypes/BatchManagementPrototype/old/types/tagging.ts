export interface PlantTag {
  id: string;
  tagNumber: string;
  metrcUid: string;
  status: 'available' | 'assigned' | 'destroyed';
  assignedPlantId?: string;
  assignedAt?: string;
  assignedBy?: string;
}

export interface TaggedPlant {
  id: string;
  batchId: string;
  tagId: string;
  tagNumber: string;
  metrcUid: string;
  physicallyAttached: boolean;
  attachedBy?: string;
  attachedAt?: string;
  location: string;
  strainName: string;
  plantedDate: string;
}

export interface TaggingSession {
  id: string;
  batchId: string;
  batchName: string;
  startedBy: string;
  startedAt: string;
  completedAt?: string;
  plantsToTag: number;
  plantsTagged: number;
  taggedPlants: TaggedPlant[];
}
