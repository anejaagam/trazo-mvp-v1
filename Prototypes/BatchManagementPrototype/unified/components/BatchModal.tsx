/**
 * Batch Modal Component
 * 
 * Create/Edit batch modal with domain-specific fields
 */

import { useState } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { MockDataProvider } from '../data/MockDataProvider';
import { DomainFieldRenderer } from './DomainFieldRenderer';
import { X } from 'lucide-react';
import type { DomainBatch } from '../types/domains';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (batch: Partial<DomainBatch>) => Promise<void>;
  batch?: DomainBatch;
  mode: 'create' | 'edit';
}

export function BatchModal({ isOpen, onClose, onSave, batch, mode }: BatchModalProps) {
  const { domain, config } = useDomain();
  const terminology = config.terminology;
  
  const [formData, setFormData] = useState<Partial<DomainBatch>>(
    batch || {
      domainType: domain,
      name: '',
      cultivarId: '',
      cultivarName: '',
      stage: domain === 'cannabis' ? 'propagation' : 'seeding',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      locationIds: [],
      plantCount: 0,
      quarantineStatus: 'none',
    } as Partial<DomainBatch>
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    const updates: any = { [field]: value };
    
    // If cultivarId changes, also update cultivarName
    if (field === 'cultivarId') {
      const mockData = new MockDataProvider(domain);
      const cultivar = mockData.getCultivarById(value);
      if (cultivar) {
        updates.cultivarName = cultivar.name;
      }
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Clear error when field is modified
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
      newErrors.name = 'Batch name is required';
    }
    
    if (!formData.cultivarId) {
      newErrors.cultivarId = `${terminology.cultivar} is required`;
    }
    
    if (!formData.plantCount || formData.plantCount < 1) {
      newErrors.plantCount = 'Count must be at least 1';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
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
      console.error('Failed to save batch:', error);
      setErrors({ submit: 'Failed to save batch. Please try again.' });
    } finally {
      setSaving(false);
    }
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
              {mode === 'create' ? 'Create New Batch' : 'Edit Batch'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <DomainFieldRenderer
              entity="batch"
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
            />
            
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
              {saving ? 'Saving...' : mode === 'create' ? 'Create Batch' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
