/**
 * Mock Data Provider
 * 
 * Service for providing domain-specific mock data
 */

import type { DomainType, DomainBatch, DomainLocation, DomainCultivar, IBatchGroup, ITimelineEvent } from '../types/domains';
import {
  mockCannabisBatches,
  mockCannabisPods,
  mockCannabisCultivars,
  mockCannabisBatchGroups,
  mockCannabisTimelineEvents,
} from './mockData/cannabis';
import {
  mockProduceBatches,
  mockProduceAreas,
  mockProduceCultivars,
  mockProduceBatchGroups,
  mockProduceTimelineEvents,
} from './mockData/produce';
import { mockUsers, mockFacility, type IUser, type IFacility } from './mockData/shared';

/**
 * Mock Data Provider Class
 */
export class MockDataProvider {
  private domain: DomainType;

  constructor(domain: DomainType) {
    this.domain = domain;
  }

  /**
   * Set the current domain
   */
  setDomain(domain: DomainType): void {
    this.domain = domain;
  }

  /**
   * Get current domain
   */
  getDomain(): DomainType {
    return this.domain;
  }

  /**
   * Get batches for current domain
   */
  getBatches(): DomainBatch[] {
    return this.domain === 'cannabis' ? mockCannabisBatches : mockProduceBatches;
  }

  /**
   * Get locations for current domain
   */
  getLocations(): DomainLocation[] {
    return this.domain === 'cannabis' ? mockCannabisPods : mockProduceAreas;
  }

  /**
   * Get cultivars for current domain
   */
  getCultivars(): DomainCultivar[] {
    return this.domain === 'cannabis' ? mockCannabisCultivars : mockProduceCultivars;
  }

  /**
   * Get batch groups for current domain
   */
  getBatchGroups(): IBatchGroup[] {
    return this.domain === 'cannabis' ? mockCannabisBatchGroups : mockProduceBatchGroups;
  }

  /**
   * Get timeline events for current domain
   */
  getTimelineEvents(): ITimelineEvent[] {
    return this.domain === 'cannabis' ? mockCannabisTimelineEvents : mockProduceTimelineEvents;
  }

  /**
   * Get users (shared across domains)
   */
  getUsers(): IUser[] {
    return mockUsers;
  }

  /**
   * Get facility info (shared across domains)
   */
  getFacility(): IFacility {
    return mockFacility;
  }

  /**
   * Get batch by ID
   */
  getBatchById(id: string): DomainBatch | undefined {
    return this.getBatches().find(b => b.id === id);
  }

  /**
   * Get location by ID
   */
  getLocationById(id: string): DomainLocation | undefined {
    return this.getLocations().find(l => l.id === id);
  }

  /**
   * Get cultivar by ID
   */
  getCultivarById(id: string): DomainCultivar | undefined {
    return this.getCultivars().find(c => c.id === id);
  }

  /**
   * Get batch group by ID
   */
  getBatchGroupById(id: string): IBatchGroup | undefined {
    return this.getBatchGroups().find(g => g.id === id);
  }

  /**
   * Get timeline events for a batch
   */
  getTimelineEventsByBatchId(batchId: string): ITimelineEvent[] {
    return this.getTimelineEvents().filter(e => e.batchId === batchId);
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): IUser | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  /**
   * Get batches by stage
   */
  getBatchesByStage(stage: string): DomainBatch[] {
    return this.getBatches().filter(b => b.stage === stage);
  }

  /**
   * Get batches by location
   */
  getBatchesByLocation(locationId: string): DomainBatch[] {
    return this.getBatches().filter(b => b.locationIds.includes(locationId));
  }

  /**
   * Get batches by cultivar
   */
  getBatchesByCultivar(cultivarId: string): DomainBatch[] {
    return this.getBatches().filter(b => b.cultivarId === cultivarId);
  }

  /**
   * Get batches by group
   */
  getBatchesByGroup(groupId: string): DomainBatch[] {
    return this.getBatches().filter(b => b.groupId === groupId);
  }

  /**
   * Get available locations (with capacity)
   */
  getAvailableLocations(): DomainLocation[] {
    return this.getLocations().filter(l => {
      const current = l.currentPlantCount || 0;
      return current < l.capacity;
    });
  }

  /**
   * Get active cultivars
   */
  getActiveCultivars(): DomainCultivar[] {
    return this.getCultivars().filter(c => c.isActive);
  }
}

/**
 * Create a mock data provider instance
 */
export function createMockDataProvider(domain: DomainType = 'cannabis'): MockDataProvider {
  return new MockDataProvider(domain);
}

/**
 * Default export for convenience
 */
export default MockDataProvider;
