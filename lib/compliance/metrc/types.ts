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
