/**
 * Harvest Window Predictions Component
 * 
 * Predict optimal harvest windows based on cultivar and environmental data
 */

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Sun, Droplets, ThermometerSun } from 'lucide-react';
import type { IProduceBatch, IProduceCultivar } from '../types/domains';

interface HarvestWindowProps {
  batch: IProduceBatch;
  cultivar?: IProduceCultivar;
}

interface HarvestPrediction {
  earlyDate: string;
  optimalDate: string;
  lateDate: string;
  confidence: 'high' | 'medium' | 'low';
  factors: PredictionFactor[];
}

interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export function HarvestWindowPredictions({ batch, cultivar }: HarvestWindowProps) {
  const [prediction, setPrediction] = useState<HarvestPrediction | null>(null);
  const [environmentalFactors] = useState({
    avgTemperature: 22, // °C
    avgHumidity: 65, // %
    lightHours: 12,
    wateringFrequency: 'daily' as 'daily' | 'every_2_days' | 'every_3_days',
  });

  // Calculate harvest window based on batch data
  useEffect(() => {
    if (!batch.createdAt) return;

    const plantingDate = new Date(batch.createdAt);

    // Get typical grow time from storage life or use defaults
    const typicalGrowDays = cultivar?.storageLife ? cultivar.storageLife * 2 : 60; // days
    const variance = 7; // days variance

    // Calculate base prediction
    const optimalDate = new Date(plantingDate);
    optimalDate.setDate(optimalDate.getDate() + typicalGrowDays);

    const earlyDate = new Date(optimalDate);
    earlyDate.setDate(earlyDate.getDate() - variance);

    const lateDate = new Date(optimalDate);
    lateDate.setDate(lateDate.getDate() + variance);

    // Analyze factors
    const factors: PredictionFactor[] = [];

    // Temperature factor
    if (environmentalFactors.avgTemperature >= 20 && environmentalFactors.avgTemperature <= 25) {
      factors.push({
        name: 'Optimal Temperature',
        impact: 'positive',
        description: `Temperature at ${environmentalFactors.avgTemperature}°C is ideal for growth`,
      });
    } else if (environmentalFactors.avgTemperature < 15 || environmentalFactors.avgTemperature > 30) {
      factors.push({
        name: 'Suboptimal Temperature',
        impact: 'negative',
        description: `Temperature at ${environmentalFactors.avgTemperature}°C may slow growth`,
      });
    }

    // Humidity factor
    if (environmentalFactors.avgHumidity >= 60 && environmentalFactors.avgHumidity <= 70) {
      factors.push({
        name: 'Good Humidity',
        impact: 'positive',
        description: `Humidity at ${environmentalFactors.avgHumidity}% is favorable`,
      });
    }

    // Light factor
    if (environmentalFactors.lightHours >= 12) {
      factors.push({
        name: 'Adequate Light',
        impact: 'positive',
        description: `${environmentalFactors.lightHours} hours of light supports healthy growth`,
      });
    }

    // Growth stage factor
    if (batch.ripeness === 'optimal' || batch.ripeness === 'ripe') {
      factors.push({
        name: 'Ripeness Indicators',
        impact: 'positive',
        description: 'Visual ripeness indicators confirm harvest window',
      });
    }

    // Confidence calculation
    const positiveFactors = factors.filter(f => f.impact === 'positive').length;
    const negativeFactors = factors.filter(f => f.impact === 'negative').length;
    
    let confidence: 'high' | 'medium' | 'low';
    if (positiveFactors >= 3 && negativeFactors === 0) {
      confidence = 'high';
    } else if (negativeFactors >= 2) {
      confidence = 'low';
    } else {
      confidence = 'medium';
    }

    setPrediction({
      earlyDate: earlyDate.toISOString(),
      optimalDate: optimalDate.toISOString(),
      lateDate: lateDate.toISOString(),
      confidence,
      factors,
    });
  }, [batch, cultivar, environmentalFactors]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (date: string) => {
    const target = new Date(date);
    const today = new Date();
    const days = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return '✓';
      case 'negative': return '✗';
      default: return '•';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!prediction) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">Calculating harvest window predictions...</p>
      </div>
    );
  }

  const daysToOptimal = getDaysUntil(prediction.optimalDate);
  const isHarvestReady = daysToOptimal <= 7 && daysToOptimal >= -7;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Harvest Window Predictions</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
          {prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)} Confidence
        </span>
      </div>

      {/* Harvest Window Timeline */}
      <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Early Window</div>
            <div className="text-lg font-semibold text-gray-900">{formatDate(prediction.earlyDate)}</div>
            <div className="text-xs text-gray-600 mt-1">{getDaysUntil(prediction.earlyDate)} days</div>
          </div>
          
          <div className="text-center border-x-2 border-green-300">
            <div className="text-xs text-green-600 mb-1 font-medium">Optimal Window</div>
            <div className="text-xl font-bold text-green-700">{formatDate(prediction.optimalDate)}</div>
            <div className="text-xs text-green-600 mt-1">
              {daysToOptimal > 0 ? `in ${daysToOptimal} days` : `${Math.abs(daysToOptimal)} days ago`}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Late Window</div>
            <div className="text-lg font-semibold text-gray-900">{formatDate(prediction.lateDate)}</div>
            <div className="text-xs text-gray-600 mt-1">{getDaysUntil(prediction.lateDate)} days</div>
          </div>
        </div>

        {isHarvestReady && (
          <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
            <div className="flex items-center gap-2 text-green-800">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Harvest window is now open!</span>
            </div>
          </div>
        )}
      </div>

      {/* Environmental Factors */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Environmental Conditions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ThermometerSun className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500">Temperature</span>
            </div>
            <div className="text-lg font-semibold">{environmentalFactors.avgTemperature}°C</div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Humidity</span>
            </div>
            <div className="text-lg font-semibold">{environmentalFactors.avgHumidity}%</div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-500">Light Hours</span>
            </div>
            <div className="text-lg font-semibold">{environmentalFactors.lightHours}h</div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-cyan-500" />
              <span className="text-xs text-gray-500">Watering</span>
            </div>
            <div className="text-sm font-semibold capitalize">{environmentalFactors.wateringFrequency.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* Prediction Factors */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Influencing Factors</h3>
        <div className="space-y-2">
          {prediction.factors.map((factor, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className={`text-lg font-bold ${getImpactColor(factor.impact)}`}>
                {getImpactIcon(factor.impact)}
              </span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{factor.name}</div>
                <div className="text-sm text-gray-600">{factor.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cultivar Info */}
      {cultivar && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Cultivar: {cultivar.name}</h4>
              <p className="text-sm text-blue-700 mt-1">
                Typical grow time: {cultivar.storageLife ? cultivar.storageLife * 2 : '60-70'} days from planting
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
