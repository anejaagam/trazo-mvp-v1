import { Ruler, Package, Layers } from 'lucide-react';
import { FarmDimensions } from './FarmLayoutEditor';

interface StatusBarProps {
  units: string;
  totalComponents: number;
  currentFloor: string;
  totalFloors: number;
  dimensions: FarmDimensions;
}

export function StatusBar({ units, totalComponents, currentFloor, totalFloors, dimensions }: StatusBarProps) {
  return (
    <footer className="h-10 bg-white border-t border-neutral-200 flex items-center px-4 gap-6 text-sm text-neutral-600">
      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4" />
        <span>Scale: 1 ft = 4px | Units: {units}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        <span>Components: {totalComponents}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4" />
        <span>{currentFloor} ({totalFloors} total)</span>
      </div>
      
      <div className="text-xs text-neutral-500">
        Site: {dimensions.length}' × {dimensions.width}' ({(dimensions.length * dimensions.width).toLocaleString()} sq ft)
      </div>
      
      <div className="ml-auto text-xs text-neutral-400">
        Farm Layout Editor v2.0
      </div>
    </footer>
  );
}
