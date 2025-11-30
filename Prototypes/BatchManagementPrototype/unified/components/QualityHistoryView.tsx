/**
 * Quality History View Component
 * 
 * Timeline view of quality metrics and changes over time
 */

import { useDomain } from '../contexts/DomainContext';
import { useQualityMetrics } from '../hooks/useQualityMetrics';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import type { IQualityMetric } from '../types/domains/base';
import type { ICannabisQualityTest, IProduceQualityInspection } from '../services/QualityService';

interface QualityHistoryViewProps {
  batchId: string;
}

type TimelineItem = {
  id: string;
  date: string;
  type: 'metric' | 'cannabis_test' | 'produce_inspection';
  title: string;
  data: IQualityMetric | ICannabisQualityTest | IProduceQualityInspection;
};

export function QualityHistoryView({ batchId }: QualityHistoryViewProps) {
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
        <div className="text-center text-gray-500">Loading quality history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
        <div className="text-center text-red-600">Error loading quality history: {error}</div>
      </div>
    );
  }

  // Build timeline from all sources
  const buildTimeline = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add quality metrics
    metrics.forEach((metric) => {
      items.push({
        id: metric.id,
        date: metric.measuredAt,
        type: 'metric',
        title: metric.metricType,
        data: metric,
      });
    });

    // Add cannabis tests
    if (domain === 'cannabis') {
      cannabisTests.forEach((test) => {
        items.push({
          id: test.id,
          date: test.resultDate,
          type: 'cannabis_test',
          title: `${test.testType.replace('_', ' ')} Test`,
          data: test,
        });
      });
    }

    // Add produce inspections
    if (domain === 'produce') {
      produceInspections.forEach((inspection) => {
        items.push({
          id: inspection.id,
          date: inspection.inspectionDate,
          type: 'produce_inspection',
          title: `${inspection.inspectionType.replace('_', ' ')} Inspection`,
          data: inspection,
        });
      });
    }

    // Sort by date descending (newest first)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const timeline = buildTimeline();

  // Calculate trend for numeric metrics
  const calculateTrend = (metricType: string): 'up' | 'down' | 'stable' | null => {
    const relevantMetrics = metrics
      .filter((m) => m.metricType === metricType)
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());

    if (relevantMetrics.length < 2) return null;

    const latest = relevantMetrics[relevantMetrics.length - 1]?.value;
    const previous = relevantMetrics[relevantMetrics.length - 2]?.value;

    if (latest === undefined || previous === undefined) return null;

    const change = ((latest - previous) / previous) * 100;

    if (Math.abs(change) < 2) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable' | null) => {
    if (!trend) return null;

    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderTimelineItem = (item: TimelineItem) => {
    if (item.type === 'metric') {
      const metric = item.data as IQualityMetric;
      const trend = calculateTrend(metric.metricType);

      return (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              {renderTrendIcon(trend)}
            </div>
            <div className="w-0.5 h-full bg-gray-200 mt-2" />
          </div>

          <div className="flex-1 pb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{metric.metricType}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(metric.measuredAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </div>
                  {metric.unit && (
                    <div className="text-sm text-gray-500">{metric.unit}</div>
                  )}
                </div>
              </div>

              {metric.notes && (
                <p className="text-sm text-gray-600 mt-2">{metric.notes}</p>
              )}

              {metric.measuredBy && (
                <p className="text-xs text-gray-400 mt-2">
                  Measured by: {metric.measuredBy}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (item.type === 'cannabis_test') {
      const test = item.data as ICannabisQualityTest;

      return (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              test.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Clock className={`w-5 h-5 ${test.passed ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="w-0.5 h-full bg-gray-200 mt-2" />
          </div>

          <div className="flex-1 pb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {test.testType.replace('_', ' ')} Test
                  </h4>
                  <p className="text-sm text-gray-500">
                    {new Date(test.resultDate).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  test.passed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {test.passed ? 'Passed' : 'Failed'}
                </span>
              </div>

              {test.testType === 'potency' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
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

              <div className="text-xs text-gray-400 mt-3">
                Lab: {test.labName}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === 'produce_inspection') {
      const inspection = item.data as IProduceQualityInspection;

      return (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="w-0.5 h-full bg-gray-200 mt-2" />
          </div>

          <div className="flex-1 pb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {inspection.inspectionType.replace('_', ' ')} Inspection
                  </h4>
                  <p className="text-sm text-gray-500">
                    {new Date(inspection.inspectionDate).toLocaleString()}
                  </p>
                </div>
                {inspection.grade && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    inspection.grade === 'grade_a' || inspection.grade === 'premium'
                      ? 'bg-green-100 text-green-800'
                      : inspection.grade === 'grade_b'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {inspection.grade.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
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
                <p className="text-sm text-gray-600 mt-3">{inspection.notes}</p>
              )}

              <div className="text-xs text-gray-400 mt-3">
                Inspector: {inspection.inspectedBy}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Quality History</h2>

      {timeline.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No quality history available yet.
        </div>
      ) : (
        <div className="space-y-0">
          {timeline.map((item, index) => (
            <div key={item.id} className={index === timeline.length - 1 ? 'last-item' : ''}>
              {renderTimelineItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
