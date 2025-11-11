import { Building2, Warehouse, Factory } from 'lucide-react';
import { Button } from './ui/button';
import { Preset } from './FarmLayoutEditor';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface PresetSelectorProps {
  onLoadPreset: (preset: Preset) => void;
}

const presets: Preset[] = [
  {
    id: 'small-facility',
    name: 'Small Facility',
    description: '100×80 ft with 2 floors, 4 pods (2×40ft, 2×20ft)',
    dimensions: { length: 100, width: 80 },
    floors: [
      {
        id: 1,
        name: 'Ground Floor',
        components: [
          {
            id: 'pod-1',
            type: 'pod-40ft',
            x: 10,
            y: 10,
            width: 40,
            height: 8,
            name: '40ft Pod 1',
            capacity: 100,
            notes: '',
            sensors: [],
            floor: 1,
          },
          {
            id: 'pod-2',
            type: 'pod-40ft',
            x: 10,
            y: 25,
            width: 40,
            height: 8,
            name: '40ft Pod 2',
            capacity: 100,
            notes: '',
            sensors: [],
            floor: 1,
          },
          {
            id: 'washroom-1',
            type: 'washroom',
            x: 60,
            y: 10,
            width: 8,
            height: 6,
            name: 'Washroom',
            capacity: 4,
            notes: '',
            sensors: [],
            floor: 1,
          },
          {
            id: 'breakroom-1',
            type: 'breakroom',
            x: 60,
            y: 20,
            width: 12,
            height: 10,
            name: 'Break Room',
            capacity: 20,
            notes: '',
            sensors: [],
            floor: 1,
          },
        ],
      },
      {
        id: 2,
        name: 'Upper Floor',
        components: [
          {
            id: 'pod-3',
            type: 'pod-20ft',
            x: 10,
            y: 10,
            width: 20,
            height: 8,
            name: '20ft Pod 1',
            capacity: 50,
            notes: '',
            sensors: [],
            floor: 2,
          },
          {
            id: 'pod-4',
            type: 'pod-20ft',
            x: 10,
            y: 25,
            width: 20,
            height: 8,
            name: '20ft Pod 2',
            capacity: 50,
            notes: '',
            sensors: [],
            floor: 2,
          },
          {
            id: 'storage-1',
            type: 'storage',
            x: 40,
            y: 10,
            width: 10,
            height: 10,
            name: 'Storage',
            notes: '',
            sensors: [],
            floor: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'medium-facility',
    name: 'Medium Facility',
    description: '200×120 ft with 3 floors, mixed pod sizes',
    dimensions: { length: 200, width: 120 },
    floors: [
      {
        id: 1,
        name: 'Ground Floor',
        components: [
          { id: 'breakroom-1', type: 'breakroom', x: 10, y: 10, width: 12, height: 10, name: 'Break Room', capacity: 20, notes: '', sensors: [], floor: 1 },
          { id: 'washroom-1', type: 'washroom', x: 30, y: 10, width: 8, height: 6, name: 'Washroom 1', capacity: 4, notes: '', sensors: [], floor: 1 },
          { id: 'washroom-2', type: 'washroom', x: 45, y: 10, width: 8, height: 6, name: 'Washroom 2', capacity: 4, notes: '', sensors: [], floor: 1 },
          { id: 'storage-1', type: 'storage', x: 60, y: 10, width: 15, height: 15, name: 'Main Storage', notes: '', sensors: [], floor: 1 },
        ],
      },
      {
        id: 2,
        name: 'Production Floor 1',
        components: [
          { id: 'pod-1', type: 'pod-40ft', x: 10, y: 10, width: 40, height: 8, name: '40ft Pod 1', capacity: 150, notes: '', sensors: [], floor: 2 },
          { id: 'pod-2', type: 'pod-40ft', x: 10, y: 25, width: 40, height: 8, name: '40ft Pod 2', capacity: 150, notes: '', sensors: [], floor: 2 },
          { id: 'pod-3', type: 'pod-40ft', x: 10, y: 40, width: 40, height: 8, name: '40ft Pod 3', capacity: 150, notes: '', sensors: [], floor: 2 },
          { id: 'pod-4', type: 'pod-20ft', x: 60, y: 10, width: 20, height: 8, name: '20ft Pod 1', capacity: 75, notes: '', sensors: [], floor: 2 },
          { id: 'pod-5', type: 'pod-20ft', x: 60, y: 25, width: 20, height: 8, name: '20ft Pod 2', capacity: 75, notes: '', sensors: [], floor: 2 },
        ],
      },
      {
        id: 3,
        name: 'Production Floor 2',
        components: [
          { id: 'pod-6', type: 'pod-40ft', x: 10, y: 10, width: 40, height: 8, name: '40ft Pod 4', capacity: 150, notes: '', sensors: [], floor: 3 },
          { id: 'pod-7', type: 'pod-40ft', x: 10, y: 25, width: 40, height: 8, name: '40ft Pod 5', capacity: 150, notes: '', sensors: [], floor: 3 },
          { id: 'pod-8', type: 'pod-20ft', x: 60, y: 10, width: 20, height: 8, name: '20ft Pod 3', capacity: 75, notes: '', sensors: [], floor: 3 },
          { id: 'pod-9', type: 'pod-20ft', x: 60, y: 25, width: 20, height: 8, name: '20ft Pod 4', capacity: 75, notes: '', sensors: [], floor: 3 },
        ],
      },
    ],
  },
  {
    id: 'large-facility',
    name: 'Large Facility',
    description: '300×200 ft with 4 floors, 24+ container pods',
    dimensions: { length: 300, width: 200 },
    floors: [
      {
        id: 1,
        name: 'Ground Floor - Support',
        components: [
          { id: 'storage-1', type: 'storage', x: 10, y: 10, width: 20, height: 20, name: 'Main Storage', notes: '', sensors: [], floor: 1 },
          { id: 'breakroom-1', type: 'breakroom', x: 40, y: 10, width: 15, height: 12, name: 'Break Room 1', capacity: 30, notes: '', sensors: [], floor: 1 },
          { id: 'breakroom-2', type: 'breakroom', x: 40, y: 30, width: 15, height: 12, name: 'Break Room 2', capacity: 30, notes: '', sensors: [], floor: 1 },
          { id: 'washroom-1', type: 'washroom', x: 65, y: 10, width: 10, height: 8, name: 'Washroom 1', capacity: 6, notes: '', sensors: [], floor: 1 },
          { id: 'washroom-2', type: 'washroom', x: 65, y: 25, width: 10, height: 8, name: 'Washroom 2', capacity: 6, notes: '', sensors: [], floor: 1 },
        ],
      },
      {
        id: 2,
        name: 'Production Floor 1',
        components: [
          { id: 'pod-1', type: 'pod-40ft', x: 10, y: 10, width: 40, height: 8, name: '40ft Pod 1', capacity: 200, notes: '', sensors: [], floor: 2 },
          { id: 'pod-2', type: 'pod-40ft', x: 10, y: 25, width: 40, height: 8, name: '40ft Pod 2', capacity: 200, notes: '', sensors: [], floor: 2 },
          { id: 'pod-3', type: 'pod-40ft', x: 10, y: 40, width: 40, height: 8, name: '40ft Pod 3', capacity: 200, notes: '', sensors: [], floor: 2 },
          { id: 'pod-4', type: 'pod-40ft', x: 60, y: 10, width: 40, height: 8, name: '40ft Pod 4', capacity: 200, notes: '', sensors: [], floor: 2 },
          { id: 'pod-5', type: 'pod-40ft', x: 60, y: 25, width: 40, height: 8, name: '40ft Pod 5', capacity: 200, notes: '', sensors: [], floor: 2 },
          { id: 'pod-6', type: 'pod-40ft', x: 60, y: 40, width: 40, height: 8, name: '40ft Pod 6', capacity: 200, notes: '', sensors: [], floor: 2 },
        ],
      },
      {
        id: 3,
        name: 'Production Floor 2',
        components: [
          { id: 'pod-7', type: 'pod-40ft', x: 10, y: 10, width: 40, height: 8, name: '40ft Pod 7', capacity: 200, notes: '', sensors: [], floor: 3 },
          { id: 'pod-8', type: 'pod-40ft', x: 10, y: 25, width: 40, height: 8, name: '40ft Pod 8', capacity: 200, notes: '', sensors: [], floor: 3 },
          { id: 'pod-9', type: 'pod-40ft', x: 10, y: 40, width: 40, height: 8, name: '40ft Pod 9', capacity: 200, notes: '', sensors: [], floor: 3 },
          { id: 'pod-10', type: 'pod-20ft', x: 60, y: 10, width: 20, height: 8, name: '20ft Pod 1', capacity: 100, notes: '', sensors: [], floor: 3 },
          { id: 'pod-11', type: 'pod-20ft', x: 60, y: 25, width: 20, height: 8, name: '20ft Pod 2', capacity: 100, notes: '', sensors: [], floor: 3 },
          { id: 'pod-12', type: 'pod-20ft', x: 90, y: 10, width: 20, height: 8, name: '20ft Pod 3', capacity: 100, notes: '', sensors: [], floor: 3 },
          { id: 'pod-13', type: 'pod-20ft', x: 90, y: 25, width: 20, height: 8, name: '20ft Pod 4', capacity: 100, notes: '', sensors: [], floor: 3 },
        ],
      },
      {
        id: 4,
        name: 'Production Floor 3',
        components: [
          { id: 'pod-14', type: 'pod-40ft', x: 10, y: 10, width: 40, height: 8, name: '40ft Pod 10', capacity: 200, notes: '', sensors: [], floor: 4 },
          { id: 'pod-15', type: 'pod-40ft', x: 10, y: 25, width: 40, height: 8, name: '40ft Pod 11', capacity: 200, notes: '', sensors: [], floor: 4 },
          { id: 'pod-16', type: 'pod-40ft', x: 10, y: 40, width: 40, height: 8, name: '40ft Pod 12', capacity: 200, notes: '', sensors: [], floor: 4 },
          { id: 'pod-17', type: 'pod-10ft', x: 60, y: 10, width: 10, height: 8, name: '10ft Pod 1', capacity: 50, notes: '', sensors: [], floor: 4 },
          { id: 'pod-18', type: 'pod-10ft', x: 75, y: 10, width: 10, height: 8, name: '10ft Pod 2', capacity: 50, notes: '', sensors: [], floor: 4 },
          { id: 'pod-19', type: 'pod-10ft', x: 60, y: 25, width: 10, height: 8, name: '10ft Pod 3', capacity: 50, notes: '', sensors: [], floor: 4 },
          { id: 'pod-20', type: 'pod-10ft', x: 75, y: 25, width: 10, height: 8, name: '10ft Pod 4', capacity: 50, notes: '', sensors: [], floor: 4 },
        ],
      },
    ],
  },
];

export function PresetSelector({ onLoadPreset }: PresetSelectorProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-700">Quick Presets:</span>
        
        <div className="flex gap-2">
          {presets.map((preset, index) => {
            const Icon = index === 0 ? Building2 : index === 1 ? Warehouse : Factory;
            return (
              <Tooltip key={preset.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadPreset(preset)}
                    className="h-8"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {preset.name}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{preset.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
