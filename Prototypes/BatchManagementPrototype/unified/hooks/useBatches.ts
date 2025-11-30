/**
 * useBatches Hook
 * 
 * Domain-aware batch management hook
 */

import { useState, useEffect, useCallback } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { createBatchService } from '../services/BatchService';
import type { DomainBatch } from '../types/domains';
import type { BatchStatus, QuarantineStatus } from '../types/domains/base';

const batchService = createBatchService();

export interface BatchFilters {
  status?: BatchStatus;
  stage?: string;
  locationId?: string;
  cultivarId?: string;
  groupId?: string;
  quarantineStatus?: QuarantineStatus;
  search?: string;
}

export interface UseBatchesReturn {
  batches: DomainBatch[];
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  createBatch: (batch: Omit<DomainBatch, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DomainBatch>;
  updateBatch: (id: string, updates: Partial<DomainBatch>) => Promise<DomainBatch>;
  deleteBatch: (id: string) => Promise<void>;
  
  // Stage transitions
  transitionStage: (batchId: string, newStage: string) => Promise<DomainBatch>;
  
  // Quarantine operations
  quarantineBatch: (batchId: string, reason: string) => Promise<DomainBatch>;
  releaseFromQuarantine: (batchId: string) => Promise<DomainBatch>;
  
  // Filtering and search
  applyFilters: (filters: BatchFilters) => void;
  clearFilters: () => void;
  
  // Refresh data
  refresh: () => Promise<void>;
}

/**
 * Domain-aware batch management hook
 */
export function useBatches(initialFilters?: BatchFilters): UseBatchesReturn {
  const { domain } = useDomain();
  const [batches, setBatches] = useState<DomainBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<DomainBatch[]>([]);
  const [filters, setFilters] = useState<BatchFilters>(initialFilters || {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load batches for current domain
  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await batchService.getAll(domain);
      setBatches(data);
      setFilteredBatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, [domain]);

  // Load batches when domain changes
  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // Apply filters whenever batches or filters change
  useEffect(() => {
    let result = [...batches];

    if (filters.status) {
      result = result.filter(b => b.status === filters.status);
    }

    if (filters.stage) {
      result = result.filter(b => b.stage === filters.stage);
    }

    if (filters.locationId) {
      result = result.filter(b => b.locationIds.includes(filters.locationId!));
    }

    if (filters.cultivarId) {
      result = result.filter(b => b.cultivarId === filters.cultivarId);
    }

    if (filters.groupId) {
      result = result.filter(b => b.groupId === filters.groupId);
    }

    if (filters.quarantineStatus) {
      result = result.filter(b => b.quarantineStatus === filters.quarantineStatus);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBatches(result);
  }, [batches, filters]);

  // CRUD operations
  const createBatch = useCallback(async (batch: Omit<DomainBatch, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const batchWithDomain = { ...batch, domainType: domain } as DomainBatch;
      const newBatch = await batchService.create(batchWithDomain);
      setBatches(prev => [...prev, newBatch]);
      return newBatch;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create batch';
      setError(message);
      throw new Error(message);
    }
  }, [domain]);

  const updateBatch = useCallback(async (id: string, updates: Partial<DomainBatch>) => {
    try {
      const updated = await batchService.update(id, updates);
      setBatches(prev => prev.map(b => b.id === id ? updated : b));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update batch';
      setError(message);
      throw new Error(message);
    }
  }, [domain]);

  const deleteBatch = useCallback(async (id: string) => {
    try {
      await batchService.delete(id);
      setBatches(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete batch';
      setError(message);
      throw new Error(message);
    }
  }, [domain]);

  // Stage transitions
  const transitionStage = useCallback(async (batchId: string, newStage: string) => {
    try {
      const updated = await batchService.transitionStage(batchId, newStage);
      setBatches(prev => prev.map(b => b.id === batchId ? updated : b));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to transition stage';
      setError(message);
      throw new Error(message);
    }
  }, [domain]);

  // Quarantine operations
  const quarantineBatch = useCallback(async (batchId: string, reason: string) => {
    try {
      const updated = await batchService.quarantine(batchId, reason, 'current-user');
      setBatches(prev => prev.map(b => b.id === batchId ? updated : b));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to quarantine batch';
      setError(message);
      throw new Error(message);
    }
  }, [domain]);

  const releaseFromQuarantine = useCallback(async (batchId: string) => {
    try {
      const updated = await batchService.releaseFromQuarantine(batchId, 'current-user');
      setBatches(prev => prev.map(b => b.id === batchId ? updated : b));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to release from quarantine';
      setError(message);
      throw new Error(message);
    }
  }, [domain]);

  // Filtering
  const applyFilters = useCallback((newFilters: BatchFilters) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await loadBatches();
  }, [loadBatches]);

  return {
    batches: filteredBatches,
    loading,
    error,
    createBatch,
    updateBatch,
    deleteBatch,
    transitionStage,
    quarantineBatch,
    releaseFromQuarantine,
    applyFilters,
    clearFilters,
    refresh,
  };
}
