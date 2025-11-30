export interface BatchLabel {
  id: string;
  labelNumber: string;
  lotNumber: string;
  status: 'available' | 'assigned' | 'voided';
  assignedBatchId?: string;
  assignedAt?: string;
  assignedBy?: string;
}

export interface LabeledContainer {
  id: string;
  batchId: string;
  containerType: 'harvest_bin' | 'tote' | 'pallet' | 'package';
  labelId: string;
  labelNumber: string;
  lotNumber: string;
  labelAttached: boolean;
  attachedBy?: string;
  attachedAt?: string;
  location: string;
  varietyName: string;
  harvestDate: string;
  weight?: number;
  grade?: string;
}

export interface LabelingSession {
  id: string;
  batchId: string;
  batchName: string;
  sessionType: 'harvest_containers' | 'packaging';
  startedBy: string;
  startedAt: string;
  completedAt?: string;
  containersToLabel: number;
  containersLabeled: number;
  labeledContainers: LabeledContainer[];
}
