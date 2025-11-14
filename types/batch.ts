/**
 * Batch Management Types
 * Comprehensive type definitions for batch tracking with domain-specific support
 * Supports cannabis and produce operations with jurisdiction-based compliance
 */

// =====================================================
// DOMAIN & STATUS TYPES
// =====================================================

export type DomainType = 'cannabis' | 'produce';

export type BatchStatus = 'active' | 'quarantined' | 'completed' | 'destroyed';

export type QuarantineStatus = 'none' | 'quarantined' | 'released';

export type SourceType = 'seed' | 'clone' | 'tissue_culture';

// =====================================================
// STAGE ENUMS
// =====================================================

/**
 * Cannabis batch lifecycle stages
 */
export type CannabisStage = 
  | 'planning'
  | 'germination'
  | 'clone'
  | 'vegetative'
  | 'flowering'
  | 'harvest'
  | 'drying'
  | 'curing'
  | 'packaging'
  | 'completed'
  | 'destroyed';

/**
 * Produce batch lifecycle stages
 */
export type ProduceStage =
  | 'planning'
  | 'seeding'
  | 'germination'
  | 'seedling'
  | 'transplant'
  | 'growing'
  | 'harvest_ready'
  | 'harvesting'
  | 'washing'
  | 'grading'
  | 'packing'
  | 'storage'
  | 'shipped'
  | 'completed'
  | 'destroyed';

/**
 * Generic stage type (union of all stages)
 */
export type BatchStage = CannabisStage | ProduceStage;

// =====================================================
// QUALITY & GRADE TYPES
// =====================================================

/**
 * Produce quality grades
 */
export type ProduceGrade = 'A' | 'B' | 'C' | 'culled';

/**
 * Produce ripeness levels
 */
export type ProduceRipeness = 'unripe' | 'turning' | 'ripe' | 'overripe';

/**
 * Cannabis strain types
 */
export type StrainType = 'indica' | 'sativa' | 'hybrid' | 'indica-dominant' | 'sativa-dominant';

/**
 * Produce categories
 */
export type ProduceCategory = 
  | 'vegetable'
  | 'fruit'
  | 'herb'
  | 'berry'
  | 'leafy_green'
  | 'root_vegetable'
  | 'mushroom';

// =====================================================
// BASE BATCH INTERFACE
// =====================================================

/**
 * Base batch interface with common fields
 */
export interface Batch {
  id: string;
  organization_id: string;
  site_id: string;
  batch_number: string;
  cultivar_id?: string;
  stage: BatchStage;
  plant_count: number;
  start_date: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  parent_batch_id?: string;
  status: BatchStatus;
  
  // Domain discriminator
  domain_type?: DomainType;
  
  // Jurisdiction-specific fields
  metrc_batch_id?: string;
  license_number?: string;
  
  // Tracking fields
  source_type?: SourceType;
  source_batch_id?: string;
  
  // Metrics
  yield_weight_g?: number;
  yield_units?: number;
  waste_weight_g?: number;
  
  // Quarantine
  quarantine_reason?: string;
  quarantined_at?: string;
  quarantined_by?: string;
  quarantine_released_at?: string;
  quarantine_released_by?: string;
  
  // Metadata
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CANNABIS BATCH INTERFACE
// =====================================================

/**
 * Cannabis-specific batch with METRC compliance support
 */
export interface CannabisBatch extends Batch {
  domain_type: 'cannabis';
  stage: CannabisStage;
  
  // Cannabis-specific fields (from migration)
  lighting_schedule?: string; // e.g., "18/6", "12/12", "24/0"
  thc_content?: number; // Percentage
  cbd_content?: number; // Percentage
  drying_date?: string;
  curing_date?: string;
  terpene_profile?: {
    [terpene: string]: number; // Terpene name to percentage
  };
}

// =====================================================
// PRODUCE BATCH INTERFACE
// =====================================================

/**
 * Produce-specific batch with food safety compliance support
 */
export interface ProduceBatch extends Batch {
  domain_type: 'produce';
  stage: ProduceStage;
  
  // Produce-specific fields (from migration)
  grade?: ProduceGrade;
  ripeness?: ProduceRipeness;
  brix_level?: number; // Sugar content in °Brix
  firmness?: string;
  color?: string;
  defect_rate?: number; // Percentage
  certifications?: {
    organic?: boolean;
    gap?: boolean;
    primus_gfs?: boolean;
    [key: string]: any;
  };
  storage_temp_c?: number;
  storage_humidity_pct?: number;
}

// =====================================================
// DISCRIMINATED UNION
// =====================================================

/**
 * Domain-aware batch type (discriminated union)
 * Use this for functions that handle both domains
 */
export type DomainBatch = CannabisBatch | ProduceBatch;

// =====================================================
// TYPE GUARDS
// =====================================================

/**
 * Type guard to check if batch is cannabis
 */
export function isCannabisBatch(batch: DomainBatch | Batch): batch is CannabisBatch {
  return batch.domain_type === 'cannabis';
}

/**
 * Type guard to check if batch is produce
 */
export function isProduceBatch(batch: DomainBatch | Batch): batch is ProduceBatch {
  return batch.domain_type === 'produce';
}

/**
 * Type guard to check if stage is cannabis stage
 */
export function isCannabisStage(stage: string): stage is CannabisStage {
  const cannabisStages: CannabisStage[] = [
    'planning', 'germination', 'clone', 'vegetative', 'flowering',
    'harvest', 'drying', 'curing', 'packaging', 'completed', 'destroyed'
  ];
  return cannabisStages.includes(stage as CannabisStage);
}

/**
 * Type guard to check if stage is produce stage
 */
export function isProduceStage(stage: string): stage is ProduceStage {
  const produceStages: ProduceStage[] = [
    'planning', 'seeding', 'germination', 'seedling', 'transplant', 'growing',
    'harvest_ready', 'harvesting', 'washing', 'grading', 'packing',
    'storage', 'shipped', 'completed', 'destroyed'
  ];
  return produceStages.includes(stage as ProduceStage);
}

// =====================================================
// CULTIVAR TYPES
// =====================================================

/**
 * Base cultivar interface
 */
export interface Cultivar {
  id: string;
  organization_id: string;
  name: string;
  common_name?: string;
  description?: string;
  growing_days?: number;
  expected_yield?: number;
  is_active: boolean;
  created_at: string;
  
  // Domain-specific fields from migration
  // Produce fields
  category?: ProduceCategory;
  flavor_profile?: string;
  storage_life_days?: number;
  optimal_temp_c_min?: number;
  optimal_temp_c_max?: number;
  optimal_humidity_min?: number;
  optimal_humidity_max?: number;
}

/**
 * Cannabis cultivar (strain)
 */
export interface CannabisCultivar extends Cultivar {
  strain_type?: StrainType;
  genetics?: string; // Parent strains
  thc_range?: { min: number; max: number };
  cbd_range?: { min: number; max: number };
  flowering_time_days?: number;
}

/**
 * Produce cultivar (variety)
 */
export interface ProduceCultivar extends Cultivar {
  category: ProduceCategory;
  scientific_name?: string;
  flavor_profile?: string;
  storage_life_days?: number;
  harvest_method?: 'hand' | 'mechanical' | 'both';
}

// =====================================================
// BATCH GENEALOGY
// =====================================================

/**
 * Batch genealogy record (parent-child relationships)
 */
export interface BatchGenealogy {
  id: string;
  batch_id: string;
  parent_batch_id: string;
  relationship_type: 'clone' | 'split' | 'merge' | 'cross';
  generation_level: number;
  contribution_pct?: number; // For merges
  notes?: string;
  created_at: string;
}

// =====================================================
// QUALITY METRICS
// =====================================================

/**
 * Quality metric types
 */
export type QualityMetricType = 
  // Cannabis metrics
  | 'thc_pct'
  | 'cbd_pct'
  | 'cbg_pct'
  | 'cbn_pct'
  | 'terpene'
  | 'moisture'
  | 'density'
  | 'trichome_development'
  // Produce metrics
  | 'brix'
  | 'firmness'
  | 'color'
  | 'size'
  | 'weight'
  | 'ph'
  | 'titratable_acidity'
  | 'shelf_life';

/**
 * Batch quality metric record
 */
export interface BatchQualityMetric {
  id: string;
  batch_id: string;
  metric_type: QualityMetricType;
  value: number;
  unit: string;
  recorded_at: string;
  recorded_by?: string;
  test_method?: string;
  lab_certified: boolean;
  certification_url?: string;
  notes?: string;
}

// =====================================================
// BATCH STAGE HISTORY
// =====================================================

/**
 * Batch stage history record
 */
export interface BatchStageHistory {
  id: string;
  batch_id: string;
  stage: BatchStage;
  started_at: string;
  ended_at?: string;
  transitioned_by?: string;
  notes?: string;
}

// =====================================================
// HARVEST RECORDS
// =====================================================

/**
 * Harvest record (matches database schema)
 */
export interface HarvestRecord {
  id: string;
  batch_id: string;
  organization_id: string;
  wet_weight: number; // Decimal(10,2)
  plant_count: number;
  harvested_at: string; // TIMESTAMPTZ
  harvested_by?: string;
  location?: string;
  notes?: string;
  created_at: string;
}

// =====================================================
// BATCH POD ASSIGNMENTS
// =====================================================

/**
 * Batch to pod/location assignment
 */
export interface BatchPodAssignment {
  id: string;
  batch_id: string;
  pod_id: string;
  assigned_at: string;
  assigned_by?: string;
  removed_at?: string;
  removed_by?: string;
  plant_count: number;
  notes?: string;
}

// =====================================================
// BATCH EVENTS
// =====================================================

/**
 * Batch event types
 */
export type BatchEventType =
  | 'created'
  | 'stage_change'
  | 'plant_count_update'
  | 'pod_assignment'
  | 'pod_removal'
  | 'quarantine'
  | 'quarantine_release'
  | 'harvest'
  | 'destruction'
  | 'note_added'
  | 'recipe_applied';

/**
 * Batch event record
 */
export interface BatchEvent {
  id: string;
  batch_id: string;
  event_type: BatchEventType;
  from_value?: Record<string, any>;
  to_value?: Record<string, any>;
  user_id: string;
  timestamp: string;
  notes?: string;
  evidence_urls?: string[];
}

// =====================================================
// PLANT TAGS
// =====================================================

/**
 * Plant state for individual tracking
 */
export type PlantState = 'immature' | 'vegetative' | 'flowering' | 'harvested' | 'destroyed';

/**
 * Individual plant tag (for METRC compliance)
 */
export interface PlantTag {
  id: string;
  batch_id: string;
  tag_number: string;
  metrc_tag_id?: string;
  plant_state?: PlantState;
  location_pod_id?: string;
  tagged_at: string;
  tagged_by?: string;
  destroyed_at?: string;
  destroyed_by?: string;
  destruction_reason?: string;
  created_by: string;
}

// =====================================================
// FILTERS & QUERY TYPES
// =====================================================

/**
 * Batch filtering options
 */
export interface BatchFilters {
  domain_type?: DomainType | DomainType[];
  stage?: BatchStage | BatchStage[];
  status?: BatchStatus | BatchStatus[];
  cultivar_id?: string | string[];
  pod_id?: string | string[];
  quarantine_status?: QuarantineStatus;
  search?: string; // Search batch_number or cultivar_name
  start_date_from?: string;
  start_date_to?: string;
  expected_harvest_from?: string;
  expected_harvest_to?: string;
}

/**
 * Batch sort options
 */
export interface BatchSortOptions {
  field: 'batch_number' | 'start_date' | 'expected_harvest_date' | 'stage' | 'plant_count';
  direction: 'asc' | 'desc';
}

// =====================================================
// INSERT/UPDATE TYPES
// =====================================================

/**
 * Data for creating a new batch
 */
export interface InsertBatch {
  organization_id: string;
  site_id: string;
  batch_number: string;
  cultivar_id?: string;
  stage: BatchStage;
  plant_count?: number;
  start_date: string;
  expected_harvest_date?: string;
  parent_batch_id?: string;
  domain_type?: DomainType;
  source_type?: SourceType;
  source_batch_id?: string;
  metrc_batch_id?: string;
  license_number?: string;
  notes?: string;
  created_by: string;
  
  // Cannabis-specific
  lighting_schedule?: string;
  
  // Produce-specific
  grade?: ProduceGrade;
  ripeness?: ProduceRipeness;
  certifications?: Record<string, any>;
}

/**
 * Data for updating a batch (all fields optional)
 */
export interface UpdateBatch {
  cultivar_id?: string;
  stage?: BatchStage;
  plant_count?: number;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  status?: BatchStatus;
  yield_weight_g?: number;
  yield_units?: number;
  waste_weight_g?: number;
  notes?: string;
  
  // Cannabis-specific
  lighting_schedule?: string;
  thc_content?: number;
  cbd_content?: number;
  drying_date?: string;
  curing_date?: string;
  terpene_profile?: Record<string, number>;
  
  // Produce-specific
  grade?: ProduceGrade;
  ripeness?: ProduceRipeness;
  brix_level?: number;
  firmness?: string;
  color?: string;
  defect_rate?: number;
  certifications?: Record<string, any>;
  storage_temp_c?: number;
  storage_humidity_pct?: number;
}

// =====================================================
// VALIDATION TYPES
// =====================================================

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Stage transition validation
 */
export interface StageTransitionValidation extends ValidationResult {
  allowedNextStages: BatchStage[];
  requiredFields: string[];
  requiredChecks: string[];
}
