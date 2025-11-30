/**
 * Domain Field Renderer Component
 * 
 * Dynamically renders form fields based on domain configuration
 */

import { useDomain } from '../contexts/DomainContext';
import { getFieldVisibility } from '../config/domainConfig';
import { MockDataProvider } from '../data/MockDataProvider';
import type { DomainBatch, DomainLocation, DomainCultivar } from '../types/domains';
import { isCannabisBatch, isProduceBatch } from '../types/domains';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface DomainFieldRendererProps {
  entity: 'batch' | 'location' | 'cultivar';
  data: Partial<DomainBatch> | Partial<DomainLocation> | Partial<DomainCultivar>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

/**
 * Get cannabis-specific batch fields
 */
function getCannabisBatchFields(batch: Partial<DomainBatch>): FieldConfig[] {
  if (!isCannabisBatch(batch as any)) return [];
  
  return [
    {
      name: 'metrcPackageTag',
      label: 'METRC Package Tag',
      type: 'text',
      placeholder: '1A4060300000XXXXX',
    },
    {
      name: 'lightingSchedule',
      label: 'Lighting Schedule',
      type: 'select',
      options: [
        { value: '18/6', label: '18/6 (Veg)' },
        { value: '12/12', label: '12/12 (Flower)' },
        { value: '24/0', label: '24/0 (Seedling)' },
      ],
    },
    {
      name: 'motherPlantId',
      label: 'Mother Plant ID',
      type: 'text',
      placeholder: 'Optional',
    },
  ];
}

/**
 * Get produce-specific batch fields
 */
function getProduceBatchFields(batch: Partial<DomainBatch>): FieldConfig[] {
  if (!isProduceBatch(batch as any)) return [];
  
  return [
    {
      name: 'grade',
      label: 'Grade',
      type: 'select',
      options: [
        { value: 'grade_a', label: 'Grade A' },
        { value: 'grade_b', label: 'Grade B' },
        { value: 'grade_c', label: 'Grade C' },
        { value: 'premium', label: 'Premium' },
      ],
    },
    {
      name: 'ripeness',
      label: 'Ripeness',
      type: 'select',
      options: [
        { value: 'unripe', label: 'Unripe' },
        { value: 'ripe', label: 'Ripe' },
        { value: 'overripe', label: 'Overripe' },
      ],
    },
    {
      name: 'gapCertified',
      label: 'GAP Certified',
      type: 'checkbox',
    },
    {
      name: 'organicCertified',
      label: 'Organic Certified',
      type: 'checkbox',
    },
  ];
}

/**
 * Get base batch fields (common to all domains)
 */
function getBaseBatchFields(domain: 'cannabis' | 'produce', cultivarOptions: { value: string; label: string }[]): FieldConfig[] {
  const terminology = domain === 'cannabis' 
    ? { cultivar: 'Strain', cultivars: 'Strains' }
    : { cultivar: 'Variety', cultivars: 'Varieties' };
    
  return [
    {
      name: 'name',
      label: 'Batch Name',
      type: 'text',
      required: true,
      placeholder: 'Enter batch name',
    },
    {
      name: 'cultivarId',
      label: terminology.cultivar,
      type: 'select',
      required: true,
      options: cultivarOptions,
    },
    {
      name: 'plantCount',
      label: 'Plant/Unit Count',
      type: 'number',
      required: true,
      min: 1,
      placeholder: '0',
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: 'date',
      required: true,
    },
    {
      name: 'harvestDate',
      label: 'Expected Harvest Date',
      type: 'date',
    },
  ];
}

/**
 * Render input based on field configuration
 */
function renderInput(
  field: FieldConfig,
  value: any,
  onChange: (value: any) => void,
  error?: string
) {
  const baseClasses = `w-full px-3 py-2 border rounded-md ${
    error ? 'border-red-500' : 'border-gray-300'
  } focus:outline-none focus:ring-2 focus:ring-blue-500`;

  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClasses}
          required={field.required}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          className={baseClasses}
          required={field.required}
        />
      );

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
          required={field.required}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
          required={field.required}
        />
      );

    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClasses}
          rows={3}
          required={field.required}
        />
      );

    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      );

    default:
      return null;
  }
}

/**
 * Domain Field Renderer Component
 */
export function DomainFieldRenderer({
  entity,
  data,
  onChange,
  errors = {},
}: DomainFieldRendererProps) {
  const { domain } = useDomain();
  const visibility = getFieldVisibility(domain);

  // Get cultivar options from mock data
  const mockData = new MockDataProvider(domain);
  const cultivars = mockData.getActiveCultivars();
  const cultivarOptions = cultivars.map(c => ({
    value: c.id,
    label: c.name,
  }));

  // Get appropriate fields based on entity type
  let fields: FieldConfig[] = [];
  
  if (entity === 'batch') {
    fields = getBaseBatchFields(domain, cultivarOptions);
    
    if (domain === 'cannabis') {
      fields = [...fields, ...getCannabisBatchFields(data as Partial<DomainBatch>)];
    } else {
      fields = [...fields, ...getProduceBatchFields(data as Partial<DomainBatch>)];
    }
  }

  // Filter fields based on visibility configuration
  const visibleFields = fields.filter((field) => {
    // Check if field should be visible for current domain
    const fieldVisibility = visibility[field.name as keyof typeof visibility];
    return fieldVisibility !== false;
  });

  return (
    <div className="space-y-4">
      {visibleFields.map((field) => {
        const value = (data as any)[field.name];
        const error = errors[field.name];

        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderInput(
              field,
              value,
              (newValue) => onChange(field.name, newValue),
              error
            )}
            
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
