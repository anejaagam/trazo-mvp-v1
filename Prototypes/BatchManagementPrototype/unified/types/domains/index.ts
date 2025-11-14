/**
 * Domain Type System - Index
 * 
 * Central export for all domain types, discriminated unions, and type guards
 */

// Export base types
export * from './base';

// Export domain-specific types
export * from './cannabis';
export * from './produce';

import type { ICannabisBatch, ICannabisLocation, ICannabisCultivar } from './cannabis';
import type { IProduceBatch, IProduceLocation, IProduceCultivar } from './produce';
import type { DomainType } from './base';

/**
 * Discriminated Union Types
 * Use these for type-safe domain handling
 */

export type DomainBatch = ICannabisBatch | IProduceBatch;
export type DomainLocation = ICannabisLocation | IProduceLocation;
export type DomainCultivar = ICannabisCultivar | IProduceCultivar;

/**
 * Type Guards
 * Use these to narrow union types to specific domains
 */

export function isCannabisBatch(batch: DomainBatch): batch is ICannabisBatch {
  return batch.domainType === 'cannabis';
}

export function isProduceBatch(batch: DomainBatch): batch is IProduceBatch {
  return batch.domainType === 'produce';
}

export function isCannabisLocation(location: DomainLocation): location is ICannabisLocation {
  return location.domainType === 'cannabis';
}

export function isProduceLocation(location: DomainLocation): location is IProduceLocation {
  return location.domainType === 'produce';
}

export function isCannabisCultivar(cultivar: DomainCultivar): cultivar is ICannabisCultivar {
  return cultivar.domainType === 'cannabis';
}

export function isProduceCultivar(cultivar: DomainCultivar): cultivar is IProduceCultivar {
  return cultivar.domainType === 'produce';
}

/**
 * Domain Type Helpers
 */

export function getDomainFromBatch(batch: DomainBatch): DomainType {
  return batch.domainType;
}

export function getDomainFromLocation(location: DomainLocation): DomainType {
  return location.domainType;
}

export function getDomainFromCultivar(cultivar: DomainCultivar): DomainType {
  return cultivar.domainType;
}

/**
 * Shared Enums and Constants
 */

export const DOMAIN_TYPES = ['cannabis', 'produce'] as const;

export const BATCH_STATUSES = ['active', 'quarantined', 'completed', 'closed'] as const;

export const QUARANTINE_STATUSES = ['none', 'quarantined', 'released'] as const;

export const EVENT_TYPES = ['stage_change', 'alarm', 'override', 'note', 'qa_check', 'compliance'] as const;

/**
 * Type Utilities
 */

// Extract stage type from batch
export type StageOf<T extends DomainBatch> = T['stage'];

// Extract location type from domain location
export type LocationTypeOf<T extends DomainLocation> = 
  T extends ICannabisLocation ? T['roomType'] : 
  T extends IProduceLocation ? T['areaType'] : 
  never;
