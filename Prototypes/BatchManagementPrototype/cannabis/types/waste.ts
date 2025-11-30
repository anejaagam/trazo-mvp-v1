export type WasteReason = 
  | 'trim_waste'
  | 'stem_stalks'
  | 'fan_leaves'
  | 'root_balls'
  | 'failed_qa_testing'
  | 'powdery_mildew'
  | 'bud_rot_botrytis'
  | 'spider_mites'
  | 'other_pest_infestation'
  | 'hermaphrodite_plants'
  | 'male_plants'
  | 'underweight_buds'
  | 'damaged_flower'
  | 'expired_product'
  | 'recall'
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
