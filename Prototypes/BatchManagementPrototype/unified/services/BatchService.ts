/**
 * Batch Service Interface
 * 
 * Service layer for batch CRUD operations with localStorage implementation
 */

import type { DomainType, DomainBatch } from '../types/domains';

/**
 * Batch Service Interface
 */
export interface IBatchService {
  /**
   * Get all batches for a domain
   */
  getAll(domain: DomainType): Promise<DomainBatch[]>;

  /**
   * Get batch by ID
   */
  getById(id: string): Promise<DomainBatch | null>;

  /**
   * Create a new batch
   */
  create(batch: DomainBatch): Promise<DomainBatch>;

  /**
   * Update an existing batch
   */
  update(id: string, updates: Partial<DomainBatch>): Promise<DomainBatch>;

  /**
   * Delete a batch
   */
  delete(id: string): Promise<void>;

  /**
   * Get batches by stage
   */
  getByStage(domain: DomainType, stage: string): Promise<DomainBatch[]>;

  /**
   * Get batches by location
   */
  getByLocation(locationId: string): Promise<DomainBatch[]>;

  /**
   * Get batches by cultivar
   */
  getByCultivar(cultivarId: string): Promise<DomainBatch[]>;

  /**
   * Get batches by group
   */
  getByGroup(groupId: string): Promise<DomainBatch[]>;

  /**
   * Transition batch to new stage
   */
  transitionStage(id: string, newStage: string): Promise<DomainBatch>;

  /**
   * Quarantine a batch
   */
  quarantine(id: string, reason: string, by: string): Promise<DomainBatch>;

  /**
   * Release batch from quarantine
   */
  releaseFromQuarantine(id: string, by: string): Promise<DomainBatch>;
}

/**
 * localStorage Keys
 */
const STORAGE_KEYS = {
  cannabis: 'trazo_cannabis_batches',
  produce: 'trazo_produce_batches',
} as const;

/**
 * localStorage Batch Service Implementation
 */
export class LocalStorageBatchService implements IBatchService {
  private getStorageKey(domain: DomainType): string {
    return STORAGE_KEYS[domain];
  }

  private loadBatches(domain: DomainType): DomainBatch[] {
    const key = this.getStorageKey(domain);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveBatches(domain: DomainType, batches: DomainBatch[]): void {
    const key = this.getStorageKey(domain);
    localStorage.setItem(key, JSON.stringify(batches));
  }

  async getAll(domain: DomainType): Promise<DomainBatch[]> {
    return this.loadBatches(domain);
  }

  async getById(id: string): Promise<DomainBatch | null> {
    // Try both domains
    const cannabisBatches = this.loadBatches('cannabis');
    const cannabisBatch = cannabisBatches.find(b => b.id === id);
    if (cannabisBatch) return cannabisBatch;

    const produceBatches = this.loadBatches('produce');
    const produceBatch = produceBatches.find(b => b.id === id);
    return produceBatch || null;
  }

  async create(batch: DomainBatch): Promise<DomainBatch> {
    const batches = this.loadBatches(batch.domainType);
    batches.push(batch);
    this.saveBatches(batch.domainType, batches);
    return batch;
  }

  async update(id: string, updates: Partial<DomainBatch>): Promise<DomainBatch> {
    const batch = await this.getById(id);
    if (!batch) {
      throw new Error(`Batch not found: ${id}`);
    }

    const batches = this.loadBatches(batch.domainType);
    const index = batches.findIndex(b => b.id === id);
    
    if (index === -1) {
      throw new Error(`Batch not found: ${id}`);
    }

    const updatedBatch = { ...batches[index], ...updates } as DomainBatch;
    batches[index] = updatedBatch;
    this.saveBatches(batch.domainType, batches);
    
    return updatedBatch;
  }

  async delete(id: string): Promise<void> {
    const batch = await this.getById(id);
    if (!batch) {
      throw new Error(`Batch not found: ${id}`);
    }

    const batches = this.loadBatches(batch.domainType);
    const filtered = batches.filter(b => b.id !== id);
    this.saveBatches(batch.domainType, filtered);
  }

  async getByStage(domain: DomainType, stage: string): Promise<DomainBatch[]> {
    const batches = this.loadBatches(domain);
    return batches.filter(b => b.stage === stage);
  }

  async getByLocation(locationId: string): Promise<DomainBatch[]> {
    // Search both domains
    const cannabisBatches = this.loadBatches('cannabis');
    const produceBatches = this.loadBatches('produce');
    const allBatches = [...cannabisBatches, ...produceBatches];
    
    return allBatches.filter(b => b.locationIds.includes(locationId));
  }

  async getByCultivar(cultivarId: string): Promise<DomainBatch[]> {
    // Search both domains
    const cannabisBatches = this.loadBatches('cannabis');
    const produceBatches = this.loadBatches('produce');
    const allBatches = [...cannabisBatches, ...produceBatches];
    
    return allBatches.filter(b => b.cultivarId === cultivarId);
  }

  async getByGroup(groupId: string): Promise<DomainBatch[]> {
    // Search both domains
    const cannabisBatches = this.loadBatches('cannabis');
    const produceBatches = this.loadBatches('produce');
    const allBatches = [...cannabisBatches, ...produceBatches];
    
    return allBatches.filter(b => b.groupId === groupId);
  }

  async transitionStage(id: string, newStage: string): Promise<DomainBatch> {
    return this.update(id, { stage: newStage } as Partial<DomainBatch>);
  }

  async quarantine(id: string, reason: string, by: string): Promise<DomainBatch> {
    return this.update(id, {
      quarantineStatus: 'quarantined',
      quarantineReason: reason,
      quarantinedAt: new Date().toISOString(),
      quarantinedBy: by,
    });
  }

  async releaseFromQuarantine(id: string, by: string): Promise<DomainBatch> {
    return this.update(id, {
      quarantineStatus: 'released',
      quarantinedBy: by,
    });
  }
}

/**
 * Create batch service instance
 */
export function createBatchService(): IBatchService {
  return new LocalStorageBatchService();
}
