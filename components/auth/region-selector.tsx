'use client';

import { Region, REGION_INFO } from '@/lib/types/region';

interface RegionSelectorProps {
  value: Region;
  onChange: (region: Region) => void;
  disabled?: boolean;
  required?: boolean;
}

export function RegionSelector({ value, onChange, disabled, required }: RegionSelectorProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="region" className="block text-sm font-medium">
        Region {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id="region"
        value={value}
        onChange={(e) => onChange(e.target.value as Region)}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {Object.entries(REGION_INFO).map(([key, info]) => (
          <option key={key} value={key}>
            {info.flag} {info.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Your data will be stored in {REGION_INFO[value].name} ({REGION_INFO[value].supabaseRegion})
      </p>
    </div>
  );
}