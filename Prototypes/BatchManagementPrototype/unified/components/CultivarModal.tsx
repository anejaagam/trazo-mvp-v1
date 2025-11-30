/**
 * Cultivar Management Modal
 * 
 * Create/Edit cultivar with domain-specific fields
 */

import { useState } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { X } from 'lucide-react';
import type { DomainCultivar } from '../types/domains';

interface CultivarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cultivar: Partial<DomainCultivar>) => Promise<void>;
  cultivar?: DomainCultivar;
  mode: 'create' | 'edit';
}

export function CultivarModal({ isOpen, onClose, onSave, cultivar, mode }: CultivarModalProps) {
  const { domain, config } = useDomain();
  const terminology = config.terminology;
  
  const [formData, setFormData] = useState<Partial<DomainCultivar>>(
    cultivar || {
      domainType: domain,
      name: '',
      description: '',
    } as Partial<DomainCultivar>
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = `${terminology.cultivar} name is required`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save cultivar:', error);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Render cannabis-specific fields
  const renderCannabisFields = () => {
    if (domain !== 'cannabis') return null;
    
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strain Type
          </label>
          <select
            value={(formData as any).strainType || ''}
            onChange={(e) => handleFieldChange('strainType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select type...</option>
            <option value="indica">Indica</option>
            <option value="sativa">Sativa</option>
            <option value="hybrid">Hybrid</option>
            <option value="cbd">CBD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genetics
          </label>
          <input
            type="text"
            value={(formData as any).genetics || ''}
            onChange={(e) => handleFieldChange('genetics', e.target.value)}
            placeholder="e.g., Blue Dream x OG Kush"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              THC Range (%)
            </label>
            <input
              type="text"
              value={(formData as any).thcRange || ''}
              onChange={(e) => handleFieldChange('thcRange', e.target.value)}
              placeholder="18-22%"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CBD Range (%)
            </label>
            <input
              type="text"
              value={(formData as any).cbdRange || ''}
              onChange={(e) => handleFieldChange('cbdRange', e.target.value)}
              placeholder="0.5-1%"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dominant Terpenes
          </label>
          <input
            type="text"
            value={(formData as any).dominantTerpenes?.join(', ') || ''}
            onChange={(e) => handleFieldChange('dominantTerpenes', e.target.value.split(',').map(t => t.trim()))}
            placeholder="Myrcene, Limonene, Caryophyllene"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple terpenes with commas</p>
        </div>
      </>
    );
  };

  // Render produce-specific fields
  const renderProduceFields = () => {
    if (domain !== 'produce') return null;
    
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={(formData as any).category || ''}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category...</option>
            <option value="leafy_greens">Leafy Greens</option>
            <option value="fruiting_vegetables">Fruiting Vegetables</option>
            <option value="root_vegetables">Root Vegetables</option>
            <option value="herbs">Herbs</option>
            <option value="berries">Berries</option>
            <option value="stone_fruit">Stone Fruit</option>
            <option value="citrus">Citrus</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Flavor Profile
          </label>
          <input
            type="text"
            value={(formData as any).flavorProfile || ''}
            onChange={(e) => handleFieldChange('flavorProfile', e.target.value)}
            placeholder="Sweet, earthy, mild"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typical Yield (lbs/plant)
            </label>
            <input
              type="number"
              value={(formData as any).typicalYield || ''}
              onChange={(e) => handleFieldChange('typicalYield', Number(e.target.value))}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Life (days)
            </label>
            <input
              type="number"
              value={(formData as any).storageLife || ''}
              onChange={(e) => handleFieldChange('storageLife', Number(e.target.value))}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Growing Notes
          </label>
          <textarea
            value={(formData as any).growingNotes || ''}
            onChange={(e) => handleFieldChange('growingNotes', e.target.value)}
            placeholder="Temperature requirements, spacing, special care..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-30"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? `Create New ${terminology.cultivar}` : `Edit ${terminology.cultivar}`}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {terminology.cultivar} Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder={`e.g., ${domain === 'cannabis' ? 'Blue Dream' : 'Cherokee Purple'}`}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder={`Describe this ${terminology.cultivar}...`}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Domain-specific fields */}
            {renderCannabisFields()}
            {renderProduceFields()}
            
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </form>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : mode === 'create' ? `Create ${terminology.cultivar}` : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
