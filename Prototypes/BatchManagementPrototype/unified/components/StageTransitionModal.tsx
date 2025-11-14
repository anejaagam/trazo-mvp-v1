/**
 * Stage Transition Modal Component
 * 
 * Modal for transitioning batches between workflow stages with validation
 */

import { useState } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { useStageProgression } from '../hooks/useStageProgression';
import { X, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import type { DomainBatch } from '../types/domains';

interface StageTransitionModalProps {
  batch: DomainBatch;
  isOpen: boolean;
  onClose: () => void;
  onTransition: (targetStage: string, notes?: string) => Promise<void>;
}

export function StageTransitionModal({
  batch,
  isOpen,
  onClose,
  onTransition,
}: StageTransitionModalProps) {
  const { domain } = useDomain();
  const {
    currentStage,
    availableTransitions,
    canTransitionTo,
    validateTransition,
  } = useStageProgression(batch);

  const [selectedStage, setSelectedStage] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const formatStageName = (stage: string) => {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
    
    // Validate transition
    const validation = validateTransition(stage);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([]);
    }
  };

  const handleTransition = async () => {
    if (!selectedStage || validationErrors.length > 0) return;

    setIsTransitioning(true);
    try {
      await onTransition(selectedStage, notes || undefined);
      onClose();
      setSelectedStage('');
      setNotes('');
      setValidationErrors([]);
    } catch (error) {
      console.error('Transition failed:', error);
      setValidationErrors([
        error instanceof Error ? error.message : 'Transition failed',
      ]);
    } finally {
      setIsTransitioning(false);
    }
  };

  const getStageRequirements = (stage: string) => {
    // Domain-specific requirements
    if (domain === 'cannabis') {
      switch (stage) {
        case 'flowering':
          return ['Minimum 4 weeks in vegetative stage', 'Light schedule change to 12/12'];
        case 'harvest':
          return ['Trichome inspection completed', 'Harvest window confirmed'];
        case 'testing':
          return ['Drying complete', 'Sample prepared for lab'];
        case 'packaging':
          return ['Lab results received and passed', 'METRC tags available'];
        default:
          return [];
      }
    } else {
      switch (stage) {
        case 'harvest':
          return ['Maturity indicators confirmed', 'Harvest tools sanitized'];
        case 'washing':
          return ['Water quality test passed', 'Washing station prepared'];
        case 'grading':
          return ['Quality inspection completed', 'Grading criteria reviewed'];
        case 'packaging':
          return ['Grade assigned', 'Packaging materials ready'];
        default:
          return [];
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Transition Batch Stage
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {batch.id} - Current: {currentStage ? formatStageName(currentStage.stage) : 'Unknown'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Stage Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">
                  Current Stage: {currentStage ? formatStageName(currentStage.stage) : 'Unknown'}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Batch is currently in the {currentStage ? formatStageName(currentStage.stage).toLowerCase() : 'unknown'} stage
                </p>
              </div>
            </div>
          </div>

          {/* Available Transitions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Select Target Stage
            </h3>
            <div className="space-y-2">
              {availableTransitions.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                  No available transitions from current stage
                </div>
              ) : (
                availableTransitions.map((stageObj) => {
                  const canTransition = canTransitionTo(stageObj.stage);
                  const requirements = getStageRequirements(stageObj.stage);

                  return (
                    <button
                      key={stageObj.stage}
                      onClick={() => handleStageSelect(stageObj.stage)}
                      disabled={!canTransition}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedStage === stageObj.stage
                          ? 'border-blue-500 bg-blue-50'
                          : canTransition
                          ? 'border-gray-200 hover:border-gray-300 bg-white'
                          : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {formatStageName(stageObj.stage)}
                        </span>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      {requirements.length > 0 && (
                        <ul className="text-sm text-gray-600 space-y-1">
                          {requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 mb-2">
                    Cannot Proceed
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transition Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this stage transition..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Domain-specific warnings */}
          {selectedStage && domain === 'cannabis' && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">METRC Notice:</span> This stage
                transition will be automatically logged to your state tracking
                system.
              </p>
            </div>
          )}

          {selectedStage && domain === 'produce' && batch.domainType === 'produce' && batch.gapCertified && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-medium">GAP Compliance:</span> Ensure all
                food safety protocols are followed for this stage transition.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleTransition}
            disabled={!selectedStage || validationErrors.length > 0 || isTransitioning}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isTransitioning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Transitioning...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Transition to {selectedStage && formatStageName(selectedStage)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
