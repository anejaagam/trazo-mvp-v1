/**
 * Stage History Timeline Component
 * 
 * Timeline view of batch stage transitions and history
 */

import { useMemo } from 'react';
import { Clock, ArrowRight, User, FileText } from 'lucide-react';
import type { DomainBatch, ITimelineEvent } from '../types/domains';

interface StageHistoryTimelineProps {
  batch: DomainBatch;
  events?: ITimelineEvent[];
}

interface StageTransitionEvent {
  id: string;
  timestamp: string;
  fromStage?: string;
  toStage: string;
  userId?: string;
  userName?: string;
  notes?: string;
  duration?: number; // days in previous stage
}

export function StageHistoryTimeline({ batch, events = [] }: StageHistoryTimelineProps) {
  // Extract stage transitions from timeline events
  const stageTransitions = useMemo(() => {
    const transitions: StageTransitionEvent[] = [];
    
    // Add creation event
    transitions.push({
      id: 'created',
      timestamp: batch.createdAt,
      toStage: batch.stage,
      userName: 'System',
      notes: 'Batch created',
    });

    // Extract stage change events
    events
      .filter((event) => event.type === 'stage_change')
      .forEach((event) => {
        transitions.push({
          id: event.id,
          timestamp: event.timestamp,
          fromStage: event.data?.fromStage,
          toStage: event.data?.toStage,
          userId: event.userId,
          userName: event.data?.userName,
          notes: event.description,
        });
      });

    // Sort by timestamp (newest first)
    return transitions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [batch, events]);

  // Calculate duration in each stage
  const transitionsWithDuration = useMemo(() => {
    return stageTransitions.map((transition, index) => {
      if (index === stageTransitions.length - 1) {
        return transition; // Last event, no duration calculation
      }

      const nextTransition = stageTransitions[index + 1];
      if (!nextTransition) {
        return transition;
      }

      const duration = Math.floor(
        (new Date(transition.timestamp).getTime() -
          new Date(nextTransition.timestamp).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return { ...transition, duration };
    });
  }, [stageTransitions]);

  const formatStageName = (stage: string) => {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDuration = (days: number) => {
    if (days === 0) return 'Same day';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) return `${weeks} week${weeks > 1 ? 's' : ''}`;
    return `${weeks} week${weeks > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
  };

  const getStageColor = (stage: string) => {
    // Color coding for different stages
    const stageColors: Record<string, string> = {
      // Cannabis stages
      propagation: 'bg-green-100 text-green-800',
      vegetative: 'bg-blue-100 text-blue-800',
      flowering: 'bg-purple-100 text-purple-800',
      harvest: 'bg-yellow-100 text-yellow-800',
      drying: 'bg-orange-100 text-orange-800',
      curing: 'bg-amber-100 text-amber-800',
      testing: 'bg-pink-100 text-pink-800',
      packaging: 'bg-indigo-100 text-indigo-800',
      // Produce stages
      seeding: 'bg-green-100 text-green-800',
      germination: 'bg-emerald-100 text-emerald-800',
      seedling: 'bg-lime-100 text-lime-800',
      transplant: 'bg-teal-100 text-teal-800',
      growing: 'bg-blue-100 text-blue-800',
      pre_harvest: 'bg-cyan-100 text-cyan-800',
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

  if (transitionsWithDuration.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Stage History
        </h3>
        <div className="text-center py-8 text-gray-500">
          No stage history available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Stage History
      </h3>

      <div className="space-y-0">
        {transitionsWithDuration.map((transition, index) => (
          <div key={transition.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                {transition.fromStage ? (
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-600" />
                )}
              </div>
              {index < transitionsWithDuration.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 flex-1 my-2" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {transition.fromStage && (
                        <>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStageColor(
                              transition.fromStage
                            )}`}
                          >
                            {formatStageName(transition.fromStage)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </>
                      )}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStageColor(
                          transition.toStage
                        )}`}
                      >
                        {formatStageName(transition.toStage)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(transition.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  {transition.duration !== undefined && transition.duration > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Duration</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDuration(transition.duration)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {transition.notes && (
                  <div className="flex items-start gap-2 mt-3 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p>{transition.notes}</p>
                  </div>
                )}

                {/* User */}
                {transition.userName && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{transition.userName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Transitions</div>
            <div className="text-lg font-semibold text-gray-900">
              {transitionsWithDuration.length - 1}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Current Stage</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatStageName(batch.stage)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Batch Age</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatDuration(
                Math.floor(
                  (new Date().getTime() - new Date(batch.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
