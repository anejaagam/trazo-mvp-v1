export type ItemCategory = "co2" | "filter" | "chemical" | "nutrient" | "seed" | "consumable";

export type MovementType = "receive" | "issue" | "adjust" | "dispose";

export type UserRole = "operator" | "site_manager" | "compliance";

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  uom: string;
  safetyNote?: string;
  active: boolean;
  parLevel?: number;
}

export interface Lot {
  id: string;
  itemId: string;
  lotCode?: string;
  expiryDate?: string;
  receivedAt: string;
  receivedQty: number;
}

export interface StockBalance {
  itemId: string;
  siteId: string;
  onHand: number;
  parLevel?: number;
  lastCountAt: string;
}

export interface Movement {
  id: string;
  type: MovementType;
  itemId: string;
  lotId?: string;
  lotCode?: string;
  quantity: number;
  uom: string;
  siteId: string;
  batchId?: string;
  batchName?: string;
  actorId: string;
  actorName: string;
  reason?: string;
  evidenceLink?: string;
  expiryDate?: string;
  timestamp: string;
}

export interface Batch {
  id: string;
  name: string;
  strain?: string;
  startDate: string;
  status: "active" | "completed" | "archived";
  locked: boolean;
}

export interface BatchConsumptionTotal {
  batchId: string;
  itemId: string;
  quantity: number;
  lastUpdated: string;
}

// Post-Harvest & Metrc Types
export type PackageStatus = "active" | "lab_sample" | "in_transit" | "transferred" | "destroyed";
export type PackageType = "harvest" | "product" | "sample" | "waste";

export interface MetrcPackage {
  id: string;
  uid: string; // Metrc UID
  batchId: string;
  batchName: string;
  packageType: PackageType;
  status: PackageStatus;
  weight: number;
  weightUom: string;
  strainName?: string;
  productName?: string;
  createdAt: string;
  createdBy: string;
  testResults?: TestResult;
  labSampleDate?: string;
  notes?: string;
}

export interface TestResult {
  id: string;
  packageId: string;
  labName: string;
  testDate: string;
  resultDate: string;
  thcPercent?: number;
  cbdPercent?: number;
  passed: boolean;
  contaminants?: string[];
  certificateUrl?: string;
}

export interface TransferManifest {
  id: string;
  manifestNumber: string;
  packages: string[]; // Package IDs
  recipientLicense: string;
  recipientName: string;
  recipientAddress: string;
  driverName: string;
  driverLicense: string;
  vehicleNumber: string;
  vehicleMake?: string;
  departureTime?: string;
  arrivalTime?: string;
  status: "draft" | "pending" | "in_transit" | "delivered" | "rejected";
  createdAt: string;
  createdBy: string;
  notes?: string;
}

export interface WasteLog {
  id: string;
  wasteType: "plant" | "harvest" | "product" | "mixed";
  reason: "failed_test" | "contaminated" | "damaged" | "expired" | "trim" | "other";
  reasonDetail?: string;
  weight: number;
  weightUom: string;
  method: "compost" | "landfill" | "incineration" | "grind_mix" | "other";
  methodDetail?: string;
  holdStartDate: string;
  holdEndDate: string; // 3-day hold for OR
  disposalDate?: string;
  status: "hold" | "ready" | "disposed";
  witnessName?: string;
  witnessSignature?: string;
  photoEvidence?: string;
  batchIds?: string[];
  packageIds?: string[];
  createdAt: string;
  createdBy: string;
}

export interface ComplianceLabel {
  id: string;
  packageId: string;
  batchId: string;
  labelType: "package" | "product" | "sample";
  state: "OR" | "CA" | "WA" | "CO" | "Other";
  productName: string;
  strainName?: string;
  weight: string;
  thc?: string;
  cbd?: string;
  testDate?: string;
  harvestDate?: string;
  packageDate: string;
  expiryDate?: string;
  warnings: string[];
  qrCode?: string;
  universalSymbol: boolean;
  preApprovalNumber?: string; // OR specific
  licenseNumber: string;
  createdAt: string;
  printedAt?: string;
  printedBy?: string;
}
