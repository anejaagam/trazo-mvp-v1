/**
 * Quality Service Interface
 * 
 * Service layer for quality metrics and testing
 */

import type { DomainType, IQualityMetric } from '../types/domains';

/**
 * Cannabis Quality Test
 */
export interface ICannabisQualityTest {
  id: string;
  batchId: string;
  testType: 'potency' | 'microbial' | 'pesticide' | 'heavy_metals' | 'moisture' | 'terpene';
  labName: string;
  labLicense?: string;
  sampleDate: string;
  resultDate: string;
  passed: boolean;
  results: {
    thc?: number;
    cbd?: number;
    cbg?: number;
    cbn?: number;
    terpenes?: Record<string, number>;
    moisture?: number;
    [key: string]: any;
  };
  certificateUrl?: string;
  metrcTestResultId?: string;
}

/**
 * Produce Quality Inspection
 */
export interface IProduceQualityInspection {
  id: string;
  batchId: string;
  inspectionType: 'pre_harvest' | 'harvest' | 'post_harvest' | 'packaging';
  inspectionDate: string;
  inspectedBy: string;
  metrics: {
    brix?: number;
    firmness?: number;
    colorScore?: number;
    sizeAverage?: number;
    defectRate?: number;
  };
  grade?: 'grade_a' | 'grade_b' | 'grade_c' | 'premium' | 'reject';
  passed: boolean;
  notes?: string;
  evidenceUrls?: string[];
}

/**
 * Quality Service Interface
 */
export interface IQualityService {
  /**
   * Record a quality metric
   */
  recordMetric(metric: Omit<IQualityMetric, 'id'>): Promise<IQualityMetric>;

  /**
   * Get quality metrics for a batch
   */
  getMetricsByBatch(batchId: string): Promise<IQualityMetric[]>;

  /**
   * Get quality metrics by type
   */
  getMetricsByType(batchId: string, metricType: string): Promise<IQualityMetric[]>;

  /**
   * Record cannabis test result
   */
  recordCannabisTest(test: Omit<ICannabisQualityTest, 'id'>): Promise<ICannabisQualityTest>;

  /**
   * Get cannabis test results
   */
  getCannabisTests(batchId: string): Promise<ICannabisQualityTest[]>;

  /**
   * Record produce quality inspection
   */
  recordProduceInspection(inspection: Omit<IProduceQualityInspection, 'id'>): Promise<IProduceQualityInspection>;

  /**
   * Get produce quality inspections
   */
  getProduceInspections(batchId: string): Promise<IProduceQualityInspection[]>;

  /**
   * Get quality summary for a batch
   */
  getQualitySummary(domain: DomainType, batchId: string): Promise<{
    overallGrade: string;
    metrics: IQualityMetric[];
    lastTested: string;
    passed: boolean;
  }>;
}

/**
 * localStorage Quality Service Implementation
 */
export class LocalStorageQualityService implements IQualityService {
  private readonly METRICS_KEY = 'trazo_quality_metrics';
  private readonly CANNABIS_TESTS_KEY = 'trazo_cannabis_tests';
  private readonly PRODUCE_INSPECTIONS_KEY = 'trazo_produce_inspections';

  async recordMetric(metric: Omit<IQualityMetric, 'id'>): Promise<IQualityMetric> {
    const newMetric: IQualityMetric = {
      ...metric,
      id: `metric-${Date.now()}`,
    };

    const metrics = this.loadMetrics();
    metrics.push(newMetric);
    localStorage.setItem(this.METRICS_KEY, JSON.stringify(metrics));

    return newMetric;
  }

  async getMetricsByBatch(batchId: string): Promise<IQualityMetric[]> {
    const metrics = this.loadMetrics();
    return metrics.filter(m => m.batchId === batchId);
  }

  async getMetricsByType(batchId: string, metricType: string): Promise<IQualityMetric[]> {
    const metrics = await this.getMetricsByBatch(batchId);
    return metrics.filter(m => m.metricType === metricType);
  }

  async recordCannabisTest(test: Omit<ICannabisQualityTest, 'id'>): Promise<ICannabisQualityTest> {
    const newTest: ICannabisQualityTest = {
      ...test,
      id: `test-${Date.now()}`,
    };

    const tests = this.loadCannabisTests();
    tests.push(newTest);
    localStorage.setItem(this.CANNABIS_TESTS_KEY, JSON.stringify(tests));

    return newTest;
  }

  async getCannabisTests(batchId: string): Promise<ICannabisQualityTest[]> {
    const tests = this.loadCannabisTests();
    return tests.filter(t => t.batchId === batchId);
  }

  async recordProduceInspection(inspection: Omit<IProduceQualityInspection, 'id'>): Promise<IProduceQualityInspection> {
    const newInspection: IProduceQualityInspection = {
      ...inspection,
      id: `inspection-${Date.now()}`,
    };

    const inspections = this.loadProduceInspections();
    inspections.push(newInspection);
    localStorage.setItem(this.PRODUCE_INSPECTIONS_KEY, JSON.stringify(inspections));

    return newInspection;
  }

  async getProduceInspections(batchId: string): Promise<IProduceQualityInspection[]> {
    const inspections = this.loadProduceInspections();
    return inspections.filter(i => i.batchId === batchId);
  }

  async getQualitySummary(domain: DomainType, batchId: string): Promise<{
    overallGrade: string;
    metrics: IQualityMetric[];
    lastTested: string;
    passed: boolean;
  }> {
    const metrics = await this.getMetricsByBatch(batchId);

    if (domain === 'cannabis') {
      const tests = await this.getCannabisTests(batchId);
      const lastTest = tests[tests.length - 1];
      
      return {
        overallGrade: lastTest?.passed ? 'Pass' : 'Pending',
        metrics,
        lastTested: lastTest?.resultDate || 'Never',
        passed: lastTest?.passed || false,
      };
    } else {
      const inspections = await this.getProduceInspections(batchId);
      const lastInspection = inspections[inspections.length - 1];
      
      return {
        overallGrade: lastInspection?.grade || 'Pending',
        metrics,
        lastTested: lastInspection?.inspectionDate || 'Never',
        passed: lastInspection?.passed || false,
      };
    }
  }

  private loadMetrics(): IQualityMetric[] {
    const data = localStorage.getItem(this.METRICS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private loadCannabisTests(): ICannabisQualityTest[] {
    const data = localStorage.getItem(this.CANNABIS_TESTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private loadProduceInspections(): IProduceQualityInspection[] {
    const data = localStorage.getItem(this.PRODUCE_INSPECTIONS_KEY);
    return data ? JSON.parse(data) : [];
  }
}

/**
 * Create quality service instance
 */
export function createQualityService(): IQualityService {
  return new LocalStorageQualityService();
}
