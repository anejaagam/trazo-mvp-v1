import { PlacedComponent, SensorType } from './FarmLayoutEditor';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Trash2, Plus, Thermometer, Droplets, Wind, Lightbulb, TestTube, Zap, X, RotateCw } from 'lucide-react';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';

interface RightSidebarProps {
  selectedComponent: PlacedComponent | null;
  onUpdateComponent: (id: string, updates: Partial<PlacedComponent>) => void;
  onDeleteComponent: (id: string) => void;
  onAddSensor: (componentId: string, sensorType: SensorType) => void;
  onRemoveSensor: (componentId: string, sensorId: string) => void;
}

const sensorConfig = {
  temperature: { icon: Thermometer, label: 'Temperature', color: 'bg-red-100 text-red-700' },
  humidity: { icon: Droplets, label: 'Humidity', color: 'bg-blue-100 text-blue-700' },
  co2: { icon: Wind, label: 'CO2', color: 'bg-gray-100 text-gray-700' },
  light: { icon: Lightbulb, label: 'Light', color: 'bg-yellow-100 text-yellow-700' },
  ph: { icon: TestTube, label: 'pH', color: 'bg-purple-100 text-purple-700' },
  ec: { icon: Zap, label: 'EC', color: 'bg-orange-100 text-orange-700' },
};

export function RightSidebar({
  selectedComponent,
  onUpdateComponent,
  onDeleteComponent,
  onAddSensor,
  onRemoveSensor,
}: RightSidebarProps) {
  const [selectedSensorType, setSelectedSensorType] = useState<SensorType>('temperature');

  if (!selectedComponent) {
    return (
      <aside className="w-80 bg-white border-l border-neutral-200 p-6">
        <h2 className="mb-4 text-neutral-800">Properties</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-neutral-400 text-center">
            Select a component on the canvas to view and edit its properties
          </p>
        </div>
      </aside>
    );
  }

  const handleAddSensor = () => {
    onAddSensor(selectedComponent.id, selectedSensorType);
  };

  return (
    <aside className="w-80 bg-white border-l border-neutral-200 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-neutral-800">Properties</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDeleteComponent(selectedComponent.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={selectedComponent.name}
            onChange={(e) =>
              onUpdateComponent(selectedComponent.id, { name: e.target.value })
            }
            className="mt-1"
          />
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="width">Width (ft)</Label>
            <Input
              id="width"
              type="number"
              value={selectedComponent.width}
              onChange={(e) =>
                onUpdateComponent(selectedComponent.id, {
                  width: parseFloat(e.target.value) || 1,
                })
              }
              className="mt-1"
              min={1}
              max={100}
              step={0.5}
            />
          </div>
          
          <div>
            <Label htmlFor="height">Length (ft)</Label>
            <Input
              id="height"
              type="number"
              value={selectedComponent.height}
              onChange={(e) =>
                onUpdateComponent(selectedComponent.id, {
                  height: parseFloat(e.target.value) || 1,
                })
              }
              className="mt-1"
              min={1}
              max={100}
              step={0.5}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="x-pos">X Position (ft)</Label>
            <Input
              id="x-pos"
              type="number"
              value={selectedComponent.x.toFixed(1)}
              onChange={(e) =>
                onUpdateComponent(selectedComponent.id, {
                  x: parseFloat(e.target.value) || 0,
                })
              }
              className="mt-1"
              min={0}
              step={0.5}
            />
          </div>
          
          <div>
            <Label htmlFor="y-pos">Y Position (ft)</Label>
            <Input
              id="y-pos"
              type="number"
              value={selectedComponent.y.toFixed(1)}
              onChange={(e) =>
                onUpdateComponent(selectedComponent.id, {
                  y: parseFloat(e.target.value) || 0,
                })
              }
              className="mt-1"
              min={0}
              step={0.5}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RotateCw className="h-4 w-4 text-neutral-600" />
            <Label htmlFor="rotation">Rotation</Label>
          </div>
          <div className="flex gap-2">
            <Input
              id="rotation"
              type="number"
              value={selectedComponent.rotation || 0}
              onChange={(e) =>
                onUpdateComponent(selectedComponent.id, {
                  rotation: parseFloat(e.target.value) || 0,
                })
              }
              min={0}
              max={359}
              step={1}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateComponent(selectedComponent.id, { rotation: 0 })}
              title="Reset rotation"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateComponent(selectedComponent.id, { 
                rotation: ((selectedComponent.rotation || 0) - 90 + 360) % 360 
              })}
              className="text-xs"
            >
              -90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateComponent(selectedComponent.id, { 
                rotation: ((selectedComponent.rotation || 0) - 45 + 360) % 360 
              })}
              className="text-xs"
            >
              -45°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateComponent(selectedComponent.id, { 
                rotation: ((selectedComponent.rotation || 0) + 45) % 360 
              })}
              className="text-xs"
            >
              +45°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateComponent(selectedComponent.id, { 
                rotation: ((selectedComponent.rotation || 0) + 90) % 360 
              })}
              className="text-xs"
            >
              +90°
            </Button>
          </div>
        </div>
        
        {selectedComponent.capacity !== undefined && (
          <>
            <Separator />
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={selectedComponent.capacity}
                onChange={(e) =>
                  onUpdateComponent(selectedComponent.id, {
                    capacity: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-1"
                min={0}
              />
            </div>
          </>
        )}
        
        <Separator />
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Sensors ({selectedComponent.sensors.length})</Label>
          </div>
          
          <div className="space-y-2 mb-3">
            {selectedComponent.sensors.map((sensor) => {
              const config = sensorConfig[sensor.type];
              const Icon = config.icon;
              return (
                <div
                  key={sensor.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${config.color}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{sensor.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={sensor.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {sensor.status}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveSensor(selectedComponent.id, sensor.id)}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedSensorType} onValueChange={(value) => setSelectedSensorType(value as SensorType)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sensorConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button size="icon" onClick={handleAddSensor}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={selectedComponent.notes}
            onChange={(e) =>
              onUpdateComponent(selectedComponent.id, { notes: e.target.value })
            }
            className="mt-1"
            rows={4}
            placeholder="Add any additional notes or details..."
          />
        </div>
        
        <Separator />
        
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-neutral-600">
            <span className="block mb-1">Type: {selectedComponent.type}</span>
            <span className="block mb-1">Floor: {selectedComponent.floor}</span>
            <span className="block">ID: {selectedComponent.id}</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
