/**
 * Ripeness Tracking Component
 * 
 * Track and predict ripeness levels for produce batches
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import type { IProduceBatch } from '../types/domains';

interface RipenessTrackingProps {
  batch: IProduceBatch;
  onRipenessUpdate: (ripeness: string, predictedDate?: string) => void;
}

interface RipenessRecord {
  date: string;
  ripeness: string;
  notes?: string;
  measuredBy?: string;
}

export function RipenessTracking({ batch, onRipenessUpdate }: RipenessTrackingProps) {
  const [currentRipeness, setCurrentRipeness] = useState<string>(batch.ripeness || 'unripe');
  const [history, setHistory] = useState<RipenessRecord[]>([]);
  const [notes, setNotes] = useState('');
  const [predictedHarvestDate, setPredictedHarvestDate] = useState<string>('');

  const ripenessLevels = [
    { value: 'unripe', label: 'Unripe', color: 'bg-red-100 text-red-800', days: 7 },
    { value: 'early', label: 'Early', color: 'bg-orange-100 text-orange-800', days: 5 },
    { value: 'optimal', label: 'Optimal', color: 'bg-green-100 text-green-800', days: 2 },
    { value: 'late', label: 'Late Harvest', color: 'bg-yellow-100 text-yellow-800', days: 0 },
    { value: 'overripe', label: 'Overripe', color: 'bg-gray-100 text-gray-800', days: -1 },
  ];

  // Calculate predicted harvest date based on current ripeness
  useEffect(() => {
    const currentLevel = ripenessLevels.find(r => r.value === currentRipeness);
    if (currentLevel && currentLevel.days > 0) {
      const predicted = new Date();
      predicted.setDate(predicted.getDate() + currentLevel.days);
      const dateStr = predicted.toISOString().split('T')[0];
      setPredictedHarvestDate(dateStr || '');
    } else {
      setPredictedHarvestDate('');
    }
  }, [currentRipeness]);

  const handleRipenessChange = (newRipeness: string) => {
    setCurrentRipeness(newRipeness);
    
    // Add to history
    const record: RipenessRecord = {
      date: new Date().toISOString(),
      ripeness: newRipeness,
      notes: notes || undefined,
      measuredBy: 'Current User', // Would be actual user in production
    };
    
    setHistory([record, ...history]);
    setNotes('');
    
    onRipenessUpdate(newRipeness, predictedHarvestDate || undefined);
  };

  const getRipenessProgress = () => {
    const index = ripenessLevels.findIndex(r => r.value === currentRipeness);
    return ((index + 1) / ripenessLevels.length) * 100;
  };

  const isHarvestReady = currentRipeness === 'optimal' || currentRipeness === 'late';
  const isOverripe = currentRipeness === 'overripe';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Ripeness Tracking</h2>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Current Ripeness</div>
            <span className={`px-4 py-2 rounded-lg text-lg font-medium ${
              ripenessLevels.find(r => r.value === currentRipeness)?.color
            }`}>
              {ripenessLevels.find(r => r.value === currentRipeness)?.label}
            </span>
          </div>
          
          {predictedHarvestDate && !isHarvestReady && !isOverripe && (
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Predicted Harvest</div>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Calendar className="w-5 h-5" />
                {new Date(predictedHarvestDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                isOverripe ? 'bg-gray-400' : isHarvestReady ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${getRipenessProgress()}%` }}
            />
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center">
          Ripeness Progress: {Math.round(getRipenessProgress())}%
        </div>
      </div>

      {/* Harvest Alerts */}
      {isHarvestReady && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">Ready for Harvest</h4>
              <p className="text-sm text-green-700">
                Batch has reached optimal ripeness. Harvest within the next 2-3 days for best quality.
              </p>
            </div>
          </div>
        </div>
      )}

      {isOverripe && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Overripe Warning</h4>
              <p className="text-sm text-red-700">
                Batch is overripe. Quality may be compromised. Consider immediate harvest or processing use.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ripeness Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Update Ripeness Level
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ripenessLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setCurrentRipeness(level.value)}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                currentRipeness === level.value
                  ? `${level.color} border-opacity-100`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {level.label}
              {level.days > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  ~{level.days} days
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observation Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Color, firmness, aroma observations..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => handleRipenessChange(currentRipeness)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Record Ripeness Update
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">History</h3>
          <div className="space-y-3">
            {history.map((record, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    ripenessLevels.find(r => r.value === record.ripeness)?.color
                  }`}>
                    {ripenessLevels.find(r => r.value === record.ripeness)?.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(record.date).toLocaleString()}
                  </span>
                </div>
                {record.notes && (
                  <p className="text-sm text-gray-600">{record.notes}</p>
                )}
                {record.measuredBy && (
                  <p className="text-xs text-gray-400 mt-1">By: {record.measuredBy}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
