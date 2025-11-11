export type WasteReason = 
  | 'normal_plant_debris'
  | 'failed_qa'
  | 'pest_infestation'
  | 'mold_contamination'
  | 'trim_waste'
  | 'stem_waste'
  | 'damaged_product'
  | 'expired_product'
  | 'other';

export type WasteStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'reported_to_metrc';

export interface WasteLog {
  id: string;
  batchId?: string;
  wasteType: WasteReason;
  wasteTypeOther?: string;
  plantMaterialWeight: number;
  nonPlantMaterialWeight: number;
  totalWeight: number;
  mixingRatio: number;
  createdBy: string;
  createdAt: string;
  evidenceUrls: string[];
  notes?: string;
  status: WasteStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  metrcReportedAt?: string;
}

export interface WasteMaterial {
  id: string;
  name: string;
  category: 'plant_material' | 'non_plant_material';
  weight: number;
  unit: 'kg' | 'g';
}
