import { Ruler } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FarmDimensions } from './FarmLayoutEditor';

interface FarmSettingsProps {
  dimensions: FarmDimensions;
  onDimensionsChange: (dimensions: FarmDimensions) => void;
}

export function FarmSettings({ dimensions, onDimensionsChange }: FarmSettingsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-neutral-700">
        <Ruler className="h-4 w-4" />
        <span className="text-sm">Farm Dimensions:</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Label htmlFor="length" className="text-sm text-neutral-600">Length (ft)</Label>
        <Input
          id="length"
          type="number"
          value={dimensions.length}
          onChange={(e) => onDimensionsChange({ ...dimensions, length: parseInt(e.target.value) || 1 })}
          className="w-20 h-8"
          min={20}
          max={500}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Label htmlFor="width" className="text-sm text-neutral-600">Width (ft)</Label>
        <Input
          id="width"
          type="number"
          value={dimensions.width}
          onChange={(e) => onDimensionsChange({ ...dimensions, width: parseInt(e.target.value) || 1 })}
          className="w-20 h-8"
          min={20}
          max={500}
        />
      </div>
      
      <div className="text-sm text-neutral-500">
        Total: {(dimensions.length * dimensions.width).toLocaleString()} sq ft
      </div>
    </div>
  );
}
