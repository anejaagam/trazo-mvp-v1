import type { MetrcPackage, TransferManifest, WasteLog, ComplianceLabel } from "./types";

export const mockPackages: MetrcPackage[] = [
  {
    id: "pkg-1",
    uid: "1A4060300002331000000101",
    batchId: "batch-1",
    batchName: "BG-24-001",
    packageType: "harvest",
    status: "active",
    weight: 5000,
    weightUom: "g",
    strainName: "Blue Dream",
    createdAt: "2025-10-10T14:30:00Z",
    createdBy: "John Doe",
    notes: "Initial harvest package"
  },
  {
    id: "pkg-2",
    uid: "1A4060300002331000000102",
    batchId: "batch-1",
    batchName: "BG-24-001",
    packageType: "sample",
    status: "lab_sample",
    weight: 50,
    weightUom: "g",
    strainName: "Blue Dream",
    createdAt: "2025-10-11T09:15:00Z",
    createdBy: "Jane Smith",
    labSampleDate: "2025-10-11T10:00:00Z",
    testResults: {
      id: "test-1",
      packageId: "pkg-2",
      labName: "Oregon Testing Labs",
      testDate: "2025-10-11T10:00:00Z",
      resultDate: "2025-10-14T16:00:00Z",
      thcPercent: 22.5,
      cbdPercent: 0.8,
      passed: true,
      certificateUrl: "https://example.com/cert-001.pdf"
    }
  },
  {
    id: "pkg-3",
    uid: "1A4060300002331000000103",
    batchId: "batch-2",
    batchName: "BG-24-002",
    packageType: "harvest",
    status: "active",
    weight: 4500,
    weightUom: "g",
    strainName: "OG Kush",
    createdAt: "2025-10-12T11:00:00Z",
    createdBy: "John Doe"
  }
];

export const mockManifests: TransferManifest[] = [
  {
    id: "man-1",
    manifestNumber: "MAN-2025-001",
    packages: ["pkg-1"],
    recipientLicense: "100-ABCD",
    recipientName: "Portland Cannabis Dispensary",
    recipientAddress: "123 Main St, Portland, OR 97201",
    driverName: "Mike Johnson",
    driverLicense: "OR-DL-12345678",
    vehicleNumber: "VEH-001",
    vehicleMake: "Ford Transit",
    status: "draft",
    createdAt: "2025-10-15T08:00:00Z",
    createdBy: "Jane Smith"
  },
  {
    id: "man-2",
    manifestNumber: "MAN-2025-002",
    packages: ["pkg-3"],
    recipientLicense: "100-EFGH",
    recipientName: "Salem Processing Facility",
    recipientAddress: "456 Industrial Blvd, Salem, OR 97301",
    driverName: "Sarah Williams",
    driverLicense: "OR-DL-87654321",
    vehicleNumber: "VEH-002",
    vehicleMake: "Chevrolet Silverado",
    departureTime: "2025-10-14T07:00:00Z",
    arrivalTime: "2025-10-14T09:30:00Z",
    status: "delivered",
    createdAt: "2025-10-13T14:00:00Z",
    createdBy: "John Doe"
  }
];

export const mockWasteLogs: WasteLog[] = [
  {
    id: "waste-1",
    wasteType: "harvest",
    reason: "failed_test",
    reasonDetail: "Failed pesticide screening",
    weight: 250,
    weightUom: "g",
    method: "grind_mix",
    methodDetail: "Mixed with kitty litter and coffee grounds (50% cannabis, 50% non-cannabis)",
    holdStartDate: "2025-10-10T12:00:00Z",
    holdEndDate: "2025-10-13T12:00:00Z",
    disposalDate: "2025-10-13T14:30:00Z",
    status: "disposed",
    witnessName: "Jane Smith",
    batchIds: ["batch-3"],
    packageIds: ["pkg-4"],
    createdAt: "2025-10-10T12:00:00Z",
    createdBy: "John Doe"
  },
  {
    id: "waste-2",
    wasteType: "trim",
    reason: "trim",
    weight: 500,
    weightUom: "g",
    method: "compost",
    methodDetail: "Added to on-site composting facility",
    holdStartDate: "2025-10-15T10:00:00Z",
    holdEndDate: "2025-10-18T10:00:00Z",
    status: "hold",
    batchIds: ["batch-1", "batch-2"],
    createdAt: "2025-10-15T10:00:00Z",
    createdBy: "Mike Anderson"
  }
];

export const mockLabels: ComplianceLabel[] = [
  {
    id: "label-1",
    packageId: "pkg-1",
    batchId: "batch-1",
    labelType: "package",
    state: "OR",
    productName: "Blue Dream - Flower",
    strainName: "Blue Dream",
    weight: "5000g",
    thc: "22.5%",
    cbd: "0.8%",
    testDate: "2025-10-11",
    harvestDate: "2025-09-20",
    packageDate: "2025-10-10",
    warnings: [
      "For use only by adults 21 years of age or older",
      "Keep out of reach of children",
      "Marijuana use during pregnancy or breastfeeding can be harmful",
      "Marijuana impairs your ability to drive and operate machinery"
    ],
    universalSymbol: true,
    preApprovalNumber: "OR-LABEL-2024-1234",
    licenseNumber: "100-XXXX",
    createdAt: "2025-10-10T15:00:00Z",
    printedAt: "2025-10-10T15:05:00Z",
    printedBy: "Jane Smith"
  }
];
