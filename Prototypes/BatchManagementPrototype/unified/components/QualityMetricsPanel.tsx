/**
 * Quality Metrics Panel Component
 * 
 * Domain-aware quality metrics display and tracking
 */

import { useDomain } from '../contexts/DomainContext';
import { useQualityMetrics } from '../hooks/useQualityMetrics';
import { Plus, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface QualityMetricsPanelProps {
  batchId: string;
  onAddMetric?: () => void;
}

export function QualityMetricsPanel({ batchId, onAddMetric }: QualityMetricsPanelProps) {
  const { domain } = useDomain();
  const {
    metrics,
    cannabisTests,
    produceInspections,
    loading,
    error,
  } = useQualityMetrics(batchId);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center text-gray-500">Loading quality metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
        <div className="text-center text-red-600">Error loading quality metrics: {error}</div>
      </div>
    );
  }

  // Render cannabis-specific metrics
  const renderCannabisMetrics = () => {
    if (domain !== 'cannabis') return null;

    const latestTest = cannabisTests[cannabisTests.length - 1];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Lab Test Results</h3>
          {latestTest && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              latestTest.passed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {latestTest.passed ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Passed
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Failed
                </span>
              )}
            </span>
          )}
        </div>

        {cannabisTests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No test results yet
          </div>
        ) : (
          <div className="space-y-3">
            {cannabisTests.map((test) => (
              <div key={test.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 capitalize">
                    {test.testType.replace('_', ' ')} Test
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(test.resultDate).toLocaleDateString()}
                  </span>
                </div>

                {test.testType === 'potency' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {test.results.thc !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500">THC</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {test.results.thc}%
                        </div>
                      </div>
                    )}
                    {test.results.cbd !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500">CBD</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {test.results.cbd}%
                        </div>
                      </div>
                    )}
                    {test.results.cbg !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500">CBG</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {test.results.cbg}%
                        </div>
                      </div>
                    )}
                    {test.results.moisture !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500">Moisture</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {test.results.moisture}%
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  Lab: {test.labName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render produce-specific metrics
  const renderProduceMetrics = () => {
    if (domain !== 'produce') return null;

    const latestInspection = produceInspections[produceInspections.length - 1];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Quality Inspections</h3>
          {latestInspection && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              latestInspection.grade === 'grade_a' || latestInspection.grade === 'premium'
                ? 'bg-green-100 text-green-800'
                : latestInspection.grade === 'grade_b'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-orange-100 text-orange-800'
            }`}>
              {latestInspection.grade?.replace('_', ' ').toUpperCase() || 'Pending'}
            </span>
          )}
        </div>

        {produceInspections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No inspections yet
          </div>
        ) : (
          <div className="space-y-3">
            {produceInspections.map((inspection) => (
              <div key={inspection.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 capitalize">
                    {inspection.inspectionType.replace('_', ' ')} Inspection
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(inspection.inspectionDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {inspection.metrics.brix !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500">Brix</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {inspection.metrics.brix}°
                      </div>
                    </div>
                  )}
                  {inspection.metrics.firmness !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500">Firmness</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {inspection.metrics.firmness}
                      </div>
                    </div>
                  )}
                  {inspection.metrics.colorScore !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500">Color</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {inspection.metrics.colorScore}/10
                      </div>
                    </div>
                  )}
                  {inspection.metrics.defectRate !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500">Defect Rate</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {inspection.metrics.defectRate}%
                      </div>
                    </div>
                  )}
                </div>

                {inspection.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    {inspection.notes}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  Inspector: {inspection.inspectedBy}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render common metrics
  const renderCommonMetrics = () => {
    if (metrics.length === 0) return null;

    return (
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-900">Additional Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">
                {metric.metricType}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value}
              </div>
              {metric.unit && (
                <div className="text-xs text-gray-500 mt-1">
                  {metric.unit}
                </div>
              )}
              {metric.measuredAt && (
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(metric.measuredAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Quality Metrics</h2>
        </div>
        
        {onAddMetric && (
          <button
            onClick={onAddMetric}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Metric
          </button>
        )}
      </div>

      {renderCannabisMetrics()}
      {renderProduceMetrics()}
      {renderCommonMetrics()}

      {metrics.length === 0 && cannabisTests.length === 0 && produceInspections.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No quality metrics recorded yet. Add your first metric to track quality over time.
        </div>
      )}
    </div>
  );
}
