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
  Type: 'Seed' | 'Clone'
  Count: number
  StrainName: string
  PlantedDate: string
  FacilityLicenseNumber: string
  FacilityName: string
  RoomName?: string
  DestroyedDate?: string
  UntrackedCount: number
  TrackedCount: number
}

/**
 * Metrc plant batch creation payload
 */
export interface MetrcPlantBatchCreate {
  Name: string
  Type: 'Seed' | 'Clone'
  Count: number
  Strain: string
  Location: string
  PlantedDate: string
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
 * Pagination options
 */
export interface MetrcPaginationOptions {
  limit?: number
  offset?: number
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
}

/**
 * Location update payload
 */
export interface MetrcLocationUpdate {
  Id: number
  Name: string
  LocationTypeId: number
}
