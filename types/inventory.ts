/**
 * Inventory Management Types
 * Comprehensive type definitions for inventory tracking, lot management, and waste disposal
 * Supports all jurisdictions: Metrc (Oregon/Maryland), CTLS (Canada), PrimusGFS (Produce)
 */

// =====================================================
// ITEM TYPES & CATEGORIES
// =====================================================

export type ItemType =
  | 'co2_tank'
  | 'filter'
  | 'nutrient'
  | 'chemical'
  | 'packaging'
  | 'sanitation'
  | 'equipment'
  | 'seeds'
  | 'clones'
  | 'growing_medium'
  | 'other';

export type StockStatus = 'ok' | 'reorder' | 'below_par' | 'out_of_stock';

export type MovementType =
  | 'receive'      // Receiving inventory from supplier
  | 'consume'      // Consuming for batch/task
  | 'transfer'     // Transfer between locations
  | 'adjust'       // Manual adjustment (can be +/-)
  | 'dispose'      // Waste disposal
  | 'return'       // Return from batch/task
  | 'reserve'      // Reserve for scheduled task
  | 'unreserve';   // Release reservation

export type AlertType = 'low_stock' | 'expiring' | 'expired' | 'out_of_stock';

// =====================================================
// INVENTORY CATEGORY
// =====================================================

export interface InventoryCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  track_lot_numbers: boolean;
  track_expiry: boolean;
  require_coa: boolean; // Certificate of Analysis
  is_active: boolean;
  created_at: string;
}

export interface InsertInventoryCategory {
  organization_id: string;
  name: string;
  description?: string;
  track_lot_numbers?: boolean;
  track_expiry?: boolean;
  require_coa?: boolean;
}

// =====================================================
// INVENTORY ITEM
// =====================================================

export interface InventoryItem {
  id: string;
  organization_id: string;
  site_id: string;
  category_id?: string;
  item_type: ItemType;
  name: string;
  sku?: string;
  unit_of_measure: string;
  current_quantity: number;
  reserved_quantity: number;
  minimum_quantity?: number;  // Par level
  maximum_quantity?: number;
  reorder_point?: number;
  storage_location?: string;
  lot_number?: string;  // Deprecated - use inventory_lots table instead
  expiry_date?: string; // Deprecated - use inventory_lots table instead
  cost_per_unit?: number;
  supplier_name?: string;
  supplier_contact?: string;
  material_safety_data_sheet_url?: string;
  certificate_of_analysis_url?: string;
  notes?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Metrc compliance tracking
  metrc_item_id?: number;
  metrc_item_name?: string;
  metrc_item_category?: string;
  metrc_sync_status?: 'not_synced' | 'synced' | 'sync_failed';
  metrc_last_synced_at?: string;
  requires_metrc_compliance?: boolean;
}

export interface InsertInventoryItem {
  organization_id: string;
  site_id: string;
  category_id?: string;
  item_type: ItemType;
  name: string;
  sku?: string;
  unit_of_measure: string;
  minimum_quantity?: number;
  maximum_quantity?: number;
  reorder_point?: number;
  storage_location?: string;
  cost_per_unit?: number;
  supplier_name?: string;
  supplier_contact?: string;
  material_safety_data_sheet_url?: string;
  certificate_of_analysis_url?: string;
  notes?: string;
  created_by: string;
}

export interface UpdateInventoryItem {
  name?: string;
  sku?: string;
  item_type?: ItemType;
  category_id?: string;
  unit_of_measure?: string;
  minimum_quantity?: number;
  maximum_quantity?: number;
  reorder_point?: number;
  storage_location?: string;
  cost_per_unit?: number;
  supplier_name?: string;
  supplier_contact?: string;
  material_safety_data_sheet_url?: string;
  certificate_of_analysis_url?: string;
  notes?: string;
  is_active?: boolean;
  // Metrc compliance tracking
  metrc_item_id?: number;
  metrc_item_name?: string;
  metrc_item_category?: string;
  metrc_sync_status?: 'not_synced' | 'synced' | 'sync_failed';
  metrc_last_synced_at?: string;
  requires_metrc_compliance?: boolean;
}

// =====================================================
// METRC COMPLIANCE STATUS TYPES
// =====================================================

export type MetrcComplianceStatus =
  | 'not_required'
  | 'not_linked'
  | 'item_not_in_cache'
  | 'strain_not_in_cache'
  | 'compliant'
  | 'pending'
  | 'unknown';

export type BatchMetrcReadiness =
  | 'synced'
  | 'missing_cultivar'
  | 'cultivar_not_linked'
  | 'missing_location'
  | 'not_required'
  | 'ready_to_sync';

export interface InventoryItemMetrcStatus {
  item_id: string;
  organization_id: string;
  site_id: string;
  item_name: string;
  item_type: ItemType;
  sku?: string;
  requires_metrc_compliance: boolean;
  metrc_item_id?: number;
  metrc_item_name?: string;
  metrc_item_category?: string;
  metrc_sync_status?: string;
  metrc_last_synced_at?: string;
  cached_metrc_name?: string;
  cached_category?: string;
  compliance_status: MetrcComplianceStatus;
}

export interface BatchMetrcReadinessView {
  batch_id: string;
  organization_id: string;
  site_id: string;
  batch_number: string;
  stage: string;
  status: string;
  cultivar_id?: string;
  cultivar_name?: string;
  metrc_strain_id?: number;
  cultivar_sync_status?: string;
  metrc_batch_id?: string;
  batch_sync_status?: string;
  metrc_batch_name?: string;
  metrc_location?: string;
  metrc_location_id?: number;
  compliance_readiness: BatchMetrcReadiness;
  has_cultivar: boolean;
  cultivar_linked_to_strain: boolean;
  has_metrc_location: boolean;
  is_synced_to_metrc: boolean;
}

// =====================================================
// INVENTORY LOT (for batch/expiry tracking)
// =====================================================

export type ExpiryStatus = 'ok' | 'expiring' | 'expiring_soon' | 'expired';

export interface InventoryLot {
  id: string;
  item_id: string;
  lot_code: string;
  quantity_received: number;
  quantity_remaining: number;
  unit_of_measure: string;
  received_date: string;
  expiry_date?: string;
  manufacture_date?: string;
  supplier_name?: string;
  purchase_order_number?: string;
  invoice_number?: string;
  cost_per_unit?: number;
  certificate_of_analysis_url?: string;
  material_safety_data_sheet_url?: string;
  test_results_url?: string;
  compliance_package_uid?: string; // Metrc UID, CTLS tracking number, etc.
  compliance_package_type?: string;
  storage_location?: string;
  notes?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InsertInventoryLot {
  item_id: string;
  lot_code: string;
  quantity_received: number;
  quantity_remaining: number;
  unit_of_measure: string;
  received_date?: string; // Defaults to NOW()
  expiry_date?: string;
  manufacture_date?: string;
  supplier_name?: string;
  purchase_order_number?: string;
  invoice_number?: string;
  cost_per_unit?: number;
  certificate_of_analysis_url?: string;
  material_safety_data_sheet_url?: string;
  test_results_url?: string;
  compliance_package_uid?: string;
  compliance_package_type?: string;
  storage_location?: string;
  notes?: string;
  created_by: string;
}

export interface UpdateInventoryLot {
  lot_code?: string;
  expiry_date?: string;
  storage_location?: string;
  notes?: string;
  is_active?: boolean;
}

// =====================================================
// INVENTORY MOVEMENT
// =====================================================

export interface InventoryMovement {
  id: string;
  item_id: string;
  lot_id?: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  from_location?: string;
  to_location?: string;
  batch_id?: string;
  task_id?: string;
  purchase_order_number?: string;
  invoice_number?: string;
  reason?: string;
  notes?: string;
  photo_urls?: string[];
  performed_by: string;
  approved_by?: string;
  timestamp: string;
}

export interface InsertInventoryMovement {
  item_id: string;
  lot_id?: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  from_location?: string;
  to_location?: string;
  batch_id?: string;
  task_id?: string;
  purchase_order_number?: string;
  invoice_number?: string;
  reason?: string;
  notes?: string;
  photo_urls?: string[];
  performed_by: string;
  approved_by?: string;
}

// =====================================================
// INVENTORY ALERT
// =====================================================

export interface InventoryAlert {
  id: string;
  item_id: string;
  alert_type: AlertType;
  threshold_value?: number;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface InsertInventoryAlert {
  item_id: string;
  alert_type: AlertType;
  threshold_value?: number;
}

export interface AcknowledgeInventoryAlert {
  is_acknowledged: true;
  acknowledged_by: string;
  acknowledged_at: string;
}

// =====================================================
// WASTE DISPOSAL
// =====================================================

export type WasteType =
  | 'plant_material'
  | 'trim'
  | 'chemical'
  | 'packaging'
  | 'equipment'
  | 'growing_medium'
  | 'other';

export type WasteSourceType = 'batch' | 'inventory' | 'general' | 'processing';

export type DisposalMethod =
  | 'compost'
  | 'hazardous_waste'
  | 'landfill'
  | 'recycle'
  | 'grind_mix'    // Oregon cannabis requirement
  | 'incineration'
  | 'other';

export interface WasteLog {
  id: string;
  organization_id: string;
  site_id: string;
  waste_type: WasteType;
  source_type?: WasteSourceType;
  source_id?: string;
  quantity: number;
  unit_of_measure: string;
  reason: string; // Jurisdiction-specific
  disposal_method: DisposalMethod;
  photo_urls?: string[];
  witness_name?: string;
  witness_signature_url?: string;
  witness_id_verified: boolean;
  rendered_unusable: boolean; // Cannabis requirement
  metrc_disposal_id?: string;
  metrc_package_tags?: string[];
  disposal_location?: string;
  performed_by: string;
  witnessed_by?: string;
  disposed_at: string;
  notes?: string;
}

export interface InsertWasteLog {
  organization_id: string;
  site_id: string;
  waste_type: WasteType;
  source_type?: WasteSourceType;
  source_id?: string;
  quantity: number;
  unit_of_measure: string;
  reason: string;
  disposal_method: DisposalMethod;
  photo_urls?: string[];
  witness_name?: string;
  witness_signature_url?: string;
  witness_id_verified?: boolean;
  rendered_unusable?: boolean;
  metrc_disposal_id?: string;
  metrc_package_tags?: string[];
  disposal_location?: string;
  performed_by: string;
  witnessed_by?: string;
  disposed_at?: string;
  notes?: string;
}

// =====================================================
// VIEWS (from database views)
// =====================================================

export interface InventoryStockBalance {
  item_id: string;
  organization_id: string;
  site_id: string;
  item_name: string;
  sku?: string;
  item_type: ItemType;
  category_id?: string;
  unit_of_measure: string;
  on_hand: number;
  reserved_quantity: number;
  available: number;
  par_level?: number;
  reorder_point?: number;
  stock_status: StockStatus;
  storage_location?: string;
  last_updated: string;
}

export interface InventoryActiveLot {
  lot_id: string;
  item_id: string;
  item_name: string;
  organization_id: string;
  site_id: string;
  lot_code: string;
  quantity_received: number;
  quantity_remaining: number;
  unit_of_measure: string;
  received_date: string;
  expiry_date?: string;
  manufacture_date?: string;
  supplier_name?: string;
  compliance_package_uid?: string;
  storage_location?: string;
  expiry_status?: ExpiryStatus;
  days_until_expiry?: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovementSummary {
  item_id: string;
  item_name: string;
  organization_id: string;
  site_id: string;
  total_movements: number;
  total_received: number;
  total_consumed: number;
  total_adjusted: number;
  total_disposed: number;
  total_transferred: number;
  last_movement_date?: string;
}

// =====================================================
// COMPOSITE TYPES (with joined data)
// =====================================================

export interface InventoryItemWithStock extends InventoryItem {
  stock_status: StockStatus;
  available_quantity: number;
  category?: InventoryCategory;
  active_lots_count?: number;
  low_stock_alert?: boolean;
}

export interface InventoryMovementWithDetails extends InventoryMovement {
  item?: InventoryItem;
  lot?: InventoryLot;
  batch?: {
    id: string;
    name: string;
  };
  performed_by_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  approved_by_user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface InventoryAlertWithItem extends InventoryAlert {
  item: InventoryItem;
  stock_balance?: InventoryStockBalance;
}

// =====================================================
// JURISDICTION-SPECIFIC TYPES
// =====================================================

export interface JurisdictionWasteRules {
  allowed_reasons: string[];
  disposal_methods: DisposalMethod[];
  require_witness: boolean;
  require_photo: boolean;
  hold_period_days?: number; // Oregon: 3 days
  require_rendered_unusable: boolean; // Cannabis: true
  require_compliance_reporting: boolean;
}

export interface MetrcPackageInfo {
  uid: string; // Metrc UID (e.g., '1A4FF...')
  tag: string;
  package_type: string;
  status: string;
  quantity: number;
  unit_of_measure: string;
}

export interface CTLSPackageInfo {
  tracking_number: string;
  license_holder_id: string;
  lot_number: string;
  quantity: number;
  unit_of_measure: string;
}

// =====================================================
// FILTER & QUERY TYPES
// =====================================================

export interface InventoryItemFilters {
  organization_id: string;
  site_id?: string;
  category_id?: string;
  item_type?: ItemType;
  stock_status?: StockStatus | StockStatus[];
  search?: string; // Search by name or SKU
  is_active?: boolean;
  has_alerts?: boolean;
}

export interface InventoryMovementFilters {
  organization_id: string;
  site_id?: string;
  item_id?: string;
  lot_id?: string;
  batch_id?: string;
  movement_type?: MovementType | MovementType[];
  start_date?: string;
  end_date?: string;
  performed_by?: string;
}

export interface InventoryLotFilters {
  organization_id: string;
  site_id?: string;
  item_id?: string;
  expiry_status?: ExpiryStatus | ExpiryStatus[];
  is_active?: boolean;
  has_compliance_uid?: boolean;
}

export interface WasteLogFilters {
  organization_id: string;
  site_id?: string;
  waste_type?: WasteType | WasteType[];
  source_type?: WasteSourceType;
  source_id?: string;
  start_date?: string;
  end_date?: string;
  performed_by?: string;
}

// =====================================================
// FORM INPUT TYPES
// =====================================================

export interface ReceiveInventoryInput {
  item_id: string;
  lot_code: string;
  quantity: number;
  cost_per_unit?: number;
  expiry_date?: string;
  manufacture_date?: string;
  supplier_name?: string;
  purchase_order_number?: string;
  invoice_number?: string;
  certificate_of_analysis_url?: string;
  compliance_package_uid?: string;
  storage_location?: string;
  notes?: string;
  photo_urls?: string[];
}

export interface IssueInventoryInput {
  item_id: string;
  lot_id?: string; // Optional for FIFO selection
  quantity: number;
  batch_id?: string;
  task_id?: string;
  reason?: string;
  notes?: string;
}

export interface AdjustInventoryInput {
  item_id: string;
  quantity: number; // Can be positive or negative
  reason: string;
  notes?: string;
  photo_urls?: string[];
  approved_by?: string;
}

export interface DisposeInventoryInput {
  item_id: string;
  lot_id?: string;
  quantity: number;
  reason: string; // Jurisdiction-specific
  disposal_method: DisposalMethod;
  photo_urls?: string[];
  witness_name?: string;
  rendered_unusable?: boolean;
  notes?: string;
}

// =====================================================
// DASHBOARD / SUMMARY TYPES
// =====================================================

export interface InventoryDashboardSummary {
  total_items: number;
  active_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  expiring_items: number; // Within 30 days
  expired_items: number;
  total_value: number; // Sum of (quantity * cost_per_unit)
  recent_movements: InventoryMovementWithDetails[];
  alerts: InventoryAlertWithItem[];
}

export interface InventoryReport {
  generated_at: string;
  organization_id: string;
  site_id?: string;
  report_type: 'stock_balance' | 'movements' | 'waste' | 'valuation';
  filters?: Record<string, string | number | boolean | string[]>;
  data: InventoryStockBalance[] | InventoryMovementWithDetails[] | WasteLog[];
  summary?: {
    total_records: number;
    total_value?: number;
    [key: string]: string | number | boolean | undefined;
  };
}
