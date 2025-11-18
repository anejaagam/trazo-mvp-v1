/**
 * Waste Management Types
 * Comprehensive type definitions for waste tracking with jurisdiction-based compliance
 * Supports Metrc (Oregon/Maryland), CTLS (Canada), and PrimusGFS (Produce)
 */

// ============================================================================
// CORE WASTE TYPES
// ============================================================================

/**
 * Types of waste tracked in the system
 */
export type WasteType = 
  | 'plant_material'   // Cannabis plants, stems, leaves
  | 'trim'             // Cannabis trim waste
  | 'chemical'         // Pesticides, fertilizers, cleaning agents
  | 'packaging'        // Boxes, bags, containers
  | 'equipment'        // Broken tools, worn equipment
  | 'growing_medium'   // Soil, coco coir, rockwool
  | 'other'            // Miscellaneous waste

/**
 * Source of the waste
 */
export type SourceType = 
  | 'batch'        // From a cultivation batch
  | 'inventory'    // From inventory items
  | 'general'      // General facility waste
  | 'processing'   // From processing operations

/**
 * Methods for disposing of waste
 */
export type DisposalMethod = 
  | 'compost'
  | 'hazardous_waste'
  | 'landfill'
  | 'recycle'
  | 'incineration'
  | 'grind_and_dispose'
  | 'other'

/**
 * Methods for rendering waste unusable (Metrc requirement)
 */
export type RenderingMethod = 
  | 'fifty_fifty_mix'       // 50:50 mix with inert material (OR/MD requirement)
  | 'grinding'              // Grind to unrecognizable state
  | 'composting'            // Compost with approved materials
  | 'chemical_treatment'    // Chemical breakdown
  | 'incineration'          // Burn waste
  | 'other'                 // Other approved method

/**
 * Metrc sync status
 */
export type MetrcSyncStatus = 
  | 'pending'          // Not yet synced to Metrc
  | 'synced'           // Successfully synced
  | 'failed'           // Sync attempt failed
  | 'not_applicable'   // Not a Metrc jurisdiction

/**
 * Unit of measure for waste quantity
 */
export type WasteUnit = 
  | 'kg' 
  | 'g' 
  | 'lb' 
  | 'oz' 
  | 'units' 
  | 'liters' 
  | 'gallons'

// ============================================================================
// JURISDICTION-SPECIFIC TYPES
// ============================================================================

/**
 * Metrc-specific waste reasons (Oregon/Maryland)
 */
export type MetrcWasteReason = 
  | 'Male plants'
  | 'Unhealthy or contaminated plants'
  | 'Trim waste'
  | 'Harvest waste'
  | 'Quality control failure'
  | 'Overproduction'
  | 'Damaged in transit'
  | 'Expired product'
  | 'Regulatory requirement'
  | 'Other'

/**
 * CTLS waste reasons (Canada)
 */
export type CTLSWasteReason = 
  | 'Contaminated'
  | 'Defective'
  | 'Destroyed for compliance'
  | 'Expired'
  | 'Pest damage'
  | 'Quality control'
  | 'Other'

/**
 * PrimusGFS waste reasons (Produce)
 */
export type PrimusGFSWasteReason = 
  | 'Overripe'
  | 'Damaged'
  | 'Pest damage'
  | 'Quality standards not met'
  | 'Expired'
  | 'Contamination'
  | 'Other'

/**
 * Combined waste reasons type (jurisdiction-aware)
 */
export type WasteReason = MetrcWasteReason | CTLSWasteReason | PrimusGFSWasteReason | string

// ============================================================================
// MAIN WASTE LOG INTERFACE
// ============================================================================

/**
 * Core waste log record from database
 */
export interface WasteLog {
  id: string
  organization_id: string
  site_id: string
  
  // Waste details
  waste_type: WasteType
  source_type: SourceType | null
  source_id: string | null
  quantity: number
  unit_of_measure: WasteUnit
  reason: WasteReason
  disposal_method: DisposalMethod
  
  // Rendering details (Metrc compliance)
  rendering_method: RenderingMethod | null
  waste_material_mixed: string | null  // e.g., "kitty litter", "sand"
  mix_ratio: string | null             // e.g., "50:50", "60:40"
  
  // Compliance requirements
  photo_urls: string[]
  witness_name: string | null
  witness_signature_url: string | null
  witness_id_verified: boolean
  rendered_unusable: boolean
  
  // Metrc integration
  metrc_disposal_id: string | null
  metrc_package_tags: string[] | null
  metrc_sync_status: MetrcSyncStatus
  metrc_sync_error: string | null
  metrc_synced_at: string | null
  
  // Location and references
  disposal_location: string | null
  batch_id: string | null
  inventory_item_id: string | null
  inventory_lot_id: string | null
  
  // Audit trail
  performed_by: string
  witnessed_by: string | null
  disposed_at: string
  created_at: string
  updated_at: string
  notes: string | null
}

/**
 * Waste log with related data (joins)
 */
export interface WasteLogWithRelations extends WasteLog {
  performer?: {
    id: string
    full_name: string
    email: string
  }
  witness?: {
    id: string
    full_name: string
    email: string
  } | null
  batch?: {
    id: string
    batch_number: string
    cultivar: {
      name: string
    } | null
  } | null
  inventory_item?: {
    id: string
    name: string
    sku: string
  } | null
  inventory_lot?: {
    id: string
    lot_code: string
  } | null
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

/**
 * Input type for creating a new waste log
 */
export interface CreateWasteLogInput {
  organization_id: string
  site_id: string
  
  // Waste details
  waste_type: WasteType
  source_type?: SourceType
  source_id?: string
  quantity: number
  unit_of_measure: WasteUnit
  reason: WasteReason
  disposal_method: DisposalMethod
  
  // Rendering details (optional, Metrc jurisdictions)
  rendering_method?: RenderingMethod
  waste_material_mixed?: string
  mix_ratio?: string
  
  // Compliance
  photo_urls?: string[]
  witness_name?: string
  witness_signature_url?: string
  witness_id_verified?: boolean
  rendered_unusable?: boolean
  
  // Metrc
  metrc_package_tags?: string[]
  
  // References
  disposal_location?: string
  batch_id?: string
  inventory_item_id?: string
  inventory_lot_id?: string
  
  // Audit
  performed_by: string
  witnessed_by?: string
  disposed_at?: string
  notes?: string
}

/**
 * Input type for updating an existing waste log (within 24h window)
 */
export interface UpdateWasteLogInput {
  // Only allow updates to certain fields
  quantity?: number
  unit_of_measure?: WasteUnit
  reason?: WasteReason
  disposal_method?: DisposalMethod
  rendering_method?: RenderingMethod
  waste_material_mixed?: string
  mix_ratio?: string
  photo_urls?: string[]
  witness_name?: string
  witness_signature_url?: string
  witness_id_verified?: boolean
  rendered_unusable?: boolean
  disposal_location?: string
  witnessed_by?: string
  disposed_at?: string
  notes?: string
}

// ============================================================================
// ANALYTICS & SUMMARY TYPES
// ============================================================================

/**
 * Waste summary analytics from database view
 */
export interface WasteSummary {
  organization_id: string
  site_id: string
  month: string
  week: string
  day: string

  // Totals
  total_waste_count: number
  total_weight_kg: number

  // Cannabis-specific totals
  cannabis_waste_count: number
  cannabis_waste_kg: number

  // Compliance metrics
  rendered_count: number
  witnessed_count: number
  photos_sufficient_count: number
  compliance_rate: number
  compliant_waste_count: number

  // Non-compliance metrics (for alerts)
  non_rendered_count: number
  non_witnessed_count: number

  // Metrc sync metrics
  metrc_synced_count: number
  metrc_pending_count: number
  metrc_failed_count: number
  metrc_sync_rate: number

  // Breakdown by type (for charts)
  by_type: Record<WasteType, { count: number; total_weight_kg: number }>

  // Breakdown by source (for charts)
  by_source: Record<SourceType, { count: number; total_weight_kg: number }>
}

/**
 * Monthly waste breakdown for analytics
 */
export interface MonthlyWaste {
  month: string
  total_waste_kg: number
  waste_count: number
  by_type: Record<WasteType, number>
  by_source: Record<SourceType, number>
}

/**
 * Waste by type breakdown
 */
export interface WasteByType {
  waste_type: WasteType
  count: number
  total_weight_kg: number
  percentage: number
}

/**
 * Waste by source breakdown
 */
export interface WasteBySource {
  source_type: SourceType
  count: number
  total_weight_kg: number
  percentage: number
}

// ============================================================================
// FILTERING & QUERY TYPES
// ============================================================================

/**
 * Filters for querying waste logs
 */
export interface WasteLogFilters {
  waste_type?: WasteType[]
  source_type?: SourceType[]
  disposal_method?: DisposalMethod[]
  date_range?: {
    start: string
    end: string
  }
  batch_id?: string
  inventory_item_id?: string
  performed_by?: string
  witnessed_by?: string
  rendered_unusable?: boolean
  has_photos?: boolean
  metrc_sync_status?: MetrcSyncStatus[]
  search?: string  // Search in notes, reason, witness_name
}

/**
 * Sort options for waste logs
 */
export interface WasteLogSort {
  field: 'disposed_at' | 'created_at' | 'quantity' | 'waste_type' | 'source_type'
  order: 'asc' | 'desc'
}

/**
 * Pagination options
 */
export interface WasteLogPagination {
  page: number
  pageSize: number
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result for waste log compliance
 */
export interface WasteValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  jurisdiction?: 'METRC' | 'CTLS' | 'PRIMUS_GFS'
}

/**
 * Metrc compliance checklist
 */
export interface MetrcComplianceChecklist {
  renderedUnusable: boolean
  hasWitness: boolean
  witnessIdVerified: boolean
  hasSufficientPhotos: boolean  // 2+ photos
  has50_50Mix: boolean
  hasPackageTags: boolean
  allCompliant: boolean
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'pdf' | 'compliance_packet'

/**
 * Export options for waste logs
 */
export interface WasteExportOptions {
  format: ExportFormat
  filters?: WasteLogFilters
  includePhotos?: boolean
  includeSignatures?: boolean
  date_range: {
    start: string
    end: string
  }
}

/**
 * Compliance packet for regulatory reporting
 */
export interface CompliancePacket {
  site_name: string
  jurisdiction: string
  reporting_period: {
    start: string
    end: string
  }
  waste_logs: WasteLogWithRelations[]
  summary: WasteSummary
  compliance_checklist: MetrcComplianceChecklist
  generated_at: string
  generated_by: string
}

// ============================================================================
// METRC INTEGRATION TYPES (Phase 14)
// ============================================================================

/**
 * Metrc waste disposal payload (future use)
 * @see https://api-ca.metrc.com/Documentation/#Waste
 */
export interface MetrcWasteDisposal {
  Id: number | null  // Metrc waste ID (for updates)
  ActualDate: string  // ISO date
  WasteType: string   // "Plant", "Harvest", "Product", etc.
  UnitOfWeightName: string  // "Grams", "Kilograms"
  WasteWeight: number
  WasteMethodName: string
  WasteReasonName: string
  PlantWasteMaterialMixed?: string
  
  // For plant waste
  PlantId?: number
  PlantBatchId?: number
  
  // For harvest waste
  HarvestId?: number
  
  // For package waste
  PackageLabel?: string
}

/**
 * Response from Metrc waste disposal API (future use)
 */
export interface MetrcWasteResponse {
  success: boolean
  metrc_disposal_id?: string
  error?: string
  synced_at: string
}

// ============================================================================
// QUERY RESULT TYPE
// ============================================================================

/**
 * Standard query result wrapper
 */
export interface QueryResult<T> {
  data: T | null
  error: Error | null
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if waste is cannabis waste (requires Metrc compliance)
 */
export function isCannabisWaste(wasteType: WasteType): boolean {
  return wasteType === 'plant_material' || wasteType === 'trim'
}

/**
 * Type guard to check if waste requires witness
 */
export function requiresWitness(wasteType: WasteType, jurisdiction: string): boolean {
  return isCannabisWaste(wasteType) && jurisdiction === 'METRC'
}

/**
 * Type guard to check if waste requires rendering unusable
 */
export function requiresRendering(wasteType: WasteType, jurisdiction: string): boolean {
  return isCannabisWaste(wasteType) && jurisdiction === 'METRC'
}

/**
 * Type guard to check if waste log can be edited
 * Only editable within 24 hours by the creator
 */
export function isEditable(wasteLog: WasteLog, userId: string): boolean {
  if (wasteLog.performed_by !== userId) return false
  
  const createdAt = new Date(wasteLog.created_at)
  const now = new Date()
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  
  return hoursSinceCreation < 24
}

/**
 * Type guard to check if waste log can be deleted
 * Only deletable within 1 hour by org_admin
 */
export function isDeletable(wasteLog: WasteLog, userRole: string): boolean {
  if (userRole !== 'org_admin') return false
  
  const createdAt = new Date(wasteLog.created_at)
  const now = new Date()
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  
  return hoursSinceCreation < 1
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Photo evidence metadata
 */
export interface PhotoEvidence {
  url: string
  uploaded_at: string
  uploaded_by: string
  file_size: number
  mime_type: string
  label?: 'before' | 'after' | 'process' | 'other'
}

/**
 * Witness signature metadata
 */
export interface WitnessSignature {
  url: string
  signed_at: string
  witness_id: string
  witness_name: string
  id_verified: boolean
  id_type?: string
  id_number?: string  // Last 4 digits only
}

/**
 * Batch event detail for waste disposal
 */
export interface BatchWasteEventDetail {
  waste_log_id: string
  waste_type: WasteType
  quantity: number
  unit_of_measure: WasteUnit
  reason: WasteReason
  disposal_method: DisposalMethod
  rendered_unusable: boolean
  witnessed_by: string | null
}
