/**
 * Unified Waste Management Types
 * 
 * Types for waste tracking and disposal across domains
 */

/**
 * Waste Reasons (Cannabis)
 */
export type CannabisWasteReason = 
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

/**
 * Waste Reasons (Produce)
 */
export type ProduceWasteReason =
  | 'culling'
  | 'trimming_waste'
  | 'leaves_stems'
  | 'roots'
  | 'failed_quality_check'
  | 'overripe'
  | 'pest_damage'
  | 'disease'
  | 'mechanical_damage'
  | 'undersized'
  | 'blemished'
  | 'expired'
  | 'recall'
  | 'other';

/**
 * Waste Status
 */
export type WasteStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'reported_to_metrc'
  | 'completed';

/**
 * Base Waste Log
 */
export interface IWasteLog {
  id: string;
  batchId?: string;
  wasteReason: string;
  wasteReasonOther?: string;
  totalWeight: number;
  weightUnit: 'grams' | 'lbs' | 'kg';
  createdBy: string;
  createdAt: string;
  evidenceUrls: string[];
  notes?: string;
  status: WasteStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  disposalMethod?: string;
  disposedAt?: string;
  witnessedBy?: string;
}

/**
 * Cannabis Waste Log
 */
export interface ICannabisWasteLog extends IWasteLog {
  domainType: 'cannabis';
  wasteReason: CannabisWasteReason;
  plantMaterialWeight: number;
  nonPlantMaterialWeight: number;
  mixingRatio: number; // Must be >= 0.5 (50% non-plant material)
  metrcReportedAt?: string;
  metrcWasteId?: string;
}

/**
 * Produce Waste Log
 */
export interface IProduceWasteLog extends IWasteLog {
  domainType: 'produce';
  wasteReason: ProduceWasteReason;
  compostable: boolean;
  compostLocation?: string;
  donationOrganization?: string; // If donated to food bank
}

/**
 * Discriminated union for waste logs
 */
export type DomainWasteLog = ICannabisWasteLog | IProduceWasteLog;

/**
 * Waste Material
 */
export interface IWasteMaterial {
  id: string;
  name: string;
  category: 'plant_material' | 'non_plant_material' | 'produce' | 'organic' | 'packaging';
  weight: number;
  unit: 'kg' | 'g' | 'lbs';
}

/**
 * Waste Disposal Method
 */
export interface IWasteDisposalMethod {
  id: string;
  name: string;
  description: string;
  requiresWitness: boolean;
  requiresEvidence: boolean;
  complianceNotes?: string;
}

/**
 * Type guards
 */
export function isCannabisWasteLog(log: DomainWasteLog): log is ICannabisWasteLog {
  return log.domainType === 'cannabis';
}

export function isProduceWasteLog(log: DomainWasteLog): log is IProduceWasteLog {
  return log.domainType === 'produce';
}
