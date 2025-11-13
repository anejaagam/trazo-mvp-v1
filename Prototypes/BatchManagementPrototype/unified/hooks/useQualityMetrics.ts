/**
 * useQualityMetrics Hook
 * 
 * Domain-aware quality metrics management
 */

import { useState, useEffect, useCallback } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { createQualityService } from '../services/QualityService';
import type { IQualityMetric } from '../types/domains/base';
import type { ICannabisQualityTest, IProduceQualityInspection } from '../services/QualityService';

const qualityService = createQualityService();

export interface UseQualityMetricsReturn {
  // Common metrics
  metrics: IQualityMetric[];
  loading: boolean;
  error: string | null;
  
  // Cannabis-specific
  cannabisTests: ICannabisQualityTest[];
  recordCannabisTest: (test: Omit<ICannabisQualityTest, 'id'>) => Promise<ICannabisQualityTest>;
  
  // Produce-specific
  produceInspections: IProduceQualityInspection[];
  recordProduceInspection: (inspection: Omit<IProduceQualityInspection, 'id'>) => Promise<IProduceQualityInspection>;
  
  // Common operations
  recordMetric: (metric: Omit<IQualityMetric, 'id'>) => Promise<IQualityMetric>;
  getMetricsByType: (metricType: string) => IQualityMetric[];
  getQualitySummary: () => Promise<{
    overallGrade: string;
    metrics: IQualityMetric[];
    lastTested: string;
    passed: boolean;
  }>;
  
  // Refresh data
  refresh: () => Promise<void>;
}

/**
 * Domain-aware quality metrics hook
 */
export function useQualityMetrics(batchId: string): UseQualityMetricsReturn {
  const { domain } = useDomain();
  const [metrics, setMetrics] = useState<IQualityMetric[]>([]);
  const [cannabisTests, setCannabisTests] = useState<ICannabisQualityTest[]>([]);
  const [produceInspections, setProduceInspections] = useState<IProduceQualityInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all quality data
  const loadQualityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load common metrics
      const metricsData = await qualityService.getMetricsByBatch(batchId);
      setMetrics(metricsData);

      // Load domain-specific data
      if (domain === 'cannabis') {
        const tests = await qualityService.getCannabisTests(batchId);
        setCannabisTests(tests);
        setProduceInspections([]);
      } else {
        const inspections = await qualityService.getProduceInspections(batchId);
        setProduceInspections(inspections);
        setCannabisTests([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quality data');
    } finally {
      setLoading(false);
    }
  }, [batchId, domain]);

  // Load data when batch or domain changes
  useEffect(() => {
    loadQualityData();
  }, [loadQualityData]);

  // Record metric
  const recordMetric = useCallback(async (metric: Omit<IQualityMetric, 'id'>) => {
    try {
      const newMetric = await qualityService.recordMetric({ ...metric, batchId });
      setMetrics(prev => [...prev, newMetric]);
      return newMetric;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record metric';
      setError(message);
      throw new Error(message);
    }
  }, [batchId]);

  // Cannabis test recording
  const recordCannabisTest = useCallback(async (test: Omit<ICannabisQualityTest, 'id'>) => {
    try {
      const newTest = await qualityService.recordCannabisTest({ ...test, batchId });
      setCannabisTests(prev => [...prev, newTest]);
      return newTest;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record cannabis test';
      setError(message);
      throw new Error(message);
    }
  }, [batchId]);

  // Produce inspection recording
  const recordProduceInspection = useCallback(async (inspection: Omit<IProduceQualityInspection, 'id'>) => {
    try {
      const newInspection = await qualityService.recordProduceInspection({ ...inspection, batchId });
      setProduceInspections(prev => [...prev, newInspection]);
      return newInspection;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record produce inspection';
      setError(message);
      throw new Error(message);
    }
  }, [batchId]);

  // Filter metrics by type
  const getMetricsByType = useCallback((metricType: string) => {
    return metrics.filter(m => m.metricType === metricType);
  }, [metrics]);

  // Get quality summary
  const getQualitySummary = useCallback(async () => {
    return await qualityService.getQualitySummary(domain, batchId);
  }, [domain, batchId]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await loadQualityData();
  }, [loadQualityData]);

  return {
    metrics,
    loading,
    error,
    cannabisTests,
    recordCannabisTest,
    produceInspections,
    recordProduceInspection,
    recordMetric,
    getMetricsByType,
    getQualitySummary,
    refresh,
  };
}
