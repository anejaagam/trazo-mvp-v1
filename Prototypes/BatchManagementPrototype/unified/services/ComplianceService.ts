/**
 * Compliance Service Interface
 * 
 * Service layer for compliance operations (mock implementation)
 */

import type { DomainType } from '../types/domains';

/**
 * METRC Submission (Cannabis)
 */
export interface IMetrcSubmission {
  id: string;
  batchId?: string;
  submissionType: 'harvest' | 'package' | 'waste' | 'plant_tag' | 'transfer';
  submittedAt: string;
  submittedBy: string;
  metrcId?: string;
  status: 'pending' | 'success' | 'failed';
  errorMessage?: string;
  payload: Record<string, any>;
}

/**
 * Food Safety Event (Produce)
 */
export interface IFoodSafetyEvent {
  id: string;
  batchId?: string;
  locationId?: string;
  eventType: 'water_test' | 'soil_test' | 'equipment_sanitization' | 'worker_hygiene' | 'inspection';
  eventDate: string;
  performedBy: string;
  passed: boolean;
  notes?: string;
  correctiveActions?: string;
  verifiedBy?: string;
}

/**
 * Compliance Service Interface
 */
export interface IComplianceService {
  /**
   * Submit to METRC (cannabis only)
   */
  submitToMetrc(submission: Omit<IMetrcSubmission, 'id' | 'submittedAt' | 'status'>): Promise<IMetrcSubmission>;

  /**
   * Get METRC submissions
   */
  getMetrcSubmissions(batchId?: string): Promise<IMetrcSubmission[]>;

  /**
   * Record food safety event (produce only)
   */
  recordFoodSafetyEvent(event: Omit<IFoodSafetyEvent, 'id'>): Promise<IFoodSafetyEvent>;

  /**
   * Get food safety events
   */
  getFoodSafetyEvents(batchId?: string, locationId?: string): Promise<IFoodSafetyEvent[]>;

  /**
   * Check compliance status
   */
  checkComplianceStatus(domain: DomainType, entityId: string): Promise<{
    compliant: boolean;
    issues: string[];
    lastChecked: string;
  }>;
}

/**
 * Mock Compliance Service Implementation
 */
export class MockComplianceService implements IComplianceService {
  private readonly METRC_STORAGE_KEY = 'trazo_metrc_submissions';
  private readonly FOOD_SAFETY_STORAGE_KEY = 'trazo_food_safety_events';

  async submitToMetrc(submission: Omit<IMetrcSubmission, 'id' | 'submittedAt' | 'status'>): Promise<IMetrcSubmission> {
    const newSubmission: IMetrcSubmission = {
      ...submission,
      id: `metrc-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'success', // Mock always succeeds
      metrcId: `METRC-${Math.random().toString(36).substring(7).toUpperCase()}`,
    };

    const submissions = this.loadMetrcSubmissions();
    submissions.push(newSubmission);
    localStorage.setItem(this.METRC_STORAGE_KEY, JSON.stringify(submissions));

    return newSubmission;
  }

  async getMetrcSubmissions(batchId?: string): Promise<IMetrcSubmission[]> {
    const submissions = this.loadMetrcSubmissions();
    return batchId
      ? submissions.filter(s => s.batchId === batchId)
      : submissions;
  }

  async recordFoodSafetyEvent(event: Omit<IFoodSafetyEvent, 'id'>): Promise<IFoodSafetyEvent> {
    const newEvent: IFoodSafetyEvent = {
      ...event,
      id: `fs-${Date.now()}`,
    };

    const events = this.loadFoodSafetyEvents();
    events.push(newEvent);
    localStorage.setItem(this.FOOD_SAFETY_STORAGE_KEY, JSON.stringify(events));

    return newEvent;
  }

  async getFoodSafetyEvents(batchId?: string, locationId?: string): Promise<IFoodSafetyEvent[]> {
    const events = this.loadFoodSafetyEvents();
    
    let filtered = events;
    if (batchId) {
      filtered = filtered.filter(e => e.batchId === batchId);
    }
    if (locationId) {
      filtered = filtered.filter(e => e.locationId === locationId);
    }
    
    return filtered;
  }

  async checkComplianceStatus(_domain: DomainType, _entityId: string): Promise<{
    compliant: boolean;
    issues: string[];
    lastChecked: string;
  }> {
    // Mock implementation - always returns compliant
    return {
      compliant: true,
      issues: [],
      lastChecked: new Date().toISOString(),
    };
  }

  private loadMetrcSubmissions(): IMetrcSubmission[] {
    const data = localStorage.getItem(this.METRC_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private loadFoodSafetyEvents(): IFoodSafetyEvent[] {
    const data = localStorage.getItem(this.FOOD_SAFETY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}

/**
 * Create compliance service instance
 */
export function createComplianceService(): IComplianceService {
  return new MockComplianceService();
}
