export type WasteReason = 
  | 'spoilage'
  | 'pest_damage'
  | 'disease'
  | 'failed_quality_check'
  | 'overripe'
  | 'undersize'
  | 'mechanical_damage'
  | 'weather_damage'
  | 'trim_waste'
  | 'expired_product'
  | 'cosmetic_defect'
  | 'other';

export type WasteStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'composted' | 'disposed';

export interface WasteLog {
  id: string;
  batchId?: string;
  wasteType: WasteReason;
  wasteTypeOther?: string;
  produceWeight: number; // lbs
  packagingWeight?: number; // lbs
  totalWeight: number;
  disposalMethod: 'compost' | 'landfill' | 'donation' | 'animal_feed' | 'other';
  createdBy: string;
  createdAt: string;
  evidenceUrls: string[];
  notes?: string;
  status: WasteStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  disposedAt?: string;
}

export interface WasteMaterial {
  id: string;
  name: string;
  category: 'produce' | 'packaging' | 'other';
  weight: number;
  unit: 'lbs' | 'oz';
}
