/**
 * Grading System Component
 * 
 * Produce grading UI with quality assessment
 */

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import type { IProduceBatch } from '../types/domains';

interface GradingSystemProps {
  batch: IProduceBatch;
  onGradeAssigned: (grade: string, metrics: GradingMetrics) => void;
}

interface GradingMetrics {
  size: 'extra_large' | 'large' | 'medium' | 'small' | 'extra_small';
  colorScore: number; // 1-10
  firmness: number; // 1-10
  brixLevel?: number;
  defects: string[];
  overallScore: number; // 1-100
  notes?: string;
}

export function GradingSystem({ batch, onGradeAssigned }: GradingSystemProps) {
  const [metrics, setMetrics] = useState<GradingMetrics>({
    size: 'medium',
    colorScore: 7,
    firmness: 7,
    defects: [],
    overallScore: 70,
  });

  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [customDefect, setCustomDefect] = useState('');

  const gradeOptions = [
    { value: 'premium', label: 'Premium', color: 'bg-purple-100 text-purple-800 border-purple-300', minScore: 90 },
    { value: 'grade_a', label: 'Grade A', color: 'bg-green-100 text-green-800 border-green-300', minScore: 80 },
    { value: 'grade_b', label: 'Grade B', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', minScore: 65 },
    { value: 'grade_c', label: 'Grade C', color: 'bg-orange-100 text-orange-800 border-orange-300', minScore: 50 },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800 border-blue-300', minScore: 0 },
  ];

  const commonDefects = [
    'Bruising',
    'Scarring',
    'Insect damage',
    'Disease spots',
    'Irregular shape',
    'Discoloration',
    'Size inconsistency',
    'Overripe',
    'Underripe',
  ];

  // Calculate overall score based on metrics
  const calculateScore = (updatedMetrics: Partial<GradingMetrics>) => {
    const current = { ...metrics, ...updatedMetrics };
    
    let score = 0;
    
    // Color score (30% weight)
    score += (current.colorScore / 10) * 30;
    
    // Firmness (30% weight)
    score += (current.firmness / 10) * 30;
    
    // Size consistency (20% weight)
    const sizeScores = {
      extra_large: 10,
      large: 9,
      medium: 8,
      small: 6,
      extra_small: 4,
    };
    score += (sizeScores[current.size] / 10) * 20;
    
    // Defect penalty (20% weight)
    const defectPenalty = Math.min(current.defects.length * 5, 20);
    score += 20 - defectPenalty;
    
    return Math.round(score);
  };

  const handleMetricChange = (field: keyof GradingMetrics, value: any) => {
    const updatedMetrics = { ...metrics, [field]: value };
    const newScore = calculateScore(updatedMetrics);
    
    setMetrics({
      ...updatedMetrics,
      overallScore: newScore,
    });

    // Auto-suggest grade based on score
    const suggestedGrade = gradeOptions.find(g => newScore >= g.minScore);
    if (suggestedGrade && !selectedGrade) {
      setSelectedGrade(suggestedGrade.value);
    }
  };

  const toggleDefect = (defect: string) => {
    const newDefects = metrics.defects.includes(defect)
      ? metrics.defects.filter(d => d !== defect)
      : [...metrics.defects, defect];
    
    handleMetricChange('defects', newDefects);
  };

  const addCustomDefect = () => {
    if (customDefect.trim() && !metrics.defects.includes(customDefect.trim())) {
      handleMetricChange('defects', [...metrics.defects, customDefect.trim()]);
      setCustomDefect('');
    }
  };

  const handleAssignGrade = () => {
    if (selectedGrade) {
      onGradeAssigned(selectedGrade, metrics);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-purple-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Produce Grading</h2>
        <div className="text-right">
          <div className="text-sm text-gray-500">Overall Score</div>
          <div className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`}>
            {metrics.overallScore}
          </div>
        </div>
      </div>

      {/* Batch Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500">Batch ID</div>
            <div className="font-medium">{batch.id}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Cultivar</div>
            <div className="font-medium">{batch.cultivarId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Current Grade</div>
            <div className="font-medium">{batch.grade || 'Not graded'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Plant Count</div>
            <div className="font-medium">{batch.plantCount}</div>
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="space-y-6 mb-6">
        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size Category
          </label>
          <div className="grid grid-cols-5 gap-2">
            {(['extra_large', 'large', 'medium', 'small', 'extra_small'] as const).map((size) => (
              <button
                key={size}
                onClick={() => handleMetricChange('size', size)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  metrics.size === size
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {size.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Color Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Score: {metrics.colorScore}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={metrics.colorScore}
            onChange={(e) => handleMetricChange('colorScore', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Firmness */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Firmness: {metrics.firmness}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={metrics.firmness}
            onChange={(e) => handleMetricChange('firmness', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Soft</span>
            <span>Firm</span>
          </div>
        </div>

        {/* Brix Level (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brix Level (Optional)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="30"
            value={metrics.brixLevel || ''}
            onChange={(e) => handleMetricChange('brixLevel', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Enter Brix value"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Defects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Defects ({metrics.defects.length})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {commonDefects.map((defect) => (
              <button
                key={defect}
                onClick={() => toggleDefect(defect)}
                className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                  metrics.defects.includes(defect)
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {defect}
              </button>
            ))}
          </div>
          
          {/* Custom Defect */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customDefect}
              onChange={(e) => setCustomDefect(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomDefect()}
              placeholder="Add custom defect..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCustomDefect}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grading Notes
          </label>
          <textarea
            value={metrics.notes || ''}
            onChange={(e) => handleMetricChange('notes', e.target.value)}
            placeholder="Additional observations..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grade Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Assign Grade
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {gradeOptions.map((grade) => {
            const isRecommended = metrics.overallScore >= grade.minScore && 
                                  metrics.overallScore < (gradeOptions.find((_g, i, arr) => i > 0 && arr[i-1]?.value === grade.value)?.minScore || 100);
            
            return (
              <button
                key={grade.value}
                onClick={() => setSelectedGrade(grade.value)}
                className={`relative px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  selectedGrade === grade.value
                    ? `${grade.color} border-opacity-100`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {grade.label}
                {isRecommended && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    Suggested
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleAssignGrade}
          disabled={!selectedGrade}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Assign {selectedGrade && gradeOptions.find(g => g.value === selectedGrade)?.label}
        </button>
      </div>
    </div>
  );
}
