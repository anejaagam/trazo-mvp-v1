/**
 * Stage Progress Bar Component
 * 
 * Visual progress indicator for batch workflow stages
 */

import { useStageProgression } from '../hooks/useStageProgression';
import { Check } from 'lucide-react';
import type { DomainBatch } from '../types/domains';

interface StageProgressBarProps {
  batch: DomainBatch;
  showLabels?: boolean;
  compact?: boolean;
}

export function StageProgressBar({ batch, showLabels = true, compact = false }: StageProgressBarProps) {
  const {
    allStages,
    currentStage,
    stageIndex,
    progressPercentage,
  } = useStageProgression(batch);

  const getStageColor = (_stage: string, index: number) => {
    if (index < stageIndex) {
      return 'bg-green-500 border-green-600';
    } else if (index === stageIndex) {
      return 'bg-blue-500 border-blue-600';
    } else {
      return 'bg-gray-200 border-gray-300';
    }
  };

  const getStageTextColor = (_stage: string, index: number) => {
    if (index <= stageIndex) {
      return 'text-gray-900 font-medium';
    } else {
      return 'text-gray-400';
    }
  };

  const formatStageName = (stage: string) => {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {currentStage ? formatStageName(currentStage.stage) : 'Unknown'}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Workflow Progress
          </h3>
          <span className="text-sm text-gray-500">
            Stage {stageIndex + 1} of {allStages.length}
          </span>
        </div>
      )}

      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Stage nodes */}
        <div className="relative flex justify-between">
          {allStages.map((stageObj, index) => (
            <div
              key={stageObj.stage}
              className="flex flex-col items-center"
              style={{ width: `${100 / allStages.length}%` }}
            >
              {/* Node circle */}
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStageColor(
                  stageObj.stage,
                  index
                )} transition-all duration-300 z-10 bg-white`}
              >
                {index < stageIndex ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-xs font-bold text-gray-600">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Stage label */}
              {showLabels && (
                <div className="mt-2 text-center">
                  <div
                    className={`text-xs ${getStageTextColor(
                      stageObj.stage,
                      index
                    )} whitespace-nowrap`}
                  >
                    {formatStageName(stageObj.stage)}
                  </div>
                  {index === stageIndex && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      Current
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Domain-specific info */}
      {batch.domainType === 'cannabis' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">METRC Compliance:</span> All stage
            transitions will be logged to state tracking system
          </p>
        </div>
      )}

      {batch.domainType === 'produce' && batch.gapCertified && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-medium">GAP Certified:</span> Food safety
            protocols active for all stages
          </p>
        </div>
      )}
    </div>
  );
}
