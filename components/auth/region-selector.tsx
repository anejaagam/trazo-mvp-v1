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
      <label htmlFor="region" className="block font-body text-body-sm font-medium text-foreground">
        Region {required && <span className="text-destructive">*</span>}
      </label>
      <select
        id="region"
        value={value}
        onChange={(e) => onChange(e.target.value as Region)}
        disabled={disabled}
        required={required}
        className="w-full h-10 px-3 py-2 font-body text-body-base border-2 border-border bg-background text-foreground rounded-lg shadow-sm transition-all duration-200 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {Object.entries(REGION_INFO).map(([key, info]) => (
          <option key={key} value={key}>
            {info.flag} {info.name}
          </option>
        ))}
      </select>
      <p className="font-body text-body-xs text-muted-foreground">
        Your data will be stored in {REGION_INFO[value].name} ({REGION_INFO[value].supabaseRegion})
      </p>
    </div>
  );
}