/**
 * Metrc-Specific Types
 *
 * TypeScript interfaces for Metrc API requests, responses, and internal data structures
 */

/**
 * Metrc API client configuration
 */
export interface MetrcConfig {
  vendorApiKey: string
  userApiKey: string
  facilityLicenseNumber: string
  state: string
  isSandbox?: boolean
}

/**
 * Extended configuration for MetrcClient
 */
export interface MetrcClientConfig extends MetrcConfig {
  baseUrl?: string
  timeout?: number
}

/**
 * Metrc facility information
 */
export interface MetrcFacility {
  Id: number
  Name: string
  LicenseNumber: string
  FacilityType: string
  Address1: string
  Address2?: string
  City: string
  State: string
  PostalCode: string
  Country: string
}

/**
 * Metrc package structure
 */
export interface MetrcPackage {
  Id: number
  Label: string
  PackageType: string
  ItemId: number
  Item: string
  Quantity: number
  UnitOfMeasure: string
  FacilityLicenseNumber: string
  FacilityName: string
  SourceHarvestNames?: string
  PackagedDate: string
  IsInTransit: boolean
  IsOnHold: boolean
  ArchivedDate?: string
  FinishedDate?: string
}

/**
 * Metrc package creation payload
 */
export interface MetrcPackageCreate {
  Tag: string
  Item: string
  Quantity: number
  UnitOfMeasure: string
  PackagedDate: string
  Ingredients?: MetrcPackageIngredient[]
  Note?: string
}

/**
 * Package ingredient for creating packages
 */
export interface MetrcPackageIngredient {
  Package: string
  Quantity: number
  UnitOfMeasure: string
}

/**
 * Package adjustment payload
 */
export interface MetrcPackageAdjustment {
  Label: string
  Quantity: number
  UnitOfMeasure: string
  AdjustmentReason: string
  AdjustmentDate: string
  ReasonNote?: string
}

/**
 * Package location change payload
 */
export interface MetrcPackageLocationChange {
  Label: string
  Location: string
  MoveDate: string
}

/**
 * Package finish payload
 */
export interface MetrcPackageFinish {
  Label: string
  ActualDate: string
}

/**
 * Metrc plant structure
 */
export interface MetrcPlant {
  Id: number
  Label: string
  PlantBatchId: number
  PlantBatchName: string
  StrainName: string
  GrowthPhase: 'Clone' | 'Vegetative' | 'Flowering'
  PlantedDate: string
  FacilityLicenseNumber: string
  FacilityName: string
  RoomName?: string
  DestroyedDate?: string
}

/**
 * Metrc plant batch structure
 */
export interface MetrcPlantBatch {
  Id: number
  Name: string
  // v1 API field
  Type?: 'Seed' | 'Clone' | string
  // v2 API field (preferred)
  PlantBatchTypeName?: string
  // v1 API field (may not exist in v2)
  Count?: number
  StrainName: string
  PlantedDate: string
  // v1 API fields (may not exist in v2)
  FacilityLicenseNumber?: string
  FacilityName?: string
  // v1 API field
  RoomName?: string
  // v2 API field (preferred)
  LocationName?: string
  DestroyedDate?: string
  UntrackedCount?: number
  TrackedCount?: number
}

/**
 * Metrc plant batch creation payload
 *
 * Note: Different states may have different field requirements.
 * The v2 API generally uses ActualDate, but PlantedDate is also supported.
 * Source tracking (SourcePackage or SourcePlants) may be required by some states.
 */
export interface MetrcPlantBatchCreate {
  Name: string
  Type: 'Seed' | 'Clone'
  Count: number
  Strain: string
  Location: string
  // Both field names supported - ActualDate is v2 preferred, PlantedDate for backwards compatibility
  ActualDate?: string
  PlantedDate?: string
  // Optional source tracking (required in some states like Oregon, Oklahoma)
  PatientLicenseNumber?: string
  // Source package tag (when creating from seed/clone packages)
  SourcePackage?: string
  // Source plant labels (when cloning from mother plants)
  SourcePlants?: string[]
}

/**
 * Plant batch creation from package payload (Closed Loop)
 *
 * Used with POST /packages/v2/plantings endpoint
 * Different field names than MetrcPlantBatchCreate
 */
export interface MetrcPackagePlantingsCreate {
  PackageLabel: string
  PlantBatchName: string
  PlantBatchType: 'Seed' | 'Clone'
  PlantCount: number
  StrainName: string
  LocationName: string
  UnpackagedDate: string
  PlantedDate: string
  PatientLicenseNumber?: string
}

/**
 * Plant batch creation from mother plants payload (Closed Loop)
 *
 * Used with POST /plants/v2/plantings endpoint
 */
export interface MetrcPlantPlantingsCreate {
  PlantLabel: string
  PlantBatchName: string
  PlantBatchType: 'Clone'
  PlantCount: number
  StrainName: string
  LocationName: string
  ActualDate: string
  PatientLicenseNumber?: string
}

/**
 * Plant batch adjustment payload
 */
export interface MetrcPlantBatchAdjustment {
  Id: number
  Count: number
  AdjustmentReason: string
  AdjustmentDate: string
  ReasonNote?: string
}

/**
 * Plant batch split payload
 */
export interface MetrcPlantBatchSplit {
  PlantBatch: string
  GroupName: string
  Count: number
  Location: string
  Strain: string
  SplitDate: string
}

/**
 * Plant batch package creation payload (Metrc Steps 2 & 3)
 *
 * Used with:
 * - POST /plantbatches/v2/packages (reduces batch count) - Step 3
 * - POST /plantbatches/v2/packages/frommotherplant (keeps batch count) - Step 2
 */
export interface MetrcPlantBatchPackage {
  PlantBatch: string           // Plant batch name/tag
  Count: number                // Number of plants to package
  Location: string | null
  Sublocation?: string | null
  Item: string                 // Item name (e.g., "Clone - Blue Dream")
  Tag: string                  // Package tag
  PatientLicenseNumber?: string | null
  Note?: string
  IsTradeSample: boolean
  IsDonation: boolean
  ActualDate: string           // YYYY-MM-DD
}

/**
 * Plant batch growth phase change payload (Metrc Step 4)
 *
 * Used with POST /plantbatches/v2/growthphase
 * This converts plants from batch-level tracking to individual plant tracking
 * by assigning individual tags starting from StartingTag
 */
export interface MetrcPlantBatchGrowthPhaseChange {
  Name: string                 // Plant batch name
  Count: number                // Number of plants to transition
  StartingTag: string          // First plant tag (Metrc assigns sequentially)
  GrowthPhase: 'Vegetative' | 'Flowering'
  NewLocation: string
  NewSubLocation?: string
  GrowthDate: string           // YYYY-MM-DD
}

/**
 * Plant creation (from plant batch) payload
 */
export interface MetrcPlantingCreate {
  PlantBatch: string
  PlantCount: number
  Location: string
  Strain: string
  PlantedDate: string
  PlantingSource?: 'Clone' | 'Seed'
}

/**
 * Plant growth phase change payload
 */
export interface MetrcPlantGrowthPhaseChange {
  Label: string
  NewLocation: string
  GrowthPhase: 'Vegetative' | 'Flowering'
  NewTag?: string
  GrowthDate: string
}

/**
 * Plant move payload
 */
export interface MetrcPlantMove {
  Label: string
  Location: string
  MoveDate: string
}

/**
 * Plant destroy payload
 */
export interface MetrcPlantDestroy {
  Label: string
  ReasonNote: string
  ActualDate: string
}

/**
 * Harvest creation payload
 */
export interface MetrcHarvestCreate {
  PlantLabels: string[]
  HarvestName: string
  DryingLocation: string
  WasteWeight: number
  WasteUnitOfMeasure: string
  HarvestDate: string
}

/**
 * Harvest package creation payload
 */
export interface MetrcHarvestPackageCreate {
  Tag: string
  Location: string
  Item: string
  Quantity: number
  UnitOfMeasure: string
  ProductionBatchNumber?: string
  PatientLicenseNumber?: string
  Note?: string
  PackagedDate: string
}

/**
 * Harvest finish payload
 */
export interface MetrcHarvestFinish {
  Id: number
  ActualDate: string
}

/**
 * Metrc harvest structure
 */
export interface MetrcHarvest {
  Id: number
  Name: string
  HarvestType: string
  DryingRoomName: string
  SourceStrainNames: string
  PlantCount: number
  HarvestedDate: string
  WetWeight: number
  UnitOfWeight: string
  FacilityLicenseNumber: string
  FinishedDate?: string
  ArchivedDate?: string
}

/**
 * Metrc transfer structure
 */
export interface MetrcTransfer {
  ManifestNumber: string
  ShipperLicenseNumber: string
  ShipperFacilityName: string
  RecipientLicenseNumber: string
  RecipientFacilityName: string
  CreatedDate: string
  EstimatedDepartureDateTime: string
  EstimatedArrivalDateTime: string
  Destinations: MetrcTransferDestination[]
}

/**
 * Transfer destination
 */
export interface MetrcTransferDestination {
  RecipientLicenseNumber: string
  TransferTypeName: string
  PlannedRoute?: string
  Packages: MetrcTransferPackage[]
}

/**
 * Package in transfer
 */
export interface MetrcTransferPackage {
  PackageLabel: string
  Quantity: number
  UnitOfMeasure: string
  PackagedDate: string
  GrossWeight: number
}

/**
 * Transfer creation payload
 */
export interface MetrcTransferCreate {
  ShipperLicenseNumber: string
  ShipmentLicenseType: string
  ShipmentTransactionType: string
  EstimatedDepartureDateTime: string
  EstimatedArrivalDateTime: string
  Destinations: MetrcTransferDestinationCreate[]
}

/**
 * Transfer destination creation payload
 */
export interface MetrcTransferDestinationCreate {
  RecipientLicenseNumber: string
  TransferTypeName: string
  PlannedRoute?: string
  EstimatedDepartureDateTime: string
  EstimatedArrivalDateTime: string
  Packages: MetrcTransferPackageCreate[]
}

/**
 * Transfer package creation payload
 */
export interface MetrcTransferPackageCreate {
  PackageLabel: string
  Quantity: number
  UnitOfMeasure: string
  PackagedDate: string
  GrossWeight?: number
  WholesalePrice?: number
}

/**
 * Transfer update payload
 */
export interface MetrcTransferUpdate {
  ManifestNumber: string
  EstimatedDepartureDateTime?: string
  EstimatedArrivalDateTime?: string
}

/**
 * Metrc sales receipt
 */
export interface MetrcSalesReceipt {
  Id: number
  ReceiptNumber: string
  SalesDateTime: string
  TotalPrice: number
  Transactions: MetrcSalesTransaction[]
}

/**
 * Sales transaction
 */
export interface MetrcSalesTransaction {
  PackageLabel: string
  Quantity: number
  UnitOfMeasure: string
  TotalPrice: number
}

/**
 * Sales receipt creation payload
 */
export interface MetrcSalesReceiptCreate {
  SalesDateTime: string
  SalesCustomerType: string
  PatientLicenseNumber?: string
  CaregiverLicenseNumber?: string
  IdentificationMethod?: string
  Transactions: MetrcSalesTransactionCreate[]
}

/**
 * Sales transaction creation payload
 */
export interface MetrcSalesTransactionCreate {
  PackageLabel: string
  Quantity: number
  UnitOfMeasure: string
  TotalAmount: number
}

/**
 * API request options
 */
export interface MetrcRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
}

/**
 * Pagination options for list requests
 */
export interface MetrcPaginationOptions {
  page?: number
  pageSize?: number
}

/**
 * Metrc v2 API paginated response wrapper
 * All list endpoints return this structure
 */
export interface MetrcPaginatedResponse<T> {
  Data: T[]
  Total: number
  TotalRecords: number
  PageSize: number
  RecordsOnPage: number
}

/**
 * Result from a paginated list request
 */
export interface MetrcListResult<T> {
  data: T[]
  total: number
  pageSize: number
  hasMore: boolean
}

// =====================================================
// LOCATIONS
// =====================================================

/**
 * Metrc location type
 * Types returned from /locations/v2/types endpoint
 */
export interface MetrcLocationType {
  Id: number
  Name: string
  ForPlantBatches: boolean
  ForPlants: boolean
  ForHarvests: boolean
  ForPackages: boolean
}

/**
 * Metrc location structure
 */
export interface MetrcLocation {
  Id: number
  Name: string
  LocationTypeId: number
  LocationTypeName: string
  FacilityLicenseNumber?: string
  FacilityName?: string
}

/**
 * Location creation payload
 */
export interface MetrcLocationCreate {
  Name: string
  LocationTypeId: number
  LocationTypeName: string
}

/**
 * Location update payload
 */
export interface MetrcLocationUpdate {
  Id: number
  Name: string
  LocationTypeId: number
  LocationTypeName: string
}

// =====================================================
// STRAINS
// =====================================================

/**
 * Metrc strain structure
 * Returned from /strains/v2/active and /strains/v2/inactive endpoints
 */
export interface MetrcStrain {
  Id: number
  Name: string
  TestingStatus: string
  ThcLevel: number
  CbdLevel: number
  IndicaPercentage?: number
  SativaPercentage?: number
  IsUsed: boolean
}

/**
 * Strain creation payload
 * Used for POST /strains/v2/
 */
export interface MetrcStrainCreate {
  Name: string
  TestingStatus: string
  ThcLevel: number
  CbdLevel: number
  IndicaPercentage?: number
  SativaPercentage?: number
}

/**
 * Strain update payload
 * Used for PUT /strains/v2/
 */
export interface MetrcStrainUpdate extends MetrcStrainCreate {
  Id: number
}

// =====================================================
// ITEMS
// =====================================================

/**
 * Metrc item structure
 * Returned from /items/v2/active and /items/v2/inactive endpoints
 */
export interface MetrcItem {
  Id: number
  Name: string
  ProductCategoryName: string
  ProductCategoryType: string
  QuantityType: string
  DefaultLabTestingState: string
  UnitOfMeasureName: string
  ApprovalStatus: string
  StrainId?: number
  StrainName?: string
}

/**
 * Item creation payload
 * Used for POST /items/v2/
 */
export interface MetrcItemCreate {
  ItemCategory: string
  Name: string
  UnitOfMeasure: string
  Strain?: string
}

/**
 * Item update payload
 * Used for PUT /items/v2/
 */
export interface MetrcItemUpdate extends MetrcItemCreate {
  Id: number
}

/**
 * Item category structure
 * Returned from /items/v2/categories endpoint
 */
export interface MetrcItemCategory {
  Name: string
  ProductCategoryType: string
  QuantityType: string
  RequiresStrain: boolean
  RequiresUnitCbdPercent: boolean
  RequiresUnitThcPercent: boolean
}

/**
 * Item brand structure
 * Returned from /items/v2/brands endpoint
 */
export interface MetrcBrand {
  Id: number
  Name: string
}

// =====================================================
// LAB TESTS
// =====================================================

/**
 * Lab test type structure
 * Returned from /labtests/v2/types endpoint
 */
export interface MetrcLabTestType {
  Id: number
  Name: string
}

/**
 * Lab test batch structure
 * Returned from /labtests/v2/batches endpoint
 */
export interface MetrcLabTestBatch {
  Id: number
  PackageId: number
  PackageLabel: string
  LabFacilityLicenseNumber: string
  LabFacilityName: string
  TestPerformedDate: string
  OverallPassed: boolean
  TestResults: MetrcLabTestResult[]
}

/**
 * Lab test result structure
 */
export interface MetrcLabTestResult {
  TestTypeName: string
  TestPassed: boolean
  TestResultLevel?: number
  TestComment?: string
  TestInstrument?: string
}

/**
 * Lab test record creation payload
 * Used for POST /labtests/v2/record
 */
export interface MetrcLabTestRecord {
  Label: string
  ResultDate: string
  LabFacilityLicenseNumber: string
  LabFacilityName: string
  Results: {
    TestTypeName: string
    TestPassed: boolean
    TestResultLevel?: number
    TestComment?: string
  }[]
}
