// Integration Types
export type IntegrationStatus = "active" | "inactive" | "coming-soon";
export type IntegrationCategory = "notifications" | "authentication" | "hardware" | "compliance";

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: IntegrationStatus;
  category: IntegrationCategory;
  mvp: boolean;
}

// Push Notification Configuration
export interface PushNotificationConfig {
  fcmServerKey: string;
  fcmSenderId?: string;
  apnsKeyId: string;
  apnsTeamId: string;
  apnsBundleId: string;
  apnsKeyFile?: File;
  enableBadges: boolean;
  enableSounds: boolean;
  enableVibration: boolean;
}

// Email Configuration
export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  enableAlerts: boolean;
  enableReports: boolean;
  enableDigests: boolean;
}

// SSO Configuration
export interface SSOConfig {
  // Google
  googleEnabled: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  
  // Microsoft
  microsoftEnabled: boolean;
  microsoftClientId?: string;
  microsoftTenantId?: string;
  microsoftClientSecret?: string;
  
  // OIDC
  oidcEnabled: boolean;
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcScopes?: string;
  
  // SAML
  samlEnabled: boolean;
  samlEntityId?: string;
  samlSsoUrl?: string;
  samlCertificate?: string;
  
  callbackUrl: string;
}

// Metrc Configuration
export type MetrcState = 
  | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "HI" | "IL" 
  | "LA" | "ME" | "MA" | "MD" | "MI" | "MO" | "MT" | "NV" | "NJ" | "NM" 
  | "NY" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "UT" | "VT" | "VA" 
  | "WA" | "WV";

export type MetrcSyncInterval = "5" | "15" | "30" | "60" | "120" | "240";

export interface MetrcConfig {
  apiKey: string;
  userKey: string;
  state: MetrcState;
  facilityLicense: string;
  autoSync: boolean;
  syncInterval: MetrcSyncInterval;
  syncInventory: boolean;
  syncPackages: boolean;
  syncPlants: boolean;
  syncTransfers: boolean;
  syncSales: boolean;
}

// Metrc API Response Types
export interface MetrcFacility {
  HireDate: string | null;
  IsOwner: boolean;
  IsManager: boolean;
  Occupations: string | null;
  Name: string;
  Alias: string | null;
  DisplayName: string;
  CredentialedDate: string;
  SupportActivationDate: string | null;
  SupportExpirationDate: string | null;
  SupportLastPaidDate: string | null;
  FacilityType: {
    Id: number;
    Name: string;
  } | null;
  License: {
    Number: string;
    StartDate: string;
    EndDate: string;
    LicenseType: string;
  };
}

export interface MetrcPackage {
  Id: number;
  Label: string;
  PackageType: string;
  Quantity: number;
  UnitOfMeasureName: string;
  PatientLicenseNumber: string | null;
  ItemId: number;
  Item: {
    Id: number;
    Name: string;
    ProductCategoryName: string;
    ProductCategoryType: string;
    QuantityType: string;
    DefaultLabTestingState: string;
    UnitOfMeasureName: string;
    ApprovalStatus: string;
    StrainName: string | null;
    ItemBrandId: number | null;
  };
  Archived: boolean;
  ProductionBatchNumber: string | null;
  SourceProductionBatchNumbers: string | null;
  PackagedDate: string;
  InitialLabTestingState: string;
  LabTestingState: string;
  LabTestingStateDate: string;
  IsProductionBatch: boolean;
  ProductionBatchTypeId: number | null;
  ProductionBatchTypeName: string | null;
  SourcePackageLabels: string | null;
  IsOnHold: boolean;
  ArchivedDate: string | null;
  FinishedDate: string | null;
  LastModified: string;
}

export interface MetrcPlant {
  Id: number;
  Label: string;
  State: string;
  GrowthPhase: string;
  PlantBatchId: number | null;
  PlantBatchName: string | null;
  PlantBatchTypeName: string | null;
  StrainId: number;
  StrainName: string;
  LocationId: number;
  LocationName: string;
  LocationTypeName: string | null;
  PatientLicenseNumber: string | null;
  HarvestId: number | null;
  HarvestedDate: string | null;
  DestroyedDate: string | null;
  DestroyedNote: string | null;
  PlantedDate: string;
  VegetativeDate: string | null;
  FloweringDate: string | null;
  LastModified: string;
}

export interface MetrcTransfer {
  Id: number;
  ManifestNumber: string;
  ShipmentLicenseType: string;
  ShipperFacilityLicenseNumber: string;
  ShipperFacilityName: string;
  RecipientFacilityLicenseNumber: string;
  RecipientFacilityName: string;
  ShipmentTypeName: string;
  ShipmentTransactionType: string;
  EstimatedDepartureDateTime: string;
  ActualDepartureDateTime: string | null;
  EstimatedArrivalDateTime: string;
  ActualArrivalDateTime: string | null;
  DeliveryPackageCount: number;
  DeliveryReceivedPackageCount: number;
  ReceivedDateTime: string | null;
  CreatedDateTime: string;
  LastModified: string;
}

export interface MetrcSale {
  Id: number;
  SalesDateTime: string;
  SalesCustomerType: string;
  PatientLicenseNumber: string | null;
  CaregiverLicenseNumber: string | null;
  IdentificationMethod: string | null;
  Transactions: Array<{
    PackageId: number;
    PackageLabel: string;
    ProductName: string;
    ProductCategoryName: string;
    ItemStrainName: string | null;
    ItemUnitCbdPercent: number | null;
    ItemUnitCbdContent: number | null;
    ItemUnitCbdContentUnitOfMeasureName: string | null;
    ItemUnitCbdContentDose: number | null;
    ItemUnitCbdContentDoseUnitOfMeasureName: string | null;
    ItemUnitThcPercent: number | null;
    ItemUnitThcContent: number | null;
    ItemUnitThcContentUnitOfMeasureName: string | null;
    ItemUnitThcContentDose: number | null;
    ItemUnitThcContentDoseUnitOfMeasureName: string | null;
    ItemUnitVolume: number | null;
    ItemUnitVolumeUnitOfMeasureName: string | null;
    ItemUnitWeight: number | null;
    ItemUnitWeightUnitOfMeasureName: string | null;
    ItemServingSize: string | null;
    ItemSupplyDurationDays: number | null;
    ItemUnitQuantity: number | null;
    ItemUnitQuantityUnitOfMeasureName: string | null;
    QuantitySold: number;
    UnitOfMeasureName: string;
    UnitOfMeasureAbbreviation: string;
    TotalAmount: number;
  }>;
  TotalPackages: number;
  TotalPrice: number;
  LastModified: string;
}

// Sync Status
export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncResult {
  status: SyncStatus;
  timestamp: string;
  recordsSynced?: number;
  errors?: string[];
}

// BioTrack Configuration (Future)
export interface BioTrackConfig {
  apiKey: string;
  vendorKey: string;
  locationId: string;
  autoSync: boolean;
  syncInterval: string;
}

// tagIO Configuration (Future)
export interface TagIOConfig {
  apiKey: string;
  devices: Array<{
    id: string;
    name: string;
    type: "temperature" | "humidity" | "light" | "co2";
    location: string;
  }>;
  alertThresholds: {
    temperature?: { min: number; max: number };
    humidity?: { min: number; max: number };
    co2?: { max: number };
  };
}

// Trazo Edge Gateway Configuration (Future)
export interface TrazoConfig {
  gatewayId: string;
  protocol: "modbus-rtu" | "modbus-tcp";
  ipAddress?: string;
  port?: number;
  slaveId?: number;
  serialPort?: string;
  baudRate?: number;
  devices: Array<{
    id: string;
    name: string;
    registerAddress: number;
    dataType: string;
  }>;
}
