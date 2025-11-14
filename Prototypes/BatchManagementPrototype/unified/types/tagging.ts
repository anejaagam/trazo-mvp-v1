/**
 * Unified Plant Tagging Types
 * 
 * Types for plant tagging workflows (primarily cannabis)
 */

/**
 * Tag Status
 */
export type TagStatus = 
  | 'available'
  | 'assigned'
  | 'active'
  | 'harvested'
  | 'destroyed'
  | 'lost'
  | 'retired';

/**
 * Plant Tag
 */
export interface IPlantTag {
  id: string;
  tagNumber: string;
  metrcTag?: string; // METRC tag ID for cannabis
  batchId?: string;
  plantId?: string;
  status: TagStatus;
  assignedAt?: string;
  assignedBy?: string;
  retiredAt?: string;
  retiredReason?: string;
  notes?: string;
}

/**
 * Tag Assignment
 */
export interface ITagAssignment {
  id: string;
  batchId: string;
  plantIds: string[];
  tagIds: string[];
  assignedBy: string;
  assignedAt: string;
  notes?: string;
}

/**
 * Tag Batch/Bulk Operation
 */
export interface ITagBulkOperation {
  id: string;
  operationType: 'assign' | 'retire' | 'replace';
  tagIds: string[];
  performedBy: string;
  performedAt: string;
  reason?: string;
  notes?: string;
}

/**
 * Tag Inventory
 */
export interface ITagInventory {
  id: string;
  location: string;
  tagRangeStart: string;
  tagRangeEnd: string;
  totalTags: number;
  availableTags: number;
  assignedTags: number;
  retiredTags: number;
  lastUpdated: string;
}

/**
 * Tag Compliance Report (Cannabis)
 */
export interface ITagComplianceReport {
  id: string;
  reportDate: string;
  reportedBy: string;
  totalPlants: number;
  taggedPlants: number;
  untaggedPlants: number;
  complianceRate: number; // percentage
  issues: {
    plantId: string;
    issue: 'missing_tag' | 'duplicate_tag' | 'invalid_tag';
    description: string;
  }[];
}
