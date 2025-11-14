/**
 * Batch Table Component
 * 
 * Domain-aware batch table with dynamic columns
 */

import { useDomain } from '../contexts/DomainContext';
import type { DomainBatch } from '../types/domains';
import { isCannabisBatch, isProduceBatch } from '../types/domains';

interface BatchTableProps {
  batches: DomainBatch[];
  onSelectBatch: (batch: DomainBatch) => void;
  onDeleteBatch?: (batchId: string) => void;
}

export function BatchTable({ batches, onSelectBatch }: BatchTableProps) {
  const { config } = useDomain();
  const terminology = config.terminology;

  // Get stage color for badge
  const getStageColor = (stage: string): string => {
    const stageColors: Record<string, string> = {
      // Cannabis stages
      propagation: 'bg-blue-100 text-blue-800',
      vegetative: 'bg-green-100 text-green-800',
      flowering: 'bg-purple-100 text-purple-800',
      harvest: 'bg-yellow-100 text-yellow-800',
      drying: 'bg-orange-100 text-orange-800',
      curing: 'bg-amber-100 text-amber-800',
      testing: 'bg-pink-100 text-pink-800',
      packaging: 'bg-indigo-100 text-indigo-800',
      
      // Produce stages
      seeding: 'bg-blue-100 text-blue-800',
      germination: 'bg-cyan-100 text-cyan-800',
      seedling: 'bg-green-100 text-green-800',
      transplant: 'bg-teal-100 text-teal-800',
      growing: 'bg-emerald-100 text-emerald-800',
      pre_harvest: 'bg-lime-100 text-lime-800',
      washing: 'bg-sky-100 text-sky-800',
      sorting: 'bg-violet-100 text-violet-800',
      grading: 'bg-fuchsia-100 text-fuchsia-800',
      ripening: 'bg-rose-100 text-rose-800',
      storage: 'bg-slate-100 text-slate-800',
      
      // Common
      closed: 'bg-gray-100 text-gray-800',
    };
    
    return stageColors[stage] || 'bg-gray-100 text-gray-800';
  };

  // Render domain-specific columns
  const renderDomainColumns = (batch: DomainBatch) => {
    if (isCannabisBatch(batch)) {
      return (
        <>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {batch.metrcPackageTag || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {batch.lightingSchedule || '-'}
          </td>
        </>
      );
    } else if (isProduceBatch(batch)) {
      return (
        <>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {batch.grade ? (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {batch.grade.replace('_', ' ').toUpperCase()}
              </span>
            ) : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {batch.ripeness || '-'}
          </td>
        </>
      );
    }
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Batch Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {terminology.cultivar}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stage
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Count
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Date
            </th>
            
            {/* Domain-specific columns */}
            {config.domain === 'cannabis' ? (
              <>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  METRC Tag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Light Schedule
                </th>
              </>
            ) : (
              <>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ripeness
                </th>
              </>
            )}
            
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {batches.map((batch) => (
            <tr 
              key={batch.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectBatch(batch)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {batch.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {batch.cultivarName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(batch.stage)}`}>
                  {batch.stage.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {batch.plantCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(batch.startDate).toLocaleDateString()}
              </td>
              
              {/* Domain-specific columns */}
              {renderDomainColumns(batch)}
              
              <td className="px-6 py-4 whitespace-nowrap">
                {batch.quarantineStatus === 'quarantined' ? (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Quarantined
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {batch.status}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBatch(batch);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
